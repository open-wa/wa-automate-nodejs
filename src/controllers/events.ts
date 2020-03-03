import {EventEmitter2} from 'eventemitter2';
import ora from 'ora';

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
  spinner = ora();
  
  start(eventMessage:string){
    this.spinner.start(eventMessage);
    this.emit(eventMessage);
  }

  info(eventMessage:string){
    this.spinner.info(eventMessage);
    this.emit(eventMessage);
  }

  fail(eventMessage:string){
    this.spinner.fail(eventMessage);
    this.emit(eventMessage);
  }
  
  succeed(eventMessage ?: string){
    this.spinner.succeed(eventMessage);
    this.emit(eventMessage||'SUCCESS');
  }
}