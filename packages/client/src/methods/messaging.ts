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
  MediaSendOptions, AudioAttachmentOptions, VoiceNoteOptions, GifSendOptions, PollSendOptions, PollResults, PinDuration, SoundStickerOptions,
} from '@open-wa/schema';
import { implementMethod, editMessage as editMessageSchema, react as reactSchema, SendTextResultSchema, AlbumSendResultSchema, sendAlbum as sendAlbumSchema, sendPoll as sendPollSchema, AudioAttachmentOptionsSchema, VoiceNoteOptionsSchema, GifSendOptionsSchema, PollResultsSchema, voteOnPoll as voteOnPollSchema, getPollResults as getPollResultsMethodSchema, pinMessage as pinMessageSchema, unpinMessage as unpinMessageSchema, SoundStickerOptionsSchema } from '@open-wa/schema';
import { SendTextError } from '../SendTextError';
import type { StickerInput, StickerJob } from '@open-wa/stickers';
import { sendClientSticker } from '../stickers';
import { invokePatch } from '../patchRuntime';
import { sendMedia, mediaSendResult, resolveMediaInput, type MediaInput, type MediaSendResult } from '../mediaInput';

declare const WAPI: {
  sendMessage: (to: string, content: string) => Promise<unknown>;
  sendLocation: (to: string, lat: number, lng: number, loc: string, address?: string, url?: string) => Promise<string | false>;
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
  sendImage(to: ChatId, file: MediaInput, filename?: string, options?: MediaSendOptions): Promise<MediaSendResult>;
  /** Sends media in its native presentation: image, video, audio or document. */
  sendFile(to: ChatId, file: MediaInput, filename?: string, options?: MediaSendOptions): Promise<MediaSendResult>;
  sendAudio(to: ChatId, file: MediaInput, filename?: string, options?: AudioAttachmentOptions): Promise<MediaSendResult>;
  /** Marks prepared audio as a voice note; it does not transcode the input. */
  sendPtt(to: ChatId, file: MediaInput, options?: VoiceNoteOptions): Promise<MediaSendResult>;
  /** Sends video with WhatsApp's looping GIF flag. */
  sendVideoAsGif(to: ChatId, file: MediaInput, filename?: string, options?: GifSendOptions): Promise<MediaSendResult>;
  /** Zero allows all options; otherwise the count is the selection limit. */
  sendPoll(to: ChatId, name: string, options: string[], config?: PollSendOptions): Promise<MessageId | boolean>;
  /** Use option IDs from getPollResults; an empty array removes this account's vote. */
  voteOnPoll(messageId: MessageId, optionIds: number[]): Promise<boolean>;
  /** Hydrates the synced poll vote store; it is not a global attendance guarantee. */
  getPollResults(messageId: MessageId): Promise<PollResults>;
  /** Pin a message for everyone, subject to native chat permissions. */
  pinMessage(messageId: MessageId, duration?: PinDuration): Promise<boolean>;
  unpinMessage(messageId: MessageId): Promise<boolean>;
  sendLocation(to: ChatId, lat: number, lng: number, locationText: string, address?: string): Promise<MessageId | false>;
  sendContact(to: ChatId, contact: ContactId | ContactId[]): Promise<MessageId | boolean | (MessageId | boolean)[]>;
  sendMultipleContacts(to: ChatId, contactIds: ContactId[]): Promise<MessageId | boolean>;
  sendVCard(to: ChatId, vcard: string, contactName?: string, contactNumber?: string): Promise<MessageId | boolean>;
  /** Render locally with automatic whole-job routing, then submit through the donor finalizer. */
  sendSticker(to: ChatId, input: StickerInput, job?: StickerJob): Promise<MessageId>;
  /** Sends a sticker with a short sound. The sound must be Ogg Opus or M4A, at most 1 MB; it is not converted. */
  sendSoundSticker(to: ChatId, sticker: MediaInput, sound: MediaInput, options?: SoundStickerOptions): Promise<MessageId>;
  reply(to: ChatId, content: string, quotedMsgId: MessageId): Promise<MessageId | boolean>;
  forwardMessages(to: ChatId, messages: MessageId | MessageId[], skipMyMessages?: boolean): Promise<MessageIdReturn[] | boolean>;
  deleteMessage(chatId: ChatId, messageId: MessageId | MessageId[], onlyLocal?: boolean): Promise<boolean>;
  editMessage: ReturnType<typeof implementMethod<typeof editMessageSchema>>;
  react: ReturnType<typeof implementMethod<typeof reactSchema>>;
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
    
    async sendImage(to, file, filename, options = {}) {
      return sendMedia(client, to, file, filename, options);
    },

    async sendFile(to, file, filename, options = {}) {
      return sendMedia(client, to, file, filename, options);
    },

    async sendAudio(to, file, filename, options = {}) {
      return sendMedia(client, to, file, filename, { type: 'audio', ...AudioAttachmentOptionsSchema.parse(options) });
    },

    async sendPtt(to, file, options = {}) {
      return sendMedia(client, to, file, undefined, { type: 'audio', ptt: true, ...VoiceNoteOptionsSchema.parse(options) });
    },

    async sendVideoAsGif(to, file, filename, options = {}) {
      return sendMedia(client, to, file, filename, { type: 'video', isGif: true, ...GifSendOptionsSchema.parse(options) });
    },

    async sendPoll(to, name, options, config = {}) {
      const params = sendPollSchema.openWAInput.parse({ to, name, options, config });
      return mediaSendResult(await invokePatch(client, 'sendPoll', [params.to, params.name, params.options, params.config.quotedMsgId, params.config.selectableCount ?? 1, params.config]));
    },

    async voteOnPoll(messageId, optionIds) {
      const params = voteOnPollSchema.openWAInput.parse({ messageId, optionIds });
      return invokePatch<boolean>(client, 'voteOnPoll', [params.messageId, params.optionIds]);
    },

    async getPollResults(messageId) {
      const params = getPollResultsMethodSchema.openWAInput.parse({ messageId });
      return PollResultsSchema.parse(await invokePatch(client, 'getPollResults', [params.messageId]));
    },

    async pinMessage(messageId, duration = 'SevenDays') {
      const params = pinMessageSchema.openWAInput.parse({ messageId, duration });
      return invokePatch<boolean>(client, 'pinMessage', [params.messageId, true, params.duration]);
    },

    async unpinMessage(messageId) {
      const params = unpinMessageSchema.openWAInput.parse({ messageId });
      return invokePatch<boolean>(client, 'pinMessage', [params.messageId, false]);
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
      input: StickerInput,
      job?: StickerJob
    ): Promise<MessageId> {
      return sendClientSticker(client, to, input, job);
    },
    
    async sendSoundSticker(to, sticker, sound, options = {}) {
      const config = SoundStickerOptionsSchema.parse(options);
      const [image, clip] = await Promise.all([resolveMediaInput(sticker), resolveMediaInput(sound)]);
      if (!image.mime.startsWith('image/')) throw new Error('sendSoundSticker needs an image for the sticker.');
      // An MP4 signature identifies the container, which also holds M4A audio.
      if (clip.mime === 'video/mp4') clip.dataUrl = clip.dataUrl.replace(/^data:[^;,]*/, 'data:audio/mp4');
      else if (!clip.mime.startsWith('audio/')) throw new Error('sendSoundSticker needs an audio clip for the sound.');
      // The patch's own messages say what to fix, so return them instead of a wrapped evaluation error.
      const result = await evaluate(async input => {
        const send = (globalThis as unknown as { WAPI?: { sendSoundSticker?: (...args: unknown[]) => Promise<unknown> } }).WAPI?.sendSoundSticker;
        if (typeof send !== 'function') return { ok: false as const, message: 'sendSoundSticker is unavailable in this session. Restart the session to load the current patches.' };
        try { return { ok: true as const, id: await send(input.to, input.sticker, input.sound, input.config) }; }
        catch (error) { return { ok: false as const, message: error instanceof Error ? error.message : String(error) }; }
      }, { to, sticker: image.dataUrl, sound: clip.dataUrl, config });
      if (!result.ok) throw new Error(result.message);
      const parsed = SendTextResultSchema.safeParse(result.id);
      if (!parsed.success) throw new Error('sendSoundSticker did not return a message ID. The sticker may have been sent; check the chat before retrying.');
      return parsed.data;
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
    
    editMessage: implementMethod(editMessageSchema, ({ messageId, newContent }) =>
      invokePatch<boolean>(client, 'editMessage', [messageId, newContent])),
    
    react: implementMethod(reactSchema, ({ messageId, emoji }) =>
      invokePatch<boolean>(client, 'react', [messageId, emoji])),
    
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
