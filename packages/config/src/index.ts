/**
 * @open-wa/config
 *
 * Configuration management for open-wa - schemas, loading, merging, and validation.
 *
 * @example
 * // In wa.config.ts
 * import { defineConfig } from '@open-wa/config';
 *
 * export default defineConfig({
 *   sessionId: 'my-session',
 *   port: 8080,
 *   headless: true,
 * });
 *
 * @example
 * // In your application
 * import { resolveConfig } from '@open-wa/config';
 *
 * const { config, sources } = await resolveConfig({
 *   cliOverrides: { debug: true },
 * });
 *
 * console.log(`Config loaded from: ${sources.join(', ')}`);
 * console.log(`Port: ${config.port}`);
 */

// Schema exports
export {
  // Enums
  QRFormat,
  CLOUD_PROVIDERS,
  DIRECTORY_STRATEGY,
  NotificationLanguage,
  OnError,
  LicenseType,
  // Sub-schemas
  SessionDataSchema,
  DevToolsSchema,
  ProxyServerCredentialsSchema,
  CloudUploadOptionsSchema,
  ViewportSchema,
  S3SyncSchema,
  LoggingTransportSchema,
  // Main schema
  ConfigSchema,
  PartialConfigSchema,
  StrictConfigSchema,
  // Types
  type Config,
  type PartialConfig,
  type DeepPartialConfig,
  type StrictConfig,
  type SessionData,
  type DevTools,
  type ProxyServerCredentials,
  type CloudUploadOptions,
  type Viewport,
  type S3Sync,
  type LoggingTransport,
  // Validation helpers
  validateConfig,
  parseConfig,
  getDefaultConfig,
} from './schema';

// defineConfig helper
export { defineConfig, resolveConfigInput, type ConfigInput } from './define-config';

// Config file loader
export {
  loadConfigFile,
  loadConfigFileSync,
  clearConfigCache,
  type LoadedConfig,
  type LoadConfigFileOptions,
} from './loader';

// Environment variable loader
export { loadFromEnv, getConfigEnvVars, type LoadEnvOptions } from './env';

// Config merger
export {
  resolveConfig,
  resolveConfigSync,
  mergeConfigs,
  validatePartialConfig,
  ConfigSource,
  type TrackedConfig,
  type ResolveConfigOptions,
} from './merge';

// Re-export zod for consumers who want to extend schemas
export { z } from 'zod';
