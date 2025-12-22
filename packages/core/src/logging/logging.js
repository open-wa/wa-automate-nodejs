"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupLogging = exports.addSysLogTransport = exports.addRotateFileLogTransport = exports.log = void 0;
const os_1 = __importDefault(require("os"));
const winston = __importStar(require("winston"));
const winston_daily_rotate_file_1 = __importDefault(require("winston-daily-rotate-file"));
const winston_syslog_1 = require("winston-syslog");
const custom_transport_1 = require("./custom_transport");
const { combine, timestamp } = winston.format;
const traverse_1 = __importDefault(require("traverse"));
const full_1 = require("klona/full");
const truncateLength = 200;
let _evSet = false, _consoleSet = false, d = Date.now();
const sensitiveKeys = [
    /cookie/i,
    /sessionData/i,
    /passw(or)?d/i,
    /^pw$/,
    /^pass$/i,
    /secret/i,
    /token/i,
    /api[-._]?key/i,
];
const getCircularReplacer = () => {
    const seen = new WeakSet();
    return (_key, value) => {
        if (typeof value === "object" && value !== null) {
            if (seen.has(value)) {
                return "[Circular]";
            }
            seen.add(value);
        }
        return value;
    };
};
const k = (obj) => {
    try {
        return (0, full_1.klona)(obj);
    }
    catch (error) {
        return (0, full_1.klona)(JSON.parse(JSON.stringify(obj, getCircularReplacer())));
    }
};
function isSensitiveKey(keyStr) {
    if (keyStr && typeof keyStr == "string") {
        return sensitiveKeys.some(regex => regex.test(keyStr));
    }
}
function redactObject(obj) {
    (0, traverse_1.default)(obj).forEach(function redactor() {
        if (isSensitiveKey(this.key)) {
            this.update("[REDACTED]");
        }
        else if (typeof this.node === 'string' && this.node.length > truncateLength) {
            this.update(truncate(this.node, truncateLength));
        }
    });
}
function redact(obj) {
    const copy = k(obj);
    redactObject(copy);
    const splat = copy[Symbol.for("splat")];
    redactObject(splat);
    return copy;
}
function truncate(str, n) {
    return str.length > n ? str.substr(0, n - 1) + '...[TRUNCATED]...' : str;
}
const formatRedact = winston.format(redact);
const stringSaver = winston.format((info) => {
    const copy = k(info);
    const splat = copy[Symbol.for("splat")];
    if (splat) {
        copy.message = `${copy.message} ${splat.filter((x) => typeof x !== 'object').join(' ')}`;
        copy[Symbol.for("splat")] = splat.filter((x) => typeof x == 'object');
        return copy;
    }
    return info;
});
const placeholderTransport = new custom_transport_1.NoOpTransport();
const makeLogger = () => winston.createLogger({
    format: combine(stringSaver(), timestamp(), winston.format.json(), formatRedact(), winston.format.splat(), winston.format.simple()),
    levels: winston.config.syslog.levels,
    transports: [placeholderTransport]
});
exports.log = makeLogger();
if (exports.log.warning && !exports.log.warn)
    exports.log.warn = exports.log.warning;
if (exports.log.alert && !exports.log.help)
    exports.log.help = exports.log.alert;
const addRotateFileLogTransport = (options = {}) => {
    exports.log.add(new winston_daily_rotate_file_1.default({
        filename: 'application-%DATE%.log',
        datePattern: 'YYYY-MM-DD-HH',
        zippedArchive: true,
        maxSize: '2m',
        maxFiles: '14d',
        ...options,
    }));
};
exports.addRotateFileLogTransport = addRotateFileLogTransport;
const addSysLogTransport = (options = {}) => {
    exports.log.add(new winston_syslog_1.Syslog({
        localhost: os_1.default.hostname(),
        ...options,
    }));
};
exports.addSysLogTransport = addSysLogTransport;
const enableConsoleLogger = (options = {}) => {
    if (_consoleSet)
        return;
    exports.log.add(new winston.transports.Console({
        level: 'debug',
        timestamp: timestamp(),
        ...options,
    }));
    _consoleSet = true;
};
function enableLogToEv(options = {}) {
    if (_evSet)
        return;
    exports.log.add(new custom_transport_1.LogToEvTransport({
        format: winston.format.json(),
        ...options,
    }));
    _evSet = true;
}
const setupLogging = (logging, sessionId = "session") => {
    const currentlySetup = [];
    const _logging = logging.map((l) => {
        if (l.done)
            return l;
        if (l.type === 'console') {
            enableConsoleLogger({
                ...(l.options || {}),
            });
        }
        else if (l.type === 'ev') {
            enableLogToEv({
                ...(l.options || {}),
            });
        }
        else if (l.type === 'file') {
            (0, exports.addRotateFileLogTransport)({
                ...(l.options || {}),
            });
        }
        else if (l.type === 'syslog') {
            (0, exports.addSysLogTransport)({
                ...(l.options || {}),
                appName: `owa-${sessionId}-${d}`
            });
        }
        currentlySetup.push(l);
        return {
            ...l,
            done: true,
        };
    });
    currentlySetup.map((l) => {
        exports.log.info(`Set up logging for ${l.type}`, l.options);
        return l;
    });
    return _logging;
};
exports.setupLogging = setupLogging;
//# sourceMappingURL=logging.js.map