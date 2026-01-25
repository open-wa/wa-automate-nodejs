/**
 * @open-wa/config - Config Loader
 *
 * Uses cosmiconfig to discover and load configuration files.
 * Supports: wa.config.js, wa.config.ts, wa.config.json, .warc, package.json#wa
 */
import { cosmiconfig, cosmiconfigSync, type CosmiconfigResult } from 'cosmiconfig';
import { TypeScriptLoader } from 'cosmiconfig-typescript-loader';
import { resolveConfigInput, type ConfigInput } from './define-config';
import type { PartialConfig } from './schema';

const MODULE_NAME = 'wa';

/**
 * Search places for configuration files (in order of precedence)
 */
const SEARCH_PLACES = [
  // Package.json
  'package.json',
  // wa.config files (JS variants)
  'wa.config.js',
  'wa.config.cjs',
  'wa.config.mjs',
  // wa.config files (TypeScript)
  'wa.config.ts',
  'wa.config.mts',
  'wa.config.cts',
  // JSON formats
  'wa.config.json',
  '.warc',
  '.warc.json',
  // Legacy cli.config files (backward compat)
  'cli.config.js',
  'cli.config.json',
];

/**
 * Create cosmiconfig explorer with TypeScript support
 */
function createExplorer() {
  return cosmiconfig(MODULE_NAME, {
    searchPlaces: SEARCH_PLACES,
    loaders: {
      '.ts': TypeScriptLoader(),
      '.mts': TypeScriptLoader(),
      '.cts': TypeScriptLoader(),
    },
  });
}

/**
 * Create synchronous cosmiconfig explorer
 */
function createExplorerSync() {
  return cosmiconfigSync(MODULE_NAME, {
    searchPlaces: SEARCH_PLACES,
    loaders: {
      '.ts': TypeScriptLoader(),
      '.mts': TypeScriptLoader(),
      '.cts': TypeScriptLoader(),
    },
  });
}

/**
 * Result from loading a config file
 */
export interface LoadedConfig {
  /** The resolved configuration object */
  config: PartialConfig;
  /** The path to the config file that was loaded */
  filepath: string;
  /** Whether the config was empty (file existed but was empty) */
  isEmpty: boolean;
}

/**
 * Options for loading configuration
 */
export interface LoadConfigFileOptions {
  /**
   * Directory to start searching from.
   * Defaults to process.cwd()
   */
  searchFrom?: string;

  /**
   * Path to a specific config file.
   * If provided, skips search and loads directly.
   */
  configPath?: string;

  /**
   * If true, throws when no config file is found.
   * Default: false
   */
  throwOnMissing?: boolean;
}

/**
 * Load configuration from file asynchronously.
 *
 * @example
 * const result = await loadConfigFile();
 * if (result) {
 *   console.log('Loaded from:', result.filepath);
 *   console.log('Config:', result.config);
 * }
 *
 * @example
 * // Load from specific file
 * const result = await loadConfigFile({ configPath: './my.config.ts' });
 */
export async function loadConfigFile(
  options: LoadConfigFileOptions = {}
): Promise<LoadedConfig | null> {
  const { searchFrom = process.cwd(), configPath, throwOnMissing = false } = options;

  const explorer = createExplorer();
  let result: CosmiconfigResult;

  try {
    if (configPath) {
      result = await explorer.load(configPath);
    } else {
      result = await explorer.search(searchFrom);
    }
  } catch (error) {
    if (throwOnMissing) throw error;
    return null;
  }

  if (!result) {
    if (throwOnMissing) {
      throw new Error(`No configuration file found${configPath ? ` at ${configPath}` : ''}`);
    }
    return null;
  }

  // Handle function exports (async or sync)
  let config: PartialConfig;
  if (typeof result.config === 'function' || result.config?.default) {
    const configInput = (result.config?.default ?? result.config) as ConfigInput;
    config = await resolveConfigInput(configInput);
  } else {
    config = result.config as PartialConfig;
  }

  return {
    config,
    filepath: result.filepath,
    isEmpty: result.isEmpty ?? false,
  };
}

/**
 * Load configuration from file synchronously.
 *
 * Note: This cannot load TypeScript files that use async exports.
 * Use loadConfigFile() for full async support.
 */
export function loadConfigFileSync(
  options: LoadConfigFileOptions = {}
): LoadedConfig | null {
  const { searchFrom = process.cwd(), configPath, throwOnMissing = false } = options;

  const explorer = createExplorerSync();
  let result: CosmiconfigResult;

  try {
    if (configPath) {
      result = explorer.load(configPath);
    } else {
      result = explorer.search(searchFrom);
    }
  } catch (error) {
    if (throwOnMissing) throw error;
    return null;
  }

  if (!result) {
    if (throwOnMissing) {
      throw new Error(`No configuration file found${configPath ? ` at ${configPath}` : ''}`);
    }
    return null;
  }

  // Handle function exports (sync only)
  let config: PartialConfig;
  if (typeof result.config === 'function') {
    const fn = result.config as () => PartialConfig;
    config = fn();
  } else if (result.config?.default) {
    const defaultExport = result.config.default;
    if (typeof defaultExport === 'function') {
      config = defaultExport();
    } else {
      config = defaultExport as PartialConfig;
    }
  } else {
    config = result.config as PartialConfig;
  }

  return {
    config,
    filepath: result.filepath,
    isEmpty: result.isEmpty ?? false,
  };
}

/**
 * Clear the config cache.
 * Useful when you need to reload configuration.
 */
export function clearConfigCache(): void {
  const explorer = createExplorer();
  explorer.clearCaches();
}
