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


/**
 * This is the library's event emitter. Use this to listen to internal events of the library like so:
 * ```javascript
 * ev.on('event', callback)
 * ``` 
 * 
 * The event you want to listen to is in the format of [namespace].[sessionId]
 * 
 * The event can include wildcards.
 * 
 * For example, to listen to all qr code events, the event will be `qr.**`. e.g:
 * 
 * ```javascript
 * ev.on('qr.**',...
 * ```
 * 
 * Listen to all sessionData events
 * 
 * ```javascript
 * ev.on('sessionData.**',...
 * ```
 * 
 * Listen to all events from session1
 * 
 * ```javascript
 * ev.on('**.session1',...
 * ```
 * 
 * Listen to all events
 * 
 * ```javascript
 * ev.on('**.**',...
 * ```
 * 
 * ev always emits data, sessionId and the namespace which is helpful to know if there are multiple sessions or you're listening to events from all namespaces
 * 
 * ```javascript
 * ev.on('**.**', (data, sessionId, namespace) => {
 * 
 *  console.log(`${namespace} event detected for session ${sessionId}`, data)
 * 
 * });
 * ```
 * 
 * 
 * 
 */
export const ev = new EventEmitter2({
  wildcard:true,
});
/** @internal */
let globalSpinner;


const getGlobalSpinner = (disableSpins = false) => {
  if(!globalSpinner) globalSpinner = new Spinnies({ color: 'blue', succeedColor: 'green', spinner, disableSpins});
  return globalSpinner;
}

/**
 * @internal
 */
export class EvEmitter {

  sessionId: string;
  eventNamespace: string;

  constructor(sessionId: string, eventNamespace: string){
    this.sessionId = sessionId;
    this.eventNamespace = eventNamespace;
  }

  emit(data : unknown, eventNamespaceOverride ?: string) : void {
    ev.emit(`${eventNamespaceOverride||this.eventNamespace}.${this.sessionId}`,data,this.sessionId,eventNamespaceOverride||this.eventNamespace);
    // ev.emit(`${this.sessionId}.${this.eventNamespace}`,data,this.sessionId,this.eventNamespace);
  }
}

/**
 * @internal
 */
export class Spin extends EvEmitter{
  _spinner : Spinnies.Spinner;
  _shouldEmit: boolean;
  _spinId: string;

  /**
   * 
   * @param sessionId The session id of the session. @default `session`
   * @param eventNamespace The namespace of the event
   * @param disableSpins If the spinnies should be animated @default `false`
   * @param shouldEmit If the changes in the spinner should emit an event on the event emitter at `${eventNamesapce}.${sessionId}`
   */
  constructor(sessionId = 'session', eventNamespace: string, disableSpins = false, shouldEmit = true){
    super(sessionId,eventNamespace);
    if(!sessionId) sessionId = 'session';
    this._spinId = sessionId+"_"+eventNamespace
    this._spinner = getGlobalSpinner(disableSpins);
    this._shouldEmit = shouldEmit
  }
  
  
  start(eventMessage:string, indent?: number) : void {
    this._spinner.add(this._spinId, { text: eventMessage, indent });
    if(this._shouldEmit) this.emit(eventMessage);
  }

  info(eventMessage:string) : void {
    if(!this._spinner.pick(this._spinId)) this.start('');
    this._spinner.update(this._spinId, { text: eventMessage });
    if(this._shouldEmit) this.emit(eventMessage);
  }

  fail(eventMessage:string) : void {
    if(!this._spinner.pick(this._spinId)) this.start('');
    this._spinner.fail(this._spinId, { text: eventMessage });
    if(this._shouldEmit) this.emit(eventMessage);
  }
  
  succeed(eventMessage ?: string) : void {
    if(!this._spinner.pick(this._spinId)) this.start('');
    this._spinner.succeed(this._spinId, { text: eventMessage });
    if(this._shouldEmit) this.emit(eventMessage||'SUCCESS');
  }

  remove() : void {
    this._spinner.remove(this._spinId);
  }
}