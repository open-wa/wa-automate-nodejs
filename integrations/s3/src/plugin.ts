import type { Plugin, PluginInput, Hooks } from '@open-wa/core';
import type { S3Config } from './config.js';
import { S3Uploader } from './uploader.js';

interface MediaMessage {
  deprecatedMms3Url?: string;
  mimetype?: string;
  cloudUrl?: string;
}

interface WAClient {
  decryptMedia: (message: unknown) => Promise<string>;
}

export function s3Plugin(config: S3Config): Plugin {
  return async (input: PluginInput): Promise<Hooks> => {
    const { logger, client } = input;
    const uploader = new S3Uploader(config, logger);

    const getWAClient = (): WAClient | null => {
      if (client && typeof client === 'object' && 'decryptMedia' in client) {
        return client as WAClient;
      }
      return null;
    };

    return {
      'message.received': async ({ message }) => {
        const msg = message as MediaMessage;
        const waClient = getWAClient();

        if (msg.deprecatedMms3Url && msg.mimetype && waClient) {
          const cloudUrl = await uploader.uploadMedia(msg as never, waClient);
          if (cloudUrl) {
            msg.cloudUrl = cloudUrl;
          }
        }
      },

      dispose: async () => {
        await uploader.waitForQueue();
        logger.info('S3 uploader queue drained');
      },
    };
  };
}
