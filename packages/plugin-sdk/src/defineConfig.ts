/**
 * @open-wa/plugin-sdk — defineConfig()
 *
 * Helper for defining typed plugin configuration schemas.
 * This is a thin wrapper around Zod that provides better plugin-specific naming.
 */
import { z } from 'zod';

/**
 * Define a typed configuration schema for your plugin.
 *
 * The schema will be used to:
 * 1. Validate the plugin's config from the global wa.config.js
 * 2. Provide TypeScript type inference in your plugin's init function
 * 3. Generate documentation for plugin consumers
 *
 * @example
 * ```ts
 * import { defineConfig } from '@open-wa/plugin-sdk';
 *
 * export const config = defineConfig(z => z.object({
 *   apiUrl: z.string().url().describe('Chatwoot API URL'),
 *   apiToken: z.string().min(1).describe('API access token'),
 *   accountId: z.number().int().positive().describe('Chatwoot account ID'),
 *   inboxId: z.number().int().positive().optional().describe('Default inbox ID'),
 * }));
 *
 * // Type is inferred:
 * // { apiUrl: string; apiToken: string; accountId: number; inboxId?: number }
 * ```
 */
export function defineConfig<T>(
  factory: (zod: typeof z) => z.ZodType<T>
): z.ZodType<T> {
  return factory(z);
}

// Re-export z for convenience — plugin devs don't need to install zod separately
export { z };
