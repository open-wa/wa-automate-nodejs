import type { Client } from '../Client.js';
import type {
  ChatId,
  ContactId,
  Contact,
  GroupId,
} from '@open-wa/schema';

declare const WAPI: {
  getContact: (contactId: string) => Contact;
  getAllContacts: () => Contact[];
  checkNumberStatus: (contactId: string) => Promise<{ canReceiveMessage: boolean; numberExists: boolean; id: string }>;
  getProfilePicFromServer: (chatId: string) => Promise<string | null>;
  contactBlock: (contactId: string) => Promise<boolean>;
  contactUnblock: (contactId: string) => Promise<boolean>;
  getBlockedIds: () => Promise<string[]>;
  getCommonGroups: (contactId: string) => Promise<Array<{ id: string; title: string }>>;
  getLastSeen: (contactId: string) => Promise<number | boolean>;
  isChatOnline: (chatId: string) => Promise<boolean | string>;
};

export interface ContactMethods {
  getContact(contactId: ContactId): Promise<Contact | null>;
  getAllContacts(): Promise<Contact[]>;
  getContactById(contactId: ContactId): Promise<Contact | null>;
  checkNumberStatus(contactId: ContactId): Promise<{ canReceiveMessage: boolean; numberExists: boolean; id: string }>;
  getProfilePic(chatId: ChatId): Promise<string | null>;
  blockContact(contactId: ContactId): Promise<boolean>;
  unblockContact(contactId: ContactId): Promise<boolean>;
  getBlockedContacts(): Promise<ContactId[]>;
  getCommonGroups(contactId: ContactId): Promise<Array<{ id: GroupId; title: string }>>;
  getLastSeen(contactId: ContactId): Promise<number | null>;
  isChatOnline(chatId: ChatId): Promise<boolean>;
}

export function contactMethods(client: Client): ContactMethods {
  const evaluate = client.evaluate.bind(client);
  
  return {
    async getContact(contactId: ContactId): Promise<Contact | null> {
      return evaluate(
        ({ contactId }) => WAPI.getContact(contactId),
        { contactId }
      );
    },
    
    async getAllContacts(): Promise<Contact[]> {
      return evaluate(
        () => WAPI.getAllContacts(),
        undefined
      );
    },
    
    async getContactById(contactId: ContactId): Promise<Contact | null> {
      return evaluate(
        ({ contactId }) => WAPI.getContact(contactId),
        { contactId }
      );
    },
    
    async checkNumberStatus(contactId: ContactId): Promise<{ canReceiveMessage: boolean; numberExists: boolean; id: string }> {
      return evaluate(
        ({ contactId }) => WAPI.checkNumberStatus(contactId),
        { contactId }
      );
    },
    
    async getProfilePic(chatId: ChatId): Promise<string | null> {
      return evaluate(
        ({ chatId }) => WAPI.getProfilePicFromServer(chatId),
        { chatId }
      );
    },
    
    async blockContact(contactId: ContactId): Promise<boolean> {
      return evaluate(
        ({ contactId }) => WAPI.contactBlock(contactId),
        { contactId }
      );
    },
    
    async unblockContact(contactId: ContactId): Promise<boolean> {
      return evaluate(
        ({ contactId }) => WAPI.contactUnblock(contactId),
        { contactId }
      );
    },
    
    async getBlockedContacts(): Promise<ContactId[]> {
      return evaluate(
        () => WAPI.getBlockedIds(),
        undefined
      ) as Promise<ContactId[]>;
    },
    
    async getCommonGroups(contactId: ContactId): Promise<Array<{ id: GroupId; title: string }>> {
      return evaluate(
        ({ contactId }) => WAPI.getCommonGroups(contactId),
        { contactId }
      ) as Promise<Array<{ id: GroupId; title: string }>>;
    },
    
    async getLastSeen(contactId: ContactId): Promise<number | null> {
      const result = await evaluate(
        ({ contactId }) => WAPI.getLastSeen(contactId),
        { contactId }
      );
      return typeof result === 'number' ? result : null;
    },
    
    async isChatOnline(chatId: ChatId): Promise<boolean> {
      const result = await evaluate(
        ({ chatId }) => WAPI.isChatOnline(chatId),
        { chatId }
      );
      return result === true;
    },
  };
}
