/**
 * Webhook Integration Plugin
 *
 * Forwards public WA events to an external URL via HTTP POST.
 * Supports event filtering, retry with exponential backoff, and concurrent delivery.
 */
import { createPlugin, z } from '@open-wa/plugin-sdk';
import { WebhookDeliverer } from './deliverer.js';

const configSchema = z.object({
  /** Target URL for webhook delivery */
  url: z.string().url(),

  /** Which events to forward. Use 'all' to forward everything. */
  events: z.union([z.array(z.string()), z.literal('all')]).default('all'),

  /** Max concurrent deliveries */
  concurrency: z.number().int().positive().default(10),

  /** Number of retry attempts */
  retries: z.number().int().min(0).default(3),

  /** Base retry delay in ms */
  retryDelay: z.number().int().positive().default(1000),

  /** Additional headers */
  headers: z.record(z.string()).optional(),

  /** Request timeout in ms */
  timeout: z.number().int().positive().default(30_000),
});

export type WebhookPluginConfig = z.infer<typeof configSchema>;

export default createPlugin({
  meta: {
    name: 'webhook',
    version: '5.0.0-alpha.1',
    description: 'Forward WhatsApp events to an external URL via HTTP POST',
    author: 'Mohammed Shah <@smashah>',
  },

  configSchema,

  init: async ({ config, logger, sessionId }) => {
    const webhookId = crypto.randomUUID();
    const deliverer = new WebhookDeliverer(config, logger);

    const allowedEvents = config.events === 'all'
      ? null
      : new Set(config.events);

    logger.info(`Webhook configured: ${config.url} (${config.events === 'all' ? 'all events' : `${(config.events as string[]).length} events`})`);

    return {
      event: async ({ event, payload }) => {
        if (allowedEvents && !allowedEvents.has(event)) {
          return;
        }

        await deliverer.deliver({
          webhookId,
          sessionId,
          event,
          payload,
          timestamp: Date.now(),
        });
      },

      dispose: async () => {
        await deliverer.waitForIdle();
        logger.info('Webhook deliverer queue drained');
      },
    };
  },
});
