"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoOpTransport = exports.LogToEvTransport = void 0;
const winston_transport_1 = __importDefault(require("winston-transport"));
const events_1 = require("../controllers/events");
class LogToEvTransport extends winston_transport_1.default {
    constructor(opts) {
        super(opts);
    }
    log(info, callback) {
        setImmediate(() => {
            this.emit('logged', info);
        });
        events_1.ev.emit(`DEBUG.${info.level}`, Object.keys(info).reduce((p, c) => (p = { ...p, [c]: info[c] }), {}));
        if (callback)
            return callback(null, true);
    }
}
exports.LogToEvTransport = LogToEvTransport;
class NoOpTransport extends winston_transport_1.default {
    constructor(opts) {
        super(opts);
    }
    log(info, callback) {
        setImmediate(() => {
            this.emit('logged', info);
        });
        if (callback)
            return callback(null, true);
    }
}
exports.NoOpTransport = NoOpTransport;
//# sourceMappingURL=custom_transport.js.map