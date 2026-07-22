import { Effect, Exit, Fiber, Scope } from 'effect';
import type { RuntimeObservabilityShape } from './services';

export type SessionFinalizerReason =
  | 'auth-timeout'
  | 'browser-crash'
  | 'failure'
  | 'interruption'
  | 'normal-stop'
  | 'plugin-failure'
  | 'signal'
  | 'startup-failure';

export class SessionScope {
  private readonly finalizerNames = new Set<string>();
  private closed = false;
  private activeFibers = 0;

  private constructor(
    private readonly scope: Scope.Closeable,
    private readonly observability?: RuntimeObservabilityShape,
    private readonly metricAttributes: Readonly<Record<string, string | number | boolean>> = {},
  ) {}

  static async make(options: {
    readonly observability?: RuntimeObservabilityShape;
    readonly metricAttributes?: Readonly<Record<string, string | number | boolean>>;
  } = {}): Promise<SessionScope> {
    return new SessionScope(
      await Effect.runPromise(Scope.make()),
      options.observability,
      options.metricAttributes,
    );
  }

  async addFinalizer(
    name: string,
    finalizer: () => void | Promise<void>,
  ): Promise<() => void> {
    if (this.closed) throw new Error('session scope is already closed');
    this.finalizerNames.add(name);
    let active = true;
    await Effect.runPromise(
      Scope.addFinalizer(
        this.scope,
        Effect.promise(async () => {
          if (!active) return;
          active = false;
          this.finalizerNames.delete(name);
          await finalizer();
        }),
      ),
    );
    return () => {
      active = false;
      this.finalizerNames.delete(name);
    };
  }

  snapshot() {
    return {
      closed: this.closed,
      finalizers: [...this.finalizerNames],
    } as const;
  }

  async fork<A, E>(effect: Effect.Effect<A, E>): Promise<void> {
    if (this.closed) throw new Error('session scope is already closed');
    const fiber = await Effect.runPromise(Effect.forkIn(effect, this.scope));
    this.activeFibers += 1;
    this.publishActiveFibers();
    void Effect.runPromise(Fiber.await(fiber)).finally(() => {
      this.activeFibers = Math.max(0, this.activeFibers - 1);
      this.publishActiveFibers();
    });
  }

  async close(reason: SessionFinalizerReason = 'normal-stop'): Promise<void> {
    if (this.closed) return;
    this.closed = true;
    await Effect.runPromise(
      Scope.close(
        this.scope,
        reason === 'normal-stop'
          ? Exit.void
          : Exit.fail(new Error(`session scope closed: ${reason}`)),
      ),
    );
  }

  private publishActiveFibers(): void {
    if (!this.observability) return;
    Effect.runSync(this.observability.gauge(
      'active_fibers',
      this.activeFibers,
      { owner: 'session-scope', ...this.metricAttributes },
    ));
  }
}
