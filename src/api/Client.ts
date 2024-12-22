import { default as mime } from 'mime-types';
import { Page, EvaluateFunc, PageEvent } from 'puppeteer';
import { Chat, LiveLocationChangedEvent, ChatState, ChatMuteDuration, GroupChatCreationResponse, EphemeralDuration } from './model/chat';
import { BusinessProfile, Contact, NumberCheck } from './model/contact';
import { Message, MessageInfo, MessagePinDuration, PollData } from './model/message';
import { default as axios, AxiosRequestConfig} from 'axios';
import { NewCommunityGroup, ParticipantChangedEventModel, GenericGroupChangeEvent, GroupMetadata } from './model/group-metadata';
import { useragent } from '../config/puppeteer.config'
import { ConfigObject, STATE, LicenseType, Webhook, OnError, EventPayload } from './model';
import { PageEvaluationTimeout, CustomError, ERROR_NAME, AddParticipantError  } from './model/errors';
import PQueue, { DefaultAddOptions, Options } from 'p-queue';
import { ev, Spin } from '../controllers/events';
import { v4 as uuidv4 } from 'uuid';
import { default as parseFunction} from 'parse-function'
import * as fs from 'fs'
import datauri from 'datauri'
import isUrl from 'is-url-superb'
import { readJsonSync } from 'fs-extra'
import { HealthCheck, SessionInfo } from './model/sessionInfo';
import { deleteSessionData, injectApi, initPage, kill, invalidateSesssionData} from '../controllers/browser';
import { isAuthenticated, QRManager, waitForRipeSession } from '../controllers/auth';
import { ChatId, GroupChatId, Content, Base64, MessageId, ContactId, DataURL, AdvancedFile, GroupId } from './model/aliases';
import { bleachMessage, decryptMedia } from '@open-wa/wa-decrypt';
import * as path from 'path';
import { CustomProduct, Order, Product } from './model/product';
import { Label } from './model/label';
import { defaultProcessOptions, Mp4StickerConversionProcessOptions, StickerMetadata } from './model/media';
import { getAndInjectLicense, getAndInjectLivePatch, getLicense } from "../controllers/patch_manager";
import { SimpleListener } from './model/events';
import { AwaitMessagesOptions, Collection, CollectorFilter, CollectorOptions } from '../structures/Collector';
import { MessageCollector } from '../structures/MessageCollector';
import { injectInitPatch } from '../controllers/init_patch';
import { Listener } from 'eventemitter2';
import PriorityQueue from 'p-queue/dist/priority-queue';
import { MessagePreprocessors } from '../structures/preProcessors';
import { NextFunction, Request, Response } from 'express';
import { assertFile, processSendData, base64MimeType, ensureDUrl, FileOutputTypes, generateGHIssueLink, getDUrl, isBase64, isDataURL, now, rmFileAsync, timePromise } from '../utils/tools';
import { Call } from './model/call';
import { AdvancedButton, Button, LocationButtonBody, Section } from './model/button';
import { JsonObject } from 'type-fest';
import { log } from '../logging/logging';
import { ReactionEvent } from './model/reactions';
import { pidTreeUsage } from '../utils/pid_utils';


/** @ignore */
const pkg = readJsonSync(path.join(__dirname,'../../package.json'));

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
  const onNewProduct: (callback: Function) => any;
  const onIncomingCall: (callback: Function) => any;
  const onCallState: (callback: Function) => any;
  const onAddedToGroup: (callback: Function) => any;
  const onBattery: (callback: Function) => any;
  const onPlugged: (callback: Function) => any;
  const isSessionLoaded: () => any;
  const onGlobalParticipantsChanged: (callback: Function) => any;
  const onStory: (callback: Function) => any;
  const setChatBackgroundColourHex: (hex: string) => boolean;
  const joinWebBeta: (join: boolean) => boolean;
  const darkMode: (activate: boolean) => boolean;
  const autoReject: (message: string) => boolean;
  const emitUnreadMessages: () => boolean;
  const onParticipantsChanged: (groupId: string, callback: Function) => any;
  const _onParticipantsChanged: (groupId: string, callback: Function) => any;
  const onLiveLocation: (chatId: string, callback: Function) => any;
  const getSingleProperty: (namespace: string, id: string, property : string) => any;
  const sendMessage: (to: string, content: string) => Promise<string>;
  const setChatEphemeral: (chatId: string, ephemeral: boolean | number) => Promise<boolean>;
  const downloadFileWithCredentials: (url: string) => Promise<string>;
  const sendPaymentRequest: (chatId : string, amount1000 : number, currency : string, noteMessage : string) => Promise<any>;
  const sendMessageWithMentions: (to: string, content: string, hideTags: boolean, mentions: string[]) => Promise<string>;
  const tagEveryone: (groupId: string, content: string, hideTags: boolean, formatting: string, messageBeforeTags: boolean) => Promise<string>;
  const sendReplyWithMentions: (to: string, content: string, replyMessageId: string, hideTags: string, mentions : string[]) => Promise<string>;
  const postTextStatus: (text: string, textRgba: string, backgroundRgba: string, font: string) => Promise<string | boolean>;
  const postImageStatus: (data: string, caption: string) => Promise<string | boolean>;
  const postVideoStatus: (data: string, caption: string) => Promise<string | boolean>;
  const sendStoryWithThumb:  (thumb:string, url: string, title: string, description: string, text: string, textRgba: string, backgroundRgba: string, font: string) => Promise<string>;
  const setChatState: (chatState: ChatState, chatId: string) => void;
  const reply: (to: string, content: string, quotedMsg: string | Message) => Promise<string|boolean>;
  const getGeneratedUserAgent: (userAgent?: string) => string;
  const forwardMessages: (to: string, messages: string | (string | Message)[], skipMyMessages: boolean) => any;
  const createNewProduct : (name : string, price : number, currency : string, images : DataURL[], description : string, url ?: string, internalId ?: string, isHidden ?: boolean) => Promise<any>;
  const editProduct : (id: string, name : string, price : number, currency : string, images : DataURL[], description : string, url ?: string, internalId ?: string, isHidden ?: boolean) => Promise<any>;
  const sendProduct : (chatId : string, productId : string) => Promise<any>;
  const removeProduct : (productId : string) => Promise<any>;
  const sendLocation: (to: string, lat: any, lng: any, loc: string, address ?: string, url ?: string) => Promise<string>;
  const addParticipant: (groupId: string, contactId: string) => Promise<boolean | string>;
  const sendGiphyAsSticker: (chatId: string, url: string) => Promise<any>;
  const getMessageById: (mesasgeId: string) => Message;
  const getMessageInfo: (mesasgeId: string) => Promise<any>;
  const getOrder: (id: string) => Order;
  const createTemporaryFileInput: () => any;
  const getMyLastMessage: (chatId: string) => Promise<Message>;
  const getStarredMessages: (chatId: string) => Promise<Message[]>;
  const starMessage: (messageId: string) => Promise<boolean>;
  const unstarMessage: (messageId: string) => Promise<boolean>;
  const react: (messageId: string, emoji: string) => Promise<boolean>;
  const getStickerDecryptable: (mesasgeId: string) => Message | boolean;
  const forceStaleMediaUpdate: (mesasgeId: string) => Message | boolean;
  const setMyName: (newName: string) => Promise<boolean>;
  const setMyStatus: (newStatus: string) => void;
  const setProfilePic: (data: string) => Promise<boolean>;
  const setPresence: (available: boolean) => void;
  const getMessageReaders: (messageId: string) => Contact[];
  const getPollData: (messageId: string) => any;
  const getStatus: (contactId: string) => void;
  const B: (chatId: string, payload: any) => MessageId;
  const getCommonGroups: (contactId: string) => Promise<{id:string,title:string}[]>;
  const forceUpdateLiveLocation: (chatId: string) => Promise<LiveLocationChangedEvent []> | boolean;
  const testButtons: (chatId: string) => Promise<any>;
  const setGroupIcon: (groupId: string, imgData: string) => Promise<boolean>;
  const getGroupAdmins: (groupId: string) => Promise<ContactId[]>;
  const removeParticipant: (groupId: string, contactId: string) => Promise<boolean | string>;
  const createLabel: (label: string) => Promise<boolean | string>;
  const addOrRemoveLabels: (label: string, chatId: string, type: string) => Promise<boolean>;
  const promoteParticipant: (groupId: string, contactId: string) => Promise<boolean | string>;
  const demoteParticipant: (groupId: string, contactId: string) => Promise<boolean | string>;
  const setGroupToAdminsOnly: (groupId: string, onlyAdmins: boolean) => Promise<boolean>;
  const setGroupEditToAdminsOnly: (groupId: string, onlyAdmins: boolean) => Promise<boolean>;
  const setGroupApprovalMode: (groupId: string, requireApproval: boolean) => Promise<boolean>;
  const setGroupDescription: (groupId: string, description: string) => Promise<boolean>;
  const setGroupTitle: (groupId: string, title: string) => Promise<boolean>;
  const sendPoll: (groupId: string, name: string, options: string[], quotedMsgId ?: string, allowMultiSelect ?: boolean) => Promise<string>;
  const sendImageAsSticker: (webpBase64: string, to: string, metadata?: any) => Promise<string | boolean>;
  const sendStickerAsReply: (webpBase64: string, to: string, messageId: string, metadata?: any) => Promise<string | boolean>;
  const createGroup: (groupName: string, contactId: string|string[]) => Promise<any>;
  const createCommunity: (communityName: string, communitySubject: string, icon : string, existingGroups : string[], newGroups : any[]) => Promise<any>;
  const sendCustomProduct: (to: ChatId, image: DataURL, productData: CustomProduct) => Promise<string | boolean>;
  const sendSeen: (to: string) => Promise<boolean>;
  const markAsUnread: (to: string) => Promise<boolean>;
  const isChatOnline: (id: string) => Promise<boolean | string>;
  const sendLinkWithAutoPreview: (to: string,url: string,text: string, thumbnail : string) => Promise<string | boolean>;
  const contactBlock: (id: string) => Promise<boolean>;
  const checkReadReceipts: (contactId: string) => Promise<boolean | string>;
  const REPORTSPAM: (id: string) => Promise<boolean>;
  const acceptGroupJoinRequest: (id: string) => Promise<boolean>;
  const contactUnblock: (id: string) => Promise<boolean>;
  const deleteConversation: (chatId: string) => Promise<boolean>;
  const isChatMuted: (chatId: string) => Promise<boolean>;
  const clearChat: (chatId: string) => Promise<any>;
  const inviteInfo: (link: string) => Promise<any>;
  const sendButtons: (to: string, body: any, buttons: string, title: string, footer: string) => Promise<any>;
  const sendAdvancedButtons: (to: string, body: any, buttons: string, text: string, footer: string, filename ?: string) => Promise<any>;
  const sendBanner: (to: string, base64: string) => Promise<any>;
  const sendListMessage: (to: ChatId, sections : any, title : string, description : string, actionText : string) => Promise<any>;
  const ghostForward: (chatId: string, messageId: string) => Promise<boolean>;
  const revokeGroupInviteLink: (chatId: string) => Promise<string> | Promise<boolean>;
  const getGroupApprovalRequests: (chatId: string) => Promise<string> | Promise<boolean>;
  const approveGroupJoinRequest: (groupChatId: string, contactId: string) => Promise<string> | Promise<boolean>;
  const rejectGroupJoinRequest: (groupChatId: string, contactId: string) => Promise<string> | Promise<boolean>;
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
    hideTags?: boolean,
    viewOnce ?: boolean
  ) => Promise<string>;
  const sendMessageWithThumb: (
    thumb: string,
    url: string,
    title: string,
    description: string,
    text: string,
    chatId: string,
    quotedMsgId: string,
    customSize: any
  ) => Promise<boolean>;
  const getBusinessProfilesProducts: (to: string) => Promise<any>;
  const getBusinessProfile: (to: string) => Promise<any>;
  const editMessage: (messageId: string, text: string) => Promise<any>;
  const getCommunityInfo: (groupId: string) => Promise<any>;
  const getCommunityAdminIds: (groupId: string) => Promise<any>;
  const getCommunityAdmins: (groupId: string) => Promise<any>;
  const getCommunityParticipantIds: (groupId: string) => Promise<any>;
  const getCommunityParticipants: (groupId: string) => Promise<any>;
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
  const getFeatures: () => any;
  const getAllLabels: () => any;
  const iAmAdmin: () => Promise<String[]>;
  const getKickedGroups: () => Promise<String[]>;
  const launchMetrics: () => Promise<any>;
  const getLicenseType: () => Promise<String | false>;
  const getTunnelCode: (sessionId: string) => Promise<String | false>;
  const getChatWithNonContacts: () => Contact[];
  const syncContacts: () => boolean;
  const getAmountOfLoadedMessages: () => number;
  const deleteAllStatus: () => Promise<boolean>;
  const getMyStatusArray: () => Promise<any>;
  const getAllUnreadMessages: () => any;  
  const getIndicatedNewMessages: () => any;
  const getAllChatsWithMessages: (withNewMessageOnly?: boolean) => any;
  const getGptArray: (chatId: string, last?: number) => any;
  const getAllChats: () => any;
  const getCommunities: () => any;
  const healthCheck: () => any;
  const getState: () => string;
  const getUnsentMessages: () => Promise<Message[]>;
  const forceUpdateConnectionState: (killBeforeReconnect: boolean) => Promise<string>;
  const getBatteryLevel: () => number;
  const getIsPlugged: () => boolean;
  const clearAllChats: (ts ?: number) => Promise<boolean>;
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
  const getAllGroups: (withNewMessagesOnly:string) => Promise<Chat[]>;
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
  const simulateRecording: (to: string, on: boolean) => Promise<boolean>;
  const archiveChat: (id: string, archive: boolean) => Promise<boolean>;
  const pinChat: (id: string, pin: boolean) => Promise<boolean>;
  const pinMessage: (id: string, pin: boolean, pinDuration: string) => Promise<boolean>;
  const keepMessage: (id: string, keep: boolean) => Promise<boolean>;
  const markAllRead: () => Boolean;
  const isConnected: () => Boolean;
  const logout: () => Boolean;
  const loadEarlierMessages: (contactId: string) => Promise<Message []>;
  const getChatsByLabel: (label: string) => Promise<Chat[] | string>;
  const loadAllEarlierMessages: (contactId: string) => any;
  const getSnapshotElement: (chatId: string) => any;
  const testCallback: (callbackToTest: string, testData : any) => any;
  const loadEarlierMessagesTillDate: (contactId: string, timestamp: number) => any;
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
  private _registeredWebhooks: {
    [id: string]: Webhook
  }
  private _registeredEvListeners: any;
  private _webhookQueue: PQueue;
  private _createConfig: ConfigObject;
  private _sessionInfo: SessionInfo;
  private _listeners: any;
  private _page: Page;
  private _currentlyBeingKilled = false;
  private _refreshing = false
  private _loaded = false;
  private _hostAccountNumber;
  private _prio: number = Number.MAX_SAFE_INTEGER;
  private _pageListeners : {
    event: keyof PageEvent,
    callback: any,
    priority ?: number
  }[] = [];
  private _registeredPageListeners : (keyof PageEvent)[] = [];
  private _onLogoutCallbacks : any[] = [];
  private _queues: {
    [key in SimpleListener] ?: PQueue
  } = {};
  private _autoEmojiSet = false
  private _autoEmojiQ : PQueue = new PQueue({
    concurrency: 1,
    intervalCap: 1,
    carryoverConcurrencyCount: true
  })
  private _onLogoutSet = false
  private _preprocIdempotencyCheck = {}
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
    /**
     * Wait for internal session to load earlier messages
     */
    log.info('Waiting for internal session to finish syncing')
    const syncT = await timePromise(()=>this._page.waitForFunction(()=>WAPI.isSessionLoaded(), {timeout: 20000, polling: 50})).catch(()=>20001)
    log.info(`Internal session finished syncing in ${syncT}ms`)
      if(this._createConfig?.eventMode) {
        await this.registerAllSimpleListenersOnEv();
      }
      this._sessionInfo.PHONE_VERSION = (await this.getMe())?.phone?.wa_version
      log.info('LOADED',{
        PHONE_VERSION: this._sessionInfo.PHONE_VERSION
      })
      if((this._createConfig?.autoEmoji === undefined || this._createConfig?.autoEmoji) && !this._autoEmojiSet) {
        const ident = typeof this._createConfig?.autoEmoji === "string" ? this._createConfig?.autoEmoji : ":"
        this.onMessage(async message => {
          if(message?.body && message.body.startsWith(ident) && message.body.endsWith(ident)) {
            const emojiId = message.body.replace(new RegExp(ident, 'g'),"");
            if(!emojiId) return;
            await this._autoEmojiQ.add(async() => this.sendEmoji(message.from,emojiId,message.id).catch(()=>{}))
          }
          return message
        })
        this._autoEmojiSet = true;
      }
      if((this._createConfig?.deleteSessionDataOnLogout || this._createConfig?.killClientOnLogout) && !this._onLogoutSet) {
        this.onLogout(async () => {
            await this.waitAllQEmpty();
            await this._queues?.onLogout?.onEmpty();
            await this._queues?.onLogout?.onIdle();
            await invalidateSesssionData(this._createConfig)
            if(this._createConfig?.deleteSessionDataOnLogout) await deleteSessionData(this._createConfig)
            if(this._createConfig?.killClientOnLogout) {
              console.log("Session logged out. Killing client")
              log.warn("Session logged out. Killing client")
              this.kill("LOGGED_OUT");
            }
        }, -1)
        this._onLogoutSet = true;
      }
      this._loaded = true;
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
      if(!this._refreshing) {
        console.log("Browser page has closed. Killing client")
        log.warn("Browser page has closed. Killing client")
        this.kill("PAGE_CLOSED");
        if(this._createConfig?.killProcessOnBrowserClose) process.exit();
      }
    })
  }

  private async _reInjectWapi(newTab ?: Page) : Promise<void> {
    await injectApi(newTab || this._page, null, true)
  }

  private async _reRegisterListeners(){
    return Object.keys(this._listeners).forEach((listenerName: SimpleListener)=>this[listenerName](this._listeners[listenerName]));
  }

  /**
   * A convinience method to download the [[DataURL]] of a file
   * @param url The url
   * @param optionsOverride You can use this to override the [axios request config](https://github.com/axios/axios#request-config)
   * @returns `Promise<DataURL>`
   */
  public async download(url: string, optionsOverride: any = {} )  : Promise<DataURL> {
    return await getDUrl(url, optionsOverride)
  } 


  /**
   * Grab the logger for this session/process
   */
  public logger() : any {
    return log;
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
     spinner.info('Refreshing session')
     const START_TIME = Date.now();
     spinner.info("Opening session in new tab")
     const newTab = await this._page.browser().newPage(); 
     const qrManager = new QRManager(this._createConfig);
     await initPage(this.getSessionId(), this._createConfig, qrManager, this._createConfig.customUserAgent, spinner, newTab, true) 
    //  await newTab.goto(puppeteerConfig.WAUrl);
     //Two promises. One that closes the previous page, one that sets up the new page
     const closePageOnConflict = async () => {
      const useHere: string = await this._page.evaluate(()=>WAPI.getUseHereString());
     spinner.info("Waiting for conflict to close stale tab...")
     await this._page.waitForFunction(
        `[...document.querySelectorAll("div[role=button")].find(e=>{return e.innerHTML.toLowerCase().includes("${useHere.toLowerCase()}")})`,
        { timeout: 0, polling: 500 }
      );
      await this._page.goto('about:blank')
     spinner.info("Closing stale tab")
     await this._page.close();
     spinner.info("Stale tab closed. Switching contexts...")
     this._page = newTab;
     }

     const setupNewPage = async () => {
     /**
      * Wait for the new page to be loaded up before closing existing page
      */
     spinner.info("Checking if fresh session is authenticated...")
     if(await isAuthenticated(newTab)) {
        /**
         * Reset all listeners
         */
         this._registeredEvListeners = {};
         // this._listeners = {};
      if(this._createConfig?.waitForRipeSession) {
        await this._reInjectWapi(newTab);
        spinner.start("Waiting for ripe session...")
        if(await waitForRipeSession(newTab)) spinner.succeed("Session ready for injection");
        else spinner.fail("You may experience issues in headless mode. Continuing...")
      }
     spinner.info("Injected new session...")
     await this._reInjectWapi(newTab);
       /**
        * patch
        */
       await getAndInjectLivePatch(newTab, spinner, null, this._createConfig, this._sessionInfo)
       if (this._createConfig?.licenseKey) await getAndInjectLicense(newTab,this._createConfig,me, this._sessionInfo, spinner, preloadlicense);
       /**
        * init patch
        */
      await injectInitPatch(newTab)
     } else throw new Error("Session Logged Out. Cannot refresh. Please restart the process and scan the qr code.")
    }
     await Promise.all([
      closePageOnConflict(),
      setupNewPage()
     ])
     spinner.info("New session live. Setting up...")
     spinner.info("Reregistering listeners")
     await this.loaded()
     if(!this._createConfig?.eventMode) await this._reRegisterListeners();
     spinner.succeed(`Session refreshed in ${(Date.now() - START_TIME)/1000}s`)
     this._refreshing = false;
     spinner.remove()
     this._setOnClose();
     return true;
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
   * Easily resize page on the fly. Useful if you're showing screenshots in a web-app.
   */
  public async resizePage(width = 1920, height = 1080) : Promise<boolean> {
    await this._page.setViewport({
      width,
      height
    });
    return true;
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


  private async pup(pageFunction:EvaluateFunc<any>, ...args) {
    const invocation_id =  uuidv4().slice(-5);
    const {safeMode, callTimeout, idCorrection, logging} = this._createConfig;
    let _t : number;
    if(safeMode) {
      if(!this._page || this._page.isClosed()) throw new CustomError(ERROR_NAME.PAGE_CLOSED, 'page closed');
      const state = await this.forceUpdateConnectionState();
      if(state!==STATE.CONNECTED) throw new CustomError(ERROR_NAME.STATE_ERROR,`state: ${state}`);
    }
    if(idCorrection && args[0]) {
      const fixId = (id: string) => {
        let isGroup = false;
        let scrubbedId = id?.match(/\d|-/g)?.join('')
        scrubbedId = scrubbedId.match(/-/g) && scrubbedId.match(/-/g).length==1 && scrubbedId.split('-')[1].length===10 ? scrubbedId : scrubbedId.replace(/-/g,'')
        if(scrubbedId.includes('-') || scrubbedId.length===18) isGroup = true;
        const fixed =  isGroup ? 
        `${scrubbedId?.replace(/@(c|g).us/g,'')}@g.us` :
        `${scrubbedId?.replace(/@(c|g).us/g,'')}@c.us`;
        log.info('Fixed ID', {id, fixed});
        return fixed;
      }
      if(typeof args[0] === 'string' && args[0] && !(args[0].includes("@g.us") || args[0].includes("@c.us")) && (pageFunction?.toString()?.match(/[^(]*\(([^)]*)\)/)[1] || "")?.replace(/\s/g,'')?.split(',')) {
        const p = (pageFunction?.toString().match(/[^(]*\(([^)]*)\)/)[1] || "").replace(/\s/g,'').split(',');
        if(["to","chatId", "groupChatId", "groupId", "contactId"].includes(p[0])) 
        args[0] = fixId(args[0]);
      } else
      if(typeof args[0] === 'object') Object.entries(args[0]).map(([k,v] : [string,any]) => {
        if(["to","chatId", "groupChatId", "groupId", "contactId"].includes(k) && typeof v == "string" && v && !(v.includes("@g.us") || v.includes("@c.us"))) {
        args[0][k] = fixId(v)
      }})
    }
    if(logging) {
      const wapis = (pageFunction?.toString()?.match(/WAPI\.(\w*)\(/g) || [])?.map(s=>s.replace(/WAPI|\.|\(/g,''));
        _t = Date.now()
        const _args = ["string", "number", "boolean"].includes(typeof args[0]) ? args[0] : {...args[0]};
        log.info(`IN ${invocation_id}`,{
          _method: wapis?.length === 1 ? wapis[0] : wapis,
          _args
          })     
    }
    if(this._createConfig?.aggressiveGarbageCollection) {
      const gc = await this._page.evaluate(() => gc())
    }
    const mainPromise = this._page.evaluate(pageFunction, ...args)
    if(callTimeout) return await Promise.race([mainPromise,new Promise((resolve, reject) => setTimeout(reject, this._createConfig?.callTimeout, new PageEvaluationTimeout()))])
    const res = await mainPromise;
    if(_t && logging) {
      log.info(`OUT ${invocation_id}: ${Date.now() - _t}ms`, {res})
    }
    return this.responseWrap(res);
  }

  private responseWrap(res: any) {
    if(this._loaded && typeof res === "string" && res.includes("requires") && res.includes("license")) {
      console.info('\x1b[36m', "🔶", res, "🔶" ,'\x1b[0m');
    }
    if(this._createConfig.onError && typeof res == "string" && (res.startsWith("Error") || res.startsWith("ERROR"))) {
      const e = this._createConfig.onError;
      /**
       * Log error
       */
      if(
        e == OnError.LOG_AND_FALSE ||
        e == OnError.LOG_AND_STRING ||
        res.includes("get.openwa.dev")
      ) console.error(res);
      /**
       * Return res
       */
      if(
        e == OnError.AS_STRING ||
        e == OnError.NOTHING ||
        e == OnError.LOG_AND_STRING
        ) return res
      /**
       * Return false
       */
      if(
        e == OnError.LOG_AND_FALSE ||
        e == OnError.RETURN_FALSE
        ) return false
      if(e == OnError.RETURN_ERROR) return new Error(res)
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
      return ev.on(this.getEventSignature(funcName),({data})=>fn(data),{objectify: true}) as Listener;
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
      return true
    }
    this._listeners[funcName] = fn;
    /**
     * First check if the function is exposed to the page
     */
    const exists = await this.pup(({checkFuncName})=>window[checkFuncName]?true:false,{checkFuncName:funcName});
    /**
     * If it is exposed to the page then set the listener to that exposed function
     */
    if(exists) return await set();
    const res = await this._page.exposeFunction(funcName, (obj: any) =>fn(obj)).then(set).catch(()=>set) as Promise<boolean>;
    return res;
  }
  
  // NON-STANDARD LISTENERS

  private registerPageEventListener(_event: string, callback : any, priority ?: number) {
    const event : keyof PageEvent = _event as keyof PageEvent
    this._pageListeners.push({
      event,
      callback,
      priority
    })
    if(this._registeredPageListeners.includes(event)) return true;
    this._registeredPageListeners.push(event);
    log.info(`setting page listener: ${String(event)}`, this._registeredPageListeners)
    this._page.on(event, async (...args) => {
      await Promise.all(this._pageListeners.filter(l => l.event === event).filter(({priority})=>priority!==-1).sort((a,b)=>(b.priority || 0)-(a.priority || 0)).map(l => l.callback(...args)))
      await Promise.all(this._pageListeners.filter(l => l.event === event).filter(({priority})=>priority==-1).sort((a,b)=>(b.priority || 0)-(a.priority || 0)).map(l => l.callback(...args)))
      return;
    })
  }

/**
 * It calls the JavaScript garbage collector
 * @returns Nothing.
 */
  public async gc() : Promise<void> {
    await this._page.evaluate(() => gc())
    return;
  }

  /**
   * Listens to a log out event
   * 
   * @event 
   * @param fn callback
   * @param priority A priority of -1 will mean the callback will be triggered after all the non -1 callbacks
   * @fires `true` 
   */
  public async onLogout(fn: (loggedOut?: boolean)=> any, priority ?: number) : Promise<boolean> {
    const event = 'framenavigated';
    this._onLogoutCallbacks.push({
      callback: fn,
      priority
    })
    if(!this._queues[event]) this._queues[event] = new PQueue({
      concurrency: 1,
      intervalCap: 1,
      carryoverConcurrencyCount: true
    })
    if(this._registeredPageListeners.includes(event as keyof PageEvent)) return true;
    this.registerPageEventListener(event, async frame => {
        if(frame.url().includes('post_logout=1')) {
          console.log("LOGGED OUT")
          log.warn("LOGGED OUT")
          await Promise.all(this._onLogoutCallbacks.filter(c=>c.priority!==-1).map(({callback})=>this._queues[event].add(()=>callback(true))))
          await this._queues[event].onEmpty()
          await Promise.all(this._onLogoutCallbacks.filter(c=>c.priority==-1).map(({callback})=>this._queues[event].add(()=>callback(true))))
          await this._queues[event].onEmpty()
        }
    }, priority || 1)
    return true;
  }
  
  /**
   * Wait for the webhook queue to become idle. This is useful for ensuring webhooks are cleared before ending a process.
   */
  public async waitWhQIdle() {
    if(this._webhookQueue) {
      return await this._webhookQueue.onIdle();
    }
    return true;
  }
  
  /**
   * Wait for all queues to be empty
   */
  public async waitAllQEmpty() {
      return await Promise.all([
        this._webhookQueue,
        ...Object.values(this._queues)
      ].filter(q=>q).map(q=>q?.onEmpty()))
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
  private async preprocessMessage(message: Message, source: 'onMessage' | 'onAnyMessage') : Promise<Message> {
    let alreadyProcessed = false;
    if(this._preprocIdempotencyCheck[message.id]) {
      log.info(`preprocessMessage: ${message.id} already being processed`)
      // return message;
      alreadyProcessed = true;
    }
    this._preprocIdempotencyCheck[message.id] = true;
    let fil = "";
    try {
       fil = typeof this._createConfig.preprocFilter == "function" ? this._createConfig.preprocFilter : typeof this._createConfig.preprocFilter == "string" ? eval(this._createConfig.preprocFilter || "undefined") : undefined
    } catch (error) {
        //do nothing
    }
    const m = fil ? [message].filter(typeof fil == "function" ? fil : x=>x)[0] : message;
    if(m && this._createConfig.messagePreprocessor) {
      if(!Array.isArray(this._createConfig.messagePreprocessor)) this._createConfig.messagePreprocessor = [this._createConfig.messagePreprocessor];
      /**
       * Map/chain over the preprocs and resolve.
       * 
       * Each promise will update the _m value which is just a mutatable message object.
       */
      let _m = m;
      await Promise.all(this._createConfig.messagePreprocessor.map(async (preproc, index) => {
        let custom = false;
        const start = Date.now()
        if(typeof preproc === "function") {
          custom = true;
          _m = await preproc(_m, this, alreadyProcessed, source)
        } else if(typeof preproc === "string" && MessagePreprocessors[preproc]) _m = await MessagePreprocessors[preproc](_m, this, alreadyProcessed, source)
        log.info(`Preproc ${custom ? 'CUSTOM' : preproc} ${index} ${fil} ${message.id} ${m.id} ${Date.now() - start}ms`)
        return _m;
      }))
      const preprocres = _m || message
      delete this._preprocIdempotencyCheck[message.id];
      return preprocres
    }
    delete this._preprocIdempotencyCheck[message.id];
    return message;
  }

  /**
   * Listens to incoming messages
   * 
   * @event 
   * @param fn callback
   * @param queueOptions PQueue options. Set to `{}` for default PQueue.
   * @fires [[Message]]
   */
   public async onMessage(fn: (message: Message) => void, queueOptions ?: Options<PriorityQueue, DefaultAddOptions>) : Promise<Listener | boolean> {
    const _fn = async (message : Message) => fn(await this.preprocessMessage(message, 'onMessage'))
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
    const _fn = async (message : Message) => fn(await this.preprocessMessage(message, 'onAnyMessage'))
    return this.registerListener(SimpleListener.AnyMessage, _fn, this?._createConfig?.pQueueDefault || queueOptions);
  }

  /**
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
   * Listens to button message responses
   * @event 
   * @param fn callback
   * @fires [[Message]]
   */
   public async onButton(fn: (message: Message) => void) : Promise<Listener | boolean> {
    return this.registerListener(SimpleListener.Button, fn);
  }

  /**
   * Listens to poll vote events
   * @event 
   * @param fn callback
   * @fires [[PollData]]
   */
   public async onPollVote(fn: (pollDate: PollData) => void) : Promise<Listener | boolean> {
    return this.registerListener(SimpleListener.PollVote, fn);
  }

  /**
   * Listens to broadcast messages
   * @event 
   * @param fn callback
   * @fires [[Message]]
   */
   public async onBroadcast(fn: (message: Message) => void) : Promise<Listener | boolean> {
    return this.registerListener(SimpleListener.Broadcast, fn);
  }

  /** 
   * @deprecated
   * 
   * Listens to battery changes
   * 
   * :::caution
   *
   *  This will most likely not work with multi-device mode (the only remaining mode) since the session is no longer connected to the phone but directly to WA servers.
   * 
   * :::
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
   * {@license:restricted@}
   * 
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
   * Listens to changes on call state
   * @event 
   * @returns Observable stream of call objects
   */
   public async onCallState(fn: (call: Call) => void) : Promise<Listener | boolean> {
    return this.registerListener(SimpleListener.CallState, fn);
  }

  /**
   * Listens to label change events
   * 
   * @event 
   * @param fn callback
   * @fires [[Label]]
   */
   public async onLabel(fn: (label: Label) => void) : Promise<Listener | boolean> {
    return this.registerListener(SimpleListener.Label, fn);
  }

  /**
   *{@license:insiders@}
   * 
   * Listens to new orders. Only works on business accounts
   */
  public async onOrder(fn: (order: Order) => void) : Promise<Listener | boolean> {
    return this.registerListener(SimpleListener.Order, fn);
  }

  /**
   *{@license:insiders@}
   * 
   * Listens to new orders. Only works on business accounts
   */
   public async onNewProduct(fn: (product: Product) => void) : Promise<Listener | boolean> {
    return this.registerListener(SimpleListener.NewProduct, fn);
  }

  /**
   * {@license:insiders@}
   * 
   * Listens to reaction add and change events
   * 
   * @event 
   * @param fn callback
   * @fires [[ReactionEvent]]
   */
   public async onReaction(fn: (reactionEvent: ReactionEvent) => void) : Promise<Listener | boolean> {
    return this.registerListener(SimpleListener.Reaction, fn);
  }

  /**
   * {@license:insiders@}
   * 
   * Listens to chat state, including when a specific user is recording and typing within a group chat.
   * 
   * @event 
   * 
   * Here is an example of the fired object:
   * 
   * @fires 
   * ```javascript
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
    const _fn = async (message : Message) => fn(message)
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
   * Listents to group approval requests. Emits a message object. Use it with `message.isGroupApprovalRequest()` to check if it is a group approval request.
   * 
   * @event
   * @param fn callback function that handles a [[Message]] as the first and only parameter.
   * @returns `true` if the callback was registered
   */
  public async onGroupApprovalRequest(fn: (groupApprovalRequestMessage: Message) => void) : Promise<Listener | boolean> {
    return this.registerListener(SimpleListener.GroupApprovalRequest, fn);
  }

  /**
   * Listens to all group (gp2) events. This can be useful if you want to catch when a group title, subject or picture is changed.
   * 
   * @event
   * @param fn callback function that handles a [[ParticipantChangedEventModel]] as the first and only parameter.
   * @returns `true` if the callback was registered
   */
  public async onGroupChange(fn: (genericGroupChangeEvent: GenericGroupChangeEvent) => void) : Promise<Listener | boolean> {
    return this.registerListener(SimpleListener.GroupChange, fn);
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
   * {@license:insiders@}
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
   * {@license:insiders@}
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
   * {@license:insiders@}
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
 * @emits `<LiveLocationChangedEvent>` LiveLocationChangedEvent
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
 * Use this simple command to test firing callback events.
 * 
 * @param callbackToTest 
 * @param testData 
 * @returns `false` if the callback was not registered/does not exist
 */
public async testCallback(callbackToTest: SimpleListener, testData: any)  : Promise<boolean> {
  return this.pup(
    ({ callbackToTest, testData }) => {
      return WAPI.testCallback(callbackToTest, testData);
    },
    { callbackToTest, testData }
  );
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
   * {@license:insiders@}
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
 * @param {string} vcard vcard as a string, you can send multiple contacts vcard also.
 * @param {string} contactName The display name for the contact. Ignored on multiple vcards
 * @param {string} contactNumber If supplied, this will be injected into the vcard (VERSION 3 ONLY FROM VCARDJS) with the WA id to make it show up with the correct buttons on WA. The format of this param should be including country code, without any other formating. e.g:
 * `4477777777777`
 *  Ignored on multiple vcards
 */
  public async sendVCard(chatId: ChatId, vcard: string, contactName ?:string,  contactNumber ?: string) : Promise<boolean> {
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
   * Forces the session to update the connection state.
   * @param killBeforeAttemptingToReconnect Setting this to true will force the session to drop the current socket connection before attempting to reconnect. This is useful if you want to force the session to reconnect immediately.
   * @returns updated connection state
   */
  public async forceUpdateConnectionState(killBeforeReconnect?: boolean) : Promise<STATE> {
    return await this._page.evaluate((killBeforeReconnect) => WAPI.forceUpdateConnectionState(killBeforeReconnect),killBeforeReconnect) as STATE;
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
  public async kill(reason = "MANUALLY_KILLED") : Promise<boolean> {
    if(this._currentlyBeingKilled) return;
    this._currentlyBeingKilled = true;
    console.log(`Killing client. Shutting Down: ${reason}`);
    log.info(`Killing client. Shutting Down: ${reason}`)
    const browser = await this?._page?.browser()
    const pid = browser?.process() ? browser?.process()?.pid : null;
    try{
      await kill(this._page, browser, false, pid, reason)
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
  public async forceRefocus() : Promise<boolean> {
    const useHere: string = await this._page.evaluate(()=>WAPI.getUseHereString());
    await this._page.waitForFunction(
      `[...document.querySelectorAll("div[role=button")].find(e=>{return e.innerHTML.toLowerCase().includes("${useHere.toLowerCase()}")})`,
      { timeout: 0 }
    );
    await this._page.evaluate(`[...document.querySelectorAll("div[role=button")].find(e=>{return e.innerHTML.toLowerCase().includes("${useHere.toLowerCase()}")}).click()`);
    return true;
  }

  /**
   * Check if the "Phone not Cconnected" message is showing in the browser. If it is showing, then this will return `true`.
   * 
   * @returns `boolean`
   */
  public async isPhoneDisconnected() : Promise<boolean> {
    const phoneNotConnected: string = await this._page.evaluate(()=>WAPI.getLocaledString('active Internet connection'));
    //@ts-ignore
    return await this.pup(`!![...document.querySelectorAll("div")].find(e=>{return e.innerHTML.toLowerCase().includes("${phoneNotConnected.toLowerCase()}")})`)
  }

  /**
   * Runs a health check to help you determine if/when is an appropiate time to restart/refresh the session.
   */
  public async healthCheck() : Promise<HealthCheck> {
    return await this._page.evaluate(() => WAPI.healthCheck());
  }

  /**
   * Get the stats of the current process and the corresponding browser process.
   */
  public async getProcessStats() : Promise<any> {
    return await pidTreeUsage([process.pid, this._page.browser().process().pid])
  }

  
  /**
   * A list of participants in the chat who have their live location on. If the chat does not exist, or the chat does not have any contacts actively sharing their live locations, it will return false. If it's a chat with a single contact, there will be only 1 value in the array if the contact has their livelocation on.
   * Please note. This should only be called once every 30 or so seconds. This forces the phone to grab the latest live location data for the number. This can be used in conjunction with onLiveLocation (this will trigger onLiveLocation).
   * @param chatId string Id of the chat you want to force the phone to get the livelocation data for.
   * @returns `Promise<LiveLocationChangedEvent []>` | boolean 
   */
   public async forceUpdateLiveLocation(chatId: ChatId): Promise<LiveLocationChangedEvent[] | boolean>  {
    return await this.pup(
      ({chatId}) => WAPI.forceUpdateLiveLocation(chatId),
      { chatId }
    );
  }

  /**
   * 
   * @deprecated
   * 
   * :::danger
   *
   * Buttons are broken for the foreseeable future. Please DO NOT get a license solely for access to buttons. They are no longer reliable due to recent changes at WA.
   * 
   * :::
   * 
   * Test the button commands on MD accounts with an insiders key. This is a temporary feature to help fix issue #2658
   */
  public async testButtons(chatId: ChatId): Promise<any>  {
    return await this.pup(
      ({chatId}) => WAPI.testButtons(chatId),
      { chatId }
    );
  }



  private async link(params ?: string) : Promise<string> {
    const _p = [this._createConfig?.linkParams,params].filter(x=>x).join('&')
    return `https://get.openwa.dev/l/${await this.getHostNumber()}${_p?`?${_p}`:''}`
  }

  /**
   * Generate a license link
   */
  public async getLicenseLink(params ?: string) : Promise<string> {
    return await this.link(params)
  }

  /**
   * 
   * {@license:restricted@}
   * 
   * Sends a text message to given chat
   * 
   * A license is **NOT** required to send messages with existing chats/contacts. A license is only required for starting conversations with new numbers.
   * 
   * @param to chat id: `xxxxx@c.us`
   * @param content text message
   */
  public async sendText(to: ChatId, content: Content) : Promise<boolean | MessageId> {
    if(!content) content = ''
    if(typeof content !== 'string') content = String(content);
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
      if(res==err[1]) msg = `ERROR: ${res}. Unlock this feature and support open-wa by getting a license: ${await this.link()}`
      console.error(`\n${msg}\n`);
      return this.responseWrap(msg);
    }
    return (err.includes(res) ? false : res)  as boolean | MessageId;
  }
  

  /**
   * Sends a text message to given chat that includes mentions.
   * In order to use this method correctly you will need to send the text like this:
   * "@4474747474747 how are you?"
   * Basically, add a @ symbol before the number of the contact you want to mention.  
   *   
   * @param to chat id: `xxxxx@c.us`
   * @param content text message
   * @param hideTags Removes all tags within the message
   * @param mentions You can optionally add an array of contact IDs to tag only specific people
   */
  public async sendTextWithMentions(to: ChatId, content: Content, hideTags ?: boolean, mentions ?: ContactId[]) : Promise<boolean | MessageId> {
    //remove all @c.us from the content
    content = content.replace(/@c.us/,"");
    return await this.pup(
      ({ to, content, hideTags, mentions }) => {
        WAPI.sendSeen(to);
        return WAPI.sendMessageWithMentions(to, content, hideTags, mentions);
      },
      { to, content, hideTags,mentions }
    ) as Promise<boolean | MessageId>;
  }


  /**
   * NOTE: This is experimental, most accounts do not have access to this feature in their apps.
   * 
   * Edit an existing message
   * 
   * @param messageId The message ID to edit
   * @param text The new text content
   * @returns 
   */
  public async editMessage(messageId: MessageId, text: Content) : Promise<boolean | MessageId> {
    return await this.pup(
      ({ messageId, text }) => {
        return WAPI.editMessage(messageId, text);
      },
      { messageId, text }
    ) as Promise<boolean | MessageId>;
  }

  /** 
   * [UNTESTED - REQUIRES FEEDBACK]
   * Sends a payment request message to given chat
   * 
   * @param to chat id: `xxxxx@c.us`
   * @param amount number the amount to request in 1000 format (e.g £10 => 10000)
   * @param currency string The 3 letter currency code
   * @param message string optional message to send with the payment request
   */
  public async sendPaymentRequest(to: ChatId, amount: number, currency : string, message?: string) : Promise<boolean | MessageId> {
    return await this.pup(
      ({ to, amount, currency, message }) => {
        return WAPI.sendPaymentRequest(to, amount, currency, message);
      },
      { to, amount, currency, message }
    ) as Promise<boolean | MessageId>;
  }

  
  /**
   * 
   * @deprecated
   * 
   * :::danger
   * 
   * WA BIZ accounts CANNOT send buttons. This is a WA limitation. DO NOT get a license solely for access to buttons on wa business accounts.
   * THIS IS NOT WORKING FOR GROUPS YET.
   * 
   * BUTTONS ARE DEPRECATED FOR NOW. DO NOT GET A LICENSE TO USE BUTTONS.
   * 
   * :::
   * 
   * Send generic quick reply buttons. This is an insiders feature for MD accounts.
   * 
   * @param  {ChatId} to chat id
   * @param  {string | LocationButtonBody} body The body of the buttons message
   * @param  {Button[]} buttons Array of buttons - limit is 3!
   * @param  {string} title The title/header of the buttons message
   * @param  {string} footer The footer of the buttons message
   */
  public async sendButtons(to: ChatId, body : string | LocationButtonBody, buttons : Button[], title ?: string, footer ?: string) : Promise<boolean | MessageId> {
    return await this.pup(
      ({ to,  body, buttons, title, footer }) => {
        return WAPI.sendButtons(to, body, buttons, title, footer);
      },
      { to, body, buttons, title, footer }
    ) as Promise<boolean | MessageId>;
  }

  
  /**
   * @deprecated
   * 
   * :::danger
   *
   * Template messages (URL & CALL buttons) are broken for the foreseeable future. Please DO NOT get a license solely for access to URL or CALL buttons. They are no longer reliable due to recent changes at WA.
   * WA BIZ accounts CANNOT send buttons. This is a WA limitation. DO NOT get a license solely for access to buttons on wa business accounts.
   * 
   * THIS IS NOT WORKING FOR GROUPS YET.
   * 
   * ADVANCED ARE DEPRECATED FOR NOW. DO NOT GET A LICENSE TO USE BUTTONS.
   * 
   * :::
   * 
   * 
   * Send advanced buttons with media body. This is an insiders feature for MD accounts.
   *  
   * Body can be location, image, video or document. Buttons can be quick reply, url or call buttons.
   * 
   * @param  {ChatId} to chat id
   * @param  {string | LocationButtonBody} body The body of the buttons message
   * @param  {AdvancedButton[]} buttons Array of buttons - limit is 3!
   * @param  {string} title The title/header of the buttons message
   * @param  {string} footer The footer of the buttons message
   * @param  {string} filename Required if body is a file!!
   */
  public async sendAdvancedButtons(to: ChatId, body : string | LocationButtonBody, buttons : AdvancedButton[], text : string, footer : string, filename : string) : Promise<boolean | MessageId> {
    if(typeof body !== "string" && body.lat) {
      //this is a location body
      // eslint-disable-next-line no-self-assign
      body = body;
    } else if(typeof body == "string" && !isDataURL(body) && !isBase64(body) && !body.includes("data:")) {
      //must be a file then
      const relativePath = path.join(path.resolve(process.cwd(),body|| ''));
      if(typeof body == "string" && fs.existsSync(body) || fs.existsSync(relativePath)) {
        body = await datauri(fs.existsSync(body)  ? body : relativePath);
      } else if(typeof body == "string" && isUrl(body)){
        body = await getDUrl(body);
      } else throw new CustomError(ERROR_NAME.FILE_NOT_FOUND,`Cannot find file. Make sure the file reference is relative, a valid URL or a valid DataURL: ${body.slice(0,25)}`)
    } else if(typeof body == "string" && (body.includes("data:") && body.includes("undefined") || body.includes("application/octet-stream") && filename && mime.lookup(filename))) {
      body = `data:${mime.lookup(filename)};base64,${(body as string).split(',')[1]}`
    }
    return await this.pup(
      ({ to,  body, buttons, text, footer, filename }) => {
        return WAPI.sendAdvancedButtons(to, body, buttons, text, footer, filename);
      },
      { to, body, buttons, text, footer, filename }
    ) as Promise<boolean | MessageId>;
  }

  /**
   * Send a banner image
   * 
   * Note this is a bit of hack on top of a location message. During testing it is shown to not work on iPhones.
   * 
   * @param  {ChatId} to 
   * @param  {Base64} base64 base64 encoded jpeg
   */
   public async sendBanner(to: ChatId, base64 : Base64) : Promise<boolean | MessageId> {
    return await this.pup(
      ({ to, base64 }) => {
        return WAPI.sendBanner(to, base64);
      },
      { to, base64 }
    ) as Promise<boolean | MessageId>;
  }


   /**
    * 
    * @deprecated
    * 
    * :::danger
    * 
    * It is not currently possible to send a listmessage to a group chat. This is a WA limitation.
    * Please DO NOT get a license solely for access to list messages in group chats.
    * 
    * LIST MESSAGES ARE DEPRECATED TILL FURTHER NOTICE
    * 
    * :::
    * 
    * Send a list message. This will not work when being sent from business accounts!
    * 
    * @param  {ChatId} to
    * @param  {Section[]} sections The Sections of rows for the list message
    * @param  {string} title The title of the list message
    * @param  {string} description The description of the list message
    * @param  {string} actionText The action text of the list message
    */
   public async sendListMessage(to: ChatId, sections : Section[], title : string, description : string, actionText : string) : Promise<boolean | MessageId> {
    return await this.pup(
      ({ to, sections, title, description, actionText }) => {
        return WAPI.sendListMessage(to, sections, title, description, actionText);
      },
      { to, sections, title, description, actionText }
    ) as Promise<boolean | MessageId>;
  }


  /**
   * Sends a reply to given chat that includes mentions, replying to the provided replyMessageId.
   * In order to use this method correctly you will need to send the text like this:
   * "@4474747474747 how are you?"
   * Basically, add a @ symbol before the number of the contact you want to mention.
   * @param to chat id: `xxxxx@c.us`
   * @param content text message
   * @param replyMessageId id of message to reply to
   * @param hideTags Removes all tags within the message
   * @param mentions You can optionally add an array of contact IDs to tag only specific people
   */
  public async sendReplyWithMentions(to: ChatId, content: Content, replyMessageId: MessageId, hideTags ?: boolean, mentions ?: ContactId[]) : Promise<boolean | MessageId> {
    //remove all @c.us from the content
    content = content.replace(/@c.us/,"");
    return await this.pup(
      ({ to, content, replyMessageId, hideTags, mentions}) => {
        WAPI.sendSeen(to);
        return WAPI.sendReplyWithMentions(to, content, replyMessageId, hideTags, mentions);
      },
      { to, content, replyMessageId, hideTags, mentions }
    ) as Promise<boolean | MessageId>;
  }


  /**
   * {@license:insiders@}
   * 
   * Tags everyone in the group with a message
   * 
   * @param groupId group chat id: `xxxxx@g.us`
   * @param content text message to add under all of the tags
   * @param hideTags Removes all tags within the message
   * @param formatting The formatting of the tags. Use @mention to indicate the actual tag. @default `@mention `
   * @param messageBeforeTags set to `true` to show the message before all of the tags
   * @returns `Promise<MessageId>`
   */
  public async tagEveryone(groupId: GroupChatId, content: Content, hideTags?: boolean, formatting ?:string, messageBeforeTags ?: boolean) : Promise<boolean | MessageId> {
    return await this.pup(
      ({ groupId, content, hideTags, formatting, messageBeforeTags  }) => WAPI.tagEveryone(groupId, content, hideTags, formatting, messageBeforeTags ),
      { groupId, content, hideTags, formatting, messageBeforeTags }
    ) as Promise<boolean | MessageId>;
  }

  /**
   * Sends a link to a chat that includes a link preview.
   * @param thumb The base 64 data of the image you want to use as the thunbnail. This should be no more than 200x200px. Note: Dont need data url on this param
   * @param url The link you want to send
   * @param title The title of the link
   * @param description The long description of the link preview
   * @param text The text you want to inslude in the message section. THIS HAS TO INCLUDE THE URL otherwise the url will be prepended to the text automatically.
   * @param chatId The chat you want to send this message to.
   * @param quotedMsgId [INSIDERS] Send this link preview message in response to a given quoted message
   * @param customSize [INSIDERS] Anchor the size of the thumbnail
   */
  public async sendMessageWithThumb(
    thumb: string,
    url: string,
    title: string,
    description: string,
    text: Content,
    chatId: ChatId,
    quotedMsgId?: MessageId,
    customSize?: {height: number, width: number}
    ) : Promise<MessageId | boolean> {
    return await this.pup(
      ({ thumb,
        url,
        title,
        description,
        text,
        chatId,
        quotedMsgId,
        customSize
      }) => {
        WAPI.sendMessageWithThumb(thumb,
          url,
          title,
          description,
          text,
          chatId,
          quotedMsgId,
          customSize);
      },
      {
        thumb,
        url,
        title,
        description,
        text,
        chatId,
        quotedMsgId,
        customSize
      }
    ) as Promise<boolean>;
  }


  /**
   * Note: `address` and `url` are parameters available to insiders only.
   * 
   * Sends a location message to given chat
   * @param to chat id: `xxxxx@c.us`
   * @param lat latitude: '51.5074'
   * @param lng longitude: '0.1278'
   * @param loc location text: 'LONDON!'
   * @param address address text: '1 Regents Park!'
   * @param url address text link: 'https://example.com'
   */
  public async sendLocation(to: ChatId, lat: string, lng: string, loc: string, address ?:string, url ?: string) : Promise<boolean | MessageId> {
    return await this.pup(
      ({ to, lat, lng, loc, address, url }) => WAPI.sendLocation(to, lat, lng, loc, address, url),
      { to, lat, lng, loc, address, url }
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
   * @returns `Promise<[[DataURL]]>`
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
    return `data:${m.mimetype};base64,${mediaData.toString('base64')}` as DataURL
  }

  /**
   * Sends a image to given chat, with caption or not, using base64
   * @param to chat id `xxxxx@c.us`
   * @param file DataURL data:image/xxx;base64,xxx or the RELATIVE (should start with `./` or `../`) path of the file you want to send. With the latest version, you can now set this to a normal URL (for example [GET] `https://file-examples-com.github.io/uploads/2017/10/file_example_JPG_2500kB.jpg`).
   * @param filename string xxxxx
   * @param caption string xxxxx
   * @param waitForKey boolean default: false set this to true if you want to wait for the id of the message. By default this is set to false as it will take a few seconds to retrieve to the key of the message and this waiting may not be desirable for the majority of users.
   * @param hideTags boolean default: false [INSIDERS] set this to try silent tag someone in the caption
   * @returns `Promise <boolean | string>` This will either return true or the id of the message. It will return true after 10 seconds even if waitForId is true
   */
  public async sendImage(
    to: ChatId,
    file: AdvancedFile,
    filename: string,
    caption: Content,
    quotedMsgId?: MessageId,
    waitForId?: boolean,
    ptt?:boolean,
    withoutPreview?:boolean,
    hideTags ?: boolean,
    viewOnce ?: boolean,
    requestConfig ?: any
  ) : Promise<MessageId | boolean> {
    const err = [
     'Not able to send message to broadcast',
     'Not a contact',
     'Error: Number not linked to WhatsApp Account',
     'ERROR: Please make sure you have at least one chat'
    ];

    /**
     * TODO: File upload improvements
     * 1. *Create an arbitrary file input element
     * 2. *Take the file parameter and create a tempfile in temp dir
     * 3. Forward the tempfile path to the file input, upload the file to the browser context.
     * 4. Instruct the WAPI.sendImage function to consume the file from the element in step 1.
     * 5. *Destroy the input element from the page (happens in wapi.sendimage)
     * 6. *Unlink/rm the tempfile
     * 7. Return the ID of the WAPI.sendImage function.
     */
    const [[inputElementId, inputElement], fileAsLocalTemp] = await Promise.all([
      (async ()=>{
        const inputElementId = await this._page.evaluate(()=>WAPI.createTemporaryFileInput());
        const inputElement = await this._page.$(`#${inputElementId}`);
        return [inputElementId, inputElement];
      })(),
      assertFile(file, filename, FileOutputTypes.TEMP_FILE_PATH as any,requestConfig || {})
    ])
    //@ts-ignore
    await inputElement.uploadFile(fileAsLocalTemp as string);
    file = inputElementId;
    
    /**
     * Old method of asserting that the file be a data url - cons = time wasted serializing/deserializing large file to and from b64.
     */
    // file = await assertFile(file, filename, FileOutputTypes.DATA_URL as any,requestConfig || {}) as string

    const res = await this.pup(
      ({ to, file, filename, caption, quotedMsgId, waitForId, ptt, withoutPreview, hideTags, viewOnce}) =>  WAPI.sendImage(file, to, filename, caption, quotedMsgId, waitForId, ptt, withoutPreview, hideTags, viewOnce),
      { to, file, filename, caption, quotedMsgId, waitForId, ptt, withoutPreview, hideTags, viewOnce}
    )
    if(fileAsLocalTemp) await rmFileAsync(fileAsLocalTemp as string)
    if(err.includes(res)) console.error(res);
    return (err.includes(res) ? false : res)  as MessageId | boolean;
  }

  
/**
 * Automatically sends a youtube link with the auto generated link preview. You can also add a custom message.
 * @param chatId 
 * @param url string A youtube link.
 * @param text string Custom text as body of the message, this needs to include the link or it will be appended after the link.
 * @param thumbnail string Base64 of the jpeg/png which will be used to override the automatically generated thumbnail.
 * @param quotedMsgId [INSIDERS] Send this link preview message in response to a given quoted message
 * @param customSize [INSIDERS] Anchor the size of the thumbnail
 */
  public async sendYoutubeLink(to: ChatId, url: string, text: Content = '', thumbnail ?: Base64, quotedMsgId?: MessageId, customSize?: {height: number, width: number}) : Promise<boolean | MessageId> {
    return this.sendLinkWithAutoPreview(to,url,text, thumbnail, quotedMsgId, customSize);
  }

/**
 * Automatically sends a link with the auto generated link preview. You can also add a custom message.
 * @param chatId 
 * @param url string A link.
 * @param text string Custom text as body of the message, this needs to include the link or it will be appended after the link.
 * @param thumbnail Base64 of the jpeg/png which will be used to override the automatically generated thumbnail.
 * @param quotedMsgId [INSIDERS] Send this link preview message in response to a given quoted message
 * @param customSize [INSIDERS] Anchor the size of the thumbnail
 */
  public async sendLinkWithAutoPreview(
    to: ChatId,
    url: string,
    text?: Content,
    thumbnail ?: Base64,
    quotedMsgId?: MessageId,
    customSize?: {height: number, width: number}
  ) : Promise<boolean | MessageId>  {
    let linkData;
    let thumb;
    try {
      linkData = (await axios.get(`${this._createConfig?.linkParser || "https://link.openwa.cloud/api"}?url=${url}`)).data;
      log.info("Got link data")
      if(!thumbnail) thumb = await getDUrl(linkData.image);
    } catch (error) {
      console.error(error)
    }
    if(linkData && (thumbnail || thumb)) return await this.sendMessageWithThumb(thumbnail || thumb,url,linkData.title, linkData.description, text, to, quotedMsgId, customSize);
    else return await this.pup(
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
   * @returns `Promise<MessageId | false>` false if didn't work, otherwise returns message id.
   */
  public async reply(to: ChatId, content: Content, quotedMsgId: MessageId, sendSeen?: boolean) : Promise<boolean | MessageId> {
    if(sendSeen) await this.sendSeen(to);
    return await this.pup(
      ({ to, content, quotedMsgId }) =>WAPI.reply(to, content, quotedMsgId),
      { to, content, quotedMsgId }
    ) as Promise<MessageId | false>;
  }

  /**
   * {@license:insiders@}
   * 
   * Check if a recipient has read receipts on.
   * 
   * This will only work if you have chats sent back and forth between you and the contact 1-1.
   * 
   * @param contactId The Id of the contact with which you have an existing conversation with messages already.
   * @returns `Promise<string | boolean>` true or false or a string with an explaintaion of why it wasn't able to determine the read receipts.
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
   * @returns `Promise <boolean | MessageId>` This will either return true or the id of the message. It will return true after 10 seconds even if waitForId is true
   */
  public async sendFile(
    to: ChatId,
    file: AdvancedFile,
    filename: string,
    caption: Content,
    quotedMsgId?: MessageId,
    waitForId?: boolean,
    ptt?:boolean,
    withoutPreview?:boolean,
    hideTags ?: boolean,
    viewOnce ?: boolean,
    requestConfig ?: any
  ) : Promise<MessageId | boolean> {
    return this.sendImage(to, file, filename, caption, quotedMsgId, waitForId, ptt, withoutPreview, hideTags, viewOnce, requestConfig);
  }

  /**
   * {@license:insiders@}
   * 
   * Checks whether or not the group id provided is known to be unsafe by the contributors of the library.
   * @param groupChatId The group chat you want to deteremine is unsafe
   * @returns `Promise <boolean | string>` This will either return a boolean indiciating whether this group chat id is considered unsafe or an error message as a string
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
   * @returns `Promise <boolean | string>` This will either return true or the id of the message. It will return true after 10 seconds even if waitForId is true
   */
  public async sendPtt(
    to: ChatId,
    file: AdvancedFile,
    quotedMsgId?: MessageId,
  ) : Promise<MessageId> {
    return this.sendImage(to, file, 'ptt.ogg', '', quotedMsgId ? quotedMsgId : null, true, true) as Promise<MessageId> ;
  }
  
  /**
   * Send an audio file with the default audio player (not PTT/voice message)
   * @param to chat id `xxxxx@c.us`
   * @param base64 base64 data:image/xxx;base64,xxx or the path of the file you want to send.
   * @param quotedMsgId string true_0000000000@c.us_JHB2HB23HJ4B234HJB to send as a reply to a message
   */
  public async sendAudio(
    to: ChatId,
    file: AdvancedFile,
    quotedMsgId ?: MessageId,
  ) : Promise<MessageId> {
    return this.sendFile(to,file, 'file.mp3', '', quotedMsgId, true, false, false, false) as Promise<MessageId> ;
  }


  /**
   * Send a poll to a group chat
   * @param to chat id - a group chat is required
   * @param name the name of the poll
   * @param options an array of poll options
   * @param quotedMsgId A message to quote when sending the poll
   * @param allowMultiSelect Whether or not to allow multiple selections. default false
   */
  public async sendPoll(
    to: GroupChatId,
    name: string,
    options: string[],
    quotedMsgId ?: MessageId,
    allowMultiSelect ?: boolean
  ) : Promise<MessageId> {
    return  await this.pup(
      ({ to, name, options , quotedMsgId, allowMultiSelect }) => {
        return WAPI.sendPoll(to, name, options, quotedMsgId, allowMultiSelect );
      },
      { to, name, options, quotedMsgId, allowMultiSelect }
    )
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
    file: AdvancedFile,
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
      log.error('something is wrong with this giphy link', giphyMediaUrl);
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
    hideTags ?: boolean,
    viewOnce ?: boolean
  ) : Promise<MessageId | boolean> {
      return await this.sendFile(to,url,filename,caption,quotedMsgId,waitForId,ptt,withoutPreview, hideTags, viewOnce, requestConfig)
  }

/**
 * Returns an object with all of your host device details
 */
  public async getMe() : Promise<any> {
    return await this._page.evaluate(() => WAPI.getMe());
  }

/**
 * Returns an object with properties of internal features and boolean values that represent if the respective feature is enabled or not.
 */
 public async getFeatures() : Promise<any> {
  return await this._page.evaluate(() => WAPI.getFeatures());
}

  /**
   * Returns a PNG DataURL screenshot of the session
   * @param chatId Chat ID to open before taking a snapshot
   * @param width Width of the viewport for the snapshot. Height also required if you want to resize.
   * @param height Height of the viewport for the snapshot. Width also required if you want to resize.
   * @returns `Promise<DataURL>`
   */
  public async getSnapshot(chatId ?: ChatId, width ?: number, height ?: number) : Promise<DataURL> {
     if(width && height) await this.resizePage(width,height)
      const snapshotElement = chatId ? (await this._page.evaluateHandle(
        ({ chatId }) => WAPI.getSnapshotElement(chatId),
        { chatId }
      ) as any) : this.getPage()
    const screenshot = await snapshotElement.screenshot({
      type:"png",
      encoding: "base64"
    });
    return `data:image/png;base64,${screenshot}` as DataURL;
  }

  /**
   * Returns some metrics of the session/page.
   * @returns `Promise<any>`
   */
   public async metrics() : Promise<any> {
    const metrics = await this._page.metrics();
    const sessionMetrics = await this.pup(() => WAPI.launchMetrics());
    const res = {
      ...(metrics || {}),
      ...(sessionMetrics || {})
    }
    log.info("Metrics:",res)
    return res;
  }

  /**
   * Returns an array of group ids where the host account is admin
   */
   public async iAmAdmin() : Promise<GroupChatId[]>  {
    return await this.pup(() => WAPI.iAmAdmin()) as Promise<GroupChatId[]>;
  }

  /**
   * Returns an array of group ids where the host account has been kicked
   */
  public async getKickedGroups() : Promise<GroupChatId[]>  {
    return await this.pup(() => WAPI.getKickedGroups()) as Promise<GroupChatId[]>;
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
   * @param id id of business profile (i.e the number with @c.us)
   * @returns None
   */
  public async getBusinessProfilesProducts(id: ContactId) : Promise<any>   {
    return await this.pup(
      ({ id }) => WAPI.getBusinessProfilesProducts(id),
      { id }
    );
  }

  /**
   * Get the business info of a given contact id
   *
   * @param id id of business profile (i.e the number with @c.us)
   * @returns None
   */
  public async getBusinessProfile(id: ContactId) : Promise<BusinessProfile>   {
    return await this.pup(
      ({ id }) => WAPI.getBusinessProfile(id),
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
   * @deprecated
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
   * {@license:insiders@}
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
   * Simulate '...recording' in chat
   * @param {string} to 'xxxx@c.us'
   * @param {boolean} on turn on similated recording, false to turn it off you need to manually turn this off.
   */
   public async simulateRecording(to: ChatId, on: boolean) : Promise<boolean> {
    return await this.pup(
      ({ to, on }) => WAPI.simulateRecording(to, on),
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
   * @param pin boolean true => pin, false => unpin
   * @return boolean true: worked
   */
  public async pinChat(id: ChatId, pin: boolean) : Promise<boolean>{
    return await this.pup(
      ({ id, pin }) => WAPI.pinChat(id, pin),
      { id, pin }
    ) as Promise<boolean>;
  }

  /**
   * Pin/Unpin message
   * 
   * @param id The id of the message
   * @param pin boolean true => pin, false => unpin
   * @param pinDuration The length of time to pin the message. Default `ThirtyDays`
   * @return boolean true: worked
   */
  public async pinMessage(id: MessageId, pin: boolean, pinDuration: MessagePinDuration = "ThirtyDays") : Promise<boolean>{
    return await this.pup(
      ({ id, pin, pinDuration }) => WAPI.pinMessage(id, pin, pinDuration),
      { id, pin, pinDuration }
    ) as Promise<boolean>;
  }

  /**
   * Keep a message inside an ephemeral chat
   * 
   * @param id The id of the message
   * @return boolean true: worked
   */
  public async keepMessage(id: MessageId, keep: boolean) : Promise<boolean>{
    return await this.pup(
      ({ id, keep  }) => WAPI.keepMessage(id, keep),
      { id, keep }
    ) as Promise<boolean>;
  }

  /**
   * 
   * {@license:insiders@}
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
   * {@license:insiders@}
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
  public async forwardMessages(to: ChatId, messages: MessageId | MessageId[], skipMyMessages: boolean) : Promise<boolean | MessageId[]>{
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
 * @returns `Promise<MessageId | boolean>`
 */
  public async ghostForward(to: ChatId, messageId: MessageId) : Promise<MessageId | boolean> {
    return await this.pup(
      ({ to, messageId }) => WAPI.ghostForward(to, messageId),
      { to, messageId }
    ) as Promise<MessageId | boolean>;
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
   * Generate a pre-filled github issue link to easily report a bug
   */
  public async getIssueLink() : Promise<string>{
    return generateGHIssueLink(this.getConfig(), this.getSessionInfo())
  }

  /**
   * Retrieves if the phone is online. Please note that this may not be real time.
   * @returns Boolean
   */
  public async isConnected() : Promise<boolean> {
    return await this.pup(() => WAPI.isConnected()) as Promise<boolean>;
  }

  /**
   * Logs out from the session.
   * @param preserveSessionData skip session.data.json file invalidation
   * Please be careful when using this as it can exit the whole process depending on your config
   */
  public async logout(preserveSessionData = false) : Promise<boolean> {
    if(!preserveSessionData) {
      log.info(`LOGOUT CALLED. INVALIDATING SESSION DATA`)
      await invalidateSesssionData(this._createConfig)
    }
    return await this.pup(() => WAPI.logout()) as Promise<boolean>;
  }

  /**
   * @deprecated No longer works due to multi-device changes
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
    if(!this._hostAccountNumber) this._hostAccountNumber = await this.pup(() => WAPI.getHostNumber()) as Promise<string>;
    return this._hostAccountNumber
  }

  /**
   * Returns the the type of license key used by the session.
   * @returns
   */
  public async getLicenseType() : Promise<LicenseType | false> {
    return await this.pup(() => WAPI.getLicenseType()) as Promise<LicenseType | false>;
  }

  /**
   * The EASY API uses this string to secure a subdomain on the openwa public tunnel service.
   * @returns
   */
  public async getTunnelCode() : Promise<string> {
    const sessionId = this.getSessionId();
    return await this.pup(sessionId => WAPI.getTunnelCode(sessionId),sessionId) as Promise<string>;
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
   * @returns `Promise<ChatId[]>`
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
   * Returns a properly formatted array of messages from to send to the openai api
   * 
   * @param last The amount of previous messages to retrieve. Defaults to 10
   * @returns 
   */
  public async getGptArray(chatId: ChatId, last = 10) : Promise<{
    role: "user" | "assistant",
    content: string
  }[]> {
    return await this.pup(({chatId, last}) => WAPI.getGptArray(chatId, last), {chatId, last}) as Promise<{
      role: "user" | "assistant",
      content: string
    }[]>;
  }

  /**
   * Retrieve all groups
   * @returns array of groups
   */
  public async getAllGroups(withNewMessagesOnly = false) : Promise<Chat[]> {
      return await this.pup((withNewMessagesOnly) => WAPI.getAllGroups(withNewMessagesOnly), withNewMessagesOnly) as Chat[];
  }

  /**
   * Retrieve all commmunity Ids
   * @returns array of group ids
   */
  public async getAllCommunities() : Promise<GroupId[]> {
      return await this.pup(() => WAPI.getCommunities()) as GroupId[];
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


  /**
   * Returns the community metadata. Like group metadata but with a `subGroups` property which is the group metadata of the community subgroups.
   * @param communityId community id
   */
  public async getCommunityInfo(communityId: GroupChatId) : Promise<GroupMetadata & {
    subGroups: GroupMetadata[]
  }> {
    return await this.pup(
      communityId => WAPI.getCommunityInfo(communityId),
      communityId
    ) as Promise<any>;
  }

  /**
   * 
   * Accepts a request from a recipient to join a group. Takes the message ID of the request message.
   * 
   * @param {string} messageId
   */
  public async acceptGroupJoinRequest(messageId: MessageId) : Promise<boolean> {
    return await this.pup(messageId => WAPI.acceptGroupJoinRequest(messageId),messageId)
  }
  
  /**
   * Retrieves community members Ids
   * @param communityId community id
   */
  public async getCommunityParticipantIds(communityId: GroupChatId) :  Promise<{
    id: GroupChatId,
    participants: ContactId[],
    subgroup: boolean
  }[]>{
    return await this.pup(
      communityId => WAPI.getCommunityParticipantIds(communityId),
      communityId
    ) as Promise<{
      id: GroupChatId,
      participants: ContactId[],
      subgroup: boolean
    }[]>;
  }

  /**
   * Retrieves community admin Ids
   * @param communityId community id
   */
  public async getCommunityAdminIds(communityId: GroupChatId) :  Promise<{
    id: GroupChatId,
    admins: ContactId[],
    subgroup: boolean
  }[]>{
    return await this.pup(
      communityId => WAPI.getCommunityAdminIds(communityId),
      communityId
    ) as Promise<{
      id: GroupChatId,
      admins: ContactId[],
      subgroup: boolean
    }[]>;
  }


  /**
   * Retrieves community members as Contact objects
   * @param communityId community id
   */
  public async getCommunityParticipants(communityId: GroupChatId) :  Promise<{
    id: GroupChatId,
    participants: Contact[],
    subgroup: boolean
  }[]>{
    return await this.pup(
      communityId => WAPI.getCommunityParticipants(communityId),
      communityId
    ) as Promise<{
      id: GroupChatId,
      participants: Contact[],
      subgroup: boolean
    }[]>;
  }

  /**
   * Retrieves community admins as Contact objects
   * @param communityId community id
   */
  public async getCommunityAdmins(communityId: GroupChatId) :  Promise<{
    id: GroupChatId,
    admins: Contact[],
    subgroup: boolean
  }[]>{
    return await this.pup(
      communityId => WAPI.getCommunityAdmins(communityId),
      communityId
    ) as Promise<{
      id: GroupChatId,
      admins: Contact[],
      subgroup: boolean
    }[]>;
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
 * @returns `Promise<string | boolean | number>` Either false if it didn't work, or the group id.
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
 * {@license:restricted@}
 * 
 * Report a contact for spam, block them and attempt to clear chat.
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
    log.info("group members ids", membersIds);
    if(!Array.isArray(membersIds)) {
      console.error("group members ids is not an array", membersIds);
      return [];
    }
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
   * {@license:insiders@}
   * 
   * Get the detailed message info for a group message sent out by the host account.
   * @param messageId The message Id
   */
  public async getMessageInfo(messageId: MessageId): Promise<MessageInfo> {
    return await this.pup(
      messageId => WAPI.getMessageInfo(messageId),
      messageId
    ) as Promise<MessageInfo>;
  }

  /**
   * {@license:insiders@}
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
   * {@license:insiders@}
   * 
   * Add a product to your catalog
   * 
   * @param {string} name The name of the product
   * @param {number} price The price of the product
   * @param {string} currency The 3-letter currenct code for the product
   * @param {string[]} images An array of dataurl or base64 strings of product images, the first image will be used as the main image. At least one image is required.
   * @param {string} description optional, the description of the product
   * @param {string} url The url of the product for more information
   * @param {string} internalId The internal/backoffice id of the product
   * @param {boolean} isHidden Whether or not the product is shown publicly in your catalog
   * @returns product object
   */
   public async createNewProduct(name : string, price : number, currency : string, images : string[], description : string, url ?: string, internalId ?: string, isHidden ?: boolean) : Promise<Product> {
    if(!Array.isArray(images)) images = [images] ;
    images = await Promise.all(images.map(image=>ensureDUrl(image)))
    return await this.pup(
      ({name, price, currency, images, description, url, internalId, isHidden}) => WAPI.createNewProduct(name, price, currency, images, description, url, internalId, isHidden),
      { name, price, currency, images, description, url, internalId, isHidden }
    ) as Promise<Product>;
  }

  /**
   * {@license:insiders@}
   * 
   * Edit a product in your catalog
   * 
   * @param {string} productId The catalog ID of the product
   * @param {string} name The name of the product
   * @param {number} price The price of the product
   * @param {string} currency The 3-letter currenct code for the product
   * @param {string[]} images An array of dataurl or base64 strings of product images, the first image will be used as the main image. At least one image is required.
   * @param {string} description optional, the description of the product
   * @param {string} url The url of the product for more information
   * @param {string} internalId The internal/backoffice id of the product
   * @param {boolean} isHidden Whether or not the product is shown publicly in your catalog
   * @returns product object
   */
   public async editProduct(productId: string, name ?: string, price ?: number, currency ?: string, images ?: DataURL[], description ?: string, url ?: string, internalId ?: string, isHidden ?: boolean) : Promise<Product> {
    return await this.pup(
      ({productId, name, price, currency, images, description, url, internalId, isHidden}) => WAPI.editProduct(productId, name, price, currency, images, description, url, internalId, isHidden),
      { productId, name, price, currency, images, description, url, internalId, isHidden }
    ) as Promise<Product>;
  }

  /**
   * {@license:insiders@}
   * 
   * Send a product to a chat
   * 
   * @param {string} chatId The chatId
   * @param {string} productId The id of the product
   * @returns MessageID
   */
   public async sendProduct(chatId: ChatId, productId : string ) : Promise<MessageId> {
    return await this.pup(
      ({ chatId, productId }) => WAPI.sendProduct( chatId, productId ),
      { chatId, productId }
    ) as Promise<MessageId>;
  }

  /**
   * 
   * Remove a product from the host account's catalog
   * 
   * @param {string} productId The id of the product
   * @returns boolean
   */
   public async removeProduct(productId : string ) : Promise<boolean> {
    return await this.pup(
      ({ productId }) => WAPI.removeProduct( productId ),
      { productId }
    ) as Promise<boolean>;
  }

  /**
   * Retrieves the last message sent by the host account in any given chat or globally.
   * @param chatId This is optional. If no chat Id is set then the last message sent by the host account will be returned.
   * @returns message object or `undefined` if the host account's last message could not be found.
   */
  public async getMyLastMessage(chatId?: ChatId) : Promise<Message | undefined> {
    return await this.pup(
      chatId => WAPI.getMyLastMessage(chatId),
      chatId
    ) as Promise<Message | undefined>;
  }

  /**
   * Retrieves the starred messages in a given chat
   * @param chatId Chat ID to filter starred messages by
   * @returns message object
   */
   public async getStarredMessages(chatId?: ChatId) : Promise<Message[]> {
    return await this.pup(
      chatId => WAPI.getStarredMessages(chatId),
      chatId
    ) as Promise<Message[]>;
  }

  /**
   * Star a message
   * @param messageId Message ID of the message you want to star
   * @returns `true`
   */
   public async starMessage(messageId: MessageId) : Promise<boolean> {
    return await this.pup(
      messageId => WAPI.starMessage(messageId),
      messageId
    ) as Promise<boolean>;
  }

  /**
   * Unstar a message
   * @param messageId Message ID of the message you want to unstar
   * @returns `true`
   */
   public async unstarMessage(messageId: MessageId) : Promise<boolean> {
    return await this.pup(
      messageId => WAPI.unstarMessage(messageId),
      messageId
    ) as Promise<boolean>;
  }

  /**
   * React to a message
   * @param messageId Message ID of the message you want to react to
   * @param emoji 1 single emoji to add to the message as a reacion
   * @returns boolean
   */
   public async react(messageId: MessageId, emoji: string) : Promise<boolean> {
    return await this.pup(
      ({messageId,emoji}) => WAPI.react(messageId, emoji),
      {messageId,emoji}
    ) as Promise<boolean>;
  }

  /**
   * @deprecated
   * 
   * Retrieves a message object which results in a valid sticker instead of a blank one. This also works with animated stickers.
   * 
   * If you run this without a valid insiders key, it will return false and cause an error upon decryption.
   * 
   * @param messageId The message ID `message.id`
   * @returns message object OR `false`
   */
  public async getStickerDecryptable(messageId: MessageId) : Promise<Message | false> {
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
   * {@license:insiders@}
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
   * {@license:insiders@}
   * 
   * Retrieves the groups that you have in common with a contact
   * @param contactId
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
   * Runs sendSeen on all chats
   */
  public async markAllRead() : Promise<boolean> {
    return await this.pup(() => WAPI.markAllRead()) as Promise<boolean>;
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
 * @param contactId to '000000000000@c.us'
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
   * 
   * {@license:insiders@}
   * 
   * :::danger
   *
   * Buttons are broken for the foreseeable future. Please DO NOT get a license solely for access to buttons. They are no longer reliable due to recent changes at WA.
   * 
   * :::
   * 
   * Use a raw payload within your open-wa session
   * 
   * @example
   * If there is a code block, then both TypeDoc and VSCode will treat
   * text outside of the code block as regular text.
   * 
   * ```ts
   * await B('44123456789@c.us', {
   *  test: 1
   * })
   * ```
   * {@link loadAllEarlierMessages}
   * @param chatId
   * @param payload
   * returns: MessageId
   */
   public async B(chatId: ChatId, payload: {
     [k: string]: any
   }) : Promise<MessageId>{
    return await this.pup(
      ({ chatId, payload }) => WAPI.B(chatId, payload),
      { chatId, payload }
    ) as Promise<MessageId>;
  }
  
  /**
    * Load all messages in chat object from server.
   * @param contactId
   * @returns Message[]
   */
  public async loadAllEarlierMessages(contactId: ContactId) : Promise<Message[]>{
    return await this.pup(
      contactId => WAPI.loadAllEarlierMessages(contactId),
      contactId
    );
  }

  /**
    * Load all messages until a given timestamp in chat object from server.
   * @param contactId
   * @param timestamp in seconds
   * @returns Message[]
   */
  public async loadEarlierMessagesTillDate(contactId: ContactId, timestamp: number) : Promise<Message[]>{
    return await this.pup(
      ({contactId, timestamp}) => WAPI.loadEarlierMessagesTillDate(contactId, timestamp),
      {contactId, timestamp}
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
   * @returns `Promise<string>`
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
   * @returns `Promise<boolean>`
   */
  public async revokeGroupInviteLink(chatId: ChatId) : Promise<boolean | string>{
    return await this.pup(
      chatId => WAPI.revokeGroupInviteLink(chatId),
      chatId
    ) as Promise<string | boolean>;
  }


  /**
   * Gets the contact IDs of members requesting approval to join the group 
   * @param groupChatId
   * @returns `Promise<ContactId[]>`
   */
  public async getGroupApprovalRequests(groupChatId: GroupChatId) : Promise<ContactId[]>{
    return await this.pup(
      groupChatId => WAPI.getGroupApprovalRequests(groupChatId),
      groupChatId
    ) as Promise<ContactId[]>;
  }


  /**
    * Approves a group join request
   * @param groupChatId The group chat id
   * @param contactId The contact id of the person who is requesting to join the group
   * @returns `Promise<boolean>`
   */
  public async approveGroupJoinRequest(groupChatId: GroupChatId, contactId: ContactId) : Promise<boolean | string>{
    return await this.pup(
      ({groupChatId, contactId}) => WAPI.approveGroupJoinRequest(groupChatId, contactId),
      {groupChatId, contactId}
    ) as Promise<string | boolean>;
  }

  /**
  * Rejects a group join request
   * @param groupChatId The group chat id
   * @param contactId The contact id of the person who is requesting to join the group
   * @returns `Promise<boolean>`
   */
  public async rejectGroupJoinRequest(groupChatId: GroupChatId, contactId: ContactId) : Promise<boolean | string>{
    return await this.pup(
      ({groupChatId, contactId}) => WAPI.rejectGroupJoinRequest(groupChatId, contactId),
      {groupChatId, contactId}
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
   * Retrieves all unread Messages
   * @param includeMe
   * @param includeNotifications
   * @param use_unread_count
   * @returns any
   */
  public async getUnreadMessages(includeMe: boolean, includeNotifications: boolean, use_unread_count: boolean) : Promise<Chat & {
    messages: Message[]
  }[]> {
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
   * Fires all unread messages to the onMessage listener.
   * Make sure to call this AFTER setting your listeners.
   * @returns array of message IDs
   */
  public async emitUnreadMessages() : Promise<MessageId[]> {
    return await this.pup(() => WAPI.emitUnreadMessages()) as Promise<MessageId[]>;
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
   */
  public async createGroup(groupName:string,contacts:ContactId|ContactId[]) : Promise<GroupChatCreationResponse> {
    return await this.pup(
      ({ groupName, contacts }) => WAPI.createGroup(groupName, contacts),
      { groupName, contacts }
    );
  }

  /**
   * {@license:insiders@}
   * 
   * Create a new community
   * 
   * @param communityName The community name
   * @param communitySubject: The community subject line
   * @param icon DataURL of a 1:1 ratio jpeg for the community icon
   * @param existingGroups An array of existing group IDs, that are not already part of a community, to add to this new community.
   * @param newGroups An array of new group objects that
   */
   public async createCommunity(communityName: string, communitySubject: string, icon : DataURL, existingGroups : GroupChatId[] = [], newGroups ?: NewCommunityGroup[]) : Promise<GroupId> {
    return await this.pup(
      ({ communityName, communitySubject, icon, existingGroups, newGroups  }) => WAPI.createCommunity(communityName, communitySubject, icon, existingGroups, newGroups ),
      { communityName, communitySubject, icon, existingGroups, newGroups  }
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
    if(!mimeInfo || mimeInfo.includes("image")){
      let imgData;
        imgData = await this.stickerServerRequest('convertGroupIcon', {
          image
        })
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
   * 
  * Turn on or off the approval requirement for new members to join a group
  * @param groupId '0000000000-00000000@g.us' the group id.
  * @param requireApproval set to true to turn on the approval requirement, false to turn off
  * @returns boolean true if action completed successfully.
  */
  public async setGroupApprovalMode(groupId: GroupChatId, requireApproval: boolean) : Promise<boolean> {
    return await this.pup(
      ({ groupId, requireApproval }) => WAPI.setGroupApprovalMode(groupId, requireApproval),
      { groupId, requireApproval }
    ) as Promise<boolean>;
  }

  /**
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
   * {@license:insiders@}
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
   * {@license:insiders@}
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
   * Join or leave the wa web beta program. Will return true of operation was successful.
   * 
   * @param {boolean} join true to join the beta, false to leave
  */
  public async joinWebBeta(join: boolean) : Promise<boolean> {
    return await this.pup(
      (join) => WAPI.joinWebBeta(join),
      join
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
   * 
   * Automatically reject calls on the host account device. Please note that the device that is calling you will continue to ring.
   * 
   * Update: Due to the nature of MD, the host account will continue ringing.
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
   * Returns poll data including results and votes.
   * 
   * @param messageId The message id of the Poll
   */
  public async getPollData(messageId: MessageId) : Promise<PollData> {
    return await this.pup(
      (messageId) => WAPI.getPollData(messageId),
      messageId
    ) as Promise<PollData>;
  }

  /**
   * Sends a sticker (including GIF) from a given URL
   * @param to: The recipient id.
   * @param url: The url of the image
   * @param requestConfig {} By default the request is a get request, however you can override that and many other options by sending this parameter. You can read more about this parameter here: https://github.com/axios/axios#request-config
   *
   * @returns `Promise<MessageId | boolean>`
   */
  public async sendStickerfromUrl(to: ChatId, url: string, requestConfig: AxiosRequestConfig = {}, stickerMetadata ?: StickerMetadata) : Promise<string | MessageId | boolean> {
      const base64 = await getDUrl(url, requestConfig);
      return await this.sendImageAsSticker(to, base64, stickerMetadata);
  }

  /**
   * {@license:insiders@}
   * 
   * Sends a sticker from a given URL
   * @param to The recipient id.
   * @param url The url of the image
   * @param messageId The id of the message to reply to
   * @param requestConfig {} By default the request is a get request, however you can override that and many other options by sending this parameter. You can read more about this parameter here: https://github.com/axios/axios#request-config
   * 
   * @returns `Promise<MessageId | boolean>`
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
   * {@license:insiders@}
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
    const processingResponse = await this.prepareWebp(image as DataURL, stickerMetadata);
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
    const stickerUrl = this._createConfig.stickerServerEndpoint || (fallback ? pkg.stickerUrl : "https://sticker-api.openwa.dev") ||  "https://sticker-api.openwa.dev"
    if(func === 'convertMp4BufferToWebpDataUrl') fallback = true;
    const sessionInfo = this.getSessionInfo()
    sessionInfo.WA_AUTOMATE_VERSION = sessionInfo.WA_AUTOMATE_VERSION.split(' ')[0]
    if(a.file || a.image || a.emojiId) {
      if(!a.emojiId) {
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
      } 
      if(this._createConfig?.discord) {
        a.stickerMetadata = {
          ...(a.stickerMetadata || {}),
          discord: `${a.stickerMetadata?.discord || this._createConfig.discord}`
        }
      }
      try {
        const url = `${stickerUrl.replace(/\/$/, '')}/${func}`
        log.info(`Requesting sticker from ${url}`)
        const {data} = await axios.post(url, {
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
    if(isDataURL(image) && !image.includes("image")) {
      console.error("Not an image. Please use convertMp4BufferToWebpDataUrl to process video stickers");
      return false
    }
      return await this.stickerServerRequest('prepareWebp', {
        image,
        stickerMetadata
      })
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
    
    const processingResponse = await this.prepareWebp(image as DataURL, stickerMetadata);
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
   * @param messageId message id of the message you want this sticker to reply to. @license:insiders@
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
      const convertedStickerDataUrl = await this.stickerServerRequest('convertMp4BufferToWebpDataUrl', {
          file,
          processOptions,
          stickerMetadata
        })
    try {
      if(!convertedStickerDataUrl) return false;
      return await (messageId && this._createConfig.licenseKey) ? this.sendRawWebpAsStickerAsReply(to, messageId, convertedStickerDataUrl, true) : this.sendRawWebpAsSticker(to, convertedStickerDataUrl, true);
    } catch (error) {
      const msg = 'Stickers have to be less than 1MB. Please lower the fps or shorten the duration using the processOptions parameter: https://open-wa.github.io/wa-automate-nodejs/classes/client.html#sendmp4assticker'
      console.log(msg)
      log.warn(msg)
      throw new CustomError(ERROR_NAME.STICKER_TOO_LARGE,msg);
    }
  }

  /**
   * Send a discord emoji to a chat as a sticker
   * 
   * @param to ChatId The chat id you want to send the webp sticker to
   * @param emojiId The discord emoji id without indentifying chars. In discord you would write `:who:`, here use `who`
   * @param messageId message id of the message you want this sticker to reply to. @license:insiders@
   */
  public async sendEmoji(to: ChatId, emojiId: string, messageId ?: MessageId) : Promise<MessageId | boolean | string> {
    const webp = await this.stickerServerRequest('emoji', {
      emojiId
    });
    if(webp) {
      if(messageId) return await this.sendRawWebpAsStickerAsReply(to, messageId, webp, true) as MessageId
     return await this.sendRawWebpAsSticker(to, webp,true) as MessageId
    }
    return false;
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
    webpBase64 = webpBase64.replace(/^data:image\/(png|gif|jpeg|webp|octet-stream);base64,/,'');
    return await this.pup(
      ({ webpBase64,to, metadata }) => WAPI.sendImageAsSticker(webpBase64,to, metadata),
      { webpBase64,to, metadata }
    );
  }

  /**
   * {@license:insiders@}
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
   * {@license:insiders@}
   * 
   * Turn the ephemeral setting in a chat to on or off
   * @param chatId The ID of the chat
   * @param ephemeral `true` to turn on the ephemeral setting to 1 day, `false` to turn off the ephemeral setting. Other options: `604800 | 7776000`
   * @returns `Promise<boolean>` true if the setting was set, `false` if the chat does not exist
   */
  public async setChatEphemeral(chatId: ChatId, ephemeral: EphemeralDuration | boolean) : Promise<boolean>{
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
   * {@license:restricted@}
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
   * @returns `Promise<string | boolean>` returns status id if it worked, false if it didn't
   */
  public async postTextStatus(text: Content, textRgba: string, backgroundRgba: string, font: number) : Promise<MessageId | string | boolean>{
    return await this.pup(
      ({ text, textRgba, backgroundRgba, font }) => WAPI.postTextStatus(text, textRgba, backgroundRgba, font),
      { text, textRgba, backgroundRgba, font }
    ) as Promise<boolean | string>;
  }
  
  /**
   * {@license:restricted@}
   * 
   * Sends a formatted text story with a thumbnail.
   * @param url The URL to share in the story
   * @param text The text to be displayed in the story 
   * @param textRgba The colour of the text in the story in hex format, make sure to add the alpha value also. E.g "#FF00F4F2"
   * @param backgroundRgba  The colour of the background in the story in hex format, make sure to add the alpha value also. E.g "#4FF31FF2"
   * @param font The font of the text to be used in the story. This has to be a number. Each number refers to a specific predetermined font. Here are the fonts you can choose from:
   * @param thumbnail base64 thumbnail override, if not provided the link server will try to figure it out.
   * 0: Sans Serif
   * 1: Serif
   * 2: [Norican Regular](https://fonts.google.com/specimen/Norican)
   * 3: [Bryndan Write](https://www.dafontfree.net/freefonts-bryndan-write-f160189.htm)
   * @returns `Promise<MessageId>` returns status id if it worked, false if it didn't
   */
  public async postThumbnailStatus(
    url: string,
    text: Content,
    textRgba : string,
    backgroundRgba: string,
    font: number,
    thumbnail ?: Base64,
    ) : Promise<MessageId>{
    let linkData;
    let thumb = thumbnail as string;
    try {
      linkData = (await axios.get(`${this._createConfig?.linkParser || "https://link.openwa.cloud/api"}?url=${url}`)).data;
      log.info("Got link data")
      if(!thumbnail) thumb = await getDUrl(linkData.image);
    } catch (error) {
      console.error(error)
    }
    const { title, description } = linkData
    return await this.pup(
      ({ thumb, url, title, description, text, textRgba, backgroundRgba, font }) => WAPI.sendStoryWithThumb(thumb, url, title, description, text, textRgba, backgroundRgba, font),
      { thumb, url, title, description, text, textRgba, backgroundRgba, font }
    ) as Promise<MessageId>;
  }

  /**
   * {@license:restricted@}
   * 
   * Posts an image story.
   * @param data data url string `data:[<MIME-type>][;charset=<encoding>][;base64],<data>`
   * @param caption The caption for the story 
   * @returns `Promise<string | boolean>` returns status id if it worked, false if it didn't
   */
  public async postImageStatus(data: DataURL, caption: Content) : Promise<MessageId | string | boolean> {
    return await this.pup(
      ({data, caption}) => WAPI.postImageStatus(data, caption),
      { data, caption }
    ) as Promise<boolean | string>;
  }

  /**
   * {@license:restricted@}
   * 
   * Posts a video story.
   * @param data data url string `data:[<MIME-type>][;charset=<encoding>][;base64],<data>`
   * @param caption The caption for the story 
   * @returns `Promise<string | boolean>` returns status id if it worked, false if it didn't
   */
  public async postVideoStatus(data: DataURL, caption: Content) : Promise<MessageId | string | boolean> {
    return await this.pup(
      ({data, caption}) => WAPI.postVideoStatus(data, caption),
      { data, caption }
    ) as Promise<boolean | string>;
  }


/**
 * {@license:restricted@}
 * 
 * Consumes a list of id strings of stories to delete.
 * 
 * @param statusesToDelete string [] | string an array of ids of stories to delete.
 * @returns boolean. True if it worked.
 */
  public async deleteStory(statusesToDelete: string | string []) : Promise<boolean> {
    return await this.pup(
      ({ statusesToDelete }) => WAPI.deleteStatus(statusesToDelete),
      { statusesToDelete }
    );
  }

  /**
   * Alias for deleteStory
   */
  public async deleteStatus(statusesToDelete: string | string []) : Promise<boolean> {
    return await this.deleteStory(statusesToDelete)
  }

/**
 * {@license:restricted@}
 * 
 * Deletes all your existing stories.
 * @returns boolean. True if it worked.
 */
  public async deleteAllStories() : Promise<boolean> {
    return await this.pup(() => WAPI.deleteAllStatus());
  }

  /**
   * Alias for deleteStory
   */
   public async deleteAllStatus() : Promise<boolean> {
    return await this.deleteAllStories();
  }

  /**
   * {@license:restricted@}
   * 
   * Retrieves all existing stories.
   *
   * Only works with a Story License Key
   */
  public async getMyStoryArray() : Promise<Message[]> {
    return await this.pup(() => WAPI.getMyStatusArray());
  }

  /**
   * Alias for deleteStory
   */
  public async getMyStatusArray() : Promise<Message[]> {
    return await this.getMyStoryArray();
  }

    
  /**
   * {@license:restricted@}
   * 
   * Retrieves an array of user ids that have 'read' your story.
   * 
   * @param id string The id of the story
   * 
   */
    public async getStoryViewers(id ?: string) : Promise<ContactId[] | {
      [k: MessageId] : ContactId[]
    }> {
      return await this.pup(({ id }) => WAPI.getStoryViewers(id),{id}) as Promise<ContactId[]>;
    }
  

    /**
     * Clears all chats of all messages. This does not delete chats. Please be careful with this as it will remove all messages from whatsapp web and the host device. This feature is great for privacy focussed bots.
     * 
     * @param ts number A chat that has had a message after ts (epoch timestamp) will not be cleared.
     *
     */
  public async clearAllChats(ts ?: number) : Promise<boolean> {
    return await this.pup(({ ts }) => WAPI.clearAllChats(ts), {ts});
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
   * @returns `Promise<boolean>` success if true
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
  middleware = (useSessionIdInPath = false, PORT ?: number) => async (req : Request, res : Response, next : NextFunction) : Promise<any> => {
    if(useSessionIdInPath && !req.path.includes(this._createConfig.sessionId) && this._createConfig.sessionId!== 'session') return next();
    const methodFromPath = this._createConfig.sessionId && this._createConfig.sessionId!== 'session' && req.path.includes(this._createConfig.sessionId) ? req.path.replace(`/${this._createConfig.sessionId}/`,'') :  req.path.replace('/','');
    if(req.get('owa-check-property') && req.get('owa-check-value')) {
      const checkProp = req.get('owa-check-property')
      const checkValue = req.get('owa-check-value')
      const sessionId = this._createConfig.sessionId 
      const hostAccountNumber = await this.getHostNumber();
      let checkPassed = false
      switch (checkProp) {
        case 'session': 
          checkPassed = sessionId === checkValue
          break;
        case 'number':
          checkPassed = hostAccountNumber.includes(checkValue);
          break;
      }
      if(!checkPassed) {
        if(PORT) processSendData({port:PORT});
        return res.status(412).send({
          success: false,
          error: {
            name: 'CHECK_FAILED',
            message:`Check FAILED - Are you sure you meant to send the request to this session?`,
            data: {
              incomingCheckProperty : checkProp,
              incomingCheckValue : checkValue,
              sessionId,
              hostAccountNumber: `${hostAccountNumber.substr(-4)}`
            }
          }
        })
      }
      }
    if(req.method==='POST') {
      const rb = req?.body || {};
      let {args} = rb
      const m = rb?.method || methodFromPath;
      log.info(`MDLWR - ${m} : ${JSON.stringify(rb || {})}`)
      let methodRequiresArgs = false
      if(args && !Array.isArray(args)) {
        const methodArgs = parseFunction().parse(this[m]).args
        log.info(`methodArgs: ${methodArgs}`)
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
        if(methodRequiresArgs && Array.isArray(args)) error.message = `${req?.params ? "Please set arguments in request json body, not in params." : "Args expected, none found."} ${error.message}`
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
    if(req.method === "GET") {
      if(["snapshot", "getSnapshot" ].includes(methodFromPath)) {
        const snapshot = await this.getSnapshot();
        const snapshotBuffer = Buffer.from(snapshot.split(',')[1], 'base64')
        res.writeHead(200,{
          'Content-Type': 'image/png',
          'Content-Length': snapshotBuffer.length
        });
        return res.end(snapshotBuffer)
      }
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
        if(!event.startsWith("on")) event = `on${event as string}` as SimpleListener;
      if(this[event]){
        validListeners.push(event);
        if(this._registeredWebhookListeners[event] === undefined){
          //set it up
          this._registeredWebhookListeners[event] = this[event](async _data=>await this._webhookQueue.add(async () => await Promise.all([
            ...Object.keys(this._registeredWebhooks).map(webhookId=>this._registeredWebhooks[webhookId]).filter(webhookEntry=>webhookEntry.events.includes(event))
          ].map(({
            id,
            url,
            requestConfig}) => {
              const whStart = now();
              return axios({
                method: 'post',
                url,
                data: this.prepEventData(_data,event as SimpleListener,{webhook_id:id}),
                ...requestConfig
              })
              .then(({status})=>{
                const t = (now() - whStart).toFixed(0);
                log.info("Client Webhook", event, status, t)
              })
              .catch(err=>log.error(`CLIENT WEBHOOK ERROR: `, url ,err.message))
            }
          ))),10000);
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
    log.warn('Invalid listener(s)', events);
    return false;
  }

  prepEventData(data: JsonObject, event: SimpleListener, extras ?: JsonObject) : EventPayload {
    const sessionId = this.getSessionId();
    return {
        ts: Date.now(),
        sessionId,
        id: uuidv4(),
        event,
        data,
        ...extras
    } as EventPayload
  }

  getEventSignature(simpleListener?: SimpleListener) : string{
    return `${simpleListener || '**'}.${this._createConfig.sessionId || 'session'}.${this._sessionInfo.INSTANCE_ID}`
  }

  private async registerEv(simpleListener: SimpleListener) {
    if(this[simpleListener]){
      if(!this._registeredEvListeners) this._registeredEvListeners={};
      if(this._registeredEvListeners[simpleListener]) {
        console.log('Listener already registered');
        log.warn('Listener already registered');
        return false;
      }
      this._registeredEvListeners[simpleListener] = await this[simpleListener](data=>ev.emit(this.getEventSignature(simpleListener),this.prepEventData(data,simpleListener)));
      return true;
    }
    console.log('Invalid lisetner', simpleListener);
    log.warn('Invalid lisetner', simpleListener);
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
