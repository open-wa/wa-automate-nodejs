import type { Plugin, PluginInput, Hooks } from '@open-wa/core';
import { randomUUID } from 'crypto';
import type { WebhookConfig } from './config.js';
import { WebhookDeliverer } from './deliverer.js';

export function webhookPlugin(config: WebhookConfig): Plugin {
  return async (input: PluginInput): Promise<Hooks> => {
    const { logger, sessionId } = input;
    const webhookId = randomUUID();
    const deliverer = new WebhookDeliverer(config, logger);

    const allowedEvents = config.events === 'all' || !config.events
      ? null
      : new Set(config.events);

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
  };
}
