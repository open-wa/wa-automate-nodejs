import axios, { type AxiosRequestConfig } from 'axios';
import PQueue from 'p-queue';
import type { Logger } from '@open-wa/logger';
import type { WebhookConfig, WebhookPayload } from './config.js';

export class WebhookDeliverer {
  private readonly config: WebhookConfig;
  private readonly logger: Logger;
  private readonly queue: PQueue;
  private readonly retries: number;
  private readonly retryDelay: number;

  constructor(config: WebhookConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
    this.retries = config.retries ?? 3;
    this.retryDelay = config.retryDelay ?? 1000;
    this.queue = new PQueue({
      concurrency: config.concurrency ?? 10,
    });
  }

  async deliver(payload: WebhookPayload): Promise<void> {
    await this.queue.add(() => this.sendWithRetry(payload));
  }

  private async sendWithRetry(payload: WebhookPayload, attempt = 0): Promise<void> {
    try {
      const requestConfig: AxiosRequestConfig = {
        ...this.config.requestConfig,
        method: 'POST',
        url: this.config.url,
        data: payload,
        headers: {
          'Content-Type': 'application/json',
          ...this.config.requestConfig?.headers,
        },
      };

      await axios(requestConfig);
      this.logger.debug(`Webhook delivered: ${payload.event} to ${this.config.url}`);
    } catch (error) {
      const axiosError = error as { response?: { status: number }; message: string };
      
      if (attempt < this.retries) {
        const delay = this.retryDelay * Math.pow(2, attempt);
        this.logger.warn(
          `Webhook delivery failed (attempt ${attempt + 1}/${this.retries + 1}), retrying in ${delay}ms: ${axiosError.message}`
        );
        await this.sleep(delay);
        return this.sendWithRetry(payload, attempt + 1);
      }

      this.logger.error(
        `Webhook delivery failed after ${this.retries + 1} attempts: ${axiosError.message}`
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
