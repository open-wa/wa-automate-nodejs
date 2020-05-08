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
  _spinner : Spinnies.Spinner;

  constructor(sessionId: string, eventNamespace: string, disableSpins: boolean = false){
    super(sessionId,eventNamespace);
    this._spinner = new Spinnies({ color: 'blue', succeedColor: 'green', spinner, disableSpins});
  }
  
  
  start(eventMessage:string){
    this._spinner.add(this.sessionId, { text: eventMessage });
    this.emit(eventMessage);
  }

  info(eventMessage:string){
    this._spinner.update(this.sessionId, { text: eventMessage });
    this.emit(eventMessage);
  }

  fail(eventMessage:string){
    this._spinner.fail(this.sessionId, { text: eventMessage });
    this.emit(eventMessage);
  }
  
  succeed(eventMessage ?: string){
    this._spinner.succeed(this.sessionId, { text: eventMessage });
    this.emit(eventMessage||'SUCCESS');
  }
}