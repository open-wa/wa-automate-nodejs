import type { Client } from '../Client.js';
import type {
  ChatId,
  ContactId,
  MessageId,
  Message,
  DataURL,
  Base64,
  Content,
} from '@open-wa/schema';

declare const WAPI: {
  sendMessage: (to: string, content: string) => Promise<string>;
  sendImage: (base64: string, to: string, filename: string, caption: string, quotedMsgId?: string, waitForId?: boolean, ptt?: boolean, withoutPreview?: boolean, hideTags?: boolean, viewOnce?: boolean) => Promise<string>;
  sendFile: (base64: string, to: string, filename: string, caption: string) => Promise<string>;
  sendLocation: (to: string, lat: number, lng: number, loc: string, address?: string, url?: string) => Promise<string>;
  sendContact: (to: string, contact: string | string[]) => Promise<any>;
  sendImageAsSticker: (webpBase64: string, to: string, metadata?: any) => Promise<string | boolean>;
  reply: (to: string, content: string, quotedMsg: string | Message) => Promise<string | boolean>;
  forwardMessages: (to: string, messages: string | (string | Message)[], skipMyMessages: boolean) => Promise<any>;
  smartDeleteMessages: (chatId: string, messageId: string[] | string, onlyLocal: boolean) => Promise<any>;
  editMessage: (messageId: string, text: string) => Promise<any>;
  react: (messageId: string, emoji: string) => Promise<boolean>;
  sendSeen: (chatId: string) => Promise<boolean>;
  getMessageById: (messageId: string) => Message;
};

export interface MessagingMethods {
  sendText(to: ChatId, content: string): Promise<MessageId>;
  sendImage(to: ChatId, file: DataURL | Base64, filename: string, caption?: string, quotedMsgId?: MessageId): Promise<MessageId>;
  sendFile(to: ChatId, file: DataURL | Base64, filename: string, caption?: string): Promise<MessageId>;
  sendLocation(to: ChatId, lat: number, lng: number, locationText: string, address?: string): Promise<MessageId>;
  sendContact(to: ChatId, contact: ContactId | ContactId[]): Promise<boolean>;
  sendSticker(to: ChatId, stickerData: DataURL | Base64, metadata?: { author?: string; pack?: string }): Promise<MessageId | boolean>;
  reply(to: ChatId, content: string, quotedMsgId: MessageId): Promise<MessageId | boolean>;
  forwardMessages(to: ChatId, messages: MessageId | MessageId[], skipMyMessages?: boolean): Promise<boolean>;
  deleteMessage(chatId: ChatId, messageId: MessageId | MessageId[], onlyLocal?: boolean): Promise<boolean>;
  editMessage(messageId: MessageId, newContent: string): Promise<boolean>;
  react(messageId: MessageId, emoji: string): Promise<boolean>;
  sendSeen(chatId: ChatId): Promise<boolean>;
  getMessageById(messageId: MessageId): Promise<Message | null>;
}

export function messagingMethods(client: Client): MessagingMethods {
  const evaluate = client.evaluate.bind(client);
  
  return {
    async sendText(to: ChatId, content: string): Promise<MessageId> {
      return evaluate(
        ({ to, content }) => WAPI.sendMessage(to, content),
        { to, content }
      ) as Promise<MessageId>;
    },
    
    async sendImage(
      to: ChatId,
      file: DataURL | Base64,
      filename: string,
      caption = '',
      quotedMsgId?: MessageId
    ): Promise<MessageId> {
      return evaluate(
        ({ to, file, filename, caption, quotedMsgId }) => 
          WAPI.sendImage(file, to, filename, caption, quotedMsgId, true),
        { to, file, filename, caption, quotedMsgId }
      ) as Promise<MessageId>;
    },
    
    async sendFile(
      to: ChatId,
      file: DataURL | Base64,
      filename: string,
      caption = ''
    ): Promise<MessageId> {
      return evaluate(
        ({ to, file, filename, caption }) => 
          WAPI.sendFile(file, to, filename, caption),
        { to, file, filename, caption }
      ) as Promise<MessageId>;
    },
    
    async sendLocation(
      to: ChatId,
      lat: number,
      lng: number,
      locationText: string,
      address?: string
    ): Promise<MessageId> {
      return evaluate(
        ({ to, lat, lng, locationText, address }) => 
          WAPI.sendLocation(to, lat, lng, locationText, address),
        { to, lat, lng, locationText, address }
      ) as Promise<MessageId>;
    },
    
    async sendContact(to: ChatId, contact: ContactId | ContactId[]): Promise<boolean> {
      return evaluate(
        ({ to, contact }) => WAPI.sendContact(to, contact),
        { to, contact }
      );
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
    ): Promise<boolean> {
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
      return evaluate(
        ({ messageId, newContent }) => WAPI.editMessage(messageId, newContent),
        { messageId, newContent }
      );
    },
    
    async react(messageId: MessageId, emoji: string): Promise<boolean> {
      return evaluate(
        ({ messageId, emoji }) => WAPI.react(messageId, emoji),
        { messageId, emoji }
      );
    },
    
    async sendSeen(chatId: ChatId): Promise<boolean> {
      return evaluate(
        ({ chatId }) => WAPI.sendSeen(chatId),
        { chatId }
      );
    },
    
    async getMessageById(messageId: MessageId): Promise<Message | null> {
      return evaluate(
        ({ messageId }) => WAPI.getMessageById(messageId),
        { messageId }
      );
    },
  };
}
