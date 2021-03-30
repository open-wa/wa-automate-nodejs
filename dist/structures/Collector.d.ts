/// <reference types="node" />
/**
 * This code is a copy of the Discord Collector: https://github.com/discordjs/discord.js/blob/stable/src/structures/interfaces/Collector.js
 *
 * Please see: https://discord.js.org/#/docs/main/stable/class/Collector
 */
import BaseCollection from '@discordjs/collection';
import { EventEmitter } from 'events';
export declare class Collection<K, V> extends BaseCollection<K, V> {
    toJSON(): any[];
}
/**
 * Filter to be applied to the collector.
 * @typedef {Function} CollectorFilter
 * @param {...*} args Any arguments received by the listener
 * @param {Collection} collection The items collected by this collector
 * @returns {boolean|Promise<boolean>}
 */
export declare type CollectorFilter = (args: any[]) => boolean | Promise<boolean>;
/**
 * Options to be applied to the collector.
 */
export interface CollectorOptions {
    /**
     *The maximum amount of items to process
     */
    maxProcessed?: number;
    /**
     *  The maximum amount of items to collect
     */
    max?: number;
    /**
     * Max time to wait for items in milliseconds
     */
    time?: number;
    /**
     * Max time allowed idle
     */
    idle?: number;
    /**
     *  Whether to dispose data when it's deleted
     */
    dispose?: boolean;
}
/**
 * Abstract class for defining a new Collector.
 * @abstract
 */
export declare class Collector extends EventEmitter {
    filter: (...args: any[]) => boolean | Promise<boolean>;
    options: CollectorOptions;
    collected: Collection<string, any>;
    protected _timeout: NodeJS.Timeout;
    protected _idletimeout: NodeJS.Timeout;
    ended: boolean;
    /**
     * Timeouts set by {@link BaseClient#setTimeout} that are still active
     * @type {Set<Timeout>}
     * @private
     */
    protected _timeouts: Set<NodeJS.Timeout>;
    /**
     * Intervals set by {@link BaseClient#setInterval} that are still active
     * @type {Set<Timeout>}
     * @private
     */
    protected _intervals: Set<NodeJS.Timeout>;
    /**
     * Intervals set by {@link BaseClient#setImmediate} that are still active
     * @type {Set<Immediate>}
     * @private
     */
    protected _immediates: Set<NodeJS.Immediate>;
    constructor(filter: CollectorFilter, options?: CollectorOptions);
    /**
     * Call this to handle an event as a collectable element. Accepts any event data as parameters.
     * @param {...*} args The arguments emitted by the listener
     * @emits Collector#collect
     */
    handleCollect(...args: any[]): Promise<void>;
    /**
     * Call this to remove an element from the collection. Accepts any event data as parameters.
     * @param {...*} args The arguments emitted by the listener
     * @emits Collector#dispose
     */
    handleDispose(...args: any[]): Promise<void>;
    /**
     * Returns a promise that resolves with the next collected element;
     * rejects with collected elements if the collector finishes without receiving a next element
     * @type {Promise}
     * @readonly
     */
    get next(): Promise<any>;
    /**
     * Stops this collector and emits the `end` event.
     * @param {string} [reason='user'] The reason this collector is ending
     * @emits Collector#end
     */
    stop(reason?: string): void;
    /**
     * Resets the collectors timeout and idle timer.
     * @param {Object} [options] Options
     * @param {number} [options.time] How long to run the collector for in milliseconds
     * @param {number} [options.idle] How long to stop the collector after inactivity in milliseconds
     */
    resetTimer({ time, idle }?: {
        time: any;
        idle: any;
    }): void;
    /**
     * Checks whether the collector should end, and if so, ends it.
     */
    checkEnd(): void;
    /**
     * Allows collectors to be consumed with for-await-of loops
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of}
     */
    [Symbol.asyncIterator](): any;
    /**
     * Handles incoming events from the `handleCollect` function. Returns null if the event should not
     * be collected, or returns an object describing the data that should be stored.
     * @see Collector#handleCollect
     * @param {...*} _args Any args the event listener emits
     * @returns the id if the object should be collected, if it shouldnt be collected then it will return null or false.
     * @abstract
     */
    collect(...args: any[]): string | null | false;
    /**
     * Handles incoming events from the `handleDispose`. Returns null if the event should not
     * be disposed, or returns the key that should be removed.
     * @see Collector#handleDispose
     * @param {...*} args Any args the event listener emits
     * @returns {?*} Key to remove from the collection, if any
     * @abstract
     */
    dispose(...args: any[]): string;
    /**
     * The reason this collector has ended or will end with.
     * @returns {?string} Reason to end the collector, if any
     * @abstract
     */
    endReason(...args: any[]): string;
    /**
     * Clears a timeout.
     * @param {Timeout} timeout Timeout to cancel
     */
    clearTimeout(timeout: NodeJS.Timeout): void;
    /**
     * Sets an interval that will be automatically cancelled if the client is destroyed.
     * @param {Function} fn Function to execute
     * @param {number} delay Time to wait between executions (in milliseconds)
     * @param {...*} args Arguments for the function
     * @returns {Timeout}
     */
    setInterval(fn: (...args: any[]) => any, delay: number, ...args: any[]): NodeJS.Timeout;
    /**
     * Clears an interval.
     * @param {Timeout} interval Interval to cancel
     */
    clearInterval(interval: NodeJS.Timeout): void;
    /**
     * Sets an immediate that will be automatically cancelled if the client is destroyed.
     * @param {Function} fn Function to execute
     * @param {...*} args Arguments for the function
     * @returns {Immediate}
     */
    setImmediate(fn: (...args: any[]) => any, ...args: any[]): NodeJS.Immediate;
    /**
     * Clears an immediate.
     * @param {Immediate} immediate Immediate to cancel
     */
    clearImmediate(immediate: NodeJS.Immediate): void;
    /**
     * Increments max listeners by one, if they are not zero.
     * @private
     */
    protected incrementMaxListeners(): void;
    /**
     * Decrements max listeners by one, if they are not zero.
     * @private
     */
    protected decrementMaxListeners(): void;
    /**
     * Sets a timeout that will be automatically cancelled if the client is destroyed.
     * @param {Function} fn Function to execute
     * @param {number} delay Time to wait before executing (in milliseconds)
     * @param {...*} args Arguments for the function
     * @returns {Timeout}
     */
    setTimeout(fn: (...args: any[]) => any, delay: number, ...args: any[]): NodeJS.Timeout;
    /**
     * Destroys all assets used by the base client.
     */
    destroy(): void;
}
