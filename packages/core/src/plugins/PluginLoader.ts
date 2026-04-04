/**
 * PluginLoader — Config-driven dynamic plugin loading
 *
 * Loads plugins from references specified in the global config.
 *
 * Supported reference formats:
 * - NPM scoped: "@open-wa/integration-chatwoot"
 * - NPM community: "openwa-plugin-calorie-tracker"
 * - Local relative: "./plugins/my-plugin"
 * - Local absolute: "/path/to/plugin"
 *
 * Each reference is dynamically imported. The module must export
 * a Plugin as its default export, or as a named `plugin` export.
 */
import type { Plugin } from '@open-wa/plugin-sdk';
import type { Logger } from '@open-wa/logger';

export interface LoadedPlugin {
  /** The original reference string from config */
  ref: string;
  /** The loaded & validated plugin */
  plugin: Plugin;
}

/**
 * Load plugins from an array of config references.
 *
 * @param refs - Array of npm package names or file paths
 * @param logger - Logger for reporting load success/failure
 * @returns Array of successfully loaded plugins
 *
 * @example
 * ```ts
 * const plugins = await loadPlugins([
 *   '@open-wa/integration-chatwoot',
 *   '@open-wa/integration-webhook',
 *   './my-local-plugin',
 * ], logger);
 * ```
 */
export async function loadPlugins(
  refs: string[],
  logger: Logger
): Promise<LoadedPlugin[]> {
  const loaded: LoadedPlugin[] = [];

  for (const ref of refs) {
    try {
      const mod = await import(ref);
      const plugin: Plugin | undefined = mod.default ?? mod.plugin;

      if (!plugin || typeof plugin !== 'function') {
        logger.warn('plugin_load_skip', {
          ref,
          reason: 'no valid default or named "plugin" export found',
          availableExports: Object.keys(mod),
        });
        continue;
      }

      if (!plugin.meta?.name) {
        logger.warn('plugin_load_skip', {
          ref,
          reason: 'plugin.meta.name is missing — use createPlugin() to define your plugin',
        });
        continue;
      }

      loaded.push({ ref, plugin });
      logger.info('plugin_loaded', {
        ref,
        name: plugin.meta.name,
        version: plugin.meta.version ?? 'unknown',
      });
    } catch (err) {
      logger.error('plugin_load_error', {
        ref,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return loaded;
}

/**
 * Validate plugin config against the plugin's schema (if one exists).
 *
 * @param plugin - The plugin with an optional configSchema
 * @param config - The raw config from pluginConfig[pluginName]
 * @param logger - Logger for reporting validation errors
 * @returns Validated config (parsed by Zod), or the raw config if no schema
 */
export function validatePluginConfig(
  plugin: Plugin,
  config: unknown,
  logger: Logger
): unknown {
  if (!plugin.configSchema) {
    return config ?? {};
  }

  const result = plugin.configSchema.safeParse(config ?? {});
  if (!result.success) {
    logger.error('plugin_config_invalid', {
      plugin: plugin.meta.name,
      errors: result.error.issues,
    });
    throw new Error(
      `Invalid config for plugin "${plugin.meta.name}": ${result.error.message}`
    );
  }

  return result.data;
}
