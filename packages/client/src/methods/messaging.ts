import type { Client } from '../Client';
import type {
  ChatId,
  ContactId,
  MessageId,
  MessageIdReturn,
  Message,
  DataURL,
  Base64,
  Content,
  AlbumMedia,
  AlbumSendResult,
} from '@open-wa/schema';
import { SendTextResultSchema, AlbumSendResultSchema, sendAlbum as sendAlbumSchema, sendPoll as sendPollSchema } from '@open-wa/schema';
import { SendTextError } from '../SendTextError';
import { invokePatch } from '../patchRuntime';
import { sendMedia, mediaSendResult, type MediaInput, type MediaSendResult } from '../mediaInput';

declare const WAPI: {
  sendMessage: (to: string, content: string) => Promise<unknown>;
  sendLocation: (to: string, lat: number, lng: number, loc: string, address?: string, url?: string) => Promise<string | false>;
  sendImageAsSticker: (webpBase64: string, to: string, metadata?: any) => Promise<string | boolean>;
  reply: (to: string, content: string, quotedMsg: string | Message) => Promise<string | boolean>;
  forwardMessages: (to: string, messages: string | (string | Message)[], skipMyMessages: boolean) => Promise<MessageIdReturn[] | boolean>;
  smartDeleteMessages: (chatId: string, messageId: string[] | string, onlyLocal: boolean) => Promise<any>;
  sendSeen: (chatId: string) => Promise<boolean>;
  getMessageById: (messageId: string) => Message | false | null;
  getAlbumMessages: (messageId: string) => Promise<Message[] | false>;
  sendAlbum: (to: string, media: AlbumMedia[], caption: string, quotedMsgId?: string) => Promise<AlbumSendResult>;
};

export interface MessagingMethods {
  /**
   * Returns a validated serialized message ID, not a delivery receipt.
   * Throws SendTextError on failure and never retries an uncertain send.
   */
  sendText(to: ChatId | string, content: string): Promise<MessageId>;
  /** Resolves phone-number IDs to LIDs and submits native album media in order. */
  sendAlbum(to: ChatId, media: AlbumMedia[], caption?: string, quotedMsgId?: MessageId): Promise<AlbumSendResult>;
  sendImage(to: ChatId, file: MediaInput, filename: string, caption?: string, quotedMsgId?: MessageId): Promise<MediaSendResult>;
  /** Sends media in its native presentation: image, video, audio or document. */
  sendFile(to: ChatId, file: MediaInput, filename: string, caption?: string): Promise<MediaSendResult>;
  sendAudio(to: ChatId, file: MediaInput, filename: string, quotedMsgId?: MessageId): Promise<MediaSendResult>;
  /** Marks prepared audio as a voice note; it does not transcode the input. */
  sendPtt(to: ChatId, file: MediaInput, quotedMsgId?: MessageId): Promise<MediaSendResult>;
  /** Sends video with WhatsApp's looping GIF flag. */
  sendVideoAsGif(to: ChatId, file: MediaInput, filename: string, caption?: string, quotedMsgId?: MessageId): Promise<MediaSendResult>;
  /** Zero allows all options; otherwise the count is the selection limit. */
  sendPoll(to: ChatId, name: string, options: string[], selectableCount?: number): Promise<MessageId | boolean>;
  sendLocation(to: ChatId, lat: number, lng: number, locationText: string, address?: string): Promise<MessageId | false>;
  sendContact(to: ChatId, contact: ContactId | ContactId[]): Promise<MessageId | boolean | (MessageId | boolean)[]>;
  sendMultipleContacts(to: ChatId, contactIds: ContactId[]): Promise<MessageId | boolean>;
  sendVCard(to: ChatId, vcard: string, contactName?: string, contactNumber?: string): Promise<MessageId | boolean>;
  sendSticker(to: ChatId, stickerData: DataURL | Base64, metadata?: { author?: string; pack?: string }): Promise<MessageId | boolean>;
  reply(to: ChatId, content: string, quotedMsgId: MessageId): Promise<MessageId | boolean>;
  forwardMessages(to: ChatId, messages: MessageId | MessageId[], skipMyMessages?: boolean): Promise<MessageIdReturn[] | boolean>;
  deleteMessage(chatId: ChatId, messageId: MessageId | MessageId[], onlyLocal?: boolean): Promise<boolean>;
  editMessage(messageId: MessageId, newContent: string): Promise<boolean>;
  react(messageId: MessageId, emoji: string): Promise<boolean>;
  sendSeen(chatId: ChatId): Promise<boolean>;
  getMessageById(messageId: MessageId): Promise<Message | false | null>;
  /** Returns currently loaded album children; the snapshot can be incomplete. */
  getAlbumMessages(messageId: MessageId): Promise<Message[] | false>;
}

export function messagingMethods(client: Client): MessagingMethods {
  const evaluate = client.evaluate.bind(client);
  
  return {
    async sendAlbum(to: ChatId, media: AlbumMedia[], caption = '', quotedMsgId?: MessageId): Promise<AlbumSendResult> {
      const params = sendAlbumSchema.openWAInput.parse({ to, media, caption, quotedMsgId });
      const result = await evaluate(
        ({ to, media, caption, quotedMsgId }) => WAPI.sendAlbum(to, media, caption, quotedMsgId),
        params
      );
      return AlbumSendResultSchema.parse(result);
    },

    async sendText(to: ChatId | string, content: string): Promise<MessageId> {
      if (typeof to !== 'string' || to.trim().length === 0 || typeof content !== 'string' || content.length === 0) {
        throw new SendTextError('sendText requires a non-empty chat ID and a non-empty text string.', {
          code: 'INVALID_ARGUMENT',
          outcome: 'not_sent',
        });
      }

      let result: unknown;
      try {
        result = await evaluate(
          ({ to, content }) => WAPI.sendMessage(to, content),
          { to, content }
        );
      } catch (cause) {
        throw new SendTextError('sendText could not confirm the result. The message may have been sent; check the chat before retrying.', {
          code: 'SEND_FAILED',
          outcome: 'unknown',
          cause,
        });
      }
      if (result === 'Not a contact') {
        const message = 'Starting a chat with a new number requires an applied restricted or premium license.';
        client.logger.error('send_text_unknown_number_requires_license', {
          sessionId: client.sessionId,
          detail: message,
        });
        throw new SendTextError(message, { code: 'LICENSE_REQUIRED', outcome: 'not_sent' });
      }
      if (result === 'Not able to send message to broadcast') {
        throw new SendTextError('sendText cannot send to status@broadcast. Use a supported chat ID.', {
          code: 'SEND_REJECTED',
          outcome: 'not_sent',
        });
      }

      const serialized = result !== null && typeof result === 'object' && '_serialized' in result
        ? result._serialized
        : result;
      const parsed = SendTextResultSchema.safeParse(serialized);
      if (!parsed.success) {
        throw new SendTextError('sendText did not return a valid message ID. The message may have been sent; check the chat before retrying.', {
          code: 'INVALID_SEND_RESULT',
          outcome: 'unknown',
          cause: result,
        });
      }
      return parsed.data;
    },
    
    async sendImage(
      to: ChatId,
      file: MediaInput,
      filename: string,
      caption = '',
      quotedMsgId?: MessageId
    ): Promise<MediaSendResult> {
      return sendMedia(client, to, file, filename, { caption, quotedMsgId });
    },
    
    async sendFile(
      to: ChatId,
      file: MediaInput,
      filename: string,
      caption = ''
    ): Promise<MediaSendResult> {
      return sendMedia(client, to, file, filename, { caption });
    },

    async sendAudio(to, file, filename, quotedMsgId) {
      return sendMedia(client, to, file, filename, { quotedMsgId, audio: true });
    },

    async sendPtt(to, file, quotedMsgId) {
      return sendMedia(client, to, file, undefined, { quotedMsgId, audio: true, ptt: true });
    },

    async sendVideoAsGif(to, file, filename, caption = '', quotedMsgId) {
      return sendMedia(client, to, file, filename, { caption, quotedMsgId, isGif: true });
    },

    async sendPoll(to, name, options, selectableCount = 1) {
      const params = sendPollSchema.openWAInput.parse({ to, name, options, selectableCount });
      return mediaSendResult(await invokePatch(client, 'sendPoll', [params.to, params.name, params.options, undefined, params.selectableCount]));
    },
    
    async sendLocation(
      to: ChatId,
      lat: number,
      lng: number,
      locationText: string,
      address?: string
    ): Promise<MessageId | false> {
      return evaluate(
        ({ to, lat, lng, locationText, address }) => 
          WAPI.sendLocation(to, lat, lng, locationText, address),
        { to, lat, lng, locationText, address }
      ) as Promise<MessageId | false>;
    },
    
    async sendContact(to, contact) {
      return invokePatch<MessageId | boolean | (MessageId | boolean)[]>(client, 'sendContact', [to, contact]);
    },

    async sendMultipleContacts(to, contactIds) {
      if (contactIds.length === 0) throw new Error('sendMultipleContacts requires at least one contact.');
      return mediaSendResult(await invokePatch(client, 'sendContact', [to, contactIds, true]));
    },

    async sendVCard(to, vcard, contactName, contactNumber) {
      const name = contactName || /^FN(?:;[^:]*)?:(.*)$/im.exec(vcard)?.[1]?.trim() || contactNumber || 'Contact';
      return mediaSendResult(await invokePatch(client, 'sendVCard', [to, vcard, name, contactNumber]));
    },
    
    async sendSticker(
      to: ChatId,
      stickerData: DataURL | Base64,
      metadata?: { author?: string; pack?: string }
    ): Promise<MessageId | boolean> {
      return evaluate(
        ({ to, stickerData, metadata }) => 
          WAPI.sendImageAsSticker(stickerData, to, metadata),
        { to, stickerData, metadata }
      ) as Promise<MessageId | boolean>;
    },
    
    async reply(to: ChatId, content: string, quotedMsgId: MessageId): Promise<MessageId | boolean> {
      return evaluate(
        ({ to, content, quotedMsgId }) => WAPI.reply(to, content, quotedMsgId),
        { to, content, quotedMsgId }
      ) as Promise<MessageId | boolean>;
    },
    
    async forwardMessages(
      to: ChatId,
      messages: MessageId | MessageId[],
      skipMyMessages = false
    ): Promise<MessageIdReturn[] | boolean> {
      return evaluate(
        ({ to, messages, skipMyMessages }) => 
          WAPI.forwardMessages(to, messages, skipMyMessages),
        { to, messages, skipMyMessages }
      );
    },
    
    async deleteMessage(
      chatId: ChatId,
      messageId: MessageId | MessageId[],
      onlyLocal = false
    ): Promise<boolean> {
      return evaluate(
        ({ chatId, messageId, onlyLocal }) => 
          WAPI.smartDeleteMessages(chatId, messageId, onlyLocal),
        { chatId, messageId, onlyLocal }
      );
    },
    
    async editMessage(messageId: MessageId, newContent: string): Promise<boolean> {
      return invokePatch<boolean>(client, 'editMessage', [messageId, newContent]);
    },
    
    async react(messageId: MessageId, emoji: string): Promise<boolean> {
      return invokePatch<boolean>(client, 'react', [messageId, emoji]);
    },
    
    async sendSeen(chatId: ChatId): Promise<boolean> {
      return evaluate(
        ({ chatId }) => WAPI.sendSeen(chatId),
        { chatId }
      );
    },
    
    async getMessageById(messageId: MessageId): Promise<Message | false | null> {
      return evaluate(
        ({ messageId }) => WAPI.getMessageById(messageId),
        { messageId }
      );
    },

    async getAlbumMessages(messageId: MessageId): Promise<Message[] | false> {
      return evaluate(
        ({ messageId }) => WAPI.getAlbumMessages(messageId),
        { messageId }
      );
    },
  };
}
