/**
 * @open-wa/plugin-sdk
 *
 * The official SDK for building open-wa plugins.
 *
 * @example Quick Start
 * ```ts
 * import { createPlugin } from '@open-wa/plugin-sdk';
 *
 * export default createPlugin({
 *   meta: { name: 'my-plugin', version: '1.0.0' },
 *   init: async ({ client, logger, events }) => ({
 *     'message.received': async ({ message }) => {
 *       logger.info('Got a message!', { message });
 *     },
 *   }),
 * });
 * ```
 *
 * @packageDocumentation
 */

// Factory
export { createPlugin, type CreatePluginOptions } from './createPlugin.js';

// Config helpers
export { defineConfig, z } from './defineConfig.js';

// Types
export type {
  // Core plugin types
  Plugin,
  PluginMeta,
  PluginInput,
  Hooks,

  // Client interface
  PluginClient,

  // Events & Logger
  PluginEventEmitter,
  PluginLogger,

  // Dashboard
  DashboardPage,

  // Tools
  ToolDefinition,
  ToolContext,

  // Manifest (consumed by dashboard)
  PluginManifest,
  PluginManifestEntry,
} from './types.js';
