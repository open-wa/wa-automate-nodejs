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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAndInjectLicense = exports.getLicense = exports.getAndInjectLivePatch = exports.injectLivePatch = exports.getPatch = exports.create = exports.screenshot = void 0;
/** @ignore */
const fs = require('fs'), boxen = require('boxen'), osName = require('os-name'), configWithCases = require('../../bin/config-schema.json'), updateNotifier = require('update-notifier'), pkg = require('../../package.json'), crypto = require('crypto'), timeout = ms => {
    return new Promise(resolve => setTimeout(resolve, ms, 'timeout'));
};
const Client_1 = require("../api/Client");
const path = __importStar(require("path"));
const auth_1 = require("./auth");
const browser_1 = require("./browser");
const events_1 = require("./events");
const launch_checks_1 = require("./launch_checks");
const tree_kill_1 = __importDefault(require("tree-kill"));
const cfonts_1 = __importDefault(require("cfonts"));
const tools_1 = require("../utils/tools");
const crypto_1 = require("crypto");
const init_patch_1 = require("./init_patch");
/** @ignore */
// let shouldLoop = true,
let axios;
/**
 * Used to initialize the client session.
 *
 * *Note* It is required to set all config variables as [ConfigObject](https://open-wa.github.io/wa-automate-nodejs/interfaces/configobject.html) that includes both [sessionId](https://open-wa.github.io/wa-automate-nodejs/interfaces/configobject.html#sessionId). Setting the session id as the first variable is no longer valid
 *
 * e.g
 *
 * ```javascript
 * create({
 * sessionId: 'main',
 * customUserAgent: ' 'WhatsApp/2.16.352 Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Safari/605.1.15',
 * blockCrashLogs true,
 * ...
 * })....
 * ```
 * @param config ConfigObject] The extended custom configuration
 */
//@ts-ignore
function create(config = {}) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        const START_TIME = Date.now();
        let waPage = undefined;
        let notifier;
        let sessionId = '';
        let customUserAgent;
        if (!(config === null || config === void 0 ? void 0 : config.skipUpdateCheck) || (config === null || config === void 0 ? void 0 : config.keepUpdated)) {
            notifier = yield updateNotifier({
                pkg,
                updateCheckInterval: 0
            });
            notifier.notify();
            if ((notifier === null || notifier === void 0 ? void 0 : notifier.update) && (config === null || config === void 0 ? void 0 : config.keepUpdated) && (notifier === null || notifier === void 0 ? void 0 : notifier.update.latest) !== pkg.version) {
                console.log('UPDATING @OPEN-WA');
                const result = require('cross-spawn').spawn.sync('npm', ['i', '@open-wa/wa-automate'], { stdio: 'inherit' });
                if (!result.stderr) {
                    console.log('UPDATED SUCCESSFULLY');
                }
                console.log('RESTARTING PROCESS');
                process.on("exit", function () {
                    require('cross-spawn').spawn(process.argv.shift(), process.argv, {
                        cwd: process.cwd(),
                        detached: true,
                        stdio: "inherit"
                    });
                });
                process.exit();
            }
        }
        if (config === null || config === void 0 ? void 0 : config.inDocker) {
            //try to infer config variables from process.env
            config = Object.assign(Object.assign({}, config), tools_1.getConfigFromProcessEnv(configWithCases));
            config.chromiumArgs = (config === null || config === void 0 ? void 0 : config.chromiumArgs) || [];
            customUserAgent = config.customUserAgent;
        }
        if (sessionId === '' || (config === null || config === void 0 ? void 0 : config.sessionId))
            sessionId = (config === null || config === void 0 ? void 0 : config.sessionId) || 'session';
        const prettyFont = cfonts_1.default.render(('@OPEN-WA|WHATSAPP|AUTOMATOR'), {
            font: '3d',
            color: 'candy',
            align: 'center',
            gradient: ["red", "#f80"],
            lineHeight: 3
        });
        console.log((config === null || config === void 0 ? void 0 : config.disableSpins) ? boxen([
            `@open-wa/wa-automate   `,
            `${pkg.description}`,
            `Version: ${pkg.version}   `,
            `Check out the latest changes: https://github.com/open-wa/wa-automate-nodejs#latest-changes   `,
        ].join('\n'), { padding: 1, borderColor: 'yellow', borderStyle: 'bold' }) : prettyFont.string);
        if (config === null || config === void 0 ? void 0 : config.popup) {
            const { popup } = yield Promise.resolve().then(() => __importStar(require('./popup')));
            const popupaddr = yield popup(config);
            console.log(`You can also authenticate the session at: ${popupaddr}`);
        }
        if (!sessionId)
            sessionId = 'session';
        const spinner = new events_1.Spin(sessionId, 'STARTUP', config === null || config === void 0 ? void 0 : config.disableSpins);
        try {
            if (typeof config === 'string')
                console.error("AS OF VERSION 3+ YOU CAN NO LONGER SET THE SESSION ID AS THE FIRST PARAMETER OF CREATE. CREATE CAN ONLY TAKE A CONFIG OBJECT. IF YOU STILL HAVE CONFIGS AS A SECOND PARAMETER, THEY WILL HAVE NO EFFECT! PLEASE SEE DOCS.");
            spinner.start('Starting');
            spinner.succeed(`Version: ${pkg.version}`);
            spinner.info(`Initializing WA`);
            waPage = yield browser_1.initPage(sessionId, config, customUserAgent, spinner);
            spinner.succeed('Browser Launched');
            const throwOnError = config && config.throwErrorOnTosBlock == true;
            const PAGE_UA = yield waPage.evaluate('navigator.userAgent');
            const BROWSER_VERSION = yield waPage.browser().version();
            const OS = osName();
            const START_TS = Date.now();
            const screenshotPath = `./logs/${config.sessionId || 'session'}/${START_TS}`;
            exports.screenshot = (page) => __awaiter(this, void 0, void 0, function* () {
                yield page.screenshot({
                    path: `${screenshotPath}/${Date.now()}.jpg`
                }).catch(() => {
                    fs.mkdirSync(screenshotPath, { recursive: true });
                    return exports.screenshot(page);
                });
                console.log('Screenshot taken. path:', `${screenshotPath}`);
            });
            if (config === null || config === void 0 ? void 0 : config.screenshotOnInitializationBrowserError)
                waPage.on('console', (msg) => __awaiter(this, void 0, void 0, function* () {
                    for (let i = 0; i < msg.args().length; ++i)
                        console.log(`${i}: ${msg.args()[i]}`);
                    if (msg.type() === 'error' && !msg.text().includes('apify') && !msg.text().includes('crashlogs'))
                        yield exports.screenshot(waPage);
                }));
            const WA_AUTOMATE_VERSION = `${pkg.version}${(notifier === null || notifier === void 0 ? void 0 : notifier.update) && ((notifier === null || notifier === void 0 ? void 0 : notifier.update.latest) !== pkg.version) ? ` UPDATE AVAILABLE: ${notifier === null || notifier === void 0 ? void 0 : notifier.update.latest}` : ''}`;
            yield waPage.waitForFunction('window.Debug!=undefined && window.Debug.VERSION!=undefined');
            //@ts-ignore
            const WA_VERSION = yield waPage.evaluate(() => window.Debug ? window.Debug.VERSION : 'I think you have been TOS_BLOCKed');
            //@ts-ignore
            const canInjectEarly = yield waPage.evaluate(() => { return (typeof webpackChunkbuild !== "undefined"); });
            let debugInfo = {
                WA_VERSION,
                PAGE_UA,
                WA_AUTOMATE_VERSION,
                BROWSER_VERSION,
                OS,
                START_TS
            };
            if ((config === null || config === void 0 ? void 0 : config.logDebugInfoAsObject) || (config === null || config === void 0 ? void 0 : config.disableSpins))
                spinner.succeed(`Debug info: ${JSON.stringify(debugInfo, null, 2)}`);
            else
                console.table(debugInfo);
            /**
             * Attempt to preload patches
             */
            const patchPromise = getPatch(config, spinner);
            if (canInjectEarly) {
                spinner.start('Injecting api');
                waPage = yield browser_1.injectApi(waPage);
                spinner.start('WAPI injected');
            }
            else {
                spinner.remove();
                if (throwOnError)
                    throw Error('TOSBLOCK');
            }
            spinner.start('Authenticating');
            const authRace = [];
            authRace.push(auth_1.isAuthenticated(waPage).catch(() => { }));
            if ((config === null || config === void 0 ? void 0 : config.authTimeout) !== 0) {
                authRace.push(timeout((config.authTimeout || 60) * 1000));
            }
            const authenticated = yield Promise.race(authRace);
            if (authenticated === 'NUKE') {
                //kill the browser
                spinner.fail("Session data most likely expired due to manual host account logout. Please re-authenticate this session.");
                yield kill(waPage);
                //restart the process with no session data
                return create(Object.assign(Object.assign({}, config), { sessionData: authenticated }));
            }
            /**
             * Attempt to preload the license
             */
            const earlyWid = yield waPage.evaluate(`(localStorage["last-wid"] || '').replace(/"/g,"")`);
            const licensePromise = getLicense(config, {
                _serialized: earlyWid
            }, debugInfo, spinner);
            if (authenticated == 'timeout') {
                const outOfReach = yield auth_1.phoneIsOutOfReach(waPage);
                spinner.emit(outOfReach ? 'appOffline' : 'authTimeout');
                spinner.fail(outOfReach ? 'Authentication timed out. Please open the app on the phone. Shutting down' : 'Authentication timed out. Shutting down. Consider increasing authTimeout config variable: https://open-wa.github.io/wa-automate-nodejs/interfaces/configobject.html#authtimeout');
                yield kill(waPage);
                if (config === null || config === void 0 ? void 0 : config.killProcessOnTimeout)
                    process.exit();
                throw new Error(outOfReach ? 'App Offline' : 'Auth Timeout. Consider increasing authTimeout config variable: https://open-wa.github.io/wa-automate-nodejs/interfaces/configobject.html#authtimeout');
            }
            if (authenticated) {
                spinner.succeed('Authenticated');
            }
            else {
                spinner.info('Authenticate to continue');
                const race = [];
                race.push(auth_1.smartQr(waPage, config));
                if ((config === null || config === void 0 ? void 0 : config.qrTimeout) !== 0) {
                    race.push(timeout(((config === null || config === void 0 ? void 0 : config.qrTimeout) || 60) * 1000));
                }
                const result = yield Promise.race(race);
                if (result == 'timeout') {
                    spinner.emit('qrTimeout');
                    spinner.fail('QR scan took too long. Session Timed Out. Shutting down. Consider increasing qrTimeout config variable: https://open-wa.github.io/wa-automate-nodejs/interfaces/configobject.html#qrtimeout');
                    yield kill(waPage);
                    if (config === null || config === void 0 ? void 0 : config.killProcessOnTimeout)
                        process.exit();
                    throw new Error('QR Timeout');
                }
                spinner.emit('successfulScan');
                spinner.succeed();
            }
            const pre = canInjectEarly ? 'Rei' : 'I';
            spinner.start(`${pre}njecting api`);
            waPage = yield browser_1.injectApi(waPage);
            spinner.succeed(`WAPI ${pre}njected`);
            if (canInjectEarly) {
                //check if page is valid after 5 seconds
                spinner.start('Checking if session is valid');
                if (config === null || config === void 0 ? void 0 : config.safeMode)
                    yield timeout(5000);
            }
            //@ts-ignore
            const VALID_SESSION = yield waPage.evaluate(() => window.Store && window.Store.Msg ? true : false);
            if (VALID_SESSION) {
                spinner.succeed('Client is ready');
                const localStorage = JSON.parse(yield waPage.evaluate(() => {
                    return JSON.stringify(window.localStorage);
                }));
                const stdSessionJsonPath = ((config === null || config === void 0 ? void 0 : config.sessionDataPath) && (config === null || config === void 0 ? void 0 : config.sessionDataPath.includes('.data.json'))) ? path.join(path.resolve(process.cwd(), (config === null || config === void 0 ? void 0 : config.sessionDataPath) || '')) : path.join(path.resolve(process.cwd(), (config === null || config === void 0 ? void 0 : config.sessionDataPath) || ''), `${sessionId || 'session'}.data.json`);
                const altMainModulePath = ((_a = require === null || require === void 0 ? void 0 : require.main) === null || _a === void 0 ? void 0 : _a.path) || ((_b = process === null || process === void 0 ? void 0 : process.mainModule) === null || _b === void 0 ? void 0 : _b.path);
                const altSessionJsonPath = !altMainModulePath ? null : ((config === null || config === void 0 ? void 0 : config.sessionDataPath) && (config === null || config === void 0 ? void 0 : config.sessionDataPath.includes('.data.json'))) ? path.join(path.resolve(altMainModulePath, (config === null || config === void 0 ? void 0 : config.sessionDataPath) || '')) : path.join(path.resolve(altMainModulePath, (config === null || config === void 0 ? void 0 : config.sessionDataPath) || ''), `${sessionId || 'session'}.data.json`);
                const sessionjsonpath = altSessionJsonPath && fs.existsSync(altSessionJsonPath) ? altSessionJsonPath : stdSessionJsonPath;
                const sessionData = {
                    WABrowserId: localStorage.WABrowserId,
                    WASecretBundle: localStorage.WASecretBundle,
                    WAToken1: localStorage.WAToken1,
                    WAToken2: localStorage.WAToken2
                };
                const sdB64 = Buffer.from(JSON.stringify(sessionData)).toString('base64');
                spinner.emit(sessionData, "sessionData");
                spinner.emit(sdB64, "sessionDataBase64");
                if (!(config === null || config === void 0 ? void 0 : config.skipSessionSave))
                    fs.writeFile(sessionjsonpath, sdB64, (err) => {
                        if (err) {
                            console.error(err);
                            return;
                        }
                    });
                if (config === null || config === void 0 ? void 0 : config.logConsole)
                    waPage.on('console', msg => console.log(msg));
                if (config === null || config === void 0 ? void 0 : config.logConsoleErrors)
                    waPage.on('error', error => console.log(error));
                if (config === null || config === void 0 ? void 0 : config.restartOnCrash)
                    waPage.on('error', (error) => __awaiter(this, void 0, void 0, function* () {
                        console.error('Page Crashed! Restarting...', error);
                        yield kill(waPage);
                        yield create(config).then(config.restartOnCrash);
                    }));
                const pureWAPI = yield launch_checks_1.checkWAPIHash();
                if (!pureWAPI) {
                    config.skipBrokenMethodsCheck = true;
                    // config.skipPatches = true;
                }
                debugInfo.NUM = yield waPage.evaluate(`(window.localStorage['last-wid'] || '').replace('@c.us','').replace(/"/g,"").slice(-4)`);
                debugInfo.NUM_HASH = crypto_1.createHash('md5').update(yield waPage.evaluate(`(window.localStorage['last-wid'] || '').replace('@c.us','').replace(/"/g,"")`), 'utf8').digest('hex');
                if (config === null || config === void 0 ? void 0 : config.hostNotificationLang) {
                    yield waPage.evaluate(`window.hostlang="${config.hostNotificationLang}"`);
                }
                //patch issues with wapi.js
                if (!(config === null || config === void 0 ? void 0 : config.skipPatches)) {
                    yield getAndInjectLivePatch(waPage, spinner, yield patchPromise);
                    debugInfo.OW_KEY = yield waPage.evaluate(`window.o()`);
                }
                if ((config === null || config === void 0 ? void 0 : config.skipBrokenMethodsCheck) !== true)
                    yield launch_checks_1.integrityCheck(waPage, notifier, spinner, debugInfo);
                const LAUNCH_TIME_MS = Date.now() - START_TIME;
                debugInfo = Object.assign(Object.assign({}, debugInfo), { LAUNCH_TIME_MS });
                spinner.emit(debugInfo, "DebugInfo");
                spinner.succeed(`Client loaded in ${LAUNCH_TIME_MS / 1000}s`);
                const client = new Client_1.Client(waPage, config, debugInfo);
                if (config === null || config === void 0 ? void 0 : config.deleteSessionDataOnLogout) {
                    client.onStateChanged(state => {
                        if (state === 'UNPAIRED') {
                            const sessionjsonpath = ((config === null || config === void 0 ? void 0 : config.sessionDataPath) && (config === null || config === void 0 ? void 0 : config.sessionDataPath.includes('.data.json'))) ? path.join(path.resolve(process.cwd(), (config === null || config === void 0 ? void 0 : config.sessionDataPath) || '')) : path.join(path.resolve(process.cwd(), (config === null || config === void 0 ? void 0 : config.sessionDataPath) || ''), `${sessionId || 'session'}.data.json`);
                            if (fs.existsSync(sessionjsonpath))
                                fs.unlinkSync(sessionjsonpath);
                        }
                    });
                }
                const { me } = yield client.getMe();
                if ((config === null || config === void 0 ? void 0 : config.licenseKey) || me._serialized !== earlyWid) {
                    yield getAndInjectLicense(waPage, config, me, debugInfo, spinner, me._serialized !== earlyWid ? false : yield licensePromise);
                }
                yield init_patch_1.injectInitPatch(waPage);
                spinner.succeed(`🚀 @OPEN-WA ready for account: ${me.user.slice(-4)}`);
                spinner.emit('SUCCESS');
                yield client.loaded();
                spinner.remove();
                return client;
            }
            else {
                spinner.fail('The session is invalid. Retrying');
                yield kill(waPage);
                return yield create(config);
            }
        }
        catch (error) {
            spinner.emit(error.message);
            yield kill(waPage);
            spinner.remove();
            throw error;
        }
    });
}
exports.create = create;
/**
 * @internal
 */
const kill = (p) => __awaiter(void 0, void 0, void 0, function* () {
    if (p) {
        const browser = yield (p === null || p === void 0 ? void 0 : p.browser());
        if (!browser)
            return;
        const pid = (browser === null || browser === void 0 ? void 0 : browser.process()) ? browser === null || browser === void 0 ? void 0 : browser.process().pid : null;
        if (!pid)
            return;
        if (!(p === null || p === void 0 ? void 0 : p.isClosed()))
            yield (p === null || p === void 0 ? void 0 : p.close());
        if (browser)
            yield (browser === null || browser === void 0 ? void 0 : browser.close().catch(() => { }));
        if (pid)
            tree_kill_1.default(pid, 'SIGKILL');
    }
});
/**
 * @private
 */
function getPatch(config, spinner) {
    return __awaiter(this, void 0, void 0, function* () {
        const ghUrl = `https://raw.githubusercontent.com/open-wa/wa-automate-nodejs/master/patches.json`;
        const hasSpin = !!spinner;
        /**
         * Undo below comment when a githack alternative is found.
         */
        const patchesUrl = (config === null || config === void 0 ? void 0 : config.cachedPatch) ? ghUrl : pkg.patches;
        if (!spinner)
            spinner = new events_1.Spin(config.sessionId, "FETCH_PATCH", config.disableSpins, true);
        spinner === null || spinner === void 0 ? void 0 : spinner.start(`Downloading ${(config === null || config === void 0 ? void 0 : config.cachedPatch) ? 'cached ' : ''}patches from ${patchesUrl}`, hasSpin ? undefined : 2);
        if (!axios)
            axios = yield Promise.resolve().then(() => __importStar(require('axios')));
        const START = Date.now();
        const { data, headers } = yield axios.get(patchesUrl).catch(() => {
            spinner === null || spinner === void 0 ? void 0 : spinner.info('Downloading patches. Retrying.');
            return axios.get(`${ghUrl}?v=${Date.now()}`);
        });
        const END = Date.now();
        if (!headers['etag']) {
            spinner === null || spinner === void 0 ? void 0 : spinner.info('Generating patch hash');
            headers['etag'] = crypto.createHash('md5').update(typeof data === 'string' ? data : JSON.stringify(data)).digest("hex").slice(-5);
        }
        spinner === null || spinner === void 0 ? void 0 : spinner.succeed(`Downloaded patches in ${(END - START) / 1000}s`);
        return {
            data,
            tag: `${(headers.etag || '').replace(/"/g, '').slice(-5)}`
        };
    });
}
exports.getPatch = getPatch;
/**
 * @private
 * @param page
 * @param spinner
 */
function injectLivePatch(page, patch, spinner) {
    return __awaiter(this, void 0, void 0, function* () {
        const { data, tag } = patch;
        spinner === null || spinner === void 0 ? void 0 : spinner.info('Installing patches');
        yield Promise.all(data.map(patch => page.evaluate(`${patch}`)));
        spinner === null || spinner === void 0 ? void 0 : spinner.succeed(`Patches Installed: ${tag}`);
    });
}
exports.injectLivePatch = injectLivePatch;
/**
 * @private
 */
function getAndInjectLivePatch(page, spinner, preloadedPatch) {
    return __awaiter(this, void 0, void 0, function* () {
        let patch = preloadedPatch;
        if (!patch)
            patch = yield getPatch(spinner);
        yield injectLivePatch(page, patch, spinner);
    });
}
exports.getAndInjectLivePatch = getAndInjectLivePatch;
/**
 * @private
 */
function getLicense(config, me, debugInfo, spinner) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!(config === null || config === void 0 ? void 0 : config.licenseKey) || !(me === null || me === void 0 ? void 0 : me._serialized))
            return false;
        if (!axios)
            axios = yield Promise.resolve().then(() => __importStar(require('axios')));
        const hasSpin = !!spinner;
        if (!spinner)
            spinner = new events_1.Spin(config.sessionId || "session", "FETCH_LICENSE", config.disableSpins, true);
        spinner === null || spinner === void 0 ? void 0 : spinner.start('Fetching License', hasSpin ? undefined : 2);
        try {
            const START = Date.now();
            const { data } = yield axios.post(pkg.licenseCheckUrl, Object.assign({ key: config.licenseKey, number: me._serialized }, debugInfo));
            const END = Date.now();
            spinner === null || spinner === void 0 ? void 0 : spinner.succeed(`Downloaded License in ${(END - START) / 1000}s`);
            return data;
        }
        catch (error) {
            spinner === null || spinner === void 0 ? void 0 : spinner.fail(`License request failed: ${error.statusCode || error.code || error.message}`);
            return false;
        }
    });
}
exports.getLicense = getLicense;
function getAndInjectLicense(page, config, me, debugInfo, spinner, preloadedLicense) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!(config === null || config === void 0 ? void 0 : config.licenseKey) || !(me === null || me === void 0 ? void 0 : me._serialized))
            return false;
        if (!axios)
            axios = yield Promise.resolve().then(() => __importStar(require('axios')));
        let l_err;
        let data = preloadedLicense;
        spinner === null || spinner === void 0 ? void 0 : spinner.info('Checking License');
        try {
            if (!data)
                data = yield getLicense(config, me, debugInfo, spinner);
            if (data) {
                const l_success = yield page.evaluate(data => eval(data), data);
                if (!l_success) {
                    l_err = yield page.evaluate('window.launchError');
                }
                else {
                    const keyType = yield page.evaluate('window.KEYTYPE || false');
                    spinner === null || spinner === void 0 ? void 0 : spinner.succeed(`License Valid${keyType ? `: ${keyType}` : ''}`);
                    return true;
                }
            }
            else
                l_err = "The key is invalid";
            if (l_err) {
                spinner === null || spinner === void 0 ? void 0 : spinner.fail(`License issue${l_err ? `: ${l_err}` : ""}`);
            }
            return false;
        }
        catch (error) {
            spinner === null || spinner === void 0 ? void 0 : spinner.fail(`License request failed: ${error.statusCode || error.code || error.message}`);
            return false;
        }
    });
}
exports.getAndInjectLicense = getAndInjectLicense;
