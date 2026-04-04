/**
 * Discord.js-style Collector implementation for open-wa.
 *
 * Based on Discord.js Collector pattern:
 * https://github.com/discordjs/discord.js/blob/stable/src/structures/interfaces/Collector.js
 *
 * @packageDocumentation
 */
import { EventEmitter } from 'events';

/**
 * Extended Collection with JSON serialization support.
 */
export class Collection<K, V> extends Map<K, V> {
  toJSON(): [K, V][] {
    return Array.from(this.entries());
  }

  map<T>(fn: (value: V, key: K, collection: this) => T): T[] {
    const result: T[] = [];
    for (const [key, value] of this.entries()) {
      result.push(fn(value, key, this));
    }
    return result;
  }
}

/**
 * Filter function applied to the collector.
 * @param args - Any arguments received by the listener
 * @param collection - The items collected by this collector
 * @returns Whether the item passes the filter
 */
export type CollectorFilter<T extends unknown[]> = (
  ...args: [...T, Collection<string, T[0]>]
) => boolean | Promise<boolean>;

/**
 * Options for configuring a Collector.
 */
export interface CollectorOptions {
  /**
   * The maximum amount of items to process
   */
  maxProcessed?: number;
  /**
   * The maximum amount of items to collect
   */
  max?: number;
  /**
   * Max time to wait for items in milliseconds
   */
  time?: number;
  /**
   * Max time allowed idle in milliseconds
   */
  idle?: number;
  /**
   * Whether to dispose data when it's deleted
   */
  dispose?: boolean;
}

/**
 * Options for awaitMessages helper methods.
 */
export interface AwaitMessagesOptions extends CollectorOptions {
  /**
   * An array of "reasons" that would result in the awaitMessages command to throw an error.
   */
  errors?: string[];
}

/**
 * Collector event types
 */
export interface CollectorEvents<T> {
  collect: [item: T];
  dispose: [item: T];
  end: [collected: Collection<string, T>, reason: string];
}

/**
 * Abstract base class for defining collectors.
 *
 * Collectors accumulate items over time based on a filter function,
 * with configurable limits and timeouts.
 *
 * @example
 * ```typescript
 * class MyCollector extends Collector<Message> {
 *   collect(message: Message): string | null {
 *     return message.id;
 *   }
 *
 *   dispose(message: Message): string | null {
 *     return message.id;
 *   }
 *
 *   endReason(): string | null {
 *     if (this.collected.size >= 10) return 'limit';
 *     return null;
 *   }
 * }
 * ```
 */
export abstract class Collector<T = unknown> extends EventEmitter {
  /**
   * The filter applied to this collector
   */
  public filter: (...args: [T, Collection<string, T>]) => boolean | Promise<boolean>;

  /**
   * The options of this collector
   */
  public options: CollectorOptions;

  /**
   * The items collected by this collector
   */
  public collected: Collection<string, T>;

  /**
   * Whether this collector has finished collecting
   */
  public ended: boolean;

  /**
   * Timeout for cleanup
   */
  protected _timeout: NodeJS.Timeout | null;

  /**
   * Timeout for cleanup due to inactivity
   */
  protected _idletimeout: NodeJS.Timeout | null;

  /**
   * Timeouts set that are still active
   */
  protected _timeouts: Set<NodeJS.Timeout> = new Set();

  /**
   * Intervals set that are still active
   */
  protected _intervals: Set<NodeJS.Timeout> = new Set();

  /**
   * Immediates set that are still active
   */
  protected _immediates: Set<NodeJS.Immediate> = new Set();

  constructor(
    filter: CollectorFilter<[T]>,
    options: CollectorOptions = {}
  ) {
    super();

    this.filter = filter;
    this.options = options;
    this.collected = new Collection();
    this.ended = false;
    this._timeout = null;
    this._idletimeout = null;

    this.handleCollect = this.handleCollect.bind(this);
    this.handleDispose = this.handleDispose.bind(this);

    if (options.time) {
      this._timeout = this.setTimeout(() => this.stop('time'), options.time);
    }
    if (options.idle) {
      this._idletimeout = this.setTimeout(() => this.stop('idle'), options.idle);
    }
  }

  /**
   * Call this to handle an event as a collectable element.
   * @param args - The arguments emitted by the listener
   * @emits Collector#collect
   */
  async handleCollect(...args: [T]): Promise<void> {
    const collect = this.collect(...args);
    if (collect && (await this.filter(...args, this.collected))) {
      this.collected.set(collect, args[0]);
      this.emit('collect', ...args);

      if (this._idletimeout) {
        this.clearTimeout(this._idletimeout);
        this._idletimeout = this.setTimeout(() => this.stop('idle'), this.options.idle!);
      }
    }
    this.checkEnd();
  }

  /**
   * Call this to remove an element from the collection.
   * @param args - The arguments emitted by the listener
   * @emits Collector#dispose
   */
  async handleDispose(...args: [T]): Promise<void> {
    if (!this.options.dispose) return;

    const dispose = this.dispose(...args);
    if (!dispose || !(await this.filter(...args, this.collected)) || !this.collected.has(dispose)) {
      return;
    }

    this.collected.delete(dispose);
    this.emit('dispose', ...args);
    this.checkEnd();
  }

  /**
   * Returns a promise that resolves with the next collected element;
   * rejects with collected elements if the collector finishes without receiving a next element
   */
  get next(): Promise<T> {
    return new Promise((resolve, reject) => {
      if (this.ended) {
        reject(this.collected);
        return;
      }

      const cleanup = (): void => {
        this.removeListener('collect', onCollect);
        this.removeListener('end', onEnd);
      };

      const onCollect = (item: T): void => {
        cleanup();
        resolve(item);
      };

      const onEnd = (): void => {
        cleanup();
        reject(this.collected);
      };

      this.on('collect', onCollect);
      this.on('end', onEnd);
    });
  }

  /**
   * Stops this collector and emits the `end` event.
   * @param reason - The reason this collector is ending
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

    this.emit('end', this.collected, reason);
  }

  /**
   * Resets the collector's timeout and idle timer.
   * @param options - Timer options
   */
  resetTimer(options: { time?: number | null; idle?: number | null } = {}): void {
    const { time = null, idle = null } = options;

    if (this._timeout) {
      this.clearTimeout(this._timeout);
      this._timeout = this.setTimeout(() => this.stop('time'), time ?? this.options.time!);
    }
    if (this._idletimeout) {
      this.clearTimeout(this._idletimeout);
      this._idletimeout = this.setTimeout(() => this.stop('idle'), idle ?? this.options.idle!);
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
   */
  async *[Symbol.asyncIterator](): AsyncGenerator<T, void, unknown> {
    const queue: T[] = [];
    const onCollect = (item: T): number => queue.push(item);
    this.on('collect', onCollect);

    try {
      while (queue.length || !this.ended) {
        if (queue.length) {
          yield queue.shift()!;
        } else {
          await new Promise<boolean>((resolve) => {
            const tick = (): void => {
              this.removeListener('collect', tick);
              this.removeListener('end', tick);
              resolve(true);
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

  /**
   * Handles incoming events from the `handleCollect` function.
   * Returns null if the event should not be collected, or returns the key to store.
   * @param args - Any args the event listener emits
   * @returns The id if the object should be collected, null or false otherwise
   * @abstract
   */
  abstract collect(...args: [T]): string | null | false;

  /**
   * Handles incoming events from the `handleDispose`.
   * Returns null if the event should not be disposed, or returns the key to remove.
   * @param args - Any args the event listener emits
   * @returns Key to remove from the collection, if any
   * @abstract
   */
  abstract dispose(...args: [T]): string | null;

  /**
   * The reason this collector has ended or will end with.
   * @returns Reason to end the collector, if any
   * @abstract
   */
  abstract endReason(): string | null;

  /**
   * Clears a timeout.
   * @param timeout - Timeout to cancel
   */
  clearTimeout(timeout: NodeJS.Timeout): void {
    clearTimeout(timeout);
    this._timeouts.delete(timeout);
  }

  /**
   * Sets an interval that will be automatically cancelled when destroyed.
   * @param fn - Function to execute
   * @param delay - Time to wait between executions (in milliseconds)
   * @param args - Arguments for the function
   * @returns The interval handle
   */
  setInterval(fn: (...args: unknown[]) => void, delay: number, ...args: unknown[]): NodeJS.Timeout {
    const interval = setInterval(fn, delay, ...args);
    this._intervals.add(interval);
    return interval;
  }

  /**
   * Clears an interval.
   * @param interval - Interval to cancel
   */
  clearInterval(interval: NodeJS.Timeout): void {
    clearInterval(interval);
    this._intervals.delete(interval);
  }

  /**
   * Sets an immediate that will be automatically cancelled when destroyed.
   * @param fn - Function to execute
   * @param args - Arguments for the function
   * @returns The immediate handle
   */
  setImmediate(fn: (...args: unknown[]) => void, ...args: unknown[]): NodeJS.Immediate {
    const immediate = setImmediate(fn, ...args);
    this._immediates.add(immediate);
    return immediate;
  }

  /**
   * Clears an immediate.
   * @param immediate - Immediate to cancel
   */
  clearImmediate(immediate: NodeJS.Immediate): void {
    clearImmediate(immediate);
    this._immediates.delete(immediate);
  }

  /**
   * Increments max listeners by one, if they are not zero.
   */
  protected incrementMaxListeners(): void {
    const maxListeners = this.getMaxListeners();
    if (maxListeners !== 0) {
      this.setMaxListeners(maxListeners + 1);
    }
  }

  /**
   * Decrements max listeners by one, if they are not zero.
   */
  protected decrementMaxListeners(): void {
    const maxListeners = this.getMaxListeners();
    if (maxListeners !== 0) {
      this.setMaxListeners(maxListeners - 1);
    }
  }

  /**
   * Sets a timeout that will be automatically cancelled when destroyed.
   * @param fn - Function to execute
   * @param delay - Time to wait before executing (in milliseconds)
   * @param args - Arguments for the function
   * @returns The timeout handle
   */
  setTimeout(fn: (...args: unknown[]) => void, delay: number, ...args: unknown[]): NodeJS.Timeout {
    const timeout = setTimeout(() => {
      fn(...args);
      this._timeouts.delete(timeout);
    }, delay);
    this._timeouts.add(timeout);
    return timeout;
  }

  /**
   * Destroys all assets used by the collector.
   */
  destroy(): void {
    for (const t of this._timeouts) this.clearTimeout(t);
    for (const i of this._intervals) this.clearInterval(i);
    for (const i of this._immediates) this.clearImmediate(i);
    this._timeouts.clear();
    this._intervals.clear();
    this._immediates.clear();
  }
}
