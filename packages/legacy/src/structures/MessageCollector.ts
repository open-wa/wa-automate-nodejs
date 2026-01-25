import { EventEmitter2 } from 'eventemitter2';
import { Chat, ChatId, Message, MessageId } from '../api/model';
import { SimpleListener } from '../api/model/events';
import { Collector, CollectorOptions } from './Collector';

/**
 * @typedef {CollectorOptions} MessageCollectorOptions
 * @property {number} max The maximum amount of messages to collect
 * @property {number} maxProcessed The maximum amount of messages to process
 */

/**
 * Collects messages on a chat.
 * Will automatically stop if the chat (`'chatDelete'`) is deleted.
 * @extends {Collector}
 */
export class MessageCollector extends Collector {
  chat: ChatId;
    received: number;
    sessionId: string;
    instanceId: string;
    ev: EventEmitter2

  /**
   * @param {string} sessionId The id of the session
   * @param {string} instanceId The id of the current instance of the session (see: client.getInstanceId)
   * @param {ChatId} chatId The chat
   * @param {CollectorFilter} filter The filter to be applied to this collector
   * @param {MessageCollectorOptions} options The options to be applied to this collector
   * @param {EventEmitter2} openWaEventEmitter The EventEmitter2 that fires all open-wa events. In local instances of the library, this is the global `ev` object.
   * @emits MessageCollector#Message
   */
  constructor(sessionId: string, instanceId: string, chat : ChatId, filter: (...args: any[]) => boolean | Promise<boolean>, options : CollectorOptions = {}, openWaEventEmitter : EventEmitter2) {
    super(filter, options);

    this.ev = openWaEventEmitter;
    this.sessionId = sessionId;
    this.instanceId = instanceId;

    /**
     * The chat
     * @type {TextBasedChannel}
     */
    this.chat = chat;

    /**
     * Total number of messages that were received in the chat during message collection
     * @type {number}
     */
    this.received = 0;

    this._handleChatDeletion = this._handleChatDeletion.bind(this);
    this._handleGuildDeletion = this._handleGuildDeletion.bind(this);

    const collectHandler = this.wrapHandler(this.handleCollect)
    const disposeHandler = this.wrapHandler(this.handleDispose)
    const deleteHandler = this.wrapHandler(this._handleChatDeletion)
    const groupRemovalHandler = this.wrapHandler(this._handleGroupRemoval)

    this.incrementMaxListeners();
    this.ev.on(this.eventSignature(SimpleListener.Message), collectHandler);
    this.ev.on(this.eventSignature(SimpleListener.MessageDeleted),disposeHandler);
    this.ev.on(this.eventSignature(SimpleListener.ChatDeleted), deleteHandler);
    this.ev.on(this.eventSignature(SimpleListener.RemovedFromGroup), groupRemovalHandler);
    // this.ev.on(Events.GUILD_DELETE, this._handleGuildDeletion);

    this.once('end', () => {
      this.ev.removeListener(this.eventSignature(SimpleListener.Message), collectHandler);
      this.ev.removeListener(this.eventSignature(SimpleListener.MessageDeleted), disposeHandler);
      this.ev.removeListener(this.eventSignature(SimpleListener.ChatDeleted), deleteHandler);
      this.ev.removeListener(this.eventSignature(SimpleListener.RemovedFromGroup), groupRemovalHandler);
      // this.ev.removeListener(Events.GUILD_DELETE, this._handleGuildDeletion);
      this.decrementMaxListeners();
    });
  }

  /**
   * Handles a message for possible collection.
   * @param {Message} message The message that could be collected
   * @returns {?Snowflake}
   * @private
   */
  collect(message: Message) : MessageId {
    /**
     * Emitted whenever a message is collected.
     * @event MessageCollector#collect
     * @param {Message} message The message that was collected
     */
    if (message.chat.id !== this.chat) return null;
    this.received++;
    return message.id;
  }

  /**
   * Handles a message for possible disposal.
   * @param {Message} message The message that could be disposed of
   * @returns {?Snowflake}
   */
  dispose(message : Message) : MessageId | null {
    /**
     * Emitted whenever a message is disposed of.
     * @event MessageCollector#dispose
     * @param {Message} message The message that was disposed of
     */
    return message.chat.id === this.chat ? message.id : null;
  }

  /**
   * Checks after un/collection to see if the collector is done.
   * @returns {?string}
   * @private
   */
  endReason() : string | null {
    if (this.options.max && this.collected.size >= this.options.max) return 'limit';
    if (this.options.maxProcessed && this.received === this.options.maxProcessed) return 'processedLimit';
    return null;
  }

  /**
   * Handles checking if the chat has been deleted, and if so, stops the collector with the reason 'chatDelete'.
   * @private
   * @param {Chat} chat The chat that was deleted
   * @returns {void}
   */
  _handleChatDeletion(chat : Chat) : void {
    if (chat.id === this.chat) {
      this.stop('chatDelete');
    }
  }

  /**
   * Handles checking if the chat has been deleted, and if so, stops the collector with the reason 'chatDelete'.
   * @private
   * @param {Chat} chat The group chat that the host account was removed from
   * @returns {void}
   */
   _handleGroupRemoval(chat : Chat) : void {
    if (chat.id === this.chat) {
      this.stop('groupRemoval');
    }
  }

  /**
   * 
   * NOT RELATED TO WA
   * 
   * Handles checking if the guild has been deleted, and if so, stops the collector with the reason 'guildDelete'.
   * @private
   * @param {Guild} guild The guild that was deleted
   * @returns {void}
   */
  _handleGuildDeletion(guild : string) : void {
      console.error('This does not relate to WA', guild)
  }

  eventSignature(event: SimpleListener) : string {
      return `${event}.${this.sessionId}.${this.instanceId}`
  }

  wrapHandler (handler: (data:any) => any ) : ({ data }: { data: any; }) => any {
    return ({data}) => handler(data)
  }
}