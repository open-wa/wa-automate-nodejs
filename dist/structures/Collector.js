"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
    function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Collector = exports.Collection = void 0;
/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * This code is a copy of the Discord Collector: https://github.com/discordjs/discord.js/blob/stable/src/structures/interfaces/Collector.js
 *
 * Please see: https://discord.js.org/#/docs/main/stable/class/Collector
 */
// import { EventEmitter2 } from 'eventemitter2';
const collection_1 = __importDefault(require("@discordjs/collection"));
const events_1 = require("events");
class Collection extends collection_1.default {
    toJSON() {
        return this.map((e) => (typeof e.toJSON === 'function' ? e.toJSON() : e));
    }
}
exports.Collection = Collection;
/**
 * Abstract class for defining a new Collector.
 * @abstract
 */
class Collector extends events_1.EventEmitter {
    constructor(filter, options = {}) {
        super();
        /**
         * Timeouts set by {@link BaseClient#setTimeout} that are still active
         * @type {Set<Timeout>}
         * @private
         */
        this._timeouts = new Set();
        /**
         * Intervals set by {@link BaseClient#setInterval} that are still active
         * @type {Set<Timeout>}
         * @private
         */
        this._intervals = new Set();
        /**
         * Intervals set by {@link BaseClient#setImmediate} that are still active
         * @type {Set<Immediate>}
         * @private
         */
        this._immediates = new Set();
        /**
         * The filter applied to this collector
         * @type {CollectorFilter}
         */
        this.filter = filter;
        /**
         * The options of this collector
         * @type {CollectorOptions}
         */
        this.options = options;
        /**
         * The items collected by this collector
         * @type {Collection}
         */
        this.collected = new Collection();
        /**
         * Whether this collector has finished collecting
         * @type {boolean}
         */
        this.ended = false;
        /**
         * Timeout for cleanup
         * @type {?Timeout}
         * @private
         */
        this._timeout = null;
        /**
         * Timeout for cleanup due to inactivity
         * @type {?Timeout}
         * @private
         */
        this._idletimeout = null;
        this.handleCollect = this.handleCollect.bind(this);
        this.handleDispose = this.handleDispose.bind(this);
        if (options.time)
            this._timeout = this.setTimeout(() => this.stop('time'), options.time);
        if (options.idle)
            this._idletimeout = this.setTimeout(() => this.stop('idle'), options.idle);
    }
    /**
     * Call this to handle an event as a collectable element. Accepts any event data as parameters.
     * @param {...*} args The arguments emitted by the listener
     * @emits Collector#collect
     */
    handleCollect(...args) {
        return __awaiter(this, void 0, void 0, function* () {
            const collect = this.collect(...args);
            if (collect && (yield this.filter(...args, this.collected))) {
                this.collected.set(collect, args[0]);
                /**
                 * Emitted whenever an element is collected.
                 * @event Collector#collect
                 * @param {...*} args The arguments emitted by the listener
                 */
                this.emit('collect', ...args);
                if (this._idletimeout) {
                    this.clearTimeout(this._idletimeout);
                    this._idletimeout = this.setTimeout(() => this.stop('idle'), this.options.idle);
                }
            }
            this.checkEnd();
        });
    }
    /**
     * Call this to remove an element from the collection. Accepts any event data as parameters.
     * @param {...*} args The arguments emitted by the listener
     * @emits Collector#dispose
     */
    handleDispose(...args) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.options.dispose)
                return;
            const dispose = this.dispose(...args);
            if (!dispose || !(yield this.filter(...args)) || !this.collected.has(dispose))
                return;
            this.collected.delete(dispose);
            /**
             * Emitted whenever an element is disposed of.
             * @event Collector#dispose
             * @param {...*} args The arguments emitted by the listener
             */
            this.emit('dispose', ...args);
            this.checkEnd();
        });
    }
    /**
     * Returns a promise that resolves with the next collected element;
     * rejects with collected elements if the collector finishes without receiving a next element
     * @type {Promise}
     * @readonly
     */
    get next() {
        return new Promise((resolve, reject) => {
            if (this.ended) {
                reject(this.collected);
                return;
            }
            const cleanup = () => {
                this.removeListener('collect', onCollect);
                this.removeListener('end', onEnd);
            };
            const onCollect = item => {
                cleanup();
                resolve(item);
            };
            const onEnd = () => {
                cleanup();
                reject(this.collected); // eslint-disable-line prefer-promise-reject-errors
            };
            this.on('collect', onCollect);
            this.on('end', onEnd);
        });
    }
    /**
     * Stops this collector and emits the `end` event.
     * @param {string} [reason='user'] The reason this collector is ending
     * @emits Collector#end
     */
    stop(reason = 'user') {
        if (this.ended)
            return;
        if (this._timeout) {
            this.clearTimeout(this._timeout);
            this._timeout = null;
        }
        if (this._idletimeout) {
            this.clearTimeout(this._idletimeout);
            this._idletimeout = null;
        }
        this.ended = true;
        /**
         * Emitted when the collector is finished collecting.
         * @event Collector#end
         * @param {Collection} collected The elements collected by the collector
         * @param {string} reason The reason the collector ended
         */
        this.emit('end', this.collected, reason);
    }
    /**
     * Resets the collectors timeout and idle timer.
     * @param {Object} [options] Options
     * @param {number} [options.time] How long to run the collector for in milliseconds
     * @param {number} [options.idle] How long to stop the collector after inactivity in milliseconds
     */
    resetTimer({ time, idle } = {
        time: null,
        idle: null
    }) {
        if (this._timeout) {
            this.clearTimeout(this._timeout);
            this._timeout = this.setTimeout(() => this.stop('time'), time || this.options.time);
        }
        if (this._idletimeout) {
            this.clearTimeout(this._idletimeout);
            this._idletimeout = this.setTimeout(() => this.stop('idle'), idle || this.options.idle);
        }
    }
    /**
     * Checks whether the collector should end, and if so, ends it.
     */
    checkEnd() {
        const reason = this.endReason();
        if (reason)
            this.stop(reason);
    }
    /**
     * Allows collectors to be consumed with for-await-of loops
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of}
     */
    [Symbol.asyncIterator]() {
        return __asyncGenerator(this, arguments, function* _a() {
            const queue = [];
            const onCollect = item => queue.push(item);
            this.on('collect', onCollect);
            try {
                while (queue.length || !this.ended) {
                    if (queue.length) {
                        yield yield __await(queue.shift());
                    }
                    else {
                        // eslint-disable-next-line no-await-in-loop
                        yield __await(new Promise(resolve => {
                            const tick = () => {
                                this.removeListener('collect', tick);
                                this.removeListener('end', tick);
                                return resolve(true);
                            };
                            this.on('collect', tick);
                            this.on('end', tick);
                        }));
                    }
                }
            }
            finally {
                this.removeListener('collect', onCollect);
            }
        });
    }
    /* eslint-disable no-empty-function, valid-jsdoc */
    /**
     * Handles incoming events from the `handleCollect` function. Returns null if the event should not
     * be collected, or returns an object describing the data that should be stored.
     * @see Collector#handleCollect
     * @param {...*} _args Any args the event listener emits
     * @returns the id if the object should be collected, if it shouldnt be collected then it will return null or false.
     * @abstract
     */
    collect(...args) {
        throw new Error("abstractMethod not implemented");
    }
    /**
     * Handles incoming events from the `handleDispose`. Returns null if the event should not
     * be disposed, or returns the key that should be removed.
     * @see Collector#handleDispose
     * @param {...*} args Any args the event listener emits
     * @returns {?*} Key to remove from the collection, if any
     * @abstract
     */
    dispose(...args) {
        throw new Error("abstractMethod not implemented");
    }
    /**
     * The reason this collector has ended or will end with.
     * @returns {?string} Reason to end the collector, if any
     * @abstract
     */
    endReason(...args) {
        throw new Error("abstractMethod not implemented");
    }
    /**
     * Clears a timeout.
     * @param {Timeout} timeout Timeout to cancel
     */
    clearTimeout(timeout) {
        clearTimeout(timeout);
        this._timeouts.delete(timeout);
    }
    /**
     * Sets an interval that will be automatically cancelled if the client is destroyed.
     * @param {Function} fn Function to execute
     * @param {number} delay Time to wait between executions (in milliseconds)
     * @param {...*} args Arguments for the function
     * @returns {Timeout}
     */
    setInterval(fn, delay, ...args) {
        const interval = setInterval(fn, delay, ...args);
        this._intervals.add(interval);
        return interval;
    }
    /**
     * Clears an interval.
     * @param {Timeout} interval Interval to cancel
     */
    clearInterval(interval) {
        clearInterval(interval);
        this._intervals.delete(interval);
    }
    /**
     * Sets an immediate that will be automatically cancelled if the client is destroyed.
     * @param {Function} fn Function to execute
     * @param {...*} args Arguments for the function
     * @returns {Immediate}
     */
    setImmediate(fn, ...args) {
        const immediate = setImmediate(fn, ...args);
        this._immediates.add(immediate);
        return immediate;
    }
    /**
     * Clears an immediate.
     * @param {Immediate} immediate Immediate to cancel
     */
    clearImmediate(immediate) {
        clearImmediate(immediate);
        this._immediates.delete(immediate);
    }
    /**
     * Increments max listeners by one, if they are not zero.
     * @private
     */
    incrementMaxListeners() {
        const maxListeners = this.getMaxListeners();
        if (maxListeners !== 0) {
            this.setMaxListeners(maxListeners + 1);
        }
    }
    /**
     * Decrements max listeners by one, if they are not zero.
     * @private
     */
    decrementMaxListeners() {
        const maxListeners = this.getMaxListeners();
        if (maxListeners !== 0) {
            this.setMaxListeners(maxListeners - 1);
        }
    }
    /**
     * Sets a timeout that will be automatically cancelled if the client is destroyed.
     * @param {Function} fn Function to execute
     * @param {number} delay Time to wait before executing (in milliseconds)
     * @param {...*} args Arguments for the function
     * @returns {Timeout}
     */
    setTimeout(fn, delay, ...args) {
        const timeout = setTimeout(() => {
            fn(...args);
            this._timeouts.delete(timeout);
        }, delay);
        this._timeouts.add(timeout);
        return timeout;
    }
    /**
     * Destroys all assets used by the base client.
     */
    destroy() {
        for (const t of this._timeouts)
            this.clearTimeout(t);
        for (const i of this._intervals)
            this.clearInterval(i);
        for (const i of this._immediates)
            this.clearImmediate(i);
        this._timeouts.clear();
        this._intervals.clear();
        this._immediates.clear();
    }
}
exports.Collector = Collector;
