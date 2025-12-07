import { SocketClient } from "@open-wa/wa-automate-socket-client";
import { NodeContextData, NodeInitializer } from "node-red";
import { ClientStore, CLIENT_STORE } from '../shared/types';
import { OwaServerNode, OwaServerNodeDef } from "./modules/types";

const nodeInit: NodeInitializer = async (RED): Promise<void> => {
  function OwaServerNodeConstructor(
    this: OwaServerNode,
    config: OwaServerNodeDef
  ): void {
    /**
     * Create global socket store
     * var globalContext = this.context().global;
     */
    RED.nodes.createNode(this, config);
    this.name = config.name;
    this.url = config.url;
    this.key = config.key;
    this.client = new SocketClient(this.url,this.key);
    this.clientSocket = this.client.socket;
    addSocketClientToGlobalStore(this.context().global, this.id, this.client)

    this.clientSocket.on('connect', () => {
      this.emit('connected')
      this.send({ payload: { socketId: this.name, status: 'connected' } });
      this.status({ fill: "green", shape: "dot", text: "connected" });
    });

    this.clientSocket.on('disconnect', () => {
      this.emit('disconnect')
      removeSocketClientFromGlobalStore(this.context().global, this.id)
      this.send({ payload: { socketId: this.name, status: 'disconnected' } });
      this.status({ fill: 'red', shape: 'ring', text: 'disconnected' });
    });

    this.clientSocket.on('connect_error', (err) => {
      this.emit('connect_error')
      if (err) {
        this.status({ fill: 'red', shape: 'ring', text: 'disconnected' });
        this.send({ payload: { socketId: this.name, status: 'disconnected' } });
      }
    });

    this.on('close', (removed : boolean, done : () => void) => {
      this.clientSocket.disconnect();
      this.status({});
      if (removed) {
        removeSocketClientFromGlobalStore(this.context().global, this.id)
      }
      done();
    });

  }

  RED.nodes.registerType("owa-server", OwaServerNodeConstructor);
};

const getSocketStore = (globalContext : NodeContextData) => {
  let store : ClientStore = globalContext.get(CLIENT_STORE) as ClientStore
  if(!store) {
    //create global client store
      globalContext.set(CLIENT_STORE, {})
  }
  store = globalContext.get(CLIENT_STORE) as ClientStore
  return store;
}

const addSocketClientToGlobalStore = (globalContext : NodeContextData, socketClientId : string, socketClient: SocketClient) => {
  const store = getSocketStore(globalContext)
  if(store[socketClientId]) {
    //client already exists
  } else {
    globalContext.set(CLIENT_STORE, {
      ...store,
      [socketClientId] : socketClient
    })
  }
} 

const removeSocketClientFromGlobalStore = (globalContext : NodeContextData, socketClientId : string) => {
  const store = getSocketStore(globalContext)
  if(store[socketClientId]) {
    delete store[socketClientId]
    globalContext.set(CLIENT_STORE, {
      ...store
    })
  } else {
    //client does not exist
  }
} 

export = nodeInit;
