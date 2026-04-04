/**
 * @open-wa/core — Plugin System
 *
 * Re-exports the plugin SDK types for internal consumers,
 * plus core-only infrastructure (EventGateway, PluginLoader, PluginHost).
 */

// Re-export SDK types for backward compatibility
export type {
  Plugin,
  PluginMeta,
  PluginInput,
  Hooks,
  PluginClient,
  PluginEventEmitter,
  PluginLogger,
  DashboardPage,
  ToolDefinition,
  ToolContext,
  PluginManifest,
  PluginManifestEntry,
} from '@open-wa/plugin-sdk';

// Core-only exports
export { PluginHost } from './PluginHost.js';
export { createEventGateway, getPublicEvents } from './EventGateway.js';
export { loadPlugins, validatePluginConfig, type LoadedPlugin } from './PluginLoader.js';
