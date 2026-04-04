import axios from 'axios';
import { decryptMedia as decryptMediaBuffer } from '@open-wa/decrypt';
import type { Client } from '../Client.js';
import type { ChatId, DataURL, Message, MessageId } from '@open-wa/schema';
import { createUnsupportedMethodStub } from '../runtimeSurface.js';

type DownloadHeaders = Record<string, string>;

export interface MediaMethods {
  decryptMedia(message: Message | MessageId): Promise<DataURL>;
  downloadMedia(message: Message | MessageId, path: string): Promise<string>;
  sendFileFromUrl(
    to: ChatId,
    url: string,
    filename: string,
    caption?: string,
    headers?: DownloadHeaders
  ): Promise<MessageId | boolean>;
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
  const unsupportedSendFileFromUrl = createUnsupportedMethodStub<MediaMethods['sendFileFromUrl']>('sendFileFromUrl');

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

    async sendFileFromUrl(
      to: ChatId,
      url: string,
      filename: string,
      caption = '',
      headers?: DownloadHeaders
    ): Promise<MessageId | boolean> {
      void axios;
      void client;
      void to;
      void url;
      void filename;
      void caption;
      void headers;
      return unsupportedSendFileFromUrl(to, url, filename, caption, headers);
    },
  };
}
