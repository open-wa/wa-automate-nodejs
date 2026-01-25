/**
 * Configuration schema and types - re-exported from @open-wa/config
 * 
 * This file provides backward compatibility for code that imports from @open-wa/schema.
 * New code should import directly from @open-wa/config.
 * 
 * @deprecated Import from '@open-wa/config' instead
 */

// Re-export everything from @open-wa/config
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
} from '@open-wa/config';
