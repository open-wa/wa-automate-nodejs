/**
 * @open-wa/config - Environment Variable Loader
 *
 * Loads configuration from environment variables with WA_ prefix.
 * Converts WA_SESSION_ID to sessionId, WA_PORT to port, etc.
 *
 * Source of truth: ConfigSchema (Zod schema)
 * - Valid keys derived from schema
 * - Type coercion derived from schema field types
 */
import { z } from 'zod';
import { ConfigSchema, type PartialConfig } from './schema';

/**
 * Aliases for env vars that don't follow the standard transformation.
 * e.g., WA_DEBUG -> devtools (not "debug")
 *
 * ONLY add entries here when the env var name differs from the config key.
 */
const ENV_ALIASES: Record<string, string> = {
  DEBUG: 'devtools', // WA_DEBUG -> devtools (historical alias)
  BROWSER_WS_ENDPOINT: 'browserWSEndpoint', // Acronym casing: WS not Ws
  BYPASS_CSP: 'bypassCSP', // Acronym casing: CSP not Csp
};

/**
 * Get all valid config keys from the Zod schema (single source of truth)
 */
const VALID_CONFIG_KEYS = new Set(Object.keys(ConfigSchema.shape));

/**
 * Detect the expected type for a config key from the Zod schema.
 * Returns: 'number' | 'boolean' | 'array' | 'object' | 'string'
 */
function getSchemaFieldType(key: string): 'number' | 'boolean' | 'array' | 'object' | 'string' {
  const field = ConfigSchema.shape[key as keyof typeof ConfigSchema.shape];
  if (!field) return 'string';

  // Unwrap optional/default wrappers
  let inner: z.ZodTypeAny = field;
  while (inner instanceof z.ZodOptional || inner instanceof z.ZodDefault) {
    inner = inner._def.innerType as z.ZodTypeAny;
  }

  // Check types
  if (inner instanceof z.ZodNumber) return 'number';
  if (inner instanceof z.ZodBoolean) return 'boolean';
  if (inner instanceof z.ZodArray) return 'array';
  if (inner instanceof z.ZodObject || inner instanceof z.ZodRecord) return 'object';
  if (inner instanceof z.ZodUnion) {
    // Check if any option is a number/boolean
    const options = inner._def.options as z.ZodTypeAny[];
    if (options.some((o) => o instanceof z.ZodNumber)) return 'number';
    if (options.some((o) => o instanceof z.ZodBoolean)) return 'boolean';
  }

  return 'string';
}

/**
 * Boolean-like string values
 */
const TRUTHY_VALUES = new Set(['true', 'TRUE', '1', 'yes', 'YES', 'on', 'ON']);
const FALSY_VALUES = new Set(['false', 'FALSE', '0', 'no', 'NO', 'off', 'OFF']);

/**
 * Parse a string value to the appropriate type based on schema
 */
function parseEnvValue(value: string, key: string): unknown {
  const expectedType = getSchemaFieldType(key);

  switch (expectedType) {
    case 'boolean':
      if (TRUTHY_VALUES.has(value)) return true;
      if (FALSY_VALUES.has(value)) return false;
      return value; // Let Zod validation handle invalid values

    case 'number': {
      const numValue = Number(value);
      if (!isNaN(numValue) && value.trim() !== '') {
        return numValue;
      }
      return value; // Let Zod validation handle invalid values
    }

    case 'array':
    case 'object':
      // Try to parse as JSON
      if (value.startsWith('[') || value.startsWith('{')) {
        try {
          return JSON.parse(value);
        } catch {
          // Not valid JSON, return as string
        }
      }
      return value;

    default:
      return value;
  }
}

/**
 * Convert SNAKE_CASE (without prefix) to camelCase config key
 */
function snakeToCamel(snakeCase: string): string {
  return snakeCase.toLowerCase().replace(/_([a-z])/g, (_, char) => char.toUpperCase());
}

/**
 * Convert env var name to config key
 */
function envNameToConfigKey(envName: string, prefix: string): string | null {
  // Remove prefix
  const withoutPrefix = envName.slice(prefix.length);

  // Check aliases first
  const alias = ENV_ALIASES[withoutPrefix];
  if (alias && VALID_CONFIG_KEYS.has(alias)) {
    return alias;
  }

  // Standard snake_case to camelCase conversion
  const camelKey = snakeToCamel(withoutPrefix);

  // Validate against schema - only return if it's a valid config key
  if (VALID_CONFIG_KEYS.has(camelKey)) {
    return camelKey;
  }

  // Not a valid config key
  return null;
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

    const configKey = envNameToConfigKey(envName, prefix);
    if (!configKey) continue; // Skip unrecognized env vars

    // Parse the value based on schema type
    const parsedValue = parseEnvValue(value, configKey);
    config[configKey] = parsedValue;
    loadedVars.push(
      `${envName}=${typeof parsedValue === 'string' ? parsedValue : JSON.stringify(parsedValue)}`
    );
  }

  if (verbose && loadedVars.length > 0) {
    console.log('[config] Loaded from environment:', loadedVars.join(', '));
  }

  return config as PartialConfig;
}

/**
 * Convert a config key to its environment variable name.
 */
export function configKeyToEnvVar(key: string, prefix: string = 'WA_'): string {
  // Check reverse aliases
  for (const [envSuffix, configKey] of Object.entries(ENV_ALIASES)) {
    if (configKey === key) {
      return `${prefix}${envSuffix}`;
    }
  }

  // Standard camelCase to SNAKE_CASE conversion
  return (
    prefix +
    key
      .replace(/([A-Z])/g, '_$1')
      .toUpperCase()
      .replace(/^_/, '')
  );
}

/**
 * Get all environment variable names that can be used for configuration.
 * Derived from ConfigSchema - single source of truth.
 */
export function getConfigEnvVars(
  prefix: string = 'WA_'
): Array<{ envVar: string; configKey: string }> {
  return Array.from(VALID_CONFIG_KEYS).map((configKey) => ({
    envVar: configKeyToEnvVar(configKey, prefix),
    configKey,
  }));
}
