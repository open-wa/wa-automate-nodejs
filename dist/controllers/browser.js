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
exports.injectApi = exports.addScript = exports.initPage = void 0;
/**
 * @hidden
 */
/** */
const path = __importStar(require("path"));
const fs = require('fs');
const puppeteer = require('puppeteer-extra');
const puppeteer_config_1 = require("../config/puppeteer.config");
const events_1 = require("./events");
const ON_DEATH = require('death'); //this is intentionally ugly
let browser;
function initPage(sessionId, config, customUserAgent, spinner) {
    var _a, _b, _c, _d;
    return __awaiter(this, void 0, void 0, function* () {
        const setupPromises = [];
        if (config === null || config === void 0 ? void 0 : config.useStealth)
            puppeteer.use(require('puppeteer-extra-plugin-stealth')());
        spinner === null || spinner === void 0 ? void 0 : spinner.info('Launching Browser');
        browser = yield initBrowser(sessionId, config);
        const waPage = yield getWAPage(browser);
        spinner === null || spinner === void 0 ? void 0 : spinner.info('Setting Up Browser');
        if (config === null || config === void 0 ? void 0 : config.proxyServerCredentials) {
            yield waPage.authenticate(config.proxyServerCredentials);
        }
        setupPromises.push(waPage.setUserAgent(customUserAgent || puppeteer_config_1.useragent));
        if ((config === null || config === void 0 ? void 0 : config.defaultViewport) !== null)
            setupPromises.push(waPage.setViewport({
                width: ((_a = config === null || config === void 0 ? void 0 : config.viewport) === null || _a === void 0 ? void 0 : _a.width) || puppeteer_config_1.width,
                height: ((_b = config === null || config === void 0 ? void 0 : config.viewport) === null || _b === void 0 ? void 0 : _b.height) || puppeteer_config_1.height,
                deviceScaleFactor: 1
            }));
        if (config === null || config === void 0 ? void 0 : config.resizable)
            config.defaultViewport = null;
        const cacheEnabled = (config === null || config === void 0 ? void 0 : config.cacheEnabled) === false ? false : true;
        const blockCrashLogs = (config === null || config === void 0 ? void 0 : config.blockCrashLogs) === false ? false : true;
        setupPromises.push(waPage.setBypassCSP((config === null || config === void 0 ? void 0 : config.bypassCSP) || false));
        setupPromises.push(waPage.setCacheEnabled(cacheEnabled));
        const blockAssets = !(config === null || config === void 0 ? void 0 : config.headless) ? false : (config === null || config === void 0 ? void 0 : config.blockAssets) || false;
        if (blockAssets) {
            puppeteer.use(require('puppeteer-extra-plugin-block-resources')({
                blockedTypes: new Set(['image', 'stylesheet', 'font'])
            }));
        }
        const interceptAuthentication = !(config === null || config === void 0 ? void 0 : config.safeMode);
        const proxyAddr = (config === null || config === void 0 ? void 0 : config.proxyServerCredentials) ? `${((_c = config.proxyServerCredentials) === null || _c === void 0 ? void 0 : _c.username) && ((_d = config.proxyServerCredentials) === null || _d === void 0 ? void 0 : _d.password) ? `${config.proxyServerCredentials.protocol ||
            config.proxyServerCredentials.address.includes('https') ? 'https' :
            config.proxyServerCredentials.address.includes('http') ? 'http' :
                config.proxyServerCredentials.address.includes('socks5') ? 'socks5' :
                    config.proxyServerCredentials.address.includes('socks4') ? 'socks4' : 'http'}://${config.proxyServerCredentials.username}:${config.proxyServerCredentials.password}@${config.proxyServerCredentials.address
            .replace('https', '')
            .replace('http', '')
            .replace('socks5', '')
            .replace('socks4', '')
            .replace('://', '')}` : config.proxyServerCredentials.address}` : false;
        let quickAuthed = false;
        if (interceptAuthentication || proxyAddr || blockCrashLogs) {
            setupPromises.push(() => __awaiter(this, void 0, void 0, function* () {
                yield waPage.setRequestInterception(true);
                const authCompleteEv = new events_1.EvEmitter(sessionId, 'AUTH');
                waPage.on('request', (request) => __awaiter(this, void 0, void 0, function* () {
                    if (interceptAuthentication &&
                        request.url().includes('_priority_components') &&
                        !quickAuthed) {
                        authCompleteEv.emit(true);
                        yield waPage.evaluate('window.WA_AUTHENTICATED=true;');
                        quickAuthed = true;
                    }
                    if (request.url().includes('https://crashlogs.whatsapp.net/') && blockCrashLogs) {
                        request.abort();
                    }
                    // else if (proxyAddr) require('puppeteer-page-proxy')(request, proxyAddr);
                    else
                        request.continue();
                }));
            }));
        }
        spinner === null || spinner === void 0 ? void 0 : spinner.info('Loading session data');
        const sessionjson = getSessionDataFromFile(sessionId, config);
        if (sessionjson) {
            spinner === null || spinner === void 0 ? void 0 : spinner.info('Existing session data detected. Injecting...');
            yield waPage.evaluateOnNewDocument(session => {
                localStorage.clear();
                Object.keys(session).forEach(key => localStorage.setItem(key, session[key]));
            }, sessionjson);
            spinner === null || spinner === void 0 ? void 0 : spinner.succeed('Existing session data injected');
        }
        // if(config?.proxyServerCredentials) {
        //   await require('puppeteer-page-proxy')(waPage, proxyAddr);
        //   console.log(`Active proxy: ${config.proxyServerCredentials.address}`)
        // }
        yield Promise.all(setupPromises);
        spinner === null || spinner === void 0 ? void 0 : spinner.info('Navigating to WA');
        yield waPage.goto(puppeteer_config_1.puppeteerConfig.WAUrl);
        return waPage;
    });
}
exports.initPage = initPage;
const getSessionDataFromFile = (sessionId, config) => {
    var _a, _b;
    if ((config === null || config === void 0 ? void 0 : config.sessionData) == "NUKE")
        return '';
    //check if [session].json exists in __dirname
    const sessionjsonpath = ((config === null || config === void 0 ? void 0 : config.sessionDataPath) && (config === null || config === void 0 ? void 0 : config.sessionDataPath.includes('.data.json'))) ? path.join(path.resolve(process.cwd(), (config === null || config === void 0 ? void 0 : config.sessionDataPath) || '')) : path.join(path.resolve(process.cwd(), (config === null || config === void 0 ? void 0 : config.sessionDataPath) || ''), `${sessionId || 'session'}.data.json`);
    let sessionjson = '';
    const sd = process.env[`${sessionId.toUpperCase()}_DATA_JSON`] ? JSON.parse(process.env[`${sessionId.toUpperCase()}_DATA_JSON`]) : config === null || config === void 0 ? void 0 : config.sessionData;
    sessionjson = (typeof sd === 'string') ? JSON.parse(Buffer.from(sd, 'base64').toString('ascii')) : sd;
    if (fs.existsSync(sessionjsonpath)) {
        const s = fs.readFileSync(sessionjsonpath, "utf8");
        try {
            sessionjson = JSON.parse(s);
        }
        catch (error) {
            try {
                sessionjson = JSON.parse(Buffer.from(s, 'base64').toString('ascii'));
            }
            catch (error) {
                console.error("session data json file is corrupted. Please reauthenticate.");
                return false;
            }
        }
    }
    else {
        const p = ((_a = require === null || require === void 0 ? void 0 : require.main) === null || _a === void 0 ? void 0 : _a.path) || ((_b = process === null || process === void 0 ? void 0 : process.mainModule) === null || _b === void 0 ? void 0 : _b.path);
        if (p) {
            const altSessionJsonPath = ((config === null || config === void 0 ? void 0 : config.sessionDataPath) && (config === null || config === void 0 ? void 0 : config.sessionDataPath.includes('.data.json'))) ? path.join(path.resolve(p, (config === null || config === void 0 ? void 0 : config.sessionDataPath) || '')) : path.join(path.resolve(p, (config === null || config === void 0 ? void 0 : config.sessionDataPath) || ''), `${sessionId || 'session'}.data.json`);
            if (fs.existsSync(altSessionJsonPath)) {
                const s = fs.readFileSync(altSessionJsonPath, "utf8");
                try {
                    sessionjson = JSON.parse(s);
                }
                catch (error) {
                    sessionjson = JSON.parse(Buffer.from(s, 'base64').toString('ascii'));
                }
            }
        }
    }
    return sessionjson;
};
const addScript = (page, js) => page.addScriptTag({
    path: require.resolve(path.join(__dirname, '../lib', js))
});
exports.addScript = addScript;
function injectApi(page) {
    return __awaiter(this, void 0, void 0, function* () {
        yield Promise.all([
            'axios.min.js',
            'jsSha.min.js',
            'qr.min.js',
            'base64.js',
            'hash.js'
        ].map(js => exports.addScript(page, js)));
        yield exports.addScript(page, 'wapi.js');
        yield exports.addScript(page, 'launch.js');
        return page;
    });
}
exports.injectApi = injectApi;
function initBrowser(sessionId, config = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        if ((config === null || config === void 0 ? void 0 : config.useChrome) && !(config === null || config === void 0 ? void 0 : config.executablePath)) {
            const storage = require('node-persist');
            yield storage.init();
            const _savedPath = yield storage.getItem('executablePath');
            if (!_savedPath) {
                config.executablePath = require('chrome-launcher').Launcher.getInstallations()[0];
                yield storage.setItem('executablePath', config.executablePath);
            }
            else
                config.executablePath = _savedPath;
        }
        if (config === null || config === void 0 ? void 0 : config.browserRevision) {
            const browserFetcher = puppeteer.createBrowserFetcher();
            const browserDownloadSpinner = new events_1.Spin(sessionId + '_browser', 'Browser', false, false);
            try {
                browserDownloadSpinner.start('Downloading browser revision: ' + config.browserRevision);
                const revisionInfo = yield browserFetcher.download(config.browserRevision, function (downloadedBytes, totalBytes) {
                    browserDownloadSpinner.info(`Downloading Browser: ${Math.round(downloadedBytes / 1000000)}/${Math.round(totalBytes / 1000000)}`);
                });
                if (revisionInfo.executablePath) {
                    config.executablePath = revisionInfo.executablePath;
                    // config.pipe = true;
                }
                browserDownloadSpinner.succeed('Browser downloaded successfully');
            }
            catch (error) {
                browserDownloadSpinner.succeed('Something went wrong while downloading the browser');
            }
        }
        // if(config?.proxyServerCredentials?.address) puppeteerConfig.chromiumArgs.push(`--proxy-server=${config.proxyServerCredentials.address}`)
        if (config === null || config === void 0 ? void 0 : config.browserWsEndpoint)
            config.browserWSEndpoint = config.browserWsEndpoint;
        const args = [...puppeteer_config_1.puppeteerConfig.chromiumArgs, ...((config === null || config === void 0 ? void 0 : config.chromiumArgs) || [])];
        if (config === null || config === void 0 ? void 0 : config.corsFix)
            args.push('--disable-web-security');
        const browser = (config === null || config === void 0 ? void 0 : config.browserWSEndpoint) ? yield puppeteer.connect(Object.assign({}, config)) : yield puppeteer.launch(Object.assign({ headless: true, devtools: false, args }, config));
        //devtools
        if (config && config.devtools) {
            const devtools = require('puppeteer-extra-plugin-devtools')();
            if (config.devtools.user && config.devtools.pass)
                devtools.setAuthCredentials(config.devtools.user, config.devtools.pass);
            try {
                // const tunnel = await devtools.createTunnel(browser);
                const tunnel = devtools.getLocalDevToolsUrl(browser);
                console.log('\ndevtools URL: ' + tunnel);
            }
            catch (error) {
                console.log("TCL: initBrowser -> error", error);
            }
        }
        return browser;
    });
}
function getWAPage(browser) {
    return __awaiter(this, void 0, void 0, function* () {
        const pages = yield browser.pages();
        console.assert(pages.length > 0);
        return pages[0];
    });
}
ON_DEATH(() => __awaiter(void 0, void 0, void 0, function* () {
    //clean up code here
    if (browser)
        yield browser.close();
}));
