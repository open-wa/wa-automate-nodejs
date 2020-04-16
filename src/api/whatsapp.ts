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
import sharp from 'sharp';

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

function base64MimeType(encoded) {
  var result = null;

  if (typeof encoded !== 'string') {
    return result;
  }

  var mime = encoded.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/);

  if (mime && mime.length) {
    result = mime[1];
  }

  return result;
}

declare module WAPI {
  const waitNewMessages: (rmCallback: boolean, callback: Function) => void;
  const addAllNewMessagesListener: (callback: Function) => void;
  const onStateChanged: (callback: Function) => void;
  const onIncomingCall: (callback: Function) => any;
  const onAddedToGroup: (callback: Function) => any;
  const onBattery: (callback: Function) => any;
  const onParticipantsChanged: (groupId: string, callback: Function) => any;
  const onLiveLocation: (chatId: string, callback: Function) => any;
  const sendMessage: (to: string, content: string) => string;
  const sendMessageWithMentions: (to: string, content: string) => Promise<string>;
  const setChatState: (chatState: ChatState, chatId: string) => void;
  const reply: (to: string, content: string, quotedMsg: string | Message) => void;
  const getGeneratedUserAgent: (userAgent?: string) => string;
  const forwardMessages: (to: string, messages: string | (string | Message)[], skipMyMessages: boolean) => any;
  const sendLocation: (to: string, lat: any, lng: any, loc: string) => void;
  const addParticipant: (groupId: string, contactId: string) => void;
  const setMyName: (newName: string) => void;
  const setMyStatus: (newStatus: string) => void;
  const setPresence: (available: boolean) => void;
  const getStatus: (contactId: string) => void;
  const getGroupAdmins: (groupId: string) => Promise<Contact[]>;
  const removeParticipant: (groupId: string, contactId: string) => Promise<boolean>;
  const addOrRemoveLabels: (label: string, id: string, type: string) => Promise<boolean>;
  const promoteParticipant: (groupId: string, contactId: string) => Promise<boolean>;
  const demoteParticipant: (groupId: string, contactId: string) => Promise<boolean>;
  const setGroupToAdminsOnly: (groupId: string, onlyAdmins: boolean) => Promise<boolean>;
  const setGroupEditToAdminsOnly: (groupId: string, onlyAdmins: boolean) => Promise<boolean>;
  const sendImageAsSticker: (webpBase64: string, to: string, metadata?: any) => Promise<any>;
  const createGroup: (groupName: string, contactId: string|string[]) => Promise<any>;
  const sendSeen: (to: string) => Promise<boolean>;
  const isChatOnline: (id: string) => Promise<boolean>;
  const contactBlock: (id: string) => Promise<boolean>;
  const contactUnblock: (id: string) => Promise<boolean>;
  const deleteConversation: (chatId: string) => Promise<boolean>;
  const clearChat: (chatId: string) => Promise<any>;
  const revokeGroupInviteLink: (chatId: string) => Promise<string> | Promise<boolean>;
  const getGroupInviteLink: (chatId: string) => Promise<string>;
  const sendImage: (
    base64: string,
    to: string,
    filename: string,
    caption: string
  ) => Promise<string>;
  const sendMessageWithThumb: (
    thumb: string,
    url: string,
    title: string,
    description: string,
    text: string,
    chatId: string
  ) => Promise<boolean>;
  const getBusinessProfilesProducts: (to: string) => Promise<any>;
  const postStatus: (text: string, params: any) => Promise<any>;
  const deleteStatus: (statusesToDelete: string | string[]) => Promise<any>;
  const sendImageWithProduct: (base64: string, to: string, caption: string, bizNumber: string, productId: string) => any;
  const sendVCard: (chatId: string, vcardString: string, contactName: string, contactNumber?: string) => Promise<boolean>;
  const sendFile: (
    base64: string,
    to: string,
    filename: string,
    caption: string
  ) => Promise<string>;
  const sendVideoAsGif: (
    base64: string,
    to: string,
    filename: string,
    caption: string
  ) => Promise<string>;
  const getAllContacts: () => Contact[];
  const getWAVersion: () => String;
  const getMe: () => any;
  const deleteAllStatus: () => Promise<boolean>;
  const getMyStatusArray: () => Promise<any>;
  const getAllUnreadMessages: () => any;
  const getIndicatedNewMessages: () => any;
  const getAllChatsWithMessages: (withNewMessageOnly?: boolean) => any;
  const getAllChats: () => any;
  const getBatteryLevel: () => Number;
  const getChat: (contactId: string) => Chat;
  const getLastSeen: (contactId: string) => Promise<number>;
  const getProfilePicFromServer: (chatId: string) => any;
  const getAllChatIds: () => string[];
  const getAllChatsWithNewMsg: () => Chat[];
  const getAllNewMessages: () => any;
  const getAllGroups: () => Chat[];
  const getGroupParticipantIDs: (groupId: string) => Promise<Id[]>;
  const leaveGroup: (groupId: string) => any;
  const getVCards: (msgId: string) => any;
  const getContact: (contactId: string) => Contact;
  const checkNumberStatus: (contactId: string) => any;
  const getChatById: (contactId: string) => Chat;
  const smartDeleteMessages: (contactId: string, messageId: string[] | string, onlyLocal:boolean) => any;
  const sendContact: (to: string, contact: string | string[]) => any;
  const simulateTyping: (to: string, on: boolean) => Promise<boolean>;
  const archiveChat: (id: string, archive: boolean) => Promise<boolean>;
  const isConnected: () => Boolean;
  const loadEarlierMessages: (contactId: string) => Promise<Message []>;
  const loadAllEarlierMessages: (contactId: string) => any;
  const asyncLoadAllEarlierMessages: (contactId: string) => any;
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
  _loadedModules: any[];

  /**
   * @param page [Page] [Puppeteer Page]{@link https://pptr.dev/#?product=Puppeteer&version=v2.1.1&show=api-class-page} running web.whatsapp.com
   */
  constructor(public page: Page) {
    this.page = page;
    this._loadedModules = [];
  }

  /**
   * @event Listens to messages received
   * @fires Observable stream of messages
   */
  public onMessage(fn: (message: Message) => void) {
    this.page.exposeFunction(ExposedFn.OnMessage, (message: Message) =>
      fn(message)
    );
  }

  /**
   * @event Listens to all new messages
   * @param to callback
   * @fires Message 
   */
  public async onAnyMessage(fn: (message: Message) => void) {
    this.page.exposeFunction(ExposedFn.OnAnyMessage, (message: Message) =>
      fn(message)
    ).then(_ => this.page.evaluate(
      () => {
        WAPI.addAllNewMessagesListener(window["onAnyMessage"]);
      }));
  }

  /** @event Listens to battery changes
   * @param fn callback
   * @fires number
   */
  public async onBattery(fn: (battery:number) => void) {
    this.page.exposeFunction('onBattery', (battery: number) =>
      fn(battery)
    ).then(_ => this.page.evaluate(
      () => {
        WAPI.onBattery(window["onBattery"]);
      }));
  }

  /**
   * @event Listens to messages received
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
   * @event Listens to new incoming calls
   * @returns Observable stream of call request objects
   */
  public onIncomingCall(fn: (call: any) => void) {
    this.page.exposeFunction('onIncomingCall', (call: any) =>
      fn(call)
    ).then(_ => this.page.evaluate(
      () => {
        WAPI.onIncomingCall(call => window['onIncomingCall'](call))
      }));
  }

  /**
   * Set presence to available or unavailable.
   * @param available if true it will set your presence to 'online', false will set to unavailable (i.e no 'online' on recipients' phone);
   */
  public async setPresence(available: boolean) {
    return await this.page.evaluate(
      available => {WAPI.setPresence(available)},
      available
      )
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
   * Adds label from chat, message or contact. Only for business accounts.
   * @param label: either the id or the name of the label. id will be something simple like anhy nnumber from 1-10, name is the label of the label if that makes sense.
   * @param id The Chat, message or contact id to which you want to add a label
   */
  public async addLabel(label: string, id: string) {
    return await this.page.evaluate(
      ({label, id}) => {WAPI.addOrRemoveLabels(label, id, 'add')},
      {label, id}
      )
  }

  /**
   * Removes label from chat, message or contact. Only for business accounts.
   * @param label: either the id or the name of the label. id will be something simple like anhy nnumber from 1-10, name is the label of the label if that makes sense.
   * @param id The Chat, message or contact id to which you want to add a label
   */
  public async removeLabel(label: string, id: string) {
    return await this.page.evaluate(
      ({label, id}) => {WAPI.addOrRemoveLabels(label, id, 'remove')},
      {label, id}
      )
  }

/**
 * Send VCARD
 *
 * @param {string} chatId '000000000000@c.us'
 * @param {string} vcard vcard as a string
 * @param {string} contactName The display name for the contact. CANNOT BE NULL OTHERWISE IT WILL SEND SOME RANDOM CONTACT FROM YOUR ADDRESS BOOK.
 * @param {string} contactNumber If supplied, this will be injected into the vcard (VERSION 3 ONLY FROM VCARDJS) with the whatsapp id to make it show up with the correct buttins on whatsapp. The format of this param should be including country code, without any other formating. e.g:
 * `4477777777777`
 */
  public async sendVCard(chatId: string, vcard: string, contactName:string,  contactNumber?: string) {
    return await this.page.evaluate(
      ({chatId, vcard, contactName, contactNumber}) => {WAPI.sendVCard(chatId, vcard,contactName, contactNumber)},
      {chatId, vcard, contactName, contactNumber}
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
   * @event Listens to messages acknowledgement Changes
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
    const useHere: string = await this.page.evaluate(() => { return window.l10n.localeStrings[window.l10n._locale.l][0][window.l10n.localeStrings['en']?.[0].findIndex((x:string)=>x.toLowerCase()=='use here') || 260] });
    await this.page.waitForFunction(
      `[...document.querySelectorAll("div[role=button")].find(e=>{return e.innerHTML.toLowerCase()==="${useHere.toLowerCase()}"})`,
      { timeout: 0 }
    );
    await this.page.evaluate(`[...document.querySelectorAll("div[role=button")].find(e=>{return e.innerHTML.toLowerCase()=="${useHere.toLowerCase()}"}).click()`);
  }

/**
 * @event Listens to live locations from a chat that already has valid live locations
 * @param chatId the chat from which you want to subscribes to live location updates
 * @param fn callback that takes in a LiveLocationChangedEvent
 * @returns boolean, if returns false then there were no valid live locations in the chat of chatId
 * @emits <LiveLocationChangedEvent> LiveLocationChangedEvent
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
   * @event Listens to add and remove evevnts on Groups
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
   * @event Fires callback with Chat object every time the host phone is added to a group.
   * @param to callback
   * @returns Observable stream of Chats
   */
  public onAddedToGroup(fn: (chat: Chat) => any) {
    const funcName = "onAddedToGroup";
    return this.page.exposeFunction(funcName, (chat: any) =>
      fn(chat)
    )
      .then(_ => this.page.evaluate(
        () => {
        //@ts-ignore
          WAPI.onAddedToGroup(window.onAddedToGroup);
        }
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
  

  /**
   * Sends a text message to given chat that includes mentions.
   * In order to use this method correctly you will need to send the text like this:
   * "@4474747474747 how are you?"
   * Basically, add a @ symbol before the number of the contact you want to mention.
   * @param to chat id: xxxxx@us.c
   * @param content text message
   */
  public async sendTextWithMentions(to: string, content: string) {
    return await this.page.evaluate(
      ({ to, content }) => {
        WAPI.sendSeen(to);
        return WAPI.sendMessageWithMentions(to, content);
      },
      { to, content }
    );
  }

  /**
   * Sends a link to a chat that includes a link preview.
   * @param thumb The base 64 data of the image you want to use as the thunbnail. This should be no more than 200x200px. Note: Dont need data uri on this param
   * @param url The link you want to send
   * @param title The title of the link
   * @param description The long description of the link preview
   * @param text The text you want to inslude in the message section. THIS HAS TO INCLUDE THE URL otherwise the url will be prepended to the text automatically.
   * @param chatId The chat you want to send this message to.
   * 
   */
  public async sendMessageWithThumb(
    thumb: string,
    url: string,
    title: string,
    description: string,
    text: string,
    chatId: string) {
    return await this.page.evaluate(
      ({ thumb,
        url,
        title,
        description,
        text,
        chatId
      }) => {
        WAPI.sendMessageWithThumb(thumb,
          url,
          title,
          description,
          text,
          chatId);
      },
      {
        thumb,
        url,
        title,
        description,
        text,
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
      ({ua}) => WAPI.getGeneratedUserAgent(ua),
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
   * Post a status (story). Right now it is only white text on a black background. [Currently Paywalled](https://github.com/open-wa/wa-automate-nodejs#starting-a-conversation) [Only requires donation for immediate access - not membership]. Due for General Availability on 1st May 2020.
   *
   * @param text string The message you want to send on your story.
   * @returns response e.g{ status: 200, t: 1586626288 } or false if you do not have access to this function
   */
  public async postStatus(text: string) {
    return await this.page.evaluate(
      ({ text }) => WAPI.postStatus(text, {}),
      { text }
    );
  }

/**
 * Consumes a list of id strings of statuses to delete.
 * @param statusesToDelete string [] | stringan array of ids of statuses to delete.
 * @returns boolean. True if it worked.
 */
  public async deleteStatus(statusesToDelete: string | string []) {
    return await this.page.evaluate(
      ({ statusesToDelete }) => WAPI.deleteStatus(statusesToDelete),
      { statusesToDelete }
    );
  }

/**
 * Deletes all your existing statuses.
 * @returns boolean. True if it worked.
 */
  public async deleteAllStatus() {
    return await this.page.evaluate(() => WAPI.deleteAllStatus());
  }

    /**
     * Retreives all existing statuses.
     */
  public async getMyStatusArray() {
    return await this.page.evaluate(() => WAPI.getMyStatusArray());
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
   * @param id The id of the conversation
   * @param archive boolean true => archive, false => unarchive
   * @return boolean true: worked, false: didnt work (probably already in desired state)
   */
  public async archiveChat(id: string, archive: boolean) {
    return await this.page.evaluate(
      ({ id, archive }) => WAPI.archiveChat(id, archive),
      { id, archive }
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
 * Block contact 
 * @param {string} id '000000000000@c.us'
 */
public async contactBlock(id: string) {
  return await this.page.evaluate(id => WAPI.contactBlock(id),id)
}

/**
 * Unblock contact 
 * @param {string} id '000000000000@c.us'
 */
public async contactUnblock(id: string) {
  return await this.page.evaluate(id => WAPI.contactUnblock(id),id)
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
 * Extracts vcards from a message.This works on messages of typ `vcard` or `multi_vcard`
 * @param msgId string id of the message to extract the vcards from
 * @returns [vcard] 
 * ```
 * [
 * {
 * displayName:"Contact name",
 * vcard: "loong vcard string"
 * }
 * ]
 * ``` 
 * or false if no valid vcards found.
 * 
 * Please use [vcf](https://www.npmjs.com/package/vcf) to convert a vcard string into a json object
 */
  public async getVCards(msgId: string) {
    return await this.page.evaluate(
      msgId => WAPI.getVCards(msgId),
      msgId
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
   * Retrieves the epoch timestamp of the time the contact was last seen. This will not work if:
   * 1. They have set it so you cannot see their last seen via privacy settings.
   * 2. You do not have an existing chat with the contact.
   * 3. The chatId is for a group
   * In both of those instances this method will return undefined.
   * @param chatId
   * @returns number timestamp when chat was last online or undefined.
   */
  public async getLastSeen(chatId: string) {
    return await this.page.evaluate(
      chatId => WAPI.getLastSeen(chatId),
      chatId
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
   * SChecks if a chat contact is online. Not entirely sure if this works with groups.
   * @param chatId chat id: xxxxx@us.c
   */
  public async isChatOnline(chatId: string) {
    return await this.page.evaluate(
     chatId => WAPI.isChatOnline(chatId),
      chatId
    );
  }


  /**
    * Load more messages in chat object from server. Use this in a while loop. This should return up to 50 messages at a time
   * @param contactId
   * @returns Message []
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
    * Delete the conversation from your whatsapp
   * @param chatId
   * @returns boolean
   */
  public async deleteChat(chatId: string) {
    return await this.page.evaluate(
      chatId => WAPI.deleteConversation(chatId),
      chatId
    );
  }

  /**
    * Delete all messages from the chat.
   * @param chatId
   * @returns boolean
   */
  public async clearChat(chatId: string) {
    return await this.page.evaluate(
      chatId => WAPI.clearChat(chatId),
      chatId
    );
  }

  /**
    * Retreives an invite link for a group chat. returns false if chat is not a group.
   * @param chatId
   * @returns Promise<string>
   */
  public async getGroupInviteLink(chatId: string) {
    return await this.page.evaluate(
      chatId => WAPI.getGroupInviteLink(chatId),
      chatId
    );
  }

  /**
    * Revokes the current invite link for a group chat. Any previous links will stop working
   * @param chatId
   * @returns Promise<boolean>
   */
  public async revokeGroupInviteLink(chatId: string) {
    return await this.page.evaluate(
      chatId => WAPI.revokeGroupInviteLink(chatId),
      chatId
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
   * Retrieves all unread Messages as indicated by the red dots in whatsapp web. This returns an array of objects and are structured like so:
   * ```javascript
   * [{
   * "id": "000000000000@g.us", //the id of the chat
   * "indicatedNewMessages": [] //array of messages, not including any messages by the host phone
   * }]
   * ```
   * @returns list of messages
   */
  public async getIndicatedNewMessages() {
    return JSON.parse(await this.page.evaluate(() => WAPI.getIndicatedNewMessages()));
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
   * @returns Promise<GroupCreationResponse> :
   * ```javascript
   * {
   *   status: 200,
   *   gid: {
   *     server: 'g.us',
   *     user: '447777777777-1583678870',
   *     _serialized: '447777777777-1583678870@g.us'
   *   },
   *   participants: [
   *     { '447777777777@c.us': [Object] },
   *     { '447444444444@c.us': [Object] }
   *   ]
   * }
   * ```
   */
  public async createGroup(groupName:string,contacts:string|string[]){
    return await this.page.evaluate(
      ({ groupName, contacts }) => WAPI.createGroup(groupName, contacts),
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
  */
  public async demoteParticipant(idGroup: string, idParticipant: string) {
    return await this.page.evaluate(
      ({ idGroup, idParticipant }) => WAPI.demoteParticipant(idGroup, idParticipant),
      { idGroup, idParticipant }
    );
  }

  /**
  * Change who can and cannot speak in a group
  * @param groupId '0000000000-00000000@g.us' the group id.
  * @param onlyAdmins boolean set to true if you want only admins to be able to speak in this group. false if you want to allow everyone to speak in the group
  * @returns boolean true if action completed successfully.
  */
  public async setGroupToAdminsOnly(groupId: string, onlyAdmins: boolean) {
    return await this.page.evaluate(
      ({ groupId, onlyAdmins }) => WAPI.setGroupToAdminsOnly(groupId, onlyAdmins),
      { groupId, onlyAdmins }
    );
  }

  /**
  * Change who can and cannot edit a groups details
  * @param groupId '0000000000-00000000@g.us' the group id.
  * @param onlyAdmins boolean set to true if you want only admins to be able to speak in this group. false if you want to allow everyone to speak in the group
  * @returns boolean true if action completed successfully.
  */
 public async setGroupEditToAdminsOnly(groupId: string, onlyAdmins: boolean) {
  return await this.page.evaluate(
    ({ groupId, onlyAdmins }) => WAPI.setGroupEditToAdminsOnly(groupId, onlyAdmins),
    { groupId, onlyAdmins }
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

  /**
   * This function takes an image and sends it as a sticker to the recipient. This is helpful for sending semi-ephemeral things like QR codes. 
   * The advantage is that it will not show up in the recipients gallery. This function automatiicaly converts images to the required webp format.
   * @param b64: This is the base64 string formatted with data URI. You can also send a plain base64 string but it may result in an error as the function will not be able to determine the filetype before sending.
   * @param to: The recipient id.
   */
  public async sendImageAsSticker(b64: string,to: string){
    if(!this._loadedModules.includes('jsSha')) {
      await this.page.evaluate(x=>eval(x),`'use strict';(function(I){function w(c,a,d){var l=0,b=[],g=0,f,n,k,e,h,q,y,p,m=!1,t=[],r=[],u,z=!1;d=d||{};f=d.encoding||"UTF8";u=d.numRounds||1;if(u!==parseInt(u,10)||1>u)throw Error("numRounds must a integer >= 1");if(0===c.lastIndexOf("SHA-",0))if(q=function(b,a){return A(b,a,c)},y=function(b,a,l,f){var g,e;if("SHA-224"===c||"SHA-256"===c)g=(a+65>>>9<<4)+15,e=16;else throw Error("Unexpected error in SHA-2 implementation");for(;b.length<=g;)b.push(0);b[a>>>5]|=128<<24-a%32;a=a+l;b[g]=a&4294967295;b[g-1]=a/4294967296|0;l=b.length;for(a=0;a<l;a+=e)f=A(b.slice(a,a+e),f,c);if("SHA-224"===c)b=[f[0],f[1],f[2],f[3],f[4],f[5],f[6]];else if("SHA-256"===c)b=f;else throw Error("Unexpected error in SHA-2 implementation");return b},p=function(b){return b.slice()},"SHA-224"===c)h=512,e=224;else if("SHA-256"===c)h=512,e=256;else throw Error("Chosen SHA variant is not supported");else throw Error("Chosen SHA variant is not supported");k=B(a,f);n=x(c);this.setHMACKey=function(b,a,g){var e;if(!0===m)throw Error("HMAC key already set");if(!0===z)throw Error("Cannot set HMAC key after calling update");f=(g||{}).encoding||"UTF8";a=B(a,f)(b);b=a.binLen;a=a.value;e=h>>>3;g=e/4-1;if(e<b/8){for(a=y(a,b,0,x(c));a.length<=g;)a.push(0);a[g]&=4294967040}else if(e>b/8){for(;a.length<=g;)a.push(0);a[g]&=4294967040}for(b=0;b<=g;b+=1)t[b]=a[b]^909522486,r[b]=a[b]^1549556828;n=q(t,n);l=h;m=!0};this.update=function(a){var c,f,e,d=0,p=h>>>5;c=k(a,b,g);a=c.binLen;f=c.value;c=a>>>5;for(e=0;e<c;e+=p)d+h<=a&&(n=q(f.slice(e,e+p),n),d+=h);l+=d;b=f.slice(d>>>5);g=a%h;z=!0};this.getHash=function(a,f){var d,h,k,q;if(!0===m)throw Error("Cannot call getHash after setting HMAC key");k=C(f);switch(a){case"HEX":d=function(a){return D(a,e,k)};break;case"B64":d=function(a){return E(a,e,k)};break;case"BYTES":d=function(a){return F(a,e)};break;case"ARRAYBUFFER":try{h=new ArrayBuffer(0)}catch(v){throw Error("ARRAYBUFFER not supported by this environment");}d=function(a){return G(a,e)};break;default:throw Error("format must be HEX, B64, BYTES, or ARRAYBUFFER");}q=y(b.slice(),g,l,p(n));for(h=1;h<u;h+=1)q=y(q,e,0,x(c));return d(q)};this.getHMAC=function(a,f){var d,k,t,u;if(!1===m)throw Error("Cannot call getHMAC without first setting HMAC key");t=C(f);switch(a){case"HEX":d=function(a){return D(a,e,t)};break;case"B64":d=function(a){return E(a,e,t)};break;case"BYTES":d=function(a){return F(a,e)};break;case"ARRAYBUFFER":try{d=new ArrayBuffer(0)}catch(v){throw Error("ARRAYBUFFER not supported by this environment");}d=function(a){return G(a,e)};break;default:throw Error("outputFormat must be HEX, B64, BYTES, or ARRAYBUFFER");}k=y(b.slice(),g,l,p(n));u=q(r,x(c));u=y(k,e,h,u);return d(u)}}function m(){}function D(c,a,d){var l="";a/=8;var b,g;for(b=0;b<a;b+=1)g=c[b>>>2]>>>8*(3+b%4*-1),l+="0123456789abcdef".charAt(g>>>4&15)+"0123456789abcdef".charAt(g&15);return d.outputUpper?l.toUpperCase():l}function E(c,a,d){var l="",b=a/8,g,f,n;for(g=0;g<b;g+=3)for(f=g+1<b?c[g+1>>>2]:0,n=g+2<b?c[g+2>>>2]:0,n=(c[g>>>2]>>>8*(3+g%4*-1)&255)<<16|(f>>>8*(3+(g+1)%4*-1)&255)<<8|n>>>8*(3+(g+2)%4*-1)&255,f=0;4>f;f+=1)8*g+6*f<=a?l+="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".charAt(n>>>6*(3-f)&63):l+=d.b64Pad;return l}function F(c,a){var d="",l=a/8,b,g;for(b=0;b<l;b+=1)g=c[b>>>2]>>>8*(3+b%4*-1)&255,d+=String.fromCharCode(g);return d}function G(c,a){var d=a/8,l,b=new ArrayBuffer(d),g;g=new Uint8Array(b);for(l=0;l<d;l+=1)g[l]=c[l>>>2]>>>8*(3+l%4*-1)&255;return b}function C(c){var a={outputUpper:!1,b64Pad:"=",shakeLen:-1};c=c||{};a.outputUpper=c.outputUpper||!1;!0===c.hasOwnProperty("b64Pad")&&(a.b64Pad=c.b64Pad);if("boolean"!==typeof a.outputUpper)throw Error("Invalid outputUpper formatting option");if("string"!==typeof a.b64Pad)throw Error("Invalid b64Pad formatting option");return a}function B(c,a){var d;switch(a){case"UTF8":case"UTF16BE":case"UTF16LE":break;default:throw Error("encoding must be UTF8, UTF16BE, or UTF16LE");}switch(c){case"HEX":d=function(a,b,c){var f=a.length,d,k,e,h,q;if(0!==f%2)throw Error("String of HEX type must be in byte increments");b=b||[0];c=c||0;q=c>>>3;for(d=0;d<f;d+=2){k=parseInt(a.substr(d,2),16);if(isNaN(k))throw Error("String of HEX type contains invalid characters");h=(d>>>1)+q;for(e=h>>>2;b.length<=e;)b.push(0);b[e]|=k<<8*(3+h%4*-1)}return{value:b,binLen:4*f+c}};break;case"TEXT":d=function(c,b,d){var f,n,k=0,e,h,q,m,p,r;b=b||[0];d=d||0;q=d>>>3;if("UTF8"===a)for(r=3,e=0;e<c.length;e+=1)for(f=c.charCodeAt(e),n=[],128>f?n.push(f):2048>f?(n.push(192|f>>>6),n.push(128|f&63)):55296>f||57344<=f?n.push(224|f>>>12,128|f>>>6&63,128|f&63):(e+=1,f=65536+((f&1023)<<10|c.charCodeAt(e)&1023),n.push(240|f>>>18,128|f>>>12&63,128|f>>>6&63,128|f&63)),h=0;h<n.length;h+=1){p=k+q;for(m=p>>>2;b.length<=m;)b.push(0);b[m]|=n[h]<<8*(r+p%4*-1);k+=1}else if("UTF16BE"===a||"UTF16LE"===a)for(r=2,n="UTF16LE"===a&&!0||"UTF16LE"!==a&&!1,e=0;e<c.length;e+=1){f=c.charCodeAt(e);!0===n&&(h=f&255,f=h<<8|f>>>8);p=k+q;for(m=p>>>2;b.length<=m;)b.push(0);b[m]|=f<<8*(r+p%4*-1);k+=2}return{value:b,binLen:8*k+d}};break;case"B64":d=function(a,b,c){var f=0,d,k,e,h,q,m,p;if(-1===a.search(/^[a-zA-Z0-9=+\/]+$/))throw Error("Invalid character in base-64 string");k=a.indexOf("=");a=a.replace(/\=/g,"");if(-1!==k&&k<a.length)throw Error("Invalid '=' found in base-64 string");b=b||[0];c=c||0;m=c>>>3;for(k=0;k<a.length;k+=4){q=a.substr(k,4);for(e=h=0;e<q.length;e+=1)d="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".indexOf(q[e]),h|=d<<18-6*e;for(e=0;e<q.length-1;e+=1){p=f+m;for(d=p>>>2;b.length<=d;)b.push(0);b[d]|=(h>>>16-8*e&255)<<8*(3+p%4*-1);f+=1}}return{value:b,binLen:8*f+c}};break;case"BYTES":d=function(a,b,c){var d,n,k,e,h;b=b||[0];c=c||0;k=c>>>3;for(n=0;n<a.length;n+=1)d=a.charCodeAt(n),h=n+k,e=h>>>2,b.length<=e&&b.push(0),b[e]|=d<<8*(3+h%4*-1);return{value:b,binLen:8*a.length+c}};break;case"ARRAYBUFFER":try{d=new ArrayBuffer(0)}catch(l){throw Error("ARRAYBUFFER not supported by this environment");}d=function(a,b,c){var d,n,k,e,h;b=b||[0];c=c||0;n=c>>>3;h=new Uint8Array(a);for(d=0;d<a.byteLength;d+=1)e=d+n,k=e>>>2,b.length<=k&&b.push(0),b[k]|=h[d]<<8*(3+e%4*-1);return{value:b,binLen:8*a.byteLength+c}};break;default:throw Error("format must be HEX, TEXT, B64, BYTES, or ARRAYBUFFER");}return d}function r(c,a){return c>>>a|c<<32-a}function J(c,a,d){return c&a^~c&d}function K(c,a,d){return c&a^c&d^a&d}function L(c){return r(c,2)^r(c,13)^r(c,22)}function M(c){return r(c,6)^r(c,11)^r(c,25)}function N(c){return r(c,7)^r(c,18)^c>>>3}function O(c){return r(c,17)^r(c,19)^c>>>10}function P(c,a){var d=(c&65535)+(a&65535);return((c>>>16)+(a>>>16)+(d>>>16)&65535)<<16|d&65535}function Q(c,a,d,l){var b=(c&65535)+(a&65535)+(d&65535)+(l&65535);return((c>>>16)+(a>>>16)+(d>>>16)+(l>>>16)+(b>>>16)&65535)<<16|b&65535}function R(c,a,d,l,b){var g=(c&65535)+(a&65535)+(d&65535)+(l&65535)+(b&65535);return((c>>>16)+(a>>>16)+(d>>>16)+(l>>>16)+(b>>>16)+(g>>>16)&65535)<<16|g&65535}function x(c){var a=[],d;if(0===c.lastIndexOf("SHA-",0))switch(a=[3238371032,914150663,812702999,4144912697,4290775857,1750603025,1694076839,3204075428],d=[1779033703,3144134277,1013904242,2773480762,1359893119,2600822924,528734635,1541459225],c){case"SHA-224":break;case"SHA-256":a=d;break;case"SHA-384":a=[new m,new m,new m,new m,new m,new m,new m,new m];break;case"SHA-512":a=[new m,new m,new m,new m,new m,new m,new m,new m];break;default:throw Error("Unknown SHA variant");}else throw Error("No SHA variants supported");return a}function A(c,a,d){var l,b,g,f,n,k,e,h,m,r,p,w,t,x,u,z,A,B,C,D,E,F,v=[],G;if("SHA-224"===d||"SHA-256"===d)r=64,w=1,F=Number,t=P,x=Q,u=R,z=N,A=O,B=L,C=M,E=K,D=J,G=H;else throw Error("Unexpected error in SHA-2 implementation");d=a[0];l=a[1];b=a[2];g=a[3];f=a[4];n=a[5];k=a[6];e=a[7];for(p=0;p<r;p+=1)16>p?(m=p*w,h=c.length<=m?0:c[m],m=c.length<=m+1?0:c[m+1],v[p]=new F(h,m)):v[p]=x(A(v[p-2]),v[p-7],z(v[p-15]),v[p-16]),h=u(e,C(f),D(f,n,k),G[p],v[p]),m=t(B(d),E(d,l,b)),e=k,k=n,n=f,f=t(g,h),g=b,b=l,l=d,d=t(h,m);a[0]=t(d,a[0]);a[1]=t(l,a[1]);a[2]=t(b,a[2]);a[3]=t(g,a[3]);a[4]=t(f,a[4]);a[5]=t(n,a[5]);a[6]=t(k,a[6]);a[7]=t(e,a[7]);return a}var H;H=[1116352408,1899447441,3049323471,3921009573,961987163,1508970993,2453635748,2870763221,3624381080,310598401,607225278,1426881987,1925078388,2162078206,2614888103,3248222580,3835390401,4022224774,264347078,604807628,770255983,1249150122,1555081692,1996064986,2554220882,2821834349,2952996808,3210313671,3336571891,3584528711,113926993,338241895,666307205,773529912,1294757372,1396182291,1695183700,1986661051,2177026350,2456956037,2730485921,2820302411,3259730800,3345764771,3516065817,3600352804,4094571909,275423344,430227734,506948616,659060556,883997877,958139571,1322822218,1537002063,1747873779,1955562222,2024104815,2227730452,2361852424,2428436474,2756734187,3204031479,3329325298];"function"===typeof define&&define.amd?define(function(){return w}):"undefined"!==typeof exports?("undefined"!==typeof module&&module.exports&&(module.exports=w),exports=w):I.jsSHA=w})(this);`)
      this._loadedModules.push('jsSha');
    }
    const buff = Buffer.from(b64.replace(/^data:image\/(png|gif|jpeg);base64,/,''), 'base64');
    const mimeInfo = base64MimeType(b64);
    if(!mimeInfo || mimeInfo.includes("image")){
      //non matter what, convert to webp, resize + autoscale to width 512 px
      const scaledImageBuffer = await sharp(buff,{ failOnError: false })
      .resize({ width: 512, height: 512 })
      .toBuffer();
      const webp = sharp(scaledImageBuffer,{ failOnError: false }).webp();
      const metadata : any= await webp.metadata();
      const webpBase64 = (await webp.toBuffer()).toString('base64');
      return await this.page.evaluate(
        ({ webpBase64,to, metadata }) => WAPI.sendImageAsSticker(webpBase64,to, metadata),
        { webpBase64,to, metadata }
      );
    } else {
      console.log('Not an image');
      return false;
    }
  }
}

export { useragent } from '../config/puppeteer.config'
