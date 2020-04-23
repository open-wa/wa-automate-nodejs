import {EventEmitter2} from 'eventemitter2';
import Spinnies from "spinnies";
const spinner = { 
  "interval": 80,
  "frames": [
    "🌑 ",
    "🌒 ",
    "🌓 ",
    "🌔 ",
    "🌕 ",
    "🌖 ",
    "🌗 ",
    "🌘 "
  ]}

export const ev = new EventEmitter2({
  wildcard:true,
});

export class EvEmitter {

  sessionId: string;
  eventNamespace: string;

  constructor(sessionId: string, eventNamespace: string){
    this.sessionId = sessionId;
    this.eventNamespace = eventNamespace;
  }

  emit(data:any, eventNamespaceOverride ?: string){
    ev.emit(`${eventNamespaceOverride||this.eventNamespace}.${this.sessionId}`,data,this.sessionId,this.eventNamespace);
    // ev.emit(`${this.sessionId}.${this.eventNamespace}`,data,this.sessionId,this.eventNamespace);
  }
}

export class Spin extends EvEmitter{
  spinner = new Spinnies({ color: 'blue', succeedColor: 'green', spinner });
  
  start(eventMessage:string){
    this.spinner.add(this.sessionId, { text: eventMessage });
    this.emit(eventMessage);
  }

  info(eventMessage:string){
    this.spinner.update(this.sessionId, { text: eventMessage });
    this.emit(eventMessage);
  }

  fail(eventMessage:string){
    this.spinner.fail(this.sessionId, { text: eventMessage });
    this.emit(eventMessage);
  }
  
  succeed(eventMessage ?: string){
    this.spinner.succeed(this.sessionId, { text: eventMessage });
    this.emit(eventMessage||'SUCCESS');
  }
}