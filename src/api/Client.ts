import { default as mime } from 'mime-types';
import { Page, EvaluateFn } from 'puppeteer';
import { Chat, LiveLocationChangedEvent, ChatState, ChatMuteDuration, GroupChatCreationResponse } from './model/chat';
import { Contact, NumberCheck } from './model/contact';
import { Message } from './model/message';
import { default as axios, AxiosRequestConfig} from 'axios';
import { ParticipantChangedEventModel } from './model/group-metadata';
import { useragent, puppeteerConfig } from '../config/puppeteer.config'
import { ConfigObject, STATE, LicenseType, Webhook, OnError } from './model';
import { PageEvaluationTimeout, CustomError, ERROR_NAME, AddParticipantError  } from './model/errors';
import PQueue, { DefaultAddOptions, Options } from 'p-queue';
import { ev, Spin } from '../controllers/events';
import { v4 as uuidv4 } from 'uuid';
import { default as parseFunction} from 'parse-function'
import * as fs from 'fs'
import datauri from 'datauri'
import pino from 'pino'
import isUrl from 'is-url'
import { readJsonSync } from 'fs-extra'
import treekill from 'tree-kill';
import { HealthCheck, SessionInfo } from './model/sessionInfo';
import { deleteSessionData, injectApi } from '../controllers/browser';
import { isAuthenticated } from '../controllers/auth';
import { ChatId, GroupChatId, Content, Base64, MessageId, ContactId, DataURL, FilePath } from './model/aliases';
import { bleachMessage, decryptMedia } from '@open-wa/wa-decrypt';
import * as path from 'path';
import { CustomProduct, Label, Order } from './model/product';
import { defaultProcessOptions, Mp4StickerConversionProcessOptions, StickerMetadata } from './model/media';
import { getAndInjectLicense, getAndInjectLivePatch, getLicense } from '../controllers/initializer';
import { SimpleListener } from './model/events';
import { AwaitMessagesOptions, Collection, CollectorFilter, CollectorOptions } from '../structures/Collector';
import { MessageCollector } from '../structures/MessageCollector';
import { injectInitPatch } from '../controllers/init_patch';
import { Listener } from 'eventemitter2';
import PriorityQueue from 'p-queue/dist/priority-queue';
import { MessagePreprocessors } from '../structures/preProcessors';
import { NextFunction, Request, Response } from 'express';
import { base64MimeType, getDUrl, isBase64, isDataURL } from '../utils/tools';
import { Call } from './model/call';

/** @ignore */
const pkg = readJsonSync(path.join(__dirname,'../../package.json')),
createLogger = (sessionId: string, sessionInfo: SessionInfo, config: ConfigObject) => {
  const p = path.join(path.resolve(process.cwd()),`/logs/${sessionId || 'session'}/${sessionInfo.START_TS}.log`)
  if(!fs.existsSync(p)) {
    fs.mkdirSync(path.join(path.resolve(process.cwd()),`/logs/${sessionId || 'session'}`), {
      recursive:true
    })
  }
  const logger = pino({
  redact: ['file', 'base64', 'image', 'webpBase64', 'base64', 'durl', 'thumbnail'],
  },pino.destination(p))

  logger.child({
    "STAGE": "LAUNCH",
    sessionInfo,
    config
    }).info("")

  return logger
}

export enum namespace {
  Chat = 'Chat',
  Msg = 'Msg',
  Contact = 'Contact',
  GroupMetadata = 'GroupMetadata'
}


/* eslint-disable */
declare module WAPI {
  const waitNewMessages: (rmCallback: boolean, callback: Function) => void;
  const waitNewAcknowledgements: (callback: Function) => void;
  const addAllNewMessagesListener: (callback: Function) => void;
  const onStateChanged: (callback: Function) => void;
  const onChatState: (callback: Function) => any;
  const onOrder: (callback: Function) => any;
  const onIncomingCall: (callback: Function) => any;
  const onAddedToGroup: (callback: Function) => any;
  const onBattery: (callback: Function) => any;
  const onPlugged: (callback: Function) => any;
  const onGlobalParticipantsChanged: (callback: Function) => any;
  const onStory: (callback: Function) => any;
  const setChatBackgroundColourHex: (hex: string) => boolean;
  const darkMode: (activate: boolean) => boolean;
  const autoReject: (message: string) => boolean;
  const onParticipantsChanged: (groupId: string, callback: Function) => any;
  const _onParticipantsChanged: (groupId: string, callback: Function) => any;
  const onLiveLocation: (chatId: string, callback: Function) => any;
  const getSingleProperty: (namespace: string, id: string, property : string) => any;
  const sendMessage: (to: string, content: string) => Promise<string>;
  const setChatEphemeral: (chatId: string, ephemeral: boolean) => Promise<boolean>;
  const downloadFileWithCredentials: (url: string) => Promise<string>;
  const sendMessageWithMentions: (to: string, content: string, hideTags: boolean) => Promise<string>;
  const tagEveryone: (groupId: string, content: string, hideTags: boolean) => Promise<string>;
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
  const getOrder: (id: string) => Order;
  const getMyLastMessage: (chatId: string) => Promise<Message>;
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
  const createLabel: (label: string) => Promise<boolean | string>;
  const addOrRemoveLabels: (label: string, chatId: string, type: string) => Promise<boolean>;
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
  const sendLinkWithAutoPreview: (to: string,url: string,text: string, thumbnail : string) => Promise<string | boolean>;
  const contactBlock: (id: string) => Promise<boolean>;
  const checkReadReceipts: (contactId: string) => Promise<boolean | string>;
  const REPORTSPAM: (id: string) => Promise<boolean>;
  const contactUnblock: (id: string) => Promise<boolean>;
  const deleteConversation: (chatId: string) => Promise<boolean>;
  const isChatMuted: (chatId: string) => Promise<boolean>;
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
    withoutPreview?: boolean,
    hideTags?: boolean
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
  const getLastMsgTimestamps: () => any[];
  const getWAVersion: () => String;
  const getStoryViewers: (id: string) => Promise<String[]>;
  const getMe: () => any;
  const getAllLabels: () => any;
  const iAmAdmin: () => Promise<String[]>;
  const getLicenseType: () => Promise<String | false>;
  const getChatWithNonContacts: () => Contact[];
  const syncContacts: () => boolean;
  const getAmountOfLoadedMessages: () => number;
  const deleteAllStatus: () => Promise<boolean>;
  const getMyStatusArray: () => Promise<any>;
  const getAllUnreadMessages: () => any;  
  const getIndicatedNewMessages: () => any;
  const getAllChatsWithMessages: (withNewMessageOnly?: boolean) => any;
  const getAllChats: () => any;
  const healthCheck: () => any;
  const getState: () => string;
  const getUnsentMessages: () => Promise<Message[]>;
  const forceUpdateConnectionState: () => Promise<string>;
  const getBatteryLevel: () => number;
  const getIsPlugged: () => boolean;
  const clearAllChats: () => Promise<boolean>;
  const cutMsgCache: () => boolean;
  const cutChatCache: () => boolean;
  const deleteStaleChats: (startingFrom: number) => Promise<boolean>;
  const getChat: (contactId: string) => Chat;
  const getLastSeen: (contactId: string) => Promise<number | boolean>;
  const getProfilePicFromServer: (chatId: string) => any;
  const getAllChatIds: () => Promise<ChatId[]>;
  const getBlockedIds: () => Promise<ContactId[]>;
  const getAllChatsWithNewMsg: () => Chat[];
  const getAllNewMessages: () => any;
  const getUseHereString: () => Promise<string>;
  const getLocaledString: (query: string) => Promise<string>;
  const getHostNumber: () => string;
  const getAllGroups: () => Promise<Chat[]>;
  const getGroupParticipantIDs: (groupId: string) => Promise<string[]>;
  const getGroupInfo: (groupId: string) => Promise<any>;
  const joinGroupViaLink: (link: string, returnChatObj?: boolean) => Promise<string | boolean | number | Chat>;
  const muteChat: (chatId: ChatId, muteDuration: ChatMuteDuration) => Promise<string | boolean | number>;
  const unmuteChat: (chatId: ChatId) => Promise<string | boolean | number>;
  const leaveGroup: (groupId: string) => any;
  const getVCards: (msgId: string) => any;
  const getContact: (contactId: string) => Contact;
  const checkNumberStatus: (contactId: string) => any;
  const getChatById: (contactId: string) => Chat;
  const smartDeleteMessages: (contactId: string, messageId: string[] | string, onlyLocal:boolean) => any;
  const sendContact: (to: string, contact: string | string[]) => any;
  const sendMultipleContacts: (chatId: ChatId, contacts: ContactId[]) => any;
  const simulateTyping: (to: string, on: boolean) => Promise<boolean>;
  const archiveChat: (id: string, archive: boolean) => Promise<boolean>;
  const pinChat: (id: string, pin: boolean) => Promise<boolean>;
  const isConnected: () => Boolean;
  const loadEarlierMessages: (contactId: string) => Promise<Message []>;
  const getChatsByLabel: (label: string) => Promise<Chat[] | string>;
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
/* eslint-enable */

export class Client {
  private _loadedModules: any[];
  private _registeredWebhooks: any;
  private _registeredEvListeners: any;
  private _webhookQueue: any;
  private _createConfig: ConfigObject;
  private _sessionInfo: SessionInfo;
  private _listeners: any;
  private _page: Page;
  private _currentlyBeingKilled = false;
  private _refreshing = false
  private _l: any;
  private _prio: number = Number.MAX_SAFE_INTEGER;
  private _queues: {
    [key in SimpleListener] ?: PQueue
  } = {};
  /**
   * This is used to track if a listener is already used via webhook. Before, webhooks used to be set once per listener. Now a listener can be set via multiple webhooks, or revoked from a specific webhook.
   * For this reason, listeners assigned to a webhook are only set once and map through all possible webhooks to and fire only if the specific listener is assigned.
   * 
   * Note: This would be much simpler if eventMode was the default (and only) listener strategy.
   */
   private _registeredWebhookListeners = {};



  /**
   * @ignore
   * @param page [Page] [Puppeteer Page]{@link https://pptr.dev/#?product=Puppeteer&version=v2.1.1&show=api-class-page} running WA Web
   */
  constructor(page: Page, createConfig: ConfigObject, sessionInfo: SessionInfo) {
    this._page = page;
    this._createConfig = createConfig || {};
    this._loadedModules = [];
    this._sessionInfo = sessionInfo;
    this._sessionInfo.INSTANCE_ID = uuidv4();
    this._listeners = {};
    if(this._createConfig.stickerServerEndpoint!== false) this._createConfig.stickerServerEndpoint = true;
    this._setOnClose();
  }

  /**
   * @private
   * 
   * DO NOT USE THIS.
   * 
   * Run all tasks to set up client AFTER init is fully completed
   */
  async loaded() : Promise<void> {
      if(this._createConfig?.eventMode) {
        await this.registerAllSimpleListenersOnEv();
      }
      this._sessionInfo.PHONE_VERSION = (await this.getMe())?.phone?.wa_version
      this.logger().child({
        PHONE_VERSION: this._sessionInfo.PHONE_VERSION
      }).info()

      if(this._createConfig?.deleteSessionDataOnLogout || this._createConfig?.killClientOnLogout) {
        this.onLogout(() => {
            if(this._createConfig?.deleteSessionDataOnLogout) deleteSessionData(this._createConfig)
            if(this._createConfig?.killClientOnLogout) {
              console.log("Session logged out. Killing client")
              this.kill();
            }
        })
      }
  }

  private async registerAllSimpleListenersOnEv(){
      await Promise.all(Object.keys(SimpleListener).map(eventKey => this.registerEv(SimpleListener[eventKey])))
  }

  getSessionId() : string {
    return this._createConfig.sessionId || 'session'
  }

  getPage() : Page {
    return this._page;
  }

  private _setOnClose() : void {
    this._page.on('close',()=>{
      console.log("Browser page has closed. Killing client")
      this.kill();
      if(this._createConfig?.killProcessOnBrowserClose) process.exit();
    })
  }

  private async _reInjectWapi() : Promise<void> {
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
  public async download(url: string, optionsOverride: any = {} )  : Promise<DataURL> {
    return await getDUrl(url, optionsOverride)
  } 


  /**
   * Grab the logger for this session/process
   */
  public logger() : any {
    if(!this._l) this._l = createLogger(this.getSessionId(), this.getSessionInfo(), this.getConfig());
    return this._l;
  }

  /**
   * Refreshes the page and reinjects all necessary files. This may be useful for when trying to save memory
   * This will attempt to re register all listeners EXCEPT onLiveLocation and onParticipantChanged
   */
   public async refresh() : Promise<boolean> {
  this._refreshing = true;
     const spinner = new Spin(this._createConfig?.sessionId || 'session', 'REFRESH', this._createConfig?.disableSpins);
     const { me } = await this.getMe();
     /**
      * preload license
      */
     const preloadlicense = this._createConfig?.licenseKey ? await getLicense(this._createConfig, me, this._sessionInfo, spinner) : false
     spinner.info('Refreshing page')
     const START_TIME = Date.now();
     await this._page.goto(puppeteerConfig.WAUrl);
     if(await isAuthenticated(this._page)) {
       /**
        * Reset all listeners
        */
        this._registeredEvListeners = {};
        // this._listeners = {};
      await this._reInjectWapi();
      /**
       * patch
       */
      await getAndInjectLivePatch(this._page, spinner)
      if (this._createConfig?.licenseKey) await getAndInjectLicense(this._page,this._createConfig,me, this._sessionInfo, spinner, preloadlicense);
      /**
       * init patch
       */
     await injectInitPatch(this._page)
     await this.loaded()
     if(!this._createConfig?.eventMode) await this._reRegisterListeners();
     spinner.succeed(`Session refreshed in ${(Date.now() - START_TIME)/1000}s`)
     this._refreshing = false;
     spinner.remove()
     return true;
     } else throw new Error("Session Logged Out. Cannot refresh. Please restart the process and scan the qr code.")
   }

  /**
   * Get the session info
   * 
   * @returns SessionInfo
   */
  public getSessionInfo() : SessionInfo {
    return this._sessionInfo;
  }

  /**
   * Get the config which was used to set up the client. Sensitive details (like devTools username and password, and browserWSEndpoint) are scrubbed
   * 
   * @returns SessionInfo
   */
  public getConfig() : ConfigObject {
    /* eslint-disable */
    const {
      devtools,
      browserWSEndpoint,
      sessionData,
      proxyServerCredentials,
      restartOnCrash,
      ...rest
    } = this._createConfig;
    /* eslint-enable */
    return rest
  }


  private async pup(pageFunction:EvaluateFn<any>, ...args) {
    const {safeMode, callTimeout, idChecking, logFile} = this._createConfig;
    if(safeMode) {
      if(!this._page || this._page.isClosed()) throw new CustomError(ERROR_NAME.PAGE_CLOSED, 'page closed');
      const state = await this.forceUpdateConnectionState();
      if(state!==STATE.CONNECTED) throw new CustomError(ERROR_NAME.STATE_ERROR,`state: ${state}`);
    }
    if(idChecking && args[0]) {
      Object.entries(args[0]).map(([k,v] : [string,any]) => {
        if(["to","chatId", "groupChatId", "groupId", "contactId"].includes(k) && typeof v == "string" && v) {
        args[0][k] = v?.includes('-') ? 
                          //it is a group chat, make sure it has a @g.us at the end
                          `${v?.replace(/@(c|g).us/g,'')}@g.us` :
                          //it is a normal chat, make sure it has a @c.us at the end
                          `${v?.replace(/@(c|g).us/g,'')}@c.us`;
        }
      })
    }
    if(logFile) {
      const wapis = (pageFunction?.toString()?.match(/WAPI\.(\w*)\(/g) || [])?.map(s=>s.replace(/WAPI|\.|\(/g,''));
        this.logger().child({
                        _method: wapis?.length === 1 ? wapis[0] : wapis,
                        ...args[0]
                        }).info()
    }
    if(callTimeout) return await Promise.race([this._page.evaluate(pageFunction, ...args),new Promise((resolve, reject) => setTimeout(reject, this._createConfig?.callTimeout, new PageEvaluationTimeout()))])
    const res = await this._page.evaluate(pageFunction, ...args);
    if(this._createConfig.onError && typeof res == "string" && (res.startsWith("Error") || res.startsWith("ERROR"))) {
      const e = this._createConfig.onError;
      if(e == OnError.AS_STRING || e == OnError.NOTHING) return res
      if(e == OnError.LOG_AND_FALSE) {
        console.error(res);
        return true;
      }
      if(e == OnError.LOG_AND_STRING) {
        console.error(res);
        return res;
      }
      if(e == OnError.RETURN_ERROR) return new Error(res)
      if(e == OnError.RETURN_FALSE) return false
      if(e == OnError.THROW) throw new Error(res)
    }
    return res;
  }

  /**
   * ////////////////////////  LISTENERS
   */
  public removeListener(listener:SimpleListener) : boolean {
    ev.removeAllListeners(this.getEventSignature(listener));
    return true
  }

  public removeAllListeners() : boolean {
    Object.keys(this._registeredEvListeners).map(listener => ev.removeAllListeners(this.getEventSignature(listener as SimpleListener)))
    return true
  }

   /**
    * 
    */
  private async registerListener(funcName:SimpleListener, _fn: any, queueOptions ?: Options<PriorityQueue, DefaultAddOptions>) : Promise<Listener | boolean> {
    let fn;
    if(queueOptions) {
      if(!this._queues[funcName]) {
        this._queues[funcName] = new PQueue(queueOptions)
      }
      fn = async data => this._queues[funcName].add(()=>_fn(data), {
        priority: this.tickPriority()
      })
    } else {
      fn = _fn;
    }
    if(this._registeredEvListeners && this._registeredEvListeners[funcName]) {
      return ev.on(this.getEventSignature(funcName),({data})=>fn(data)) as Listener;
    }
    /**
     * If evMode is on then make the callback come from ev.
     */
    //add a reference to this callback
    const set = () => this.pup(({funcName}) => {
      //@ts-ignore
      return window[funcName] ? WAPI[`${funcName}`](obj => window[funcName](obj)) : false
    },{funcName});
    if(this._listeners[funcName] && !this._refreshing) {
      // console.log('listener already set');
      return true
    }
    this._listeners[funcName] = fn;
    const exists = await this.pup(({funcName})=>window[funcName]?true:false,{funcName});
    if(exists) return await set();
    const res = await this._page.exposeFunction(funcName, (obj: any) =>fn(obj)).then(set).catch(()=>set) as Promise<boolean>;
    return res;
  }
  
  // NON-STAMDARD LISTENERS


  /**
   * Listens to a log out event
   * 
   * @event 
   * @param fn callback
   * @fires `true` 
   */
  public async onLogout(fn: (loggedOut?: boolean)=> any) : Promise<boolean> {
    await this._page.on('request', request => {
      if(request.url() === "https://web.whatsapp.com/" && !this._refreshing) fn();
    })
    this.onStateChanged(state=>{
      if(state===STATE.UNPAIRED){
        fn();
      }
    });
    return true;
  }

  /**
   * If you have set `onAnyMessage` or `onMessage` with the second parameter (PQueue options) then you may want to inspect their respective PQueue's.
   */
 public getListenerQueues() : {
    [key in SimpleListener] ?: PQueue
  } {
   return this._queues
  }

  // STANDARD SIMPLE LISTENERS
  private async preprocessMessage(message: Message) : Promise<Message> {
    if(this._createConfig.messagePreprocessor && MessagePreprocessors[this._createConfig.messagePreprocessor]) {
      return await MessagePreprocessors[this._createConfig.messagePreprocessor](message, this)
    }
    return message;
  }

  /**
   * Listens to incoming messages
   * 
   * @event 
   * @param fn callback
   * @param queueOptions PQueue options. Set to `{}` for default PQueue.
   * @fires Observable stream of messages
   */
   public async onMessage(fn: (message: Message) => void, queueOptions ?: Options<PriorityQueue, DefaultAddOptions>) : Promise<Listener | boolean> {
    const _fn = async (message : Message) => fn(await this.preprocessMessage(message))
    return this.registerListener(SimpleListener.Message, _fn, this?._createConfig?.pQueueDefault || queueOptions);
  }

   /**
   * Listens to all new messages
   * 
   * @event 
   * @param fn callback
   * @param queueOptions PQueue options. Set to `{}` for default PQueue.
   * @fires [[Message]] 
   */
  public async onAnyMessage(fn: (message: Message) => void, queueOptions ?: Options<PriorityQueue, DefaultAddOptions>) : Promise<Listener | boolean> {
    const _fn = async (message : Message) => fn(await this.preprocessMessage(message))
    return this.registerListener(SimpleListener.AnyMessage, _fn, this?._createConfig?.pQueueDefault || queueOptions);
  }

  /**
   * [REQUIRES AN INSIDERS LICENSE-KEY](https://gum.co/open-wa?tier=Insiders%20Program)
   * 
   * Listens to when a message is deleted by a recipient or the host account
   * @event 
   * @param fn callback
   * @fires [[Message]]
   */
  public async onMessageDeleted(fn: (message: Message) => void) : Promise<Listener | boolean> {
    return this.registerListener(SimpleListener.MessageDeleted, fn);
  }


  /**
   * Listens to when a chat is deleted by the host account
   * @event 
   * @param fn callback
   * @fires [[Chat]]
   */
  public async onChatDeleted(fn: (chat: Chat) => void) : Promise<Listener | boolean> {
    return this.registerListener(SimpleListener.ChatDeleted, fn);
  }

  /** 
   * Listens to battery changes
   * 
   * @event 
   * @param fn callback
   * @fires number
   */
  public async onBattery(fn: (battery:number) => void) : Promise<Listener | boolean> {
    return this.registerListener(SimpleListener.Battery, fn);
  }

  /** 
   * Listens to when host device is plugged/unplugged
   * @event 
   * 
   * @param fn callback
   * @fires boolean true if plugged, false if unplugged
   */
  public async onPlugged(fn: (plugged: boolean) => void) : Promise<Listener | boolean> {
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
  public async onStory(fn: (story: Message) => void) : Promise<Listener | boolean> {
    return this.registerListener(SimpleListener.Story, fn);
  }

  /**
   * Listens to changes in state
   * 
   * @event 
   * @fires STATE observable sream of states
   */
  public async onStateChanged(fn: (state: STATE) => void) : Promise<Listener | boolean> {
    return this.registerListener(SimpleListener.StateChanged, fn);
  }

  /**
   * Listens to new incoming calls
   * @event 
   * @returns Observable stream of call request objects
   */
  public async onIncomingCall(fn: (call: Call) => void) : Promise<Listener | boolean> {
    return this.registerListener(SimpleListener.IncomingCall, fn);
  }

  /**
   *[REQUIRES AN INSIDERS LICENSE-KEY](https://gum.co/open-wa?tier=Insiders%20Program)
   * 
   * Listens to new orders. Only works on business accounts
   */
  public async onOrder(fn: (order: Order) => void) : Promise<Listener | boolean> {
    return this.registerListener(SimpleListener.Order, fn);
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
  public async onChatState(fn: (chatState: ChatState) => void) : Promise<Listener | boolean> {
    return this.registerListener(SimpleListener.ChatState, fn);
  }

  /**
   * Listens to messages acknowledgement Changes
   * 
   * @param fn callback function that handles a [[Message]] as the first and only parameter.
   * @event 
   * @returns `true` if the callback was registered
   */
  public async onAck(fn: (message: Message) => void) : Promise<Listener | boolean> {
    const _fn = async (message : Message) => fn(await this.preprocessMessage(message))
    return this.registerListener(SimpleListener.Ack, _fn);
  }

  /**
   * Listens to add and remove events on Groups on a global level. It is memory efficient and doesn't require a specific group id to listen to.
   * 
   * @event
   * @param fn callback function that handles a [[ParticipantChangedEventModel]] as the first and only parameter.
   * @returns `true` if the callback was registered
   */
  public async onGlobalParticipantsChanged(fn: (participantChangedEvent: ParticipantChangedEventModel) => void) : Promise<Listener | boolean> {
    return this.registerListener(SimpleListener.GlobalParticipantsChanged, fn);
  }

  /**
   * Fires callback with Chat object every time the host phone is added to a group.
   * 
   * @event 
   * @param fn callback function that handles a [[Chat]] (group chat) as the first and only parameter.
   * @returns `true` if the callback was registered
   */
  public async onAddedToGroup(fn: (chat: Chat) => any) : Promise<Listener | boolean> {
    return this.registerListener(SimpleListener.AddedToGroup, fn);
  }
  

  /**
   * [REQUIRES AN INSIDERS LICENSE-KEY](https://gum.co/open-wa?tier=Insiders%20Program)
   * 
   * Fires callback with Chat object every time the host phone is removed to a group.
   * 
   * @event 
   * @param fn callback function that handles a [[Chat]] (group chat) as the first and only parameter.
   * @returns `true` if the callback was registered
   */
  public async onRemovedFromGroup(fn: (chat: Chat) => any) : Promise<Listener | boolean> {
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
  public async onChatOpened(fn: (chat: Chat) => any) : Promise<Listener | boolean> {
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
  public async onContactAdded(fn: (chat: Chat) => any) : Promise<Listener | boolean> {
    return this.registerListener(SimpleListener.ChatOpened, fn);
  }

  // COMPLEX LISTENERS

  /**
   * @event 
   * Listens to add and remove events on Groups. This can no longer determine who commited the action and only reports the following events add, remove, promote, demote
   * @param groupId group id: xxxxx-yyyy@c.us
   * @param fn callback
   * @returns Observable stream of participantChangedEvent
   */
  public async onParticipantsChanged(groupId: GroupChatId, fn: (participantChangedEvent: ParticipantChangedEventModel) => void, legacy = false) : Promise<Listener | boolean> {
    const funcName = "onParticipantsChanged_" + groupId.replace('_', "").replace('_', "");
    return this._page.exposeFunction(funcName, (participantChangedEvent: ParticipantChangedEventModel) =>
      fn(participantChangedEvent)
    )
      .then(() => this.pup(
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
public async onLiveLocation(chatId: ChatId, fn: (liveLocationChangedEvent: LiveLocationChangedEvent) => void) : Promise<boolean> {
  const funcName = "onLiveLocation_" + chatId.replace('_', "").replace('_', "");
  return this._page.exposeFunction(funcName, (liveLocationChangedEvent: LiveLocationChangedEvent) =>
    fn(liveLocationChangedEvent)
  )
    .then(() => this.pup(
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
  public async setPresence(available: boolean) : Promise<boolean | void> {
    return await this.pup(
      available => WAPI.setPresence(available),
      available
      )
  }

  /**
   * set your about me
   * @param newStatus String new profile status
   */
  public async setMyStatus(newStatus: string) : Promise<boolean | void> {
    return await this.pup(
      ({newStatus}) => WAPI.setMyStatus(newStatus),
      {newStatus}
      )
  }

  /**
   * [REQUIRES AN INSIDERS LICENSE-KEY](https://gum.co/open-wa?tier=Insiders%20Program)
   * 
   * Adds label from chat, message or contact. Only for business accounts.
   * @param label: The desired text of the new label. id will be something simple like anhy nnumber from 1-10, name is the label of the label if that makes sense.
   * @returns `false` if something went wrong, or the id (usually a number as a string) of the new label (for example `"58"`)
   */
   public async createLabel(label: string) : Promise<string | boolean> {
    return await this.pup(
      ({label}) => WAPI.createLabel(label),
      {label}
      ) as Promise<string | boolean>;
  }


  /**
   * Adds label from chat, message or contact. Only for business accounts.
   * @param label: either the id or the name of the label. id will be something simple like anhy nnumber from 1-10, name is the label of the label if that makes sense.
   * @param id The Chat, message or contact id to which you want to add a label
   */
  public async addLabel(label: string, chatId: ChatId) : Promise<boolean> {
    return await this.pup(
      ({label, chatId}) => WAPI.addOrRemoveLabels(label, chatId, 'add'),
      {label, chatId}
      ) as Promise<boolean>;
  }

  /**
   * Returns all labels and the corresponding tagged items.
   */
   public async getAllLabels() : Promise<Label[]> {
    return await this.pup(() => WAPI.getAllLabels()) as Promise<Label[]>;
  }

  /**
   * Removes label from chat, message or contact. Only for business accounts.
   * @param label: either the id or the name of the label. id will be something simple like anhy nnumber from 1-10, name is the label of the label if that makes sense.
   * @param id The Chat, message or contact id to which you want to add a label
   */
  public async removeLabel(label: string, chatId: ChatId) : Promise<boolean> {
    return await this.pup(
      ({label, chatId}) => WAPI.addOrRemoveLabels(label, chatId, 'remove'),
      {label, chatId}
      ) as Promise<boolean>;
  }

  /**
   * Get an array of chats that match the label parameter. For example, if you want to get an array of chat objects that have the label "New customer".
   * 
   * This method is case insenstive and only works on business host accounts.
   * 
   * @label The label name 
   */
  public async getChatsByLabel(label: string) : Promise<Chat[]> {
    const res = await this.pup(
      ({label}) => WAPI.getChatsByLabel(label),
      {label}
      )
      if(typeof res == 'string') new CustomError(ERROR_NAME.INVALID_LABEL, res);
      return res;
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
  public async sendVCard(chatId: ChatId, vcard: string, contactName:string,  contactNumber?: string) : Promise<boolean> {
    return await this.pup(
      ({chatId, vcard, contactName, contactNumber}) => WAPI.sendVCard(chatId, vcard,contactName, contactNumber),
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
   public async setMyName(newName: string) : Promise<boolean> {
     return await this.pup(
       ({newName}) => WAPI.setMyName(newName),
       {newName}
       ) as Promise<boolean>;
   }

   /**
    * Sets the chat state
    * @param {ChatState|0|1|2} chatState The state you want to set for the chat. Can be TYPING (0), RECRDING (1) or PAUSED (2).
    * @param {String} chatId 
    */
   public async setChatState(chatState: ChatState, chatId: ChatId) : Promise<boolean> {
    return await this.pup(
      ({chatState, chatId}) => WAPI.setChatState(chatState, chatId),
      //@ts-ignore
      {chatState, chatId}
      )
  }
    
  /**
   * Returns the connection state
   */
  public async getConnectionState() : Promise<STATE> {
    return await this._page.evaluate(() => WAPI.getState()) as STATE;
  }

  /**
   * Retreive an array of messages that are not yet sent to the recipient via the host account device (i.e no ticks)
   */
  public async getUnsentMessages() : Promise<Message[]> {
    return await this._page.evaluate(() => WAPI.getUnsentMessages());
  }

  /**
   * Forces the session to update the connection state. This will take a few seconds to determine the 'correct' state.
   * @returns updated connection state
   */
  public async forceUpdateConnectionState() : Promise<STATE> {
    return await this._page.evaluate(() => WAPI.forceUpdateConnectionState()) as STATE;
  }

  /**
   * Returns a list of contact with whom the host number has an existing chat who are also not contacts.
   */
  public async getChatWithNonContacts() : Promise<Contact[]>{
    return await this._page.evaluate(() => WAPI.getChatWithNonContacts());
  }

  /**
   * Shuts down the page and browser
   * @returns true
   */
  public async kill() : Promise<boolean> {
    if(this._currentlyBeingKilled) return;
    this._currentlyBeingKilled = true;
    console.log('Shutting Down');
    const browser = await this?._page?.browser()
    const pid = browser?.process() ? browser?.process()?.pid : null;
    try{
      if (this._page && !this._page?.isClosed()) await this._page?.close();
      if (this._page && this._page?.browser) await this._page?.browser()?.close();
      if(pid) treekill(pid, 'SIGKILL')
    } catch(error){
      //ignore error
    }
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
  public async forceRefocus() : Promise<void> {
    const useHere: string = await this._page.evaluate(()=>WAPI.getUseHereString());
    await this._page.waitForFunction(
      `[...document.querySelectorAll("div[role=button")].find(e=>{return e.innerHTML.toLowerCase().includes("${useHere.toLowerCase()}")})`,
      { timeout: 0 }
    );
    return await this._page.evaluate(`[...document.querySelectorAll("div[role=button")].find(e=>{return e.innerHTML.toLowerCase().includes("${useHere.toLowerCase()}")}).click()`);
  }

  /**
   * Check if the "Phone not Cconnected" message is showing in the browser. If it is showing, then this will return `true`.
   * 
   * @returns `boolean`
   */
  public async isPhoneDisconnected() : Promise<boolean> {
    const phoneNotConnected: string = await this._page.evaluate(()=>WAPI.getLocaledString('phone not connected'));
    return await this.pup(`!![...document.querySelectorAll("div")].find(e=>{return e.innerHTML.toLowerCase().includes("${phoneNotConnected.toLowerCase()}")})`)
  }

  /**
   * Runs a health check to help you determine if/when is an appropiate time to restart/refresh the session.
   */
  public async healthCheck() : Promise<HealthCheck> {
    return await this._page.evaluate(() => WAPI.healthCheck());
  }

  
  /**
   * A list of participants in the chat who have their live location on. If the chat does not exist, or the chat does not have any contacts actively sharing their live locations, it will return false. If it's a chat with a single contact, there will be only 1 value in the array if the contact has their livelocation on.
   * Please note. This should only be called once every 30 or so seconds. This forces the phone to grab the latest live location data for the number. This can be used in conjunction with onLiveLocation (this will trigger onLiveLocation).
   * @param chatId string Id of the chat you want to force the phone to get the livelocation data for.
   * @returns Promise<LiveLocationChangedEvent []> | boolean 
   */
  public async forceUpdateLiveLocation(chatId: ChatId): Promise<LiveLocationChangedEvent[] | boolean>  {
    return await this.pup(
      ({chatId}) => WAPI.forceUpdateLiveLocation(chatId),
      { chatId }
    );
  }


  
  private async link(params ?: string) : Promise<string> {
    const _p = [this._createConfig?.linkParams,params].filter(x=>x).join('&')
    return `https://get.openwa.dev/l/${await this.getHostNumber()}${_p?`?${_p}`:''}`
  }

  /**
   * Sends a text message to given chat
   * If you need to send a message to new numbers please see [these instructions:](https://docs.openwa.dev/pages/The%20Client/licensed-features.html#sending-messages-to-non-contact-numbers)
   * @param to chat id: `xxxxx@c.us`
   * @param content text message
   */
  public async sendText(to: ChatId, content: Content) : Promise<boolean | MessageId> {
    if(!content) content = ''
   const err = [
    'Not able to send message to broadcast',
    'Not a contact',
    'Error: Number not linked to WhatsApp Account',
    'ERROR: Please make sure you have at least one chat'
   ];
   
   content = content?.trim() || content

    const res = await this.pup(
      ({ to, content }) => {
        WAPI.sendSeen(to);
        return WAPI.sendMessage(to, content);
      },
      { to, content }
    );
    if(err.includes(res)) {
      let msg = res;
      if(res==err[1]) msg = `\n${res}. Unlock this feature and support open-wa by getting a license: ${await this.link()}\n`
      console.error(msg);
      throw new CustomError(ERROR_NAME.SENDTEXT_FAILURE, msg)
    }
    return (err.includes(res) ? false : res)  as boolean | MessageId;
  }
  

  /**
   * Sends a text message to given chat that includes mentions.
   * In order to use this method correctly you will need to send the text like this:
   * "@4474747474747 how are you?"
   * Basically, add a @ symbol before the number of the contact you want to mention.  
   *   
   * Please note that the hideTag parameter only works with an Insider's License Key  
   *   
   * @param to chat id: `xxxxx@c.us`
   * @param content text message
   * @param hideTags Removes all tags within the message
   */
  public async sendTextWithMentions(to: ChatId, content: Content, hideTags?: boolean) : Promise<boolean | MessageId> {
    //remove all @c.us from the content
    content = content.replace(/@c.us/,"");
    return await this.pup(
      ({ to, content, hideTags }) => {
        WAPI.sendSeen(to);
        return WAPI.sendMessageWithMentions(to, content, hideTags);
      },
      { to, content, hideTags }
    ) as Promise<boolean | MessageId>;
  }

  /**
   * [REQUIRES AN INSIDERS LICENSE-KEY](https://gum.co/open-wa?tier=Insiders%20Program)
   * 
   * Sends a reply to given chat that includes mentions, replying to the provided replyMessageId.
   * In order to use this method correctly you will need to send the text like this:
   * "@4474747474747 how are you?"
   * Basically, add a @ symbol before the number of the contact you want to mention.
   * @param to chat id: `xxxxx@c.us`
   * @param content text message
   * @param replyMessageId id of message to reply to
   */
  public async sendReplyWithMentions(to: ChatId, content: Content, replyMessageId: MessageId) : Promise<boolean | MessageId> {
    //remove all @c.us from the content
    content = content.replace(/@c.us/,"");
    return await this.pup(
      ({ to, content, replyMessageId }) => {
        WAPI.sendSeen(to);
        return WAPI.sendReplyWithMentions(to, content, replyMessageId);
      },
      { to, content, replyMessageId }
    ) as Promise<boolean | MessageId>;
  }


  /**
   * [REQUIRES AN INSIDERS LICENSE-KEY](https://gum.co/open-wa?tier=Insiders%20Program)
   * 
   * Tags everyone in the group with a message
   * 
   * @param groupId group chat id: `xxxxx@g.us`
   * @param content text message to add under all of the tags
   * @param hideTags Removes all tags within the message
   * @returns Promise<MessageId>
   */
  public async tagEveryone(groupId: GroupChatId, content: Content, hideTags?: boolean) : Promise<boolean | MessageId> {
    return await this.pup(
      ({ groupId, content, hideTags  }) => WAPI.tagEveryone(groupId, content, hideTags),
      { groupId, content, hideTags }
    ) as Promise<boolean | MessageId>;
  }

  /**
   * @deprecated Use [[sendLinkWithAutoPreview]] instead
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
    chatId: ChatId) : Promise<MessageId | string | boolean> {
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
   * @param to chat id: `xxxxx@c.us`
   * @param lat latitude: '51.5074'
   * @param lng longitude: '0.1278'
   * @param loc location text: 'LONDON!'
   */
  public async sendLocation(to: ChatId, lat: string, lng: string, loc: string) : Promise<boolean | MessageId> {
    return await this.pup(
      ({ to, lat, lng, loc }) => WAPI.sendLocation(to, lat, lng, loc),
      { to, lat, lng, loc }
    ) as Promise<boolean | MessageId>;
  }

  /**
   * Get the generated user agent, this is so you can send it to the decryption module.
   * @returns String useragent of wa-web session
   */
  public async getGeneratedUserAgent(userA?: string) : Promise<string> {
    const ua = userA || useragent;
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
  public async decryptMedia(message: Message | MessageId) : Promise<DataURL> {
    let m : any;
    //if it's the message id, get the message
    if(typeof message === "string") m = await this.getMessageById(message) 
    else m = message;
    if(!m.mimetype) throw new CustomError(ERROR_NAME.NOT_MEDIA,"Not a media message");
    if(m.type == "sticker") m = await this.getStickerDecryptable(m.id);
    //Dont have an insiders license to decrypt stickers
    if(m===false) {
      console.error(`\nUnable to decrypt sticker. Unlock this feature and support open-wa by getting a license: ${await this.link("v=i")}\n`)
      throw new CustomError(ERROR_NAME.STICKER_NOT_DECRYPTED,'Sticker not decrypted')
    }
    const mediaData = await decryptMedia(m);
    return `data:${m.mimetype};base64,${mediaData.toString('base64')}`
  }

  /**
   * Sends a image to given chat, with caption or not, using base64
   * @param to chat id `xxxxx@c.us`
   * @param file DataURL data:image/xxx;base64,xxx or the RELATIVE (should start with `./` or `../`) path of the file you want to send. With the latest version, you can now set this to a normal URL (for example [GET] `https://file-examples-com.github.io/uploads/2017/10/file_example_JPG_2500kB.jpg`).
   * @param filename string xxxxx
   * @param caption string xxxxx
   * @param waitForKey boolean default: false set this to true if you want to wait for the id of the message. By default this is set to false as it will take a few seconds to retrieve to the key of the message and this waiting may not be desirable for the majority of users.
   * @param hideTags boolean default: false [INSIDERS] set this to try silent tag someone in the caption
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
    withoutPreview?:boolean,
    hideTags ?: boolean
  ) : Promise<MessageId | boolean> {
      //check if the 'base64' file exists
      if(!isDataURL(file) && !isBase64(file) && !file.includes("data:")) {
        //must be a file then
        const relativePath = path.join(path.resolve(process.cwd(),file|| ''));
        if(fs.existsSync(file) || fs.existsSync(relativePath)) {
          file = await datauri(fs.existsSync(file)  ? file : relativePath);
        } else if(isUrl(file)){
          return await this.sendFileFromUrl(to,file,filename,caption,quotedMsgId,{},waitForId,ptt,withoutPreview, hideTags);
        } else throw new CustomError(ERROR_NAME.FILE_NOT_FOUND,`Cannot find file. Make sure the file reference is relative, a valid URL or a valid DataURL: ${file.slice(0,25)}`)
      } else if(file.includes("data:") && file.includes("undefined") || file.includes("application/octet-stream") && filename && mime.lookup(filename)) {
        file = `data:${mime.lookup(filename)};base64,${file.split(',')[1]}`
      }
    
   const err = [
    'Not able to send message to broadcast',
    'Not a contact',
    'Error: Number not linked to WhatsApp Account',
    'ERROR: Please make sure you have at least one chat'
   ];

    const res = await this.pup(
      ({ to, file, filename, caption, quotedMsgId, waitForId, ptt, withoutPreview, hideTags}) =>  WAPI.sendImage(file, to, filename, caption, quotedMsgId, waitForId, ptt, withoutPreview, hideTags),
      { to, file, filename, caption, quotedMsgId, waitForId, ptt, withoutPreview, hideTags}
    )
    if(err.includes(res)) console.error(res);
    return (err.includes(res) ? false : res)  as MessageId | boolean;
  }

  
/**
 * Automatically sends a youtube link with the auto generated link preview. You can also add a custom message.
 * @param chatId 
 * @param url string A youtube link.
 * @param text string Custom text as body of the message, this needs to include the link or it will be appended after the link.
 * @param thumbnail string Base64 of the jpeg/png which will be used to override the automatically generated thumbnail.
 */
  public async sendYoutubeLink(to: ChatId, url: string, text: Content = '', thumbnail ?: Base64) : Promise<boolean | MessageId> {
    return this.sendLinkWithAutoPreview(to,url,text, thumbnail);
  }

/**
 * Automatically sends a link with the auto generated link preview. You can also add a custom message.
 * @param chatId 
 * @param url string A link.
 * @param text string Custom text as body of the message, this needs to include the link or it will be appended after the link.
 * @param thumbnail Base64 of the jpeg/png which will be used to override the automatically generated thumbnail.
 */
  public async sendLinkWithAutoPreview(
    to: ChatId,
    url: string,
    text?: Content,
    thumbnail ?: Base64
  ) : Promise<boolean | MessageId>  {
    return await this.pup(
      ({ to,url, text, thumbnail }) => WAPI.sendLinkWithAutoPreview(to,url,text, thumbnail),
      { to,url, text, thumbnail }
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
   * @returns Promise<MessageId | false> false if didn't work, otherwise returns message id.
   */
  public async reply(to: ChatId, content: Content, quotedMsgId: MessageId, sendSeen?: boolean) : Promise<boolean | MessageId> {
    if(sendSeen) await this.sendSeen(to);
    return await this.pup(
      ({ to, content, quotedMsgId }) =>WAPI.reply(to, content, quotedMsgId),
      { to, content, quotedMsgId }
    ) as Promise<MessageId | false>;
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
  public async checkReadReceipts(contactId: ContactId) : Promise<string | boolean> {
    return await this.pup(
      ({ contactId }) =>WAPI.checkReadReceipts(contactId),
      { contactId }
    ) as Promise<string | boolean>;
  }

  /**
   * Sends a file to given chat, with caption or not, using base64. This is exactly the same as sendImage
   * 
   * Please note that any file that resolves to mime-type `octet-stream` will, by default, resolve to an MP4 file.
   * 
   * If you want a specific filetype, then explcitly select the correct mime-type from https://www.iana.org/assignments/media-types/media-types.xhtml
   * 
   * 
   * @param to chat id `xxxxx@c.us`
   * @param file DataURL data:image/xxx;base64,xxx or the RELATIVE (should start with `./` or `../`) path of the file you want to send. With the latest version, you can now set this to a normal URL (for example [GET] `https://file-examples-com.github.io/uploads/2017/10/file_example_JPG_2500kB.jpg`).
   * @param filename string xxxxx
   * @param caption string xxxxx With an [INSIDERS LICENSE-KEY](https://gum.co/open-wa?tier=Insiders%20Program) you can also tag people in groups with `@[number]`. For example if you want to mention the user with the number `44771234567`, just add `@44771234567` in the caption.
   * @param quotedMsgId string true_0000000000@c.us_JHB2HB23HJ4B234HJB to send as a reply to a message
   * @param waitForId boolean default: false set this to true if you want to wait for the id of the message. By default this is set to false as it will take a few seconds to retrieve to the key of the message and this waiting may not be desirable for the majority of users.
   * @param ptt boolean default: false set this to true if you want to send the file as a push to talk file.
   * @param withoutPreview boolean default: false set this to true if you want to send the file without a preview (i.e as a file). This is useful for preventing auto downloads on recipient devices.
   * @param hideTags boolean default: false [INSIDERS] set this to try silent tag someone in the caption
   * @returns Promise <boolean | MessageId> This will either return true or the id of the message. It will return true after 10 seconds even if waitForId is true
   */
  public async sendFile(
    to: ChatId,
    file: DataURL | FilePath,
    filename: string,
    caption: Content,
    quotedMsgId?: MessageId,
    waitForId?: boolean,
    ptt?:boolean,
    withoutPreview?:boolean,
    hideTags ?: boolean
  ) : Promise<MessageId | boolean> {
    return this.sendImage(to, file, filename, caption, quotedMsgId, waitForId, ptt, withoutPreview, hideTags);
  }

  /**
   * [REQUIRES AN INSIDERS LICENSE-KEY](https://gum.co/open-wa?tier=Insiders%20Program)
   * 
   * Checks whether or not the group id provided is known to be unsafe by the contributors of the library.
   * @param groupChatId The group chat you want to deteremine is unsafe
   * @returns Promise <boolean | string> This will either return a boolean indiciating whether this group chat id is considered unsafe or an error message as a string
   */
  public async isGroupIdUnsafe(groupChatId: GroupChatId) : Promise<string | boolean>{
    const {data} = await axios.post('https://openwa.dev/groupId-check', {
      groupChatId,
      sessionInfo: this.getSessionInfo(),
      config: this.getConfig()
    })
    if(data.unsafe) console.warn(`${groupChatId} is marked as unsafe` )
    return data.err || data.unsafe;
  }

  /**
   * Attempts to send a file as a voice note. Useful if you want to send an mp3 file.
   * @param to chat id `xxxxx@c.us`
   * @param file base64 data:image/xxx;base64,xxx or the path of the file you want to send.
   * @param quotedMsgId string true_0000000000@c.us_JHB2HB23HJ4B234HJB to send as a reply to a message
   * @returns Promise <boolean | string> This will either return true or the id of the message. It will return true after 10 seconds even if waitForId is true
   */
  public async sendPtt(
    to: ChatId,
    file: DataURL | FilePath,
    quotedMsgId: MessageId,
  ) : Promise<MessageId> {
    return this.sendImage(to, file, 'ptt.ogg', '', quotedMsgId, true, true) as Promise<MessageId> ;
  }
  
  /**
   * Send an audio file with the default audio player (not PTT/voice message)
   * @param to chat id `xxxxx@c.us`
   * @param base64 base64 data:image/xxx;base64,xxx or the path of the file you want to send.
   * @param quotedMsgId string true_0000000000@c.us_JHB2HB23HJ4B234HJB to send as a reply to a message
   */
  public async sendAudio(
    to: ChatId,
    file: DataURL | FilePath,
    quotedMsgId ?: MessageId,
  ) : Promise<MessageId> {
    return this.sendFile(to,file, 'file.mp3', '', quotedMsgId, true, false, false, false) as Promise<MessageId> ;
  }




  /**
   * Sends a video to given chat as a gif, with caption or not, using base64
   * @param to chat id `xxxxx@c.us`
   * @param file DataURL data:image/xxx;base64,xxx or the RELATIVE (should start with `./` or `../`) path of the file you want to send. With the latest version, you can now set this to a normal URL (for example [GET] `https://file-examples-com.github.io/uploads/2017/10/file_example_JPG_2500kB.jpg`).
   * @param filename string xxxxx
   * @param caption string xxxxx
   * @param quotedMsgId string true_0000000000@c.us_JHB2HB23HJ4B234HJB to send as a reply to a message
   * @param requestConfig {} By default the request is a get request, however you can override that and many other options by sending this parameter. You can read more about this parameter here: https://github.com/axios/axios#request-config
   */
  public async sendVideoAsGif(
    to: ChatId,
    file: DataURL | FilePath,
    filename: string,
    caption: Content,
    quotedMsgId?: MessageId,
    requestConfig: AxiosRequestConfig ={}
  ) : Promise<MessageId> {
      //check if the 'base64' file exists
      if(!isDataURL(file)) {
        //must be a file then
        const relativePath = path.join(path.resolve(process.cwd(),file|| ''));
        if(fs.existsSync(file) || fs.existsSync(relativePath)) {
          file = await datauri(fs.existsSync(file)  ? file : relativePath);
        } else if(isUrl(file)){
          file = await getDUrl(file, requestConfig);
        } else throw new CustomError(ERROR_NAME.FILE_NOT_FOUND,'Cannot find file. Make sure the file reference is relative, a valid URL or a valid DataURL')
      }
    return await this.pup(
      ({ to, file, filename, caption, quotedMsgId  }) => {
        return WAPI.sendVideoAsGif(file, to, filename, caption, quotedMsgId );
      },
      { to, file, filename, caption, quotedMsgId }
    ) as Promise<MessageId>;
  }

  /**
   * Sends a video to given chat as a gif by using a giphy link, with caption or not, using base64
   * @param to chat id `xxxxx@c.us`
   * @param giphyMediaUrl string https://media.giphy.com/media/oYtVHSxngR3lC/giphy.gif => https://i.giphy.com/media/oYtVHSxngR3lC/200w.mp4
   * @param caption string xxxxx
   */
  public async sendGiphy(
    to: ChatId,
    giphyMediaUrl: string,
    caption: Content
  ) : Promise<MessageId>{
    const ue = /^https?:\/\/media\.giphy\.com\/media\/([a-zA-Z0-9]+)/
    const n = ue.exec(giphyMediaUrl);
    if (n) {
      const r = `https://i.giphy.com/${n[1]}.mp4`;
      const filename = `${n[1]}.mp4`
      const dUrl = await getDUrl(r);
      return await this.pup(
        ({ to, dUrl, filename, caption }) => {
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
   * @param to chat id `xxxxx@c.us`
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
    requestConfig: AxiosRequestConfig = {},
    waitForId?: boolean,
    ptt?:boolean,
    withoutPreview?:boolean,
    hideTags ?: boolean
  ) : Promise<MessageId | boolean> {
     const base64 = await getDUrl(url, requestConfig);
      return await this.sendFile(to,base64,filename,caption,quotedMsgId,waitForId,ptt,withoutPreview, hideTags)
  }

/**
 * Returns an object with all of your host device details
 */
  public async getMe() : Promise<any> {
    return await this._page.evaluate(() => WAPI.getMe());
    // return await this.pup(() => WAPI.getMe());
    //@ts-ignore
    // return await this.pup(() => Store.Me.attributes);
  }

  /**
   * Returns a PNG DataURL screenshot of the session
   * @returns Promise<DataURL>
   */
  public async getSnapshot() : Promise<DataURL> {
    const screenshot = await this.getPage().screenshot({
      type:"png",
      encoding: "base64"
    });
    return `data:image/png;base64,${screenshot}`;
  }

/**
 * Returns an array of group ids where the host device is admin
 */
public async iAmAdmin() : Promise<GroupChatId[]>  {
  return await this.pup(() => WAPI.iAmAdmin()) as Promise<GroupChatId[]>;
}

  /**
   * Syncs contacts with phone. This promise does not resolve so it will instantly return true.
   */
  public async syncContacts() : Promise<boolean>  {
    //@ts-ignore
    return await this.pup(() => WAPI.syncContacts()) as Promise<boolean>;
  }

   /**
    * Easily get the amount of messages loaded up in the session. This will allow you to determine when to clear chats/cache.
    */
   public async getAmountOfLoadedMessages() : Promise<number>  {
     return await this.pup(() => WAPI.getAmountOfLoadedMessages()) as Promise<number>;
   }


  /**
   * Find any product listings of the given number. Use this to query a catalog
   *
   * @param id id of buseinss profile (i.e the number with @c.us)
   * @returns None
   */
  public async getBusinessProfilesProducts(id: ContactId) : Promise<any>   {
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
   * @returns 
   */
  public async sendImageWithProduct(
    to: ChatId,
    image: Base64,
    caption: Content,
    bizNumber: ContactId,
    productId: string
  )  : Promise<boolean | MessageId>  {
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

   public async sendCustomProduct(to: ChatId, image: DataURL, productData: CustomProduct) : Promise<MessageId | boolean>  {
    return await this.pup(
      ({ to, image, productData }) => WAPI.sendCustomProduct(to, image, productData),
      { to, image, productData }
    ) as Promise<MessageId | boolean>;
   }

  /**
   * Sends contact card to given chat id. You can use this to send multiple contacts but they will show up as multiple single-contact messages.
   * @param {string} to 'xxxx@c.us'
   * @param {string|array} contact 'xxxx@c.us' | ['xxxx@c.us', 'yyyy@c.us', ...]
   */
  public async sendContact(to: ChatId, contactId: ContactId | ContactId[]) : Promise<MessageId | boolean>{
    return await this.pup(
      ({ to, contactId }) => WAPI.sendContact(to, contactId),
      { to, contactId }
    );
  }

  /**
   * 
   * [REQUIRES AN INSIDERS LICENSE-KEY](https://gum.co/open-wa?tier=Insiders%20Program)
   * 
   * Sends multiple contacts as a single message
   * 
   * @param  to 'xxxx@c.us'
   * @param contact ['xxxx@c.us', 'yyyy@c.us', ...]
   */
  public async sendMultipleContacts(to: ChatId, contactIds: ContactId[]) : Promise<MessageId | boolean> {
    return await this.pup(
      ({ to, contactIds }) => WAPI.sendMultipleContacts(to, contactIds),
      { to, contactIds }
    );
  }


  /**
   * Simulate '...typing' in chat
   * @param {string} to 'xxxx@c.us'
   * @param {boolean} on turn on similated typing, false to turn it off you need to manually turn this off.
   */
  public async simulateTyping(to: ChatId, on: boolean) : Promise<boolean> {
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
   public async archiveChat(id: ChatId, archive: boolean) : Promise<boolean>{
    return await this.pup(
      ({ id, archive }) => WAPI.archiveChat(id, archive),
      { id, archive }
    ) as Promise<boolean>;
  }

  /**
   * Pin/Unpin chats
   * 
   * @param id The id of the conversation
   * @param archive boolean true => pin, false => unpin
   * @return boolean true: worked
   */
  public async pinChat(id: ChatId, pin: boolean) : Promise<boolean>{
    return await this.pup(
      ({ id, pin }) => WAPI.pinChat(id, pin),
      { id, pin }
    ) as Promise<boolean>;
  }


  /**
   * 
   * [REQUIRES AN INSIDERS LICENSE-KEY](https://gum.co/open-wa?tier=Insiders%20Program)
   * 
   * Mutes a conversation for a given duration. If already muted, this will update the muted duration. Mute durations are relative from when the method is called.
   * @param chatId The id of the conversation you want to mute
   * @param muteDuration ChatMuteDuration enum of the time you want this chat to be muted for.
   * @return boolean true: worked or error code or message
   */
  public async muteChat(chatId: ChatId, muteDuration: ChatMuteDuration) : Promise<boolean | string | number> {
    return await this.pup(
      ({ chatId, muteDuration }) => WAPI.muteChat(chatId, muteDuration),
      { chatId, muteDuration }
    ) as Promise<boolean | string | number>;
  }


  /**
   * Checks if a chat is muted
   * @param chatId The id of the chat you want to check
   * @returns boolean. `false` if the chat does not exist.
   */
  public async isChatMuted(chatId: ChatId) : Promise<boolean>{
    return await this.pup(
      ({ chatId }) => WAPI.isChatMuted(chatId),
      { chatId }
    ) as Promise<boolean>;
  }


  /**
   * 
   * [REQUIRES AN INSIDERS LICENSE-KEY](https://gum.co/open-wa?tier=Insiders%20Program)
   * 
   * Unmutes a conversation.
   * @param id The id of the conversation you want to mute
   * @return boolean true: worked or error code or message
   */
  public async unmuteChat(chatId: ChatId) : Promise<boolean | string | number> {
    return await this.pup(
      ({ chatId }) => WAPI.unmuteChat(chatId),
      { chatId }
    ) as Promise<boolean | string | number>;
  }

  /**
   * Forward an array of messages to a specific chat using the message ids or Objects
   *
   * @param to '000000000000@c.us'
   * @param messages this can be any mixture of message ids or message objects
   * @param skipMyMessages This indicates whether or not to skip your own messages from the array
   */
  public async forwardMessages(to: ChatId, messages: MessageId | MessageId[], skipMyMessages: boolean) : Promise<boolean | string>{
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
  public async ghostForward(to: ChatId, messageId: MessageId) : Promise<boolean> {
    return await this.pup(
      ({ to, messageId }) => WAPI.ghostForward(to, messageId),
      { to, messageId }
    ) as Promise<boolean>;
  }

  /**
   * Retrieves all contacts
   * @returns array of [Contact]
   */
  public async getAllContacts() : Promise<Contact[]> {
    return await this.pup(() => WAPI.getAllContacts()) as Promise<Contact[]>;
  }

  public async getWAVersion() : Promise<string>{
    return await this.pup(() => WAPI.getWAVersion()) as Promise<string>;
  }

  /**
   * Retrieves if the phone is online. Please note that this may not be real time.
   * @returns Boolean
   */
  public async isConnected() : Promise<boolean> {
    return await this.pup(() => WAPI.isConnected()) as Promise<boolean>;
  }

  /**
   * Retrieves Battery Level
   * @returns Number
   */
  public async getBatteryLevel() : Promise<number> {
    return await this.pup(() => WAPI.getBatteryLevel()) as Promise<number>;
  }

  /**
   * Retrieves whether or not phone is plugged in (i.e on charge)
   * @returns Number
   */
  public async getIsPlugged() : Promise<boolean>{
    return await this.pup(() => WAPI.getIsPlugged()) as Promise<boolean>;
  }

  /**
   * Retrieves the host device number. Use this number when registering for a license key
   * @returns Number
   */
  public async getHostNumber() : Promise<string> {
    return await this.pup(() => WAPI.getHostNumber()) as Promise<string>;
  }

  /**
   * Returns the the type of license key used by the session.
   * @returns
   */
  public async getLicenseType() : Promise<LicenseType | false> {
    return await this.pup(() => WAPI.getLicenseType()) as Promise<LicenseType | false>;
  }

  /**
   * Get an array of chatIds with their respective last message's timestamp.
   * 
   * This is useful for determining what chats are old/stale and need to be deleted.
   */
  public async getLastMsgTimestamps() : Promise<{
    id: ChatId,
    /**
     * Epoch timestamp (no need to x 1000), works with new Date(t)
     */
    t: number
  }[]> {
    return await this.pup(() => WAPI.getLastMsgTimestamps());
  }


  /**
   * Retrieves all chats
   * @returns array of [Chat]
   */
  public async getAllChats(withNewMessageOnly = false) : Promise<Chat[]>{
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
  public async getAllChatIds() : Promise<ChatId[]> {
      return await this.pup(() => WAPI.getAllChatIds()) as Promise<ChatId[]>;
  }

  /**
   * retrieves an array of IDs of accounts blocked by the host account.
   * @returns Promise<ChatId[]>
   */
  public async getBlockedIds() : Promise<ChatId[]> {
    return await this.pup(() => WAPI.getBlockedIds()) as Promise<ChatId[]>;
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
  public async getAllChatsWithMessages(withNewMessageOnly = false) : Promise<Chat[]> {
    return JSON.parse(await this.pup(withNewMessageOnly => WAPI.getAllChatsWithMessages(withNewMessageOnly), withNewMessageOnly)) as Promise<Chat[]>;
  }

  /**
   * Retrieve all groups
   * @returns array of groups
   */
  public async getAllGroups(withNewMessagesOnly = false) : Promise<Chat[]> {
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
  public async getGroupMembersId(groupId: GroupChatId) :  Promise<ContactId[]>{
    return await this.pup(
      groupId => WAPI.getGroupParticipantIDs(groupId),
      groupId
    ) as Promise<ContactId[]>;
  }

  /**
   * Returns the title and description of a given group id.
   * @param groupId group id
   */
  public async getGroupInfo(groupId: GroupChatId) : Promise<any> {
    return await this.pup(
      groupId => WAPI.getGroupInfo(groupId),
      groupId
    ) as Promise<any>;
  }

  
/** Joins a group via the invite link, code, or message
 * @param link This param is the string which includes the invite link or code. The following work:
 * - Follow this link to join my WA group: https://chat.whatsapp.com/DHTGJUfFJAV9MxOpZO1fBZ
 * - https://chat.whatsapp.com/DHTGJUfFJAV9MxOpZO1fBZ
 * - DHTGJUfFJAV9MxOpZO1fBZ
 * 
 *  If you have been removed from the group previously, it will return `401`
 * 
 * @param returnChatObj boolean When this is set to true and if the group was joined successfully, it will return a serialzed Chat object which includes group information and metadata. This is useful when you want to immediately do something with group metadata.
 * 
 * 
 * @returns Promise<string | boolean | number> Either false if it didn't work, or the group id.
 */
  public async joinGroupViaLink(link: string, returnChatObj?: boolean) : Promise<string | boolean | number | Chat>{
    return await this.pup(
      ({link, returnChatObj}) => WAPI.joinGroupViaLink(link, returnChatObj),
      {link, returnChatObj}
    ) as Promise<string | boolean | number | Chat>;
  }


/**
 * Block contact 
 * @param {string} id '000000000000@c.us'
 */
public async contactBlock(id: ContactId) : Promise<boolean> {
  return await this.pup(id => WAPI.contactBlock(id),id)
}


/**
 * Report a contact for spam, block them and attempt to clear chat.
 * 
 * [This is a restricted feature and requires a restricted key.](https://gum.co/open-wa?tier=1%20Restricted%20License%20Key)
 * 
 * @param {string} id '000000000000@c.us'
 */
public async reportSpam(id: ContactId | ChatId) : Promise<boolean> {
  return await this.pup(id => WAPI.REPORTSPAM(id),id)
}

/**
 * Unblock contact 
 * @param {string} id '000000000000@c.us'
 */
public async contactUnblock(id: ContactId) : Promise<boolean> {
  return await this.pup(id => WAPI.contactUnblock(id),id) as Promise<boolean>;
}

  /**
   * Removes the host device from the group
   * @param groupId group id
   */
  public async leaveGroup(groupId: GroupChatId) : Promise<boolean> {
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
  public async getVCards(msgId: MessageId) : Promise<string[]> {
    return await this.pup(
      msgId => WAPI.getVCards(msgId),
      msgId
    );
  }

  /**
   * Returns group members [Contact] objects
   * @param groupId
   */
  public async getGroupMembers(groupId: GroupChatId) : Promise<Contact[]> {
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
  public async getContact(contactId: ContactId) : Promise<Contact> {
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
  public async getChatById(contactId: ContactId) : Promise<Chat> {
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
  public async getMessageById(messageId: MessageId) : Promise<Message> {
    return await this.pup(
      messageId => WAPI.getMessageById(messageId),
      messageId
    ) as Promise<Message>;
  }

  /**
   * [REQUIRES AN INSIDERS LICENSE-KEY](https://gum.co/open-wa?tier=Insiders%20Program)
   * 
   * Retrieves an order object
   * @param messageId or OrderId
   * @returns order object
   */
   public async getOrder(id: MessageId | string) : Promise<Order> {
    return await this.pup(
      id => WAPI.getOrder(id),
      id
    ) as Promise<Order>;
  }

  /**
   * Retrieves the last message sent by the host account in any given chat or globally.
   * @param chatId This is optional. If no chat Id is set then the last message sent by the host account will be returned.
   * @returns message object
   */
  public async getMyLastMessage(chatId?: ChatId) : Promise<Message> {
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
  public async getStickerDecryptable(messageId: MessageId) : Promise<Message | boolean> {
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
  public async forceStaleMediaUpdate(messageId: MessageId) : Promise<Message | false> {
    const m = await this.pup(
      messageId => WAPI.forceStaleMediaUpdate(messageId),
      messageId
    );
    if(!m) return false;
    return {
      ...bleachMessage(m)
    } as unknown as Message;
  }

  /**
   * Retrieves chat object of given contact id
   * @param contactId
   * @returns contact detial as promise
   */
  public async getChat(contactId: ContactId) : Promise<Chat>{
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
  public async getCommonGroups(contactId: ContactId) : Promise<{
    id: string,
    title: string
  }[]> {
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
  public async getLastSeen(chatId: ChatId) : Promise<number | boolean> {
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
  public async getProfilePicFromServer(chatId: ChatId) : Promise<string> {
    return await this.pup(
      chatId => WAPI.getProfilePicFromServer(chatId),
      chatId
    );
  }

  
  /**
   * Sets a chat status to seen. Marks all messages as ack: 3
   * @param chatId chat id: `xxxxx@c.us`
   */
  public async sendSeen(chatId: ChatId) : Promise<boolean> {
    return await this.pup(
     chatId => WAPI.sendSeen(chatId),
      chatId
    ) as Promise<boolean>;
  }

  
  /**
   * Sets a chat status to unread. May be useful to get host's attention
   * @param chatId chat id: `xxxxx@c.us`
   */
  public async markAsUnread(chatId: ChatId) : Promise<boolean> {
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
   * @param chatId chat id: `xxxxx@c.us`
   */
  public async isChatOnline(chatId: ChatId) : Promise<boolean | string> {
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
  public async loadEarlierMessages(contactId: ContactId) : Promise<Message[]>{
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

public async getStatus(contactId: ContactId) : Promise<{
  id: string,
  status: string
}>{
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
  public async loadAllEarlierMessages(contactId: ContactId) : Promise<Message>{
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
  public async deleteChat(chatId: ChatId) : Promise<boolean> {
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
  public async clearChat(chatId: ChatId) : Promise<boolean> {
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
  public async getGroupInviteLink(chatId: ChatId) : Promise<string>{
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
  public async inviteInfo(link: string) : Promise<any>{
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
  public async revokeGroupInviteLink(chatId: ChatId) : Promise<boolean | string>{
    return await this.pup(
      chatId => WAPI.revokeGroupInviteLink(chatId),
      chatId
    ) as Promise<string | boolean>;
  }

  /**
   * Deletes message of given message id
   * @param chatId The chat id from which to delete the message.
   * @param messageId The specific message id of the message to be deleted
   * @param onlyLocal If it should only delete locally (message remains on the other recipienct's phone). Defaults to false.
   * @returns nothing
   */
  public async deleteMessage(chatId: ChatId, messageId: MessageId[] | MessageId, onlyLocal = false) : Promise<void> {
    return await this.pup(
      ({ chatId, messageId, onlyLocal }) => WAPI.smartDeleteMessages(chatId, messageId, onlyLocal),
      { chatId, messageId, onlyLocal }
    );
  }

  /**
   * Checks if a number is a valid WA number
   * @param contactId, you need to include the @c.us at the end.
   */
  public async checkNumberStatus(contactId: ContactId) : Promise<NumberCheck>{
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
  public async getUnreadMessages(includeMe: boolean, includeNotifications: boolean, use_unread_count: boolean) : Promise<Message[]> {
    return await this.pup(
      ({ includeMe, includeNotifications, use_unread_count }) => WAPI.getUnreadMessages(includeMe, includeNotifications, use_unread_count),
      { includeMe, includeNotifications, use_unread_count }
    );
  }


  /**
   * Retrieves all new Messages. where isNewMsg==true
   * @returns list of messages
   */
  public async getAllNewMessages() : Promise<Message[]> {
    return await this.pup(() => WAPI.getAllNewMessages()) as Promise<Message[]>;
  }

  /**
   * Retrieves all unread Messages. where ack==-1
   * @returns list of messages
   */
  public async getAllUnreadMessages() : Promise<Message[]> {
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
  public async getIndicatedNewMessages() : Promise<Message[]> {
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

  public async getAllMessagesInChat(chatId: ChatId, includeMe: boolean, includeNotifications: boolean) : Promise<Message[]> {
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

  public async loadAndGetAllMessagesInChat(chatId: ChatId, includeMe: boolean, includeNotifications: boolean) : Promise<Message[]> {
    return await this.pup(
      ({ chatId, includeMe, includeNotifications }) => WAPI.loadAndGetAllMessagesInChat(chatId, includeMe, includeNotifications),
      { chatId, includeMe, includeNotifications }
    ) as Promise<Message[]>;
  }

  /**
   * Create a group and add contacts to it
   * 
   * @param groupName group name: 'New group'
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
  public async createGroup(groupName:string,contacts:ContactId|ContactId[]) : Promise<GroupChatCreationResponse> {
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
   * If the participantId does not exist in the group chat, returns `NOT_A_PARTICIPANT`
   * 
   * If the host account is not an administrator, returns `INSUFFICIENT_PERMISSIONS`
   * 
   * @param {*} groupId `0000000000-00000000@g.us`
   * @param {*} participantId `000000000000@c.us`
   */
  public async removeParticipant(groupId: GroupChatId, participantId: ContactId) : Promise<boolean> {
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
  public async setGroupIcon(groupId: GroupChatId, image: DataURL) :Promise<boolean> {
    const mimeInfo = base64MimeType(image);
    console.log("setGroupIcon -> mimeInfo", mimeInfo)
    if(!mimeInfo || mimeInfo.includes("image")){
      let imgData;
      if(this._createConfig.stickerServerEndpoint) {
        imgData = await this.stickerServerRequest('convertGroupIcon', {
          image
        })
      }
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
  public async setGroupIconByUrl(groupId: GroupChatId, url: string, requestConfig: AxiosRequestConfig = {}) : Promise<boolean> {
    // eslint-disable-next-line no-useless-catch
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
  * 
  * If the participantId does not exist in the contacts, returns `NOT_A_CONTACT`
  * 
  * If the host account is not an administrator, returns `INSUFFICIENT_PERMISSIONS`
  * 
  * @param {*} groupId '0000000000-00000000@g.us'
  * @param {*} participantId '000000000000@c.us'
  * 
  */

  public async addParticipant(groupId: GroupChatId, participantId: ContactId | ContactId[]) : Promise<boolean> {
    const res = await this.pup(
      ({ groupId, participantId }) => WAPI.addParticipant(groupId, participantId),
      { groupId, participantId }
    );
    if (typeof res === "object") throw new AddParticipantError('Unable to add some participants', res)
    if (typeof res === "string") throw new AddParticipantError(res)
    return res;
  }

  /**
  * Promote Participant to Admin in Group
  * 
  * 
  * If not a group chat, returns `NOT_A_GROUP_CHAT`.
  * 
  * If the chat does not exist, returns `GROUP_DOES_NOT_EXIST`
  * 
  * If the participantId does not exist in the group chat, returns `NOT_A_PARTICIPANT`
  * 
  * If the host account is not an administrator, returns `INSUFFICIENT_PERMISSIONS`
  * 
  * @param {*} groupId '0000000000-00000000@g.us'
  * @param {*} participantId '000000000000@c.us'
  */

  public async promoteParticipant(groupId: GroupChatId, participantId: ContactId | ContactId[]) : Promise<boolean> {
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
  * If the participantId does not exist in the group chat, returns `NOT_A_PARTICIPANT`
  * 
  * If the host account is not an administrator, returns `INSUFFICIENT_PERMISSIONS`
  * 
  * @param {*} groupId '0000000000-00000000@g.us'
  * @param {*} participantId '000000000000@c.us'
  */
  public async demoteParticipant(groupId: GroupChatId, participantId: ContactId | ContactId[]) : Promise<boolean>{
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
  public async setGroupToAdminsOnly(groupId: GroupChatId, onlyAdmins: boolean) : Promise<boolean> {
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
 public async setGroupEditToAdminsOnly(groupId: GroupChatId, onlyAdmins: boolean) : Promise<boolean> {
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
 public async setGroupDescription(groupId: GroupChatId, description: string) : Promise<boolean> {
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
 public async setGroupTitle(groupId: GroupChatId, title: string) : Promise<boolean> {
  return await this.pup(
    ({ groupId, title }) => WAPI.setGroupTitle(groupId, title),
    { groupId, title }
  ) as Promise<boolean>;
}

  /**
  * Get Admins of a Group
  * @param {*} groupId '0000000000-00000000@g.us'
  */
  public async getGroupAdmins(groupId: GroupChatId) : Promise<ContactId[]> {
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
  public async setChatBackgroundColourHex(hex: string) : Promise<boolean> {
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
  public async darkMode(activate: boolean) : Promise<boolean> {
    return await this.pup(
      (activate) => WAPI.darkMode(activate),
      activate
    ) as Promise<boolean>;
  }

  /**
   * [REQUIRES AN INSIDERS LICENSE-KEY](https://gum.co/open-wa?tier=Insiders%20Program)
   * 
   * Automatically reject calls on the host account device. Please note that the device that is calling you will continue to ring.
   * 
   * @param message optional message to send to the calling account when their call is detected and rejected
   */
  public async autoReject(message?: string) : Promise<boolean> {
    return await this.pup(
      (message) => WAPI.autoReject(message),
      message
    ) as Promise<boolean>;
  }
  

  /**
   * Returns an array of contacts that have read the message. If the message does not exist, it will return an empty array. If the host account has disabled read receipts this may not work!
   * Each of these contact objects have a property `t` which represents the time at which that contact read the message.
   * @param messageId The message id
   */
  public async getMessageReaders(messageId: MessageId) : Promise<Contact[]> {
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
  public async sendStickerfromUrl(to: ChatId, url: string, requestConfig: AxiosRequestConfig = {}, stickerMetadata ?: StickerMetadata) : Promise<string | MessageId | boolean> {
      const base64 = await getDUrl(url, requestConfig);
      return await this.sendImageAsSticker(to, base64, stickerMetadata);
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
  public async sendStickerfromUrlAsReply(to: ChatId, url: string, messageId: MessageId, requestConfig: AxiosRequestConfig = {}, stickerMetadata ?: StickerMetadata): Promise<MessageId | boolean>  {
    const dUrl = await getDUrl(url, requestConfig);
    const processingResponse = await this.prepareWebp(dUrl, stickerMetadata);
    if(!processingResponse) return false;
    const {webpBase64, metadata} = processingResponse;
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
   * @param image: [[DataURL]], [[Base64]], URL (string GET), Relative filepath (string), or Buffer of the image
   * @param messageId  The id of the message to reply to
   * @param stickerMetadata  Sticker metadata
   */
  public async sendImageAsStickerAsReply(to: ChatId, image: DataURL | Buffer | Base64 | string, messageId: MessageId, stickerMetadata ?: StickerMetadata) : Promise<MessageId | boolean | string> {
    //@ts-ignore
    if((Buffer.isBuffer(image)  || typeof image === 'object' || image?.type === 'Buffer') && image.toString) {image = image.toString('base64')} else if(typeof image === 'string') {
      if(!isDataURL(image) && !isBase64(image)) {
        //must be a file then
        if(isUrl(image)){
          image = await getDUrl(image)
        } else {
          const relativePath = path.join(path.resolve(process.cwd(),image|| ''));
          if(fs.existsSync(image) || fs.existsSync(relativePath)) {
            image = await datauri(fs.existsSync(image)  ? image : relativePath);
          } else return 'FILE_NOT_FOUND';
        } 
      }
      }
    const processingResponse = await this.prepareWebp(image as string, stickerMetadata);
    if(!processingResponse) return false;
    const {webpBase64, metadata} = processingResponse;
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
  public async getSingleProperty(namespace: namespace, id: string, property : string) : Promise<any> {
    return await this.pup(
      ({ namespace, id, property }) => WAPI.getSingleProperty(namespace, id, property),
      { namespace, id, property }
    );
  }

  private async stickerServerRequest(func: string, a : any = {}, fallback = false){
    if(!this._createConfig.stickerServerEndpoint) return false;
    if(func === 'convertMp4BufferToWebpDataUrl') fallback = true;
    const sessionInfo = this.getSessionInfo()
    sessionInfo.WA_AUTOMATE_VERSION = sessionInfo.WA_AUTOMATE_VERSION.split(' ')[0]
    if(a.file || a.image) {
      //check if its a local file:
      const key = a.file ? 'file' : 'image';
      if(!isDataURL(a[key]) && !isUrl(a[key]) && !isBase64(a[key])){
        const relativePath = path.join(path.resolve(process.cwd(),a[key]|| ''));
        if(fs.existsSync(a[key]) || fs.existsSync(relativePath)) {
          a[key] = await datauri(fs.existsSync(a[key])  ? a[key] : relativePath);
        } else {
          console.error('FILE_NOT_FOUND')
          throw new CustomError(ERROR_NAME.FILE_NOT_FOUND, 'FILE NOT FOUND')
        }
      }
      if(a?.stickerMetadata && typeof a?.stickerMetadata !== "object") throw new CustomError(ERROR_NAME.BAD_STICKER_METADATA, `Received ${typeof a?.stickerMetadata}: ${a?.stickerMetadata}`);
      // remvebg no longer limited to GCP
      // if((a?.stickerMetadata as StickerMetadata)?.removebg) fallback = true;
      try {
        const {data} = await axios.post(`${((fallback ?  pkg.stickerUrl : 'https://open-wa-sticker-api.herokuapp.com')|| this._createConfig.stickerServerEndpoint).replace(/\/$/, '')}/${func}`, {
          ...a,
        sessionInfo,
        config: this.getConfig()
      },{
        maxBodyLength: 20000000, // 20mb request file limit
        maxContentLength: 1500000 // 1.5mb response body limit
      });
        return data;
      } catch (err) {
        if(err?.message.includes("maxContentLength size")) {
          throw new CustomError(ERROR_NAME.STICKER_TOO_LARGE, err?.message)
        } else if(!fallback){
          return await this.stickerServerRequest(func, a, true)
        }
        console.error(err?.response?.status, err?.response?.data);
        throw err;
        return false;
      }
    } else {
      console.error("Media is missing from this request");
      throw new CustomError(ERROR_NAME.MEDIA_MISSING, "Media is missing from this request")
    }
  }

  private async prepareWebp(image: DataURL, stickerMetadata?: StickerMetadata) {
    // console.log("prepareWebp", image.slice(0,25))
    if(isDataURL(image) && !image.includes("image")) {
      console.error("Not an image. Please use convertMp4BufferToWebpDataUrl to process video stickers");
      return false
    }
    if(this._createConfig.stickerServerEndpoint) {
      return await this.stickerServerRequest('prepareWebp', {
        image,
        stickerMetadata
      })
    }
   
  }

  /**
   * This function takes an image (including animated GIF) and sends it as a sticker to the recipient. This is helpful for sending semi-ephemeral things like QR codes. 
   * The advantage is that it will not show up in the recipients gallery. This function automatiicaly converts images to the required webp format.
   * @param to: The recipient id.
   * @param image: [[DataURL]], [[Base64]], URL (string GET), Relative filepath (string), or Buffer of the image
   */
  public async sendImageAsSticker(to: ChatId, image: DataURL | Buffer | Base64 | string, stickerMetadata?: StickerMetadata) : Promise<MessageId | string | boolean>{
    //@ts-ignore
    if((Buffer.isBuffer(image)  || typeof image === 'object' || image?.type === 'Buffer') && image.toString) {
      image = image.toString('base64')
    } else if(typeof image === 'string') {
      if(!isDataURL(image) && !isBase64(image)) {
        //must be a file then
        if(isUrl(image)){
          image = await getDUrl(image)
        } else {
          const relativePath = path.join(path.resolve(process.cwd(),image|| ''));
          if(fs.existsSync(image) || fs.existsSync(relativePath)) {
            image = await datauri(fs.existsSync(image)  ? image : relativePath);
          } else return 'FILE_NOT_FOUND';
        } 
      }
      }
    
    const processingResponse = await this.prepareWebp(image as string, stickerMetadata);
    if(!processingResponse) return false;
    const {webpBase64, metadata} = processingResponse;
      return await this.pup(
        ({ webpBase64,to, metadata }) => WAPI.sendImageAsSticker(webpBase64,to, metadata),
        { webpBase64,to, metadata }
      );
  }

  /**
   * Use this to send an mp4 file as a sticker. This can also be used to convert GIFs from the chat because GIFs in WA are actually tiny mp4 files.
   * 
   * @param to ChatId The chat id you want to send the webp sticker to
   * @param file [[DataURL]], [[Base64]], URL (string GET), Relative filepath (string), or Buffer of the mp4 file
   * @param messageId message id of the message you want this sticker to reply to. [REQUIRES AN INSIDERS LICENSE-KEY](https://gum.co/open-wa?tier=Insiders%20Program)
   */
  public async sendMp4AsSticker(to: ChatId, file: DataURL | Buffer | Base64 | string, processOptions: Mp4StickerConversionProcessOptions = defaultProcessOptions, stickerMetadata?: StickerMetadata, messageId ?: MessageId) : Promise<MessageId | string | boolean> {
    //@ts-ignore
    if((Buffer.isBuffer(file)  || typeof file === 'object' || file?.type === 'Buffer') && file.toString) {
      file = file.toString('base64')
    }
      if(typeof file === 'string') {
      if(!isDataURL(file) && !isBase64(file)) {
        //must be a file then
        if(isUrl(file)){
          file = await getDUrl(file)
        } else {
          const relativePath = path.join(path.resolve(process.cwd(),file|| ''));
          if(fs.existsSync(file) || fs.existsSync(relativePath)) {
            file = await datauri(fs.existsSync(file)  ? file : relativePath);
          } else return 'FILE_NOT_FOUND';
        } 
      }
      } 
      let convertedStickerDataUrl;
      if(this._createConfig.stickerServerEndpoint) {
        convertedStickerDataUrl = await this.stickerServerRequest('convertMp4BufferToWebpDataUrl', {
          file,
          processOptions,
          stickerMetadata
        })
      } 
    try {
      if(!convertedStickerDataUrl) return false;
      return await (messageId && this._createConfig.licenseKey) ? this.sendRawWebpAsStickerAsReply(to, messageId, convertedStickerDataUrl, true) : this.sendRawWebpAsSticker(to, convertedStickerDataUrl, true);
    } catch (error) {
      const msg = 'Stickers have to be less than 1MB. Please lower the fps or shorten the duration using the processOptions parameter: https://open-wa.github.io/wa-automate-nodejs/classes/client.html#sendmp4assticker'
      console.log(msg)
      throw new CustomError(ERROR_NAME.STICKER_TOO_LARGE,msg);
    }
  }

  /**
   * You can use this to send a raw webp file.
   * @param to ChatId The chat id you want to send the webp sticker to
   * @param webpBase64 Base64 The base64 string of the webp file. Not DataURl
   * @param animated Boolean Set to true if the webp is animated. Default `false`
   */
  public async sendRawWebpAsSticker(to: ChatId, webpBase64: Base64, animated = false): Promise<MessageId | string | boolean> {
    const metadata =  {
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
   * You can use this to send a raw webp file.
   * @param to ChatId The chat id you want to send the webp sticker to
   * @param messageId MessageId Message ID of the message to reply to
   * @param webpBase64 Base64 The base64 string of the webp file. Not DataURl
   * @param animated Boolean Set to true if the webp is animated. Default `false`
   */
  public async sendRawWebpAsStickerAsReply(to: ChatId, messageId: MessageId, webpBase64: Base64, animated = false): Promise<MessageId | string | boolean> {
    const metadata =  {
        format: 'webp',
        width: 512,
        height: 512,
        animated,
    }
    webpBase64 = webpBase64.replace(/^data:image\/(png|gif|jpeg|webp);base64,/,'');
    return await this.pup(
      ({ webpBase64,to, metadata, messageId }) => WAPI.sendStickerAsReply(webpBase64,to, metadata, messageId),
      { webpBase64,to, metadata, messageId }
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
  public async setChatEphemeral(chatId: ChatId, ephemeral: boolean) : Promise<boolean>{
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
  public async sendGiphyAsSticker(to: ChatId, giphyMediaUrl: URL | string) : Promise<MessageId | string | boolean>{
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
  public async postTextStatus(text: Content, textRgba: string, backgroundRgba: string, font: number) : Promise<MessageId | string | boolean>{
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
  public async postImageStatus(data: DataURL, caption: Content) : Promise<MessageId | string | boolean> {
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
  public async postVideoStatus(data: DataURL, caption: Content) : Promise<MessageId | string | boolean> {
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
  public async deleteStatus(statusesToDelete: string | string []) : Promise<boolean> {
    return await this.pup(
      ({ statusesToDelete }) => WAPI.deleteStatus(statusesToDelete),
      { statusesToDelete }
    );
  }

/**
 * Deletes all your existing statuses.
 * @returns boolean. True if it worked.
 */
  public async deleteAllStatus() : Promise<boolean> {
    return await this.pup(() => WAPI.deleteAllStatus());
  }

  /**
   * retrieves all existing statuses.
   *
   * Only works with a Story License Key
   */
  public async getMyStatusArray() : Promise<Message[]> {
    return await this.pup(() => WAPI.getMyStatusArray());
  }

    
  /**
     * Retrieves an array of user ids that have 'read' your story.
     * 
     * @param id string The id of the story
     * 
     * Only works with a Story License Key
     */
    public async getStoryViewers(id: string) : Promise<ContactId[]> {
      return await this.pup(({ id }) => WAPI.getStoryViewers(id),{id}) as Promise<ContactId[]>;
    }
  

    /**
     * 
     * Clears all chats of all messages. This does not delete chats. Please be careful with this as it will remove all messages from whatsapp web and the host device. This feature is great for privacy focussed bots.
     */
  public async clearAllChats() : Promise<boolean> {
    return await this.pup(() => WAPI.clearAllChats());
  }
  

    /**
     * This simple function halves the amount of messages in your session message cache. This does not delete messages off your phone. If over a day you've processed 4000 messages this will possibly result in 4000 messages being present in your session.
     * Calling this method will cut the message cache to 2000 messages, therefore reducing the memory usage of your process.
     * You should use this in conjunction with `getAmountOfLoadedMessages` to intelligently control the session message cache.
     */
  public async cutMsgCache() : Promise<number> {
    return await this.pup(() => WAPI.cutMsgCache());
  }
  

   /**
    * This simple function halves the amount of chats in your session message cache. This does not delete messages off your phone. If over a day you've processed 4000 messages this will possibly result in 4000 messages being present in your session.
    * Calling this method will cut the message cache as much as possible, reducing the memory usage of your process.
    * You should use this in conjunction with `getAmountOfLoadedMessages` to intelligently control the session message cache.
    */
    public async cutChatCache() : Promise<{
      before : {
        msgs: number,
        chats: number
      },
      after : {
        msgs: number,
        chats: number
      },
     }> {
     return await this.pup(() => WAPI.cutChatCache());
   }


   /**
    * Deletes chats from a certain index (default 1000). E.g if this startingFrom param is `100` then all chats from index `100` onwards will be deleted.
    * 
    * @param startingFrom the chat index to start from. Please do not set this to anything less than 10 @default: `1000` 
    */
   public async deleteStaleChats(startingFrom ?: number) : Promise<boolean> {
    return await this.pup(({startingFrom}) => WAPI.deleteStaleChats(startingFrom),{startingFrom});
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
  public async downloadProfilePicFromMessage(message: Message) : Promise<Base64> {
    return await this.downloadFileWithCredentials(message.sender.profilePicThumbObj.imgFull);
  }

  /**
   * Download via the browsers authenticated session via URL.
   * @returns base64 string (non-data url)
   */
  public async downloadFileWithCredentials(url: string) : Promise<Base64> {
    if(!url) throw new CustomError(ERROR_NAME.MISSING_URL, 'Missing URL');
    return await this.pup(({ url }) => WAPI.downloadFileWithCredentials(url),{url});
  }
  
    
  /**
   * 
   * Sets the profile pic of the host number.
   * @param data string data url image string.
   * @returns Promise<boolean> success if true
   */
  public async setProfilePic(data: DataURL) : Promise<boolean> {
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
  middleware = (useSessionIdInPath = false) => async (req : Request, res : Response, next : NextFunction) : Promise<any> => {
    if(useSessionIdInPath && !req.path.includes(this._createConfig.sessionId) && this._createConfig.sessionId!== 'session') return next();
    if(req.method==='POST') {
      const rb = req?.body || {};
      let {args} = rb
      const m = rb?.method || this._createConfig.sessionId && this._createConfig.sessionId!== 'session' && req.path.includes(this._createConfig.sessionId) ? req.path.replace(`/${this._createConfig.sessionId}/`,'') :  req.path.replace('/','');
      let methodRequiresArgs = false
      if(args && !Array.isArray(args)) {
        const methodArgs = parseFunction().parse(this[m]).args
        if(methodArgs?.length > 0) methodRequiresArgs = true;
        args = methodArgs.map(argName=> args[argName]);
      }
      else if(!args) args = [];
      if(this[m]){
        try {
        const response = await this[m](...args);
        let success = true;
        if(typeof response == 'string' && (response.startsWith("Error") || response.startsWith("ERROR"))) success = false
        return res.send({
          success,
          response
        })
        } catch (error) {
        console.error("middleware -> error", error)
        if(methodRequiresArgs && args==[]) error.message = `${req?.params ? "Please set arguments in request json body, not in params." : "Args expected, none found."} ${error.message}`
        return res.send({
          success:false,
          error : {
            name: error.name,
            message: error.message,
            data: error.data
          }
        })
        }
      }
      return res.status(404).send(`Cannot find method: ${m}`)
    }
    return next();
  }

  /**
   * Retreives an array of webhook objects
   */
  public async listWebhooks() : Promise<Webhook[]> {
    return this._registeredWebhooks ? Object.keys(this._registeredWebhooks).map(id=>this._registeredWebhooks[id]).map(({
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      requestConfig,
      ...rest
    })=>rest) as Webhook[] : [];
  }

  /**
   * Removes a webhook.
   * 
   * Returns `true` if the webhook was found and removed. `false` if the webhook was not found and therefore could not be removed. This does not unregister any listeners off of other webhooks.
   * 
   * 
   * @param webhookId The ID of the webhook
   * @retruns boolean
   */
  public async removeWebhook(webhookId: string) : Promise<boolean> {
    if(this._registeredWebhooks[webhookId]) {
      delete this._registeredWebhooks[webhookId];
      return true; //`Webhook for ${simpleListener} removed`
    }
    return false; //`Webhook for ${simpleListener} not found`
  }

  /**
   * Update registered events for a specific webhook. This will override all existing events. If you'd like to remove all listeners from a webhook, consider using [[removeWebhook]].
   * 
   * In order to update authentication details for a webhook, remove it completely and then reregister it with the correct credentials.
   */
  public async updateWebhook(webhookId: string, events: SimpleListener[] | 'all') : Promise<Webhook | false> {
    if(events==="all") events = Object.keys(SimpleListener).map(eventKey =>SimpleListener[eventKey])
    if(!Array.isArray(events)) events = [events]
    const validListeners = await this._setupWebhooksOnListeners(events)
    if(this._registeredWebhooks[webhookId]) {
      this._registeredWebhooks[webhookId].events = validListeners
      const {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        requestConfig,
        ...rest
      } = this._registeredWebhooks[webhookId] as Webhook;
      return rest;
    }
    return false
  }
  
  /**
   * The client can now automatically handle webhooks. Use this method to register webhooks.
   * 
   * @param event use [[SimpleListener]] enum
   * @param url The webhook url
   * @param requestConfig {} By default the request is a post request, however you can override that and many other options by sending this parameter. You can read more about this parameter here: https://github.com/axios/axios#request-config
   * @param concurrency the amount of concurrent requests to be handled by the built in queue. Default is 5.
   */
  // public async registerWebhook(event: SimpleListener, url: string, requestConfig: AxiosRequestConfig = {}, concurrency: number = 5) {
  //   if(!this._webhookQueue) this._webhookQueue = new PQueue({ concurrency });
  //   if(this[event]){
  //     if(!this._registeredWebhooks) this._registeredWebhooks={};
  //     if(this._registeredWebhooks[event]) {
  //       console.log('webhook already registered');
  //       return false;
  //     }
  //     this._registeredWebhooks[event] = this[event](async _data=>await this._webhookQueue.add(async () => await axios({
  //       method: 'post',
  //       url,
  //       data: {
  //       ts: Date.now(),
  //       event,
  //       data:_data
  //       },
  //       ...requestConfig
  //     })));
  //     return this._registeredWebhooks[event];
  //   }
  //   console.log('Invalid lisetner', event);
  //   return false;
  // }


  private async _setupWebhooksOnListeners(events: SimpleListener[] | 'all'){
    if(events==="all") events = Object.keys(SimpleListener).map(eventKey =>SimpleListener[eventKey])
    if(!Array.isArray(events)) events = [events]
    if(!this._registeredWebhookListeners) this._registeredWebhookListeners={};
    if(!this._registeredWebhooks) this._registeredWebhooks={};
    const validListeners = [];
      events.map(event=>{
      if(this[event]){
        validListeners.push(event);
        if(this._registeredWebhookListeners[event] === undefined){
          //set it up
          this._registeredWebhookListeners[event] = this[event](async _data=>await this._webhookQueue.add(async () => await Promise.all([
            ...Object.keys(this._registeredWebhooks).map(webhookId=>this._registeredWebhooks[webhookId]).filter(webhookEntry=>webhookEntry.events.includes(event))
          ].map(({
            id,
            url,
            requestConfig}) => axios({
            method: 'post',
            url,
            data: this.prepEventData(_data,event as SimpleListener,{webhook_id:id}),
            ...requestConfig
          }).catch(err=>console.error(`WEBHOOK ERROR: `, url ,err.message))))));
        }        
      }
      })
      return validListeners;
  }
  /**
   * The client can now automatically handle webhooks. Use this method to register webhooks.
   * 
   * @param url The webhook url
   * @param events An array of [[SimpleListener]] enums or `all` (to register all possible listeners)
   * @param requestConfig {} By default the request is a post request, however you can override that and many other options by sending this parameter. You can read more about this parameter here: https://github.com/axios/axios#request-config
   * @param concurrency the amount of concurrent requests to be handled by the built in queue. Default is 5.
   * @returns A webhook object. This will include a webhook ID and an array of all successfully registered Listeners.
   */
  public async registerWebhook(url: string, events : SimpleListener[] | 'all', requestConfig: AxiosRequestConfig = {}, concurrency = 5) : Promise<Webhook | false> {
    if(!this._webhookQueue) this._webhookQueue = new PQueue({ concurrency });
    const validListeners = await this._setupWebhooksOnListeners(events)
    const id = uuidv4()
    if(validListeners.length) {
      this._registeredWebhooks[id] = {
        id,
        ts: Date.now(),
        url, 
        events: validListeners,
        requestConfig
      }
      return this._registeredWebhooks[id];
    }
    console.log('Invalid listener(s)', events);
    return false;
  }

  private prepEventData(data: any, event: SimpleListener, extras ?: any){
    const sessionId = this.getSessionId();
    return {
        ts: Date.now(),
        sessionId,
        id: uuidv4(),
        event,
        data,
        ...extras
    }
  }

  private getEventSignature(simpleListener?: SimpleListener){
    return `${simpleListener || '**'}.${this._createConfig.sessionId || 'session'}.${this._sessionInfo.INSTANCE_ID}`
  }

  private async registerEv(simpleListener: SimpleListener) {
    if(this[simpleListener]){
      if(!this._registeredEvListeners) this._registeredEvListeners={};
      if(this._registeredEvListeners[simpleListener]) {
        console.log('Listener already registered');
        return false;
      }
      this._registeredEvListeners[simpleListener] = await this[simpleListener](data=>ev.emit(this.getEventSignature(simpleListener),this.prepEventData(data,simpleListener)));
      return true;
    }
    console.log('Invalid lisetner', simpleListener);
    return false;
  }

  /**
   * Every time this is called, it returns one less number. This is used to sort out queue priority.
   */
  private tickPriority() : number {
    this._prio = this._prio -1;
    return this._prio;
  }

  /**
   * Get the INSTANCE_ID of the current session
   */
  public getInstanceId() : string {
    return this._sessionInfo.INSTANCE_ID;
  }

  /**
   * Returns a new message collector for the chat which is related to the first parameter c
   * @param c The Mesasge/Chat or Chat Id to base this message colletor on
   * @param filter A function that consumes a [Message] and returns a boolean which determines whether or not the message shall be collected.
   * @param options The options for the collector. For example, how long the collector shall run for, how many messages it should collect, how long between messages before timing out, etc.
   */
   createMessageCollector(c : Message | ChatId | Chat, filter : CollectorFilter<[Message]>, options : CollectorOptions) : MessageCollector {
    const chatId : ChatId = ((c as Message)?.chat?.id || (c as Chat)?.id || c) as ChatId;
    return new MessageCollector(this.getSessionId(), this.getInstanceId(), chatId, filter, options, ev);
   }

  /**
   * [FROM DISCORDJS]
   * Similar to createMessageCollector but in promise form.
   * Resolves with a collection of messages that pass the specified filter.
   * @param c The Mesasge/Chat or Chat Id to base this message colletor on
   * @param {CollectorFilter} filter The filter function to use
   * @param {AwaitMessagesOptions} [options={}] Optional options to pass to the internal collector
   * @returns {Promise<Collection<string, Message>>}
   * @example
   * ```javascript
   * // Await !vote messages
   * const filter = m => m.body.startsWith('!vote');
   * // Errors: ['time'] treats ending because of the time limit as an error
   * channel.awaitMessages(filter, { max: 4, time: 60000, errors: ['time'] })
   *   .then(collected => console.log(collected.size))
   *   .catch(collected => console.log(`After a minute, only ${collected.size} out of 4 voted.`));
   * ```
   */
   awaitMessages(c : Message | ChatId | Chat, filter : CollectorFilter<[Message]>, options : AwaitMessagesOptions = {}) : Promise<Collection<string,Message>> {
    return new Promise((resolve, reject) => {
       const collector = this.createMessageCollector(c, filter, options);
       collector.once('end', (collection, reason) => {
         if (options.errors && options.errors.includes(reason)) {
           reject(collection);
         } else {
           resolve(collection);
         }
       });
     });
   }

}

export { useragent } from '../config/puppeteer.config'
