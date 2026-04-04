// Default export is the plugin itself (for config-driven loading)
export { default, default as webhookPlugin } from './plugin.js';
export type { WebhookPluginConfig } from './plugin.js';

// Named exports for direct usage
export type { WebhookConfig, Webhook, WebhookPayload } from './config.js';
export { WebhookDeliverer } from './deliverer.js';
