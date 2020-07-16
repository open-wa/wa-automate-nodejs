"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var path = __importStar(require("path"));
var fs = require('fs');
var ChromeLauncher = require('chrome-launcher');
var puppeteer = require('puppeteer-extra');
var devtools = require('puppeteer-extra-plugin-devtools')();
var StealthPlugin = require('puppeteer-extra-plugin-stealth');
var puppeteer_config_1 = require("../config/puppeteer.config");
var ON_DEATH = require('death');
var browser;
var axios_1 = __importDefault(require("axios"));
function initClient(sessionId, config, customUserAgent) {
    return __awaiter(this, void 0, void 0, function () {
        var waPage, cacheEnabled, blockCrashLogs, sessionjsonpath, sessionjson;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (config === null || config === void 0 ? void 0 : config.useStealth)
                        puppeteer.use(StealthPlugin());
                    return [4, initBrowser(sessionId, config)];
                case 1:
                    browser = _a.sent();
                    return [4, getWAPage(browser)];
                case 2:
                    waPage = _a.sent();
                    if (!(config === null || config === void 0 ? void 0 : config.proxyServerCredentials)) return [3, 4];
                    return [4, waPage.authenticate(config.proxyServerCredentials)];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4: return [4, waPage.setUserAgent(customUserAgent || puppeteer_config_1.useragent)];
                case 5:
                    _a.sent();
                    return [4, waPage.setViewport({
                            width: puppeteer_config_1.width,
                            height: puppeteer_config_1.height,
                            deviceScaleFactor: 1
                        })];
                case 6:
                    _a.sent();
                    cacheEnabled = config && config.cacheEnabled ? config.cacheEnabled : true;
                    blockCrashLogs = config && config.blockCrashLogs ? config.blockCrashLogs : false;
                    return [4, waPage.setCacheEnabled(false)];
                case 7:
                    _a.sent();
                    return [4, waPage.setRequestInterception(true)];
                case 8:
                    _a.sent();
                    return [4, waPage._client.send('Network.setBypassServiceWorker', { bypass: true })];
                case 9:
                    _a.sent();
                    waPage.on('request', function (interceptedRequest) { return __awaiter(_this, void 0, void 0, function () {
                        var headers, data;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    headers = Object.assign({}, interceptedRequest.headers(), {
                                        DNT: 1
                                    });
                                    if (!(interceptedRequest.url().startsWith('https://web.whatsapp.com/app') || interceptedRequest.url() == 'https://web.whatsapp.com/app.cf3ea6417b5a935d1484.js' || interceptedRequest.url() == 'https://web.whatsapp.com/app2.39310839123cf8f74936.js')) return [3, 2];
                                    console.log('Intercepted app file. Mutating:', interceptedRequest.url());
                                    return [4, axios_1.default.get(interceptedRequest.url())];
                                case 1:
                                    data = (_a.sent()).data;
                                    interceptedRequest.respond({
                                        status: 200,
                                        body: data
                                            .replace("WAM_ENV:\"PROD\"", "WAM_ENV:\"DEV\"")
                                            .replace("WRITE_TO_CONSOLE:!1", "WRITE_TO_CONSOLE:!0")
                                            .replace("WEB_VOIP_VOICE_CALL:!1", "WEB_VOIP_VOICE_CALL:!0")
                                            .replace("WEB_VOIP_VIDEO_CALL:!1", "WEB_VOIP_VIDEO_CALL:!0")
                                            .replace("WEB_VOIP_INTERNAL_TESTER:!1", "WEB_VOIP_INTERNAL_TESTER:!0")
                                            .replace("MD_VOIP_VIDEO:!1", "MD_VOIP_VIDEO:!0")
                                            .replace("MD_VOIP_GROUP_AUDIO:!1", "MD_VOIP_GROUP_AUDIO:!0")
                                            .replace("MD_VOIP_AUDIO:!1", "MD_VOIP_AUDIO:!0")
                                            .replace("DESKTOP_VOIP_VOICE_CALL:!A", "DESKTOP_VOIP_VOICE_CALL:!0")
                                            .replace("DESKTOP_VOIP_VIDEO_CALL:O", "DESKTOP_VOIP_VOICE_CALL:!0")
                                            .replace("VOIP_VOICE_CALL:!A", "VOIP_VOICE_CALL:!0")
                                            .replace("MEDIA_EDITOR:!1", "MEDIA_EDITOR:!0")
                                            .replace("EPHEMERAL_MESSAGES_SETTING:!1", "EPHEMERAL_MESSAGES_SETTING:!0")
                                            .replace("EPHEMERAL_MESSAGES:!1", "EPHEMERAL_MESSAGES:!0")
                                            .replace("GROUPS_V3:!1", "GROUPS_V3:!0")
                                            .replace("CAMELOT_WEB:!1", "CAMELOT_WEB:!0")
                                            .replace("USE_NOTIFICATION_QUERY:!1", "USE_NOTIFICATION_QUERY:!0")
                                            .replace("STATUS_VIDEO_MAX_DURATION:30", "STATUS_VIDEO_MAX_DURATION:300000")
                                            .replace("PRODUCT_MEDIA_ATTACHMENTS:!1", "PRODUCT_MEDIA_ATTACHMENTS:!0")
                                            .replace("STATUS_RANKING:!1", "STATUS_RANKING:!0")
                                            .replace("WEB_VOIP_INTERNAL_TESTER:!1", "WEB_VOIP_INTERNAL_TESTER:!0")
                                            .replace("a.webClientShouldHandle=(0,u.prop)(!1)", "a.webClientShouldHandle=(0,u.prop)(!0)")
                                            .replace("MD_HSM:!1", "MD_HSM:!0")
                                            .replace("DARK_MODE:!A", "DARK_MODE:!0")
                                            .replace("CATALOG_MANAGER:!1", "CATALOG_MANAGER:!0")
                                            .replace("t.isCallKitSupported=function(){return!1}", "t.isCallKitSupported=function(){return!0}")
                                            .replace("t.checkVoipCapability=function(e){return Promise.resolve(!1)}", "t.checkVoipCapability=function(e){return Promise.resolve(!0)}")
                                            .replace("{\"use strict\";function a(){return\"PROD\"}Object.defineProperty(t,\"__esModule\",{value:!0}),t.getEnv=a,t.isProd=function(){return!0},t.isIntern=function(){return!1},t.isDev=function(){return!1},t.env=function(e){return e.PROD}}", "{\"use strict\";function a(){return\"DEV\"}Object.defineProperty(t,\"__esModule\",{value:!0}),t.getEnv=a,t.isProd=function(){return!1},t.isIntern=function(){return!1},t.isDev=function(){return!0},t.env=function(e){return e.DEV}}")
                                    });
                                    return [3, 3];
                                case 2:
                                    if (interceptedRequest.url().includes('https://crashlogs.whatsapp.net/') && blockCrashLogs) {
                                        interceptedRequest.abort();
                                    }
                                    else
                                        interceptedRequest.continue();
                                    _a.label = 3;
                                case 3: return [2];
                            }
                        });
                    }); });
                    sessionjsonpath = path.join(process.cwd(), (sessionId || 'session') + ".data.json");
                    sessionjson = config === null || config === void 0 ? void 0 : config.sessionData;
                    if (fs.existsSync(sessionjsonpath))
                        sessionjson = JSON.parse(fs.readFileSync(sessionjsonpath));
                    if (!sessionjson) return [3, 11];
                    return [4, waPage.evaluateOnNewDocument(function (session) {
                            localStorage.clear();
                            Object.keys(session).forEach(function (key) { return localStorage.setItem(key, session[key]); });
                        }, sessionjson)];
                case 10:
                    _a.sent();
                    _a.label = 11;
                case 11: return [4, waPage.goto(puppeteer_config_1.puppeteerConfig.WAUrl)];
                case 12:
                    _a.sent();
                    return [2, waPage];
            }
        });
    });
}
exports.initClient = initClient;
function injectApi(page) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, page.addScriptTag({
                        path: require.resolve(path.join(__dirname, '../lib', 'wapi.js'))
                    })];
                case 1:
                    _a.sent();
                    return [4, page.addScriptTag({
                            path: require.resolve(path.join(__dirname, '../lib', 'middleware.js'))
                        })];
                case 2:
                    _a.sent();
                    return [4, page.addScriptTag({
                            path: require.resolve(path.join(__dirname, '../lib', 'axios.min.js'))
                        })];
                case 3:
                    _a.sent();
                    return [2, page];
            }
        });
    });
}
exports.injectApi = injectApi;
function initBrowser(sessionId, config) {
    if (config === void 0) { config = {}; }
    var _a;
    return __awaiter(this, void 0, void 0, function () {
        var browser, tunnel;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (config === null || config === void 0 ? void 0 : config.useChrome) {
                        config.executablePath = ChromeLauncher.Launcher.getInstallations()[0];
                    }
                    if ((_a = config === null || config === void 0 ? void 0 : config.proxyServerCredentials) === null || _a === void 0 ? void 0 : _a.address)
                        puppeteer_config_1.puppeteerConfig.chromiumArgs.push("--proxy-server=" + config.proxyServerCredentials.address);
                    return [4, puppeteer.launch(__assign({ headless: true, devtools: false, args: __spreadArrays(puppeteer_config_1.puppeteerConfig.chromiumArgs) }, config))];
                case 1:
                    browser = _b.sent();
                    if (config && config.devtools) {
                        if (config.devtools.user && config.devtools.pass)
                            devtools.setAuthCredentials(config.devtools.user, config.devtools.pass);
                        try {
                            tunnel = devtools.getLocalDevToolsUrl(browser);
                            console.log('\ndevtools URL: ' + tunnel);
                        }
                        catch (error) {
                            console.log("TCL: initBrowser -> error", error);
                        }
                    }
                    return [2, browser];
            }
        });
    });
}
function getWAPage(browser) {
    return __awaiter(this, void 0, void 0, function () {
        var pages;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, browser.pages()];
                case 1:
                    pages = _a.sent();
                    console.assert(pages.length > 0);
                    return [2, pages[0]];
            }
        });
    });
}
ON_DEATH(function (signal, err) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!browser) return [3, 2];
                return [4, browser.close()];
            case 1:
                _a.sent();
                _a.label = 2;
            case 2:
                console.log('broswerclosed');
                return [2];
        }
    });
}); });
