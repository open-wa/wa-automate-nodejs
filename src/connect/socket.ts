import { EventEmitter2 } from 'eventemitter2';
import { io, Socket } from "socket.io-client";
import { Client } from "../api/Client";
import { SimpleListener } from "../api/model/events";
import { v4 as uuidv4 } from 'uuid';

/**
 * A convenience type that includes all keys from the `Client`.
 */
export type ClientMethods = keyof Client;

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
    /**
     * A local version of the `ev` EventEmitter2
     */
    ev : EventEmitter2;
    listeners: {
        [listener in SimpleListener] ?: {
            [id : string] : (data: any) => any
        }
    } = {};

    /**
     * The main way to create the socket baed client.
     * @param url URL of the socket server (i.e the EASY API instance address)
     * @param apiKey optional api key if set
     * @returns SocketClient
     */
    static async connect(url: string, apiKey?: string): Promise<SocketClient & Client> {
        const client = new this(url, apiKey)
        return await new Promise((resolve, reject) => {
            client.socket.on("connect", () => {
                console.log("Connected!", client.socket.id)
                return resolve(client as any)
            });
            client.socket.on("connect_error", reject);
        })
    }

    constructor(url: string, apiKey?: string, ev ?: boolean) {
        this.url = url;
        this.apiKey = apiKey
        const _url = new URL(url)
        const _path = _url.pathname.replace(/\/$/, "")
        this.socket = io(_url.origin, {
          autoConnect: true,
          auth: {
            apiKey
          },
          path: _path ? `${_path}/socket.io/` : undefined
        });
        if(ev)
        this.socket.on("connect", () => {
            if(!this.ev) this.ev = new EventEmitter2({
                wildcard:true
            })
            this.socket.emit("register_ev");
            this.socket.onAny((event, value)=>this.ev.emit(event, value))
        });
        this.socket.io.on("reconnect", async () => {
            console.log("Reconnected!!")
            console.log(Object.keys(this.listeners))
            await Promise.all(Object.keys(this.listeners).map(async (listener: SimpleListener) => {
            await this.ask(listener)
            this.socket.on(listener, async data => await Promise.all(Object.entries(this.listeners[listener]).map(([, callback]) => callback(data))))
            }))
        })
        this.socket.io.on("reconnect_attempt", () => console.log("Reconnecting..."));
        this.socket.on("disconnect", () => console.log("Disconnected from host!"));
        return new Proxy(this, {
            get: function get(target : SocketClient, prop : string) {
                const o = Reflect.get(target, prop);
                if(o) return o;
                if (prop === 'then') {
                  return Promise.prototype.then.bind(target);
                }
                if(prop.startsWith("on")) {
                  return async (callback : (data: unknown) => void) => target.listen(prop as SimpleListener,callback)
                } else {
                  return async (...args : any[]) => {
                    return target.ask(prop as keyof Client,args.length==1 && typeof args[0] == "object" ? {
                      ...args[0]
                    } : [
                      ...args
                    ] as any)
                  }
                }
            }
        }) as Client & SocketClient
    }

    //awaiting tuple label getter to reimplement this
    // //  | {
    //   [K in keyof Parameters<Pick<Client,M>[ M ]>]: Parameters<Pick<Client,M>[ M ]>[K]
    // }

    public async ask<M extends ClientMethods, P extends Parameters<Pick<Client, M>[M]>>(method: M, args?: P | {
        [k: string]: unknown
    }): Promise<unknown> {
        // if (!this.socket.connected) return new Error("Socket not connected!")
        return new Promise((resolve, reject) => {
            if (typeof args !== "object" && !Array.isArray(args) && (typeof args === "string" || typeof args === "number")) args = [args] as any
            try {
                // @ts-ignore
                this.socket.emit(method, {
                    args
                }, resolve)
            } catch (error) {
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
        // if (!this.socket.connected) throw new Error("Socket not connected!")
        const id = uuidv4()
        if (!this.listeners[listener]) {
            this.listeners[listener] = {};
            await this.ask(listener)
            this.socket.on(listener, async data => await Promise.all(Object.entries(this.listeners[listener]).map(([, callback]) => callback(data))))
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
    public stopListener(listener: SimpleListener, callbackId : string) : boolean {
        if(this.listeners[listener][callbackId]) {
            delete this.listeners[listener][callbackId];
            return true
        }
        return false;
    }

}