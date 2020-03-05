import { Page } from 'puppeteer';
/**
 * @private
 */
import { ExposedFn } from './functions/exposed.enum';
import { Chat, LiveLocationChangedEvent, ChatState } from './model/chat';
import { Contact } from './model/contact';
import { Message } from './model/message';
import { Id } from './model/id';
import axios from 'axios';
import { ParticipantChangedEventModel } from './model/group-metadata';
import { useragent } from '../config/puppeteer.config'

export const getBase64 = async (url: string) => {
  try {
    const res = await axios
      .get(url, {
        responseType: 'arraybuffer'
      });
    return `data:${res.headers['content-type']};base64,${Buffer.from(res.data, 'binary').toString('base64')}`
    // return Buffer.from(response.data, 'binary').toString('base64')
  } catch (error) {
    console.log("TCL: getBase64 -> error", error)
  }
}

declare module WAPI {
  const waitNewMessages: (rmCallback: boolean, callback: Function) => void;
  const addAllNewMessagesListener: (callback: Function) => void;
  const onStateChanged: (callback: Function) => void;
  const onAddedToGroup: (callback: Function) => any;
  const onParticipantsChanged: (groupId: string, callback: Function) => any;
  const onLiveLocation: (chatId: string, callback: Function) => any;
  const sendMessage: (to: string, content: string) => string;
  const setChatState: (chatState: ChatState, chatId: string) => void;
  const reply: (to: string, content: string, quotedMsg: string | Message) => void;
  const getGeneratedUserAgent: (userAgent?: string) => string;
  const forwardMessages: (to: string, messages: string | (string | Message)[], skipMyMessages: boolean) => any;
  const sendLocation: (to: string, lat: any, lng: any, loc: string) => void;
  const addParticipant: (groupId: string, contactId: string) => void;
  const setMyName: (newName: string) => void;
  const setMyStatus: (newStatus: string) => void;
  const getStatus: (contactId: string) => void;
  const getGroupAdmins: (groupId: string) => Contact[];
  const removeParticipant: (groupId: string, contactId: string) => void;
  const promoteParticipant: (groupId: string, contactId: string) => void;
  const demoteParticipant: (groupId: string, contactId: string) => void;
  const createGroup: (groupName: string, contactId: string|string[]) => void;
  const sendSeen: (to: string) => void;
  const sendImage: (
    base64: string,
    to: string,
    filename: string,
    caption: string
  ) => void;
  const sendMessageWithThumb: (
    thumb: string,
    url: string,
    title: string,
    description: string,
    chatId: string
  ) => void;
  const getBusinessProfilesProducts: (to: string) => any;
  const sendImageWithProduct: (base64: string, to: string, caption: string, bizNumber: string, productId: string) => any;
  const sendFile: (
    base64: string,
    to: string,
    filename: string,
    caption: string
  ) => void;
  const sendVideoAsGif: (
    base64: string,
    to: string,
    filename: string,
    caption: string
  ) => void;
  const getAllContacts: () => Contact[];
  const getWAVersion: () => String;
  const getMe: () => any;
  const getAllUnreadMessages: () => any;
  const getAllChatsWithMessages: (withNewMessageOnly?: boolean) => any;
  const getAllChats: () => any;
  const getBatteryLevel: () => Number;
  const getChat: (contactId: string) => Chat;
  const getProfilePicFromServer: (chatId: string) => any;
  const getAllChatIds: () => string[];
  const getAllChatsWithNewMsg: () => Chat[];
  const getAllNewMessages: () => any;
  const getAllGroups: () => Chat[];
  const getGroupParticipantIDs: (groupId: string) => Id[];
  const leaveGroup: (groupId: string) => any;
  const getContact: (contactId: string) => Contact;
  const checkNumberStatus: (contactId: string) => any;
  const getChatById: (contactId: string) => Chat;
  const smartDeleteMessages: (contactId: string, messageId: string[] | string, onlyLocal:boolean) => any;
  const sendContact: (to: string, contact: string | string[]) => any;
  const simulateTyping: (to: string, on: boolean) => void;
  const isConnected: () => Boolean;
  const loadEarlierMessages: (contactId: string) => Message[];
  const loadAllEarlierMessages: (contactId: string) => void;
  const asyncLoadAllEarlierMessages: (contactId: string) => void;
  const getUnreadMessages: (
    includeMe: boolean,
    includeNotifications: boolean,
    use_unread_count: boolean
  ) => any;
  const getAllMessagesInChat: (
    chatId: string,
    includeMe: boolean,
    includeNotifications: boolean,
  ) => [Message];
  const loadAndGetAllMessagesInChat: (
    chatId: string,
    includeMe: boolean,
    includeNotifications: boolean,
  ) => [Message]
}

export class Whatsapp {

  /**
   * @param page [Page] [Puppeteer Page]{@link https://pptr.dev/#?product=Puppeteer&version=v2.1.1&show=api-class-page} running web.whatsapp.com
   */
  constructor(public page: Page) {
    this.page = page;
  }

  /**
   * Listens to messages received
   * @returns Observable stream of messages
   */
  public onMessage(fn: (message: Message) => void) {
    this.page.exposeFunction(ExposedFn.OnMessage, (message: Message) =>
      fn(message)
    );
  }

  /**
   * Listens to all new messages
   * @param to callback
   * @returns 
   */
  public async onAnyMessage(fn: (message: Message) => void) {
    this.page.exposeFunction(ExposedFn.OnAnyMessage, (message: Message) =>
      fn(message)
    ).then(_ => this.page.evaluate(
      () => {
        WAPI.addAllNewMessagesListener(window["onAnyMessage"]);
      }));
  }

  /**
   * Listens to messages received
   * @returns Observable stream of messages
   */
  public onStateChanged(fn: (state: string) => void) {
    this.page.exposeFunction(ExposedFn.onStateChanged, (state: string) =>
      fn(state)
    ).then(_ => this.page.evaluate(
      () => {
        WAPI.onStateChanged(s => window['onStateChanged'](s.state))
      }));
  }

  /**
   * set your about me
   * @param newStatus String new profile status
   */
  public async setMyStatus(newStatus: string) {
    return await this.page.evaluate(
      ({newStatus}) => {WAPI.setMyStatus(newStatus)},
      {newStatus}
      )
  }

  /**
   * Set your profile name
   * @param newName String new name to set for your profile
   */
   public async setMyName(newName: string) {
     return await this.page.evaluate(
       ({newName}) => {WAPI.setMyName(newName)},
       {newName}
       )
   }

   /**
    * Sets the chat state
    * @param {ChatState|0|1|2} chatState The state you want to set for the chat. Can be TYPING (0), RECRDING (1) or PAUSED (2).
    * @param {String} chatId 
    */
   public async setChatState(chatState: ChatState, chatId: String) {
    return await this.page.evaluate(
      ({chatState, chatId}) => {WAPI.setChatState(chatState, chatId)},
      //@ts-ignore
      {chatState, chatId}
      )
  }
    
  /**
   * Returns the connecction state
   * @returns Any of OPENING, PAIRING, UNPAIRED, UNPAIRED_IDLE, CONNECTED, TIMEOUT, CONFLICT, UNLAUNCHED, PROXYBLOCK, TOS_BLOCK, SMB_TOS_BLOCK, DEPRECATED_VERSION
   */
  public async getConnectionState() {
    //@ts-ignore
    return await this.page.evaluate(() => { return Store.State.default.state })
  }

  /**
   * Listens to messages acknowledgement Changes
   * @returns Observable stream of messages
   */
  public onAck(fn: (message: Message) => void) {
    this.page.exposeFunction(ExposedFn.onAck, (message: Message) =>
      fn(message)
    );
  }

  /**
   * Shuts down the page and browser
   * @returns true
   */
  public async kill() {
    console.log('Shutting Down');
    if (this.page) await this.page.close();
    if (this.page.browser) await this.page.browser().close();
    return true;
  }

  public async forceRefocus() {
    //255 is the address of 'use here'
    //@ts-ignore
    const useHere: string = await this.page.evaluate(() => { return window.l10n.localeStrings[window.l10n._locale.l][0][255] });
    await this.page.waitForFunction(
      `[...document.querySelectorAll("div[role=button")].find(e=>{return e.innerHTML.toLowerCase()==="${useHere.toLowerCase()}"})`,
      { timeout: 0 }
    );
    await this.page.evaluate(`[...document.querySelectorAll("div[role=button")].find(e=>{return e.innerHTML.toLowerCase()=="${useHere.toLowerCase()}"}).click()`);
  }

/**
 * Listens to live locations from a chat that already has valid live locations
 * @param chatId the chat from which you want to subscribes to live location updates
 * @param fn callback that takes in a LiveLocationChangedEvent
 * @returns boolean, if returns false then there were no valid live locations in the chat of chatId
 */
  public onLiveLocation(chatId: string, fn: (liveLocationChangedEvent: LiveLocationChangedEvent) => void) {
    const funcName = "onLiveLocation_" + chatId.replace('_', "").replace('_', "");
    return this.page.exposeFunction(funcName, (liveLocationChangedEvent: LiveLocationChangedEvent) =>
      fn(liveLocationChangedEvent)
    )
      .then(_ => this.page.evaluate(
        ({ chatId,funcName }) => {
        //@ts-ignore
          return WAPI.onLiveLocation(chatId, window[funcName]);
        },
        { chatId, funcName}
      ));
  }

  /**
   * Listens to add and remove evevnts on Groups
   * @param to group id: xxxxx-yyyy@us.c
   * @param to callback
   * @returns Observable stream of participantChangedEvent
   */
  public onParticipantsChanged(groupId: string, fn: (participantChangedEvent: ParticipantChangedEventModel) => void) {
    const funcName = "onParticipantsChanged_" + groupId.replace('_', "").replace('_', "");
    return this.page.exposeFunction(funcName, (participantChangedEvent: ParticipantChangedEventModel) =>
      fn(participantChangedEvent)
    )
      .then(_ => this.page.evaluate(
        ({ groupId,funcName }) => {
        //@ts-ignore
          WAPI.onParticipantsChanged(groupId, window[funcName]);
        },
        { groupId, funcName}
      ));
  }


  /**
   * Fires callback with Chat object every time the host phone is added to a group.
   * @param to callback
   * @returns Observable stream of Chats
   */
  public onAddedToGroup(fn: (chat: Chat) => void) {
    const funcName = "onAddedToGroup";
    return this.page.exposeFunction(funcName, (chat: Chat) =>
      fn(chat)
    )
      .then(_ => this.page.evaluate(
        (funcName ) => {
        //@ts-ignore
          WAPI.onAddedToGroup(window[funcName]);
        },
        {funcName}
      ));
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
        return WAPI.sendMessage(to, content);
      },
      { to, content }
    );
  }

  public async sendMessageWithThumb(
    thumb: string,
    url: string,
    title: string,
    description: string,
    chatId: string) {
    return await this.page.evaluate(
      ({ thumb,
        url,
        title,
        description,
        chatId
      }) => {
        WAPI.sendMessageWithThumb(thumb,
          url,
          title,
          description,
          chatId);
      },
      {
        thumb,
        url,
        title,
        description,
        chatId

      }
    );
  }


  /**
   * Sends a location message to given chat
   * @param to chat id: xxxxx@c.us
   * @param lat latitude: '51.5074'
   * @param lng longitude: '0.1278'
   * @param loc location text: 'LONDON!'
   */
  public async sendLocation(to: string, lat: any, lng: any, loc: string) {
    return await this.page.evaluate(
      ({ to, lat, lng, loc }) => {
        WAPI.sendLocation(to, lat, lng, loc);
      },
      { to, lat, lng, loc }
    );
  }

  /**
   * Get the generated user agent, this is so you can send it to the decryption module.
   * @returns String useragent of wa-web session
   */
  public async getGeneratedUserAgent(userA?: string) {
    let ua = userA || useragent;
    return await this.page.evaluate(
      (ua) => {
        WAPI.getGeneratedUserAgent(ua);
      },
      { ua }
    );
  }



  /**
   * Sends a image to given chat, with caption or not, using base64
   * @param to chat id xxxxx@us.c
   * @param base64 base64 data:image/xxx;base64,xxx
   * @param filename string xxxxx
   * @param caption string xxxxx
   */
  public async sendImage(
    to: string,
    base64: string,
    filename: string,
    caption: string
  ) {
    return await this.page.evaluate(
      ({ to, base64, filename, caption }) => {
        WAPI.sendImage(base64, to, filename, caption);
      },
      { to, base64, filename, caption }
    );
  }

  /**
   * 
   * @param to string chatid
   * @param content string reply text
   * @param quotedMsg string | Message the msg object or id to reply to.
   */
  public async reply(to: string, content: string, quotedMsg: any) {
    return await this.page.evaluate(
      ({ to, content, quotedMsg }) => {
        WAPI.reply(to, content, quotedMsg)
      },
      { to, content, quotedMsg }
    )
  }

  /**
   * Sends a file to given chat, with caption or not, using base64. This is exactly the same as sendImage
   * @param to chat id xxxxx@us.c
   * @param base64 base64 data:image/xxx;base64,xxx
   * @param filename string xxxxx
   * @param caption string xxxxx
   */
  public async sendFile(
    to: string,
    base64: string,
    filename: string,
    caption: string
  ) {
    return await this.page.evaluate(
      ({ to, base64, filename, caption }) => {
        WAPI.sendImage(base64, to, filename, caption);
      },
      { to, base64, filename, caption }
    );
  }


  /**
   * Sends a video to given chat as a gif, with caption or not, using base64
   * @param to chat id xxxxx@us.c
   * @param base64 base64 data:video/xxx;base64,xxx
   * @param filename string xxxxx
   * @param caption string xxxxx
   */
  public async sendVideoAsGif(
    to: string,
    base64: string,
    filename: string,
    caption: string
  ) {
    return await this.page.evaluate(
      ({ to, base64, filename, caption }) => {
        WAPI.sendVideoAsGif(base64, to, filename, caption);
      },
      { to, base64, filename, caption }
    );
  }

  /**
   * Sends a video to given chat as a gif by using a giphy link, with caption or not, using base64
   * @param to chat id xxxxx@us.c
   * @param giphyMediaUrl string https://media.giphy.com/media/oYtVHSxngR3lC/giphy.gif => https://i.giphy.com/media/oYtVHSxngR3lC/200w.mp4
   * @param caption string xxxxx
   */
  public async sendGiphy(
    to: string,
    giphyMediaUrl: string,
    caption: string
  ) {
    var ue = /^https?:\/\/media\.giphy\.com\/media\/([a-zA-Z0-9]+)/
    var n = ue.exec(giphyMediaUrl);
    if (n) {
      const r = `https://i.giphy.com/${n[1]}.mp4`;
      const filename = `${n[1]}.mp4`
      const base64 = await getBase64(r);
      return await this.page.evaluate(
        ({ to, base64, filename, caption }) => {
          WAPI.sendVideoAsGif(base64, to, filename, caption);
        },
        { to, base64, filename, caption }
      );
    } else {
      console.log('something is wrong with this giphy link');
      return;
    }
  }

/**
 * Returns an object with all of your host device details
 */
  public async getMe(){
    // return await this.page.evaluate(() => WAPI.getMe());
    //@ts-ignore
    return await this.page.evaluate(() => Store.Me.attributes);
  }


  /**
   * Find any product listings of the given number. Use this to query a catalog
   *
   * @param id id of buseinss profile (i.e the number with @c.us)
   * @param done Optional callback function for async execution
   * @returns None
   */
  public async getBusinessProfilesProducts(id: string) {
    return await this.page.evaluate(
      ({ id }) => {
        WAPI.getBusinessProfilesProducts(id);
      },
      { id }
    );
  }

  /**
   * Sends product with image to chat
   * @param imgBase64 Base64 image data
   * @param chatid string the id of the chat that you want to send this product to
   * @param caption string the caption you want to add to this message
   * @param bizNumber string the @c.us number of the business account from which you want to grab the product
   * @param productId string the id of the product within the main catalog of the aforementioned business
   * @param done - function - Callback function to be called contained the buffered messages.
   * @returns 
   */
  public async sendImageWithProduct(
    to: string,
    base64: string,
    caption: string,
    bizNumber: string,
    productId: string
  ) {
    return await this.page.evaluate(
      ({ to, base64, bizNumber, caption, productId }) => {
        WAPI.sendImageWithProduct(base64, to, caption, bizNumber, productId);
      },
      { to, base64, bizNumber, caption, productId }
    );
  }

  /**
   * Sends contact card to given chat id
   * @param {string} to 'xxxx@c.us'
   * @param {string|array} contact 'xxxx@c.us' | ['xxxx@c.us', 'yyyy@c.us', ...]
   */
  public async sendContact(to: string, contactId: string | string[]) {
    return await this.page.evaluate(
      ({ to, contactId }) => WAPI.sendContact(to, contactId),
      { to, contactId }
    );
  }


  /**
   * Simulate '...typing' in chat
   * @param {string} to 'xxxx@c.us'
   * @param {boolean} on turn on similated typing, false to turn it off you need to manually turn this off.
   */
  public async simulateTyping(to: string, on: boolean) {
    return await this.page.evaluate(
      ({ to, on }) => WAPI.simulateTyping(to, on),
      { to, on }
    );
  }


  /**
   * Forward an array of messages to a specific chat using the message ids or Objects
   *
   * @param {string} to '000000000000@c.us'
   * @param {string|array[Message | string]} messages this can be any mixture of message ids or message objects
   * @param {boolean} skipMyMessages This indicates whether or not to skip your own messages from the array
   */


  public async forwardMessages(to: string, messages: any, skipMyMessages: boolean) {
    return await this.page.evaluate(
      ({ to, messages, skipMyMessages }) => WAPI.forwardMessages(to, messages, skipMyMessages),
      { to, messages, skipMyMessages }
    );
  }

  /**
   * Retrieves all contacts
   * @returns array of [Contact]
   */
  public async getAllContacts() {
    return await this.page.evaluate(() => WAPI.getAllContacts());
  }

  public async getWAVersion() {
    return await this.page.evaluate(() => WAPI.getWAVersion());
  }

  /**
   * Retrieves if the phone is online. Please note that this may not be real time.
   * @returns Boolean
   */
  public async isConnected() {
    return await this.page.evaluate(() => WAPI.isConnected());
  }

  /**
   * Retrieves Battery Level
   * @returns Number
   */
  public async getBatteryLevel() {
    return await this.page.evaluate(() => WAPI.getBatteryLevel());
  }

  /**
   * Retrieves all chats
   * @returns array of [Chat]
   */
  public async getAllChats(withNewMessageOnly = false) {
    if (withNewMessageOnly) {
      return await this.page.evaluate(() =>
        WAPI.getAllChatsWithNewMsg()
      );
    } else {
      return await this.page.evaluate(() => WAPI.getAllChats());
    }
  }

  /**
   * Retrieves all chats with messages
   * @returns array of [Chat]
   */
  public async getAllChatsWithMessages(withNewMessageOnly = false) {
    return JSON.parse(await this.page.evaluate(withNewMessageOnly => WAPI.getAllChatsWithMessages(withNewMessageOnly), withNewMessageOnly));
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

  /**
   * Retrieves group members as [Id] objects
   * @param groupId group id
   */
  public async getGroupMembersId(groupId: string) {
    return await this.page.evaluate(
      groupId => WAPI.getGroupParticipantIDs(groupId),
      groupId
    );
  }

  /**
   * Removes the host device from the group
   * @param groupId group id
   */
  public async leaveGroup(groupId: string) {
    return await this.page.evaluate(
      groupId => WAPI.leaveGroup(groupId),
      groupId
    );
  }

  /**
   * Returns group members [Contact] objects
   * @param groupId
   */
  public async getGroupMembers(groupId: string) {
    const membersIds = await this.getGroupMembersId(groupId);
    const actions = membersIds.map(memberId => {
      return this.getContact(memberId._serialized);
    });
    return await Promise.all(actions);
  }

  /**
   * Retrieves contact detail object of given contact id
   * @param contactId
   * @returns contact detial as promise
   */
  //@ts-ignore
  public async getContact(contactId: string) {
    return await this.page.evaluate(
      contactId => WAPI.getContact(contactId),
      contactId
    );
  }

  /**
   * Retrieves chat object of given contact id
   * @param contactId
   * @returns contact detial as promise
   */
  public async getChatById(contactId: string) {
    return await this.page.evaluate(
      contactId => WAPI.getChatById(contactId),
      contactId
    );
  }

  /**
   * Retrieves chat object of given contact id
   * @param contactId
   * @returns contact detial as promise
   */
  public async getChat(contactId: string) {
    return await this.page.evaluate(
      contactId => WAPI.getChat(contactId),
      contactId
    );
  }

  /**
   * Retrieves chat picture
   * @param chatId
   * @returns Url of the chat picture or undefined if there is no picture for the chat.
   */
  public async getProfilePicFromServer(chatId: string) {
    return await this.page.evaluate(
      chatId => WAPI.getProfilePicFromServer(chatId),
      chatId
    );
  }

  
  /**
   * Sets a chat status to seen. Marks all messages as ack: 3
   * @param chatId chat id: xxxxx@us.c
   */
  public async sendSeen(chatId: string) {
    return await this.page.evaluate(
     chatId => WAPI.sendSeen(chatId),
      chatId
    );
  }


  /**
    * Load more messages in chat object from server. Use this in a while loop
   * @param contactId
   * @returns contact detial as promise
   */
  public async loadEarlierMessages(contactId: string) {
    return await this.page.evaluate(
      contactId => WAPI.loadEarlierMessages(contactId),
      contactId
    );
  }

/**
 * Get the status of a contact
 * @param contactId {string} to '000000000000@c.us'
 * returns: {id: string,status: string}
 */

public async getStatus(contactId: string) {
  return await this.page.evaluate(
    contactId => WAPI.getStatus(contactId),
    contactId
  );
}

  /**
    * Load all messages in chat object from server.
   * @param contactId
   * @returns contact detial as promise
   */
  public async asyncLoadAllEarlierMessages(contactId: string) {
    return await this.page.evaluate(
      contactId => WAPI.asyncLoadAllEarlierMessages(contactId),
      contactId
    );
  }

  /**
    * Load all messages in chat object from server.
   * @param contactId
   * @returns contact detial as promise
   */
  public async loadAllEarlierMessages(contactId: string) {
    return await this.page.evaluate(
      contactId => WAPI.loadAllEarlierMessages(contactId),
      contactId
    );
  }

  /**
   * Deletes message of given message id
   * @param contactId The chat id from which to delete the message.
   * @param messageId The specific message id of the message to be deleted
   * @param onlyLocal If it should only delete locally (message remains on the other recipienct's phone). Defaults to false.
   * @returns nothing
   */
  public async deleteMessage(contactId: string, messageId: string[] | string, onlyLocal : boolean = false) {
    return await this.page.evaluate(
      ({ contactId, messageId, onlyLocal }) => WAPI.smartDeleteMessages(contactId, messageId, onlyLocal),
      { contactId, messageId, onlyLocal }
    );
  }

  /**
   * Checks if a number is a valid whatsapp number
   * @param contactId, you need to include the @c.us at the end.
   * @returns contact detial as promise
   */
  public async checkNumberStatus(contactId: string) {
    return await this.page.evaluate(
      contactId => WAPI.checkNumberStatus(contactId),
      contactId
    );
  }

  /**
   * Retrieves all undread Messages
   * @param includeMe
   * @param includeNotifications
   * @param use_unread_count
   * @returns any
   */
  public async getUnreadMessages(includeMe: boolean, includeNotifications: boolean, use_unread_count: boolean) {
    return await this.page.evaluate(
      ({ includeMe, includeNotifications, use_unread_count }) => WAPI.getUnreadMessages(includeMe, includeNotifications, use_unread_count),
      { includeMe, includeNotifications, use_unread_count }
    );
  }


  /**
   * Retrieves all new Messages. where isNewMsg==true
   * @returns list of messages
   */
  public async getAllNewMessages() {
    return JSON.parse(await this.page.evaluate(() => WAPI.getAllNewMessages()));
  }

  /**
   * Retrieves all unread Messages. where ack==-1
   * @returns list of messages
   */
  public async getAllUnreadMessages() {
    return JSON.parse(await this.page.evaluate(() => WAPI.getAllUnreadMessages()));
  }

  /**
   * Retrieves all Messages in a chat
   * @param chatId, the chat to get the messages from
   * @param includeMe, include my own messages? boolean
   * @param includeNotifications
   * @returns any
   */

  public async getAllMessagesInChat(chatId: string, includeMe: boolean, includeNotifications: boolean) {
    return await this.page.evaluate(
      ({ chatId, includeMe, includeNotifications }) => WAPI.getAllMessagesInChat(chatId, includeMe, includeNotifications),
      { chatId, includeMe, includeNotifications }
    );
  }

  /**
   * loads and Retrieves all Messages in a chat
   * @param chatId, the chat to get the messages from
   * @param includeMe, include my own messages? boolean
   * @param includeNotifications
   * @returns any
   */

  public async loadAndGetAllMessagesInChat(chatId: string, includeMe: boolean, includeNotifications: boolean) {
    return await this.page.evaluate(
      ({ chatId, includeMe, includeNotifications }) => WAPI.loadAndGetAllMessagesInChat(chatId, includeMe, includeNotifications),
      { chatId, includeMe, includeNotifications }
    );
  }

  /**
   * Sends a text message to given chat
   * @param to group name: 'New group'
   * @param contacts: A single contact id or an array of contact ids.
   */
  public async createGroup(groupName:string,contacts:string|string[]){
    return await this.page.evaluate(
      ({ groupName, contacts }) => {
        WAPI.createGroup(groupName, contacts);
      },
      { groupName, contacts }
    );
  }

  /**
   * Remove participant of Group
   * @param {*} idGroup '0000000000-00000000@g.us'
   * @param {*} idParticipant '000000000000@c.us'
   * @param {*} done - function - Callback function to be called when a new message arrives.
   */

  public async removeParticipant(idGroup: string, idParticipant: string) {
    return await this.page.evaluate(
      ({ idGroup, idParticipant }) => WAPI.removeParticipant(idGroup, idParticipant),
      { idGroup, idParticipant }
    );
  }

  /**
  * Add participant to Group
  * @param {*} idGroup '0000000000-00000000@g.us'
  * @param {*} idParticipant '000000000000@c.us'
  * @param {*} done - function - Callback function to be called when a new message arrives.
  */

  public async addParticipant(idGroup: string, idParticipant: string) {
    return await this.page.evaluate(
      ({ idGroup, idParticipant }) => WAPI.addParticipant(idGroup, idParticipant),
      { idGroup, idParticipant }
    );
  }

  /**
  * Promote Participant to Admin in Group
  * @param {*} idGroup '0000000000-00000000@g.us'
  * @param {*} idParticipant '000000000000@c.us'
  * @param {*} done - function - Callback function to be called when a new message arrives.
  */

  public async promoteParticipant(idGroup: string, idParticipant: string) {
    return await this.page.evaluate(
      ({ idGroup, idParticipant }) => WAPI.promoteParticipant(idGroup, idParticipant),
      { idGroup, idParticipant }
    );
  }

  /**
  * Demote Admin of Group
  * @param {*} idGroup '0000000000-00000000@g.us'
  * @param {*} idParticipant '000000000000@c.us'
  * @param {*} done - function - Callback function to be called when a new message arrives.
  */
  public async demoteParticipant(idGroup: string, idParticipant: string) {
    return await this.page.evaluate(
      ({ idGroup, idParticipant }) => WAPI.demoteParticipant(idGroup, idParticipant),
      { idGroup, idParticipant }
    );
  }

  /**
  * Get Admins of a Group
  * @param {*} idGroup '0000000000-00000000@g.us'
  */
  public async getGroupAdmins(idGroup: string) {
    return await this.page.evaluate(
      (idGroup) => WAPI.getGroupAdmins(idGroup),
      idGroup
    );
  }
}

export { useragent } from '../config/puppeteer.config'