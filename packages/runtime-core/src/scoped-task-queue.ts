import { Cause, Effect, Exit, Queue, Scope } from 'effect';
import {
  QueueClosedError,
  QueueOverloadedError,
  TaskExecutionError,
  TaskTimeoutError,
} from './errors.js';

export type QueueOverloadStrategy = 'backpressure' | 'dropping';

export interface QueueRateLimit {
  readonly limit: number;
  readonly intervalMs: number;
}

export interface TaskQueuePolicy {
  readonly name: string;
  readonly capacity: number;
  readonly concurrency: number;
  readonly overload: QueueOverloadStrategy;
  readonly ordering: 'fifo';
  readonly timeoutMs?: number;
  readonly rate?: QueueRateLimit;
  readonly observe?: (metrics: TaskQueueMetrics) => void;
}

export interface TaskQueueMetrics {
  readonly name: string;
  readonly capacity: number;
  readonly depth: number;
  readonly active: number;
  readonly completed: number;
  readonly failed: number;
  readonly dropped: number;
  readonly rateLimited: number;
  readonly closed: boolean;
}

interface QueuedTask {
  readonly operation: () => Promise<unknown>;
  readonly resolve: (value: unknown) => void;
  readonly reject: (error: unknown) => void;
  readonly enqueuedAt: number;
  readonly label?: string;
}

export class ScopedTaskQueue {
  private readonly activeTasks = new Set<QueuedTask>();
  private readonly metricsState: {
    depth: number;
    active: number;
    completed: number;
    failed: number;
    dropped: number;
    rateLimited: number;
    closed: boolean;
  } = {
    depth: 0,
    active: 0,
    completed: 0,
    failed: 0,
    dropped: 0,
    rateLimited: 0,
    closed: false,
  };

  private rateWindowStartedAt = Date.now();
  private rateWindowCount = 0;

  private constructor(
    readonly policy: TaskQueuePolicy,
    private readonly queue: Queue.Queue<QueuedTask>,
    private readonly scope: Scope.Closeable,
  ) {}

  static async make(
    policy: Omit<TaskQueuePolicy, 'ordering'> & { readonly ordering?: 'fifo' },
  ): Promise<ScopedTaskQueue> {
    if (!Number.isInteger(policy.capacity) || policy.capacity < 1) {
      throw new RangeError('queue capacity must be a positive integer');
    }
    if (!Number.isInteger(policy.concurrency) || policy.concurrency < 1) {
      throw new RangeError('queue concurrency must be a positive integer');
    }
    if (
      policy.rate &&
      (!Number.isInteger(policy.rate.limit) ||
        policy.rate.limit < 1 ||
        !Number.isFinite(policy.rate.intervalMs) ||
        policy.rate.intervalMs <= 0)
    ) {
      throw new RangeError('queue rate limit and interval must be positive');
    }

    const normalized: TaskQueuePolicy = { ...policy, ordering: 'fifo' };
    const scope = await Effect.runPromise(Scope.make());
    const queue = await Effect.runPromise(
      normalized.overload === 'dropping'
        ? Queue.dropping<QueuedTask>(normalized.capacity)
        : Queue.bounded<QueuedTask>(normalized.capacity),
    );
    const taskQueue = new ScopedTaskQueue(normalized, queue, scope);

    for (let index = 0; index < normalized.concurrency; index += 1) {
      await Effect.runPromise(
        Effect.forkIn(taskQueue.worker(index), scope),
      );
    }

    return taskQueue;
  }

  submit<A>(operation: () => Promise<A> | A, label?: string): Promise<A> {
    if (this.metricsState.closed) {
      return Promise.reject(new QueueClosedError({ queue: this.policy.name }));
    }

    return new Promise<A>((resolve, reject) => {
      const task: QueuedTask = {
        operation: async () => operation(),
        resolve: (value) => resolve(value as A),
        reject,
        enqueuedAt: Date.now(),
        label,
      };

      this.metricsState.depth += 1;
      this.notifyObserver();
      void Effect.runPromise(Queue.offer(this.queue, task))
        .then((accepted) => {
          if (!accepted) {
            this.metricsState.depth = Math.max(0, this.metricsState.depth - 1);
            this.metricsState.dropped += 1;
            this.notifyObserver();
            reject(
              new QueueOverloadedError({
                queue: this.policy.name,
                capacity: this.policy.capacity,
              }),
            );
            return;
          }
        })
        .catch((error) => {
          this.metricsState.depth = Math.max(0, this.metricsState.depth - 1);
          this.notifyObserver();
          reject(
            this.metricsState.closed
              ? new QueueClosedError({ queue: this.policy.name })
              : error,
          );
        });
    });
  }

  metrics(): TaskQueueMetrics {
    return {
      name: this.policy.name,
      capacity: this.policy.capacity,
      ...this.metricsState,
    };
  }

  async close(): Promise<void> {
    if (this.metricsState.closed) return;
    this.metricsState.closed = true;
    this.notifyObserver();

    while (true) {
      const result = Queue.takeUnsafe(this.queue);
      if (result === undefined) break;
      if (Exit.isFailure(result)) continue;
      this.metricsState.depth = Math.max(0, this.metricsState.depth - 1);
      result.value.reject(new QueueClosedError({ queue: this.policy.name }));
      this.notifyObserver();
    }

    for (const task of this.activeTasks) {
      task.reject(new QueueClosedError({ queue: this.policy.name }));
    }
    this.activeTasks.clear();
    this.metricsState.active = 0;
    this.notifyObserver();

    await Effect.runPromise(Queue.shutdown(this.queue));
    await Effect.runPromise(Scope.close(this.scope, Exit.void));
  }

  async waitForIdle(): Promise<void> {
    while (this.metricsState.depth > 0 || this.metricsState.active > 0) {
      await Effect.runPromise(Effect.sleep(5));
    }
  }

  private worker(index: number) {
    const self = this;
    return Effect.gen(function* () {
      while (true) {
        const task = yield* Queue.take(self.queue);
        self.metricsState.depth = Math.max(0, self.metricsState.depth - 1);
        yield* self.reserveRatePermit();
        self.activeTasks.add(task);
        self.metricsState.active += 1;
        self.notifyObserver();

        let execution: Effect.Effect<
          unknown,
          TaskExecutionError | TaskTimeoutError
        > = Effect.tryPromise({
          try: task.operation,
          catch: (cause) =>
            new TaskExecutionError({ queue: self.policy.name, cause }),
        });

        if (self.policy.timeoutMs !== undefined) {
          execution = execution.pipe(
            Effect.timeoutOrElse({
              duration: self.policy.timeoutMs,
              orElse: () =>
                Effect.fail(
                  new TaskTimeoutError({
                    queue: self.policy.name,
                    timeoutMs: self.policy.timeoutMs!,
                  }),
                ),
            }),
          );
        }

        const result = yield* Effect.exit(
          execution.pipe(
            Effect.withSpan(`openwa.queue.${self.policy.name}`, {
              attributes: {
                'queue.name': self.policy.name,
                'queue.worker': index,
                'queue.wait_ms': Date.now() - task.enqueuedAt,
                ...(task.label ? { 'task.label': task.label } : {}),
              },
            }),
          ),
        );

        self.activeTasks.delete(task);
        self.metricsState.active = Math.max(0, self.metricsState.active - 1);
        if (Exit.isSuccess(result)) {
          self.metricsState.completed += 1;
          task.resolve(result.value);
        } else {
          self.metricsState.failed += 1;
          task.reject(Cause.squash(result.cause));
        }
        self.notifyObserver();

      }
    }).pipe(Effect.withSpan(`openwa.queue.worker.${self.policy.name}`));
  }

  private reserveRatePermit(): Effect.Effect<void> {
    const rate = this.policy.rate;
    if (!rate) return Effect.void;

    const self = this;
    return Effect.suspend(() => {
      const now = Date.now();
      const elapsed = now - self.rateWindowStartedAt;

      if (elapsed >= rate.intervalMs) {
        self.rateWindowStartedAt = now;
        self.rateWindowCount = 0;
      }

      if (self.rateWindowCount < rate.limit) {
        self.rateWindowCount += 1;
        return Effect.void;
      }

      self.metricsState.rateLimited += 1;
      self.notifyObserver();
      return Effect.sleep(Math.max(1, rate.intervalMs - elapsed)).pipe(
        Effect.andThen(self.reserveRatePermit()),
      );
    });
  }

  private notifyObserver(): void {
    try {
      this.policy.observe?.(this.metrics());
    } catch {
      // Metrics must never change queue delivery semantics.
    }
  }
}
