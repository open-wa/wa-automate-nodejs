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
exports.QRManager = exports.phoneIsOutOfReach = exports.sessionDataInvalid = exports.waitForRipeSession = exports.needsToScan = exports.isAuthenticated = void 0;
const qrcode = __importStar(require("qrcode-terminal"));
const rxjs_1 = require("rxjs");
const events_1 = require("./events");
const initializer_1 = require("./initializer");
const tools_1 = require("../utils/tools");
const browser_1 = require("./browser");
const axios_1 = __importDefault(require("axios"));
const logging_1 = require("../logging/logging");
const boxen_1 = __importDefault(require("boxen"));
const isAuthenticated = (waPage) => (0, rxjs_1.race)((0, exports.needsToScan)(waPage), isInsideChat(waPage), (0, exports.sessionDataInvalid)(waPage)).toPromise();
exports.isAuthenticated = isAuthenticated;
const needsToScan = (waPage) => {
    return (0, rxjs_1.from)(new Promise(async (resolve) => {
        try {
            const elementResult = await Promise.race([
                waPage.waitForSelector("canvas[aria-label='Scan this QR code to link a device!']", { timeout: 0 }).catch(() => { }),
                waPage.waitForSelector("canvas[aria-label]", { timeout: 0 }).catch(() => { })
            ]);
            logging_1.log.info("🚀 ~ needsToScan ~ elementResult:", elementResult);
            resolve(false);
        }
        catch (error) {
            console.log("needsToScan -> error", error);
            logging_1.log.error("needsToScan -> error", error);
        }
    }));
};
exports.needsToScan = needsToScan;
const isInsideChat = (waPage) => {
    return (0, rxjs_1.from)(waPage
        .waitForFunction("!!window.WA_AUTHENTICATED || (document.getElementsByClassName('app')[0] && document.getElementsByClassName('app')[0].attributes && !!document.getElementsByClassName('app')[0].attributes.tabindex) || (document.getElementsByClassName('two')[0] && document.getElementsByClassName('two')[0].attributes && !!document.getElementsByClassName('two')[0].attributes.tabindex)", { timeout: 0 })
        .then(() => true));
};
const isTosBlocked = (waPage) => {
    return (0, rxjs_1.from)(waPage
        .waitForFunction(`document.getElementsByTagName("html")[0].classList[0] === 'no-js'`, { timeout: 0 })
        .then(() => false));
};
const waitForRipeSession = async (waPage, waitForRipeSessionTimeout) => {
    try {
        await waPage.waitForFunction(`window.isRipeSession()`, { timeout: (waitForRipeSessionTimeout ?? 5) * 1000, polling: 1000 });
        return true;
    }
    catch (error) {
        return false;
    }
};
exports.waitForRipeSession = waitForRipeSession;
const sessionDataInvalid = async (waPage) => {
    const check = `Object.keys(localStorage).includes("old-logout-cred")`;
    await waPage
        .waitForFunction(check, { timeout: 0, polling: 'mutation' });
    return 'NUKE';
};
exports.sessionDataInvalid = sessionDataInvalid;
const phoneIsOutOfReach = async (waPage) => {
    return await waPage
        .waitForFunction('document.querySelector("body").innerText.includes("Trying to reach phone")', { timeout: 0, polling: 'mutation' })
        .then(() => true)
        .catch(() => false);
};
exports.phoneIsOutOfReach = phoneIsOutOfReach;
class QRManager {
    constructor(config = null) {
        this.qrEv = null;
        this.qrNum = 0;
        this.hash = 'START';
        this.config = null;
        this.firstEmitted = false;
        this._internalQrPngLoaded = false;
        this.qrCheck = `document.querySelector("canvas[aria-label]")?document.querySelector("canvas[aria-label]").parentElement.getAttribute("data-ref"):false`;
        this.config = config;
        this.setConfig(this.config);
    }
    setConfig(config) {
        this.config = config;
        this.qrEvF(this.config);
    }
    qrEvF(config = this.config) {
        if (!this.qrEv)
            this.qrEv = new events_1.EvEmitter(config.sessionId || 'session', 'qr');
        return this.qrEv;
    }
    async grabAndEmit(qrData, waPage, config, spinner) {
        const isLinkCode = qrData.length === 9;
        this.qrNum++;
        if (config.qrMax && this.qrNum > config.qrMax) {
            spinner.info('QR Code limit reached, exiting...');
            await (0, browser_1.kill)(waPage, null, true, null, "QR_LIMIT_REACHED");
        }
        const qrEv = this.qrEvF(config);
        if ((!this.qrNum || this.qrNum == 1) && browser_1.BROWSER_START_TS)
            spinner.info(`First QR: ${Date.now() - browser_1.BROWSER_START_TS} ms`);
        if (qrData) {
            qrEv.emit(qrData, `qrData`);
            if (!config.qrLogSkip) {
                if (isLinkCode) {
                    console.log((0, boxen_1.default)(qrData, { title: `ENTER THIS CODE ON THE HOST ACCOUNT DEVICE: ${config.sessionId}`, padding: 1, titleAlignment: 'center' }));
                }
                else {
                    qrcode.generate(qrData, { small: true }, terminalQrCode => {
                        console.log((0, boxen_1.default)(terminalQrCode, { title: config.sessionId, padding: 1, titleAlignment: 'center' }));
                    });
                }
            }
            else {
                console.log(`New QR Code generated. Not printing in console because qrLogSkip is set to true`);
                logging_1.log.info(`New QR Code generated. Not printing in console because qrLogSkip is set to true`);
            }
        }
        if (!this._internalQrPngLoaded) {
            logging_1.log.info("Waiting for internal QR renderer to load");
            const t = await (0, tools_1.timePromise)(() => waPage.waitForFunction(`window.getQrPng || false`, { timeout: 0, polling: 'mutation' }));
            logging_1.log.info(`Internal QR renderer loaded in ${t} ms`);
            this._internalQrPngLoaded = true;
        }
        try {
            const qrPng = isLinkCode ? qrData : await waPage.evaluate(`window.getQrPng()`);
            if (qrPng) {
                qrEv.emit(qrPng);
                (0, tools_1.processSend)('ready');
                if (config.ezqr) {
                    const host = 'https://qr.openwa.cloud/';
                    await axios_1.default.post(host, {
                        value: qrPng,
                        hash: this.hash
                    }).then(({ data }) => {
                        if (this.hash === 'START') {
                            const qrUrl = `${host}${data}`;
                            qrEv.emit(qrUrl, `qrUrl`);
                            console.log(`Scan the qr code at ${qrUrl}`);
                            logging_1.log.info(`Scan the qr code at ${qrUrl}`);
                        }
                        this.hash = data;
                    }).catch(e => {
                        console.error(e);
                        this.hash = 'START';
                    });
                }
            }
            else {
                spinner.info("Something went wrong while retreiving new the QR code but it should not affect the session launch procedure.");
            }
        }
        catch (error) {
            const lr = await waPage.evaluate("window.launchres");
            console.log(lr);
            logging_1.log.info('smartQr -> error', { lr });
            spinner.info(`Something went wrong while retreiving new the QR code but it should not affect the session launch procedure: ${error.message}`);
        }
    }
    async linkCode(waPage, config, spinner) {
        const evalResult = await waPage.evaluate("window.Store && window.Store.State");
        if (evalResult === false) {
            console.log('Seems as though you have been TOS_BLOCKed, unable to refresh QR Code. Please see https://github.com/open-wa/wa-automate-nodejs#best-practice for information on how to prevent this from happeing. You will most likely not get a QR Code');
            logging_1.log.warn('Seems as though you have been TOS_BLOCKed, unable to refresh QR Code. Please see https://github.com/open-wa/wa-automate-nodejs#best-practice for information on how to prevent this from happeing. You will most likely not get a QR Code');
            if (config.throwErrorOnTosBlock)
                throw new Error('TOSBLOCK');
        }
        const isAuthed = await (0, exports.isAuthenticated)(waPage);
        if (isAuthed)
            return true;
        const _hasDefaultStateYet = await waPage.evaluate("!!(window.Store &&  window.Store.State && window.Store.State.Socket)");
        if (!_hasDefaultStateYet) {
            await (0, tools_1.timeout)(2000);
        }
        spinner.info('Link Code requested, please use the link code to login from your host account device');
        const linkCode = await waPage.evaluate((number) => window['linkCode'](number), config?.linkCode);
        spinner?.succeed(`Link Code please use this to login from your host account device: ${linkCode}`);
        await this.grabAndEmit(linkCode, waPage, config, spinner);
        return await isInsideChat(waPage).toPromise();
    }
    async smartQr(waPage, config, spinner) {
        const evalResult = await waPage.evaluate("window.Store && window.Store.State");
        if (evalResult === false) {
            console.log('Seems as though you have been TOS_BLOCKed, unable to refresh QR Code. Please see https://github.com/open-wa/wa-automate-nodejs#best-practice for information on how to prevent this from happeing. You will most likely not get a QR Code');
            logging_1.log.warn('Seems as though you have been TOS_BLOCKed, unable to refresh QR Code. Please see https://github.com/open-wa/wa-automate-nodejs#best-practice for information on how to prevent this from happeing. You will most likely not get a QR Code');
            if (config.throwErrorOnTosBlock)
                throw new Error('TOSBLOCK');
        }
        const isAuthed = await (0, exports.isAuthenticated)(waPage);
        if (isAuthed)
            return true;
        const _hasDefaultStateYet = await waPage.evaluate("!!(window.Store &&  window.Store.State && window.Store.State.Socket)");
        if (!_hasDefaultStateYet) {
            await (0, tools_1.timeout)(2000);
        }
        return new Promise(async (resolve) => {
            const funcName = '_smartQr';
            const md = "MULTI_DEVICE_DETECTED";
            let gotResult = false;
            const fn = async (qrData) => {
                if (qrData.length > 200 && !config?.multiDevice) {
                    spinner.fail(`Multi-Device detected, please set multiDevice to true in your config or add the --multi-device flag`);
                    spinner.emit(true, "MD_DETECT");
                    return resolve(md);
                }
                if (!gotResult && (qrData === 'QR_CODE_SUCCESS' || qrData === md)) {
                    gotResult = true;
                    spinner?.succeed("QR code scanned. Loading session...");
                    return resolve(await isInsideChat(waPage).toPromise());
                }
                if (!gotResult)
                    this.grabAndEmit(qrData, waPage, config, spinner);
            };
            const set = () => waPage.evaluate(({ funcName }) => {
                return window['smartQr'] ? window[`smartQr`](obj => window[funcName](obj)) : false;
            }, { funcName });
            await waPage.exposeFunction(funcName, (obj) => fn(obj)).then(set).catch(async (e) => {
                await (0, initializer_1.screenshot)(waPage);
                console.log("qr -> e", e);
                logging_1.log.error("qr -> e", e);
            });
            await this.emitFirst(waPage, config, spinner);
        });
    }
    async emitFirst(waPage, config, spinner) {
        if (this.firstEmitted)
            return;
        this.firstEmitted = true;
        const firstQr = await waPage.evaluate(this.qrCheck);
        await this.grabAndEmit(firstQr, waPage, config, spinner);
    }
    async waitFirstQr(waPage, config, spinner) {
        const fqr = await waPage.waitForFunction(`!!(${this.qrCheck})`, {
            polling: 500,
            timeout: 10000
        })
            .catch(() => false);
        if (fqr)
            await this.emitFirst(waPage, config, spinner);
        return;
    }
}
exports.QRManager = QRManager;
//# sourceMappingURL=auth.js.map