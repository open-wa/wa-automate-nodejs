import { Page, EvaluateFn } from 'puppeteer';
import { Chat, LiveLocationChangedEvent, ChatState } from './model/chat';
import { Contact } from './model/contact';
import { Message } from './model/message';
import axios from 'axios';
import { ParticipantChangedEventModel } from './model/group-metadata';
import { useragent, puppeteerConfig } from '../config/puppeteer.config'
import sharp from 'sharp';
import { ConfigObject, STATE } from './model';
import { PageEvaluationTimeout } from './model/errors';
import PQueue from 'p-queue';
import { ev } from '../controllers/events';
/** @ignore */
const parseFunction = require('parse-function'),
pkg = require('../../package.json'),
datauri = require('datauri'),
fs = require('fs'),
isUrl = require('is-url'),
ffmpeg = require('fluent-ffmpeg'),
isDataURL = (s: string) => !!s.match(/^data:((?:\w+\/(?:(?!;).)+)?)((?:;[\w\W]*?[^;])*),(.+)$/g);
import treekill from 'tree-kill';
import { SessionInfo } from './model/sessionInfo';
import { injectApi } from '../controllers/browser';
import { isAuthenticated } from '../controllers/auth';
import { ChatId, GroupChatId, Content, Base64, MessageId, ContactId, DataURL, FilePath } from './model/aliases';
import { bleachMessage, decryptMedia } from '@open-wa/wa-decrypt';
import * as path from 'path';
import { CustomProduct } from './model/product';
import Crypto from 'crypto';
import { tmpdir } from 'os';

export enum namespace {
  Chat = 'Chat',
  Msg = 'Msg',
  Contact = 'Contact',
  GroupMetadata = 'GroupMetadata'
}

/**
 * An enum of all the "simple listeners". A simple listener is a listener that just takes one parameter which is the callback function to handle the event.
 */
export enum SimpleListener {
  /**
   * Represents [[onMessage]]
   */
  Message = 'onMessage',
  /**
   * Represents [[onAnyMessage]]
   */
  AnyMessage = 'onAnyMessage',
  /**
   * Represents [[onMessageDeleted]]
   */
  MessageDeleted = 'onMessageDeleted',
  /**
   * Represents [[onAck]]
   */
  Ack = 'onAck',
  /**
   * Represents [[onAddedToGroup]]
   */
  AddedToGroup = 'onAddedToGroup',
  /**
   * Represents [[onBattery]]
   */
  Battery = 'onBattery',
  /**
   * Represents [[onChatOpened]]
   */
  ChatOpened = 'onChatOpened',
  /**
   * Represents [[onIncomingCall]]
   */
  IncomingCall = 'onIncomingCall',
  /**
   * Represents [[onGlobalParicipantsChanged]]
   */
  GlobalParicipantsChanged = 'onGlobalParicipantsChanged',
  /**
   * Represents [[onChatState]]
   */
  ChatState = 'onChatState',
  // Next two require extra params so not available to use via webhook register
  // LiveLocation = 'onLiveLocation',
  // ParticipantsChanged = 'onParticipantsChanged',
  /**
   * Represents [[onPlugged]]
   */
  Plugged = 'onPlugged',
  /**
   * Represents [[onStateChanged]]
   */
  StateChanged = 'onStateChanged',
  /**
   * Requires licence
   * Represents [[onStory]]
   */
  Story = 'onStory',
  /**
   * Requires licence
   * Represents [[onRemovedFromGroup]]
   */
  RemovedFromGroup = 'onRemovedFromGroup',
  /**
   * Requires licence
   * Represents [[onContactAdded]]
   */
  ContactAdded = 'onContactAdded',
}


/**
 * @internal
 */
async function convertMp4BufferToWebpDataUrl(file: DataURL | Buffer | Base64, processOptions: {
  /**
   * Desired Frames per second of the sticker output
   * @default `10`
   */
  fps?: number,
  /**
   * The video start time of the sticker
   * @default `00:00:00.0`
   */
  startTime?: string,
  /**
   * The video end time of the sticker. By default, stickers are made from the first 5 seconds of the video
   * @default `00:00:05.0`
   */
  endTime?: string
  /**
   * The amount of times the video loops in the sticker. To save processing time, leave this as 0
   * default `0`
   */
  loop?: number,
  /**
   * Centres and crops the video.
   * default `true`
   */
  crop?: boolean
} = {
  fps: 10,
  startTime: `00:00:00.0`,
  endTime:  `00:00:05.0`,
  loop: 0,
  crop: true
}) {
  const tempFile = path.join(tmpdir(), `processing.${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`);
  var stream = new (require('stream').Readable)();
  stream.push(Buffer.isBuffer(file) ? file : Buffer.from(file.replace('data:video/mp4;base64,',''), 'base64'));
  stream.push(null);
  await new Promise((resolve, reject) => {
      ffmpeg(stream)
          .inputFormat('mp4')
          .on('start', function (cmd) {
              console.log('Started ' + cmd);
          })
          .on('error', function (err) {
              console.log('An error occurred: ' + err.message);
              reject(err)
          })
          .on('end', function () {
              console.log('Finished encoding');
              resolve(true)
          })
          .addOutputOptions([`-vcodec`, `libwebp`, `-vf`, `${processOptions.crop?`crop=w='min(min(iw\,ih)\,500)':h='min(min(iw\,ih)\,500)',`:``}scale=500:500,setsar=1,fps=${processOptions.fps}`, `-loop`, `${processOptions.loop}`, `-ss`, processOptions.startTime, `-t`, processOptions.endTime, `-preset`, `default`, `-an`, `-vsync`, `0`, `-s`, `512:512`])
          .toFormat("webp")
          .save(tempFile);
  })
  const d = await datauri(tempFile);
  fs.unlinkSync(tempFile)
  return d;
}

/**
 * @internal
 * A convinience method to download the [[DataURL]] of a file
 * @param url The url
 * @param optionsOverride You can use this to override the [axios request config](https://github.com/axios/axios#request-config)
 * @returns Promise<DataURL>
 */
async function getDUrl(url: string, optionsOverride: any = {} ){
  try {
    const res = await axios({
        method:"get",
        url,
        headers: {
          'DNT':1,
          'Upgrade-Insecure-Requests':1
        },
        ...optionsOverride,
        responseType: 'arraybuffer'
      });
    const dUrl : DataURL = `data:${res.headers['content-type']};base64,${Buffer.from(res.data, 'binary').toString('base64')}`;
    return dUrl;
    // return Buffer.from(response.data, 'binary').toString('base64')
  } catch (error) {
    console.log("TCL: getDUrl -> error", error)
  }
}

/**
 * @internal
 * Use this to extract the mime type from a [[DataURL]]
 */
function base64MimeType(dUrl : DataURL) {
  var result = null;

  if (typeof dUrl !== 'string') {
    return result;
  }

  var mime = dUrl.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/);

  if (mime && mime.length) {
    result = mime[1];
  }

  return result;
}

declare module WAPI {
  const waitNewMessages: (rmCallback: boolean, callback: Function) => void;
  const waitNewAcknowledgements: (callback: Function) => void;
  const addAllNewMessagesListener: (callback: Function) => void;
  const onStateChanged: (callback: Function) => void;
  const onChatState: (callback: Function) => any;
  const onIncomingCall: (callback: Function) => any;
  const onAddedToGroup: (callback: Function) => any;
  const onBattery: (callback: Function) => any;
  const onPlugged: (callback: Function) => any;
  const onGlobalParicipantsChanged: (callback: Function) => any;
  const onStory: (callback: Function) => any;
  const setChatBackgroundColourHex: (hex: string) => boolean;
  const darkMode: (activate: boolean) => boolean;
  const onParticipantsChanged: (groupId: string, callback: Function) => any;
  const _onParticipantsChanged: (groupId: string, callback: Function) => any;
  const onLiveLocation: (chatId: string, callback: Function) => any;
  const getSingleProperty: (namespace: string, id: string, property : string) => any;
  const sendMessage: (to: string, content: string) => Promise<string>;
  const setChatEphemeral: (chatId: string, ephemeral: boolean) => Promise<boolean>;
  const downloadFileWithCredentials: (url: string) => Promise<string>;
  const sendMessageWithMentions: (to: string, content: string) => Promise<string>;
  const tagEveryone: (groupId: string, content: string) => Promise<string>;
  const sendReplyWithMentions: (to: string, content: string, replyMessageId: string) => Promise<string>;
  const postTextStatus: (text: string, textRgba: string, backgroundRgba: string, font: string) => Promise<string | boolean>;
  const postImageStatus: (data: string, caption: string) => Promise<string | boolean>;
  const postVideoStatus: (data: string, caption: string) => Promise<string | boolean>;
  const setChatState: (chatState: ChatState, chatId: string) => void;
  const reply: (to: string, content: string, quotedMsg: string | Message) => Promise<string|boolean>;
  const getGeneratedUserAgent: (userAgent?: string) => string;
  const forwardMessages: (to: string, messages: string | (string | Message)[], skipMyMessages: boolean) => any;
  const sendLocation: (to: string, lat: any, lng: any, loc: string) => Promise<string>;
  const addParticipant: (groupId: string, contactId: string) => Promise<boolean | string>;
  const sendGiphyAsSticker: (chatId: string, url: string) => Promise<any>;
  const getMessageById: (mesasgeId: string) => Message;
  const getMyLastMessage: (chatId: string) => Message;
  const getStickerDecryptable: (mesasgeId: string) => Message | boolean;
  const forceStaleMediaUpdate: (mesasgeId: string) => Message | boolean;
  const setMyName: (newName: string) => Promise<boolean>;
  const setMyStatus: (newStatus: string) => void;
  const setProfilePic: (data: string) => Promise<boolean>;
  const setPresence: (available: boolean) => void;
  const getMessageReaders: (messageId: string) => Contact[];
  const getStatus: (contactId: string) => void;
  const getCommonGroups: (contactId: string) => Promise<{id:string,title:string}[]>;
  const forceUpdateLiveLocation: (chatId: string) => Promise<LiveLocationChangedEvent []> | boolean;
  const setGroupIcon: (groupId: string, imgData: string) => Promise<boolean>;
  const getGroupAdmins: (groupId: string) => Promise<ContactId[]>;
  const removeParticipant: (groupId: string, contactId: string) => Promise<boolean | string>;
  const addOrRemoveLabels: (label: string, id: string, type: string) => Promise<boolean>;
  const promoteParticipant: (groupId: string, contactId: string) => Promise<boolean | string>;
  const demoteParticipant: (groupId: string, contactId: string) => Promise<boolean | string>;
  const setGroupToAdminsOnly: (groupId: string, onlyAdmins: boolean) => Promise<boolean>;
  const setGroupEditToAdminsOnly: (groupId: string, onlyAdmins: boolean) => Promise<boolean>;
  const setGroupDescription: (groupId: string, description: string) => Promise<boolean>;
  const setGroupTitle: (groupId: string, title: string) => Promise<boolean>;
  const sendImageAsSticker: (webpBase64: string, to: string, metadata?: any) => Promise<string | boolean>;
  const sendStickerAsReply: (webpBase64: string, to: string, messageId: string, metadata?: any) => Promise<string | boolean>;
  const createGroup: (groupName: string, contactId: string|string[]) => Promise<any>;
  const sendCustomProduct: (to: ChatId, image: DataURL, productData: CustomProduct) => Promise<string | boolean>;
  const sendSeen: (to: string) => Promise<boolean>;
  const markAsUnread: (to: string) => Promise<boolean>;
  const isChatOnline: (id: string) => Promise<boolean | string>;
  const sendLinkWithAutoPreview: (to: string,url: string,text: string) => Promise<string | boolean>;
  const contactBlock: (id: string) => Promise<boolean>;
  const checkReadReceipts: (contactId: string) => Promise<boolean | string>;
  const REPORTSPAM: (id: string) => Promise<boolean>;
  const contactUnblock: (id: string) => Promise<boolean>;
  const deleteConversation: (chatId: string) => Promise<boolean>;
  const clearChat: (chatId: string) => Promise<any>;
  const inviteInfo: (link: string) => Promise<any>;
  const ghostForward: (chatId: string, messageId: string) => Promise<boolean>;
  const revokeGroupInviteLink: (chatId: string) => Promise<string> | Promise<boolean>;
  const getGroupInviteLink: (chatId: string) => Promise<string>;
  const sendImage: (
    base64: string,
    to: string,
    filename: string,
    caption: string,
    quotedMsgId?: string,
    waitForId?: boolean,
    ptt?: boolean,
    withoutPreview?: boolean
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
    caption: string,
    quotedMsgId?: string
  ) => Promise<string>;
  const getAllContacts: () => Contact[];
  const getWAVersion: () => String;
  const getStoryViewers: (id: string) => Promise<String[]>;
  const getMe: () => any;
  const iAmAdmin: () => Promise<String[]>;
  const getChatWithNonContacts: () => Contact[];
  const syncContacts: () => boolean;
  const getAmountOfLoadedMessages: () => number;
  const deleteAllStatus: () => Promise<boolean>;
  const getMyStatusArray: () => Promise<any>;
  const getAllUnreadMessages: () => any;
  const getIndicatedNewMessages: () => any;
  const getAllChatsWithMessages: (withNewMessageOnly?: boolean) => any;
  const getAllChats: () => any;
  const getState: () => string;
  const forceUpdateConnectionState: () => Promise<string>;
  const getBatteryLevel: () => number;
  const getIsPlugged: () => boolean;
  const clearAllChats: () => Promise<boolean>;
  const cutMsgCache: () => boolean;
  const getChat: (contactId: string) => Chat;
  const getLastSeen: (contactId: string) => Promise<number | boolean>;
  const getProfilePicFromServer: (chatId: string) => any;
  const getAllChatIds: () => Promise<ChatId[]>;
  const getBlockedIds: () => Promise<ContactId[]>;
  const getAllChatsWithNewMsg: () => Chat[];
  const getAllNewMessages: () => any;
  const getUseHereString: () => Promise<string>;
  const getHostNumber: () => string;
  const getAllGroups: () => Chat[];
  const getGroupParticipantIDs: (groupId: string) => Promise<string[]>;
  const joinGroupViaLink: (link: string) => Promise<string | boolean | number>;
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

export class Client {
  private _loadedModules: any[];
  private _registeredWebhooks: any;
  private _registeredEvListeners: any;
  private _webhookQueue: any;
  private _createConfig: ConfigObject;
  private _sessionInfo: SessionInfo;
  private _listeners: any;
  private _page: Page;
  private _currentlyBeingKilled: boolean = false;

  /**
   * @ignore
   * @param page [Page] [Puppeteer Page]{@link https://pptr.dev/#?product=Puppeteer&version=v2.1.1&show=api-class-page} running WA Web
   */
  constructor(page: Page, createConfig: ConfigObject, sessionInfo: SessionInfo) {
    this._page = page;
    this._createConfig = createConfig || {};
    this._loadedModules = [];
    this._sessionInfo = sessionInfo;
    this._listeners = {};
    if(this._createConfig?.eventMode) {
      this.registerAllSimpleListenersOnEv();
    }
    this._setOnClose();
  }

  private registerAllSimpleListenersOnEv(){
    Object.keys(SimpleListener).map(eventKey => this.registerEv(SimpleListener[eventKey]))
  }

  getSessionId(){
    return this._createConfig.sessionId
  }

  getPage(){
    return this._page;
  }

  private _setOnClose(){
    this._page.on('close',()=>{
      this.kill();
      if(this._createConfig?.killProcessOnBrowserClose) process.exit();
    })
  }

  private async _reInjectWapi(){
    this._page = await injectApi(this._page)
  }

  private async _reRegisterListeners(){
    return Object.keys(this._listeners).forEach((listenerName: SimpleListener)=>this[listenerName](this._listeners[listenerName]));
  }

  /**
   * A convinience method to download the [[DataURL]] of a file
   * @param url The url
   * @param optionsOverride You can use this to override the [axios request config](https://github.com/axios/axios#request-config)
   * @returns Promise<DataURL>
   */
  public async download(url: string, optionsOverride: any = {} ) {
    return await getDUrl(url, optionsOverride)
  } 

  /**
   * Refreshes the page and reinjects all necessary files. This may be useful for when trying to save memory
   * This will attempt to re register all listeners EXCEPT onLiveLocation and onParticipantChanged
   */
   public async refresh(){
     console.log('Refreshing')
     await this._page.goto(puppeteerConfig.WAUrl);
     await isAuthenticated(this._page);
     await this._reInjectWapi();
     if (this._createConfig?.licenseKey) {
      const { me } = await this.getMe();
      const { data } = await axios.post(pkg.licenseCheckUrl, { key: this._createConfig.licenseKey, number: me._serialized, ...this._sessionInfo });
      if (data) {
        await this._page.evaluate(data => eval(data), data);
        console.log('License Valid');
      } else console.log('Invalid license key');
    }
    await this._page.evaluate('Object.freeze(window.WAPI)');
    await this._reRegisterListeners();
    return true;
   }

  /**
   * Get the session info
   * 
   * @returns SessionInfo
   */
  public getSessionInfo() {
    return this._sessionInfo;
  }

  /**
   * Get the config which was used to set up the client. Sensitive details (like devTools username and password, and browserWSEndpoint) are scrubbed
   * 
   * @returns SessionInfo
   */
  public getConfig() {
    const {
      devtools,
      browserWSEndpoint,
      sessionData,
      proxyServerCredentials,
      restartOnCrash,
      ...rest
    } = this._createConfig;
    return rest
  }


  private async pup(pageFunction:EvaluateFn<any>, ...args) {
    if(this._createConfig?.safeMode) {
      if(!this._page || this._page.isClosed()) throw 'page closed';
      const state = await this.forceUpdateConnectionState();
      if(state!==STATE.CONNECTED) throw `state: ${state}`
    }
    if(this._createConfig?.callTimeout) return await Promise.race([this._page.evaluate(pageFunction, ...args),new Promise((resolve, reject) => setTimeout(reject, this._createConfig?.callTimeout, new PageEvaluationTimeout()))])
    return this._page.evaluate(pageFunction, ...args);
  }

  /**
   * ////////////////////////  LISTENERS
   */

   /**
    * 
    */
  private async registerListener(funcName:SimpleListener, fn: any){
    if(this?._registeredEvListeners[funcName]) {
      return ev.on(`${funcName}.${this.getSessionId()}`,({data})=>fn(data));
    }
    /**
     * If evMode is on then make the callback come from ev.
     */
    //add a reference to this callback
    const set = () => this.pup(({funcName}) => {
      //@ts-ignore
      return window[funcName] ? WAPI[`${funcName}`](obj => window[funcName](obj)) : false
    },{funcName});
    if(this._listeners[funcName]) {
      console.log('listener already set');
      return true
    }
    this._listeners[funcName] = fn;
    const exists = await this.pup(({funcName})=>window[funcName]?true:false,{funcName});
    if(exists) return await set();
    const res = await this._page.exposeFunction(funcName, (obj: any) =>fn(obj)).then(set).catch(e=>set) as Promise<boolean>;
    return res;
  }
  
  // NON-STAMDARD LISTENERS

  /**
   * Listens to messages received
   * 
   * @event 
   * @fires Observable stream of messages
   */
  public async onMessage(fn: (message: Message) => void) {
    return this.registerListener(SimpleListener.Message, fn);
    // let funcName = SimpleListener.Message;
    // this._listeners[funcName] = fn;
    // const set = () => this.pup(
    //   ({funcName}) => {
    //     WAPI.waitNewMessages(false, data => {
    //       data.forEach(message => {
    //         //@ts-ignore
    //         window[funcName](message);
    //       });
    //     });
    //   },{funcName})
    //   const exists = await this.pup(({funcName})=>window[funcName]?true:false,{funcName});
    //   if(exists) return await set();
    // this._page.exposeFunction(funcName, (message: Message) =>fn(message)).then(set).catch(e=>set);
  }

 

  // STANDARD SIMPLE LISTENERS

   /**
   * Listens to all new messages
   * 
   * @event 
   * @param to callback
   * @fires [[Message]] 
   */
  public async onAnyMessage(fn: (message: Message) => void) {
    return this.registerListener(SimpleListener.AnyMessage, fn);
  }
  /**
   * [REQUIRES AN INSIDERS LICENSE-KEY](https://gum.co/open-wa?tier=Insiders%20Program)
   * 
   * Listens to when a message is deleted by a recipient or the host account

   * @event 
   * @param fn callback
   * @fires [[Message]]
   */
  public async onMessageDeleted(fn: (message: Message) => void) {
    return this.registerListener(SimpleListener.MessageDeleted, fn);
  }

  /** 
   * Listens to battery changes
   * 
   * @event 
   * @param fn callback
   * @fires number
   */
  public async onBattery(fn: (battery:number) => void) {
    return this.registerListener(SimpleListener.Battery, fn);
  }

  /** 
   * Listens to when host device is plugged/unplugged
   * @event 
   * 
   * @param fn callback
   * @fires boolean true if plugged, false if unplugged
   */
  public async onPlugged(fn: (plugged: boolean) => void) {
    return this.registerListener(SimpleListener.Plugged, fn);
  }

  /**
   * Requires a Story License Key 
   * Listens to when a contact posts a new story.
   * @event
   * 
   * @param fn callback
   * @fires e.g 
   * 
   * ```javascript
   * {
   * from: '123456789@c.us'
   * id: 'false_132234234234234@status.broadcast'
   * }
   * ```
   */
  public async onStory(fn: (story: any) => void) {
    return this.registerListener(SimpleListener.Story, fn);
  }

  /**
   * Listens to changes in state
   * 
   * @event 
   * @fires STATE observable sream of states
   */
  public async onStateChanged(fn: (state: string) => void) {
    return this.registerListener(SimpleListener.StateChanged, fn);
  }

  /**
   * Listens to new incoming calls
   * @event 
   * @returns Observable stream of call request objects
   */
  public async onIncomingCall(fn: (call: any) => void) {
    return this.registerListener(SimpleListener.IncomingCall, fn);
  }

  /**
   * [REQUIRES AN INSIDERS LICENSE-KEY](https://gum.co/open-wa?tier=Insiders%20Program)
   * 
   * Listens to chat state, including when a specific user is recording and typing within a group chat.
   * 
   * @event 
   * 
   * Here is an example of the fired object:
   * 
   * @fires ```javascript
   * {
   * "chat": "00000000000-1111111111@g.us", //the chat in which this state is occuring
   * "user": "22222222222@c.us", //the user that is causing this state
   * "state": "composing, //can also be 'available', 'unavailable', 'recording' or 'composing'
   * }
   * ```
   */
  public async onChatState(fn: (chatState: any) => void) {
    return this.registerListener(SimpleListener.ChatState, fn);
  }

  /**
   * Listens to messages acknowledgement Changes
   * 
   * @param fn callback function that handles a [[Message]] as the first and only parameter.
   * @event 
   * @returns `true` if the callback was registered
   */
  public async onAck(fn: (message: Message) => void) {
    return this.registerListener(SimpleListener.Ack, fn);
  }

  /**
   * Listens to add and remove events on Groups on a global level. It is memory efficient and doesn't require a specific group id to listen to.
   * 
   * @event
   * @param fn callback function that handles a [[ParticipantChangedEventModel]] as the first and only parameter.
   * @returns `true` if the callback was registered
   */
  public async onGlobalParicipantsChanged(fn: (participantChangedEvent: ParticipantChangedEventModel) => void) {
    return this.registerListener(SimpleListener.GlobalParicipantsChanged, fn);
  }

  /**
   * Fires callback with Chat object every time the host phone is added to a group.
   * 
   * @event 
   * @param fn callback function that handles a [[Chat]] (group chat) as the first and only parameter.
   * @returns `true` if the callback was registered
   */
  public async onAddedToGroup(fn: (chat: Chat) => any) {
    return this.registerListener(SimpleListener.AddedToGroup, fn);
  }
  

  /**
   * [REQUIRES AN INSIDERS LICENSE-KEY](https://gum.co/open-wa?tier=Insiders%20Program)
   * 
   * Fires callback with Chat object every time the host phone is added to a group.
   * 
   * @event 
   * @param fn callback function that handles a [[Chat]] (group chat) as the first and only parameter.
   * @returns `true` if the callback was registered
   */
  public async onRemovedFromGroup(fn: (chat: Chat) => any) {
    return this.registerListener(SimpleListener.RemovedFromGroup, fn);
  }

  /**
   * [REQUIRES AN INSIDERS LICENSE-KEY](https://gum.co/open-wa?tier=Insiders%20Program)
   * 
   * Fires callback with the relevant chat id every time the user clicks on a chat. This will only work in headful mode.
   * 
   * @event 
   * @param fn callback function that handles a [[ChatId]] as the first and only parameter.
   * @returns `true` if the callback was registered
   */
  public async onChatOpened(fn: (chat: Chat) => any) {
    return this.registerListener(SimpleListener.ChatOpened, fn);
  }

  /**
   * [REQUIRES AN INSIDERS LICENSE-KEY](https://gum.co/open-wa?tier=Insiders%20Program)
   * 
   * Fires callback with contact id when a new contact is added on the host phone.
   * 
   * @event 
   * @param fn callback function that handles a [[Chat]] as the first and only parameter.
   * @returns `true` if the callback was registered
   */
  public async onContactAdded(fn: (chat: Chat) => any) {
    return this.registerListener(SimpleListener.ChatOpened, fn);
  }

  // COMPLEX LISTENERS

  /**
   * @event 
   * Listens to add and remove events on Groups. This can no longer determine who commited the action and only reports the following events add, remove, promote, demote
   * @param to group id: xxxxx-yyyy@c.us
   * @param to callback
   * @returns Observable stream of participantChangedEvent
   */
  public async onParticipantsChanged(groupId: GroupChatId, fn: (participantChangedEvent: ParticipantChangedEventModel) => void, legacy : boolean = false) {
    const funcName = "onParticipantsChanged_" + groupId.replace('_', "").replace('_', "");
    return this._page.exposeFunction(funcName, (participantChangedEvent: ParticipantChangedEventModel) =>
      fn(participantChangedEvent)
    )
      .then(_ => this.pup(
        ({ groupId,funcName, legacy }) => {
          //@ts-ignore
          if(legacy) return WAPI._onParticipantsChanged(groupId, window[funcName]); else return WAPI.onParticipantsChanged(groupId, window[funcName]);
        },
        { groupId, funcName, legacy}
      ));
  }

/**
 * @event Listens to live locations from a chat that already has valid live locations
 * @param chatId the chat from which you want to subscribes to live location updates
 * @param fn callback that takes in a LiveLocationChangedEvent
 * @returns boolean, if returns false then there were no valid live locations in the chat of chatId
 * @emits <LiveLocationChangedEvent> LiveLocationChangedEvent
 */
public async onLiveLocation(chatId: ChatId, fn: (liveLocationChangedEvent: LiveLocationChangedEvent) => void) {
  const funcName = "onLiveLocation_" + chatId.replace('_', "").replace('_', "");
  return this._page.exposeFunction(funcName, (liveLocationChangedEvent: LiveLocationChangedEvent) =>
    fn(liveLocationChangedEvent)
  )
    .then(_ => this.pup(
      ({ chatId,funcName }) => {
      //@ts-ignore
        return WAPI.onLiveLocation(chatId, window[funcName]);
      },
      { chatId, funcName}
    ));
}

  /**
   * Set presence to available or unavailable.
   * @param available if true it will set your presence to 'online', false will set to unavailable (i.e no 'online' on recipients' phone);
   */
  public async setPresence(available: boolean) {
    return await this.pup(
      available => {WAPI.setPresence(available)},
      available
      )
  }

  /**
   * set your about me
   * @param newStatus String new profile status
   */
  public async setMyStatus(newStatus: string) {
    return await this.pup(
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
    return await this.pup(
      ({label, id}) => {WAPI.addOrRemoveLabels(label, id, 'add')},
      {label, id}
      ) as Promise<boolean>;
  }

  /**
   * Removes label from chat, message or contact. Only for business accounts.
   * @param label: either the id or the name of the label. id will be something simple like anhy nnumber from 1-10, name is the label of the label if that makes sense.
   * @param id The Chat, message or contact id to which you want to add a label
   */
  public async removeLabel(label: string, id: string) {
    return await this.pup(
      ({label, id}) => {WAPI.addOrRemoveLabels(label, id, 'remove')},
      {label, id}
      ) as Promise<boolean>;
  }

/**
 * Send VCARD
 *
 * @param {string} chatId '000000000000@c.us'
 * @param {string} vcard vcard as a string
 * @param {string} contactName The display name for the contact. CANNOT BE NULL OTHERWISE IT WILL SEND SOME RANDOM CONTACT FROM YOUR ADDRESS BOOK.
 * @param {string} contactNumber If supplied, this will be injected into the vcard (VERSION 3 ONLY FROM VCARDJS) with the WA id to make it show up with the correct buttons on WA. The format of this param should be including country code, without any other formating. e.g:
 * `4477777777777`
 */
  public async sendVCard(chatId: ChatId, vcard: string, contactName:string,  contactNumber?: string) {
    return await this.pup(
      ({chatId, vcard, contactName, contactNumber}) => {WAPI.sendVCard(chatId, vcard,contactName, contactNumber)},
      {chatId, vcard, contactName, contactNumber}
      ) as Promise<boolean>;
  }

  /**
   * Set your profile name
   * 
   * Please note, this does not work on business accounts!
   * 
   * @param newName String new name to set for your profile
   */
   public async setMyName(newName: string) {
     return await this.pup(
       ({newName}) => {WAPI.setMyName(newName)},
       {newName}
       ) as Promise<boolean>;
   }

   /**
    * Sets the chat state
    * @param {ChatState|0|1|2} chatState The state you want to set for the chat. Can be TYPING (0), RECRDING (1) or PAUSED (2).
    * @param {String} chatId 
    */
   public async setChatState(chatState: ChatState, chatId: ChatId) {
    return await this.pup(
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
    return await this._page.evaluate(() => WAPI.getState());
  }

  /**
   * Forces the session to update the connection state. This will take a few seconds to determine the 'correct' state.
   * @returns updated connection state
   */
  public async forceUpdateConnectionState() {
    return await this._page.evaluate(() => WAPI.forceUpdateConnectionState());
  }

  /**
   * Returns a list of contact with whom the host number has an existing chat who are also not contacts.
   */
  public async getChatWithNonContacts(){
    return await this._page.evaluate(() => WAPI.getChatWithNonContacts());
  }

  /**
   * Shuts down the page and browser
   * @returns true
   */
  public async kill() {
    if(this._currentlyBeingKilled) return;
    this._currentlyBeingKilled = true;
    console.log('Shutting Down');
    const browser = await this?._page?.browser()
    const pid = browser?.process() ? browser?.process()?.pid : null;
    try{
      if (this._page && !this._page?.isClosed()) await this._page?.close();
      if (this._page && this._page?.browser) await this._page?.browser()?.close();
      if(pid) treekill(pid, 'SIGKILL')
    } catch(error){}
    this._currentlyBeingKilled = false;
    return true;
  }

  /**
   * This is a convinient method to click the `Use Here` button in the WA web session.
   * 
   * Use this when [[STATE]] is `CONFLICT`. You can read more about managing state here:
   * 
   * [[Detecting Logouts]]
   */
  public async forceRefocus() {
    const useHere: string = await this._page.evaluate(()=>WAPI.getUseHereString());
    await this._page.waitForFunction(
      `[...document.querySelectorAll("div[role=button")].find(e=>{return e.innerHTML.toLowerCase().includes("${useHere.toLowerCase()}")})`,
      { timeout: 0 }
    );
    return await this._page.evaluate(`[...document.querySelectorAll("div[role=button")].find(e=>{return e.innerHTML.toLowerCase().includes("${useHere.toLowerCase()}")}).click()`);
  }

  
  /**
   * A list of participants in the chat who have their live location on. If the chat does not exist, or the chat does not have any contacts actively sharing their live locations, it will return false. If it's a chat with a single contact, there will be only 1 value in the array if the contact has their livelocation on.
   * Please note. This should only be called once every 30 or so seconds. This forces the phone to grab the latest live location data for the number. This can be used in conjunction with onLiveLocation (this will trigger onLiveLocation).
   * @param chatId string Id of the chat you want to force the phone to get the livelocation data for.
   * @returns Promise<LiveLocationChangedEvent []> | boolean 
   */
  public async forceUpdateLiveLocation(chatId: ChatId) {
    return await this.pup(
      ({chatId}) => WAPI.forceUpdateLiveLocation(chatId),
      { chatId }
    );
  }


  

  /**
   * Sends a text message to given chat
   * If you need to send a message to new numbers please see [these instructions:](https://docs.openwa.dev/pages/The%20Client/licensed-features.html#sending-messages-to-non-contact-numbers)
   * @param to chat id: xxxxx@c.us
   * @param content text message
   */
  public async sendText(to: ChatId, content: Content) {
   const err = [
    'Not able to send message to broadcast',
    'Not a contact',
    'Error: Number not linked to WhatsApp Account',
    'ERROR: Please make sure you have at least one chat'
   ];

    let res = await this.pup(
      ({ to, content }) => {
        WAPI.sendSeen(to);
        return WAPI.sendMessage(to, content);
      },
      { to, content }
    );
    if(err.includes(res)) console.error(res);
    return (err.includes(res) ? false : res)  as boolean | MessageId;
  }
  

  /**
   * Sends a text message to given chat that includes mentions.
   * In order to use this method correctly you will need to send the text like this:
   * "@4474747474747 how are you?"
   * Basically, add a @ symbol before the number of the contact you want to mention.
   * @param to chat id: xxxxx@c.us
   * @param content text message
   */
  public async sendTextWithMentions(to: ChatId, content: Content) {
    //remove all @c.us from the content
    content = content.replace(/@c.us/,"");
    return await this.pup(
      ({ to, content }) => {
        WAPI.sendSeen(to);
        return WAPI.sendMessageWithMentions(to, content);
      },
      { to, content }
    ) as Promise<string>;
  }

  /**
   * [REQUIRES AN INSIDERS LICENSE-KEY](https://gum.co/open-wa?tier=Insiders%20Program)
   * 
   * Sends a reply to given chat that includes mentions, replying to the provided replyMessageId.
   * In order to use this method correctly you will need to send the text like this:
   * "@4474747474747 how are you?"
   * Basically, add a @ symbol before the number of the contact you want to mention.
   * @param to chat id: xxxxx@c.us
   * @param content text message
   * @param replyMessageId id of message to reply to
   */
  public async sendReplyWithMentions(to: ChatId, content: Content, replyMessageId: MessageId) {
    //remove all @c.us from the content
    content = content.replace(/@c.us/,"");
    return await this.pup(
      ({ to, content, replyMessageId }) => {
        WAPI.sendSeen(to);
        return WAPI.sendReplyWithMentions(to, content, replyMessageId);
      },
      { to, content, replyMessageId }
    ) as Promise<string>;
  }


  /**
   * [REQUIRES AN INSIDERS LICENSE-KEY](https://gum.co/open-wa?tier=Insiders%20Program)
   * 
   * Tags everyone in the group with a message
   * 
   * @param groupId group chat id: xxxxx@g.us
   * @param content text message to add under all of the tags
   * @returns Promise<MessageId>
   */
  public async tagEveryone(groupId: GroupChatId, content: Content) {
    return await this.pup(
      ({ groupId, content  }) => WAPI.tagEveryone(groupId, content),
      { groupId, content }
    ) as Promise<string>;
  }

  /**
   * Sends a link to a chat that includes a link preview.
   * @param thumb The base 64 data of the image you want to use as the thunbnail. This should be no more than 200x200px. Note: Dont need data url on this param
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
    text: Content,
    chatId: ChatId) {
    return await this.pup(
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
    ) as Promise<boolean>;
  }


  /**
   * Sends a location message to given chat
   * @param to chat id: xxxxx@c.us
   * @param lat latitude: '51.5074'
   * @param lng longitude: '0.1278'
   * @param loc location text: 'LONDON!'
   */
  public async sendLocation(to: ChatId, lat: any, lng: any, loc: string) {
    return await this.pup(
      ({ to, lat, lng, loc }) => WAPI.sendLocation(to, lat, lng, loc),
      { to, lat, lng, loc }
    ) as Promise<string>;
  }

  /**
   * Get the generated user agent, this is so you can send it to the decryption module.
   * @returns String useragent of wa-web session
   */
  public async getGeneratedUserAgent(userA?: string) {
    let ua = userA || useragent;
    return await this.pup(
      ({ua}) => WAPI.getGeneratedUserAgent(ua),
      { ua }
    ) as Promise<string>;
  }

  /**
   * Decrypts a media message.
   * @param message This can be the serialized [[MessageId]] or the whole [[Message]] object. It is advised to just use the serialized message ID.
   * @returns Promise<[[DataURL]]>
   */
  public async decryptMedia(message: Message | MessageId) {
    let m : any;
    //if it's the message id, get the message
    if(typeof message === "string") m = await this.getMessageById(message) 
    else m = message;
    if(!m.mimetype) throw new Error("Not a media message");
    if(m.type == "sticker") m = await this.getStickerDecryptable(m.id);
    //Dont have an insiders license to decrypt stickers
    if(m===false) return false;
    const mediaData = await decryptMedia(m);
    return `data:${m.mimetype};base64,${mediaData.toString('base64')}`
  };

  /**
   * Sends a image to given chat, with caption or not, using base64
   * @param to chat id xxxxx@c.us
   * @param file DataURL data:image/xxx;base64,xxx or the RELATIVE (should start with `./` or `../`) path of the file you want to send. With the latest version, you can now set this to a normal URL (for example [GET] `https://file-examples-com.github.io/uploads/2017/10/file_example_JPG_2500kB.jpg`).
   * @param filename string xxxxx
   * @param caption string xxxxx
   * @param waitForKey boolean default: false set this to true if you want to wait for the id of the message. By default this is set to false as it will take a few seconds to retrieve to the key of the message and this waiting may not be desirable for the majority of users.
   * @returns Promise <boolean | string> This will either return true or the id of the message. It will return true after 10 seconds even if waitForId is true
   */
  public async sendImage(
    to: ChatId,
    file: DataURL | FilePath,
    filename: string,
    caption: Content,
    quotedMsgId?: MessageId,
    waitForId?: boolean,
    ptt?:boolean,
    withoutPreview?:boolean
  ) {
      //check if the 'base64' file exists
      if(!isDataURL(file)) {
        //must be a file then
        let relativePath = path.join(path.resolve(process.cwd(),file|| ''));
        if(fs.existsSync(file) || fs.existsSync(relativePath)) {
          file = await datauri(fs.existsSync(file)  ? file : relativePath);
        } else if(isUrl(file)){
          return await this.sendFileFromUrl(to,file,filename,caption,quotedMsgId,{},waitForId,ptt,withoutPreview);
        } else throw new Error('Cannot find file. Make sure the file reference is relative, a valid URL or a valid DataURL')
      }
    
   const err = [
    'Not able to send message to broadcast',
    'Not a contact',
    'Error: Number not linked to WhatsApp Account',
    'ERROR: Please make sure you have at least one chat'
   ];

    let res = await this.pup(
      ({ to, file, filename, caption, quotedMsgId, waitForId, ptt, withoutPreview}) =>  WAPI.sendImage(file, to, filename, caption, quotedMsgId, waitForId, ptt, withoutPreview),
      { to, file, filename, caption, quotedMsgId, waitForId, ptt, withoutPreview}
    )
    if(err.includes(res)) console.error(res);
    return (err.includes(res) ? false : res)  as MessageId | boolean;
  }

  
/**
 * Automatically sends a youtube link with the auto generated link preview. You can also add a custom message.
 * @param chatId 
 * @param url string A youtube link.
 * @param text string Custom text as body of the message, this needs to include the link or it will be appended after the link.
 */
  public async sendYoutubeLink(to: ChatId, url: string, text: Content = '') {
    return this.sendLinkWithAutoPreview(to,url,text);
  }

/**
 * Automatically sends a link with the auto generated link preview. You can also add a custom message.
 * @param chatId 
 * @param url string A link.
 * @param text string Custom text as body of the message, this needs to include the link or it will be appended after the link.
 */
  public async sendLinkWithAutoPreview(
    to: ChatId,
    url: string,
    text?: Content,
  ) {
    return await this.pup(
      ({ to,url, text }) => WAPI.sendLinkWithAutoPreview(to,url,text),
      { to,url, text }
    ) as Promise<MessageId | boolean>;
  }

  /**
   * 
   * Sends a reply to a given message. Please note, you need to have at least sent one normal message to a contact in order for this to work properly.
   * 
   * @param to string chatid
   * @param content string reply text
   * @param quotedMsgId string the msg id to reply to.
   * @param sendSeen boolean If set to true, the chat will 'blue tick' all messages before sending the reply
   * @returns Promise<string | boolean> false if didn't work, otherwise returns message id.
   */
  public async reply(to: ChatId, content: Content, quotedMsgId: MessageId, sendSeen?: boolean) {
    if(sendSeen) await this.sendSeen(to);
    return await this.pup(
      ({ to, content, quotedMsgId }) =>WAPI.reply(to, content, quotedMsgId),
      { to, content, quotedMsgId }
    ) as Promise<string | boolean>;
  }

  /**
   * [REQUIRES AN INSIDERS LICENSE-KEY](https://gum.co/open-wa?tier=Insiders%20Program)
   * 
   * Check if a recipient has read receipts on.
   * 
   * This will only work if you have chats sent back and forth between you and the contact 1-1.
   * 
   * @param contactId The Id of the contact with which you have an existing conversation with messages already.
   * @returns Promise<string | boolean> true or false or a string with an explaintaion of why it wasn't able to determine the read receipts.
   * 
   */
  public async checkReadReceipts(contactId: ContactId){
    return await this.pup(
      ({ contactId }) =>WAPI.checkReadReceipts(contactId),
      { contactId }
    ) as Promise<string | boolean>;
  }

  /**
   * Sends a file to given chat, with caption or not, using base64. This is exactly the same as sendImage
   * @param to chat id xxxxx@c.us
   * @param file DataURL data:image/xxx;base64,xxx or the RELATIVE (should start with `./` or `../`) path of the file you want to send. With the latest version, you can now set this to a normal URL (for example [GET] `https://file-examples-com.github.io/uploads/2017/10/file_example_JPG_2500kB.jpg`).
   * @param filename string xxxxx
   * @param caption string xxxxx With an [INSIDERS LICENSE-KEY](https://gum.co/open-wa?tier=Insiders%20Program) you can also tag people in groups with `@[number]`. For example if you want to mention the user with the number `44771234567`, just add `@44771234567` in the caption.
   * @param quotedMsgId string true_0000000000@c.us_JHB2HB23HJ4B234HJB to send as a reply to a message
   * @param waitForId boolean default: false set this to true if you want to wait for the id of the message. By default this is set to false as it will take a few seconds to retrieve to the key of the message and this waiting may not be desirable for the majority of users.
   * @param ptt boolean default: false set this to true if you want to send the file as a push to talk file.
   * @param withoutPreview boolean default: false set this to true if you want to send the file without a preview (i.e as a file). This is useful for preventing auto downloads on recipient devices.
   * @returns Promise <boolean | string> This will either return true or the id of the message. It will return true after 10 seconds even if waitForId is true
   */
  public async sendFile(
    to: ChatId,
    file: DataURL | FilePath,
    filename: string,
    caption: Content,
    quotedMsgId?: MessageId,
    waitForId?: boolean,
    ptt?:boolean,
    withoutPreview?:boolean
  ) {
    return this.sendImage(to, file, filename, caption, quotedMsgId, waitForId, ptt, withoutPreview);
  }


  /**
   * Attempts to send a file as a voice note. Useful if you want to send an mp3 file.
   * @param to chat id xxxxx@c.us
   * @param base64 base64 data:image/xxx;base64,xxx or the path of the file you want to send.
   * @param quotedMsgId string true_0000000000@c.us_JHB2HB23HJ4B234HJB to send as a reply to a message
   * @returns Promise <boolean | string> This will either return true or the id of the message. It will return true after 10 seconds even if waitForId is true
   */
  public async sendPtt(
    to: ChatId,
    file: DataURL | FilePath,
    quotedMsgId: MessageId,
  ) {
    return this.sendImage(to, file, 'ptt.ogg', '', quotedMsgId, true, true);
  }
  
  /**
   * Alias for [[sendPtt]]
   */
  public async sendAudio(
    to: ChatId,
    file: DataURL | FilePath,
    quotedMsgId: MessageId,
  ) {
    return this.sendPtt(to, file,quotedMsgId);
  }




  /**
   * Sends a video to given chat as a gif, with caption or not, using base64
   * @param to chat id xxxxx@c.us
   * @param base64 base64 data:image/xxx;base64,xxx or the path of the file you want to send.
   * @param filename string xxxxx
   * @param caption string xxxxx
   * @param quotedMsgId string true_0000000000@c.us_JHB2HB23HJ4B234HJB to send as a reply to a message
   */
  public async sendVideoAsGif(
    to: ChatId,
    file: DataURL | FilePath,
    filename: string,
    caption: Content,
    quotedMsgId?: MessageId
  ) {
    return await this.pup(
      ({ to, file, filename, caption, quotedMsgId  }) => {
        WAPI.sendVideoAsGif(file, to, filename, caption, quotedMsgId );
      },
      { to, file, filename, caption, quotedMsgId }
    ) as Promise<MessageId>;
  }

  /**
   * Sends a video to given chat as a gif by using a giphy link, with caption or not, using base64
   * @param to chat id xxxxx@c.us
   * @param giphyMediaUrl string https://media.giphy.com/media/oYtVHSxngR3lC/giphy.gif => https://i.giphy.com/media/oYtVHSxngR3lC/200w.mp4
   * @param caption string xxxxx
   */
  public async sendGiphy(
    to: ChatId,
    giphyMediaUrl: string,
    caption: Content
  ) {
    var ue = /^https?:\/\/media\.giphy\.com\/media\/([a-zA-Z0-9]+)/
    var n = ue.exec(giphyMediaUrl);
    if (n) {
      const r = `https://i.giphy.com/${n[1]}.mp4`;
      const filename = `${n[1]}.mp4`
      const dUrl = await getDUrl(r);
      return await this.pup(
        ({ to, base64, filename, caption }) => {
          WAPI.sendVideoAsGif(dUrl, to, filename, caption);
        },
        { to, dUrl, filename, caption }
      ) as Promise<MessageId>;
    } else {
      console.log('something is wrong with this giphy link');
      return;
    }
  }


  /**
   * Sends a file by Url or custom options
   * @param to chat id xxxxx@c.us
   * @param url string https://i.giphy.com/media/oYtVHSxngR3lC/200w.mp4
   * @param filename string 'video.mp4'
   * @param caption string xxxxx
   * @param quotedMsgId string true_0000000000@c.us_JHB2HB23HJ4B234HJB to send as a reply to a message
   * @param requestConfig {} By default the request is a get request, however you can override that and many other options by sending this parameter. You can read more about this parameter here: https://github.com/axios/axios#request-config
   * @param waitForId boolean default: false set this to true if you want to wait for the id of the message. By default this is set to false as it will take a few seconds to retrieve to the key of the message and this waiting may not be desirable for the majority of users.
   * @param ptt boolean default: false set this to true if you want to send the file as a push to talk file.
   * @param withoutPreview boolean default: false set this to true if you want to send the file without a preview (i.e as a file). This is useful for preventing auto downloads on recipient devices.
   */
  public async sendFileFromUrl(
    to: ChatId,
    url: string,
    filename: string,
    caption: Content,
    quotedMsgId?: MessageId,
    requestConfig: any = {},
    waitForId?: boolean,
    ptt?:boolean,
    withoutPreview?:boolean
  ) {
    try {
     const base64 = await getDUrl(url, requestConfig);
      return await this.sendFile(to,base64,filename,caption,quotedMsgId,waitForId,ptt,withoutPreview)
    } catch(error) {
      console.log('Something went wrong', error);
      throw error;
    }
  }

/**
 * Returns an object with all of your host device details
 */
  public async getMe(){
    return await this._page.evaluate(() => WAPI.getMe());
    // return await this.pup(() => WAPI.getMe());
    //@ts-ignore
    // return await this.pup(() => Store.Me.attributes);
  }

  /**
   * Returns a PNG DataURL screenshot of the session
   * @returns Promise<DataURL>
   */
  public async getSnapshot(){
    const screenshot = await this.getPage().screenshot({
      type:"png",
      encoding: "base64"
    });
    return `data:image/png;base64,${screenshot}`;
  }

/**
 * Returns an array of group ids where the host device is admin
 */
public async iAmAdmin(){
  return await this.pup(() => WAPI.iAmAdmin()) as Promise<GroupChatId[]>;
}

  /**
   * Syncs contacts with phone. This promise does not resolve so it will instantly return true.
   */
  public async syncContacts(){
    //@ts-ignore
    return await this.pup(() => WAPI.syncContacts()) as Promise<boolean>;
  }

   /**
    * SEasily get the amount of messages loaded up in the session. This will allow you to determine when to clear chats/cache.
    */
   public async getAmountOfLoadedMessages(){
     return await this.pup(() => WAPI.getAmountOfLoadedMessages()) as Promise<number>;
   }


  /**
   * Find any product listings of the given number. Use this to query a catalog
   *
   * @param id id of buseinss profile (i.e the number with @c.us)
   * @param done Optional callback function for async execution
   * @returns None
   */
  public async getBusinessProfilesProducts(id: ContactId) {
    return await this.pup(
      ({ id }) => WAPI.getBusinessProfilesProducts(id),
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
    to: ChatId,
    image: Base64,
    caption: Content,
    bizNumber: ContactId,
    productId: string
  ) {
    return await this.pup(
      ({ to, image, bizNumber, caption, productId }) => {
        WAPI.sendImageWithProduct(image, to, caption, bizNumber, productId);
      },
      { to, image, bizNumber, caption, productId }
    );
  }

  /**
   * Feature Currently only available with Premium License accounts.
   * 
   * Send a custom product to a chat. Please see [[CustomProduct]] for details.
   * 
   * Caveats:
   * - URL will not work (unable to click), you will have to send another message with the URL.
   * - Recipient will see a thin banner under picture that says "Something went wrong"
   * - This will only work if you have at least 1 product already in your catalog
   * - Only works on Business accounts
   */

   public async sendCustomProduct(to: ChatId, image: DataURL, productData: CustomProduct){
    return await this.pup(
      ({ to, image, productData }) => WAPI.sendCustomProduct(to, image, productData),
      { to, image, productData }
    ) as Promise<MessageId | boolean>;
   }

  /**
   * Sends contact card to given chat id
   * @param {string} to 'xxxx@c.us'
   * @param {string|array} contact 'xxxx@c.us' | ['xxxx@c.us', 'yyyy@c.us', ...]
   */
  public async sendContact(to: ChatId, contactId: ContactId | ContactId[]) {
    return await this.pup(
      ({ to, contactId }) => WAPI.sendContact(to, contactId),
      { to, contactId }
    );
  }


  /**
   * Simulate '...typing' in chat
   * @param {string} to 'xxxx@c.us'
   * @param {boolean} on turn on similated typing, false to turn it off you need to manually turn this off.
   */
  public async simulateTyping(to: ChatId, on: boolean) {
    return await this.pup(
      ({ to, on }) => WAPI.simulateTyping(to, on),
      { to, on }
    ) as Promise<boolean>;
  }


  /**
   * @param id The id of the conversation
   * @param archive boolean true => archive, false => unarchive
   * @return boolean true: worked, false: didnt work (probably already in desired state)
   */
  public async archiveChat(id: ChatId, archive: boolean) {
    return await this.pup(
      ({ id, archive }) => WAPI.archiveChat(id, archive),
      { id, archive }
    ) as Promise<boolean>;
  }


  /**
   * Forward an array of messages to a specific chat using the message ids or Objects
   *
   * @param to '000000000000@c.us'
   * @param messages this can be any mixture of message ids or message objects
   * @param skipMyMessages This indicates whether or not to skip your own messages from the array
   */
  public async forwardMessages(to: ChatId, messages: MessageId | MessageId[], skipMyMessages: boolean) {
    return await this.pup(
      ({ to, messages, skipMyMessages }) => WAPI.forwardMessages(to, messages, skipMyMessages),
      { to, messages, skipMyMessages }
    );
  }

/**
 * Ghost forwarding is like a normal forward but as if it were sent from the host phone [i.e it doesn't show up as forwarded.]
 * Any potential abuse of this method will see it become paywalled.
 * @param to: Chat id to forward the message to
 * @param messageId: message id of the message to forward. Please note that if it is not loaded, this will return false - even if it exists.
 * @returns Promise<boolean>
 */
  public async ghostForward(to: ChatId, messageId: MessageId) {
    return await this.pup(
      ({ to, messageId }) => WAPI.ghostForward(to, messageId),
      { to, messageId }
    ) as Promise<boolean>;
  }

  /**
   * Retrieves all contacts
   * @returns array of [Contact]
   */
  public async getAllContacts() {
    return await this.pup(() => WAPI.getAllContacts()) as Promise<Contact[]>;
  }

  public async getWAVersion() {
    return await this.pup(() => WAPI.getWAVersion()) as Promise<string>;
  }

  /**
   * Retrieves if the phone is online. Please note that this may not be real time.
   * @returns Boolean
   */
  public async isConnected() {
    return await this.pup(() => WAPI.isConnected()) as Promise<boolean>;
  }

  /**
   * Retrieves Battery Level
   * @returns Number
   */
  public async getBatteryLevel() {
    return await this.pup(() => WAPI.getBatteryLevel()) as Promise<number>;
  }

  /**
   * Retrieves whether or not phone is plugged in (i.e on charge)
   * @returns Number
   */
  public async getIsPlugged() {
    return await this.pup(() => WAPI.getIsPlugged()) as Promise<boolean>;
  }

  /**
   * Retrieves the host device number. Use this number when registering for a license key
   * @returns Number
   */
  public async getHostNumber() {
    return await this.pup(() => WAPI.getHostNumber()) as Promise<string>;
  }

  /**
   * Retrieves all chats
   * @returns array of [Chat]
   */
  public async getAllChats(withNewMessageOnly = false) {
    if (withNewMessageOnly) {
      return await this.pup(() =>
        WAPI.getAllChatsWithNewMsg()
      );
    } else {
      return await this.pup(() => WAPI.getAllChats()) as Promise<Chat[]>;
    }
  }


  /**
   * retrieves all Chat Ids
   * @returns array of [ChatId]
   */
  public async getAllChatIds() {
      return await this.pup(() => WAPI.getAllChatIds()) as Promise<string[]>;
  }

  /**
   * retrieves an array of IDs of accounts blocked by the host account.
   * @returns Promise<ChatId[]>
   */
  public async getBlockedIds() {
    return await this.pup(() => WAPI.getBlockedIds()) as Promise<string[]>;
  }

  /**
   * @deprecated
   * 
   * Retrieves all chats with messages
   * 
   * Please use `getAllUnreadMessages` instead of this to see all messages indicated by the green dots in the chat.
   * 
   * @returns array of [Chat]
   */
  public async getAllChatsWithMessages(withNewMessageOnly = false) {
    return JSON.parse(await this.pup(withNewMessageOnly => WAPI.getAllChatsWithMessages(withNewMessageOnly), withNewMessageOnly)) as Promise<Chat[]>;
  }

  /**
   * Retrieve all groups
   * @returns array of groups
   */
  public async getAllGroups(withNewMessagesOnly = false) {
    if (withNewMessagesOnly) {
      // prettier-ignore
      const chats = await this.pup(() => WAPI.getAllChatsWithNewMsg()) as Chat[];
      return chats.filter(chat => chat.isGroup);
    } else {
      const chats = await this.pup(() => WAPI.getAllChats()) as Chat[];
      return chats.filter(chat => chat.isGroup);
    }
  }

  /**
   * Retrieves group members as [Id] objects
   * @param groupId group id
   */
  public async getGroupMembersId(groupId: GroupChatId) {
    return await this.pup(
      groupId => WAPI.getGroupParticipantIDs(groupId),
      groupId
    ) as Promise<string[]>;
  }

  
/** Joins a group via the invite link, code, or message
 * @param link This param is the string which includes the invite link or code. The following work:
 * - Follow this link to join my WA group: https://chat.whatsapp.com/DHTGJUfFJAV9MxOpZO1fBZ
 * - https://chat.whatsapp.com/DHTGJUfFJAV9MxOpZO1fBZ
 * - DHTGJUfFJAV9MxOpZO1fBZ
 * 
 * If you have been removed from the group previously, it will return `401`
 * 
 * @returns Promise<string | boolean | number> Either false if it didn't work, or the group id.
 */
  public async joinGroupViaLink(link: string) {
    return await this.pup(
      link => WAPI.joinGroupViaLink(link),
      link
    ) as Promise<string | boolean | number>;
  }


/**
 * Block contact 
 * @param {string} id '000000000000@c.us'
 */
public async contactBlock(id: ContactId) {
  return await this.pup(id => WAPI.contactBlock(id),id)
}


/**
 * Report a contact for spam, block them and attempt to clear chat.
 * 
 * [This is a restricted feature and requires a restricted key.](https://gum.co/open-wa?tier=1%20Restricted%20License%20Key)
 * 
 * @param {string} id '000000000000@c.us'
 */
public async reportSpam(id: ContactId | ChatId) {
  return await this.pup(id => WAPI.REPORTSPAM(id),id)
}

/**
 * Unblock contact 
 * @param {string} id '000000000000@c.us'
 */
public async contactUnblock(id: ContactId) {
  return await this.pup(id => WAPI.contactUnblock(id),id) as Promise<boolean>;
}

  /**
   * Removes the host device from the group
   * @param groupId group id
   */
  public async leaveGroup(groupId: GroupChatId) {
    return await this.pup(
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
  public async getVCards(msgId: MessageId) {
    return await this.pup(
      msgId => WAPI.getVCards(msgId),
      msgId
    );
  }

  /**
   * Returns group members [Contact] objects
   * @param groupId
   */
  public async getGroupMembers(groupId: GroupChatId) {
    const membersIds = await this.getGroupMembersId(groupId);
    const actions = membersIds.map(memberId => {
      return this.getContact(memberId);
    });
    return await Promise.all(actions);
  }

  /**
   * Retrieves contact detail object of given contact id
   * @param contactId
   * @returns contact detial as promise
   */
  //@ts-ignore
  public async getContact(contactId: ContactId) {
    return await this.pup(
      contactId => WAPI.getContact(contactId),
      contactId
    ) as Promise<Contact>;
  }

  /**
   * Retrieves chat object of given contact id
   * @param contactId
   * @returns contact detial as promise
   */
  public async getChatById(contactId: ContactId) {
    return await this.pup(
      contactId => WAPI.getChatById(contactId),
      contactId
    ) as Promise<Chat>;
  }

  /**
   * Retrieves message object of given message id
   * @param messageId
   * @returns message object
   */
  public async getMessageById(messageId: MessageId) {
    return await this.pup(
      messageId => WAPI.getMessageById(messageId),
      messageId
    ) as Promise<Message>;
  }

  /**
   * Retrieves the last message sent by the host account in any given chat or globally.
   * @param chatId This is optional. If no chat Id is set then the last message sent by the host account will be returned.
   * @returns message object
   */
  public async getMyLastMessage(chatId?: ChatId) {
    return await this.pup(
      chatId => WAPI.getMyLastMessage(chatId),
      chatId
    ) as Promise<Message>;
  }

  /**
   * 
   * [REQUIRES AN INSIDERS LICENSE-KEY](https://gum.co/open-wa?tier=Insiders%20Program)
   * 
   * Retrieves a message object which results in a valid sticker instead of a blank one. This also works with animated stickers.
   * 
   * If you run this without a valid insiders key, it will return false and cause an error upon decryption.
   * 
   * @param messageId The message ID `message.id`
   * @returns message object OR `false`
   */
  public async getStickerDecryptable(messageId: MessageId) {
    const m = await this.pup(
      messageId => WAPI.getStickerDecryptable(messageId),
      messageId
    );
    if(!m) return false;
    return {
      t:m.t,
      id:m.id,
      ...bleachMessage(m)
    } as Message;
  }


  /**
   * 
   * [REQUIRES AN INSIDERS LICENSE-KEY](https://gum.co/open-wa?tier=Insiders%20Program)
   * 
   * If a file is old enough, it will 404 if you try to decrypt it. This will allow you to force the host account to re upload the file and return a decryptable message.
   * 
   * if you run this without a valid insiders key, it will return false and cause an error upon decryption.
   * 
   * @param messageId
   * @returns [[Message]] OR `false`
   */
  public async forceStaleMediaUpdate(messageId: MessageId) {
    const m = await this.pup(
      messageId => WAPI.forceStaleMediaUpdate(messageId),
      messageId
    );
    if(!m) return false;
    return {
      ...bleachMessage(m)
    } as Message;
  }

  /**
   * Retrieves chat object of given contact id
   * @param contactId
   * @returns contact detial as promise
   */
  public async getChat(contactId: ContactId) {
    return await this.pup(
      contactId => WAPI.getChat(contactId),
      contactId
    ) as Promise<Chat>;
  }

  /**
   * [REQUIRES AN INSIDERS LICENSE-KEY](https://gum.co/open-wa?tier=Insiders%20Program)
   * 
   * Retrieves the groups that you have in common with a contact
   * @param contactId
   * @returns Promise returning an array of common groups {
   * id:string,
   * title:string
   * }
   */
  public async getCommonGroups(contactId: ContactId) {
    return await this.pup(
      contactId => WAPI.getCommonGroups(contactId),
      contactId
    ) as Promise<{
      id: string,
      title: string
    } []>;
  }

  /**
   * Retrieves the epoch timestamp of the time the contact was last seen. This will not work if:
   * 1. They have set it so you cannot see their last seen via privacy settings.
   * 2. You do not have an existing chat with the contact.
   * 3. The chatId is for a group
   * In both of those instances this method will return undefined.
   * @param chatId The id of the chat.
   * @returns number timestamp when chat was last online or undefined.
   */
  public async getLastSeen(chatId: ChatId) {
    return await this.pup(
      chatId => WAPI.getLastSeen(chatId),
      chatId
    ) as Promise<number | boolean>;
  }

  /**
   * Retrieves chat picture
   * @param chatId
   * @returns Url of the chat picture or undefined if there is no picture for the chat.
   */
  public async getProfilePicFromServer(chatId: ChatId) {
    return await this.pup(
      chatId => WAPI.getProfilePicFromServer(chatId),
      chatId
    );
  }

  
  /**
   * Sets a chat status to seen. Marks all messages as ack: 3
   * @param chatId chat id: xxxxx@c.us
   */
  public async sendSeen(chatId: ChatId) {
    return await this.pup(
     chatId => WAPI.sendSeen(chatId),
      chatId
    ) as Promise<boolean>;
  }

  
  /**
   * Sets a chat status to unread. May be useful to get host's attention
   * @param chatId chat id: xxxxx@c.us
   */
  public async markAsUnread(chatId: ChatId) {
    return await this.pup(
     chatId => WAPI.markAsUnread(chatId),
      chatId
    ) as Promise<boolean>;
  }
  
  /**
   * Checks if a chat contact is online. Not entirely sure if this works with groups.
   * 
   * It will return `true` if the chat is `online`, `false` if the chat is `offline`, `PRIVATE` if the privacy settings of the contact do not allow you to see their status and `NO_CHAT` if you do not currently have a chat with that contact.
   * 
   * @param chatId chat id: xxxxx@c.us
   */
  public async isChatOnline(chatId: ChatId) {
    return await this.pup(
     chatId => WAPI.isChatOnline(chatId),
      chatId
    ) as Promise<boolean | string>;
  }


  /**
    * Load more messages in chat object from server. Use this in a while loop. This should return up to 50 messages at a time
   * @param contactId
   * @returns Message []
   */
  public async loadEarlierMessages(contactId: ContactId) {
    return await this.pup(
      contactId => WAPI.loadEarlierMessages(contactId),
      contactId
    ) as Promise<Message[]>;
  }

/**
 * Get the status of a contact
 * @param contactId {string} to '000000000000@c.us'
 * returns: {id: string,status: string}
 */

public async getStatus(contactId: ContactId) {
  return await this.pup(
    contactId => WAPI.getStatus(contactId),
    contactId
  ) as Promise<{id: string,status: string}>;
}

  /**
    * Load all messages in chat object from server.
   * @param contactId
   * @returns contact detial as promise
   */
  public async loadAllEarlierMessages(contactId: ContactId) {
    return await this.pup(
      contactId => WAPI.loadAllEarlierMessages(contactId),
      contactId
    );
  }

  /**
    * Delete the conversation from your WA
   * @param chatId
   * @returns boolean
   */
  public async deleteChat(chatId: ChatId) {
    return await this.pup(
      chatId => WAPI.deleteConversation(chatId),
      chatId
    ) as Promise<boolean>;
  }

  /**
    * Delete all messages from the chat.
   * @param chatId
   * @returns boolean
   */
  public async clearChat(chatId: ChatId) {
    return await this.pup(
      chatId => WAPI.clearChat(chatId),
      chatId
    );
  }

  /**
    * Retrieves an invite link for a group chat. returns false if chat is not a group.
   * @param chatId
   * @returns Promise<string>
   */
  public async getGroupInviteLink(chatId: ChatId) {
    return await this.pup(
      chatId => WAPI.getGroupInviteLink(chatId),
      chatId
    ) as Promise<string>;
  }

  /**
    * Get the details of a group through the invite link
   * @param link This can be an invite link or invite code
   * @returns 
   */
  public async inviteInfo(link: string) {
    return await this.pup(
      link => WAPI.inviteInfo(link),
      link
    );
  }


  /**
    * Revokes the current invite link for a group chat. Any previous links will stop working
   * @param chatId
   * @returns Promise<boolean>
   */
  public async revokeGroupInviteLink(chatId: ChatId) {
    return await this.pup(
      chatId => WAPI.revokeGroupInviteLink(chatId),
      chatId
    ) as Promise<string | boolean>;
  }

  /**
   * Deletes message of given message id
   * @param contactId The chat id from which to delete the message.
   * @param messageId The specific message id of the message to be deleted
   * @param onlyLocal If it should only delete locally (message remains on the other recipienct's phone). Defaults to false.
   * @returns nothing
   */
  public async deleteMessage(contactId: ContactId, messageId: MessageId[] | MessageId, onlyLocal : boolean = false) {
    return await this.pup(
      ({ contactId, messageId, onlyLocal }) => WAPI.smartDeleteMessages(contactId, messageId, onlyLocal),
      { contactId, messageId, onlyLocal }
    );
  }

  /**
   * Checks if a number is a valid WA number
   * @param contactId, you need to include the @c.us at the end.
   * @returns contact detial as promise
   */
  public async checkNumberStatus(contactId: ContactId) {
    return await this.pup(
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
    return await this.pup(
      ({ includeMe, includeNotifications, use_unread_count }) => WAPI.getUnreadMessages(includeMe, includeNotifications, use_unread_count),
      { includeMe, includeNotifications, use_unread_count }
    );
  }


  /**
   * Retrieves all new Messages. where isNewMsg==true
   * @returns list of messages
   */
  public async getAllNewMessages() {
    return await this.pup(() => WAPI.getAllNewMessages()) as Promise<Message[]>;
  }

  /**
   * Retrieves all unread Messages. where ack==-1
   * @returns list of messages
   */
  public async getAllUnreadMessages() {
    return await this.pup(() => WAPI.getAllUnreadMessages()) as Promise<Message[]>;
  }

  /**
   * Retrieves all unread Messages as indicated by the red dots in WA web. This returns an array of objects and are structured like so:
   * ```javascript
   * [{
   * "id": "000000000000@g.us", //the id of the chat
   * "indicatedNewMessages": [] //array of messages, not including any messages by the host phone
   * }]
   * ```
   * @returns list of messages
   */
  public async getIndicatedNewMessages() {
    return JSON.parse(await this.pup(() => WAPI.getIndicatedNewMessages())) as Promise<Message[]>;
  }

  /**
   * Retrieves all Messages in a chat that have been loaded within the WA web instance.
   * 
   * This does not load every single message in the chat history.
   * 
   * @param chatId, the chat to get the messages from
   * @param includeMe, include my own messages? boolean
   * @param includeNotifications
   * @returns Message[]
   */

  public async getAllMessagesInChat(chatId: ChatId, includeMe: boolean, includeNotifications: boolean) {
    return await this.pup(
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

  public async loadAndGetAllMessagesInChat(chatId: ChatId, includeMe: boolean, includeNotifications: boolean) {
    return await this.pup(
      ({ chatId, includeMe, includeNotifications }) => WAPI.loadAndGetAllMessagesInChat(chatId, includeMe, includeNotifications),
      { chatId, includeMe, includeNotifications }
    ) as Promise<Message[]>;
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
  public async createGroup(groupName:string,contacts:ContactId|ContactId[]){
    return await this.pup(
      ({ groupName, contacts }) => WAPI.createGroup(groupName, contacts),
      { groupName, contacts }
    );
  }

  /**
   * Remove participant of Group
   * 
   * If not a group chat, returns `NOT_A_GROUP_CHAT`.
   * 
   * If the chat does not exist, returns `GROUP_DOES_NOT_EXIST`
   * 
   * @param {*} groupId '0000000000-00000000@g.us'
   * @param {*} participantId '000000000000@c.us'
   */
  public async removeParticipant(groupId: GroupChatId, participantId: ContactId) {
    return await this.pup(
      ({ groupId, participantId }) => WAPI.removeParticipant(groupId, participantId),
      { groupId, participantId }
    ) as Promise<boolean>;
  }

/** Change the icon for the group chat
 * @param groupId 123123123123_1312313123@g.us The id of the group
 * @param imgData 'data:image/jpeg;base64,...` The base 64 data url. Make sure this is a small img (128x128), otherwise it will fail.
 * @returns boolean true if it was set, false if it didn't work. It usually doesn't work if the image file is too big.
 */
  public async setGroupIcon(groupId: GroupChatId, image: DataURL) {
    const buff = Buffer.from(image.replace(/^data:image\/(png|gif|jpeg);base64,/,''), 'base64');
    const mimeInfo = base64MimeType(image);
    console.log("setGroupIcon -> mimeInfo", mimeInfo)
    if(!mimeInfo || mimeInfo.includes("image")){
      //no matter what, convert to jpeg, resize + autoscale to width 48 px
      const scaledImageBuffer = await sharp(buff,{ failOnError: false })
      .resize({ height: 300 })
      .toBuffer();
      const jpeg = sharp(scaledImageBuffer,{ failOnError: false }).jpeg();
      const imgData = `data:jpeg;base64,${(await jpeg.toBuffer()).toString('base64')}`;
      return await this.pup(
        ({ groupId, imgData }) => WAPI.setGroupIcon(groupId, imgData),
        { groupId, imgData }
      ) as Promise<boolean>;
    }
  }

/** Change the icon for the group chat
 * @param groupId 123123123123_1312313123@g.us The id of the group
 * @param url'https://upload.wikimedia.org/wikipedia/commons/3/38/JPEG_example_JPG_RIP_001.jpg' The url of the image. Make sure this is a small img (128x128), otherwise it will fail.
 * @param requestConfig {} By default the request is a get request, however you can override that and many other options by sending this parameter. You can read more about this parameter here: https://github.com/axios/axios#request-config
 * @returns boolean true if it was set, false if it didn't work. It usually doesn't work if the image file is too big.
 */
  public async setGroupIconByUrl(groupId: GroupChatId, url: string, requestConfig: any = {}) {
    try {
      const base64 = await getDUrl(url, requestConfig);
       return await this.setGroupIcon(groupId,base64);
     } catch(error) {
       throw error;
     }
  }

  /**
  * Add participant to Group
  * 
  * If not a group chat, returns `NOT_A_GROUP_CHAT`.
  * 
  * If the chat does not exist, returns `GROUP_DOES_NOT_EXIST`
  * @param {*} groupId '0000000000-00000000@g.us'
  * @param {*} participantId '000000000000@c.us'
  * 
  */

  public async addParticipant(groupId: GroupChatId, participantId: ContactId) {
    return await this.pup(
      ({ groupId, participantId }) => WAPI.addParticipant(groupId, participantId),
      { groupId, participantId }
    );
  }

  /**
  * Promote Participant to Admin in Group
  * 
  * 
  * If not a group chat, returns `NOT_A_GROUP_CHAT`.
  * 
  * If the chat does not exist, returns `GROUP_DOES_NOT_EXIST`
  * 
  * @param {*} groupId '0000000000-00000000@g.us'
  * @param {*} participantId '000000000000@c.us'
  */

  public async promoteParticipant(groupId: GroupChatId, participantId: ContactId) {
    return await this.pup(
      ({ groupId, participantId }) => WAPI.promoteParticipant(groupId, participantId),
      { groupId, participantId }
    ) as Promise<boolean>;
  }

  /**
  * Demote Admin of Group
  * 
  * If not a group chat, returns `NOT_A_GROUP_CHAT`.
  * 
  * If the chat does not exist, returns `GROUP_DOES_NOT_EXIST`
  * 
  * @param {*} groupId '0000000000-00000000@g.us'
  * @param {*} participantId '000000000000@c.us'
  */
  public async demoteParticipant(groupId: GroupChatId, participantId: ContactId) {
    return await this.pup(
      ({ groupId, participantId }) => WAPI.demoteParticipant(groupId, participantId),
      { groupId, participantId }
    ) as Promise<boolean>;
  }

  /**
  * 
  * Change who can and cannot speak in a group
  * @param groupId '0000000000-00000000@g.us' the group id.
  * @param onlyAdmins boolean set to true if you want only admins to be able to speak in this group. false if you want to allow everyone to speak in the group
  * @returns boolean true if action completed successfully.
  */
  public async setGroupToAdminsOnly(groupId: GroupChatId, onlyAdmins: boolean) {
    return await this.pup(
      ({ groupId, onlyAdmins }) => WAPI.setGroupToAdminsOnly(groupId, onlyAdmins),
      { groupId, onlyAdmins }
    ) as Promise<boolean>;
  }

  /**
   * 
  * Change who can and cannot edit a groups details
  * @param groupId '0000000000-00000000@g.us' the group id.
  * @param onlyAdmins boolean set to true if you want only admins to be able to speak in this group. false if you want to allow everyone to speak in the group
  * @returns boolean true if action completed successfully.
  */
 public async setGroupEditToAdminsOnly(groupId: GroupChatId, onlyAdmins: boolean) {
  return await this.pup(
    ({ groupId, onlyAdmins }) => WAPI.setGroupEditToAdminsOnly(groupId, onlyAdmins),
    { groupId, onlyAdmins }
  ) as Promise<boolean>;
}

  /**
   * [REQUIRES AN INSIDERS LICENSE-KEY](https://gum.co/open-wa?tier=Insiders%20Program)
   * 
  * Change the group chant description
  * @param groupId '0000000000-00000000@g.us' the group id.
  * @param description string The new group description
  * @returns boolean true if action completed successfully.
  */
 public async setGroupDescription(groupId: GroupChatId, description: string) {
  return await this.pup(
    ({ groupId, description }) => WAPI.setGroupDescription(groupId, description),
    { groupId, description }
  ) as Promise<boolean>;
}

  /**
   * [REQUIRES AN INSIDERS LICENSE-KEY](https://gum.co/open-wa?tier=Insiders%20Program)
   * 
  * Change the group chat title
  * @param groupId '0000000000-00000000@g.us' the group id.
  * @param title string The new group title
  * @returns boolean true if action completed successfully.
  */
 public async setGroupTitle(groupId: GroupChatId, title: string) {
  return await this.pup(
    ({ groupId, title }) => WAPI.setGroupTitle(groupId, title),
    { groupId, title }
  ) as Promise<boolean>;
}

  /**
  * Get Admins of a Group
  * @param {*} groupId '0000000000-00000000@g.us'
  */
  public async getGroupAdmins(groupId: GroupChatId) {
    return await this.pup(
      (groupId) => WAPI.getGroupAdmins(groupId),
      groupId
    ) as Promise<ContactId[]>;
  }

  /**
   * [REQUIRES AN INSIDERS LICENSE-KEY](https://gum.co/open-wa?tier=Insiders%20Program)
   * 
   * Set the wallpaper background colour
   * @param {string} hex '#FFF123'
  */
  public async setChatBackgroundColourHex(hex: string) {
    return await this.pup(
      (hex) => WAPI.setChatBackgroundColourHex(hex),
      hex
    ) as Promise<boolean>;
  }

  /**
   * 
   * Start dark mode [NOW GENERALLY AVAILABLE]
   * @param {boolean} activate true to activate dark mode, false to deactivate
  */
  public async darkMode(activate: boolean) {
    return await this.pup(
      (activate) => WAPI.darkMode(activate),
      activate
    ) as Promise<boolean>;
  }
  

  /**
   * Returns an array of contacts that have read the message. If the message does not exist, it will return an empty array. If the host account has disabled read receipts this may not work!
   * Each of these contact objects have a property `t` which represents the time at which that contact read the message.
   * @param messageId The message id
   */
  public async getMessageReaders(messageId: MessageId) {
    return await this.pup(
      (messageId) => WAPI.getMessageReaders(messageId),
      messageId
    ) as Promise<Contact[]>;
  }

  /**
   * Sends a sticker (including GIF) from a given URL
   * @param to: The recipient id.
   * @param url: The url of the image
   * @param requestConfig {} By default the request is a get request, however you can override that and many other options by sending this parameter. You can read more about this parameter here: https://github.com/axios/axios#request-config
   *
   * @returns Promise<MessageId | boolean>
   */
  public async sendStickerfromUrl(to: ChatId, url: string, requestConfig: any = {}) {
    try {
      const base64 = await getDUrl(url, requestConfig);
      return await this.sendImageAsSticker(to, base64);
     } catch(error) {
       console.log('Something went wrong', error);
       throw error;
     }
  }

  /**
   * [REQUIRES AN INSIDERS LICENSE-KEY](https://gum.co/open-wa?tier=Insiders%20Program)
   * 
   * Sends a sticker from a given URL
   * @param to The recipient id.
   * @param url The url of the image
   * @param messageId The id of the message to reply to
   * @param requestConfig {} By default the request is a get request, however you can override that and many other options by sending this parameter. You can read more about this parameter here: https://github.com/axios/axios#request-config
   * 
   * @returns Promise<MessageId | boolean>
   */
  public async sendStickerfromUrlAsReply(to: ChatId, url: string, messageId: MessageId, requestConfig: any = {}) {
    const dUrl = await getDUrl(url, requestConfig);
    let processingResponse = await this.prepareWebp(dUrl);
    if(!processingResponse) return false;
    let {webpBase64, metadata} = processingResponse;
      return await this.pup(
        ({ webpBase64,to, metadata , messageId }) => WAPI.sendStickerAsReply(webpBase64,to, metadata, messageId),
        { webpBase64,to, metadata, messageId }
      );
  }
  

  /**
   * [REQUIRES AN INSIDERS LICENSE-KEY](https://gum.co/open-wa?tier=Insiders%20Program)
   * 
   * This function takes an image and sends it as a sticker to the recipient as a reply to another message.
   * 
   * 
   * @param to  The recipient id.
   * @param image  This is the base64 string formatted with data URI. You can also send a plain base64 string but it may result in an error as the function will not be able to determine the filetype before sending.
   * @param messageId  The id of the message to reply to
   */
  public async sendImageAsStickerAsReply(to: ChatId, image: DataURL, messageId: MessageId){
    let processingResponse = await this.prepareWebp(image);
    if(!processingResponse) return false;
    let {webpBase64, metadata} = processingResponse;
      return await this.pup(
        ({ webpBase64,to, metadata, messageId }) => WAPI.sendStickerAsReply(webpBase64,to, metadata, messageId),
        { webpBase64,to, metadata, messageId }
      );
  }

  /**
   * This allows you to get a single property of a single object from the session. This limints the amouunt of data you need to sift through, reduces congestion between your process and the session and the flexibility to build your own specific getters.
   * 
   * Example - get message read state (ack):
   * 
   * ```javascript
   * const ack  = await client.getSingleProperty('Msg',"true_12345678912@c.us_9C4D0965EA5C09D591334AB6BDB07FEB",'ack')
   * ```
   * @param namespace
   * @param id id of the object to get from the specific namespace
   * @param property the single property key to get from the object.
   * @returns any If the property or the id cannot be found, it will return a 404
   */
  public async getSingleProperty(namespace: namespace, id: string, property : string) {
    return await this.pup(
      ({ namespace, id, property }) => WAPI.getSingleProperty(namespace, id, property),
      { namespace, id, property }
    );
  }

  private async prepareWebp(image: DataURL) {
    const buff = Buffer.from(image.replace(/^data:image\/(png|gif|jpeg|webp);base64,/,''), 'base64');
    const mimeInfo = base64MimeType(image);
    if(!mimeInfo || mimeInfo.includes("image")){
      let webpBase64 = image;
      let metadata : any = { width: 512, height: 512 };
      if(!mimeInfo.includes('webp')) {
        const { pages } = await sharp(buff).metadata();
      //@ts-ignore
      let webp = sharp(buff,{ failOnError: false, animated: !!pages}).webp();
      if(!!!pages) webp = webp.resize(metadata);
      metadata = await webp.metadata();
      metadata.animated = !!pages;
      webpBase64 = (await webp.toBuffer()).toString('base64');
      return {
        metadata,
        webpBase64
      }
      }
    } else {
      console.log('Not an image');
      return false;
    }
  }

  /**
   * This function takes an image (including animated GIF) and sends it as a sticker to the recipient. This is helpful for sending semi-ephemeral things like QR codes. 
   * The advantage is that it will not show up in the recipients gallery. This function automatiicaly converts images to the required webp format.
   * @param to: The recipient id.
   * @param image: This is the base64 string formatted as a data URI. 
   */
  public async sendImageAsSticker(to: ChatId, image: DataURL){
    let processingResponse = await this.prepareWebp(image);
    if(!processingResponse) return false;
    let {webpBase64, metadata} = processingResponse;
      return await this.pup(
        ({ webpBase64,to, metadata }) => WAPI.sendImageAsSticker(webpBase64,to, metadata),
        { webpBase64,to, metadata }
      );
  }

  /**
   * [ALPHA]
   * Use this to send an mp4 file as a sticker. This can also be used to convert GIFs from the chat because GIFs in WA are actually tiny mp4 files.
   * 
   * You need to make sure you have ffmpeg (with libwebp) installed for this to work.
   * 
   * @param to ChatId The chat id you want to send the webp sticker to
   * @param file [[DataURL]], [[Base64]], URL (string GET), Relative filepath (string), or Buffer of the mp4 file
   */
  public async sendMp4AsSticker(to: ChatId, file: DataURL | Buffer | Base64 | string, processOptions: {
    /**
     * Desired Frames per second of the sticker output
     * @default `10`
     */
    fps?: number,
    /**
     * The video start time of the sticker
     * @default `00:00:00.0`
     */
    startTime?: string,
    /**
     * The video end time of the sticker. By default, stickers are made from the first 5 seconds of the video
     * @default `00:00:05.0`
     */
    endTime?: string
    /**
     * The amount of times the video loops in the sticker. To save processing time, leave this as 0
     * default `0`
     */
    loop?: number
    /**
     * Centres and crops the video.
     * default `true`
     */
    crop?: boolean
  } = {
    fps: 10,
    startTime: `00:00:00.0`,
    endTime :  `00:00:05.0`,
    loop: 0,
    crop: true
  }) {
      if(typeof file === 'string') {
      if(!isDataURL(file)) {
        //must be a file then
        if(isUrl(file)){
          file = await getDUrl(file)
        } else {
          let relativePath = path.join(path.resolve(process.cwd(),file|| ''));
          if(fs.existsSync(file) || fs.existsSync(relativePath)) {
            file = await datauri(fs.existsSync(file)  ? file : relativePath);
          } 
        } 
      }
      }
    const convertedStickerDataUrl = await convertMp4BufferToWebpDataUrl(file, processOptions);
    try {
      return await this.sendRawWebpAsSticker(to, convertedStickerDataUrl, true);
    } catch (error) {
      console.log('Stickers have to be less than 1MB. Please lower the fps or shorten the duration using the processOptions parameter: https://open-wa.github.io/wa-automate-nodejs/classes/client.html#sendmp4assticker')
      throw error;
    }
  }

  /**
   * [WIP]
   * You can use this to send a raw webp file.
   * @param to ChatId The chat id you want to send the webp sticker to
   * @param webpBase64 Base64 The base64 string of the webp file. Not DataURl
   * @param animated Boolean Set to true if the webp is animated. Default `false`
   */
  public async sendRawWebpAsSticker(to: ChatId, webpBase64: Base64, animated : boolean = false){
    let metadata =  {
        format: 'webp',
        width: 512,
        height: 512,
        animated,
    }
    webpBase64 = webpBase64.replace(/^data:image\/(png|gif|jpeg|webp);base64,/,'');
    return await this.pup(
      ({ webpBase64,to, metadata }) => WAPI.sendImageAsSticker(webpBase64,to, metadata),
      { webpBase64,to, metadata }
    );
  }

  /**
   * [REQUIRES AN INSIDERS LICENSE-KEY](https://gum.co/open-wa?tier=Insiders%20Program)
   * 
   * Turn the ephemeral setting in a chat to on or off
   * @param chatId The ID of the chat
   * @param ephemeral `true` to turn on the ephemeral setting, `false` to turn off the ephemeral setting. Please note, if the setting is already on the requested setting, this method will return `true`.
   * @returns Promise<boolean> true if the setting was set, `false` if the chat does not exist
   */
  public async setChatEphemeral(chatId: ChatId, ephemeral: boolean){
    return await this.pup(
      ({ chatId,  ephemeral}) => WAPI.setChatEphemeral(chatId,  ephemeral),
      { chatId,  ephemeral }
    );
  }

  /**
   * Send a giphy GIF as an animated sticker.
   * @param to ChatId
   * @param giphyMediaUrl URL | string This is the giphy media url and has to be in the format `https://media.giphy.com/media/RJKHjCAdsAfQPn03qQ/source.gif` or it can be just the id `RJKHjCAdsAfQPn03qQ`
   */
  public async sendGiphyAsSticker(to: ChatId, giphyMediaUrl: URL | string){
    return await this.pup(
      ({ to,  giphyMediaUrl}) => WAPI.sendGiphyAsSticker(to,  giphyMediaUrl),
      { to,  giphyMediaUrl }
    );
  }
  
  /**
   * [REQUIRES A TEXT STORY LICENSE-KEY](https://gum.co/open-wa)
   * 
   * Sends a formatted text story.
   * @param text The text to be displayed in the story 
   * @param textRgba The colour of the text in the story in hex format, make sure to add the alpha value also. E.g "#FF00F4F2"
   * @param backgroundRgba  The colour of the background in the story in hex format, make sure to add the alpha value also. E.g "#4FF31FF2"
   * @param font The font of the text to be used in the story. This has to be a number. Each number refers to a specific predetermined font. Here are the fonts you can choose from:
   * 0: Sans Serif
   * 1: Serif
   * 2: [Norican Regular](https://fonts.google.com/specimen/Norican)
   * 3: [Bryndan Write](https://www.dafontfree.net/freefonts-bryndan-write-f160189.htm)
   * 4: [Bebasneue Regular](https://www.dafont.com/bebas-neue.font)
   * 5: [Oswald Heavy](https://www.fontsquirrel.com/fonts/oswald)
   * @returns Promise<string | boolean> returns status id if it worked, false if it didn't
   */
  public async postTextStatus(text: Content, textRgba: string, backgroundRgba: string, font: number){
    return await this.pup(
      ({ text, textRgba, backgroundRgba, font }) => WAPI.postTextStatus(text, textRgba, backgroundRgba, font),
      { text, textRgba, backgroundRgba, font }
    ) as Promise<boolean | string>;
  }

  /**
   * [REQUIRES AN IMAGE STORY LICENSE-KEY](https://gum.co/open-wa)
   * 
   * Posts an image story.
   * @param data data url string `data:[<MIME-type>][;charset=<encoding>][;base64],<data>`
   * @param caption The caption for the story 
   * @returns Promise<string | boolean> returns status id if it worked, false if it didn't
   */
  public async postImageStatus(data: DataURL, caption: Content){
    return await this.pup(
      ({data, caption}) => WAPI.postImageStatus(data, caption),
      { data, caption }
    ) as Promise<boolean | string>;
  }

  /**
   * [REQUIRES A VIDEO STORY LICENSE-KEY](https://gum.co/open-wa)
   * 
   * Posts a video story.
   * @param data data url string `data:[<MIME-type>][;charset=<encoding>][;base64],<data>`
   * @param caption The caption for the story 
   * @returns Promise<string | boolean> returns status id if it worked, false if it didn't
   */
  public async postVideoStatus(data: DataURL, caption: Content){
    return await this.pup(
      ({data, caption}) => WAPI.postVideoStatus(data, caption),
      { data, caption }
    ) as Promise<boolean | string>;
  }


/**
 * Consumes a list of id strings of statuses to delete.
 * @param statusesToDelete string [] | stringan array of ids of statuses to delete.
 * @returns boolean. True if it worked.
 */
  public async deleteStatus(statusesToDelete: string | string []) {
    return await this.pup(
      ({ statusesToDelete }) => WAPI.deleteStatus(statusesToDelete),
      { statusesToDelete }
    );
  }

/**
 * Deletes all your existing statuses.
 * @returns boolean. True if it worked.
 */
  public async deleteAllStatus() {
    return await this.pup(() => WAPI.deleteAllStatus());
  }

  /**
   * retrieves all existing statuses.
   *
   * Only works with a Story License Key
   */
  public async getMyStatusArray() {
    return await this.pup(() => WAPI.getMyStatusArray());
  }

    
  /**
     * Retrieves an array of user ids that have 'read' your story.
     * 
     * @param id string The id of the story
     * 
     * Only works with a Story License Key
     */
    public async getStoryViewers(id: string) {
      return await this.pup(({ id }) => WAPI.getStoryViewers(id),{id}) as Promise<ContactId[]>;
    }
  

    /**
     * [REQUIRES AN INSIDERS LICENSE-KEY](https://gum.co/open-wa?tier=Insiders%20Program)
     * 
     * Clears all chats of all messages. This does not delete chats. Please be careful with this as it will remove all messages from whatsapp web and the host device. This feature is great for privacy focussed bots.
     */
  public async clearAllChats() {
    return await this.pup(() => WAPI.clearAllChats());
  }
  

    /**
     * This simple function halves the amount of messages in your session message cache. This does not delete messages off your phone. If over a day you've processed 4000 messages this will possibly result in 4000 messages being present in your session.
     * Calling this method will cut the message cache to 2000 messages, therefore reducing the memory usage of your process.
     * You should use this in conjunction with `getAmountOfLoadedMessages` to intelligently control the session message cache.
     */
  public async cutMsgCache() {
    return await this.pup(() => WAPI.cutMsgCache());
  }
  
  /**
   * Download profile pics from the message object.
   * ```javascript
   *  const filename = `profilepic_${message.from}.jpeg`;
   *  const data = await client.downloadProfilePicFromMessage(message);
   *  const dataUri = `data:image/jpeg;base64,${data}`;
   *  fs.writeFile(filename, mData, 'base64', function(err) {
   *    if (err) {
   *      return console.log(err);
   *    }
   *    console.log('The file was saved!');
   *  });
   * ```
   */
  public async downloadProfilePicFromMessage(message: Message) {
    return await this.downloadFileWithCredentials(message.sender.profilePicThumbObj.imgFull);
  }

  /**
   * Download via the browsers authenticated session via URL.
   * @returns base64 string (non-data url)
   */
  public async downloadFileWithCredentials(url: string){
    if(!url) throw new Error('Missing URL');
    return await this.pup(({ url }) => WAPI.downloadFileWithCredentials(url),{url});
  }
  
    
  /**
   * 
   * Sets the profile pic of the host number.
   * @param data string data url image string.
   * @returns Promise<boolean> success if true
   */
  public async setProfilePic(data: DataURL){
    return await this.pup(({ data }) => WAPI.setProfilePic(data),{data}) as Promise<boolean>;
  }

  /**
   * This exposes a simple express middlware that will allow users to quickly boot up an api based off this client. Checkout demo/index.ts for an example
   * How to use the middleware:
   * 
   * ```javascript
   * 
   * import { create } from '@open-wa/wa-automate';
   * const express = require('express')
   * const app = express()
   * app.use(express.json())
   * const PORT = 8082;
   * 
   * function start(client){
   *   app.use(client.middleware()); //or client.middleware(true) if you require the session id to be part of the path (so localhost:8082/sendText beccomes localhost:8082/sessionId/sendText)
   *   app.listen(PORT, function () {
   *     console.log(`\n• Listening on port ${PORT}!`);
   *   });
   *   ...
   * }
   * 
   * 
   * create({
   *   sessionId:'session1'
   * }).then(start)
   * 
   * ```
   * 
   * All requests need to be `POST` requests. You use the API the same way you would with `client`. The method can be the path or the method param in the post body. The arguments for the method should be properly ordered in the args array in the JSON post body.
   * 
   * Example:
   * 
   * ```javascript
   *   await client.sendText('4477777777777@c.us','test')
   *   //returns "true_4477777777777@c.us_3EB0645E623D91006252"
   * ```
   * as a request with a path:
   * 
   * ```javascript
   * const axios = require('axios').default;
   * axios.post('localhost:8082/sendText', {
   *     args: [
   *        "4477777777777@c.us",    
   *        "test"    
   *         ]
   *   })
   * ```
   * 
   * or as a request without a path:
   * 
   * ```javascript
   * const axios = require('axios').default;
   * axios.post('localhost:8082', {
   *     method:'sendText',
   *     args: [
   *        "4477777777777@c.us",    
   *        "test"   
   *         ]
   * })
   * ```
   * 
   * As of 1.9.69, you can also send the argyments as an object with the keys mirroring the paramater names of the relative client functions
   * 
   * Example:
   * 
   * ```javascript
   * const axios = require('axios').default;
   * axios.post('localhost:8082', {
   *     method:'sendText',
   *     args: {
   *        "to":"4477777777777@c.us",    
   *        "content":"test"   
   *         }
   * })
   * ```
   * @param useSessionIdInPath boolean Set this to true if you want to keep each session in it's own path.
   * 
   * For example, if you have a session with id  `host` if you set useSessionIdInPath to true, then all requests will need to be prefixed with the path `host`. E.g `localhost:8082/sendText` becomes `localhost:8082/host/sendText`
   */
  middleware = (useSessionIdInPath: boolean = false) => async (req,res,next) => {
    if(useSessionIdInPath && !req.path.includes(this._createConfig.sessionId) && this._createConfig.sessionId!== 'session') return next();
    if(req.method==='POST') {
      let {method,args} = req.body
      const m = method || this._createConfig.sessionId && this._createConfig.sessionId!== 'session' && req.path.includes(this._createConfig.sessionId) ? req.path.replace(`/${this._createConfig.sessionId}/`,'') :  req.path.replace('/','');
      if(args && !Array.isArray(args)) args = parseFunction().parse(this[m]).args.map(argName=> args[argName]);
      else if(!args) args = [];
      if(this[m]){
        try {
        const response = await this[m](...args);
        return res.send({
          success:true,
          response
        })
        } catch (error) {
        console.log("middleware -> error", error)
        return res.send({
          success:false,
          error
        })
        }
      }
      return res.status(404).send('Cannot find method')
    }
    return next();
  }

  /**
   * Retreives a list of [[SimpleListener]] that are registered to webhooks.
   */
  public async listWebhooks(){
    return Object.keys(this._registeredWebhooks) as SimpleListener[];
  }

  /**
   * Removes a webhook.
   * 
   * Returns `true` if the webhook was found and removed. `false` if the webhook was not found and therefore could not be removed.
   * 
   * @param simpleListener The webhook name to remove.
   * @retruns boolean
   */
  public async removeWebhook(simpleListener: SimpleListener){
    if(this?._registeredWebhooks[simpleListener]) {
      delete this._registeredWebhooks[simpleListener];
      return true; //`Webhook for ${simpleListener} removed`
    }
    return false; //`Webhook for ${simpleListener} not found`
  }
  
  /**
   * The client can now automatically handle webhooks. Use this method to register webhooks.
   * 
   * @param event use [[SimpleListener]] enum
   * @param url The webhook url
   * @param requestConfig {} By default the request is a post request, however you can override that and many other options by sending this parameter. You can read more about this parameter here: https://github.com/axios/axios#request-config
   * @param concurrency the amount of concurrent requests to be handled by the built in queue. Default is 5.
   */
  public async registerWebhook(event: SimpleListener, url: string, requestConfig: any = {}, concurrency: number = 5) {
    if(!this._webhookQueue) this._webhookQueue = new PQueue({ concurrency });
    if(this[event]){
      if(!this._registeredWebhooks) this._registeredWebhooks={};
      if(this._registeredWebhooks[event]) {
        console.log('webhook already registered');
        return false;
      }
      this._registeredWebhooks[event] = this[event](async _data=>await this._webhookQueue.add(async () => await axios({
        method: 'post',
        url,
        data: {
        ts: Date.now(),
        event,
        data:_data
        },
        ...requestConfig
      })));
      return this._registeredWebhooks[event];
    }
    console.log('Invalid lisetner', event);
    return false;
  }

  private async registerEv(simpleListener: SimpleListener) {
    if(this[simpleListener]){
      if(!this._registeredEvListeners) this._registeredEvListeners={};
      if(this._registeredEvListeners[simpleListener]) {
        console.log('Listener already registered');
        return false;
      }
      const sessionId = this.getSessionId();
      this._registeredEvListeners[simpleListener] = this[simpleListener](async data=>ev.emit(`${simpleListener}.${sessionId}`,{
        ts: Date.now(),
        sessionId,
        event: simpleListener,
        data
      }));
      return true;
    }
    console.log('Invalid lisetner', simpleListener);
    return false;
  }
  
}

export { useragent } from '../config/puppeteer.config'
