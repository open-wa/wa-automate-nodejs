/**
 * Webhook configuration types.
 * No longer depends on AxiosRequestConfig — uses native fetch options.
 */

export interface WebhookConfig {
  /** Target URL for webhook delivery */
  url: string;

  /** Which events to forward. 'all' or an array of event names. */
  events?: string[] | 'all';

  /** Max concurrent deliveries (default: 10) */
  concurrency?: number;

  /** Number of retry attempts (default: 3) */
  retries?: number;

  /** Base retry delay in ms, exponentially backed off (default: 1000) */
  retryDelay?: number;

  /** Additional headers to send with each webhook request */
  headers?: Record<string, string>;

  /** Request timeout in ms (default: 30000) */
  timeout?: number;
}

export interface Webhook {
  id: string;
  url: string;
  events: string[];
  headers?: Record<string, string>;
  createdAt: number;
}

export interface WebhookPayload {
  webhookId: string;
  sessionId: string;
  event: string;
  payload: unknown;
  timestamp: number;
}
