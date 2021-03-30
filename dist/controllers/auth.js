"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.smartQr = exports.phoneIsOutOfReach = exports.sessionDataInvalid = exports.isInsideChat = exports.needsToScan = exports.isAuthenticated = void 0;
const qrcode = __importStar(require("qrcode-terminal"));
const rxjs_1 = require("rxjs");
const events_1 = require("./events");
const initializer_1 = require("./initializer");
const timeout = ms => new Promise(resolve => setTimeout(resolve, ms, 'timeout'));
/**
 * Validates if client is authenticated
 * @returns true if is authenticated, false otherwise
 * @param waPage
 */
const isAuthenticated = (waPage) => rxjs_1.race(exports.needsToScan(waPage), exports.isInsideChat(waPage), exports.sessionDataInvalid(waPage)).toPromise();
exports.isAuthenticated = isAuthenticated;
const needsToScan = (waPage) => {
    return rxjs_1.from(new Promise((resolve) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            yield Promise.race([
                waPage.waitForFunction('checkQrRefresh()', { timeout: 0, polling: 1000 }).catch(() => { }),
                yield waPage
                    .waitForSelector('body > div > div > .landing-wrapper', {
                    timeout: 0
                }).catch(() => resolve(true))
            ]).catch(() => { });
            yield waPage.waitForSelector("canvas[aria-label='Scan me!']", { timeout: 0 }).catch(() => { });
            resolve(false);
        }
        catch (error) {
            console.log("needsToScan -> error", error);
        }
    })));
};
exports.needsToScan = needsToScan;
const isInsideChat = (waPage) => {
    return rxjs_1.from(waPage
        .waitForFunction("!!window.WA_AUTHENTICATED || (document.getElementsByClassName('app')[0] && document.getElementsByClassName('app')[0].attributes && !!document.getElementsByClassName('app')[0].attributes.tabindex) || (document.getElementsByClassName('two')[0] && document.getElementsByClassName('two')[0].attributes && !!document.getElementsByClassName('two')[0].attributes.tabindex)", { timeout: 0 })
        .then(() => true));
};
exports.isInsideChat = isInsideChat;
const sessionDataInvalid = (waPage) => __awaiter(void 0, void 0, void 0, function* () {
    yield waPage
        .waitForFunction('!window.getQrPng', { timeout: 0, polling: 'mutation' });
    //if the code reaches here it means the browser was refreshed. Nuke the session data and restart `create`
    return 'NUKE';
});
exports.sessionDataInvalid = sessionDataInvalid;
const phoneIsOutOfReach = (waPage) => __awaiter(void 0, void 0, void 0, function* () {
    return yield waPage
        .waitForFunction('document.querySelector("body").innerText.includes("Trying to reach phone")', { timeout: 0, polling: 'mutation' })
        .then(() => true)
        .catch(() => false);
});
exports.phoneIsOutOfReach = phoneIsOutOfReach;
function smartQr(waPage, config) {
    return __awaiter(this, void 0, void 0, function* () {
        const evalResult = yield waPage.evaluate("window.Store && window.Store.State");
        if (evalResult === false) {
            console.log('Seems as though you have been TOS_BLOCKed, unable to refresh QR Code. Please see https://github.com/open-wa/wa-automate-nodejs#best-practice for information on how to prevent this from happeing. You will most likely not get a QR Code');
            if (config.throwErrorOnTosBlock)
                throw new Error('TOSBLOCK');
        }
        const isAuthed = yield exports.isAuthenticated(waPage);
        if (isAuthed)
            return true;
        const grabAndEmit = (qrData) => __awaiter(this, void 0, void 0, function* () {
            const qrCode = yield waPage.evaluate(`getQrPng()`);
            qrEv.emit(qrCode);
            if (!config.qrLogSkip)
                qrcode.generate(qrData, { small: true });
            else
                console.log(`New QR Code generated. Not printing in console because qrLogSkip is set to true`);
        });
        const qrEv = new events_1.EvEmitter(config.sessionId || 'session', 'qr');
        const _hasDefaultStateYet = yield waPage.evaluate("window.Store &&  window.Store.State && window.Store.State.default");
        if (!_hasDefaultStateYet) {
            //expecting issue, take a screenshot then wait a few seconds before continuing
            yield timeout(2000);
        }
        return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
            const funcName = '_smartQr';
            const fn = (qrData) => __awaiter(this, void 0, void 0, function* () {
                if (qrData === 'QR_CODE_SUCCESS')
                    return resolve(yield exports.isInsideChat(waPage).toPromise());
                grabAndEmit(qrData);
            });
            const set = () => waPage.evaluate(({ funcName }) => {
                //@ts-ignore
                return window['smartQr'] ? window[`smartQr`](obj => window[funcName](obj)) : false;
            }, { funcName });
            yield waPage.exposeFunction(funcName, (obj) => fn(obj)).then(set).catch((e) => __awaiter(this, void 0, void 0, function* () {
                //if an error occurs during the qr launcher then take a screenshot.
                yield initializer_1.screenshot(waPage);
                console.log("qr -> e", e);
            }));
            const firstQr = yield waPage.evaluate(`document.querySelector("canvas[aria-label='Scan me!']")?document.querySelector("canvas[aria-label='Scan me!']").parentElement.getAttribute("data-ref"):false`);
            yield grabAndEmit(firstQr);
        }));
    });
}
exports.smartQr = smartQr;
