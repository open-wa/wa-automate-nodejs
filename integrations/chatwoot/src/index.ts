// Default export is the plugin itself (for config-driven loading)
export { default, default as chatwootPlugin } from './plugin.js';
export type { ChatwootPluginConfig } from './plugin.js';

// Named exports for direct usage
export { ChatwootClient } from './client.js';
export { createChatwootRouter } from './middleware.js';
export type { ChatwootConfig } from './config.js';
