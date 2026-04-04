import { EventEmitter2 } from 'eventemitter2';
import { SimpleListener } from "@open-wa/schema";
import { Client as _Client } from "@open-wa/wa-automate-types-only";
import makeDebug from 'debug';
import WebSocket from 'isomorphic-ws';

const debug = makeDebug('wa:socket:tunnel');
const uuidv4 = () => typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

type ClientMethods = keyof _Client;
type Client = _Client;

export interface TunnelSocketOptions {
    proxyHost: string;
    proxyToken: string;
    sessionId: string;
    flushListenersOnDisconnect?: boolean;
}

export class TunnelSocketClient {
    public url: string;
    public apiKey?: string; // Kept for interface compatibility
    public flushListenersOnDisconnect: boolean = true;
    public ev: EventEmitter2 = new EventEmitter2({ wildcard: true });
    
    public listeners: {
        [listener in SimpleListener]?: {
            [id: string]: (data: any) => any;
        }
    } = {};

    private ws: WebSocket | null = null;
    private rpcPromises = new Map<string, { resolve: (val: any) => void, reject: (err: any) => void }>();
    private reconnectTimeout: any = null;
    private isDestroyed = false;
    private connectPromise: Promise<void> | null = null;
    private resolveConnect!: () => void;
    private rejectConnect!: (err: any) => void;

    /**
     * Connect to a Cloudflare Workers Tunnel Proxy
     */
    static async connect(options: TunnelSocketOptions, ev?: boolean): Promise<TunnelSocketClient & Client> {
        const client = new this(options);
        await client._initConnect();
        return client as TunnelSocketClient & Client;
    }

    constructor(private options: TunnelSocketOptions) {
        let urlStr = this.options.proxyHost;
        if (urlStr.startsWith('http')) {
            urlStr = urlStr.replace(/^http/, 'ws');
        }
        this.url = `${urlStr}/sessions/${encodeURIComponent(this.options.sessionId)}/connect?token=${encodeURIComponent(this.options.proxyToken)}`;
        this.flushListenersOnDisconnect = options.flushListenersOnDisconnect ?? true;

        return new Proxy(this, {
            get: function get(target: TunnelSocketClient, prop: string) {
                const o = Reflect.get(target, prop);
                if (o || prop === "ev") return o;
                if (prop === 'then') {
                    return typeof target[prop] === "function" ? Promise.prototype.then.bind(target) : null;
                }
                if (prop.startsWith("on")) {
                    return async (callback: (data: unknown) => void) => target.listen(prop as SimpleListener, callback);
                } else {
                    return async (...args: any[]) => {
                        return target.ask(prop as keyof Client, args.length === 1 && typeof args[0] === "object" ? {
                            ...args[0]
                        } : [...args] as any);
                    }
                }
            }
        }) as Client & TunnelSocketClient;
    }

    private async _initConnect(): Promise<void> {
        if (this.connectPromise) return this.connectPromise;
        this.connectPromise = new Promise((resolve, reject) => {
            this.resolveConnect = resolve;
            this.rejectConnect = reject;
            this._connectWs();
        });
        return this.connectPromise;
    }

    private _connectWs() {
        if (this.isDestroyed) return;
        debug(`Connecting to tunnel: ${this.url}`);
        this.ws = new WebSocket(this.url);

        this.ws.onopen = async () => {
            debug("Connected to tunnel upstream");
            this.resolveConnect();
            
            // Re-register listeners on reconnect
            await this._ensureListenersRegistered();
        };

        this.ws.onmessage = (event) => {
            let msg: any;
            try {
                // If it's a Buffer/ArrayBuffer (in Node), convert to string
                const dataStr = typeof event.data === 'string' ? event.data : event.data.toString('utf-8');
                msg = JSON.parse(dataStr);
            } catch (err) {
                debug("Failed to parse incoming message", err);
                return;
            }

            if (msg.type === "rpc_response") {
                const promise = this.rpcPromises.get(msg.id);
                if (promise) {
                    if (msg.error) {
                        promise.reject(new Error(msg.error));
                    } else {
                        promise.resolve(msg.result);
                    }
                    this.rpcPromises.delete(msg.id);
                }
            } else if (msg.type === "event") {
                // Backward compatibility mapping from WebSocket push to eventemitter & listeners
                this.ev.emit(msg.event, msg.data);
                
                const callbacks = this.listeners[msg.event as SimpleListener];
                if (callbacks) {
                    Object.values(callbacks).forEach(cb => cb(msg.data));
                }
            } else if (msg.type === "session_offline") {
                debug("Session is currently offline");
            }
        };

        this.ws.onclose = () => {
            debug("Disconnected from tunnel");
            if (this.flushListenersOnDisconnect) this.flushListeners();
            
            if (!this.isDestroyed) {
                debug("Reconnecting in 3s...");
                this.reconnectTimeout = setTimeout(() => this._connectWs(), 3000);
            }
        };

        this.ws.onerror = (err: any) => {
            debug("WebSocket Error", err.message);
            // If it's the first connection error, reject the initial promise
            // @ts-ignore
            if (this.rejectConnect && this.ws?.readyState !== WebSocket.OPEN) {
                this.rejectConnect(err);
            }
        };
    }

    public disconnect(): void {
        this.close();
    }

    public close(): void {
        this.isDestroyed = true;
        if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }

    public async killSession(): Promise<void> {
        await this.ask("kill" as any);
        this.close();
    }

    public async reconnect(): Promise<void> {
        this.isDestroyed = false;
        if (this.ws) this.ws.close();
        await this._initConnect();
    }

    public async ask<M extends ClientMethods, P extends Parameters<Pick<Client, M>[M]>>(method: M, args?: any[] | P | { [k: string]: unknown }): Promise<unknown> {
        debug("ask", method, args);
        if (typeof args !== "object" && !Array.isArray(args) && (typeof args === "string" || typeof args === "number")) args = [args] as any;
        
        return new Promise((resolve, reject) => {
            if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
                return reject(new Error("WebSocket not connected to proxy"));
            }

            const id = uuidv4();
            this.rpcPromises.set(id, { resolve, reject });

            try {
                this.ws.send(JSON.stringify({
                    type: "rpc_request",
                    id,
                    method,
                    args
                }));
            } catch (err) {
                this.rpcPromises.delete(id);
                reject(err);
            }
        });
    }

    public async listen(listener: SimpleListener, callback: (data: unknown) => void): Promise<string> {
        debug("listen", listener);
        const id = uuidv4();
        
        if (!this.listeners[listener]) {
            this.listeners[listener] = {};
            await this.ask(listener as any); // Inform upstream session to start sending this event
        }
        
        this.listeners[listener]![id] = callback;
        return id;
    }

    public stopListener(listener: SimpleListener, callbackId: string): boolean {
        debug("stop listener", callbackId);
        if (this.listeners[listener] && this.listeners[listener]![callbackId]) {
            delete this.listeners[listener]![callbackId];
            return true;
        }
        return false;
    }

    public async flushListeners() {
        debug("Listeners, flushing...");
        this.listeners = {};
    }

    private async _ensureListenersRegistered() {
        debug("Listeners, reregistering...", Object.keys(this.listeners));
        await Promise.all(Object.keys(this.listeners).map(async (listener: string) => {
            await this.ask(listener as any);
        }));
    }
}
