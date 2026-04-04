import PQueue from 'p-queue';
import type { Logger } from '@open-wa/logger';
import type { WebhookConfig, WebhookPayload } from './config.js';

/**
 * Webhook Deliverer — uses native fetch instead of axios.
 * Supports exponential backoff retry and concurrent delivery via PQueue.
 */
export class WebhookDeliverer {
  private readonly config: WebhookConfig;
  private readonly logger: Logger;
  private readonly queue: PQueue;
  private readonly retries: number;
  private readonly retryDelay: number;
  private readonly timeout: number;

  constructor(config: WebhookConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
    this.retries = config.retries ?? 3;
    this.retryDelay = config.retryDelay ?? 1000;
    this.timeout = config.timeout ?? 30_000;
    this.queue = new PQueue({
      concurrency: config.concurrency ?? 10,
    });
  }

  async deliver(payload: WebhookPayload): Promise<void> {
    await this.queue.add(() => this.sendWithRetry(payload));
  }

  private async sendWithRetry(payload: WebhookPayload, attempt = 0): Promise<void> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      try {
        const response = await fetch(this.config.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...this.config.headers,
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        this.logger.debug(`Webhook delivered: ${payload.event} to ${this.config.url}`);
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      const errMessage = error instanceof Error ? error.message : String(error);

      if (attempt < this.retries) {
        const delay = this.retryDelay * Math.pow(2, attempt);
        this.logger.warn(
          `Webhook delivery failed (attempt ${attempt + 1}/${this.retries + 1}), retrying in ${delay}ms: ${errMessage}`
        );
        await this.sleep(delay);
        return this.sendWithRetry(payload, attempt + 1);
      }

      this.logger.error(
        `Webhook delivery failed after ${this.retries + 1} attempts: ${errMessage}`
      );
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async waitForIdle(): Promise<void> {
    await this.queue.onIdle();
  }
}
