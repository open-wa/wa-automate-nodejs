/**
 * @open-wa/plugin-sdk — createPlugin()
 *
 * Type-safe plugin factory. This is the recommended way to create plugins.
 * It handles metadata attachment, config schema binding, and proper typing.
 */
import type { z } from 'zod';
import type { Plugin, PluginMeta, PluginInput, Hooks } from './types.js';

export interface CreatePluginOptions<TConfig> {
  /** Plugin metadata — name is required, everything else is optional */
  meta: PluginMeta;

  /**
   * Optional Zod schema for plugin configuration.
   * If provided, the host will validate the plugin's config against this schema
   * before passing it to init(). Plugin receives the parsed (typed) config.
   */
  configSchema?: z.ZodType<TConfig>;

  /**
   * Plugin initialization function.
   * Called once when the plugin is registered.
   * Returns the hooks this plugin wants to use.
   *
   * @param input - Typed input with config, events, client, logger, sessionId
   * @returns Hooks object with event handlers, routes, pages, etc.
   */
  init: (input: PluginInput<TConfig>) => Promise<Hooks>;
}

/**
 * Create a type-safe open-wa plugin.
 *
 * @example
 * ```ts
 * import { createPlugin } from '@open-wa/plugin-sdk';
 * import { z } from 'zod';
 *
 * export default createPlugin({
 *   meta: {
 *     name: 'calorie-tracker',
 *     version: '1.0.0',
 *     description: 'Track calories through WhatsApp messages',
 *   },
 *
 *   configSchema: z.object({
 *     prefix: z.string().default('!cal'),
 *     dailyGoal: z.number().default(2000),
 *   }),
 *
 *   init: async ({ config, client, logger }) => ({
 *     'message.received': async ({ message }) => {
 *       const msg = message as { body?: string; from?: string };
 *       if (msg.body?.startsWith(config.prefix)) {
 *         const calories = parseInt(msg.body.replace(config.prefix, '').trim());
 *         if (!isNaN(calories) && msg.from) {
 *           await client.sendText(msg.from, `Logged ${calories} calories!`);
 *           logger.info('Calories logged', { calories, from: msg.from });
 *         }
 *       }
 *     },
 *   }),
 * });
 * ```
 *
 * @example Hono routes
 * ```ts
 * import { createPlugin } from '@open-wa/plugin-sdk';
 * import { Hono } from 'hono';
 *
 * export default createPlugin({
 *   meta: { name: 'crm-webhook' },
 *
 *   init: async ({ client, logger }) => ({
 *     routes: () => {
 *       const app = new Hono();
 *       app.post('/incoming', async (c) => {
 *         const body = await c.req.json();
 *         await client.sendText(body.to, body.message);
 *         return c.json({ sent: true });
 *       });
 *       return app;
 *     },
 *
 *     pages: [{
 *       path: '/',
 *       title: 'CRM Dashboard',
 *       icon: '📊',
 *     }],
 *   }),
 * });
 * ```
 */
export function createPlugin<TConfig = unknown>(
  options: CreatePluginOptions<TConfig>
): Plugin<TConfig> {
  const plugin: Plugin<TConfig> = async (input) => options.init(input);
  plugin.meta = options.meta;
  if (options.configSchema) {
    plugin.configSchema = options.configSchema;
  }
  return plugin;
}
