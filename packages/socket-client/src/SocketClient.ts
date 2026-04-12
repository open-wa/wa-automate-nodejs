import { EventEmitter2 } from 'eventemitter2';
import { EventSource as EventSourcePolyfill } from 'eventsource';
import type { SimpleListener, Chat, ChatId, Message } from "@open-wa/wa-automate-types-only";
import type { BaseClient as _Client } from "@open-wa/wa-automate-types-only";
import { TunnelSocketClient } from './TunnelSocketClient';
const uuidv4 = () => typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
import { MessageCollector } from './MessageCollector';
import { AwaitMessagesOptions, Collection, CollectorFilter, CollectorOptions } from './Collector';
import makeDebug from 'debug';
const debug = makeDebug('wa:socket');

type SseEventEnvelope = {
    id: string;
    event: string;
    payload: unknown;
    ts: number;
    sessionId: string;
}

type SocketLikeListener = (...args: any[]) => void;

const DEFAULT_STREAM_EVENTS = [
    'message.received',
    'message.any',
    'ack.changed',
    'session.state.changed',
    'group.addedToGroup',
    'launch.auth.qr.generated',
    'launch.auth.qr.scanned',
    'patch.apply.after',
    'client.ready',
    'internal_launch_progress',
    'core.started',
    'debug:log',
    'qr',
    'session:state',
];

const LEGACY_LISTENER_TO_STREAM_EVENT: Partial<Record<SimpleListener, string>> = {
    onMessage: 'message.received',
    onAnyMessage: 'message.any',
    onAck: 'ack.changed',
    onStateChanged: 'session.state.changed',
    onAddedToGroup: 'group.addedToGroup',
    onLogout: 'logout',
    onChatState: 'chatState',
};

const STREAM_EVENT_TO_LEGACY_LISTENERS = Object.entries(LEGACY_LISTENER_TO_STREAM_EVENT).reduce(
    (acc, [legacyListener, streamEvent]) => {
        if (!streamEvent) {
            return acc;
        }

        if (!acc[streamEvent]) {
            acc[streamEvent] = [];
        }

        acc[streamEvent].push(legacyListener as SimpleListener);
        return acc;
    },
    {} as Record<string, SimpleListener[]>
);

function getStreamEventsForSubscription(eventName: string): string[] {
    const mappedEvent = LEGACY_LISTENER_TO_STREAM_EVENT[eventName as SimpleListener];
    return mappedEvent ? [mappedEvent] : [eventName];
}

function getDispatchEventNames(eventName: string): string[] {
    const aliases = STREAM_EVENT_TO_LEGACY_LISTENERS[eventName] ?? [];
    return Array.from(new Set([eventName, ...aliases]));
}

class SocketCompat {
    public connected = false;
    public id = `sse-${uuidv4()}`;

    private emitter = new EventEmitter2();
    private anyListeners = new Set<(event: string, ...args: any[]) => void>();

    constructor(private readonly client: SocketClient) { }

    public on(event: string, listener: SocketLikeListener) {
        this.client.ensureStreamEventRegistered(event);
        this.emitter.on(event, listener);
        return this;
    }

    public off(event: string, listener: SocketLikeListener) {
        this.emitter.off(event, listener);
        return this;
    }

    public onAny(listener: (event: string, ...args: any[]) => void) {
        this.anyListeners.add(listener);
        return this;
    }

    public offAny(listener: (event: string, ...args: any[]) => void) {
        this.anyListeners.delete(listener);
        return this;
    }

    public listeners(event: string): SocketLikeListener[] {
        return this.emitter.listeners(event) as SocketLikeListener[];
    }

    public emit(event: string, ...args: any[]) {
        const maybeAck = args.length && typeof args[args.length - 1] === 'function' ? args.pop() as (payload: any) => void : undefined;

        if (maybeAck) {
            const payload = args[0];
            this.client.ask(event as keyof Client, payload?.args ?? payload)
                .then((data) => maybeAck({ success: true, data }))
                .catch((error) => maybeAck({ success: false, error: error instanceof Error ? error.message : String(error) }));
            return true;
        }

        this.emitLocal(event, ...args);
        return true;
    }

    public connect() {
        void this.client.reconnect();
        return this;
    }

    public disconnect() {
        this.client.disconnect();
        return this;
    }

    public close() {
        this.client.close();
        return this;
    }

    public emitLocal(event: string, ...args: any[]) {
        this.emitter.emit(event, ...args);
        for (const listener of this.anyListeners) {
            listener(event, ...args);
        }
    }
}

/**
 * A convenience type that includes all keys from the `Client`.
 */
export type ClientMethods = keyof _Client;
export type Client = _Client;

/**
 * [ALPHA - API will 100% change in the near future. Don't say I didn't warn you.]
 * 
 * 
 * A compatibility client that allows users to connect to remote instances of the EASY API.
 * 
 * How to use it:
 * 
 * 1. Make sure you're running an instance of the EASY API.
 *      ```bash
 *          > docker run -e PORT=8080 -p 8080:8080 openwa/wa-automate:latest
 *      ```
 *    Commands are sent over the EASY API HTTP surface and runtime events are streamed back over Server-Sent Events (SSE).
 *    Legacy listener helpers such as `listen("onMessage", ...)` are resolved locally against
 *    the SSE event stream instead of depending on a separate listener-registration RPC.
 * 2. Use this in your code:
 * 
 *      ```javascript
 *          import { SocketClient } from "@open-wa/wa-automate";
 *          
 *          SocketClient.connect("http://localhost:8080").then(async client => {
 *              //now you can use the client similar to how you would use the EASY API client surface.
 * 
 *              //There are two main commands from this client
 * 
 *              // 1. client.listen - use this for your event listeners
 *              
 *              await client.listen("onMessage", message => {
 *                  ...
 *              })
 * 
 *              // 2. client.ask - ask the main host client to get things done
 * 
 *              await client.ask("sendText", {
 *                  "to" : "44771234567@c.us",
 *                  "content": "hellow socket"
 *              })
 * 
 *              // or you can send the arguments in order as an array (or tuple, as the cool kids would say)
 *              await client.ask("sendText", [
 *                  "44771234567@c.us",
 *                  "hellow socket"
 *              ])
 * 
 *          })
 *      ```
 */
export class SocketClient {
    url: string;
    apiKey: string;
    socket: SocketCompat;
    flushListenersOnDisconnect: boolean = true;
    /**
     * A local version of the `ev` EventEmitter2
     */
    ev: EventEmitter2 = new EventEmitter2({
        wildcard: true
    })
    listeners: {
        [listener in SimpleListener]?: {
            [id: string]: (data: any) => any
        }
    } = {};

    private stream: any = null;
    private streamOpenPromise: Promise<void> | null = null;
    private resolveStreamOpen: (() => void) | null = null;
    private rejectStreamOpen: ((error: unknown) => void) | null = null;
    private hasOpenedStream = false;
    private isClosed = false;
    private hasSignalHandler = false;
    private registeredStreamEvents = new Set<string>(DEFAULT_STREAM_EVENTS);
    private boundStreamEvents = new Set<string>();

    /**
     * The main way to create the socket based client.
     * @param url URL of the socket server (i.e the EASY API instance address) or cf-proxy:// URL
     * @param apiKey optional api key if set
     * @returns SocketClient
     */
    static async connect(url: string, apiKey?: string, ev?: boolean): Promise<SocketClient & Client> {
        if (url.startsWith('cf-proxy://')) {
            const parsed = new URL(url.replace('cf-proxy://', 'https://'));
            const proxyHost = 'https://' + parsed.host + parsed.pathname;
            const sessionId = parsed.searchParams.get('sessionId') || 'session';
            const proxyToken = parsed.searchParams.get('token') || apiKey || '';
            return TunnelSocketClient.connect({
                proxyHost,
                proxyToken,
                sessionId
            }, ev) as any;
        }

        const client = new this(url, apiKey, ev, false);
        await client.waitForConnection();
        return client as SocketClient & Client;
    }

    private async _connected() {
        debug("_connected", this.socket.id)
        if (!this.ev) this.ev = new EventEmitter2({
            wildcard: true
        })
        if (!this.hasSignalHandler && typeof process !== 'undefined' && process.on) {
            process.on('SIGINT', () => {
                this.close()
                process.exit();
            });
            this.hasSignalHandler = true;
        }
        await this._ensureListenersRegistered();
    }

    /**
     * Disconnect the socket
     */
    public disconnect(): void {
        this.closeStream('client disconnect');
    }

    /**
     * Close the socket. Prevents not being able to close the node process.
     */
    public close(): void {
        this.closeStream('client close');
    }

    /**
     * Attempt to kill the session and close the socket
     */
    public async killSession(): Promise<void> {
        await this.ask("kill" as any);
        this.close();
    }

    /**
     * Reconnect the socket
     */
    public async reconnect(): Promise<void> {
        this.closeStream('manual reconnect', false);
        await this.openStream();
    }

    public async createMessageCollector(c: Message | ChatId | Chat, filter: CollectorFilter<[Message]>, options: CollectorOptions): Promise<MessageCollector> {
        const chatId: ChatId = ((c as Message)?.chat?.id || (c as Chat)?.id || c) as ChatId;
        return new MessageCollector(await this.ask('getSessionId' as any) as string, await this.ask('getInstanceId' as any) as string, chatId, filter, options, this.ev);
    }

    public async awaitMessages(c: Message | ChatId | Chat, filter: CollectorFilter<[Message]>, options: AwaitMessagesOptions = {}): Promise<Collection<string, Message>> {
        return new Promise(async (resolve, reject) => {
            const collector = await this.createMessageCollector(c, filter, options);
            collector.once('end', (collection, reason) => {
                if (options.errors && options.errors.includes(reason)) {
                    reject(collection);
                } else {
                    resolve(collection);
                }
            });
        });
    }

    /**
     * 
     * @param url The URL of the socket server (i.e the EASY API instance address)
     * @param apiKey The API key if set (with -k flag)
     * @param ev I forgot what this is for.
     * @param flushListenersOnDisconnect If true, all listeners will be removed when the socket disconnects. If false, they will be kept and re-registered when the socket reconnects.
     * @returns 
     */
    constructor(url: string, apiKey?: string, ev?: boolean, flushListenersOnDisconnect?: boolean) {
        this.url = url;
        this.apiKey = apiKey ?? '';
        this.flushListenersOnDisconnect = flushListenersOnDisconnect ?? this.flushListenersOnDisconnect;
        this.socket = new SocketCompat(this);
        void this.openStream();
        return new Proxy(this, {
            get: function get(target: SocketClient, prop: string) {
                const o = Reflect.get(target, prop);
                if (o || prop == "ev") return o;
                if (prop === 'then') {
                    return Promise.prototype.then.bind(Promise.resolve(target));
                }
                if (prop.startsWith("on")) {
                    return async (callback: (data: unknown) => void) => target.listen(prop as SimpleListener, callback)
                } else {
                    return async (...args: any[]) => {
                        return target.ask(prop as keyof Client, args.length == 1 && typeof args[0] == "object" ? {
                            ...args[0]
                        } : [
                            ...args
                        ] as any)
                    }
                }
            }
        }) as Client & SocketClient
    }

    private async waitForConnection(): Promise<void> {
        await (this.streamOpenPromise ?? this.openStream());
    }

    private async openStream(): Promise<void> {
        if (this.streamOpenPromise) {
            return this.streamOpenPromise;
        }

        this.isClosed = false;
        this.streamOpenPromise = new Promise<void>((resolve, reject) => {
            this.resolveStreamOpen = resolve;
            this.rejectStreamOpen = reject;

            let EventSourceCtor: any;
            try {
                EventSourceCtor = (globalThis as any).EventSource;
            } catch {
                EventSourceCtor = undefined;
            }

            if (!EventSourceCtor) {
                EventSourceCtor = EventSourcePolyfill;
            }

            if (!EventSourceCtor) {
                const error = new Error('EventSource is not available in this runtime');
                this.streamOpenPromise = null;
                reject(error);
                return;
            }

            const stream = new EventSourceCtor(this.getEventsUrl());
            this.stream = stream;
            this.boundStreamEvents.clear();

            stream.onopen = async () => {
                debug('stream open', this.socket.id);
                const isReconnect = this.hasOpenedStream;
                this.hasOpenedStream = true;
                this.streamOpenPromise = null;
                this.resolveStreamOpen?.();
                this.resolveStreamOpen = null;
                this.rejectStreamOpen = null;
                this.socket.connected = true;
                this.socket.emitLocal('connect');
                await this._connected();
                if (isReconnect) {
                    debug('stream reconnected');
                }
            };

            stream.onerror = (error: unknown) => {
                debug('stream error', error);
                const wasConnected = this.socket.connected;
                this.socket.connected = false;
                if (wasConnected) {
                    this.socket.emitLocal('disconnect', 'eventsource error');
                }
                if (!this.hasOpenedStream) {
                    this.streamOpenPromise = null;
                    this.rejectStreamOpen?.(new Error('Unable to establish SSE connection'));
                    this.rejectStreamOpen = null;
                    this.resolveStreamOpen = null;
                    this.socket.emitLocal('connect_error', error instanceof Error ? error : new Error('Unable to establish SSE connection'));
                }
            };

            stream.onmessage = (event: MessageEvent) => {
                this.handleStreamEvent('message', event);
            };

            this.bindStreamListeners();
        });

        return this.streamOpenPromise;
    }

    public ensureStreamEventRegistered(eventName: string) {
        if (!eventName || eventName === 'connect' || eventName === 'disconnect' || eventName === 'connect_error') {
            return;
        }

        for (const streamEventName of getStreamEventsForSubscription(eventName)) {
            if (!this.registeredStreamEvents.has(streamEventName)) {
                this.registeredStreamEvents.add(streamEventName);
            }
            this.bindStreamListener(streamEventName);
        }
    }

    private bindStreamListeners() {
        for (const eventName of this.registeredStreamEvents) {
            this.bindStreamListener(eventName);
        }
    }

    private bindStreamListener(eventName: string) {
        if (!this.stream || this.boundStreamEvents.has(eventName)) {
            return;
        }
        this.stream.addEventListener(eventName, (event: MessageEvent) => {
            this.handleStreamEvent(eventName, event);
        });
        this.boundStreamEvents.add(eventName);
    }

    private handleStreamEvent(eventName: string, event: MessageEvent) {
        let envelope: SseEventEnvelope | undefined;
        try {
            envelope = JSON.parse((event as any).data) as SseEventEnvelope;
        } catch {
            envelope = undefined;
        }

        const resolvedEventName = envelope?.event || eventName;
        const payload = envelope && 'payload' in envelope ? envelope.payload : envelope ?? (event as any).data;
        debug('stream event', resolvedEventName);

        for (const dispatchEventName of getDispatchEventNames(resolvedEventName)) {
            this.ev.emit(dispatchEventName, payload);
            this.socket.emitLocal(dispatchEventName, payload);

            const listenerCallbacks = this.listeners[dispatchEventName as SimpleListener];
            if (listenerCallbacks) {
                void Promise.all(Object.values(listenerCallbacks).map((callback) => callback(payload)));
            }
        }
    }

    private closeStream(reason = 'client close', markClosed = true) {
        if (markClosed) {
            this.isClosed = true;
        }

        const currentStream = this.stream;
        this.stream = null;
        this.boundStreamEvents.clear();
        this.streamOpenPromise = null;
        this.resolveStreamOpen = null;
        this.rejectStreamOpen = null;

        const wasConnected = this.socket.connected;
        this.socket.connected = false;

        if (currentStream) {
            currentStream.close();
        }

        if (wasConnected) {
            debug('stream closed', reason);
            this.socket.emitLocal('disconnect', reason);
        }

        if (this.flushListenersOnDisconnect) {
            void this.flushListeners();
        }
    }

    private async _ensureListenersRegistered() {
        debug("Listeners, reregistering...", this.listeners)
        Object.keys(this.listeners).forEach((listener: string) => {
            this.ensureStreamEventRegistered(listener);
        })
    }

    /**
     * Remove all internal event listeners
     */
    public async flushListeners() {
        debug("Listeners, flushing...")
        this.listeners = {}
    }

    /**
     * A convenience method for the socket connected event.
     * @param callback The callback to be called when the socket is connected
     */
    public async onConnected(callback: () => void) {
        if (this.socket.connected) callback();
        else this.socket.on("connect", callback)
    }

    //awaiting tuple label getter to reimplement this
    // //  | {
    //   [K in keyof Parameters<Pick<Client,M>[ M ]>]: Parameters<Pick<Client,M>[ M ]>[K]
    // }

    public async ask<M extends ClientMethods, P extends Parameters<Pick<Client, M>[M]>>(method: M, args?: any[] | P | {
        [k: string]: unknown
    }): Promise<unknown> {
        debug("ask", method, args)
        if (typeof args !== "object" && !Array.isArray(args) && (typeof args === "string" || typeof args === "number")) args = [args] as any

        const headers: Record<string, string> = {
            'Content-Type': 'application/json'
        };

        if (this.apiKey) {
            headers['X-API-Key'] = this.apiKey;
        }

        const body = Array.isArray(args)
            ? { args }
            : args && typeof args === 'object'
                ? { ...args }
                : {};

        const response = await fetch(this.getApiUrl(method), {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
        } as any);

        let parsed: any;
        try {
            parsed = await response.json();
        } catch {
            parsed = undefined;
        }

        debug("resolve", method, parsed)

        if (parsed && typeof parsed === "object" && "success" in parsed) {
            if (parsed.success) {
                return parsed.data;
            }
            throw new Error(parsed.error || "Unknown socket error");
        }

        if (!response.ok) {
            throw new Error(parsed?.error || parsed?.details || `HTTP ${response.status}`);
        }

        return parsed;
    }

    /**
     * Set a callback on a simple listener
     * @param listener The listener name (e.g onMessage, onAnyMessage, etc.)
     * @param callback The callback you need to run on the selected listener
     * @returns The id of the callback
     */
    public async listen(listener: SimpleListener, callback: (data: unknown) => void): Promise<string> {
        debug("listen", listener)
        const id = uuidv4()
        this.ensureStreamEventRegistered(listener);
        if (!this.listeners[listener]) {
            this.listeners[listener] = {};
        }
        this.listeners[listener][id] = callback;
        return id
    }

    /**
     * Discard a callback
     * 
     * @param listener The listener name (e.g onMessage, onAnyMessage, etc.)
     * @param callbackId The ID from `listen`
     * @returns boolean - true if the callback was found and discarded, false if the callback is not found
     */
    public stopListener(listener: SimpleListener, callbackId: string): boolean {
        debug("stop listener", callbackId)
        if (this.listeners[listener]?.[callbackId]) {
            delete this.listeners[listener][callbackId];
            return true
        }
        return false;
    }

    private getBaseUrl(): string {
        const parsed = new URL(this.url);
        const path = parsed.pathname.replace(/\/$/, '');
        return `${parsed.origin}${path}`;
    }

    private getApiUrl(method: string): string {
        return `${this.getBaseUrl()}/api/${method}`;
    }

    private getEventsUrl(): string {
        const parsed = new URL(`${this.getBaseUrl()}/api/events`);
        parsed.searchParams.set('topics', '*');
        if (this.apiKey) {
            parsed.searchParams.set('api_key', this.apiKey);
        }
        return parsed.toString();
    }
}
