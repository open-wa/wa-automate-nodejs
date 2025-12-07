import { SocketClient } from '@open-wa/wa-automate-socket-client';

export const CLIENT_STORE = "waClients"

export interface EasyAPIServer {
    /**
     * The URL of the EASY API instance
     */
    url: string,
    /**
     * The API Key for the instance
     */
    key: string
  }
  

  export interface ServerSubscriber {
    server: string
  }


  export interface ClientStore {
    [id : string] : SocketClient
  }