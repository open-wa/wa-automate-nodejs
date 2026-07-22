// Default export is the plugin itself (for config-driven loading)
export { default, default as chatwootPlugin } from './plugin';
export type { ChatwootPluginConfig } from './plugin';

// Named exports for direct usage
export { ChatwootClient } from './client';
export { createChatwootRouter } from './middleware';
export type { ChatwootConfig } from './config';
export {
  ChatwootClientService,
  chatwootClientLayer,
  chatwootClientTestLayer,
} from './service';
