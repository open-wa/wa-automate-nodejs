import type { HyperEmitter } from '@open-wa/hyperemitter';
import type { Logger } from '@open-wa/logger';
import * as fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import type {
  OpenWAClient,
  OpenWAEventMap,
  Transport,
  SessionManager,
  PluginHost,
  STATE,
} from '@open-wa/core';
import type {
  ChatId,
  ContactId,
  MessageId,
  Message,
  Chat,
  Contact,
} from '@open-wa/schema';
import {
  MessageCollector,
  MessageCollectorEvents,
  MessageCollectorOptions,
  AwaitMessagesOptions,
  awaitMessages,
  Collection,
  CollectorFilter,
} from '@open-wa/domain';
import { ListenerManager, type ListenerHandle } from './events/index.js';
import { throwUnsupportedListener } from './runtimeSurface.js';
import type { QueueOptions } from '@open-wa/schema';

import { messagingMethods, type MessagingMethods } from './methods/messaging.js';
import { mediaMethods, type MediaMethods } from './methods/media.js';
import { groupMethods, type GroupMethods } from './methods/groups.js';
import { chatMethods, type ChatMethods } from './methods/chats.js';
import { contactMethods, type ContactMethods } from './methods/contacts.js';

/**
 * Configuration for creating a WhatsApp Client.
 */
export interface ClientConfig {
  /**
   * The OpenWAClient instance from @open-wa/core.
   */
  client: OpenWAClient;
  
  /**
   * Transport instance for page.evaluate calls.
   * Required for WAPI method invocations.
   */
  transport: Transport;
}

/**
 * Evaluate function type - runs code in browser context.
 */
export type EvaluateFn = <Arg, Ret>(
  fn: (arg: Arg) => Ret | Promise<Ret>,
  arg: Arg
) => Promise<Ret>;

/**
 * Client - High-level facade for WhatsApp Web automation.
 * 
 * Composes:
 * - OpenWAClient from @open-wa/core (lifecycle, events, plugins)
 * - Transport for WAPI method calls
 * - Domain-specific method modules (messaging, groups, chats, contacts)
 * 
 * @example
 * ```typescript
 * import { createClient } from '@open-wa/core';
 * import { Client } from '@open-wa/client';
 * 
 * const openwa = await createClient({ driver, plugins: [] });
 * 
 * const client = new Client({ client: openwa, transport: openwa.getTransport() });
 * await client.start();
 * 
 * // Send a message
 * await client.sendText('123456789@c.us', 'Hello!');
 * 
 * // Listen to messages
 * client.onMessage(msg => console.log(msg));
 * ```
 */
export class Client implements MessagingMethods, MediaMethods, GroupMethods, ChatMethods, ContactMethods {
  private readonly _client: OpenWAClient;
  private readonly _transport: Transport;
  private readonly _listenerManager: ListenerManager;
  private _loadedPromise?: Promise<void>;
  private _loaded = false;
  private _phoneVersion?: string;
  private _retainedHooksInstalled = false;
  private _logoutCleanupPromise?: Promise<void>;
  
  constructor(config: ClientConfig) {
    this._client = config.client;
    this._transport = config.transport;
    this._listenerManager = new ListenerManager({
      sessionId: config.client.sessionId,
      events: config.client.events,
    });
    
    // Bind method modules
    this._bindMethods(messagingMethods, this);
    this._bindMethods(mediaMethods, this);
    this._bindMethods(groupMethods, this);
    this._bindMethods(chatMethods, this);
    this._bindMethods(contactMethods, this);

    this._client.registerFinalizationHook(() => this.loaded());
  }
  
  // ─────────────────────────────────────────────────────────────────
  // Core accessors
  // ─────────────────────────────────────────────────────────────────
  
  /**
   * Session ID for this client instance.
   */
  get sessionId(): string {
    return this._client.sessionId;
  }
  
  /**
   * Event emitter for all WhatsApp events.
   * Uses MQTT wildcard patterns (e.g., 'message.*', 'group.#').
   */
  get events(): HyperEmitter<OpenWAEventMap> {
    return this._client.events;
  }
  
  /**
   * Logger instance.
   */
  get logger(): Logger {
    return this._client.logger;
  }
  
  /**
   * Session manager for state tracking.
   */
  get session(): SessionManager {
    return this._client.session;
  }
  
  /**
   * Plugin host for managing plugins.
   */
  get plugins(): PluginHost {
    return this._client.plugins;
  }

  /**
   * Phone WhatsApp version captured during the loaded-equivalent finalization phase.
   */
  get phoneVersion(): string | undefined {
    return this._phoneVersion;
  }
  
  // ─────────────────────────────────────────────────────────────────
  // Lifecycle
  // ─────────────────────────────────────────────────────────────────
  
  /**
   * Start the client - initializes browser, navigates to WA Web, injects WAPI.
   */
  async start(): Promise<void> {
    return this._client.start();
  }
  
  /**
   * Stop the client gracefully.
   */
  async stop(reason?: string): Promise<void> {
    return this._client.stop(reason);
  }
  
  /**
   * Get current connection state.
   */
  getState(): STATE {
    return this._client.getState();
  }

  /**
   * Loaded-equivalent finalization phase.
   * Waits for sync/session readiness, autobinds listener bridges, and captures phone version.
   */
  async loaded(): Promise<void> {
    if (this._loaded) {
      return;
    }

    if (!this._loadedPromise) {
      this._loadedPromise = this._runLoadedFinalization().catch((error) => {
        this._loadedPromise = undefined;
        throw error;
      });
    }

    await this._loadedPromise;
  }
  
  // ─────────────────────────────────────────────────────────────────
  // Evaluate - Low-level WAPI access
  // ─────────────────────────────────────────────────────────────────
  
  /**
   * Execute code in the browser context (page.evaluate).
   * This is the low-level method used by all WAPI calls.
   */
  async evaluate<Arg, Ret>(
    fn: (arg: Arg) => Ret | Promise<Ret>,
    arg: Arg
  ): Promise<Ret> {
    return this._transport.evaluate(fn, arg);
  }
  
  // ─────────────────────────────────────────────────────────────────
  // Message Collectors (Discord.js style)
  // ─────────────────────────────────────────────────────────────────
  
  /**
   * Create a message collector for a specific chat.
   * Collects messages matching the filter until stopped or limits reached.
   * 
   * @example
   * ```typescript
   * const collector = client.createMessageCollector('123@c.us', {
   *   filter: (msg) => msg.body.startsWith('!'),
   *   max: 10,
   *   time: 60000
   * });
   * 
   * collector.on('collect', (msg) => console.log('Collected:', msg.body));
   * collector.on('end', (collected, reason) => {
   *   console.log(`Collected ${collected.size} messages. Reason: ${reason}`);
   * });
   * ```
   */
  createMessageCollector(
    chatId: ChatId,
    options: MessageCollectorOptions & { filter?: CollectorFilter<[Message]> } = {}
  ): MessageCollector {
    const { filter = () => true, ...collectorOptions } = options;
    
    return new MessageCollector(
      this.sessionId,
      chatId,
      filter,
      this.events as unknown as HyperEmitter<MessageCollectorEvents>,
      collectorOptions
    );
  }
  
  /**
   * Await messages in a chat - promise-based collector.
   * 
   * @example
   * ```typescript
   * const messages = await client.awaitMessages('123@c.us', {
   *   filter: (msg) => msg.body === 'confirm',
   *   max: 1,
   *   time: 30000,
   *   errors: ['time']
   * });
   * 
   * console.log('Received confirmation:', messages.first());
   * ```
   */
  async awaitMessages(
    chatId: ChatId,
    options: AwaitMessagesOptions & { filter?: CollectorFilter<[Message]> } = {}
  ): Promise<Collection<string, Message>> {
    const { filter = () => true, ...awaitOptions } = options;
    
    return awaitMessages(
      this.sessionId,
      chatId,
      this.events as unknown as HyperEmitter<MessageCollectorEvents>,
      filter,
      awaitOptions
    );
  }
  
  // ─────────────────────────────────────────────────────────────────
  // Event Listeners (convenience wrappers)
  // ─────────────────────────────────────────────────────────────────
  
  /**
   * Listen for all incoming messages.
   */
  onMessage(callback: (message: Message) => void | Promise<void>, options?: QueueOptions): ListenerHandle {
    return this._listenerManager.on('message', async (payload) => {
      await callback(payload);
    }, options);
  }
  
  /**
   * Listen for message acknowledgements (sent, delivered, read).
   */
  onAck(callback: (ack: { messageId: MessageId; ack: number }) => void | Promise<void>, options?: QueueOptions): ListenerHandle {
    return this._listenerManager.on('ack', async (payload) => {
      await callback({ messageId: payload.id, ack: payload.ack });
    }, options);
  }
  
  /**
   * Listen for state changes (CONNECTED, DISCONNECTED, etc.).
   */
  onStateChanged(callback: (state: STATE) => void | Promise<void>, options?: QueueOptions): ListenerHandle {
    return this._listenerManager.on('stateChanged', async (payload) => {
      await callback(payload.state);
    }, options);
  }

  onAnyMessage(callback: (message: Message) => void | Promise<void>, options?: QueueOptions): ListenerHandle {
    return this._listenerManager.on('anyMessage', async (payload) => {
      await callback(payload);
    }, options);
  }

  onMessageDeleted(callback: (payload: { messageId: string; chatId: string; by?: string }) => void | Promise<void>, options?: QueueOptions): ListenerHandle {
    void callback;
    void options;
    return throwUnsupportedListener('onMessageDeleted');
  }

  onLogout(callback: (payload: { reason?: string; timestamp: number }) => void | Promise<void>, options?: QueueOptions): ListenerHandle {
    return this._listenerManager.on('logout', async (payload) => {
      await callback(payload);
    }, options);
  }
  
  // ─────────────────────────────────────────────────────────────────
  // Private helpers
  // ─────────────────────────────────────────────────────────────────
  
  private _bindMethods<T extends object>(
    methods: (client: Client) => T,
    target: Client
  ): void {
    const boundMethods = methods(target);
    for (const [name, method] of Object.entries(boundMethods)) {
      if (typeof method === 'function') {
        (target as any)[name] = method.bind(target);
      }
    }
  }

  private async _runLoadedFinalization(): Promise<void> {
    this.logger.info('client_loaded_waiting_for_sync', { sessionId: this.sessionId });
    await this._waitForSessionLoaded();

    this.registerAllSimpleListenersOnEv();
    this._phoneVersion = await this._capturePhoneVersion();
    this._installRetainedFinalizationHooks();
    this._loaded = true;

    this.logger.info('client_loaded', {
      sessionId: this.sessionId,
      phoneVersion: this._phoneVersion ?? 'unknown',
    });
  }

  private async _waitForSessionLoaded(timeoutMs = 20_000, pollingMs = 50): Promise<void> {
    const startedAt = Date.now();

    while (Date.now() - startedAt <= timeoutMs) {
      const loaded = await this._transport.evaluate(() => {
        const root = globalThis as typeof globalThis & {
          WAPI?: { isSessionLoaded?: () => boolean };
          isSessionLoaded?: () => boolean;
        };

        if (typeof root.WAPI?.isSessionLoaded === 'function') {
          return Boolean(root.WAPI.isSessionLoaded());
        }

        if (typeof root.isSessionLoaded === 'function') {
          return Boolean(root.isSessionLoaded());
        }

        return false;
      }, undefined);

      if (loaded) {
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, pollingMs));
    }

    throw new Error('Timed out waiting for internal session sync to finish');
  }

  private registerAllSimpleListenersOnEv(): void {
    this._listenerManager.autobindAll();
  }

  private async _capturePhoneVersion(): Promise<string | undefined> {
    const phoneVersion = await this._transport.evaluate(() => {
      const root = globalThis as typeof globalThis & {
        WAPI?: {
          getMe?: () => { phone?: { wa_version?: string } } | null;
          getWAVersion?: () => string;
        };
      };

      const me = typeof root.WAPI?.getMe === 'function' ? root.WAPI.getMe() : null;
      return me?.phone?.wa_version ?? root.WAPI?.getWAVersion?.() ?? undefined;
    }, undefined);

    return phoneVersion ?? undefined;
  }

  private _installRetainedFinalizationHooks(): void {
    if (this._retainedHooksInstalled) {
      return;
    }

    this.events.on('session.logout', () => {
      if (!this._logoutCleanupPromise) {
        this._logoutCleanupPromise = this._runLogoutCleanup().finally(() => {
          this._loaded = false;
          this._loadedPromise = undefined;
          this._phoneVersion = undefined;
          this._logoutCleanupPromise = undefined;
        });
      }
    });

    this._retainedHooksInstalled = true;
  }

  private async _runLogoutCleanup(): Promise<void> {
    const { deleteSessionDataOnLogout = false, killClientOnLogout = false } = this._client.config;

    if (!deleteSessionDataOnLogout && !killClientOnLogout) {
      return;
    }

    await this._listenerManager.waitForQueuesToDrain();
    await this._invalidateSessionData();

    if (deleteSessionDataOnLogout) {
      await this._deleteSessionData();
    }

    if (killClientOnLogout) {
      this.logger.warn('client_logout_kill_requested', { sessionId: this.sessionId });
      await this._client.stop('LOGGED_OUT');
    }
  }

  private async _invalidateSessionData(): Promise<void> {
    const sessionDataPath = this._resolveSessionDataFilePath();

    if (!sessionDataPath) {
      return;
    }

    this.logger.info('logout_invalidate_session_data', {
      sessionId: this.sessionId,
      sessionDataPath,
    });

    await fs.writeFile(sessionDataPath, 'LOGGED OUT', 'utf8');
  }

  private async _deleteSessionData(): Promise<void> {
    const sessionDataPath = this._resolveSessionDataFilePath();
    if (sessionDataPath) {
      this.logger.info('logout_delete_session_data', {
        sessionId: this.sessionId,
        sessionDataPath,
      });
      await fs.unlink(sessionDataPath);
    }

    const userDataDir = this._client.config.userDataDir;
    if (userDataDir && existsSync(userDataDir)) {
      this.logger.info('logout_delete_user_data_dir', {
        sessionId: this.sessionId,
        userDataDir,
      });
      await fs.rm(userDataDir, { force: true, recursive: true });
    }
  }

  private _resolveSessionDataFilePath(): string | undefined {
    const configuredPath = this._client.config.sessionDataPath ?? '';
    const sessionFileName = `${this.sessionId}.data.json`;
    const candidate = configuredPath.includes('.data.json')
      ? path.resolve(process.cwd(), configuredPath)
      : path.resolve(process.cwd(), configuredPath, sessionFileName);

    if (existsSync(candidate)) {
      return candidate;
    }

    const mainPath = require?.main?.path ?? process?.mainModule?.path;
    if (!mainPath) {
      return undefined;
    }

    const alternate = configuredPath.includes('.data.json')
      ? path.resolve(mainPath, configuredPath)
      : path.resolve(mainPath, configuredPath, sessionFileName);

    return existsSync(alternate) ? alternate : undefined;
  }
  
  // ─────────────────────────────────────────────────────────────────
  // Method declarations (implemented by bound modules)
  // These are filled in by _bindMethods at construction time.
  // ─────────────────────────────────────────────────────────────────
  
  // Messaging methods
  declare sendText: MessagingMethods['sendText'];
  declare sendImage: MessagingMethods['sendImage'];
  declare sendFile: MessagingMethods['sendFile'];
  declare sendLocation: MessagingMethods['sendLocation'];
  declare sendContact: MessagingMethods['sendContact'];
  declare sendSticker: MessagingMethods['sendSticker'];
  declare reply: MessagingMethods['reply'];
  declare forwardMessages: MessagingMethods['forwardMessages'];
  declare deleteMessage: MessagingMethods['deleteMessage'];
  declare editMessage: MessagingMethods['editMessage'];
  declare react: MessagingMethods['react'];
  declare sendSeen: MessagingMethods['sendSeen'];
  declare getMessageById: MessagingMethods['getMessageById'];
  declare sendFileFromUrl: MediaMethods['sendFileFromUrl'];
  declare decryptMedia: MediaMethods['decryptMedia'];
  declare downloadMedia: MediaMethods['downloadMedia'];
  
  // Group methods
  declare createGroup: GroupMethods['createGroup'];
  declare addParticipant: GroupMethods['addParticipant'];
  declare removeParticipant: GroupMethods['removeParticipant'];
  declare promoteParticipant: GroupMethods['promoteParticipant'];
  declare demoteParticipant: GroupMethods['demoteParticipant'];
  declare setGroupTitle: GroupMethods['setGroupTitle'];
  declare setGroupDescription: GroupMethods['setGroupDescription'];
  declare setGroupIcon: GroupMethods['setGroupIcon'];
  declare getGroupInfo: GroupMethods['getGroupInfo'];
  declare getGroupMembers: GroupMethods['getGroupMembers'];
  declare getGroupInviteLink: GroupMethods['getGroupInviteLink'];
  declare revokeGroupInviteLink: GroupMethods['revokeGroupInviteLink'];
  declare joinGroupViaLink: GroupMethods['joinGroupViaLink'];
  declare leaveGroup: GroupMethods['leaveGroup'];
  
  // Chat methods
  declare getChat: ChatMethods['getChat'];
  declare getAllChats: ChatMethods['getAllChats'];
  declare getChatById: ChatMethods['getChatById'];
  declare deleteChat: ChatMethods['deleteChat'];
  declare clearChat: ChatMethods['clearChat'];
  declare archiveChat: ChatMethods['archiveChat'];
  declare unarchiveChat: ChatMethods['unarchiveChat'];
  declare pinChat: ChatMethods['pinChat'];
  declare unpinChat: ChatMethods['unpinChat'];
  declare muteChat: ChatMethods['muteChat'];
  declare unmuteChat: ChatMethods['unmuteChat'];
  declare markAsUnread: ChatMethods['markAsUnread'];
  declare getAllMessages: ChatMethods['getAllMessages'];
  declare loadEarlierMessages: ChatMethods['loadEarlierMessages'];
  
  // Contact methods
  declare getContact: ContactMethods['getContact'];
  declare getAllContacts: ContactMethods['getAllContacts'];
  declare getContactById: ContactMethods['getContactById'];
  declare checkNumberStatus: ContactMethods['checkNumberStatus'];
  declare getProfilePic: ContactMethods['getProfilePic'];
  declare blockContact: ContactMethods['blockContact'];
  declare unblockContact: ContactMethods['unblockContact'];
  declare getBlockedContacts: ContactMethods['getBlockedContacts'];
  declare getCommonGroups: ContactMethods['getCommonGroups'];
  declare getLastSeen: ContactMethods['getLastSeen'];
  declare isChatOnline: ContactMethods['isChatOnline'];
}
