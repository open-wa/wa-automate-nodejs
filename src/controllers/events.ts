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
let globalSpinner;


const getGlobalSpinner = (disableSpins: boolean = false) => {
  if(!globalSpinner) globalSpinner = new Spinnies({ color: 'blue', succeedColor: 'green', spinner, disableSpins});
  return globalSpinner;
}

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
  _shouldEmit: boolean;
  _spinId: string;

  constructor(sessionId: string, eventNamespace: string, disableSpins: boolean = false, shouldEmit:boolean = true){
    super(sessionId,eventNamespace);
    this._spinId = sessionId+"_"+eventNamespace
    this._spinner = getGlobalSpinner(disableSpins);
    this._shouldEmit = shouldEmit
  }
  
  
  start(eventMessage:string){
    this._spinner.add(this._spinId, { text: eventMessage });
    if(this._shouldEmit) this.emit(eventMessage);
  }

  info(eventMessage:string){
    this._spinner.update(this._spinId, { text: eventMessage });
    if(this._shouldEmit) this.emit(eventMessage);
  }

  fail(eventMessage:string){
    this._spinner.fail(this._spinId, { text: eventMessage });
    if(this._shouldEmit) this.emit(eventMessage);
  }
  
  succeed(eventMessage ?: string){
    this._spinner.succeed(this._spinId, { text: eventMessage });
    if(this._shouldEmit) this.emit(eventMessage||'SUCCESS');
  }

  remove() {
    this._spinner.remove(this._spinId);
  }
}