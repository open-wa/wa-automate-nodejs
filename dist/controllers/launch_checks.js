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
exports.integrityCheck = exports.checkWAPIHash = void 0;
const path = __importStar(require("path"));
var uniq = require('lodash.uniq');
const fs = require('fs');
var pkg = require('../../package.json');
const hasha = require('hasha');
const currentHash = '8d3a09fe3156605ac2cf55ce920bbbab';
function checkWAPIHash() {
    return __awaiter(this, void 0, void 0, function* () {
        const h = yield hasha.fromFile(path.join(__dirname, '../lib', 'wapi.js'), { algorithm: 'md5' });
        return h == currentHash;
    });
}
exports.checkWAPIHash = checkWAPIHash;
function integrityCheck(waPage, notifier, spinner, debugInfo) {
    return __awaiter(this, void 0, void 0, function* () {
        const waitForIdle = catchRequests(waPage);
        spinner.start('Checking client integrity');
        yield waitForIdle();
        const wapi = fs.readFileSync(path.join(__dirname, '../lib', 'wapi.js'), 'utf8');
        const methods = uniq(wapi.match(/(Store[.\w]*)\(/g).map((x) => x.replace("(", "")));
        const check = () => __awaiter(this, void 0, void 0, function* () {
            return yield waPage.evaluate((checkList) => {
                return checkList.filter(check => {
                    try {
                        return eval(check) ? false : true;
                    }
                    catch (error) {
                        return true;
                    }
                });
            }, methods);
        });
        let BROKEN_METHODS = yield check();
        if (BROKEN_METHODS.length > 0) {
            spinner.info('Broken methods detected. Attempting repair.');
            yield new Promise(resolve => setTimeout(resolve, 2500));
            //attempting repair
            const unconditionalInject = wapi.replace('!window.Store||!window.Store.Msg', 'true');
            yield waPage.evaluate(s => eval(s), unconditionalInject);
            yield waitForIdle();
            //check again
            BROKEN_METHODS = yield check();
            if (BROKEN_METHODS.length > 0) {
                spinner.info('Unable to repair. Reporting broken methods.');
                //report broken methods:
                if (notifier === null || notifier === void 0 ? void 0 : notifier.update) {
                    //needs an updated
                    spinner.fail("!!!BROKEN METHODS DETECTED!!!\n\n Please update to the latest version: " + notifier.update.latest);
                }
                else {
                    //hmm latest version
                    const axios = (yield Promise.resolve().then(() => __importStar(require('axios')))).default;
                    const report = yield axios.post(pkg.brokenMethodReportUrl, Object.assign(Object.assign({}, debugInfo), { BROKEN_METHODS })).catch(e => false);
                    if (report === null || report === void 0 ? void 0 : report.data) {
                        spinner.fail(`Unable to repair broken methods. Sometimes this happens the first time after a new WA version, please try again. An issue has been created, add more detail if required: ${report === null || report === void 0 ? void 0 : report.data}`);
                    }
                    else
                        spinner.fail(`Unable to repair broken methods. Sometimes this happens the first time after a new WA version, please try again. Please check the issues in the repo for updates: https://github.com/open-wa/wa-automate-nodejs/issues`);
                }
            }
            else
                spinner.info('Session repaired.');
        }
        else
            spinner.info('Passed Integrity Test');
        return true;
    });
}
exports.integrityCheck = integrityCheck;
function catchRequests(page, reqs = 0) {
    const started = () => (reqs = reqs + 1);
    const ended = () => (reqs = reqs - 1);
    page.on('request', started);
    page.on('requestfailed', ended);
    page.on('requestfinished', ended);
    return (timeout = 5000, success = false) => __awaiter(this, void 0, void 0, function* () {
        while (true) {
            if (reqs < 1)
                break;
            yield new Promise((yay) => setTimeout(yay, 100));
            if ((timeout = timeout - 100) < 0) {
                throw new Error('Timeout');
            }
        }
        page.off('request', started);
        page.off('requestfailed', ended);
        page.off('requestfinished', ended);
    });
}
