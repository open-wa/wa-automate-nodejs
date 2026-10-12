import axios from 'axios';
import { decryptMedia as decryptMediaBuffer } from '@open-wa/decrypt';
import type { Client } from '../Client';
import type { DataURL, Message, MessageId } from '@open-wa/schema';
import { implementMethod, sendFileFromUrl as sendFileFromUrlSchema } from '@open-wa/schema';

export interface MediaMethods {
  decryptMedia(message: Message | MessageId): Promise<DataURL>;
  downloadMedia(message: Message | MessageId, path: string): Promise<string>;
  sendFileFromUrl: ReturnType<typeof implementMethod<typeof sendFileFromUrlSchema>>;
}

type DecryptableMessage = Message & {
  mimetype?: string;
  mediaKey?: string;
  filehash?: string;
  size?: number;
  clientUrl?: string;
  deprecatedMms3Url?: string;
};

function isMessageId(message: Message | MessageId): message is MessageId {
  return typeof message === 'string';
}

export function mediaMethods(client: Client): MediaMethods {
  return {
    async decryptMedia(message: Message | MessageId): Promise<DataURL> {
      const resolvedMessage = (isMessageId(message)
        ? await client.getMessageById(message)
        : message) as DecryptableMessage | null;

      if (!resolvedMessage) {
        throw new Error('Message not found');
      }

      if (!resolvedMessage.mimetype) {
        throw new Error('Not a media message');
      }

      const decrypted = await decryptMediaBuffer(resolvedMessage as any);
      return `data:${resolvedMessage.mimetype};base64,${decrypted.toString('base64')}` as DataURL;
    },

    async downloadMedia(message: Message | MessageId, path: string): Promise<string> {
      const dataUrl = await client.decryptMedia(message);
      const base64 = dataUrl.split(',')[1] || '';
      const fs = await import('node:fs/promises');
      await fs.writeFile(path, Buffer.from(base64, 'base64'));
      return path;
    },

    sendFileFromUrl: implementMethod(sendFileFromUrlSchema, async ({ to, url, filename, options, headers }) => {
      const response = await axios.get<ArrayBuffer>(url, { headers, responseType: 'arrayBuffer' });
      const mime = response.headers.get('content-type') || 'application/octet-stream';
      const dataUrl = `data:${mime};base64,${Buffer.from(response.data).toString('base64')}`;
      return client.sendFile(to, dataUrl, filename, options);
    }),
  };
}
