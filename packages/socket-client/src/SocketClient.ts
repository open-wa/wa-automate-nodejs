import { EventEmitter2 } from 'eventemitter2';
import { io, Socket } from "socket.io-client";
import { Client as _Client, SimpleListener, Chat, ChatId, Message } from "@open-wa/wa-automate-types-only";
import { v4 as uuidv4 } from 'uuid';
import { MessageCollector } from './MessageCollector';
import { AwaitMessagesOptions, Collection, CollectorFilter, CollectorOptions } from './Collector';
import makeDebug from 'debug';
const debug = makeDebug('wa:socket');

/**
 * A convenience type that includes all keys from the `Client`.
 */
export type ClientMethods = keyof _Client;
export type Client = _Client;

/**
 * [ALPHA - API will 100% change in the near future. Don't say I didn't warn you.]
 * 
 * 
 * An easy to use socket implementation that allows users to connect into remote instances of the EASY API.
 * 
 * How to use it:
 * 
 * 1. Make sure you're running an instance of the EASY API and make sure to start it with the `--socket` flag
 *      ```bash
 *          > docker run -e PORT=8080 -p 8080:8080 openwa/wa-automate:latest --socket
 *      ```
 * 2. Use this in your code:
 * 
 *      ```javascript
 *          import { SocketClient } from "@open-wa/wa-automate";
 *          
 *          SocketClient.connect("http://localhost:8080").then(async client => {
 *              //now you can use the client similar to how you would use the http express middleware.
 * 
 *              //There are two main commands from this client
 * 
 *              // 1. client.listen - use this for your listeners
 *              
 *              await client.listen("onMessage", message => {
 *                  ...
 *              })
 * 
 *              // 2. client.asj - ask the main host client to get things done
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
    socket: Socket;
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
    private isListenerRegistered: boolean;

    /**
     * The main way to create the socket based client.
     * @param url URL of the socket server (i.e the EASY API instance address)
     * @param apiKey optional api key if set
     * @returns SocketClient
     */
    static async connect(url: string, apiKey?: string, ev?: boolean): Promise<SocketClient & Client> {
        return await new Promise((resolve, reject) => {
            const client = new this(url, apiKey, ev, false)
            client.socket.on("connect", async () => {
                await client._connected();
                return resolve(client as SocketClient & Client)
            });
            client.socket.on("connect_error", reject);
        });
    }

    private async _connected() {
        debug("_connected", this.socket.id)
        if (!this.ev) this.ev = new EventEmitter2({
            wildcard: true
        })
        process.on('SIGINT', () => {
            this.close()
            process.exit();
        }); 
        this.socket.emit("register_ev");
        this.socket.onAny((event, value) => this.ev.emit(event, value))
        await this._ensureListenersRegistered();
    }

    /**
     * Disconnect the socket
     */
    public disconnect(): void {
        this.socket.disconnect();
    }

    /**
     * Close the socket. Prevents not being able to close the node process.
     */
    public close(): void {
        this.socket.close();
    }

    /**
     * Attempt to kill the session and close the socket
     */
     public async killSession(): Promise<void> {
        await this.ask("kill");
        this.socket.close();
    }

    /**
     * Reconnect the socket
     */
    public async reconnect(): Promise<void> {
        return new Promise((resolve) => {
            this.socket.connect();
            this.socket.on("connect", async () => {
                await this._connected();
                resolve();
            });
        });
    }

    public async createMessageCollector(c: Message | ChatId | Chat, filter: CollectorFilter<[Message]>, options: CollectorOptions): Promise<MessageCollector> {
        const chatId: ChatId = ((c as Message)?.chat?.id || (c as Chat)?.id || c) as ChatId;
        return new MessageCollector(await this.ask('getSessionId') as string, await this.ask('getInstanceId') as string, chatId, filter, options, this.ev);
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
        this.apiKey = apiKey
        this.flushListenersOnDisconnect = flushListenersOnDisconnect;
        const _url = new URL(url)
        const _path = _url.pathname.replace(/\/$/, "")
        this.socket = io(_url.origin, {
            autoConnect: true,
            auth: {
                apiKey
            },
            path: _path ? `${_path}/socket.io/` : undefined
        });
        if (ev)
            this.socket.on("connect", async () => {
                await this._connected();
            });
        this.socket.on("connect_error", (err) => {
            debug("connect_error", err)
            console.error("Socket connection error", err.message, err["data"] || "")
        });
        this.socket.io.on("reconnect", async () => {
            // console.log("Reconnected!!")
            debug("reconnected")
            this._ensureListenersRegistered();
        })
        this.socket.io.on("reconnect_attempt", () => {
            debug("Reconnecting...")
            // console.log("Reconnecting...")
        });
        this.socket.on("disconnect", () => {
            debug("disconnected")
            if(this.flushListenersOnDisconnect) this.flushListeners();
            // console.log("Disconnected from host!")
        });
        return new Proxy(this, {
            get: function get(target: SocketClient, prop: string) {
                const o = Reflect.get(target, prop);
                if (o || prop == "ev") return o;
                if (prop === 'then') {
                    return typeof target[prop] === "function" ? Promise.prototype.then.bind(target) : null;
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

    private async _ensureListenersRegistered() {
        debug("Listeners, reregistering...", this.listeners)
        await Promise.all(Object.keys(this.listeners).map(async (listener: SimpleListener) => {
            await this.ask(listener)
            if (!this.socket.listeners(listener).length) {
                this.socket.on(listener, async data => await Promise.all(Object.entries(this.listeners[listener]).map(([, callback]) => callback(data))))
            }
        }))
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
        await this._connected()
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
        // if (!this.socket.connected) return new Error("Socket not connected!")
        return new Promise((_resolve, reject) => {
            const resolve = (...args) => {
                debug("resolve", method, args)
                //@ts-ignore
                _resolve(...args)
            }
            if (typeof args !== "object" && !Array.isArray(args) && (typeof args === "string" || typeof args === "number")) args = [args] as any
            try {
                // @ts-ignore
                this.socket.emit(method, {
                    args
                }, resolve)
            } catch (error) {
                debug("ask error", method, error)
                reject(error)
            }
        })
    }

    /**
     * Set a callback on a simple listener
     * @param listener The listener name (e.g onMessage, onAnyMessage, etc.)
     * @param callback The callback you need to run on the selected listener
     * @returns The id of the callback
     */
    public async listen(listener: SimpleListener, callback: (data: unknown) => void): Promise<string> {
        debug("listen", listener)
        // if (!this.socket.connected) throw new Error("Socket not connected!")
        const id = uuidv4()
        if (!this.listeners[listener]) {
            this.listeners[listener] = {};
            await this.ask(listener)
            if (!this.socket.listeners(listener).length) this.socket.on(listener, async data => await Promise.all(Object.entries(this.listeners[listener]).map(([, callback]) => callback(data))))
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
        if (this.listeners[listener][callbackId]) {
            delete this.listeners[listener][callbackId];
            return true
        }
        return false;
    }

}