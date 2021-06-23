/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * This code is a copy of the Discord Collector: https://github.com/discordjs/discord.js/blob/stable/src/structures/interfaces/Collector.js
 * 
 * Please see: https://discord.js.org/#/docs/main/stable/class/Collector
 */
// import { EventEmitter2 } from 'eventemitter2';
import BaseCollection from '@discordjs/collection';
import { EventEmitter } from 'events';

export class Collection<K, V> extends BaseCollection<K, V> {
  toJSON(): any[] {
    return this.map((e: any) => (typeof e.toJSON === 'function' ? e.toJSON() : e));
  }
}

/**
 * Filter to be applied to the collector.
 * @typedef {Function} CollectorFilter
 * @param {...*} args Any arguments received by the listener
 * @param {Collection} collection The items collected by this collector
 * @returns {boolean|Promise<boolean>}
 */
export type CollectorFilter<T extends any[]> = (...args: T) => boolean | Promise<boolean>

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
  dispose?: boolean
}

export interface AwaitMessagesOptions extends CollectorOptions {
  /**
   * An array of "reasons" that would result in the awaitMessages command to throw an error.
   */
  errors?: string[];
}

/**
 * Abstract class for defining a new Collector.
 * @abstract
 */
export class Collector extends EventEmitter {
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
  protected _timeouts: Set<NodeJS.Timeout> = new Set();

  /**
   * Intervals set by {@link BaseClient#setInterval} that are still active
   * @type {Set<Timeout>}
   * @private
   */
  protected _intervals: Set<NodeJS.Timeout> = new Set();

  /**
   * Intervals set by {@link BaseClient#setImmediate} that are still active
   * @type {Set<Immediate>}
   * @private
   */
  protected _immediates: Set<NodeJS.Immediate> = new Set();


  constructor(filter: CollectorFilter, options: CollectorOptions = {}) {
    super();

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

    if (options.time) this._timeout = this.setTimeout(() => this.stop('time'), options.time);
    if (options.idle) this._idletimeout = this.setTimeout(() => this.stop('idle'), options.idle);
  }

  /**
   * Call this to handle an event as a collectable element. Accepts any event data as parameters.
   * @param {...*} args The arguments emitted by the listener
   * @emits Collector#collect
   */
  async handleCollect(...args: any[]): Promise<void> {
    const collect = this.collect(...args);
    if (collect && (await this.filter(...args, this.collected))) {
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
  }

  /**
   * Call this to remove an element from the collection. Accepts any event data as parameters.
   * @param {...*} args The arguments emitted by the listener
   * @emits Collector#dispose
   */
  async handleDispose(...args: any[]): Promise<void> {
    if (!this.options.dispose) return;

    const dispose = this.dispose(...args);
    if (!dispose || !(await this.filter(...args)) || !this.collected.has(dispose)) return;
    this.collected.delete(dispose);

    /**
     * Emitted whenever an element is disposed of.
     * @event Collector#dispose
     * @param {...*} args The arguments emitted by the listener
     */
    this.emit('dispose', ...args);
    this.checkEnd();
  }

  /**
   * Returns a promise that resolves with the next collected element;
   * rejects with collected elements if the collector finishes without receiving a next element
   * @type {Promise}
   * @readonly
   */
  get next(): Promise<any> {
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
  stop(reason = 'user'): void {
    if (this.ended) return;

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
  }): void {
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
  checkEnd(): void {
    const reason = this.endReason();
    if (reason) this.stop(reason);
  }

  /**
   * Allows collectors to be consumed with for-await-of loops
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of}
   */
  async *[Symbol.asyncIterator](): any {
    const queue = [];
    const onCollect = item => queue.push(item);
    this.on('collect', onCollect);

    try {
      while (queue.length || !this.ended) {
        if (queue.length) {
          yield queue.shift();
        } else {
          // eslint-disable-next-line no-await-in-loop
          await new Promise(resolve => {
            const tick = () => {
              this.removeListener('collect', tick);
              this.removeListener('end', tick);
              return resolve(true);
            };
            this.on('collect', tick);
            this.on('end', tick);
          });
        }
      }
    } finally {
      this.removeListener('collect', onCollect);
    }
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
  collect(...args: any[]): string | null | false {
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
  dispose(...args: any[]): string {
    throw new Error("abstractMethod not implemented");
  }

  /**
   * The reason this collector has ended or will end with.
   * @returns {?string} Reason to end the collector, if any
   * @abstract
   */
  endReason(...args: any[]): string {
    throw new Error("abstractMethod not implemented");
  }


  /**
   * Clears a timeout.
   * @param {Timeout} timeout Timeout to cancel
   */
  clearTimeout(timeout: NodeJS.Timeout): void {
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
  setInterval(fn: (...args: any[]) => any, delay: number, ...args: any[]): NodeJS.Timeout {
    const interval = setInterval(fn, delay, ...args);
    this._intervals.add(interval);
    return interval;
  }

  /**
   * Clears an interval.
   * @param {Timeout} interval Interval to cancel
   */
  clearInterval(interval: NodeJS.Timeout): void {
    clearInterval(interval);
    this._intervals.delete(interval);
  }

  /**
   * Sets an immediate that will be automatically cancelled if the client is destroyed.
   * @param {Function} fn Function to execute
   * @param {...*} args Arguments for the function
   * @returns {Immediate}
   */
  setImmediate(fn: (...args: any[]) => any, ...args: any[]): NodeJS.Immediate {
    const immediate = setImmediate(fn, ...args);
    this._immediates.add(immediate);
    return immediate;
  }

  /**
   * Clears an immediate.
   * @param {Immediate} immediate Immediate to cancel
   */
  clearImmediate(immediate: NodeJS.Immediate): void {
    clearImmediate(immediate);
    this._immediates.delete(immediate);
  }

  /**
   * Increments max listeners by one, if they are not zero.
   * @private
   */
  protected incrementMaxListeners(): void {
    const maxListeners = this.getMaxListeners();
    if (maxListeners !== 0) {
      this.setMaxListeners(maxListeners + 1);
    }
  }

  /**
   * Decrements max listeners by one, if they are not zero.
   * @private
   */
  protected decrementMaxListeners(): void {
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
  setTimeout(fn: (...args: any[]) => any, delay: number, ...args: any[]): NodeJS.Timeout {
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
  destroy(): void {
    for (const t of this._timeouts) this.clearTimeout(t);
    for (const i of this._intervals) this.clearInterval(i);
    for (const i of this._immediates) this.clearImmediate(i);
    this._timeouts.clear();
    this._intervals.clear();
    this._immediates.clear();
  }


  /* eslint-enable no-empty-function, valid-jsdoc */
}