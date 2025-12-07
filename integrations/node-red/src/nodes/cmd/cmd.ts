import { Client } from "@open-wa/wa-automate-types-only";
import { NodeInitializer } from "node-red";
import { OwaServerNode } from "../owa-server/modules/types";
import { CmdNode, CmdNodeDef } from "./modules/types";

function tryParseJSONObject (jsonString : unknown){
  if(typeof jsonString === "object") return jsonString;
  try {
    //@ts-ignore
      var o = JSON.parse(jsonString);

      // Handle non-exception-throwing cases:
      // Neither JSON.parse(false) or JSON.parse(1234) throw errors, hence the type-checking,
      // but... JSON.parse(null) returns null, and typeof null === "object", 
      // so we must check for that, too. Thankfully, null is falsey, so this suffices:
      if (o && typeof o === "object") {
          return o;
      }
  }
  catch (e) { }

  return false;
};

const nodeInit: NodeInitializer = (RED): void => {
  function CmdNodeConstructor(
    this: CmdNode,
    config: CmdNodeDef
  ): void {
    RED.nodes.createNode(this, config);

    this.name = config.name;
    this.method = config.method;
    this.args = config.args;
    this.timeout = (config.timeout ==="-1") ? -1 : parseFloat(config.timeout as string || "30")*1000;

    if (isNaN(this.timeout)) {
      this.timeout = 30000;
    }


    RED.httpAdmin.get("/node_red_init_call", (req, res) => {
      this.server = RED.nodes.getNode(config.server) as OwaServerNode;
      if(!this.server?.client.socket){
        return "Please set a server first!"
      }
      this.server?.client.socket.emit("node_red_init_call",(data:unknown)=>res.json(data))
    })
    
    this.on("input", (msg, send, done) => {
      const m = msg as {
        method?: string,
        args?: {
          [k: string]: boolean | string | number
        }
      }
      const method = m.method || this.method;
      let argmnts = m.args || {
        ...(tryParseJSONObject(this.args) || {}),
        ...(tryParseJSONObject(msg.payload) || {}),
      };
      argmnts = tryParseJSONObject(argmnts) || argmnts;
      let _t : any ;

      if (config.server)
        this.server = RED.nodes.getNode(config.server) as OwaServerNode;
      const executeCommand = () => this.server?.client.ask(method as keyof Client, argmnts)
      const timeoutPomise = this.timeout === -1 ? false : new Promise((res) => {
        _t = setTimeout(() => {
          res('TIMEOUT')
        }, this.timeout)
      });
      const proms = timeoutPomise ? () => Promise.race([executeCommand(), timeoutPomise]) : () => executeCommand()
      const promWithHandler = () => (proms() as Promise<any>).then((payload)=>{
        if(_t) clearTimeout(_t)
        if(payload === "TIMEOUT") this.status({ fill: 'red', shape: 'ring', text: `Timed out. Took longer than ${(this.timeout || 1000)/1000} seconds` })
        else {
          this.status({ fill: 'green', shape: 'dot', text: 'Done' })
          send({
            payload
          })
        }
        
      })
      if (this.server && this.server.client) {
        this.status({ fill: 'yellow', shape: 'ring', text: 'Executing..' });
        if (this.server.clientSocket.connected) {
          promWithHandler()
        } else {
          this.status({ fill: 'red', shape: 'ring', text: 'Waiting for socket connection..' });
          this.server.addListener("connected", () => {
            promWithHandler()
          });
        }
      } else {
        // No config node configured
        this.error("No Server!")
      }

      done();
    });
  }

  RED.nodes.registerType("cmd", CmdNodeConstructor);
};

export = nodeInit;
