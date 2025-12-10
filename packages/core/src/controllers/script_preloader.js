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
Object.defineProperty(exports, "__esModule", { value: true });
exports.scriptLoader = exports.ScriptLoader = void 0;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const logging_1 = require("../logging/logging");
const read = (_path) => new Promise((resolve, reject) => {
    fs.readFile(require.resolve(path.join(__dirname, '../lib', _path)), 'utf8', (err, file) => {
        if (err)
            reject(err);
        resolve(file);
    });
});
class ScriptLoader {
    constructor() {
        this.scripts = [
            'jsSha.min.js',
            'qr.min.js',
            'base64.js',
            'hash.js',
            'wapi.js',
            'launch.js'
        ];
        this.contentRegistry = {};
        this.contentRegistry = {};
    }
    async loadScripts() {
        await Promise.all(this.scripts.map(this.getScript.bind(this)));
        return this.contentRegistry;
    }
    async getScript(scriptName) {
        if (!this.contentRegistry[scriptName]) {
            this.contentRegistry[scriptName] = await read(scriptName);
            logging_1.log.info(`SCRIPT READY: ${scriptName} ${this.contentRegistry[scriptName].length}`);
        }
        else
            logging_1.log.info(`GET SCRIPT: ${scriptName} ${this.contentRegistry[scriptName].length}`);
        return this.contentRegistry[scriptName];
    }
    flush() {
        this.contentRegistry = {};
    }
    getScripts() {
        return this.contentRegistry;
    }
}
exports.ScriptLoader = ScriptLoader;
const scriptLoader = new ScriptLoader();
exports.scriptLoader = scriptLoader;
//# sourceMappingURL=script_preloader.js.map