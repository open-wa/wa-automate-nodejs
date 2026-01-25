/**
 * @open-wa/config - Config Merger
 *
 * Merges configuration from multiple sources with proper precedence.
 *
 * ## Precedence Order (left to right, later overrides earlier)
 *
 * ```
 * DEFAULTS → FILE → ENV → CLI → PROGRAMMATIC
 *   (1)      (2)    (3)   (4)       (5)
 * ```
 *
 * | Priority | Source        | Description                                      |
 * |----------|---------------|--------------------------------------------------|
 * | 1 (low)  | DEFAULTS      | Hardcoded defaults from Zod schema               |
 * | 2        | FILE          | wa.config.ts/js/json, .warc, cli.config.js/cjs   |
 * | 3        | ENV           | Environment variables with WA_* prefix           |
 * | 4        | CLI           | Command-line arguments (--port, --headless, etc) |
 * | 5 (high) | PROGRAMMATIC  | Runtime overrides (testing only)                 |
 *
 * Each source can override values from previous sources.
 * Example: WA_PORT=3000 overrides port from wa.config.ts
 */
import { deepmergeCustom } from 'deepmerge-ts';
import { ConfigSchema, getDefaultConfig, parseConfig, type Config, type PartialConfig } from './schema';
import { loadFromEnv, type LoadEnvOptions } from './env';
import { loadConfigFile, type LoadConfigFileOptions } from './loader';

/**
 * Custom deepmerge that replaces arrays instead of concatenating them.
 */
const deepmerge = deepmergeCustom({
  mergeArrays: false, // Replace arrays instead of concatenating
});

/**
 * Configuration sources in order of precedence (lowest to highest).
 *
 * Order: DEFAULTS (1) → FILE (2) → ENV (3) → CLI (4) → PROGRAMMATIC (5)
 *
 * Each subsequent source overrides the previous.
 */
export enum ConfigSource {
  /** Priority 1 (lowest): Hardcoded defaults from Zod schema */
  DEFAULTS = 'defaults',
  /** Priority 2: Config files (wa.config.ts/js/json, .warc, cli.config.js/cjs) */
  FILE = 'file',
  /** Priority 3: Environment variables (WA_* prefix) */
  ENV = 'env',
  /** Priority 4: Command-line arguments */
  CLI = 'cli',
  /** Priority 5 (highest): Programmatic overrides (testing only) */
  PROGRAMMATIC = 'programmatic',
}

/**
 * Tracked configuration with source information
 */
export interface TrackedConfig {
  /** The final merged configuration */
  config: Config;
  /** The sources that contributed to the config */
  sources: ConfigSource[];
  /** The config file path if one was loaded */
  configFilePath?: string;
  /** Raw config from each source (for debugging) */
  rawConfigs?: {
    defaults: PartialConfig;
    file?: PartialConfig;
    env?: PartialConfig;
    cli?: PartialConfig;
    programmatic?: PartialConfig;
  };
}

/**
 * Options for resolving configuration
 */
export interface ResolveConfigOptions {
  /**
   * Search directory for config file.
   * Default: process.cwd()
   */
  searchFrom?: string;

  /**
   * Path to a specific config file.
   * Overrides searchFrom.
   */
  configPath?: string;

  /**
   * CLI argument overrides (highest precedence).
   */
  cliOverrides?: PartialConfig;

  /**
   * Programmatic overrides (applied after CLI).
   * Use sparingly - primarily for testing.
   */
  programmaticOverrides?: PartialConfig;

  /**
   * Options for environment variable loading.
   */
  envOptions?: LoadEnvOptions;

  /**
   * If true, skips loading from config file.
   * Default: false
   */
  skipConfigFile?: boolean;

  /**
   * If true, skips loading from environment variables.
   * Default: false
   */
  skipEnv?: boolean;

  /**
   * If true, includes raw configs from each source in the result.
   * Default: false
   */
  includeRawConfigs?: boolean;

  /**
   * If true, logs each step of config resolution.
   * Default: false
   */
  verbose?: boolean;
}

/**
 * Merge multiple partial configs with proper deep merge semantics.
 * Arrays are replaced, not concatenated.
 * Objects are deeply merged.
 */
export function mergeConfigs(...configs: PartialConfig[]): PartialConfig {
  return deepmerge(...configs) as PartialConfig;
}

/**
 * Resolve and merge configuration from all sources.
 *
 * @example
 * // Basic usage - loads from file, env, applies defaults
 * const { config } = await resolveConfig();
 *
 * @example
 * // With CLI overrides
 * const { config } = await resolveConfig({
 *   cliOverrides: { port: 3000, headless: false },
 * });
 *
 * @example
 * // Skip env and use specific config file
 * const { config } = await resolveConfig({
 *   configPath: './custom.config.ts',
 *   skipEnv: true,
 * });
 */
export async function resolveConfig(
  options: ResolveConfigOptions = {}
): Promise<TrackedConfig> {
  const {
    searchFrom = process.cwd(),
    configPath,
    cliOverrides,
    programmaticOverrides,
    envOptions,
    skipConfigFile = false,
    skipEnv = false,
    includeRawConfigs = false,
    verbose = false,
  } = options;

  const sources: ConfigSource[] = [ConfigSource.DEFAULTS];
  const rawConfigs: TrackedConfig['rawConfigs'] = {
    defaults: getDefaultConfig(),
  };

  let configFilePath: string | undefined;

  // 1. Start with defaults
  let merged: PartialConfig = { ...rawConfigs.defaults };
  if (verbose) console.log('[config] Starting with defaults');

  // 2. Load from config file
  if (!skipConfigFile) {
    const fileResult = await loadConfigFile({
      searchFrom,
      configPath,
      throwOnMissing: false,
    });

    if (fileResult && fileResult.config) {
      sources.push(ConfigSource.FILE);
      rawConfigs.file = fileResult.config;
      configFilePath = fileResult.filepath;
      merged = mergeConfigs(merged, fileResult.config);
      if (verbose) console.log(`[config] Loaded from file: ${fileResult.filepath}`);
    }
  }

  // 3. Load from environment variables
  if (!skipEnv) {
    const envConfig = loadFromEnv({ ...envOptions, verbose });
    if (Object.keys(envConfig).length > 0) {
      sources.push(ConfigSource.ENV);
      rawConfigs.env = envConfig;
      merged = mergeConfigs(merged, envConfig);
      if (verbose) console.log('[config] Loaded from environment');
    }
  }

  // 4. Apply CLI overrides
  if (cliOverrides && Object.keys(cliOverrides).length > 0) {
    sources.push(ConfigSource.CLI);
    rawConfigs.cli = cliOverrides;
    merged = mergeConfigs(merged, cliOverrides);
    if (verbose) console.log('[config] Applied CLI overrides');
  }

  // 5. Apply programmatic overrides
  if (programmaticOverrides && Object.keys(programmaticOverrides).length > 0) {
    sources.push(ConfigSource.PROGRAMMATIC);
    rawConfigs.programmatic = programmaticOverrides;
    merged = mergeConfigs(merged, programmaticOverrides);
    if (verbose) console.log('[config] Applied programmatic overrides');
  }

  // 6. Validate and parse final config
  const finalConfig = parseConfig(merged);

  return {
    config: finalConfig,
    sources,
    configFilePath,
    ...(includeRawConfigs ? { rawConfigs } : {}),
  };
}

/**
 * Synchronous version of resolveConfig.
 * Note: Cannot load TypeScript config files with async exports.
 */
export function resolveConfigSync(
  options: Omit<ResolveConfigOptions, 'configPath' | 'searchFrom'> & {
    /**
     * Pre-loaded config from file.
     * Since we can't load TS files synchronously, pass the loaded config here.
     */
    fileConfig?: PartialConfig;
  } = {}
): TrackedConfig {
  const {
    fileConfig,
    cliOverrides,
    programmaticOverrides,
    envOptions,
    skipEnv = false,
    includeRawConfigs = false,
    verbose = false,
  } = options;

  const sources: ConfigSource[] = [ConfigSource.DEFAULTS];
  const rawConfigs: TrackedConfig['rawConfigs'] = {
    defaults: getDefaultConfig(),
  };

  // 1. Start with defaults
  let merged: PartialConfig = { ...rawConfigs.defaults };

  // 2. Apply file config if provided
  if (fileConfig && Object.keys(fileConfig).length > 0) {
    sources.push(ConfigSource.FILE);
    rawConfigs.file = fileConfig;
    merged = mergeConfigs(merged, fileConfig);
  }

  // 3. Load from environment variables
  if (!skipEnv) {
    const envConfig = loadFromEnv({ ...envOptions, verbose });
    if (Object.keys(envConfig).length > 0) {
      sources.push(ConfigSource.ENV);
      rawConfigs.env = envConfig;
      merged = mergeConfigs(merged, envConfig);
    }
  }

  // 4. Apply CLI overrides
  if (cliOverrides && Object.keys(cliOverrides).length > 0) {
    sources.push(ConfigSource.CLI);
    rawConfigs.cli = cliOverrides;
    merged = mergeConfigs(merged, cliOverrides);
  }

  // 5. Apply programmatic overrides
  if (programmaticOverrides && Object.keys(programmaticOverrides).length > 0) {
    sources.push(ConfigSource.PROGRAMMATIC);
    rawConfigs.programmatic = programmaticOverrides;
    merged = mergeConfigs(merged, programmaticOverrides);
  }

  // 6. Validate and parse final config
  const finalConfig = parseConfig(merged);

  return {
    config: finalConfig,
    sources,
    ...(includeRawConfigs ? { rawConfigs } : {}),
  };
}

/**
 * Validate that a partial config is valid without filling defaults.
 * Useful for validating user input before merging.
 */
export function validatePartialConfig(config: unknown): { valid: boolean; errors?: string[] } {
  const result = ConfigSchema.partial().safeParse(config);
  if (result.success) {
    return { valid: true };
  }
  return {
    valid: false,
    errors: result.error.issues.map((e) => `${String(e.path.join('.'))}: ${e.message}`),
  };
}
