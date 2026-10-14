import type { EventEmitter as NodeEmitter } from 'node:events';
import { Cause, Effect, Exit, Fiber, PubSub, Scope, Stream } from 'effect';
import { RadixTree } from '../routing/RadixTree';
import { patternsIntersect } from '../routing/patternsIntersect';
import { EmissionHub, type PubSubOptions } from './EmissionHub';
import type { AnyEventListener, EventListener, ListenerOptions, HyperEmitterOptions, HyperEmission } from '../types/index';
import {
  ListenerRecord,
  attachAbort,
  cleanupAbort,
  createRecord
} from '../utils/listener';
import { createLogger, Logger } from '@open-wa/logger';
import type { LogContext } from '@open-wa/logger';

type AnyFn = (...args: any[]) => any;
const emitted = Effect.succeed(true);
const noListeners = Effect.succeed(false);

export class HyperEmitter<TMap extends object = Record<string, unknown>> {
  private readonly delimiter: string;
  private readonly captureRejections: boolean;
  private readonly wildcardStyle: 'mqtt' | 'eventemitter';
  private readonly onError?: (err: unknown) => void;
  private readonly finalizer?: FinalizationRegistry<unknown>;
  private readonly logger?: Logger;
  private readonly debugEnabled: boolean;
  private readonly baseLogContext: LogContext;

  private exactListeners: Map<string, ListenerRecord<AnyFn>[]>;
  private wildcardTree: RadixTree<ListenerRecord<AnyFn>>;
  private wildcardIndex: Map<ListenerRecord<AnyFn>, string>;
  private hasWildcards = false;
  private anyListeners = new Map<AnyEventListener, ListenerRecord<AnyFn>>();
  private readonly scope = Scope.makeUnsafe();
  private closed = false;
  private readonly observations = new EmissionHub<HyperEmission<TMap>>();

  get isClosed(): boolean {
    return this.closed;
  }

  /** Enable queued observations lazily; direct PubSub publishing reaches this feed only. */
  pubsub(options?: PubSubOptions): PubSub.PubSub<HyperEmission<TMap>> {
    this.assertOpen();
    return this.observations.get(options);
  }

  get hasPubSub(): boolean { return !this.closed && this.observations.enabled; }
  get pubsubStatus() { return this.observations.status(); }

  subscribe(options?: PubSubOptions): Effect.Effect<PubSub.Subscription<HyperEmission<TMap>>, never, Scope.Scope> {
    return Effect.suspend(() => PubSub.subscribe(this.pubsub(options)));
  }

  stream(options?: PubSubOptions): Stream.Stream<HyperEmission<TMap>> {
    return Stream.suspend(() => Stream.fromPubSub(this.pubsub(options)));
  }

  constructor(options: HyperEmitterOptions = {}) {
    this.delimiter = options.delimiter ?? '.';
    this.wildcardStyle = options.wildcardStyle ?? 'mqtt';
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
    this.wildcardTree = new RadixTree<ListenerRecord<AnyFn>>(this.delimiter, this.wildcardStyle);
    this.wildcardIndex = new Map();
  }

  on<K extends keyof TMap & string>(
    event: K,
    listener: EventListener<TMap[K]>,
    options: ListenerOptions = {}
  ): this {
    const record = createRecord(listener as AnyFn, options, this.finalizer as any);
    this.add(event, record, options.prepend);
    return this;
  }

  once<K extends keyof TMap & string>(
    event: K,
    listener: EventListener<TMap[K]>,
    options: ListenerOptions = {}
  ): this {
    const record = createRecord(listener as AnyFn, options, this.finalizer as any);
    record.once = true;
    this.add(event, record, options.prepend);
    return this;
  }

  /** Register a listener and own its in-flight Effects until the caller's scope closes. */
  onScoped<K extends keyof TMap & string>(
    event: K,
    listener: EventListener<TMap[K]>,
    options: ListenerOptions = {},
  ): Effect.Effect<void, never, Scope.Scope> {
    return Effect.acquireRelease(
      Effect.sync(() => {
        this.assertOpen();
        const record = createRecord(listener as AnyFn, options, this.finalizer as any);
        record.scope = Scope.forkUnsafe(this.scope);
        this.add(event, record, options.prepend);
        return record;
      }),
      record => Effect.sync(() => this.offListener(record)).pipe(
        Effect.andThen(Scope.close(record.scope!, Exit.void)),
      ),
    ).pipe(Effect.asVoid);
  }

  off<K extends keyof TMap & string>(event: K, listener: EventListener<TMap[K]>): this {
    const list = this.exactListeners.get(event);
    if (list) {
      const idx = list.findIndex(l => l.fn === listener);
      if (idx !== -1) {
        cleanupAbort(list[idx]);
        list.splice(idx, 1);
      }
      if (list.length === 0) this.exactListeners.delete(event);
    }
    if (this.hasWildcards && this.isWildcard(event)) {
      this.removeWildcard(event, listener as AnyFn);
    }
    return this;
  }

  emit<K extends keyof TMap & string>(
    event: K,
    payload: TMap[K]
  ): boolean {
    if (this.closed) return false;
    if (this.observations.enabled) this.observations.publish(Object.freeze({ event, payload }) as HyperEmission<TMap>);
    if (this.exactListeners.size === 0 && this.wildcardIndex.size === 0 && this.anyListeners.size === 0) return false;
    const records = this.snapshot(event);
    let called = false;
    for (const record of records) {
      if (!this.prepare(record)) continue;
      called = true;
      try {
        const result = record.any ? record.fn(event, payload) : record.fn(payload);
        if (Effect.isEffect(result) || (result && typeof result.then === 'function')) {
          Effect.runSync(Effect.forkIn(
            this.resultEffect(result).pipe(Effect.catchCause(cause => Effect.sync(() => {
              if (!Cause.hasInterruptsOnly(cause)) this.handleRejection(record, Cause.squash(cause));
            }))),
            record.scope ?? this.scope,
            { startImmediately: true },
          ));
        }
      } catch (error) {
        if (!this.shouldCapture(record)) throw error;
        this.handleRejection(record, error);
      }
    }
    return called;
  }

  /** Emit lazily and await every listener, including Promise and Effect callbacks. */
  emitEffect<K extends keyof TMap & string>(event: K, payload: TMap[K]): Effect.Effect<boolean, unknown> {
    return this.dispatch(event, payload, true);
  }

  private dispatch(event: string, payload: unknown, awaitListeners: boolean): Effect.Effect<boolean, unknown> {
    return Effect.suspend(() => {
      if (this.closed) return noListeners;
      if (this.observations.enabled) this.observations.publish(Object.freeze({ event, payload }) as HyperEmission<TMap>);
      const records = this.snapshot(event);
      if (records.length === 0) return noListeners;
      let pending: Fiber.Fiber<unknown, unknown>[] | undefined;
      let called = false;
      let hasAsync = false;
      // Batch ordinary callbacks in one deferred Effect. Continue through Effect
      // combinators only when a listener returns work that needs a scoped fiber.
      const loop = (start: number): Effect.Effect<boolean, unknown> => {
        for (let index = start; index < records.length; index++) {
          const record = records[index];
          if (!this.prepare(record)) continue;
          called = true;
          let result: any;
          try {
            result = record.any ? record.fn(event, payload) : record.fn(payload);
          } catch (error) {
            if (!this.shouldCapture(record)) return Effect.fail(error);
            this.handleRejection(record, error);
            continue;
          }
          if (!Effect.isEffect(result) && !(result && typeof result.then === 'function')) continue;
          hasAsync = true;
          const work = this.resultEffect(result);
          const handled = !awaitListeners || this.shouldCapture(record)
            ? work.pipe(Effect.catchCause(cause => Effect.sync(() => {
                if (!Cause.hasInterruptsOnly(cause)) this.handleRejection(record, Cause.squash(cause));
              })))
            : work;
          return Effect.forkIn(handled, record.scope ?? this.scope, { startImmediately: true }).pipe(
            Effect.flatMap(fiber => {
              if (awaitListeners) (pending ??= []).push(fiber);
              return Effect.suspend(() => loop(index + 1));
            }),
          );
        }
        return pending
          ? Fiber.joinAll(pending).pipe(Effect.as(called))
          : called ? emitted : noListeners;
      };
      const program = loop(0);
      return awaitListeners && hasAsync
        ? program.pipe(Effect.ensuring(Effect.suspend(() => pending ? Fiber.interruptAll(pending) : Effect.void)))
        : program;
    });
  }

  /**
   * Register a catch-all listener that fires on every emit with (event, payload).
   * Useful for event bridging / debugging.
   */
  onAny(listener: AnyEventListener, options: ListenerOptions = {}): this {
    this.assertOpen();
    const existing = this.anyListeners.get(listener);
    if (existing) cleanupAbort(existing);
    const record = createRecord(listener, options, this.finalizer as any);
    record.any = true;
    if (options.prepend) this.anyListeners = new Map([[listener, record], ...this.anyListeners]);
    else this.anyListeners.set(listener, record);
    attachAbort(record, () => this.offAny(listener));
    return this;
  }

  onAnyScoped(listener: AnyEventListener, options: ListenerOptions = {}): Effect.Effect<void, never, Scope.Scope> {
    const owned: AnyEventListener = (event, payload) => listener(event, payload);
    return Effect.acquireRelease(
      Effect.sync(() => {
        this.assertOpen();
        const record = createRecord(owned, options, this.finalizer as any);
        record.original = listener;
        record.any = true;
        record.scope = Scope.forkUnsafe(this.scope);
        this.anyListeners.set(owned, record);
        attachAbort(record, () => this.offAny(owned));
        return record;
      }),
      record => Effect.sync(() => this.offAny(owned)).pipe(
        Effect.andThen(Scope.close(record.scope!, Exit.void)),
      ),
    ).pipe(Effect.asVoid);
  }

  /**
   * Remove a catch-all listener registered via onAny.
   */
  offAny(listener: AnyEventListener): this {
    const record = this.anyListeners.get(listener)
      ?? [...this.anyListeners.values()].find(record => record.original === listener);
    if (record) {
      cleanupAbort(record);
      this.anyListeners.delete(record.fn);
    }
    return this;
  }

  listeners(event: keyof TMap & string): EventListener<any>[] {
    return this.snapshot(event).filter(record => !record.any && this.isLive(record)).map(record => record.fn);
  }

  hasListeners(event: keyof TMap & string): boolean {
    return this.snapshot(event).some(record => this.isLive(record));
  }

  listenerCount(event?: keyof TMap & string): number {
    if (!event) {
      let total = this.wildcardIndex.size + this.anyListeners.size;
      for (const arr of this.exactListeners.values()) total += arr.length;
      return total;
    }
    return this.listeners(event).length;
  }

  removeAllListeners(event?: keyof TMap & string): this {
    if (!event) {
      for (const arr of this.exactListeners.values()) {
        arr.forEach(cleanupAbort);
      }
      this.exactListeners.clear();
      for (const record of this.wildcardIndex.keys()) cleanupAbort(record);
      for (const record of this.anyListeners.values()) cleanupAbort(record);
      this.anyListeners.clear();
      this.wildcardTree = new RadixTree<ListenerRecord<AnyFn>>(this.delimiter, this.wildcardStyle);
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
    if (this.hasWildcards && this.isWildcard(event)) {
      for (const [record, pattern] of this.wildcardIndex.entries()) {
        if (pattern === event) {
          cleanupAbort(record);
          this.wildcardTree.remove(pattern, record);
          this.wildcardIndex.delete(record);
        }
      }
    }
    return this;
  }

  /** Remove subscriptions and interrupt listener work owned by this emitter. */
  close(): Effect.Effect<void> {
    return Effect.suspend(() => {
      if (this.closed) return Effect.void;
      this.closed = true;
      this.removeAllListeners();
      return this.observations.close().pipe(Effect.andThen(Scope.close(this.scope, Exit.void)));
    });
  }

  /**
   * Bridge from a Node EventEmitter: forward Node events into this emitter.
   */
  fromNodeEmitter(emitter: NodeEmitter, event: string): () => void {
    const handler = (...args: any[]) => {
      this.emit(event as keyof TMap & string, args[0]);
    };
    emitter.on(event, handler);
    return () => emitter.off(event, handler);
  }

  /**
   * Bridge to a Node EventEmitter: emit HyperEmitter events on a provided Node emitter.
   */
  toNodeEmitter(target: NodeEmitter): () => void {
    const forwarder: AnyEventListener = (event, payload) => { target.emit(event, payload); };
    this.onAny(forwarder);
    return () => { this.offAny(forwarder); };
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

  private add(event: string, record: ListenerRecord<AnyFn>, prepend = false) {
    this.assertOpen();
    // Wildcard patterns contain '+' or '#'
    const isWildcard = this.isWildcard(event);
    if (isWildcard) {
      this.hasWildcards = true;
      this.wildcardTree.insert(event, record, prepend);
      this.wildcardIndex.set(record, event);
    } else {
      const list = this.exactListeners.get(event);
      if (list) {
        if (prepend) list.unshift(record);
        else list.push(record);
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

  listenersAny(): AnyEventListener[] {
    return [...this.anyListeners.values()].filter(record => this.isLive(record)).map(record => record.original ?? record.fn);
  }

  eventNames(): string[] {
    return [...new Set([...this.exactListeners.keys(), ...this.wildcardIndex.values()])];
  }

  private isWildcard(event: string) {
    if (this.wildcardStyle === 'mqtt' ? !event.includes('+') && !event.includes('#') : !event.includes('*')) return false;
    const tokens = this.wildcardStyle === 'mqtt' ? ['+', '#'] : ['*', '**'];
    return event.split(this.delimiter).some(segment => tokens.includes(segment));
  }

  private assertOpen() {
    if (this.closed) throw new Error('HyperEmitter is closed');
  }

  private snapshot(event: string) {
    if (this.wildcardStyle === 'eventemitter' && this.isWildcard(event)) {
      const records = [...this.anyListeners.values()];
      for (const [pattern, listeners] of this.exactListeners) {
        if (patternsIntersect(pattern, event, this.delimiter)) records.push(...listeners);
      }
      for (const [record, pattern] of this.wildcardIndex) {
        if (patternsIntersect(pattern, event, this.delimiter)) records.push(record);
      }
      return records;
    }
    const exact = this.exactListeners.get(event);
    if (!this.hasWildcards && this.anyListeners.size === 0) return exact?.slice() ?? [];
    return [
      ...(this.wildcardStyle === 'eventemitter' ? this.anyListeners.values() : []),
      ...(exact ?? []),
      ...(this.hasWildcards ? this.wildcardTree.match(event) : []),
      ...(this.wildcardStyle === 'mqtt' ? this.anyListeners.values() : []),
    ];
  }

  private isLive(record: ListenerRecord<AnyFn>) {
    return !record.signal?.aborted && (!record.weakRef || !!record.weakRef.deref());
  }

  private prepare(record: ListenerRecord<AnyFn>) {
    if (!this.isLive(record)) {
      this.offListener(record);
      return false;
    }
    // Remove before invoking so a recursive emit cannot call a once listener twice.
    if (record.once) {
      if (record.fired) return false;
      record.fired = true;
      this.offListener(record);
    }
    return true;
  }

  private resultEffect(result: any): Effect.Effect<unknown, unknown> {
    if (Effect.isEffect(result)) return result as Effect.Effect<unknown, unknown>;
    if (result && typeof result.then === 'function') {
      return Effect.tryPromise({ try: () => Promise.resolve(result), catch: error => error });
    }
    return Effect.succeed(result);
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
      cleanupAbort(record);
      this.wildcardTree.remove(pattern, record);
      this.wildcardIndex.delete(record);
      return;
    }
    if (this.anyListeners.get(record.fn) === record) this.offAny(record.fn);
  }

  private shouldCapture(record: ListenerRecord<AnyFn>) {
    return record.captureRejections ?? this.captureRejections;
  }

  private handleRejection(record: ListenerRecord<AnyFn>, err: unknown) {
    if (!this.shouldCapture(record)) {
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
