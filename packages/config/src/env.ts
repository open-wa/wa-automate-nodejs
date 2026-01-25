/**
 * @open-wa/config - Environment Variable Loader
 *
 * Loads configuration from environment variables with WA_ prefix.
 * Converts WA_SESSION_ID to sessionId, WA_PORT to port, etc.
 */
import type { PartialConfig } from './schema';

/**
 * Mapping of environment variable names to config keys.
 * Based on the original config documentation in ConfigObject.
 */
const ENV_TO_CONFIG_MAP: Record<string, keyof PartialConfig> = {
  // Session & Authentication
  WA_SESSION_ID: 'sessionId',
  WA_SESSION_DATA: 'sessionData',
  WA_SESSION_DATA_PATH: 'sessionDataPath',
  WA_LICENSE_KEY: 'licenseKey',
  WA_LINK_CODE: 'linkCode',

  // Browser Configuration
  WA_BROWSER_WS_ENDPOINT: 'browserWSEndpoint',
  WA_EXECUTABLE_PATH: 'executablePath',
  WA_USE_CHROME: 'useChrome',
  WA_HEADLESS: 'headless',
  WA_USE_STEALTH: 'useStealth',
  WA_BYPASS_CSP: 'bypassCSP',
  WA_BROWSER_REVISION: 'browserRevision',
  WA_CHROMIUM_ARGS: 'chromiumArgs',
  WA_RASPI: 'raspi',
  WA_CORS_FIX: 'corsFix',
  WA_USE_NATIVE_PROXY: 'useNativeProxy',

  // QR & Authentication
  WA_QR_TIMEOUT: 'qrTimeout',
  WA_QR_LOG_SKIP: 'qrLogSkip',
  WA_QR_QUALITY: 'qrQuality',
  WA_QR_FORMAT: 'qrFormat',
  WA_QR_MAX: 'qrMax',
  WA_AUTH_TIMEOUT: 'authTimeout',
  WA_OOR_TIMEOUT: 'oorTimeout',

  // Server Configuration
  WA_PORT: 'port',
  WA_HOST: 'host',
  WA_API_KEY: 'apiKey',
  WA_CORS: 'cors',
  WA_WEBHOOK: 'webhook',
  WA_EZQR: 'ezqr',
  WA_POPUP: 'popup',

  // Logging & Debugging
  WA_LOG_CONSOLE: 'logConsole',
  WA_LOG_CONSOLE_ERRORS: 'logConsoleErrors',
  WA_LOG_FILE: 'logFile',
  WA_LOG_LEVEL: 'logLevel',
  WA_LOG_DEBUG_INFO_AS_OBJECT: 'logDebugInfoAsObject',
  WA_LOG_INTERNAL_EVENTS: 'logInternalEvents',
  WA_DISABLE_SPINS: 'disableSpins',
  WA_DEBUG: 'devtools',

  // Features & Behavior
  WA_BLOCK_CRASH_LOGS: 'blockCrashLogs',
  WA_BLOCK_ASSETS: 'blockAssets',
  WA_CACHE_ENABLED: 'cacheEnabled',
  WA_CUSTOM_USER_AGENT: 'customUserAgent',
  WA_SAFE_MODE: 'safeMode',
  WA_SKIP_SESSION_SAVE: 'skipSessionSave',
  WA_SKIP_UPDATE_CHECK: 'skipUpdateCheck',
  WA_SKIP_BROKEN_METHODS_CHECK: 'skipBrokenMethodsCheck',
  WA_ID_CORRECTION: 'idCorrection',
  WA_EVENT_MODE: 'eventMode',
  WA_LEGACY: 'legacy',
  WA_MULTI_DEVICE: 'multiDevice',
  WA_IN_DOCKER: 'inDocker',

  // Process Behavior
  WA_KILL_PROCESS_ON_BROWSER_CLOSE: 'killProcessOnBrowserClose',
  WA_KILL_PROCESS_ON_TIMEOUT: 'killProcessOnTimeout',
  WA_KILL_PROCESS_ON_BAN: 'killProcessOnBan',
  WA_KILL_CLIENT_ON_LOGOUT: 'killClientOnLogout',

  // Error Handling
  WA_ON_ERROR: 'onError',
  WA_THROW_ERROR_ON_TOS_BLOCK: 'throwErrorOnTosBlock',
  WA_THROW_ON_EXPIRED_SESSION_DATA: 'throwOnExpiredSessionData',

  // Stickers & Messaging
  WA_STICKER_SERVER_ENDPOINT: 'stickerServerEndpoint',
  WA_AUTO_EMOJI: 'autoEmoji',
  WA_LINK_PARSER: 'linkParser',

  // Session Limits
  WA_MAX_CHATS: 'maxChats',
  WA_MAX_MESSAGES: 'maxMessages',
  WA_DISCORD: 'discord',

  // v5 Specific
  WA_SOCKET_MODE: 'socketMode',
  WA_API_LIFECYCLE: 'apiLifecycle',

  // ElasticSearch
  WA_ELASTIC_URL: 'elasticUrl',
  WA_ELASTIC_USERNAME: 'elasticUsername',
  WA_ELASTIC_PASSWORD: 'elasticPassword',
  WA_ELASTIC_BUFFER_SIZE: 'elasticBufferSize',
  WA_ELASTIC_PIPELINE: 'elasticPipeline',
  WA_ELASTIC_INDEX_PREFIX: 'elasticIndexPrefix',
};

/**
 * Boolean-like string values
 */
const TRUTHY_VALUES = new Set(['true', 'TRUE', '1', 'yes', 'YES', 'on', 'ON']);
const FALSY_VALUES = new Set(['false', 'FALSE', '0', 'no', 'NO', 'off', 'OFF']);

/**
 * Parse a string value to the appropriate type
 */
function parseEnvValue(value: string, key: string): unknown {
  // Check for boolean
  if (TRUTHY_VALUES.has(value)) return true;
  if (FALSY_VALUES.has(value)) return false;

  // Check for number (integers)
  const numValue = Number(value);
  if (!isNaN(numValue) && value.trim() !== '') {
    // Only convert to number for known numeric fields
    const numericFields = new Set([
      'port',
      'qrTimeout',
      'authTimeout',
      'oorTimeout',
      'callTimeout',
      'waitForRipeSessionTimeout',
      'qrMax',
      'qrQuality',
      'maxChats',
      'maxMessages',
      'elasticBufferSize',
    ]);
    if (numericFields.has(key)) {
      return numValue;
    }
  }

  // Check for JSON (arrays, objects)
  if (value.startsWith('[') || value.startsWith('{')) {
    try {
      return JSON.parse(value);
    } catch {
      // Not valid JSON, return as string
    }
  }

  // Return as string
  return value;
}

/**
 * Convert snake_case env var name to camelCase config key
 */
function envNameToConfigKey(envName: string, prefix: string): string {
  // Remove the prefix and convert to camelCase
  const prefixRegex = new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
  const withoutPrefix = envName.replace(prefixRegex, '');
  return withoutPrefix
    .toLowerCase()
    .replace(/_([a-z])/g, (_, char) => char.toUpperCase());
}

/**
 * Options for loading environment variables
 */
export interface LoadEnvOptions {
  /**
   * Custom prefix for environment variables.
   * Default: 'WA_'
   */
  prefix?: string;

  /**
   * Custom environment object.
   * Default: process.env
   */
  env?: Record<string, string | undefined>;

  /**
   * If true, logs which env vars were loaded.
   * Default: false
   */
  verbose?: boolean;
}

/**
 * Load configuration from environment variables.
 *
 * @example
 * // Load from process.env
 * const envConfig = loadFromEnv();
 *
 * @example
 * // Load from custom env object
 * const envConfig = loadFromEnv({
 *   env: { WA_PORT: '3000', WA_SESSION_ID: 'my-session' }
 * });
 */
export function loadFromEnv(options: LoadEnvOptions = {}): PartialConfig {
  const { prefix = 'WA_', env = process.env, verbose = false } = options;

  const config: Record<string, unknown> = {};
  const loadedVars: string[] = [];

  for (const [envName, value] of Object.entries(env)) {
    if (!envName.startsWith(prefix) || value === undefined) continue;

    // First, check explicit mapping (for WA_ prefix only)
    // For custom prefixes, convert the env name to match WA_ format for lookup
    let configKey: string | undefined;
    if (prefix === 'WA_') {
      configKey = ENV_TO_CONFIG_MAP[envName];
    } else {
      // Convert custom prefix to WA_ format for lookup
      const waEquivalent = 'WA_' + envName.slice(prefix.length);
      configKey = ENV_TO_CONFIG_MAP[waEquivalent];
    }
    // Fall back to automatic conversion if not in explicit map
    configKey = configKey || envNameToConfigKey(envName, prefix);

    // Parse the value
    const parsedValue = parseEnvValue(value, configKey);
    config[configKey] = parsedValue;
    loadedVars.push(`${envName}=${typeof parsedValue === 'string' ? parsedValue : JSON.stringify(parsedValue)}`);
  }

  if (verbose && loadedVars.length > 0) {
    console.log('[config] Loaded from environment:', loadedVars.join(', '));
  }

  return config as PartialConfig;
}

/**
 * Get all environment variable names that can be used for configuration.
 * Useful for documentation and CLI help.
 */
export function getConfigEnvVars(): Array<{ envVar: string; configKey: string }> {
  return Object.entries(ENV_TO_CONFIG_MAP).map(([envVar, configKey]) => ({
    envVar,
    configKey,
  }));
}
