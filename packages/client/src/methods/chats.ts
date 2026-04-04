import type { Client } from '../Client.js';
import type {
  ChatId,
  Chat,
  Message,
} from '@open-wa/schema';
import { createUnsupportedMethodStub } from '../runtimeSurface.js';

type ChatMuteDuration = 'FOREVER' | 'EIGHT_HOURS' | 'ONE_WEEK' | number;

declare const WAPI: {
  getChat: (chatId: string) => Chat;
  getAllChats: () => Chat[];
  getChatById: (chatId: string) => Chat;
  deleteConversation: (chatId: string) => Promise<boolean>;
  clearChat: (chatId: string) => Promise<any>;
  archiveChat: (chatId: string, archive: boolean) => Promise<boolean>;
  pinChat: (chatId: string, pin: boolean) => Promise<boolean>;
  muteChat: (chatId: string, muteDuration: ChatMuteDuration) => Promise<string | boolean | number>;
  unmuteChat: (chatId: string) => Promise<string | boolean | number>;
  markAsUnread: (chatId: string) => Promise<boolean>;
  getAllMessagesInChat: (chatId: string, includeMe: boolean, includeNotifications: boolean) => Message[];
  loadEarlierMessages: (chatId: string) => Promise<Message[]>;
};

export interface ChatMethods {
  getChat(chatId: ChatId): Promise<Chat | null>;
  getAllChats(): Promise<Chat[]>;
  getChatById(chatId: ChatId): Promise<Chat | null>;
  deleteChat(chatId: ChatId): Promise<boolean>;
  clearChat(chatId: ChatId): Promise<boolean>;
  archiveChat(chatId: ChatId): Promise<boolean>;
  unarchiveChat(chatId: ChatId): Promise<boolean>;
  pinChat(chatId: ChatId): Promise<boolean>;
  unpinChat(chatId: ChatId): Promise<boolean>;
  muteChat(chatId: ChatId, duration?: ChatMuteDuration): Promise<boolean>;
  unmuteChat(chatId: ChatId): Promise<boolean>;
  markAsUnread(chatId: ChatId): Promise<boolean>;
  getAllMessages(chatId: ChatId, includeMe?: boolean, includeNotifications?: boolean): Promise<Message[]>;
  loadEarlierMessages(chatId: ChatId, count?: number, includeMe?: boolean): Promise<Message[]>;
}

export function chatMethods(client: Client): ChatMethods {
  const evaluate = client.evaluate.bind(client);
  const unsupportedPinChat = createUnsupportedMethodStub<ChatMethods['pinChat']>('pinChat');
  const unsupportedUnpinChat = createUnsupportedMethodStub<ChatMethods['unpinChat']>('unpinChat');
  const unsupportedMuteChat = createUnsupportedMethodStub<ChatMethods['muteChat']>('muteChat');
  const unsupportedUnmuteChat = createUnsupportedMethodStub<ChatMethods['unmuteChat']>('unmuteChat');
  
  return {
    async getChat(chatId: ChatId): Promise<Chat | null> {
      return evaluate(
        ({ chatId }) => WAPI.getChat(chatId),
        { chatId }
      );
    },
    
    async getAllChats(): Promise<Chat[]> {
      return evaluate(
        () => WAPI.getAllChats(),
        undefined
      );
    },
    
    async getChatById(chatId: ChatId): Promise<Chat | null> {
      return evaluate(
        ({ chatId }) => WAPI.getChatById(chatId),
        { chatId }
      );
    },
    
    async deleteChat(chatId: ChatId): Promise<boolean> {
      return evaluate(
        ({ chatId }) => WAPI.deleteConversation(chatId),
        { chatId }
      );
    },
    
    async clearChat(chatId: ChatId): Promise<boolean> {
      const result = await evaluate(
        ({ chatId }) => WAPI.clearChat(chatId),
        { chatId }
      );
      return !!result;
    },
    
    async archiveChat(chatId: ChatId): Promise<boolean> {
      return evaluate(
        ({ chatId }) => WAPI.archiveChat(chatId, true),
        { chatId }
      );
    },
    
    async unarchiveChat(chatId: ChatId): Promise<boolean> {
      return evaluate(
        ({ chatId }) => WAPI.archiveChat(chatId, false),
        { chatId }
      );
    },
    
    async pinChat(chatId: ChatId): Promise<boolean> {
      return unsupportedPinChat(chatId);
    },
    
    async unpinChat(chatId: ChatId): Promise<boolean> {
      return unsupportedUnpinChat(chatId);
    },
    
    async muteChat(chatId: ChatId, duration: ChatMuteDuration = 'FOREVER'): Promise<boolean> {
      return unsupportedMuteChat(chatId, duration);
    },
    
    async unmuteChat(chatId: ChatId): Promise<boolean> {
      return unsupportedUnmuteChat(chatId);
    },
    
    async markAsUnread(chatId: ChatId): Promise<boolean> {
      return evaluate(
        ({ chatId }) => WAPI.markAsUnread(chatId),
        { chatId }
      );
    },
    
    async getAllMessages(
      chatId: ChatId,
      includeMe = true,
      includeNotifications = false
    ): Promise<Message[]> {
      return evaluate(
        ({ chatId, includeMe, includeNotifications }) => 
          WAPI.getAllMessagesInChat(chatId, includeMe, includeNotifications),
        { chatId, includeMe, includeNotifications }
      );
    },
    
    async loadEarlierMessages(chatId: ChatId, _count = 20, _includeMe = false): Promise<Message[]> {
      return evaluate(
        ({ chatId }) => WAPI.loadEarlierMessages(chatId),
        { chatId }
      );
    },
  };
}
