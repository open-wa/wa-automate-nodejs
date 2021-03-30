"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Spin = exports.EvEmitter = exports.ev = void 0;
const eventemitter2_1 = require("eventemitter2");
const spinnies_1 = __importDefault(require("spinnies"));
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
    ]
};
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
exports.ev = new eventemitter2_1.EventEmitter2({
    wildcard: true,
});
/** @internal */
let globalSpinner;
const getGlobalSpinner = (disableSpins = false) => {
    if (!globalSpinner)
        globalSpinner = new spinnies_1.default({ color: 'blue', succeedColor: 'green', spinner, disableSpins });
    return globalSpinner;
};
/**
 * @internal
 */
class EvEmitter {
    constructor(sessionId, eventNamespace) {
        this.sessionId = sessionId;
        this.eventNamespace = eventNamespace;
    }
    emit(data, eventNamespaceOverride) {
        exports.ev.emit(`${eventNamespaceOverride || this.eventNamespace}.${this.sessionId}`, data, this.sessionId, eventNamespaceOverride || this.eventNamespace);
        // ev.emit(`${this.sessionId}.${this.eventNamespace}`,data,this.sessionId,this.eventNamespace);
    }
}
exports.EvEmitter = EvEmitter;
/**
 * @internal
 */
class Spin extends EvEmitter {
    /**
     *
     * @param sessionId The session id of the session. @default `session`
     * @param eventNamespace The namespace of the event
     * @param disableSpins If the spinnies should be animated @default `false`
     * @param shouldEmit If the changes in the spinner should emit an event on the event emitter at `${eventNamesapce}.${sessionId}`
     */
    constructor(sessionId = 'session', eventNamespace, disableSpins = false, shouldEmit = true) {
        super(sessionId, eventNamespace);
        if (!sessionId)
            sessionId = 'session';
        this._spinId = sessionId + "_" + eventNamespace;
        this._spinner = getGlobalSpinner(disableSpins);
        this._shouldEmit = shouldEmit;
    }
    start(eventMessage, indent) {
        this._spinner.add(this._spinId, { text: eventMessage, indent });
        if (this._shouldEmit)
            this.emit(eventMessage);
    }
    info(eventMessage) {
        if (!this._spinner.pick(this._spinId))
            this.start('');
        this._spinner.update(this._spinId, { text: eventMessage });
        if (this._shouldEmit)
            this.emit(eventMessage);
    }
    fail(eventMessage) {
        if (!this._spinner.pick(this._spinId))
            this.start('');
        this._spinner.fail(this._spinId, { text: eventMessage });
        if (this._shouldEmit)
            this.emit(eventMessage);
    }
    succeed(eventMessage) {
        if (!this._spinner.pick(this._spinId))
            this.start('');
        this._spinner.succeed(this._spinId, { text: eventMessage });
        if (this._shouldEmit)
            this.emit(eventMessage || 'SUCCESS');
    }
    remove() {
        this._spinner.remove(this._spinId);
    }
}
exports.Spin = Spin;
