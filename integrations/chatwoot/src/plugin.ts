/**
 * Chatwoot Integration Plugin
 *
 * Bridges WhatsApp messages with Chatwoot CRM via the plugin SDK.
 * Provides a webhook endpoint for Chatwoot to send outbound messages.
 */
import { createPlugin, z } from '@open-wa/plugin-sdk';
import { ChatwootClient } from './client.js';
import { createChatwootRouter } from './middleware.js';

/**
 * Config schema for the Chatwoot plugin.
 * Validated automatically by the plugin host before init() is called.
 */
const configSchema = z.object({
  /** The URL of the Chatwoot instance (e.g., "https://app.chatwoot.com/api/v1/accounts/123") */
  chatwootUrl: z.string().url(),
  /** The API access token from your Chatwoot account settings */
  chatwootApiAccessToken: z.string().min(1),
  /** The public API host URL that Chatwoot will use to send webhooks */
  apiHost: z.string().optional(),
  /** The host address */
  host: z.string().optional(),
  /** Whether to use HTTPS */
  https: z.boolean().optional(),
  /** The port */
  port: z.number().optional(),
  /** API key for securing the webhook endpoint */
  apiKey: z.string().optional(),
  /** Force update the inbox webhook URL on init */
  forceUpdateCwWebhook: z.boolean().default(false),
});

export type ChatwootPluginConfig = z.infer<typeof configSchema>;

export default createPlugin({
  meta: {
    name: 'chatwoot',
    version: '5.0.0-alpha.1',
    description: 'Chatwoot CRM integration for open-wa — bidirectional message sync',
    author: 'Mohammed Shah <@smashah>',
    homepage: 'https://github.com/open-wa/wa-automate-nodejs',
  },

  configSchema,

  init: async ({ config, client, logger, sessionId }) => {
    const cwClient = new ChatwootClient(config, logger);

    return {
      'core.started': async () => {
        const hostAccountNumber = await client.getHostNumber();
        await cwClient.init(sessionId, hostAccountNumber);
        logger.info('Chatwoot integration initialized');
      },

      'message.received': async ({ message }) => {
        const decryptMedia = async (msg: unknown) => client.decryptMedia(msg);
        await cwClient.processWAMessage(message as never, decryptMedia);
      },

      routes: () => createChatwootRouter(cwClient, client, logger),

      pages: [
        {
          path: '/',
          title: 'Chatwoot',
          icon: '💬',
          description: 'Chatwoot CRM integration status and configuration',
        },
      ],

      dispose: async () => {
        logger.info('Chatwoot integration disposed');
      },
    };
  },
});
