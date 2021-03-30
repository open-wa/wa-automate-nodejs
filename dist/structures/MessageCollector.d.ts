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
export declare class MessageCollector extends Collector {
    chat: ChatId;
    received: number;
    sessionId: string;
    /**
     * @param {string} sessionId The id of the session
     * @param {ChatId} chatId The chat
     * @param {CollectorFilter} filter The filter to be applied to this collector
     * @param {MessageCollectorOptions} options The options to be applied to this collector
     * @emits MessageCollector#Message
     */
    constructor(sessionId: string, chat: ChatId, filter: (args: any[]) => boolean | Promise<boolean>, options?: CollectorOptions);
    /**
     * Handles a message for possible collection.
     * @param {Message} message The message that could be collected
     * @returns {?Snowflake}
     * @private
     */
    collect(message: Message): MessageId;
    /**
     * Handles a message for possible disposal.
     * @param {Message} message The message that could be disposed of
     * @returns {?Snowflake}
     */
    dispose(message: Message): MessageId | null;
    /**
     * Checks after un/collection to see if the collector is done.
     * @returns {?string}
     * @private
     */
    endReason(): string | null;
    /**
     * Handles checking if the chat has been deleted, and if so, stops the collector with the reason 'chatDelete'.
     * @private
     * @param {Chat} chat The chat that was deleted
     * @returns {void}
     */
    _handleChatDeletion(chat: Chat): void;
    /**
     * Handles checking if the chat has been deleted, and if so, stops the collector with the reason 'chatDelete'.
     * @private
     * @param {Chat} chat The group chat that the host account was removed from
     * @returns {void}
     */
    _handleGroupRemoval(chat: Chat): void;
    /**
     *
     * NOT RELATED TO WA
     *
     * Handles checking if the guild has been deleted, and if so, stops the collector with the reason 'guildDelete'.
     * @private
     * @param {Guild} guild The guild that was deleted
     * @returns {void}
     */
    _handleGuildDeletion(guild: string): void;
    eventSignature(event: SimpleListener): string;
    wrapHandler(handler: (data: any) => any): ({ data }: {
        data: any;
    }) => any;
}
