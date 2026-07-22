import type { Logger } from '@open-wa/logger';
import {
  makeInMemoryObservability,
  queueMetricsObserver,
  ScopedTaskQueue,
  type RuntimeObservabilityShape,
} from '@open-wa/runtime-core';
import { Effect } from 'effect';
import type { WebhookConfig, WebhookPayload } from './config';
import {
  SqliteWebhookDeliveryStore,
  type StoredWebhookDelivery,
  type WebhookDeliveryStore,
} from './durable-store';

/**
 * Webhook Deliverer — uses native fetch instead of axios.
 * Supports exponential backoff retry on a bounded, scoped Effect queue.
 */
export class WebhookDeliverer {
  private readonly config: WebhookConfig;
  private readonly logger: Pick<Logger, 'debug' | 'warn' | 'error'>;
  private readonly queue: Promise<ScopedTaskQueue>;
  private readonly retries: number;
  private readonly retryDelay: number;
  private readonly timeout: number;
  private readonly store?: WebhookDeliveryStore;
  private readonly ready: Promise<void>;
  private readonly inFlight = new Set<string>();
  private readonly background = new Set<Promise<void>>();
  private readonly lifecycle = new AbortController();
  private readonly observability: RuntimeObservabilityShape;
  private closing = false;

  constructor(
    config: WebhookConfig,
    logger: Pick<Logger, 'debug' | 'warn' | 'error'>,
    observability: RuntimeObservabilityShape = makeInMemoryObservability(),
  ) {
    this.config = config;
    this.logger = logger;
    this.retries = config.retries ?? 3;
    this.retryDelay = config.retryDelay ?? 1000;
    this.timeout = config.timeout ?? 30_000;
    this.observability = observability;
    this.queue = ScopedTaskQueue.make({
      name: 'webhook.delivery',
      concurrency: config.concurrency ?? 10,
      capacity: config.queueCapacity ?? 1000,
      overload: config.overload ?? 'backpressure',
      observe: queueMetricsObserver(observability),
    });
    this.store = config.durability?.enabled
      ? new SqliteWebhookDeliveryStore(config.durability.path ?? '.openwa/webhook-deliveries.sqlite')
      : undefined;
    this.ready = this.replayPending();
  }

  async deliver(payload: WebhookPayload): Promise<void> {
    await this.ready;
    if (this.closing) throw new Error('Webhook deliverer is closed');
    const stored = this.store?.enqueue(payload);
    if (stored?.status === 'delivered' || (stored && this.inFlight.has(stored.id))) return;
    await this.schedule(payload, stored);
  }

  private async schedule(payload: WebhookPayload, stored?: StoredWebhookDelivery): Promise<void> {
    if (stored) this.inFlight.add(stored.id);
    try {
      await (await this.queue).submit(
        async () => {
          const delay = Math.max(0, (stored?.nextAttemptAt ?? 0) - Date.now());
          if (delay > 0) await this.sleep(delay);
          await this.sendWithRetry(payload, stored?.attempts ?? 0, stored?.id);
        },
        `${payload.webhookId}.${payload.event}`,
      );
    } finally {
      if (stored) this.inFlight.delete(stored.id);
    }
  }

  private async sendWithRetry(payload: WebhookPayload, attempt = 0, deliveryId?: string): Promise<void> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      const abortFromLifecycle = () => controller.abort(this.lifecycle.signal.reason);

      try {
        if (this.lifecycle.signal.aborted) abortFromLifecycle();
        else this.lifecycle.signal.addEventListener('abort', abortFromLifecycle, { once: true });
        const response = await fetch(this.config.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(deliveryId ? { 'Idempotency-Key': deliveryId } : {}),
            ...this.config.headers,
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        this.logger.debug(`Webhook delivered: ${payload.event} to ${this.config.url}`);
        if (deliveryId) this.store?.markDelivered(deliveryId);
      } finally {
        clearTimeout(timeoutId);
        this.lifecycle.signal.removeEventListener('abort', abortFromLifecycle);
      }
    } catch (error) {
      if (this.closing || this.lifecycle.signal.aborted) throw error;
      const errMessage = error instanceof Error ? error.message : String(error);

      if (attempt < this.retries) {
        const delay = this.retryDelay * Math.pow(2, attempt);
        this.logger.warn(
          `Webhook delivery failed (attempt ${attempt + 1}/${this.retries + 1}), retrying in ${delay}ms: ${errMessage}`
        );
        Effect.runSync(this.observability.increment('retry_decisions', 1, {
          component: 'webhook',
          attempt: attempt + 1,
        }));
        if (deliveryId) this.store?.markAttempt(deliveryId, errMessage, Date.now() + delay);
        await this.sleep(delay);
        return this.sendWithRetry(payload, attempt + 1, deliveryId);
      }

      this.logger.error(
        `Webhook delivery failed after ${this.retries + 1} attempts: ${errMessage}`
      );
      Effect.runSync(this.observability.increment('cause_failures', 1, {
        component: 'webhook',
      }));
      if (deliveryId) this.store?.markDeadLetter(deliveryId, errMessage);
      throw error;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const signal = this.lifecycle.signal;
      if (signal.aborted) {
        reject(signal.reason ?? new Error('Webhook deliverer closed'));
        return;
      }
      const onAbort = () => {
        clearTimeout(timer);
        reject(signal.reason ?? new Error('Webhook deliverer closed'));
      };
      const timer = setTimeout(() => {
        signal.removeEventListener('abort', onAbort);
        resolve();
      }, ms);
      signal.addEventListener('abort', onAbort, { once: true });
    });
  }

  async waitForIdle(): Promise<void> {
    await this.ready;
    await (await this.queue).waitForIdle();
  }

  async close(): Promise<void> {
    if (this.closing) return;
    this.closing = true;
    this.lifecycle.abort(new Error('Webhook deliverer closed'));
    await this.ready;
    await (await this.queue).close();
    await Promise.allSettled(this.background);
    this.store?.close();
  }

  async metrics(): Promise<Readonly<Record<string, number>>> {
    return Effect.runPromise(this.observability.snapshot);
  }

  private async replayPending(): Promise<void> {
    if (!this.store) return;
    await this.queue;
    if (this.closing) return;
    const pending = this.store.pending(this.config.durability?.replayLimit ?? 1000);
    for (const delivery of pending) {
      const replay = this.schedule(delivery.payload, delivery).catch((error) => {
        if (!this.closing) {
          this.logger.error(
            `Durable webhook replay failed: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      });
      this.background.add(replay);
      void replay.finally(() => this.background.delete(replay));
    }
  }
}
