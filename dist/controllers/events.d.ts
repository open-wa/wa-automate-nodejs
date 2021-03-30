import { EventEmitter2 } from 'eventemitter2';
import Spinnies from "spinnies";
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
export declare const ev: EventEmitter2;
/**
 * @internal
 */
export declare class EvEmitter {
    sessionId: string;
    eventNamespace: string;
    constructor(sessionId: string, eventNamespace: string);
    emit(data: any, eventNamespaceOverride?: string): void;
}
/**
 * @internal
 */
export declare class Spin extends EvEmitter {
    _spinner: Spinnies.Spinner;
    _shouldEmit: boolean;
    _spinId: string;
    /**
     *
     * @param sessionId The session id of the session. @default `session`
     * @param eventNamespace The namespace of the event
     * @param disableSpins If the spinnies should be animated @default `false`
     * @param shouldEmit If the changes in the spinner should emit an event on the event emitter at `${eventNamesapce}.${sessionId}`
     */
    constructor(sessionId: string, eventNamespace: string, disableSpins?: boolean, shouldEmit?: boolean);
    start(eventMessage: string, indent?: number): void;
    info(eventMessage: string): void;
    fail(eventMessage: string): void;
    succeed(eventMessage?: string): void;
    remove(): void;
}
