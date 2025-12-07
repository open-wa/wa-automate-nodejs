import { OwaServerNode } from './../owa-server/modules/types';
import { NodeContextData, NodeInitializer } from "node-red";
import { ListenNode, ListenNodeDef } from "./modules/types";
import { ClientStore, CLIENT_STORE } from '../shared/types';
import { Message } from '@open-wa/wa-automate-types-only';

const nodeInit: NodeInitializer = (RED): void => {
  function ListenNodeConstructor(
    this: ListenNode,
    config: ListenNodeDef
  ): void {
    RED.nodes.createNode(this, config);
    this.name = config.name;
    this.listener = config.listener;
    let listenerSet = false;
    this.listenerFn = (message : Message)=>{
      this.send({
        payload: message
      });
    }
    if(config.server) {
      this.server = RED.nodes.getNode(config.server) as OwaServerNode;
      const client = () => getSocket(this.context().global, config.server);

      try {
        RED.httpAdmin.get("/node_red_init_listen", (req, res) => {
          if(!this.server?.client.socket){
            return "Please set a server first!"
          }
          this.server?.client.socket.emit("node_red_init_listen",(data:unknown)=>{
            res.json(data)
          })
        })
      } catch (error) {
        console.log(error);
      }

      const registerCallback = () => {
        if(listenerSet) return;
        if(this.callbackId) client()?.stopListener(this.listener, this.callbackId)
        client()?.listen(this.listener,this.listenerFn).then(callbackId => {
          this.callbackId = callbackId
          listenerSet = true;
        })
      }
      if(config.server)
      if (this.server) {
        if(client()?.socket.connected) {
        registerCallback();
        this.status({ fill: 'green', shape: 'dot', text: 'listening' });
        } else {
          this.status({ fill: 'red', shape: 'ring', text: 'not connected' });
        }
      } else {
          // No config node configured  
          this.status({ fill: 'red', shape: 'ring', text: 'No Server!' });
          this.error("No Server!")
      }
      this.server.addListener("connected", () =>{
        this.status({ fill: 'green', shape: 'dot', text: 'listening' });
        registerCallback();
      })

      this.server.addListener("disconnect", () =>{
        this.status({ fill: 'red', shape: 'ring', text: 'Disconnected!' });
      })

      this.server.addListener("connect_error", () =>{
        this.status({ fill: 'red', shape: 'ring', text: 'Disconnected!' });
      })

      this.on('close', (done : () => void) => {
        listenerSet = false;
        client()?.stopListener(this.listener, this.callbackId)
        this.status({});
        done();
      });
    }
  }

  RED.nodes.registerType("listen", ListenNodeConstructor);
};


const getSocket = (globalContext : NodeContextData, socketId: string) => {
  let store : ClientStore = globalContext.get(CLIENT_STORE) as ClientStore
  if(!store) {
    //create global client store
      globalContext.set(CLIENT_STORE, {})
  }
  store = globalContext.get(CLIENT_STORE) as ClientStore
  return store[socketId];
}

export = nodeInit;
