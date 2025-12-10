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
exports.checkWAPIHash = checkWAPIHash;
exports.integrityCheck = integrityCheck;
const path = __importStar(require("path"));
const hasha_1 = __importDefault(require("hasha"));
const lodash_uniq_1 = __importDefault(require("lodash.uniq"));
const fs_extra_1 = require("fs-extra");
const fs = __importStar(require("fs"));
const pkg = (0, fs_extra_1.readJsonSync)(path.join(__dirname, '../../package.json'));
const currentHash = '8d3a09fe3156605ac2cf55ce920bbbab';
async function checkWAPIHash() {
    const h = await hasha_1.default.fromFile(path.join(__dirname, '../lib', 'wapi.js'), { algorithm: 'md5' });
    return h == currentHash;
}
async function integrityCheck(waPage, notifier, spinner, debugInfo) {
    const waitForIdle = catchRequests(waPage);
    spinner.start('Checking client integrity');
    await waitForIdle();
    const wapi = fs.readFileSync(path.join(__dirname, '../lib', 'wapi.js'), 'utf8');
    const methods = (0, lodash_uniq_1.default)(wapi.match(/(Store[.\w]*)\(/g).map((x) => x.replace("(", "")));
    const check = async () => await waPage.evaluate((checkList) => {
        return checkList.filter(check => {
            try {
                return eval(check) ? false : true;
            }
            catch (error) {
                return true;
            }
        });
    }, methods);
    let BROKEN_METHODS = await check();
    if (BROKEN_METHODS.length > 0) {
        spinner.info('Broken methods detected. Attempting repair.');
        await new Promise(resolve => setTimeout(resolve, 2500));
        const unconditionalInject = wapi.replace('!window.Store||!window.Store.Msg', 'true');
        await waPage.evaluate(s => eval(s), unconditionalInject);
        await waitForIdle();
        BROKEN_METHODS = await check();
        if (BROKEN_METHODS.length > 0) {
            spinner.info('Unable to repair. Reporting broken methods.');
            if (notifier?.update) {
                spinner.fail("!!!BROKEN METHODS DETECTED!!!\n\n Please update to the latest version: " + notifier.update.latest);
            }
            else {
                const axios = (await Promise.resolve().then(() => __importStar(require('axios')))).default;
                const report = await axios.post(pkg.brokenMethodReportUrl, { ...debugInfo, BROKEN_METHODS }).catch(() => false);
                if (report?.data) {
                    spinner.fail(`Unable to repair broken methods. Sometimes this happens the first time after a new WA version, please try again. An issue has been created, add more detail if required: ${report?.data}`);
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
}
function catchRequests(page, reqs = 0) {
    const started = () => (reqs = reqs + 1);
    const ended = () => (reqs = reqs - 1);
    page.on('request', started);
    page.on('requestfailed', ended);
    page.on('requestfinished', ended);
    return async (timeout = 5000, success = false) => {
        while (true) {
            if (reqs < 1)
                break;
            await new Promise((yay) => setTimeout(yay, 100));
            if ((timeout = timeout - 100) < 0) {
                throw new Error('Timeout');
            }
        }
        page.off('request', started);
        page.off('requestfailed', ended);
        page.off('requestfinished', ended);
    };
}
//# sourceMappingURL=launch_checks.js.map