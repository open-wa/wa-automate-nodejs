import type { Plugin, PluginInput, Hooks } from '@open-wa/core';
import type { ChatwootConfig } from './config.js';
import { ChatwootClient } from './client.js';

export function chatwootPlugin(config: ChatwootConfig): Plugin {
  return async (input: PluginInput): Promise<Hooks> => {
    const { logger, sessionId, client } = input;
    const cwClient = new ChatwootClient(config, logger);

    const getDecryptMedia = (): ((msg: unknown) => Promise<string>) | undefined => {
      if (client && typeof client === 'object' && 'decryptMedia' in client) {
        return (client as { decryptMedia: (msg: unknown) => Promise<string> }).decryptMedia.bind(client);
      }
      return undefined;
    };

    return {
      'core.started': async () => {
        let hostAccountNumber: string | undefined;
        if (client && typeof client === 'object' && 'getHostNumber' in client) {
          hostAccountNumber = await (client as { getHostNumber: () => Promise<string> }).getHostNumber();
        }
        await cwClient.init(sessionId, hostAccountNumber);
        logger.info('Chatwoot integration initialized');
      },

      'message.received': async ({ message }) => {
        await cwClient.processWAMessage(message as never, getDecryptMedia());
      },

      dispose: async () => {
        logger.info('Chatwoot integration disposed');
      },
    };
  };
}
