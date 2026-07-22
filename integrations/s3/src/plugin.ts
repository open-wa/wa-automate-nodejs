import type { Plugin, PluginInput, Hooks } from '@open-wa/core';
import type { S3Config } from './config.js';
import { Effect, ManagedRuntime } from 'effect';
import { S3UploaderService, s3UploaderLayer } from './service.js';

interface MediaMessage {
  deprecatedMms3Url?: string;
  mimetype?: string;
  cloudUrl?: string;
}

interface WAClient {
  decryptMedia: (message: unknown) => Promise<string>;
}

export function s3Plugin(config: S3Config): Plugin {
  return Object.assign(async (input: PluginInput): Promise<Hooks> => {
    const { logger, client } = input;
    const runtime = ManagedRuntime.make(s3UploaderLayer(config, logger));
    const uploader = await runtime.runPromise(S3UploaderService);

    const getWAClient = (): WAClient | null => {
      if (client && typeof client === 'object' && 'decryptMedia' in client) {
        return client as WAClient;
      }
      return null;
    };

    return {
      'message.received': ({ message }) => runtime.runPromise(Effect.tryPromise({
        try: async () => {
          const msg = message as MediaMessage;
          const waClient = getWAClient();

          if (msg.deprecatedMms3Url && msg.mimetype && waClient) {
            const cloudUrl = await uploader.uploadMedia(msg as never, waClient);
            if (cloudUrl) {
              msg.cloudUrl = cloudUrl;
            }
          }
        },
        catch: (cause) => cause,
      })),

      dispose: async () => {
        await runtime.dispose();
        logger.info('S3 uploader queue drained');
      },
    };
  }, {
    meta: {
      name: 's3',
      version: '5.0.0-alpha.7',
      description: 'Upload WhatsApp media to S3-compatible object storage',
    },
  });
}
