import { io, Socket } from "socket.io-client";
import { Client } from "../api/Client";
import { SimpleListener } from "../api/model/events";

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
    listeners: any = {};

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

    constructor(url: string, apiKey?: string) {
        this.url = url;
        this.apiKey = apiKey
        this.socket = io(url, {
            autoConnect: true,
            auth: {
                apiKey
            }
        });
        this.socket.io.on("reconnect", async () => {
            console.log("Reconnected!!")
            console.log(Object.keys(this.listeners))
            await Promise.all(Object.keys(this.listeners).map((listener: SimpleListener) => this.listen(listener, this.listeners[listener])))
        })
        this.socket.io.on("reconnect_attempt", () => console.log("Reconnecting..."));
        this.socket.on("disconnect", () => console.log("Disconnected from host!"))
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

    public async listen(listener: SimpleListener, callback: (data: unknown) => void): Promise<boolean> {
        // if (!this.socket.connected) throw new Error("Socket not connected!")
        await this.ask(listener)
        if (!this.listeners[listener]) this.socket.on(listener, callback)
        this.listeners[listener] = callback;
        return true
    }
}