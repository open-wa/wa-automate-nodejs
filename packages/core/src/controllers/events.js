"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Spin = exports.EvEmitter = exports.ev = void 0;
const eventemitter2_1 = require("eventemitter2");
const spinnies_1 = __importDefault(require("spinnies"));
const logging_1 = require("../logging/logging");
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
exports.ev = new eventemitter2_1.EventEmitter2({
    wildcard: true,
});
let globalSpinner;
const getGlobalSpinner = (disableSpins = false) => {
    if (!globalSpinner)
        globalSpinner = new spinnies_1.default({ color: 'blue', succeedColor: 'green', spinner, disableSpins });
    return globalSpinner;
};
class EvEmitter {
    constructor(sessionId, eventNamespace) {
        this.bannedTransports = [
            "sessionData",
            "sessionDataBase64",
            "qr",
        ];
        this.sessionId = sessionId;
        this.eventNamespace = eventNamespace;
    }
    emit(data, eventNamespaceOverride) {
        const eventName = `${eventNamespaceOverride || this.eventNamespace}.${this.sessionId}`;
        const sessionId = this.sessionId;
        const eventNamespace = eventNamespaceOverride || this.eventNamespace;
        exports.ev.emit(eventName, data, sessionId, eventNamespace);
        if (!this.bannedTransports.find(x => eventNamespace == x))
            logging_1.log.info(typeof data === 'string' ? data : eventName, {
                eventName,
                data,
                sessionId,
                eventNamespace
            });
    }
    emitAsync(data, eventNamespaceOverride) {
        const eventName = `${eventNamespaceOverride || this.eventNamespace}.${this.sessionId}`;
        const sessionId = this.sessionId;
        const eventNamespace = eventNamespaceOverride || this.eventNamespace;
        if (!this.bannedTransports.find(x => eventNamespace == x))
            logging_1.log.info(typeof data === 'string' ? data : eventName, {
                eventName,
                data,
                sessionId,
                eventNamespace
            });
        return exports.ev.emitAsync(eventName, data, sessionId, eventNamespace);
    }
}
exports.EvEmitter = EvEmitter;
class Spin extends EvEmitter {
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
//# sourceMappingURL=events.js.map