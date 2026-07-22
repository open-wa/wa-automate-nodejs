// Default export is the plugin itself (for config-driven loading)
export { default, default as webhookPlugin } from './plugin.js';
export type { WebhookPluginConfig } from './plugin.js';

// Named exports for direct usage
export type { WebhookConfig, Webhook, WebhookPayload } from './config.js';
export { WebhookDeliverer } from './deliverer.js';
export { SqliteWebhookDeliveryStore } from './durable-store.js';
export type { StoredWebhookDelivery, WebhookDeliveryStore } from './durable-store.js';
export {
  WebhookDelivererService,
  webhookDelivererLayer,
  webhookDelivererTestLayer,
} from './service.js';
