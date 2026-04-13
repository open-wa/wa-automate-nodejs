/**
 * @open-wa/config - Zod Schemas for open-wa configuration
 *
 * This module contains all Zod schema definitions for configuration objects.
 * Schemas are the single source of truth for both TypeScript types and runtime validation.
 */
import { z } from 'zod';

// ============================================================================
// Enums
// ============================================================================

export enum QRFormat {
  PNG = 'png',
  JPEG = 'jpeg',
  WEBM = 'webm',
}

export enum CLOUD_PROVIDERS {
  GCP = 'GCP',
  WASABI = 'WASABI',
  AWS = 'AWS',
  CONTABO = 'CONTABO',
  DO = 'DO',
  MINIO = 'MINIO',
}

export enum DIRECTORY_STRATEGY {
  DATE = 'DATE',
  CHAT = 'CHAT',
  CHAT_DATE = 'CHAT_DATE',
  DATE_CHAT = 'DATE_CHAT',
}

export enum NotificationLanguage {
  PTBR = 'pt-br',
  ENGB = 'en-gb',
  DEDE = 'de-de',
  IDID = 'id-id',
  ITIT = 'it-it',
  NLNL = 'nl-nl',
  ES = 'es',
}

export enum OnError {
  AS_STRING = 'AS_STRING',
  RETURN_FALSE = 'RETURN_FALSE',
  THROW = 'THROW',
  LOG_AND_FALSE = 'LOG_AND_FALSE',
  LOG_AND_STRING = 'LOG_AND_STRING',
  RETURN_ERROR = 'RETURN_ERROR',
  NOTHING = 'NOTHING',
}

export enum LicenseType {
  CUSTOM = 'CUSTOM',
  B2B_RESTRICTED_VOLUME_LICENSE = 'B2B_RESTRICTED_VOLUME_LICENSE',
  INSIDER = 'Insiders Program',
  TEXT_STORY = 'Text Story License Key',
  IMAGE_STORY = 'Image Story License Key',
  VIDEO_STORY = 'Video Story License Key',
  PREMIUM = 'Premium License Key',
  NONE = 'NONE',
}

// ============================================================================
// Sub-schemas (reusable building blocks)
// ============================================================================

export const SessionDataSchema = z
  .object({
    WABrowserId: z.string().optional(),
    WASecretBundle: z.string().optional(),
    WAToken1: z.string().optional(),
    WAToken2: z.string().optional(),
  })
  .passthrough();

export const DevToolsSchema = z.object({
  user: z.string().describe('Username for devtools'),
  pass: z.string().describe('Password for devtools'),
});

export const ProxyServerCredentialsSchema = z.object({
  protocol: z
    .string()
    .optional()
    .describe(
      'The protocol on which the proxy is running. E.g `http`, `https`, `socks4` or `socks5`'
    ),
  address: z
    .string()
    .describe("Proxy Server address. This can include the port e.g '127.0.0.1:5005'"),
  username: z.string().describe('Username for Proxy Server authentication'),
  password: z.string().describe('Password for Proxy Server authentication'),
});

export const CloudUploadOptionsSchema = z.object({
  provider: z.nativeEnum(CLOUD_PROVIDERS),
  accessKeyId: z.string(),
  secretAccessKey: z.string(),
  bucket: z.string(),
  region: z.string().optional(),
  ignoreHostAccount: z.boolean().optional(),
  directory: z.union([z.nativeEnum(DIRECTORY_STRATEGY), z.string()]).optional(),
  public: z.boolean().optional(),
  headers: z.record(z.string(), z.string()).optional(),
});

export const ViewportSchema = z.object({
  width: z.number().default(1440).describe('Page width in pixels'),
  height: z.number().default(900).describe('Page height in pixels'),
});

export const LightpandaOptionsSchema = z.object({
  executablePath: z.string().optional().describe('Override path to Lightpanda binary.'),
  portStart: z
    .number()
    .int()
    .min(1024)
    .max(65535)
    .default(9000)
    .describe('First Lightpanda port to try.'),
  host: z.string().default('127.0.0.1').describe('Lightpanda bind address.'),
  startupTimeoutMs: z
    .number()
    .int()
    .positive()
    .default(30000)
    .describe('How long to wait for Lightpanda readiness.'),
  disableTelemetry: z
    .boolean()
    .default(false)
    .describe('Disable Lightpanda telemetry for deterministic startup.'),
});

export const S3SyncSchema = z.object({
  bucket: z.string().describe('S3 bucket name'),
  region: z.string().describe('S3 region'),
  accessKeyId: z.string().describe('AWS access key ID'),
  secretAccessKey: z.string().describe('AWS secret access key'),
  endpoint: z.string().optional().describe('Custom S3 endpoint'),
  host: z.string().optional().describe('PicoS3 support'),
  syncInterval: z.number().default(600000).describe('Sync interval in ms'),
  enableLocalCompression: z.boolean().optional().describe('Enable local session compression'),
});

export const LoggingTransportSchema = z.object({
  type: z.enum(['console', 'file', 'syslog', 'elasticsearch']).describe('Transport type'),
  level: z.enum(['error', 'warn', 'info', 'debug', 'verbose']).optional(),
  filename: z.string().optional().describe('For file transport'),
  host: z.string().optional().describe('For syslog/elasticsearch'),
  port: z.number().optional().describe('For syslog/elasticsearch'),
});

export const McpConfigSchema = z.object({
  enabled: z
    .boolean()
    .default(false)
    .describe('Enable the hosted MCP endpoint for Easy API. Requires apiKey.'),
  path: z
    .string()
    .default('/mcp')
    .describe('Hosted MCP endpoint path for Easy API.'),
  exposeToolsMeta: z
    .boolean()
    .default(true)
    .describe('Expose /meta/mcp-tools.json for dashboard and debugging.'),
});

// ============================================================================
// Main Configuration Schema
// ============================================================================

export const ConfigSchema = z.object({
  // Session & Authentication
  sessionData: z
    .union([SessionDataSchema, z.string()])
    .optional()
    .describe(
      'Deprecated compatibility input for JSON or base64 session restore. This MD-obsolete flow remains only for legacy migration. Prefer userDataDir for persistent auth state.'
    ),

  linkCode: z.string().optional().describe('Link code for new login method.'),

  sessionId: z.string().default('session').describe('Name of the session. Must be unique.'),

  sessionDataPath: z
    .string()
    .default('')
    .describe(
      'Deprecated legacy path for .data.json session restore files. This only exists for MD-obsolete JSON session compatibility. Prefer userDataDir.'
    ),

  userDataDir: z
    .string()
    .optional()
    .describe('Browser profile directory used for persistent session storage.'),

  ephemeral: z
    .boolean()
    .default(false)
    .describe(
      'When true, prevents auto-derivation of userDataDir from sessionId. The browser launches with an ephemeral temp profile that is discarded on exit. Useful for testing without leaving _IGNORE_ directories behind.'
    ),

  skipSessionSave: z
    .boolean()
    .default(false)
    .describe(
      'Deprecated legacy flag for .data.json session persistence. This only affects the MD-obsolete JSON restore path. Prefer userDataDir-managed persistence.'
    ),

  licenseKey: z
    .union([z.string(), z.record(z.string(), z.string()), z.function()])
    .optional()
    .describe('License key for unknown number messaging.'),

  // Browser Configuration
  browserWSEndpoint: z
    .string()
    .optional()
    .describe('Connect to existing chrome window (Experimental).'),

  useStealth: z.boolean().default(false).describe('Enable/disable puppeteer stealth plugin.'),

  bypassCSP: z.boolean().default(false).describe('Disable cors (bypass pagesetbypasscspenabled).'),

  chromiumArgs: z.array(z.string()).optional().describe('Custom chrome/chromium argument strings.'),

  browserRevision: z
    .string()
    .optional()
    .describe('Specific browser revision to download and use.'),

  executablePath: z.string().optional().describe('Path to chrome instance.'),

  useChrome: z.boolean().default(false).describe('Automatically detect chrome instance.'),

  useLightpanda: z.boolean().default(false).describe('Enable Lightpanda local browser mode.'),

  lightpanda: LightpandaOptionsSchema.optional().describe('Lightpanda local mode configuration.'),

  headless: z.boolean().default(true).describe('Run browser in headless mode.'),

  resizable: z.boolean().default(true).describe('Sync viewport size with window size.'),

  viewport: ViewportSchema.optional(),

  proxyServerCredentials: ProxyServerCredentialsSchema.optional().describe(
    'Proxy server credentials.'
  ),

  useNativeProxy: z.boolean().default(false).describe('Use native proxy system.'),

  corsFix: z.boolean().default(false).describe('Bypass web security to fix CORS issues.'),

  raspi: z.boolean().default(false).describe('Enable Raspberry Pi OS support.'),

  // QR Code Configuration
  qrTimeout: z
    .number()
    .default(60)
    .describe('Wait time for QR scan before killing process. 0 to wait forever.'),

  qrLogSkip: z.boolean().default(false).describe('Skip logging QR Code to console.'),

  qrQuality: z.number().default(1.0).describe('QR code output quality (0.1 - 1.0).'),

  qrFormat: z.nativeEnum(QRFormat).default(QRFormat.PNG).describe('QR code output format.'),

  qrPopUpOnly: z
    .boolean()
    .optional()
    .describe(
      'Downgraded legacy QR convenience flag. v5 may still expose QR PNG output, but popup and local QR parity is not a guaranteed runtime contract.'
    ),

  qrMax: z.number().optional().describe('Automatically kill the process after a set amount of qr codes.'),

  ezqr: z.boolean().default(true).describe('Enable easy QR code endpoint.'),

  // Authentication & Timeouts
  authTimeout: z.number().default(60).describe('Wait time for session authentication.'),

  oorTimeout: z.number().default(60).describe('Phone out of reach check timeout.'),

  waitForRipeSessionTimeout: z
    .number()
    .default(5)
    .describe('Wait time for session to load fully. 0 to wait forever.'),

  callTimeout: z.number().default(0).describe('Wait time for client method resolution.'),

  // Popup & UI
  popup: z
    .union([z.boolean(), z.number()])
    .default(false)
    .describe(
      'Downgraded legacy compatibility option. Opens a local browser window for status or manual inspection, but v5 does not guarantee legacy popup QR parity.'
    ),

  // Logging & Debugging
  logConsole: z.boolean().default(false).describe('Log console messages from browser.'),

  logConsoleErrors: z.boolean().default(false).describe('Log error messages from browser.'),

  logFile: z.boolean().default(false).describe('Create log file for all actions.'),

  logDebugInfoAsObject: z
    .boolean()
    .default(false)
    .describe('Log debug info as object instead of console.table.'),

  logInternalEvents: z.boolean().optional().describe('Log all internal wa web events.'),

  logLevel: z.string().optional().describe('Logging level (VERBOSE, INFO, ERROR, SILENT).'),

  logging: z.array(LoggingTransportSchema).optional().describe('Winston logging transport configurations.'),

  disableSpins: z.boolean().default(false).describe('Disable spins in logs (for docker).'),

  devtools: z.union([z.boolean(), DevToolsSchema]).optional().describe('Enable remote devtools.'),

  // Process Behavior
  killProcessOnBrowserClose: z.boolean().default(false).describe('Kill process when browser closes.'),

  killProcessOnTimeout: z.boolean().default(false).describe('Kill process on auth/qr timeout.'),

  killProcessOnBan: z.boolean().default(true).describe('Kill process when temporary ban detected.'),

  killClientOnLogout: z.boolean().default(false).describe('Kill client when logout detected.'),

  restartOnCrash: z.any().optional().describe('Function to call upon restart if page crashes.'),

  // Safety & Error Handling
  safeMode: z.boolean().default(false).describe('Check if page is valid before each command.'),

  onError: z.nativeEnum(OnError).default(OnError.NOTHING).describe('Error handling strategy.'),

  throwErrorOnTosBlock: z.boolean().optional().describe('Throw error if session blocked or unable to get QR.'),

  throwOnExpiredSessionData: z.boolean().default(false).describe('Return false if session data expired.'),

  // Features & Behavior
  skipBrokenMethodsCheck: z.boolean().default(false).describe('Bypass health check before startup.'),

  skipUpdateCheck: z.boolean().default(false).describe('Bypass latest version check.'),

  customUserAgent: z.string().optional().describe('Custom user agent.'),

  blockCrashLogs: z.boolean().default(true).describe('Block network calls to crash log servers.'),

  blockAssets: z.boolean().default(false).describe('Block all assets from loading.'),

  cacheEnabled: z.boolean().default(false).describe('Enable/disable cache.'),

  hostNotificationLang: z.nativeEnum(NotificationLanguage).optional().describe('Language of host notification.'),

  autoRefresh: z.boolean().default(true).describe('Automatically refresh QR codes (Deprecated).'),

  qrRefreshS: z.number().optional().describe('QR refresh interval (Deprecated).'),

  legacy: z.boolean().default(false).describe('Roll back on late beta features.'),

  deleteSessionDataOnLogout: z.boolean().default(false).describe('Delete session data file on logout.'),

  eventMode: z.boolean().default(true).describe('Automatically register SimpleListener events.'),

  idCorrection: z.boolean().default(false).describe('Attempt to correct invalid chatIds.'),

  ignoreNuke: z.boolean().optional().describe("Don't implicitly determine if the host logged out."),

  ensureHeadfulIntegrity: z.boolean().optional().describe('Makes sure the headless session is usable even on first login.'),

  waitForRipeSession: z.boolean().default(true).describe('Wait for a valid headful session.'),

  keepUpdated: z.boolean().default(false).describe('Always start with latest version (Alpha).'),

  ghPatch: z.boolean().default(false).describe('Use default cached raw github link for patches.'),

  cachedPatch: z.boolean().default(false).describe('Save local copy of patches.json.'),

  screenshotOnInitializationBrowserError: z.boolean().default(false).describe('Screenshot on unexpected initialization error.'),

  inDocker: z.boolean().default(false).describe('Try to infer config from environment variables.'),

  aggressiveGarbageCollection: z.boolean().optional().describe('Run gc() before every command sent to the browser.'),

  // Stickers & Messaging
  stickerServerEndpoint: z
    .union([z.string(), z.boolean()])
    .default('https://sticker-api.openwa.dev')
    .describe('Sticker server endpoint.'),

  autoEmoji: z.union([z.string(), z.literal(false)]).default(':').describe('Automatic emoji detection character.'),

  linkParser: z.string().default('https://link.openwa.cloud/api').describe('URL of serverless meta grabber.'),

  // Preprocessors & Cloud Upload
  messagePreprocessor: z.any().optional().describe('Message preprocessor options.'),

  preprocFilter: z.string().optional().describe('Filter for message preprocessor.'),

  cloudUploadOptions: CloudUploadOptionsSchema.optional().describe('Options for cloud upload preprocessor.'),

  pQueueDefault: z.any().optional().describe('Default pqueue options.'),

  // Session Limits
  maxChats: z.number().optional().describe('Maximum amount of chats to be present in a session.'),

  maxMessages: z.number().optional().describe('Maximum amount of messages to be present in a session.'),

  discord: z.string().optional().describe('Your Discord ID to get onto the sticker leaderboard.'),

  // Multi-device
  multiDevice: z.boolean().default(true).describe('Enable multi-device support (Beta).'),

  sessionDataBucketAuth: z.string().optional().describe('Base64 encoded S3 Bucket & Authentication object.'),

  // v5 Specific Features
  apiLifecycle: z
    .enum(['immediate', 'post-connection', 'hybrid'])
    .default('hybrid')
    .describe('When to start the API: immediate, after connection, or hybrid (QR only first).'),

  dashboard: z
    .boolean()
    .default(true)
    .describe('Launch the session management dashboard. Disable with --no-dashboard.'),

  dashboardPort: z
    .number()
    .int()
    .min(1)
    .max(65535)
    .default(3000)
    .describe('Port for the dashboard sidecar. Defaults to 3000.'),

  proxyHost: z
    .string()
    .optional()
    .describe('Host of the Cloudflare session proxy worker, e.g. wss://proxy.account.workers.dev'),

  proxyToken: z
    .string()
    .optional()
    .describe('Token used to authenticate this session with the Cloudflare proxy upstream.'),


  integrations: z
    .record(
      z.string(),
      z.object({
        enabled: z.boolean().default(false),
        config: z.record(z.string(), z.string()).default({}),
      })
    )
    .optional()
    .describe('Integration configurations (chatwoot, webhook, n8n, etc.). Changes require restart.'),

  // Server Configuration
  apiKey: z.string().optional().describe('API key for authentication (minimum 8 characters).'),

  port: z.number().int().min(1).max(65535).default(8080).describe('Port for the API server.'),

  host: z.string().default('localhost').describe('Host address to bind.'),

  cors: z.union([z.string(), z.array(z.string())]).default('*').describe('CORS allowed origins.'),

  webhook: z.string().url().optional().describe('Webhook URL for events.'),

  // ElasticSearch Monitoring
  elasticUrl: z.string().url().optional().describe('ElasticSearch URL.'),
  elasticUsername: z.string().optional().describe('ElasticSearch username.'),
  elasticPassword: z.string().optional().describe('ElasticSearch password.'),
  elasticBufferSize: z.number().default(50).describe('ElasticSearch buffer size.'),
  elasticPipeline: z.string().optional().describe('ElasticSearch ingest pipeline.'),
  elasticIndexPrefix: z.string().default('open-wa-').describe('ElasticSearch index prefix.'),

  // Session Sync (S3)
  s3Sync: S3SyncSchema.optional().describe('S3 Session Synchronization configuration'),

  // ── Plugin System ──────────────────────────────────────────
  /**
   * Plugins to load. Can be npm package names or local file paths.
   * @example ['@open-wa/integration-chatwoot', './my-local-plugin']
   */
  plugins: z.array(z.string()).default([]).describe('Plugin references to load (npm packages or file paths).'),

  /**
   * Plugin-specific configuration keyed by plugin name.
   * Each plugin validates its own config via its configSchema.
   *
   * @example
   * ```js
   * pluginConfig: {
   *   chatwoot: { chatwootUrl: '...', chatwootApiAccessToken: '...' },
   *   webhook: { url: 'https://...', events: 'all' },
   * }
   * ```
   */
  pluginConfig: z.record(z.string(), z.unknown()).default({}).describe('Plugin configuration keyed by plugin name.'),

  /**
   * Easy API MCP configuration. Hosted MCP requires apiKey.
   */
  mcp: McpConfigSchema.optional().describe('Easy API MCP configuration. Hosted MCP requires apiKey.'),
});

// ============================================================================
// Type Exports
// ============================================================================

export type Config = z.infer<typeof ConfigSchema>;
export type SessionData = z.infer<typeof SessionDataSchema>;
export type DevTools = z.infer<typeof DevToolsSchema>;
export type ProxyServerCredentials = z.infer<typeof ProxyServerCredentialsSchema>;
export type CloudUploadOptions = z.infer<typeof CloudUploadOptionsSchema>;
export type Viewport = z.infer<typeof ViewportSchema>;
export type LightpandaOptions = z.infer<typeof LightpandaOptionsSchema>;
export type S3Sync = z.infer<typeof S3SyncSchema>;
export type LoggingTransport = z.infer<typeof LoggingTransportSchema>;

// ============================================================================
// Partial/Strict Variants
// ============================================================================

/**
 * A partial config object where all properties are optional.
 * Useful for user-provided config that will be merged with defaults.
 */
export const PartialConfigSchema = ConfigSchema.partial();
export type PartialConfig = z.infer<typeof PartialConfigSchema>;

/**
 * Deep partial config type for nested object support.
 * Note: Zod v4 doesn't have deepPartial(), so we use a type-only approach.
 */
export type DeepPartialConfig = {
  [K in keyof Config]?: Config[K] extends object
    ? { [P in keyof Config[K]]?: Config[K][P] }
    : Config[K];
};

/**
 * Strict config that doesn't allow extra properties
 */
export const StrictConfigSchema = ConfigSchema.strict();
export type StrictConfig = z.infer<typeof StrictConfigSchema>;

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validate a config object and return errors if invalid
 */
export function validateConfig(config: unknown): {
  success: boolean;
  data?: Config;
  errors?: z.ZodError;
} {
  const result = ConfigSchema.safeParse(config);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

/**
 * Validate and throw if invalid
 */
export function parseConfig(config: unknown): Config {
  return ConfigSchema.parse(config);
}

/**
 * Get default config values
 */
export function getDefaultConfig(): Config {
  return ConfigSchema.parse({});
}
