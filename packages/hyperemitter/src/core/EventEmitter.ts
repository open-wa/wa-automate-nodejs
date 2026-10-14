import { Effect, Exit, PubSub, Scope, Stream } from 'effect';
import { HyperEmitter } from './HyperEmitter';
import { EmissionHub, type PubSubOptions } from './EmissionHub';
import type { ListenerOptions } from '../types/index';

export type EventName = string | symbol | (string | symbol)[];
export type EventCallback = (this: EventEmitter, ...values: any[]) => any;
export interface EventEmitterListenerOptions extends ListenerOptions {
  async?: boolean;
  promisify?: boolean;
  nextTick?: boolean;
  objectify?: boolean;
}
export interface EventSubscription {
  emitter: EventEmitter;
  event: EventName;
  listener: EventCallback;
  off(): EventSubscription;
}
export interface WaitForOptions {
  timeout?: number;
  filter?: (...values: any[]) => boolean;
  handleError?: boolean;
  Promise?: Function;
  overload?: boolean;
}
export interface CancelablePromise<T> extends Promise<T> { cancel(reason?: unknown): undefined; }
export interface EventEmitterOptions {
  delimiter?: string;
  ignoreErrors?: boolean;
  maxListeners?: number;
  newListener?: boolean;
  removeListener?: boolean;
}
export interface ListenToOptions {
  on?: (event: any, listener: (...values: any[]) => void) => void;
  off?: (event: any, listener: (...values: any[]) => void) => void;
  reducers?: Function | object;
}

type SubscriptionResult<T, O> = O extends { objectify: true } ? EventSubscription
  : O extends boolean | undefined ? T : 'objectify' extends keyof O ? T | EventSubscription : T;

export interface EventEmission { readonly event: Readonly<EventName>; readonly args: readonly any[]; }

type Packet = { name: EventName; values: any[]; results?: any[] };
type Registration = {
  route: string;
  event: EventName;
  listener: EventCallback;
  wrapped: (packet: Packet) => any;
  cleanup?: () => void;
  any: boolean;
};
type Observer = { target: any; event: string | symbol; handler: (...values: any[]) => void; off: (event: any, handler: any) => void };

/** The process-level OpenWA API, backed by the tuned HyperEmitter dispatcher. */
export class EventEmitter {
  static defaultMaxListeners = 10;
  readonly delimiter: string;
  readonly wildcard = true;
  readonly ignoreErrors: boolean;
  event: EventName = '';
  private readonly engine: HyperEmitter<Record<string, Packet>>;
  private readonly registrations = new Map<Function, Registration>();
  private readonly symbolRoutes = new Map<symbol, string>();
  private readonly observers = new Set<Observer>();
  private readonly pendingWaits = new Set<(reason?: unknown) => void>();
  private maxListeners: number;
  private closed = false;
  private readonly observations = new EmissionHub<EventEmission>();

  constructor(private readonly options: EventEmitterOptions = {}) {
    this.delimiter = options.delimiter ?? '.';
    this.ignoreErrors = options.ignoreErrors ?? false;
    this.maxListeners = options.maxListeners ?? EventEmitter.defaultMaxListeners;
    this.engine = new HyperEmitter({ delimiter: this.delimiter, wildcardStyle: 'eventemitter' });
  }
  get isClosed() { return this.closed || this.engine.isClosed; }

  /** Raw queued observation; use emit/emitEffect to deliver through both interfaces. */
  pubsub(options?: PubSubOptions): PubSub.PubSub<EventEmission> {
    if (this.isClosed) throw new Error('EventEmitter is closed');
    return this.observations.get(options);
  }
  get hasPubSub(): boolean { return !this.isClosed && this.observations.enabled; }
  get pubsubStatus() { return this.observations.status(); }
  subscribe(options?: PubSubOptions): Effect.Effect<PubSub.Subscription<EventEmission>, never, Scope.Scope> {
    return Effect.suspend(() => PubSub.subscribe(this.pubsub(options)));
  }
  stream(options?: PubSubOptions): Stream.Stream<EventEmission> {
    return Stream.suspend(() => Stream.fromPubSub(this.pubsub(options)));
  }

  on<O extends boolean | EventEmitterListenerOptions | undefined = undefined>(
    event: EventName, listener: EventCallback, options?: O,
  ): SubscriptionResult<this, O> {
    return this.register(event, listener, options) as SubscriptionResult<this, O>;
  }
  addListener<O extends boolean | EventEmitterListenerOptions | undefined = undefined>(
    event: EventName, listener: EventCallback, options?: O,
  ): SubscriptionResult<this, O> {
    return this.register(event, listener, options) as SubscriptionResult<this, O>;
  }
  prependListener<O extends boolean | EventEmitterListenerOptions | undefined = undefined>(
    event: EventName, listener: EventCallback, options?: O,
  ): SubscriptionResult<this, O> {
    return this.register(event, listener, options, true) as SubscriptionResult<this, O>;
  }
  once<O extends boolean | EventEmitterListenerOptions | undefined = undefined>(
    event: EventName, listener: EventCallback, options?: O,
  ): SubscriptionResult<this, O> {
    return this.register(event, listener, options, false, 1) as SubscriptionResult<this, O>;
  }
  prependOnceListener<O extends boolean | EventEmitterListenerOptions | undefined = undefined>(
    event: EventName, listener: EventCallback, options?: O,
  ): SubscriptionResult<this, O> {
    return this.register(event, listener, options, true, 1) as SubscriptionResult<this, O>;
  }
  many<O extends boolean | EventEmitterListenerOptions | undefined = undefined>(
    event: EventName, times: number, listener: EventCallback, options?: O,
  ): SubscriptionResult<this, O> {
    return this.register(event, listener, options, false, times) as SubscriptionResult<this, O>;
  }
  prependMany<O extends boolean | EventEmitterListenerOptions | undefined = undefined>(
    event: EventName, times: number, listener: EventCallback, options?: O,
  ): SubscriptionResult<this, O> {
    return this.register(event, listener, options, true, times) as SubscriptionResult<this, O>;
  }

  onAny(listener: EventCallback): this { this.register('', listener, undefined, false, Infinity, true); return this; }
  prependAny(listener: EventCallback): this { this.register('', listener, undefined, true, Infinity, true); return this; }
  offAny(listener?: EventCallback): this {
    for (const registration of this.registrations.values()) {
      if (registration.any && (!listener || registration.listener === listener)) {
        this.remove(registration);
        if (listener) break;
      }
    }
    return this;
  }
  off(event: EventName, listener: EventCallback): this {
    const route = this.route(event);
    for (const registration of this.registrations.values()) {
      if (!registration.any && registration.route === route && (registration.listener === listener || registration.wrapped === listener)) {
        this.remove(registration);
        break;
      }
    }
    return this;
  }
  removeListener(event: EventName, listener: EventCallback): this { return this.off(event, listener); }
  removeAllListeners(event?: EventName): this {
    // EventEmitter2 keeps catch-all subscriptions; offAny owns their removal.
    const matches = event === undefined ? undefined : new Set(this.engine.listeners(this.route(event)));
    for (const registration of this.registrations.values()) {
      if (!registration.any && (!matches || matches.has(registration.wrapped))) this.remove(registration);
    }
    return this;
  }
  listeners(event?: EventName): EventCallback[] {
    if (event === undefined) throw new Error('event name required for wildcard emitter');
    return this.engine.listeners(this.route(event)).map(fn => this.registrations.get(fn)!.listener);
  }
  listenersAny(): EventCallback[] {
    return this.engine.listenersAny().map(fn => this.registrations.get(fn)!.listener);
  }
  listenerCount(event?: EventName): number { return this.listeners(event).length; }
  hasListeners(event?: EventName | String): boolean {
    if (event === undefined) return this.registrations.size > 0;
    const name = event instanceof String ? event.valueOf() : event as EventName;
    return this.engine.listeners(this.route(name)).length > 0;
  }
  eventNames(nsAsArray = false): EventName[] {
    type Node = { name?: EventName; children: Map<string | symbol, Node> };
    const tree: Node = { children: new Map() };
    for (const registration of this.registrations.values()) {
      if (registration.any) continue;
      const segments = typeof registration.event === 'string' ? registration.event.split(this.delimiter)
        : typeof registration.event === 'symbol' ? [registration.event] : [...registration.event];
      let node = tree;
      for (const segment of segments) {
        let child = node.children.get(segment);
        if (!child) node.children.set(segment, child = { children: new Map() });
        node = child;
      }
      node.name = nsAsArray || segments.some(segment => typeof segment === 'symbol') ? segments : segments.join(this.delimiter);
    }
    const names: EventName[] = [];
    const visit = (node: Node) => {
      if (node.name !== undefined) names.push(node.name);
      for (const key of Reflect.ownKeys(Object.fromEntries(node.children)).reverse()) visit(node.children.get(key)!);
    };
    visit(tree);
    return names;
  }
  setMaxListeners(count: number): void {
    if (typeof count !== 'number' || count < 0 || Number.isNaN(count)) throw new TypeError('count must be a non-negative number');
    this.maxListeners = count;
  }
  getMaxListeners(): number { return this.maxListeners; }

  emit(event: EventName, ...values: any[]): boolean {
    this.checkError(event, values);
    if (this.isClosed) return false;
    this.observe(event, values);
    return this.engine.emit(this.route(event), { name: this.name(event), values });
  }
  emitEffect(event: EventName, ...values: any[]): Effect.Effect<boolean, unknown> {
    return Effect.suspend(() => {
      this.checkError(event, values);
      if (this.isClosed) return Effect.succeed(false);
      this.observe(event, values);
      return this.engine.emitEffect(this.route(event), { name: this.name(event), values });
    });
  }
  emitAsync(event: EventName, ...values: any[]): Promise<any[]> {
    const packet: Packet = { name: this.name(event), values, results: [] };
    return Effect.runPromise(Effect.suspend(() => {
      this.checkError(event, values);
      if (this.isClosed) return Effect.succeed(false);
      this.observe(event, values);
      return this.engine.emitEffect(this.route(event), packet);
    })).then(() => packet.results!);
  }

  onScoped(event: EventName, listener: EventCallback, options: EventEmitterListenerOptions = {}) {
    return Effect.acquireRelease(
      Effect.gen({ self: this }, function* () {
        const registration = this.makeRegistration(event, listener, options, Infinity, false);
        yield* this.engine.onScoped(registration.route, registration.wrapped, options).pipe(
          Effect.onExit(exit => Exit.isFailure(exit) ? Effect.sync(() => this.remove(registration)) : Effect.void),
        );
        if (options.signal?.aborted) this.remove(registration);
        return registration;
      }),
      registration => Effect.sync(() => { this.remove(registration); }),
    ).pipe(Effect.asVoid);
  }
  onAnyScoped(listener: EventCallback, options: EventEmitterListenerOptions = {}) {
    return Effect.acquireRelease(
      Effect.gen({ self: this }, function* () {
        const registration = this.makeRegistration('', listener, options, Infinity, true);
        yield* this.engine.onAnyScoped(registration.wrapped as any, options).pipe(
          Effect.onExit(exit => Exit.isFailure(exit) ? Effect.sync(() => this.remove(registration)) : Effect.void),
        );
        if (options.signal?.aborted) this.remove(registration);
        return registration;
      }),
      registration => Effect.sync(() => { this.remove(registration); }),
    ).pipe(Effect.asVoid);
  }

  waitFor(event: EventName, input: number | ((...values: any[]) => boolean) | WaitForOptions = {}): CancelablePromise<any[]> {
    const options = typeof input === 'number' ? { timeout: input } : typeof input === 'function' ? { filter: input } : input;
    const PromiseType = (options.Promise ?? Promise) as PromiseConstructor;
    let cancel!: (reason?: unknown) => undefined;
    const promise = new PromiseType<any[]>((resolve, reject) => {
      let settled = false;
      let timer: ReturnType<typeof setTimeout> | undefined;
      const cleanup = () => { this.off(event, listener); if (timer) clearTimeout(timer); this.pendingWaits.delete(cancel); };
      const listener: EventCallback = (...values) => {
        if (options.filter && !options.filter.apply(this, values)) return;
        settled = true; cleanup();
        if (options.handleError && values[0]) reject(values[0]);
        else resolve(options.handleError ? values.slice(1) : values);
      };
      cancel = reason => { if (settled) return undefined; settled = true; cleanup(); reject(reason ?? Object.assign(new Error('canceled'), { code: 'ECANCELED' })); return undefined; };
      this.on(event, listener);
      this.pendingWaits.add(cancel);
      if (options.timeout) timer = setTimeout(() => cancel(Object.assign(new Error('timeout'), { code: 'ETIMEDOUT' })), options.timeout);
    }) as CancelablePromise<any[]>;
    promise.cancel = cancel;
    return promise;
  }

  listenTo(target: any, events: string | symbol | readonly (string | symbol)[] | Record<string, EventName>, options: ListenToOptions = {}): this {
    const on = options.on ?? target.on ?? target.addListener ?? target.addEventListener;
    const off = options.off ?? target.off ?? target.removeListener ?? target.removeEventListener;
    if (!on || !off) throw new TypeError('target must support listener registration and removal');
    const mapping = typeof events === 'string' ? Object.fromEntries(events.split(/\s+/).map(event => [event, event]))
      : typeof events === 'symbol' ? { [events]: events }
      : Array.isArray(events) ? Object.fromEntries(events.map(event => [event, event])) : events;
    for (const original of Reflect.ownKeys(mapping)) {
      if ([...this.observers].some(observer => observer.target === target && observer.event === original)) continue;
      const handler = (...data: any[]) => {
        const event = { name: (mapping as any)[original], original, data };
        const reducer = typeof options.reducers === 'function' ? options.reducers : (options.reducers as Record<string, Function> | undefined)?.[original as string];
        if (reducer?.(event) !== false) this.emit(event.name, ...event.data);
      };
      on.call(target, original, handler);
      this.observers.add({ target, event: original, handler, off });
    }
    return this;
  }
  stopListeningTo(target?: any, event?: string | symbol): boolean {
    let removed = false;
    for (const observer of this.observers) {
      if ((!target || observer.target === target) && (event === undefined || observer.event === event)) {
        observer.off.call(observer.target, observer.event, observer.handler);
        this.observers.delete(observer); removed = true;
      }
    }
    return removed;
  }
  close(): Effect.Effect<void> {
    return Effect.suspend(() => {
      if (this.closed) return Effect.void;
      this.closed = true;
      this.stopListeningTo();
      for (const cancel of this.pendingWaits) cancel(new Error('EventEmitter is closed'));
      for (const registration of this.registrations.values()) registration.cleanup?.();
      this.registrations.clear();
      this.symbolRoutes.clear();
      return this.observations.close().pipe(Effect.andThen(this.engine.close()));
    });
  }

  private register(event: EventName, listener: EventCallback, input?: boolean | EventEmitterListenerOptions, prepend = false, times = Infinity, any = false): this | EventSubscription {
    const options = this.listenerOptions(input);
    const registration = this.makeRegistration(event, listener, options, times, any);
    try {
      if (any) this.engine.onAny(registration.wrapped as any, { ...options, prepend });
      else this.engine.on(registration.route, registration.wrapped, { ...options, prepend });
    } catch (error) { this.remove(registration); throw error; }
    if (options.signal?.aborted) this.remove(registration);
    if (options.objectify) {
      const subscription: EventSubscription = { emitter: this, event, listener: registration.wrapped, off: () => { this.remove(registration); return subscription; } };
      return subscription;
    }
    return this;
  }
  private makeRegistration(event: EventName, listener: EventCallback, options: EventEmitterListenerOptions, times: number, any: boolean): Registration {
    if (this.isClosed) throw new Error('EventEmitter is closed');
    if (typeof listener !== 'function') throw new TypeError('listener must be a function');
    const registration: Registration = { event, route: this.route(event), listener, any, wrapped: undefined! };
    let remaining = times;
    const invoke = (packet: Packet) => {
      if (remaining === 0 || options.signal?.aborted) return;
      if (--remaining === 0) this.remove(registration);
      this.event = packet.name;
      const values = any ? [packet.name, ...packet.values] : packet.values;
      const call = () => { this.event = packet.name; return listener.apply(this, values); };
      const result = options.async || options.nextTick || options.promisify
        ? options.promisify ?? listener.constructor.name === 'AsyncFunction'
          ? new Promise(resolve => options.nextTick ? process.nextTick(resolve) : setImmediate(resolve)).then(call)
          : options.nextTick ? process.nextTick(call) : setImmediate(call)
        : call();
      if (!packet.results) return result;
      const index = packet.results.length;
      packet.results.push(undefined);
      if (Effect.isEffect(result)) return result.pipe(Effect.tap(value => Effect.sync(() => { packet.results![index] = value; })));
      if (result && typeof result.then === 'function') return Promise.resolve(result).then(value => { packet.results![index] = value; return value; });
      packet.results[index] = result;
      return result;
    };
    registration.wrapped = any ? ((_event: string, packet: Packet) => invoke(packet)) as any : invoke;
    if (this.options.newListener) this.emit('newListener', event, listener);
    this.registrations.set(registration.wrapped, registration);
    if (options.signal) {
      const abort = () => this.remove(registration);
      options.signal.addEventListener('abort', abort, { once: true });
      registration.cleanup = () => options.signal!.removeEventListener('abort', abort);
    }
    return registration;
  }
  private remove(registration: Registration) {
    if (!this.registrations.delete(registration.wrapped)) return;
    registration.cleanup?.();
    if (registration.any) this.engine.offAny(registration.wrapped as any);
    else this.engine.off(registration.route, registration.wrapped);
    if (this.options.removeListener) this.emit(registration.any ? 'removeListenerAny' : 'removeListener', registration.event, registration.listener);
  }
  private listenerOptions(input?: boolean | EventEmitterListenerOptions): EventEmitterListenerOptions {
    return input === true ? { promisify: true } : input === false ? { async: true } : input ?? {};
  }
  private observe(event: EventName, values: any[]) {
    if (!this.observations.enabled) return;
    const name = this.name(event);
    this.observations.publish(Object.freeze({
      event: Array.isArray(name) ? Object.freeze(name.slice()) : name,
      args: Object.freeze(values.slice()),
    }));
  }
  private checkError(event: EventName, values: any[]) {
    if (!this.ignoreErrors && event === 'error' && !this.hasListeners(event) && !this.listenersAny().length) throw values[0] instanceof Error ? values[0] : new Error("Uncaught, unspecified 'error' event.");
  }
  private name(event: EventName): EventName {
    return Array.isArray(event) && !event.some(segment => typeof segment === 'symbol') ? event.join(this.delimiter) : event;
  }
  private route(event: EventName): string {
    if (typeof event === 'string' && !event.includes('\u0000')) return event;
    const encode = (segment: string | symbol) => {
      if (typeof segment === 'string') return segment.replace(/\u0000/g, '\u0000s');
      let key = this.symbolRoutes.get(segment);
      if (!key) this.symbolRoutes.set(segment, key = `\u0000${this.symbolRoutes.size}`);
      return key;
    };
    if (typeof event === 'string') return encode(event);
    return (typeof event === 'symbol' ? [event] : event).map(encode).join(this.delimiter);
  }
}
