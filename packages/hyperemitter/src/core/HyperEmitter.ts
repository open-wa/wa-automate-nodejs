import { EventEmitter as NodeEmitter } from 'node:events';
import { RadixTree } from '../routing/RadixTree';
import { ListenerOptions, HyperEmitterOptions, EventMap } from '../types';
import {
  ListenerRecord,
  attachAbort,
  cleanupAbort,
  createRecord
} from '../utils/listener';
import { createLogger, Logger } from '@open-wa/logger';
import type { LogContext } from '@open-wa/logger';

type AnyFn = (...args: any[]) => any;

/**
 * HyperEmitter: high-performance hybrid emitter with MQTT-style wildcards.
 */
export class HyperEmitter<TMap extends EventMap = EventMap> {
  private readonly delimiter: string;
  private readonly captureRejections: boolean;
  private readonly onError?: (err: unknown) => void;
  private readonly finalizer?: FinalizationRegistry<unknown>;
  private readonly logger?: Logger;
  private readonly debugEnabled: boolean;
  private readonly baseLogContext: LogContext;

  private exactListeners: Map<string, ListenerRecord<AnyFn>[]>;
  private wildcardTree: RadixTree<ListenerRecord<AnyFn>>;
  private wildcardIndex: Map<ListenerRecord<AnyFn>, string>;
  private hasWildcards = false;

  constructor(options: HyperEmitterOptions = {}) {
    this.delimiter = options.delimiter ?? '.';
    this.captureRejections = options.captureRejections ?? false;
    this.onError = options.onError;
    this.debugEnabled = !!options.debug;
    this.baseLogContext = {
      component: 'hyperemitter',
      ...options.loggerContext
    };
    this.logger =
      options.logger?.withContext?.(this.baseLogContext) ??
      createLogger({ component: 'hyperemitter', ...options.loggerContext });

    // WeakRef support
    if (typeof FinalizationRegistry !== 'undefined') {
      this.finalizer = new FinalizationRegistry((token: unknown) => {
        if (token && typeof token === 'object') {
          // token is used only for unregister; actual removal is handled during emit via deref
        }
      });
    }

    this.exactListeners = new Map();
    this.wildcardTree = new RadixTree<ListenerRecord<AnyFn>>(this.delimiter);
    this.wildcardIndex = new Map();
  }

  on<K extends keyof TMap & string>(
    event: K,
    listener: TMap[K],
    options: ListenerOptions = {}
  ): this {
    const record = createRecord(listener as AnyFn, options, this.finalizer as any);
    this.add(event, record);
    return this;
  }

  once<K extends keyof TMap & string>(
    event: K,
    listener: TMap[K],
    options: ListenerOptions = {}
  ): this {
    const record = createRecord(listener as AnyFn, options, this.finalizer as any);
    record.once = true;
    this.add(event, record);
    return this;
  }

  off<K extends keyof TMap & string>(event: K, listener: TMap[K]): this {
    const list = this.exactListeners.get(event);
    if (list) {
      const idx = list.findIndex(l => l.fn === listener);
      if (idx !== -1) {
        cleanupAbort(list[idx]);
        list.splice(idx, 1);
      }
      if (list.length === 0) this.exactListeners.delete(event);
    }
    if (this.hasWildcards && (event.includes('+') || event.includes('#'))) {
      this.removeWildcard(event, listener as AnyFn);
    }
    return this;
  }

  emit<K extends keyof TMap & string>(
    event: K,
    ...args: Parameters<TMap[K]>
  ): boolean {
    const exact = this.exactListeners.get(event as string);
    const wildcard = this.hasWildcards
      ? this.wildcardTree.match(event as string)
      : undefined;

    const called = this.dispatch(exact, args) | this.dispatch(wildcard, args);
    return Boolean(called);
  }

  listenerCount(event?: keyof TMap & string): number {
    if (!event) {
      let total = 0;
      for (const arr of this.exactListeners.values()) total += arr.length;
      return total;
    }
    return this.exactListeners.get(event)?.length ?? 0;
  }

  removeAllListeners(event?: keyof TMap & string): this {
    if (!event) {
      for (const arr of this.exactListeners.values()) {
        arr.forEach(cleanupAbort);
      }
      this.exactListeners.clear();
      this.wildcardTree = new RadixTree<ListenerRecord<AnyFn>>(this.delimiter);
      this.hasWildcards = false;
      this.wildcardIndex.clear();
      return this;
    }

    const list = this.exactListeners.get(event);
    if (list) {
      list.forEach(cleanupAbort);
      this.exactListeners.delete(event);
    }
    // Wildcards: best effort clear by rebuilding tree
    if (this.hasWildcards && (event.includes('+') || event.includes('#'))) {
      for (const [record, pattern] of this.wildcardIndex.entries()) {
        if (pattern === event) {
          this.wildcardTree.remove(pattern, record);
          this.wildcardIndex.delete(record);
        }
      }
    }
    return this;
  }

  /**
   * Bridge from a Node EventEmitter: forward Node events into this emitter.
   */
  fromNodeEmitter(emitter: NodeEmitter, event: string): () => void {
    const handler = (...args: any[]) => {
      // @ts-expect-error safe runtime emit
      this.emit(event as any, ...args);
    };
    emitter.on(event, handler);
    return () => emitter.off(event, handler);
  }

  /**
   * Bridge to a Node EventEmitter: emit HyperEmitter events on a provided Node emitter.
   */
  toNodeEmitter(target: NodeEmitter): () => void {
    const forwarder = (event: string, args: any[]) => target.emit(event, ...args);
    // naive bridge: wrap emit; caller can replace as needed
    const original = (this as any).emit;
    (this as any).emit = (ev: string, ...args: any[]) => {
      forwarder(ev, args);
      return original.call(this, ev, ...args);
    };
    return () => {
      (this as any).emit = original;
    };
  }

  /**
   * Attach a handler to an EventTarget and re-emit through HyperEmitter.
   */
  onEventTarget(target: EventTarget, type: string, eventName: keyof TMap & string) {
    const handler = (ev: Event) => {
      // @ts-expect-error forwarding payload
      this.emit(eventName, ev);
    };
    target.addEventListener(type, handler);
    return () => target.removeEventListener(type, handler);
  }

  private add(event: string, record: ListenerRecord<AnyFn>) {
    // Wildcard patterns contain '+' or '#'
    const isWildcard = event.includes('+') || event.includes('#');
    if (isWildcard) {
      this.hasWildcards = true;
      this.wildcardTree.insert(event, record);
      this.wildcardIndex.set(record, event);
    } else {
      const list = this.exactListeners.get(event);
      if (list) {
        list.push(record);
      } else {
        this.exactListeners.set(event, [record]);
      }
    }

    attachAbort(record, () => this.off(event as any, record.fn as any));
    this.logDebug('listener_registered', {
      event,
      once: record.once,
      wildcard: isWildcard
    });
  }

  private dispatch(list: ListenerRecord<AnyFn>[] | undefined, args: any[]): number {
    if (!list || list.length === 0) return 0;
    // Copy-on-write to avoid mutation during emit.
    const snapshot = list.slice();
    let called = 0;
    for (const record of snapshot) {
      // WeakRef cleanup: if target gone, remove and skip.
      if (record.weakRef && !record.weakRef.deref()) {
        this.offListener(record);
        continue;
      }

      called++;
      const result = this.invoke(record, args);
      if (record.once) {
        this.offListener(record);
      }
      if (result && typeof result.then === 'function') {
        result.catch((err: unknown) => this.handleRejection(record, err));
      }
    }
    return called;
  }

  private invoke(record: ListenerRecord<AnyFn>, args: any[]) {
    switch (args.length) {
      case 0:
        return record.fn();
      case 1:
        return record.fn(args[0]);
      case 2:
        return record.fn(args[0], args[1]);
      case 3:
        return record.fn(args[0], args[1], args[2]);
      default:
        return record.fn(...args);
    }
  }

  private offListener(record: ListenerRecord<AnyFn>) {
    // Exact listeners
    for (const [event, arr] of this.exactListeners.entries()) {
      const idx = arr.indexOf(record);
      if (idx !== -1) {
        cleanupAbort(arr[idx]);
        arr.splice(idx, 1);
        if (arr.length === 0) this.exactListeners.delete(event);
        return;
      }
    }
    // Wildcard listeners (pattern tracked)
    const pattern = this.wildcardIndex.get(record);
    if (pattern) {
      this.wildcardTree.remove(pattern, record);
      this.wildcardIndex.delete(record);
    }
  }

  private handleRejection(record: ListenerRecord<AnyFn>, err: unknown) {
    const shouldCapture =
      record.captureRejections !== undefined
        ? record.captureRejections
        : this.captureRejections;

    if (!shouldCapture) {
      queueMicrotask(() => {
        throw err;
      });
      return;
    }

    if (this.onError) {
      try {
        this.onError(err);
      } catch {
        // swallow secondary errors
      }
      return;
    }

    // Fallback logging
    this.logger?.error('listener_rejection', {
      error: err as any,
      ...this.baseLogContext
    });
  }

  private removeWildcard(event: string, listener: AnyFn) {
    // Slow path: tree removal requires record reference; search recorded patterns.
    for (const [record, pattern] of this.wildcardIndex.entries()) {
      if (pattern === event && record.fn === listener) {
        this.wildcardTree.remove(pattern, record);
        this.wildcardIndex.delete(record);
        cleanupAbort(record);
        break;
      }
    }
  }

  private logDebug(message: string, meta?: LogContext) {
    if (!this.debugEnabled) return;
    this.logger?.debug(message, { ...this.baseLogContext, ...meta });
  }
}
