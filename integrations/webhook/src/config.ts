import type { AxiosRequestConfig } from 'axios';

export interface WebhookConfig {
  url: string;
  events?: string[] | 'all';
  concurrency?: number;
  requestConfig?: AxiosRequestConfig;
  retries?: number;
  retryDelay?: number;
}

export interface Webhook {
  id: string;
  url: string;
  events: string[];
  requestConfig?: AxiosRequestConfig;
  createdAt: number;
}

export interface WebhookPayload {
  webhookId: string;
  sessionId: string;
  event: string;
  payload: unknown;
  timestamp: number;
}
