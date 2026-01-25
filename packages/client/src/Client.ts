import type { HyperEmitter } from '@open-wa/hyperemitter';
import type { Logger } from '@open-wa/logger';
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
  GroupId,
  MessageId,
  Message,
  Chat,
  Contact,
  GroupMetadata,
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

import { messagingMethods, type MessagingMethods } from './methods/messaging.js';
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
 * import { createClient, Transport } from '@open-wa/core';
 * import { Client } from '@open-wa/client';
 * 
 * const openwa = await createClient({ driver, plugins: [] });
 * const transport = new Transport({ driver, events: openwa.events, logger: openwa.logger });
 * 
 * const client = new Client({ client: openwa, transport });
 * await client.start();
 * 
 * // Send a message
 * await client.sendText('123456789@c.us', 'Hello!');
 * 
 * // Listen to messages
 * client.onMessage(msg => console.log(msg));
 * ```
 */
export class Client implements MessagingMethods, GroupMethods, ChatMethods, ContactMethods {
  private readonly _client: OpenWAClient;
  private readonly _transport: Transport;
  
  constructor(config: ClientConfig) {
    this._client = config.client;
    this._transport = config.transport;
    
    // Bind method modules
    this._bindMethods(messagingMethods, this);
    this._bindMethods(groupMethods, this);
    this._bindMethods(chatMethods, this);
    this._bindMethods(contactMethods, this);
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
  onMessage(callback: (message: Message) => void): () => void {
    const handler = (payload: { message: Message }) => callback(payload.message);
    this.events.on('message.received', handler);
    return () => this.events.off('message.received', handler);
  }
  
  /**
   * Listen for message acknowledgements (sent, delivered, read).
   */
  onAck(callback: (ack: { messageId: MessageId; ack: number }) => void): () => void {
    const handler = (payload: { messageId: MessageId; ack: number }) => callback(payload);
    this.events.on('message.ack', handler);
    return () => this.events.off('message.ack', handler);
  }
  
  /**
   * Listen for state changes (CONNECTED, DISCONNECTED, etc.).
   */
  onStateChanged(callback: (state: STATE) => void): () => void {
    const handler = (payload: { state: STATE }) => callback(payload.state);
    this.events.on('session.state_changed', handler);
    return () => this.events.off('session.state_changed', handler);
  }
  
  // ─────────────────────────────────────────────────────────────────
  // Private helpers
  // ─────────────────────────────────────────────────────────────────
  
  private _bindMethods<T extends Record<string, Function>>(
    methods: (client: Client) => T,
    target: Client
  ): void {
    const boundMethods = methods(target);
    for (const [name, method] of Object.entries(boundMethods)) {
      (target as any)[name] = method.bind(target);
    }
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
