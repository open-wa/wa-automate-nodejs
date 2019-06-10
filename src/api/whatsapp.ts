import { Page } from 'puppeteer';
import { Subject } from 'rxjs';
import { ExposedFn } from './functions/exposed.enum';
import { Chat } from './model/chat';
import { Contact } from './model/contact';
import { Message } from './model/message';

declare module WAPI {
  const waitNewMessages: (rmCallback: boolean, callback: Function) => void;
  const sendMessage: (to: string, content: string) => void;
  const sendSeen: (to: string) => void;
  const getAllContacts: () => Contact[];
  const getAllChats: () => Chat[];
  const getAllChatsWithNewMsg: () => Chat[];
  const getAllGroups: () => any[];
}

export class Whatsapp {
  constructor(public page: Page) {
    this.page = page;
  }

  /**
   * Listens to messages received
   * @returns Observable stream of messages
   */
  public onMessage() {
    const messageSubject = new Subject<Message>();
    this.page.exposeFunction(ExposedFn.OnMessage, (message: Message) =>
      messageSubject.next(message)
    );
    return messageSubject.asObservable();
  }

  /**
   * Sends a text message to given chat
   * @param to chat id: xxxxx@us.c
   * @param content text message
   */
  public async sendText(to: string, content: string) {
    return await this.page.evaluate(
      ({ to, content }) => {
        WAPI.sendSeen(to);
        WAPI.sendMessage(to, content);
      },
      { to, content }
    );
  }

  /**
   * Retrieves all contacts
   * @returns array of [Contact]
   */
  public async getAllContacts() {
    return await this.page.evaluate(() => WAPI.getAllContacts());
  }

  /**
   * Retrieves all chats
   * @returns array of [Chat]
   */
  public async getAllChats(withNewMessageOnly = false) {
    if (withNewMessageOnly) {
      return await this.page.evaluate(() => WAPI.getAllChatsWithNewMsg());
    } else {
      return await this.page.evaluate(() => WAPI.getAllChats());
    }
  }

  /**
   * Retrieve all groups
   * @returns array of groups
   */
  public async getAllGroups(withNewMessagesOnly = false) {
    if (withNewMessagesOnly) {
      // prettier-ignore
      const chats = await this.page.evaluate(() => WAPI.getAllChatsWithNewMsg());
      return chats.filter(chat => chat.isGroup);
    } else {
      const chats = await this.page.evaluate(() => WAPI.getAllChats());
      return chats.filter(chat => chat.isGroup);
    }
  }
}
