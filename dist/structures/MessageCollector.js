"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageCollector = void 0;
const __1 = require("..");
const events_1 = require("../api/model/events");
const Collector_1 = require("./Collector");
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
class MessageCollector extends Collector_1.Collector {
    /**
     * @param {string} sessionId The id of the session
     * @param {ChatId} chatId The chat
     * @param {CollectorFilter} filter The filter to be applied to this collector
     * @param {MessageCollectorOptions} options The options to be applied to this collector
     * @emits MessageCollector#Message
     */
    constructor(sessionId, chat, filter, options = {}) {
        super(filter, options);
        this.sessionId = sessionId;
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
        const collectHandler = this.wrapHandler(this.handleCollect);
        const disposeHandler = this.wrapHandler(this.handleDispose);
        const deleteHandler = this.wrapHandler(this._handleChatDeletion);
        const groupRemovalHandler = this.wrapHandler(this._handleGroupRemoval);
        this.incrementMaxListeners();
        __1.ev.on(this.eventSignature(events_1.SimpleListener.Message), collectHandler);
        __1.ev.on(this.eventSignature(events_1.SimpleListener.MessageDeleted), disposeHandler);
        __1.ev.on(this.eventSignature(events_1.SimpleListener.ChatDeleted), deleteHandler);
        __1.ev.on(this.eventSignature(events_1.SimpleListener.RemovedFromGroup), groupRemovalHandler);
        // ev.on(Events.GUILD_DELETE, this._handleGuildDeletion);
        this.once('end', () => {
            __1.ev.removeListener(this.eventSignature(events_1.SimpleListener.Message), collectHandler);
            __1.ev.removeListener(this.eventSignature(events_1.SimpleListener.MessageDeleted), disposeHandler);
            __1.ev.removeListener(this.eventSignature(events_1.SimpleListener.ChatDeleted), deleteHandler);
            __1.ev.removeListener(this.eventSignature(events_1.SimpleListener.RemovedFromGroup), groupRemovalHandler);
            // ev.removeListener(Events.GUILD_DELETE, this._handleGuildDeletion);
            this.decrementMaxListeners();
        });
    }
    /**
     * Handles a message for possible collection.
     * @param {Message} message The message that could be collected
     * @returns {?Snowflake}
     * @private
     */
    collect(message) {
        /**
         * Emitted whenever a message is collected.
         * @event MessageCollector#collect
         * @param {Message} message The message that was collected
         */
        if (message.chat.id !== this.chat)
            return null;
        this.received++;
        return message.id;
    }
    /**
     * Handles a message for possible disposal.
     * @param {Message} message The message that could be disposed of
     * @returns {?Snowflake}
     */
    dispose(message) {
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
    endReason() {
        if (this.options.max && this.collected.size >= this.options.max)
            return 'limit';
        if (this.options.maxProcessed && this.received === this.options.maxProcessed)
            return 'processedLimit';
        return null;
    }
    /**
     * Handles checking if the chat has been deleted, and if so, stops the collector with the reason 'chatDelete'.
     * @private
     * @param {Chat} chat The chat that was deleted
     * @returns {void}
     */
    _handleChatDeletion(chat) {
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
    _handleGroupRemoval(chat) {
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
    _handleGuildDeletion(guild) {
        console.error('This does not relate to WA', guild);
    }
    eventSignature(event) {
        return `${event}.${this.sessionId}`;
    }
    wrapHandler(handler) {
        return ({ data }) => handler(data);
    }
}
exports.MessageCollector = MessageCollector;
