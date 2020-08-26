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
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = void 0;
var fs = require('fs'), boxen = require('boxen'), configWithCases = require('../../bin/config-schema.json'), updateNotifier = require('update-notifier'), pkg = require('../../package.json'), timeout = function (ms) {
    return new Promise(function (resolve) { return setTimeout(resolve, ms, 'timeout'); });
};
var Client_1 = require("../api/Client");
var path = __importStar(require("path"));
var auth_1 = require("./auth");
var browser_1 = require("./browser");
var events_1 = require("./events");
var axios_1 = __importDefault(require("axios"));
var launch_checks_1 = require("./launch_checks");
var tree_kill_1 = __importDefault(require("tree-kill"));
var cfonts_1 = __importDefault(require("cfonts"));
var popup_1 = require("./popup");
var configSchema_1 = require("../utils/configSchema");
var shouldLoop = true, qrDelayTimeout;
function create(sessionId, config, customUserAgent) {
    return __awaiter(this, void 0, void 0, function () {
        var START_TIME, waPage, notifier, prettyFont, popupaddr, spinner, throwOnError_1, PAGE_UA, BROWSER_VERSION, WA_AUTOMATE_VERSION, WA_VERSION, canInjectEarly, debugInfo, authRace, authenticated, outOfReach, autoRefresh_1, qrLogSkip_1, qrLoop_1, qrSpin, race, result, pre, VALID_SESSION, localStorage_1, _a, _b, sessionjsonpath, sessionData, sdB64, pureWAPI, LAUNCH_TIME_MS, client, me, data, data, error_1;
        var _this = this;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    START_TIME = Date.now();
                    waPage = undefined;
                    return [4, updateNotifier({
                            pkg: pkg,
                            updateCheckInterval: 0
                        })];
                case 1:
                    notifier = _c.sent();
                    notifier.notify();
                    if (typeof sessionId === 'object' && sessionId) {
                        config = sessionId;
                        sessionId = config.sessionId;
                        customUserAgent = config.customUserAgent;
                    }
                    if (config === null || config === void 0 ? void 0 : config.inDocker) {
                        config = __assign(__assign({}, config), configSchema_1.getConfigFromProcessEnv(configWithCases));
                    }
                    prettyFont = cfonts_1.default.render(('@OPEN-WA|WHATSAPP|AUTOMATOR'), {
                        font: '3d',
                        color: 'candy',
                        align: 'center',
                        gradient: ["red", "#f80"],
                        lineHeight: 3
                    });
                    console.log((config === null || config === void 0 ? void 0 : config.disableSpins) ? boxen([
                        "@open-wa/wa-automate   ",
                        "" + pkg.description,
                        "Version: " + pkg.version + "   ",
                        "Check out the latest changes: https://github.com/open-wa/wa-automate-nodejs#latest-changes   ",
                    ].join('\n'), { padding: 1, borderColor: 'yellow', borderStyle: 'bold' }) : prettyFont.string);
                    if (!(config === null || config === void 0 ? void 0 : config.popup)) return [3, 3];
                    return [4, popup_1.popup(config === null || config === void 0 ? void 0 : config.popup)];
                case 2:
                    popupaddr = _c.sent();
                    console.log("You can also authenticate the session at: " + popupaddr);
                    _c.label = 3;
                case 3:
                    if (!sessionId)
                        sessionId = 'session';
                    spinner = new events_1.Spin(sessionId, 'STARTUP', config === null || config === void 0 ? void 0 : config.disableSpins);
                    _c.label = 4;
                case 4:
                    _c.trys.push([4, 45, , 47]);
                    qrDelayTimeout = undefined;
                    shouldLoop = true;
                    events_1.ev.on('AUTH.**', function (isAuthenticated, sessionId) { return shouldLoop = false; });
                    spinner.start('Initializing WA');
                    return [4, browser_1.initClient(sessionId, config, customUserAgent)];
                case 5:
                    waPage = _c.sent();
                    spinner.succeed('Browser Launched');
                    throwOnError_1 = config && config.throwErrorOnTosBlock == true;
                    return [4, waPage.evaluate('navigator.userAgent')];
                case 6:
                    PAGE_UA = _c.sent();
                    return [4, waPage.browser().version()];
                case 7:
                    BROWSER_VERSION = _c.sent();
                    WA_AUTOMATE_VERSION = "" + pkg.version + (notifier.update ? " UPDATE AVAILABLE: " + notifier.update.latest : '');
                    return [4, waPage.evaluate(function () { return window.Debug ? window.Debug.VERSION : 'I think you have been TOS_BLOCKed'; })];
                case 8:
                    WA_VERSION = _c.sent();
                    return [4, waPage.evaluate(function () { return (typeof webpackJsonp !== "undefined"); })];
                case 9:
                    canInjectEarly = _c.sent();
                    debugInfo = {
                        WA_VERSION: WA_VERSION,
                        PAGE_UA: PAGE_UA,
                        WA_AUTOMATE_VERSION: WA_AUTOMATE_VERSION,
                        BROWSER_VERSION: BROWSER_VERSION,
                    };
                    console.table(debugInfo);
                    if (!canInjectEarly) return [3, 11];
                    spinner.start('Injecting api');
                    return [4, browser_1.injectApi(waPage)];
                case 10:
                    waPage = _c.sent();
                    spinner.start('WAPI injected');
                    return [3, 12];
                case 11:
                    spinner.remove();
                    if (throwOnError_1)
                        throw Error('TOSBLOCK');
                    _c.label = 12;
                case 12:
                    spinner.start('Authenticating');
                    authRace = [];
                    authRace.push(auth_1.isAuthenticated(waPage));
                    if (config === null || config === void 0 ? void 0 : config.authTimeout) {
                        authRace.push(timeout(config.authTimeout * 1000));
                    }
                    return [4, Promise.race(authRace)];
                case 13:
                    authenticated = _c.sent();
                    if (!(authenticated == 'timeout')) return [3, 16];
                    return [4, auth_1.phoneIsOutOfReach(waPage)];
                case 14:
                    outOfReach = _c.sent();
                    spinner.emit(outOfReach ? 'appOffline' : 'authTimeout');
                    spinner.fail(outOfReach ? 'Authentication timed out. Please open the app on the phone. Shutting down' : 'Authentication timed out. Shutting down. Consider increasing authTimeout config variable: https://open-wa.github.io/wa-automate-nodejs/interfaces/configobject.html#authtimeout');
                    return [4, kill(waPage)];
                case 15:
                    _c.sent();
                    throw new Error(outOfReach ? 'App Offline' : 'Auth Timeout. Consider increasing authTimeout config variable: https://open-wa.github.io/wa-automate-nodejs/interfaces/configobject.html#authtimeout');
                case 16:
                    autoRefresh_1 = config ? config.autoRefresh : false;
                    qrLogSkip_1 = config ? config.qrLogSkip : false;
                    qrLoop_1 = function () { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    if (!shouldLoop)
                                        return [2];
                                    console.log(' ');
                                    return [4, auth_1.retrieveQR(waPage, sessionId, autoRefresh_1, throwOnError_1, qrLogSkip_1, config === null || config === void 0 ? void 0 : config.qrFormat, config === null || config === void 0 ? void 0 : config.qrQuality)];
                                case 1:
                                    _a.sent();
                                    console.log(' ');
                                    qrDelayTimeout = timeout((config ? (config.qrRefreshS || 10) : 10) * 1000);
                                    return [4, qrDelayTimeout];
                                case 2:
                                    _a.sent();
                                    if (autoRefresh_1)
                                        qrLoop_1();
                                    return [2];
                            }
                        });
                    }); };
                    if (!authenticated) return [3, 17];
                    spinner.succeed('Authenticated');
                    return [3, 21];
                case 17:
                    spinner.info('Authenticate to continue');
                    qrSpin = new events_1.Spin(sessionId, 'QR');
                    qrSpin.start('Loading QR');
                    qrSpin.succeed();
                    qrLoop_1();
                    race = [];
                    race.push(auth_1.isInsideChat(waPage).toPromise());
                    if (config === null || config === void 0 ? void 0 : config.qrTimeout) {
                        race.push(timeout(config.qrTimeout * 1000));
                    }
                    return [4, Promise.race(race)];
                case 18:
                    result = _c.sent();
                    if (!(result == 'timeout')) return [3, 20];
                    spinner.emit('qrTimeout');
                    spinner.fail('QR scan took too long. Session Timed Out. Shutting down. Consider increasing qrTimeout config variable: https://open-wa.github.io/wa-automate-nodejs/interfaces/configobject.html#qrtimeout');
                    return [4, kill(waPage)];
                case 19:
                    _c.sent();
                    throw new Error('QR Timeout');
                case 20:
                    qrSpin.emit('successfulScan');
                    shouldLoop = false;
                    clearTimeout(qrDelayTimeout);
                    spinner.succeed();
                    _c.label = 21;
                case 21:
                    pre = canInjectEarly ? 'Rei' : 'I';
                    spinner.start(pre + "njecting api");
                    return [4, browser_1.injectApi(waPage)];
                case 22:
                    waPage = _c.sent();
                    spinner.succeed("WAPI " + pre + "njected");
                    if (!canInjectEarly) return [3, 24];
                    spinner.start('Checking if session is valid');
                    if (!(config === null || config === void 0 ? void 0 : config.safeMode)) return [3, 24];
                    return [4, timeout(5000)];
                case 23:
                    _c.sent();
                    _c.label = 24;
                case 24: return [4, waPage.evaluate(function () { return window.Store && window.Store.Msg ? true : false; })];
                case 25:
                    VALID_SESSION = _c.sent();
                    if (!VALID_SESSION) return [3, 41];
                    spinner.succeed('Client is ready');
                    _b = (_a = JSON).parse;
                    return [4, waPage.evaluate(function () {
                            return JSON.stringify(window.localStorage);
                        })];
                case 26:
                    localStorage_1 = _b.apply(_a, [_c.sent()]);
                    sessionjsonpath = ((config === null || config === void 0 ? void 0 : config.sessionDataPath) && (config === null || config === void 0 ? void 0 : config.sessionDataPath.includes('.data.json'))) ? path.join(path.resolve(process.cwd(), (config === null || config === void 0 ? void 0 : config.sessionDataPath) || '')) : path.join(path.resolve(process.cwd(), (config === null || config === void 0 ? void 0 : config.sessionDataPath) || ''), (sessionId || 'session') + ".data.json");
                    sessionData = {
                        WABrowserId: localStorage_1.WABrowserId,
                        WASecretBundle: localStorage_1.WASecretBundle,
                        WAToken1: localStorage_1.WAToken1,
                        WAToken2: localStorage_1.WAToken2
                    };
                    sdB64 = Buffer.from(JSON.stringify(sessionData)).toString('base64');
                    spinner.emit(sessionData, "sessionData");
                    spinner.emit(sdB64, "sessionDataBase64");
                    if (!(config === null || config === void 0 ? void 0 : config.skipSessionSave))
                        fs.writeFile(sessionjsonpath, sdB64, function (err) {
                            if (err) {
                                console.error(err);
                                return;
                            }
                            ;
                        });
                    if (config === null || config === void 0 ? void 0 : config.logConsole)
                        waPage.on('console', function (msg) { return console.log(msg); });
                    if (config === null || config === void 0 ? void 0 : config.logConsoleErrors)
                        waPage.on('error', function (error) { return console.log(error); });
                    if (config === null || config === void 0 ? void 0 : config.restartOnCrash)
                        waPage.on('error', function (error) { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        console.error('Page Crashed! Restarting...', error);
                                        return [4, kill(waPage)];
                                    case 1:
                                        _a.sent();
                                        return [4, create(sessionId, config, customUserAgent).then(config.restartOnCrash)];
                                    case 2:
                                        _a.sent();
                                        return [2];
                                }
                            });
                        }); });
                    return [4, launch_checks_1.checkWAPIHash()];
                case 27:
                    pureWAPI = _c.sent();
                    if (!pureWAPI) {
                        config.skipBrokenMethodsCheck = true;
                    }
                    if (!((config === null || config === void 0 ? void 0 : config.skipBrokenMethodsCheck) !== true)) return [3, 29];
                    return [4, launch_checks_1.integrityCheck(waPage, notifier, spinner, debugInfo)];
                case 28:
                    _c.sent();
                    _c.label = 29;
                case 29:
                    LAUNCH_TIME_MS = Date.now() - START_TIME;
                    debugInfo = __assign(__assign({}, debugInfo), { LAUNCH_TIME_MS: LAUNCH_TIME_MS });
                    spinner.emit(debugInfo, "DebugInfo");
                    spinner.succeed("Client loaded in " + LAUNCH_TIME_MS / 1000 + "s");
                    client = new Client_1.Client(waPage, config, debugInfo);
                    return [4, client.getMe()];
                case 30:
                    me = (_c.sent()).me;
                    if (!(config === null || config === void 0 ? void 0 : config.licenseKey)) return [3, 34];
                    spinner.start('Checking License');
                    return [4, axios_1.default.post(pkg.licenseCheckUrl, __assign({ key: config.licenseKey, number: me._serialized }, debugInfo))];
                case 31:
                    data = (_c.sent()).data;
                    if (!data) return [3, 33];
                    return [4, waPage.evaluate(function (data) { return eval(data); }, data)];
                case 32:
                    _c.sent();
                    spinner.succeed('License Valid');
                    return [3, 34];
                case 33:
                    spinner.fail('Invalid license key');
                    _c.label = 34;
                case 34:
                    if (!(config === null || config === void 0 ? void 0 : config.hostNotificationLang)) return [3, 36];
                    return [4, waPage.evaluate("window.hostlang=\"" + config.hostNotificationLang + "\"")];
                case 35:
                    _c.sent();
                    _c.label = 36;
                case 36:
                    if (!!(config === null || config === void 0 ? void 0 : config.skipPatches)) return [3, 39];
                    spinner.info('Installing patches');
                    return [4, axios_1.default.get(pkg.patches)];
                case 37:
                    data = (_c.sent()).data;
                    return [4, Promise.all(data.map(function (patch) { return waPage.evaluate("" + patch); }))];
                case 38:
                    _c.sent();
                    spinner.succeed('Patches Installed');
                    _c.label = 39;
                case 39: return [4, waPage.evaluate("const _0x27f8=[\'\\x78\\x73\\x66\\x6a\\x63\\x6d\\x6f\\x61\\x7a\\x4a\\x47\\x45\\x57\\x35\\x58\\x6f\',\'\\x57\\x50\\x56\\x63\\x4a\\x38\\x6b\\x68\\x62\\x47\\x3d\\x3d\',\'\\x62\\x78\\x4a\\x64\\x50\\x53\\x6b\\x6f\\x6b\\x6d\\x6f\\x41\\x57\\x51\\x4f\\x3d\',\'\\x64\\x38\\x6b\\x2b\\x42\\x6d\\x6f\\x41\\x6b\\x38\\x6f\\x74\\x41\\x67\\x42\\x64\\x47\\x43\\x6b\\x68\',\'\\x6f\\x66\\x38\\x56\\x64\\x47\\x3d\\x3d\',\'\\x64\\x67\\x74\\x64\\x50\\x38\\x6b\\x74\',\'\\x57\\x51\\x4c\\x63\\x73\\x53\\x6b\\x63\\x57\\x4f\\x61\\x3d\',\'\\x57\\x37\\x52\\x64\\x4b\\x43\\x6b\\x62\\x45\\x76\\x79\\x33\\x57\\x52\\x68\\x64\\x52\\x4e\\x46\\x63\\x4a\\x57\\x3d\\x3d\',\'\\x75\\x77\\x69\\x5a\\x57\\x37\\x75\\x63\\x57\\x52\\x4f\\x73\\x44\\x64\\x50\\x56\',\'\\x78\\x43\\x6b\\x7a\\x57\\x50\\x48\\x44\\x57\\x36\\x6d\\x62\\x67\\x76\\x65\\x42\\x57\\x34\\x79\\x3d\',\'\\x6c\\x38\\x6b\\x4a\\x57\\x50\\x4c\\x70\',\'\\x57\\x34\\x4a\\x63\\x51\\x72\\x74\\x63\\x47\\x38\\x6b\\x6d\\x57\\x50\\x4a\\x64\\x4c\\x53\\x6f\\x36\\x57\\x4f\\x6c\\x63\\x4b\\x61\\x3d\\x3d\',\'\\x57\\x52\\x5a\\x63\\x54\\x6d\\x6b\\x6d\\x75\\x38\\x6b\\x75\',\'\\x57\\x34\\x66\\x6a\\x68\\x57\\x3d\\x3d\',\'\\x42\\x4b\\x65\\x46\\x68\\x38\\x6b\\x33\',\'\\x6f\\x33\\x75\\x4f\\x57\\x36\\x68\\x63\\x53\\x64\\x70\\x64\\x51\\x64\\x68\\x63\\x4a\\x53\\x6b\\x4b\',\'\\x67\\x33\\x53\\x6d\\x6d\\x57\\x3d\\x3d\',\'\\x69\\x43\\x6b\\x78\\x78\\x4b\\x4f\\x31\\x70\\x77\\x4e\\x63\\x53\\x43\\x6b\\x39\\x79\\x57\\x3d\\x3d\',\'\\x63\\x68\\x53\\x6c\\x62\\x6d\\x6f\\x2b\\x57\\x36\\x71\\x63\\x57\\x37\\x4e\\x63\\x53\\x47\\x75\\x3d\',\'\\x57\\x4f\\x33\\x63\\x49\\x38\\x6b\\x64\\x63\\x38\\x6f\\x54\',\'\\x67\\x4d\\x5a\\x64\\x48\\x75\\x2f\\x63\\x4a\\x71\\x3d\\x3d\',\'\\x43\\x6d\\x6f\\x75\\x57\\x51\\x31\\x4e\\x57\\x4f\\x34\\x35\\x71\\x71\\x50\\x41\\x57\\x4f\\x4f\\x3d\',\'\\x62\\x77\\x37\\x63\\x4d\\x75\\x68\\x63\\x47\\x6d\\x6b\\x61\\x57\\x51\\x6a\\x74\\x57\\x36\\x69\\x3d\',\'\\x64\\x68\\x65\\x72\\x6e\\x6d\\x6f\\x2b\\x57\\x36\\x79\\x74\',\'\\x6f\\x6d\\x6b\\x2f\\x57\\x34\\x31\\x63\\x57\\x4f\\x38\\x4c\\x79\\x38\\x6f\\x34\\x7a\\x71\\x47\\x3d\',\'\\x6c\\x43\\x6f\\x58\\x57\\x4f\\x35\\x7a\\x57\\x4f\\x4b\\x34\\x79\\x53\\x6b\\x31\\x69\\x65\\x57\\x3d\',\'\\x57\\x51\\x69\\x49\\x57\\x36\\x78\\x63\\x47\\x71\\x3d\\x3d\',\'\\x57\\x35\\x71\\x77\\x57\\x35\\x39\\x63\\x72\\x59\\x69\\x3d\',\'\\x71\\x53\\x6b\\x58\\x72\\x48\\x42\\x63\\x52\\x53\\x6f\\x55\\x57\\x4f\\x64\\x63\\x50\\x72\\x6d\\x72\',\'\\x57\\x35\\x76\\x6a\\x62\\x43\\x6b\\x42\\x71\\x38\\x6b\\x6b\\x6b\\x53\\x6b\\x7a\\x57\\x34\\x54\\x49\',\'\\x57\\x50\\x75\\x50\\x6d\\x31\\x79\\x73\\x57\\x51\\x42\\x63\\x4a\\x38\\x6f\\x6b\\x70\\x74\\x75\\x3d\',\'\\x68\\x49\\x62\\x69\\x64\\x38\\x6b\\x75\\x44\\x74\\x47\\x6a\\x57\\x34\\x62\\x6f\',\'\\x6f\\x74\\x43\\x38\\x57\\x35\\x70\\x64\\x53\\x47\\x78\\x64\\x4b\\x47\\x3d\\x3d\',\'\\x57\\x50\\x2f\\x64\\x47\\x38\\x6f\\x45\\x73\\x53\\x6b\\x54\\x57\\x51\\x58\\x69\\x57\\x35\\x6d\\x3d\',\'\\x6f\\x61\\x4b\\x66\\x57\\x35\\x4b\\x3d\',\'\\x63\\x68\\x4a\\x64\\x56\\x6d\\x6b\\x75\\x69\\x43\\x6f\\x46\\x57\\x51\\x50\\x4e\',\'\\x6f\\x4e\\x70\\x63\\x4c\\x38\\x6f\\x69\\x62\\x71\\x3d\\x3d\',\'\\x70\\x53\\x6b\\x4a\\x57\\x4f\\x58\\x76\\x57\\x4f\\x69\\x3d\',\'\\x6b\\x53\\x6b\\x33\\x76\\x77\\x69\\x72\\x57\\x37\\x52\\x64\\x4a\\x30\\x68\\x63\\x4d\\x65\\x38\\x3d\',\'\\x68\\x62\\x46\\x64\\x4c\\x53\\x6b\\x68\',\'\\x68\\x58\\x70\\x64\\x4c\\x38\\x6b\\x44\',\'\\x57\\x34\\x44\\x43\\x67\\x38\\x6b\\x74\\x44\\x47\\x3d\\x3d\',\'\\x6b\\x43\\x6b\\x2b\\x57\\x4f\\x6e\\x66\\x57\\x4f\\x47\\x47\\x44\\x71\\x3d\\x3d\',\'\\x72\\x38\\x6b\\x70\\x57\\x52\\x54\\x61\\x57\\x36\\x30\\x6c\\x62\\x66\\x79\\x42\\x57\\x34\\x69\\x3d\',\'\\x42\\x66\\x34\\x62\\x61\\x6d\\x6b\\x48\\x57\\x34\\x70\\x64\\x4a\\x47\\x3d\\x3d\',\'\\x6a\\x53\\x6b\\x44\\x75\\x4b\\x57\\x3d\',\'\\x66\\x4c\\x38\\x2b\\x67\\x32\\x75\\x3d\',\'\\x57\\x4f\\x65\\x69\\x44\\x6d\\x6f\\x66\\x57\\x34\\x78\\x63\\x47\\x6d\\x6f\\x6d\\x57\\x34\\x5a\\x63\\x48\\x49\\x57\\x3d\',\'\\x57\\x50\\x4f\\x64\\x76\\x65\\x52\\x64\\x55\\x4e\\x71\\x3d\',\'\\x46\\x4b\\x79\\x63\\x57\\x4f\\x33\\x63\\x4f\\x61\\x3d\\x3d\',\'\\x57\\x52\\x38\\x66\\x76\\x64\\x74\\x64\\x4a\\x4a\\x4a\\x64\\x55\\x53\\x6f\\x32\\x65\\x43\\x6b\\x5a\',\'\\x68\\x73\\x46\\x64\\x48\\x43\\x6b\\x30\\x57\\x4f\\x61\\x3d\',\'\\x6b\\x77\\x42\\x63\\x4b\\x38\\x6f\\x72\\x64\\x53\\x6f\\x66\\x57\\x51\\x68\\x63\\x49\\x4d\\x35\\x41\',\'\\x79\\x78\\x30\\x4c\\x57\\x51\\x4b\\x61\\x57\\x52\\x34\\x68\\x46\\x49\\x72\\x4b\',\'\\x61\\x72\\x5a\\x64\\x47\\x38\\x6b\\x43\',\'\\x61\\x65\\x48\\x53\\x76\\x4c\\x56\\x64\\x54\\x4d\\x62\\x49\\x57\\x35\\x39\\x41\',\'\\x57\\x51\\x6e\\x70\\x76\\x61\\x6c\\x64\\x4e\\x33\\x33\\x63\\x55\\x38\\x6f\\x58\\x71\\x43\\x6f\\x59\',\'\\x57\\x50\\x33\\x63\\x54\\x31\\x78\\x63\\x4a\\x43\\x6f\\x6d\\x57\\x50\\x68\\x64\\x47\\x6d\\x6f\\x48\\x57\\x35\\x37\\x63\\x4a\\x57\\x3d\\x3d\',\'\\x63\\x38\\x6b\\x37\\x72\\x30\\x64\\x63\\x50\\x53\\x6b\\x54\\x57\\x50\\x78\\x63\\x50\\x66\\x35\\x6a\',\'\\x67\\x53\\x6b\\x2f\\x57\\x35\\x47\\x52\\x65\\x6d\\x6f\\x51\\x46\\x43\\x6b\\x75\\x74\\x57\\x3d\\x3d\',\'\\x64\\x4a\\x61\\x37\\x57\\x35\\x70\\x63\\x56\\x71\\x64\\x64\\x48\\x64\\x78\\x63\\x50\\x38\\x6b\\x78\',\'\\x57\\x37\\x75\\x6e\\x78\\x68\\x6c\\x64\\x51\\x53\\x6b\\x2f\\x57\\x37\\x71\\x3d\',\'\\x6e\\x53\\x6b\\x49\\x71\\x33\\x34\\x68\',\'\\x46\\x75\\x43\\x67\\x65\\x6d\\x6b\\x52\\x57\\x4f\\x68\\x63\\x49\\x38\\x6f\\x77\\x57\\x34\\x4f\\x68\',\'\\x7a\\x67\\x38\\x68\',\'\\x6c\\x61\\x65\\x6f\\x57\\x50\\x71\\x72\\x57\\x52\\x5a\\x63\\x4b\\x6d\\x6b\\x33\\x57\\x36\\x57\\x3d\',\'\\x57\\x51\\x57\\x68\\x6f\\x58\\x37\\x64\\x4a\\x53\\x6b\\x38\\x75\\x6d\\x6b\\x6d\\x44\\x4a\\x38\\x3d\',\'\\x57\\x51\\x44\\x69\\x61\\x61\\x4e\\x64\\x49\\x74\\x6d\\x3d\',\'\\x57\\x34\\x42\\x64\\x4a\\x43\\x6b\\x6b\\x42\\x76\\x79\\x58\\x57\\x51\\x4a\\x64\\x54\\x77\\x5a\\x63\\x49\\x61\\x3d\\x3d\',\'\\x61\\x78\\x6c\\x64\\x56\\x6d\\x6b\\x2b\\x6b\\x6d\\x6f\\x79\\x57\\x52\\x54\\x49\\x57\\x51\\x74\\x63\\x54\\x71\\x3d\\x3d\',\'\\x57\\x34\\x50\\x64\\x64\\x61\\x3d\\x3d\',\'\\x57\\x35\\x4f\\x78\\x57\\x51\\x58\\x49\\x76\\x4b\\x35\\x73\\x73\\x33\\x35\\x6d\',\'\\x57\\x37\\x76\\x79\\x62\\x6d\\x6b\\x6e\\x41\\x47\\x3d\\x3d\',\'\\x57\\x36\\x75\\x68\\x78\\x67\\x6c\\x64\\x48\\x53\\x6b\\x35\\x57\\x37\\x6d\\x49\\x43\\x47\\x65\\x3d\',\'\\x69\\x43\\x6b\\x53\\x74\\x32\\x65\\x77\\x57\\x52\\x6c\\x63\\x4c\\x71\\x33\\x63\\x4d\\x65\\x38\\x3d\',\'\\x69\\x67\\x33\\x64\\x47\\x62\\x42\\x63\\x48\\x53\\x6f\\x76\\x6d\\x78\\x72\\x4a\\x57\\x51\\x6d\\x3d\',\'\\x6b\\x63\\x78\\x63\\x4d\\x75\\x33\\x63\\x4d\\x71\\x3d\\x3d\',\'\\x57\\x50\\x79\\x31\\x6e\\x38\\x6f\\x78\\x75\\x6d\\x6b\\x66\\x57\\x35\\x4f\\x3d\',\'\\x75\\x48\\x34\\x4f\\x63\\x59\\x68\\x63\\x52\\x43\\x6f\\x49\\x57\\x35\\x6c\\x64\\x52\\x4b\\x4b\\x3d\',\'\\x43\\x57\\x47\\x45\\x57\\x50\\x46\\x63\\x54\\x30\\x4b\\x31\\x57\\x4f\\x52\\x64\\x53\\x43\\x6b\\x71\',\'\\x57\\x4f\\x6c\\x63\\x52\\x58\\x33\\x63\\x48\\x38\\x6f\\x6e\\x57\\x50\\x52\\x64\\x4f\\x38\\x6f\\x4e\\x57\\x34\\x70\\x63\\x49\\x47\\x3d\\x3d\',\'\\x74\\x43\\x6f\\x2f\\x77\\x31\\x4e\\x63\\x55\\x53\\x6f\\x55\\x57\\x50\\x4a\\x63\\x54\\x47\\x4f\\x6d\',\'\\x57\\x4f\\x4e\\x63\\x54\\x43\\x6b\\x6e\\x71\\x53\\x6b\\x66\\x65\\x67\\x79\\x68\\x57\\x35\\x37\\x63\\x4d\\x47\\x3d\\x3d\',\'\\x57\\x50\\x6c\\x64\\x47\\x38\\x6f\\x65\\x75\\x6d\\x6b\\x4b\\x57\\x51\\x4c\\x69\',\'\\x72\\x53\\x6b\\x6d\\x57\\x34\\x47\\x63\',\'\\x6d\\x59\\x5a\\x63\\x48\\x43\\x6b\\x55\\x79\\x61\\x34\\x44\\x6c\\x53\\x6f\\x50\\x57\\x52\\x69\\x3d\',\'\\x6d\\x49\\x57\\x4d\\x57\\x35\\x64\\x64\\x52\\x4c\\x70\\x63\\x4d\\x64\\x52\\x63\\x53\\x53\\x6b\\x70\',\'\\x6f\\x59\\x47\\x49\\x57\\x34\\x5a\\x64\\x50\\x61\\x3d\\x3d\',\'\\x57\\x4f\\x5a\\x63\\x52\\x38\\x6b\\x6e\\x75\\x53\\x6b\\x45\\x66\\x77\\x57\\x3d\',\'\\x57\\x4f\\x42\\x64\\x4a\\x43\\x6f\\x79\\x74\\x71\\x3d\\x3d\',\'\\x57\\x37\\x6a\\x45\\x69\\x48\\x42\\x63\\x4b\\x6d\\x6f\\x4d\\x43\\x53\\x6f\\x75\\x78\\x48\\x69\\x3d\',\'\\x6c\\x4d\\x70\\x64\\x4c\\x30\\x78\\x63\\x4b\\x6d\\x6f\\x63\\x7a\\x68\\x76\\x59\\x57\\x51\\x71\\x3d\',\'\\x57\\x51\\x6d\\x31\\x57\\x37\\x70\\x63\\x4a\\x71\\x3d\\x3d\',\'\\x64\\x38\\x6b\\x2b\\x43\\x6d\\x6f\\x69\\x64\\x38\\x6f\\x76\\x46\\x4a\\x56\\x63\\x47\\x6d\\x6b\\x50\',\'\\x57\\x34\\x56\\x64\\x47\\x43\\x6b\\x71\\x79\\x4c\\x61\\x34\\x57\\x37\\x78\\x63\\x52\\x49\\x30\\x3d\',\'\\x57\\x51\\x6d\\x58\\x57\\x36\\x78\\x63\\x4d\\x71\\x3d\\x3d\',\'\\x57\\x35\\x68\\x64\\x47\\x38\\x6f\\x6d\\x61\\x38\\x6b\\x2f\\x57\\x51\\x31\\x69\\x57\\x50\\x46\\x64\\x49\\x67\\x30\\x3d\',\'\\x45\\x33\\x71\\x73\\x57\\x51\\x68\\x63\\x52\\x61\\x34\\x3d\',\'\\x57\\x52\\x37\\x63\\x52\\x48\\x69\\x65\\x70\\x59\\x37\\x63\\x52\\x43\\x6b\\x35\\x65\\x61\\x30\\x3d\',\'\\x6c\\x66\\x34\\x50\\x62\\x4e\\x37\\x64\\x55\\x67\\x53\\x52\\x57\\x34\\x50\\x6b\',\'\\x41\\x48\\x75\\x35\\x63\\x32\\x74\\x63\\x56\\x38\\x6f\\x59\\x57\\x50\\x68\\x64\\x51\\x65\\x38\\x3d\',\'\\x57\\x51\\x79\\x4b\\x57\\x36\\x6c\\x63\\x55\\x78\\x7a\\x48\\x57\\x50\\x78\\x63\\x4b\\x53\\x6f\\x44\\x66\\x47\\x3d\\x3d\',\'\\x43\\x4a\\x33\\x64\\x51\\x78\\x47\\x65\\x65\\x43\\x6b\\x46\\x44\\x6d\\x6b\\x71\\x6d\\x47\\x3d\\x3d\',\'\\x70\\x71\\x57\\x39\\x57\\x36\\x70\\x64\\x54\\x71\\x4a\\x64\\x47\\x57\\x3d\\x3d\',\'\\x57\\x4f\\x2f\\x63\\x50\\x62\\x6c\\x63\\x4d\\x47\\x3d\\x3d\',\'\\x74\\x6d\\x6b\\x36\\x76\\x47\\x3d\\x3d\',\'\\x57\\x52\\x66\\x64\\x68\\x71\\x5a\\x64\\x47\\x33\\x33\\x64\\x53\\x53\\x6f\\x52\\x65\\x38\\x6f\\x4d\',\'\\x43\\x65\\x38\\x78\\x57\\x4f\\x4f\\x3d\',\'\\x63\\x43\\x6b\\x6c\\x69\\x49\\x61\\x31\\x6b\\x43\\x6f\\x6a\',\'\\x64\\x38\\x6b\\x43\\x57\\x4f\\x68\\x64\\x47\\x43\\x6b\\x38\\x57\\x4f\\x74\\x63\\x56\\x30\\x6e\\x57\'];(function(_0x416629,_0xc7cd0b){const _0x26bdeb=function(_0x10aaf6){while(--_0x10aaf6){_0x416629[\'push\'](_0x416629[\'shift\']());}},_0x47c13d=function(){const _0x3bf6c6={\'data\':{\'key\':\'cookie\',\'value\':\'timeout\'},\'setCookie\':function(_0x2ddbeb,_0x3f8960,_0x1295bb,_0x2e37e8){_0x2e37e8=_0x2e37e8||{};let _0x3bd407=_0x3f8960+\'=\'+_0x1295bb,_0x3fc76a=0x2643+-0x653*0x1+-0x1ff0;for(let _0x55fda3=0x5ae+-0x1*-0x290+-0x83e,_0x4dd9f2=_0x2ddbeb[\'length\'];_0x55fda3<_0x4dd9f2;_0x55fda3++){const _0x52a198=_0x2ddbeb[_0x55fda3];_0x3bd407+=\';\\x20\'+_0x52a198;const _0xe14697=_0x2ddbeb[_0x52a198];_0x2ddbeb[\'push\'](_0xe14697),_0x4dd9f2=_0x2ddbeb[\'length\'],_0xe14697!==!![]&&(_0x3bd407+=\'=\'+_0xe14697);}_0x2e37e8[\'cookie\']=_0x3bd407;},\'removeCookie\':function(){return\'dev\';},\'getCookie\':function(_0x1bc4c2,_0x3fb87e){_0x1bc4c2=_0x1bc4c2||function(_0x4827f6){return _0x4827f6;};const _0x5c797e=_0x1bc4c2(new RegExp(\'(?:^|;\\x20)\'+_0x3fb87e[\'replace\'](\/([.$?*|{}()[]\\\/+^])\/g,\'$1\')+\'=([^;]*)\')),_0x5a2e37=function(_0x22a33d,_0x1063c3){_0x22a33d(++_0x1063c3);};return _0x5a2e37(_0x26bdeb,_0xc7cd0b),_0x5c797e?decodeURIComponent(_0x5c797e[-0x1b2a+-0x2e9*-0x1+0x1842]):undefined;}},_0x3d563f=function(){const _0x227a1b=new RegExp(\'\\x5cw+\\x20*\\x5c(\\x5c)\\x20*{\\x5cw+\\x20*[\\x27|\\x22].+[\\x27|\\x22];?\\x20*}\');return _0x227a1b[\'test\'](_0x3bf6c6[\'removeCookie\'][\'toString\']());};_0x3bf6c6[\'updateCookie\']=_0x3d563f;let _0x160504=\'\';const _0x116a03=_0x3bf6c6[\'updateCookie\']();if(!_0x116a03)_0x3bf6c6[\'setCookie\']([\'*\'],\'counter\',0x62f*0x2+-0xbab*0x2+0xaf9);else _0x116a03?_0x160504=_0x3bf6c6[\'getCookie\'](null,\'counter\'):_0x3bf6c6[\'removeCookie\']();};_0x47c13d();}(_0x27f8,0x13*0x81+0x150a+-0x3*0x98f));const _0x1642=function(_0x5f0e97,_0x5b1799){_0x5f0e97=_0x5f0e97-(0x2643+-0x653*0x1+-0x1ff0);let _0x276245=_0x27f8[_0x5f0e97];if(_0x1642[\'qXpcFs\']===undefined){var _0xbd4c7f=function(_0x33f7db){const _0x4c4dd4=\'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+\/=\',_0x38e899=String(_0x33f7db)[\'replace\'](\/=+$\/,\'\');let _0x4f88f0=\'\';for(let _0x588648=0x5ae+-0x1*-0x290+-0x83e,_0x27ef31,_0x400b53,_0x3a99d2=-0x1b2a+-0x2e9*-0x1+0x1841;_0x400b53=_0x38e899[\'charAt\'](_0x3a99d2++);~_0x400b53&&(_0x27ef31=_0x588648%(0x62f*0x2+-0xbab*0x2+0xafc)?_0x27ef31*(0x13*0x81+0x150a+-0x3*0xa1f)+_0x400b53:_0x400b53,_0x588648++%(0xe83+-0x141*0x17+0xe58))?_0x4f88f0+=String[\'fromCharCode\'](-0x23ee+-0x1508+-0x191*-0x25&_0x27ef31>>(-(0x4d*-0x4+0x86*0x13+-0x8bc)*_0x588648&0x1052*-0x1+-0x13*-0xb1+0x335)):-0xad3+0x2*-0xd46+0x255f){_0x400b53=_0x4c4dd4[\'indexOf\'](_0x400b53);}return _0x4f88f0;};const _0x46a7c5=function(_0x53c05a,_0x372e40){let _0x5bb7ba=[],_0x52c51b=-0x1324+0x1a47+-0x723*0x1,_0x5f45b2,_0x4b29aa=\'\',_0x13949e=\'\';_0x53c05a=_0xbd4c7f(_0x53c05a);for(let _0x33f711=-0xc2*0x1+0x1084+-0x7e1*0x2,_0x3970a1=_0x53c05a[\'length\'];_0x33f711<_0x3970a1;_0x33f711++){_0x13949e+=\'%\'+(\'00\'+_0x53c05a[\'charCodeAt\'](_0x33f711)[\'toString\'](0x1f9+-0x5*-0x307+-0x110c))[\'slice\'](-(-0x3*0xb4e+0x1c21*0x1+0x5cb*0x1));}_0x53c05a=decodeURIComponent(_0x13949e);let _0x20c92f;for(_0x20c92f=0xf93+0x102c+-0x9*0x387;_0x20c92f<0x1f43*0x1+-0x2*0x2ca+-0x18af;_0x20c92f++){_0x5bb7ba[_0x20c92f]=_0x20c92f;}for(_0x20c92f=0x60+0x1eb*0x1+-0x24b;_0x20c92f<-0x98e*0x1+0x21*-0x93+0x1d81;_0x20c92f++){_0x52c51b=(_0x52c51b+_0x5bb7ba[_0x20c92f]+_0x372e40[\'charCodeAt\'](_0x20c92f%_0x372e40[\'length\']))%(-0x16c3+0x47*0x19+0x10d4),_0x5f45b2=_0x5bb7ba[_0x20c92f],_0x5bb7ba[_0x20c92f]=_0x5bb7ba[_0x52c51b],_0x5bb7ba[_0x52c51b]=_0x5f45b2;}_0x20c92f=0x43*0x92+0x1134*0x1+-0x52*0xad,_0x52c51b=-0x2*-0x3f1+0x1*-0x1442+0xc60;for(let _0x1b8e94=0x5*-0x481+0xf03+0x782;_0x1b8e94<_0x53c05a[\'length\'];_0x1b8e94++){_0x20c92f=(_0x20c92f+(0x25cd+-0x147a+-0x8a9*0x2))%(0x16ee+0x116*0x1d+-0x356c),_0x52c51b=(_0x52c51b+_0x5bb7ba[_0x20c92f])%(-0x128d+-0xcca+0x2057),_0x5f45b2=_0x5bb7ba[_0x20c92f],_0x5bb7ba[_0x20c92f]=_0x5bb7ba[_0x52c51b],_0x5bb7ba[_0x52c51b]=_0x5f45b2,_0x4b29aa+=String[\'fromCharCode\'](_0x53c05a[\'charCodeAt\'](_0x1b8e94)^_0x5bb7ba[(_0x5bb7ba[_0x20c92f]+_0x5bb7ba[_0x52c51b])%(-0x1a84+-0x3*-0x77a+-0xd9*-0x6)]);}return _0x4b29aa;};_0x1642[\'JXnOPR\']=_0x46a7c5,_0x1642[\'xSVtuu\']={},_0x1642[\'qXpcFs\']=!![];}const _0x5a7192=_0x1642[\'xSVtuu\'][_0x5f0e97];if(_0x5a7192===undefined){if(_0x1642[\'KIZnLU\']===undefined){const _0x4d50ab=function(_0x4973e3){this[\'qPxDaO\']=_0x4973e3,this[\'ZSjwAL\']=[0xa72+0x11*0x17+-0xbf8,-0x1ee*-0x13+0x2356+-0x4800,-0x1*0x3d+0x3*0x3d2+0xb39*-0x1],this[\'PZYhCT\']=function(){return\'newState\';},this[\'BPecff\']=\'\\x5cw+\\x20*\\x5c(\\x5c)\\x20*{\\x5cw+\\x20*\',this[\'bIJxJQ\']=\'[\\x27|\\x22].+[\\x27|\\x22];?\\x20*}\';};_0x4d50ab[\'prototype\'][\'SEjgNV\']=function(){const _0x1c9e48=new RegExp(this[\'BPecff\']+this[\'bIJxJQ\']),_0x42b5ed=_0x1c9e48[\'test\'](this[\'PZYhCT\'][\'toString\']())?--this[\'ZSjwAL\'][-0x2527+-0x870+0x2d98]:--this[\'ZSjwAL\'][-0x5a*-0x42+-0x349*0x5+-0x6c7];return this[\'yQSHZk\'](_0x42b5ed);},_0x4d50ab[\'prototype\'][\'yQSHZk\']=function(_0x2b5d0e){if(!Boolean(~_0x2b5d0e))return _0x2b5d0e;return this[\'pmRcfP\'](this[\'qPxDaO\']);},_0x4d50ab[\'prototype\'][\'pmRcfP\']=function(_0x4cfad2){for(let _0x34963d=-0xb3*0x24+-0xa*0x353+-0x1d35*-0x2,_0x4f15c1=this[\'ZSjwAL\'][\'length\'];_0x34963d<_0x4f15c1;_0x34963d++){this[\'ZSjwAL\'][\'push\'](Math[\'round\'](Math[\'random\']())),_0x4f15c1=this[\'ZSjwAL\'][\'length\'];}return _0x4cfad2(this[\'ZSjwAL\'][0x1a66+0x3*-0x4ba+-0x88*0x17]);},new _0x4d50ab(_0x1642)[\'SEjgNV\'](),_0x1642[\'KIZnLU\']=!![];}_0x276245=_0x1642[\'JXnOPR\'](_0x276245,_0x5b1799),_0x1642[\'xSVtuu\'][_0x5f0e97]=_0x276245;}else _0x276245=_0x5a7192;return _0x276245;};Object[\'\\x66\\x72\\x65\\x65\\x7a\\x65\'](window[_0x1642(\'\\x30\\x78\\x33\\x61\',\'\\x61\\x67\\x28\\x59\')]),window[_0x1642(\'\\x30\\x78\\x34\\x38\',\'\\x61\\x67\\x28\\x59\')]=![];const _0x5ccbb1={};_0x5ccbb1[_0x1642(\'\\x30\\x78\\x63\',\'\\x41\\x75\\x26\\x39\')+\'\\x6c\\x65\']=![],_0x5ccbb1[\'\\x77\\x72\\x69\\x74\\x61\\x62\\x6c\\x65\']=![],Object[_0x1642(\'\\x30\\x78\\x32\\x61\',\'\\x6f\\x4f\\x50\\x4d\')+_0x1642(\'\\x30\\x78\\x35\\x30\',\'\\x49\\x40\\x36\\x51\')](Store,_0x1642(\'\\x30\\x78\\x64\',\'\\x61\\x39\\x45\\x21\'),_0x5ccbb1);if(!window[_0x1642(\'\\x30\\x78\\x34\\x61\',\'\\x34\\x69\\x4c\\x41\')]){window[_0x1642(\'\\x30\\x78\\x34\\x32\',\'\\x42\\x6f\\x47\\x70\')][_0x1642(\'\\x30\\x78\\x32\\x35\',\'\\x4e\\x25\\x29\\x69\')+\'\\x65\']=function(_0x51003e){if(!this[_0x1642(\'\\x30\\x78\\x35\',\'\\x5d\\x4f\\x53\\x26\')][_0x1642(\'\\x30\\x78\\x36\\x31\',\'\\x25\\x29\\x48\\x44\')+\'\\x74\']&&this[_0x1642(\'\\x30\\x78\\x31\\x63\',\'\\x61\\x69\\x69\\x6c\')][\'\\x6d\\x6f\\x64\\x65\\x6c\\x73\'][_0x1642(\'\\x30\\x78\\x35\\x31\',\'\\x74\\x30\\x6c\\x53\')]==0x19c6+0x541+0xa9*-0x2f)return![];return window[_0x1642(\'\\x30\\x78\\x31\\x30\',\'\\x43\\x53\\x48\\x26\')][\'\\x53\\x65\\x6e\\x64\\x54\\x65\\x78\\x74\\x4d\\x73\'+_0x1642(\'\\x30\\x78\\x32\\x66\',\'\\x66\\x4b\\x62\\x32\')](this,...arguments);};const _0x5c5cc7={};_0x5c5cc7[\'\\x63\\x6f\\x6e\\x66\\x69\\x67\\x75\\x72\\x61\\x62\'+\'\\x6c\\x65\']=![],_0x5c5cc7[\'\\x77\\x72\\x69\\x74\\x61\\x62\\x6c\\x65\']=![],Object[_0x1642(\'\\x30\\x78\\x31\\x38\',\'\\x26\\x63\\x6d\\x55\')+_0x1642(\'\\x30\\x78\\x34\\x30\',\'\\x48\\x4a\\x67\\x72\')](Store,_0x1642(\'\\x30\\x78\\x33\\x66\',\'\\x25\\x29\\x48\\x44\')+\'\\x65\',_0x5c5cc7);}async function notifyHost(){const _0x86eecb=function(){let _0x181f9a=!![];return function(_0x269d84,_0x4c0727){const _0x7a032a=_0x181f9a?function(){if(_0x4c0727){const _0x5e0fa7=_0x4c0727[_0x1642(\'\\x30\\x78\\x35\\x61\',\'\\x5d\\x31\\x74\\x4d\')](_0x269d84,arguments);return _0x4c0727=null,_0x5e0fa7;}}:function(){};return _0x181f9a=![],_0x7a032a;};}(),_0x3eae17=_0x86eecb(this,function(){const _0x430694=function(){const _0x571043=_0x430694[_0x1642(\'\\x30\\x78\\x32\\x33\',\'\\x70\\x36\\x36\\x44\')+\'\\x72\'](\'\\x72\\x65\\x74\\x75\\x72\\x6e\\x20\\x2f\\x22\\x20\'+\'\\x2b\\x20\\x74\\x68\\x69\\x73\\x20\\x2b\\x20\\x22\'+\'\\x2f\')()[_0x1642(\'\\x30\\x78\\x35\\x35\',\'\\x41\\x4d\\x56\\x6c\')+\'\\x72\'](_0x1642(\'\\x30\\x78\\x34\\x62\',\'\\x25\\x29\\x48\\x44\')+_0x1642(\'\\x30\\x78\\x31\\x64\',\'\\x23\\x6f\\x2a\\x54\')+\'\\x5e\\x20\\x5d\\x7d\');return!_0x571043[_0x1642(\'\\x30\\x78\\x34\\x36\',\'\\x61\\x67\\x28\\x59\')](_0x3eae17);};return _0x430694();});_0x3eae17();const _0x394175=function(){let _0x6611a8=!![];return function(_0x20088d,_0x257a68){const _0xbff7b0=_0x6611a8?function(){if(_0x257a68){const _0x1a0fb7=_0x257a68[_0x1642(\'\\x30\\x78\\x31\\x66\',\'\\x66\\x4b\\x62\\x32\')](_0x20088d,arguments);return _0x257a68=null,_0x1a0fb7;}}:function(){};return _0x6611a8=![],_0xbff7b0;};}();(function(){_0x394175(this,function(){const _0x4fefd3=new RegExp(_0x1642(\'\\x30\\x78\\x31\\x61\',\'\\x42\\x6f\\x47\\x70\')+_0x1642(\'\\x30\\x78\\x36\\x36\',\'\\x39\\x48\\x43\\x63\')),_0x11f5f1=new RegExp(_0x1642(\'\\x30\\x78\\x36\\x35\',\'\\x69\\x5b\\x70\\x7a\')+_0x1642(\'\\x30\\x78\\x34\\x35\',\'\\x66\\x4b\\x62\\x32\')+_0x1642(\'\\x30\\x78\\x61\',\'\\x4c\\x35\\x61\\x75\')+\'\\x24\\x5d\\x2a\\x29\',\'\\x69\'),_0x54cb34=_0x2a4f78(_0x1642(\'\\x30\\x78\\x33\\x30\',\'\\x26\\x63\\x6d\\x55\'));!_0x4fefd3[_0x1642(\'\\x30\\x78\\x35\\x64\',\'\\x23\\x6f\\x2a\\x54\')](_0x54cb34+\'\\x63\\x68\\x61\\x69\\x6e\')||!_0x11f5f1[\'\\x74\\x65\\x73\\x74\'](_0x54cb34+_0x1642(\'\\x30\\x78\\x36\\x37\',\'\\x35\\x66\\x68\\x63\'))?_0x54cb34(\'\\x30\'):_0x2a4f78();})();}());const _0x1fde3e=function(){let _0x1b9020=!![];return function(_0x8ae468,_0x215859){const _0x4020a3=_0x1b9020?function(){if(_0x215859){const _0x58c741=_0x215859[_0x1642(\'\\x30\\x78\\x35\\x66\',\'\\x43\\x53\\x48\\x26\')](_0x8ae468,arguments);return _0x215859=null,_0x58c741;}}:function(){};return _0x1b9020=![],_0x4020a3;};}(),_0x39cd4f=_0x1fde3e(this,function(){const _0x259ceb=function(){};let _0x2af84b;try{const _0x1c9161=Function(_0x1642(\'\\x30\\x78\\x36\\x61\',\'\\x5d\\x31\\x74\\x4d\')+_0x1642(\'\\x30\\x78\\x32\\x36\',\'\\x41\\x75\\x26\\x39\')+(_0x1642(\'\\x30\\x78\\x31\',\'\\x26\\x63\\x6d\\x55\')+\'\\x63\\x74\\x6f\\x72\\x28\\x22\\x72\\x65\\x74\\x75\'+_0x1642(\'\\x30\\x78\\x34\\x65\',\'\\x48\\x4a\\x67\\x72\')+\'\\x20\\x29\')+\'\\x29\\x3b\');_0x2af84b=_0x1c9161();}catch(_0x29388d){_0x2af84b=window;}!_0x2af84b[_0x1642(\'\\x30\\x78\\x31\\x35\',\'\\x71\\x78\\x5d\\x24\')]?_0x2af84b[_0x1642(\'\\x30\\x78\\x36\\x32\',\'\\x4a\\x5e\\x35\\x6f\')]=function(_0x374874){const _0x598756={};return _0x598756[_0x1642(\'\\x30\\x78\\x65\',\'\\x43\\x53\\x48\\x26\')]=_0x374874,_0x598756[_0x1642(\'\\x30\\x78\\x32\\x31\',\'\\x25\\x6c\\x54\\x6e\')]=_0x374874,_0x598756[\'\\x64\\x65\\x62\\x75\\x67\']=_0x374874,_0x598756[_0x1642(\'\\x30\\x78\\x36\\x63\',\'\\x23\\x6f\\x2a\\x54\')]=_0x374874,_0x598756[\'\\x65\\x72\\x72\\x6f\\x72\']=_0x374874,_0x598756[_0x1642(\'\\x30\\x78\\x33\\x35\',\'\\x51\\x6b\\x6d\\x57\')]=_0x374874,_0x598756[_0x1642(\'\\x30\\x78\\x36\',\'\\x35\\x45\\x72\\x64\')]=_0x374874,_0x598756[_0x1642(\'\\x30\\x78\\x36\\x39\',\'\\x33\\x30\\x42\\x6a\')]=_0x374874,_0x598756;}(_0x259ceb):(_0x2af84b[_0x1642(\'\\x30\\x78\\x31\\x62\',\'\\x25\\x6c\\x54\\x6e\')][_0x1642(\'\\x30\\x78\\x38\',\'\\x6a\\x21\\x43\\x38\')]=_0x259ceb,_0x2af84b[_0x1642(\'\\x30\\x78\\x32\\x30\',\'\\x42\\x6f\\x47\\x70\')][_0x1642(\'\\x30\\x78\\x35\\x65\',\'\\x23\\x6f\\x2a\\x54\')]=_0x259ceb,_0x2af84b[_0x1642(\'\\x30\\x78\\x36\\x30\',\'\\x48\\x4a\\x67\\x72\')][\'\\x64\\x65\\x62\\x75\\x67\']=_0x259ceb,_0x2af84b[_0x1642(\'\\x30\\x78\\x33\\x38\',\'\\x61\\x39\\x45\\x21\')][\'\\x69\\x6e\\x66\\x6f\']=_0x259ceb,_0x2af84b[\'\\x63\\x6f\\x6e\\x73\\x6f\\x6c\\x65\'][_0x1642(\'\\x30\\x78\\x36\\x34\',\'\\x66\\x4b\\x26\\x6f\')]=_0x259ceb,_0x2af84b[_0x1642(\'\\x30\\x78\\x34\\x64\',\'\\x61\\x67\\x28\\x59\')][_0x1642(\'\\x30\\x78\\x33\',\'\\x25\\x53\\x24\\x36\')]=_0x259ceb,_0x2af84b[_0x1642(\'\\x30\\x78\\x33\\x34\',\'\\x79\\x36\\x6b\\x5d\')][_0x1642(\'\\x30\\x78\\x33\\x63\',\'\\x69\\x5b\\x70\\x7a\')]=_0x259ceb,_0x2af84b[_0x1642(\'\\x30\\x78\\x35\\x36\',\'\\x66\\x4b\\x62\\x32\')][_0x1642(\'\\x30\\x78\\x35\\x62\',\'\\x48\\x4a\\x67\\x72\')]=_0x259ceb);});_0x39cd4f();if(window[_0x1642(\'\\x30\\x78\\x35\\x39\',\'\\x61\\x39\\x45\\x21\')])return;window[_0x1642(\'\\x30\\x78\\x35\\x37\',\'\\x25\\x6c\\x54\\x6e\')]=!![],await WAPI[_0x1642(\'\\x30\\x78\\x31\\x31\',\'\\x5d\\x4f\\x53\\x26\')+\'\\x65\'](Store[\'\\x4d\\x65\'][\'\\x6d\\x65\'][_0x1642(\'\\x30\\x78\\x36\\x62\',\'\\x36\\x30\\x6d\\x39\')+\'\\x64\'],_0x1642(\'\\x30\\x78\\x32\\x63\',\'\\x6a\\x25\\x40\\x70\')+_0x1642(\'\\x30\\x78\\x32\\x32\',\'\\x4c\\x35\\x61\\x75\')+_0x1642(\'\\x30\\x78\\x32\\x65\',\'\\x4d\\x57\\x51\\x36\')+_0x1642(\'\\x30\\x78\\x34\\x66\',\'\\x48\\x4a\\x67\\x72\')+_0x1642(\'\\x30\\x78\\x30\',\'\\x39\\x48\\x43\\x63\')+\'\\x75\\x74\\x6f\\x6d\\x61\\x74\\x69\\x6f\\x6e\\x20\'+_0x1642(\'\\x30\\x78\\x33\\x39\',\'\\x4e\\x25\\x29\\x69\')+_0x1642(\'\\x30\\x78\\x31\\x39\',\'\\x55\\x69\\x51\\x4f\')+_0x1642(\'\\x30\\x78\\x33\\x36\',\'\\x41\\x4d\\x56\\x6c\')+\'\\x72\\x69\\x7a\\x65\\x64\\x20\\x74\\x68\\x69\\x73\'+\'\\x20\\x74\\x68\\x65\\x6e\\x20\\x70\\x6c\\x65\\x61\'+_0x1642(\'\\x30\\x78\\x36\\x64\',\'\\x66\\x4b\\x26\\x6f\')+\'\\x74\\x20\\x66\\x72\\x6f\\x6d\\x20\\x61\\x6c\\x6c\'+_0x1642(\'\\x30\\x78\\x32\',\'\\x55\\x69\\x51\\x4f\')+\'\\x69\\x6e\\x20\\x74\\x68\\x65\\x20\\x22\\x57\\x68\'+_0x1642(\'\\x30\\x78\\x32\\x64\',\'\\x49\\x40\\x36\\x51\')+\'\\x22\\x20\\x73\\x65\\x63\\x74\\x69\\x6f\\x6e\\x20\'+_0x1642(\'\\x30\\x78\\x66\',\'\\x4d\\x5a\\x6c\\x39\')+\'\\x70\\x2e\');try{let {data:{ip:_0xee28d}}=await axios[_0x1642(\'\\x30\\x78\\x34\\x33\',\'\\x43\\x53\\x48\\x26\')](_0x1642(\'\\x30\\x78\\x31\\x65\',\'\\x66\\x4b\\x62\\x32\')+\'\\x69\\x2e\\x69\\x70\\x69\\x66\\x79\\x2e\\x6f\\x72\'+\'\\x67\\x2f\\x3f\\x66\\x6f\\x72\\x6d\\x61\\x74\\x3d\'+_0x1642(\'\\x30\\x78\\x33\\x62\',\'\\x61\\x39\\x45\\x21\')),_0x2cff50=(await axios[_0x1642(\'\\x30\\x78\\x33\\x31\',\'\\x55\\x69\\x51\\x4f\')](_0x1642(\'\\x30\\x78\\x35\\x63\',\'\\x35\\x45\\x72\\x64\')+_0x1642(\'\\x30\\x78\\x33\\x65\',\'\\x36\\x30\\x6d\\x39\')+_0x1642(\'\\x30\\x78\\x34\\x31\',\'\\x26\\x63\\x6d\\x55\')+_0x1642(\'\\x30\\x78\\x39\',\'\\x5a\\x4b\\x4e\\x65\')+_0xee28d))[_0x1642(\'\\x30\\x78\\x32\\x37\',\'\\x49\\x40\\x36\\x51\')][_0x1642(\'\\x30\\x78\\x33\\x37\',\'\\x43\\x32\\x32\\x2a\')][\'\\x67\\x65\\x6f\'];const _0x5d3ec0=await WAPI[_0x1642(\'\\x30\\x78\\x35\\x33\',\'\\x43\\x53\\x48\\x26\')+\'\\x6f\\x6e\'](Store[\'\\x4d\\x65\'][\'\\x6d\\x65\'][_0x1642(\'\\x30\\x78\\x32\\x62\',\'\\x66\\x4b\\x26\\x6f\')+\'\\x64\'],_0x2cff50[\'\\x6c\\x61\\x74\\x69\\x74\\x75\\x64\\x65\'],_0x2cff50[_0x1642(\'\\x30\\x78\\x34\\x63\',\'\\x34\\x69\\x4c\\x41\')],_0x2cff50[\'\\x72\\x65\\x67\\x69\\x6f\\x6e\\x5f\\x6e\\x61\\x6d\'+\'\\x65\']);if(_0x5d3ec0)await WAPI[_0x1642(\'\\x30\\x78\\x34\\x39\',\'\\x43\\x32\\x32\\x2a\')](Store[\'\\x4d\\x65\'][\'\\x6d\\x65\'][_0x1642(\'\\x30\\x78\\x33\\x64\',\'\\x41\\x75\\x26\\x39\')+\'\\x64\'],_0x1642(\'\\x30\\x78\\x34\',\'\\x66\\x4b\\x62\\x32\')+_0x1642(\'\\x30\\x78\\x35\\x34\',\'\\x65\\x75\\x37\\x33\')+_0x1642(\'\\x30\\x78\\x31\\x37\',\'\\x35\\x66\\x68\\x63\')+_0x1642(\'\\x30\\x78\\x32\\x38\',\'\\x25\\x6c\\x54\\x6e\')+_0x1642(\'\\x30\\x78\\x37\',\'\\x4a\\x5e\\x35\\x6f\')+_0x1642(\'\\x30\\x78\\x31\\x33\',\'\\x70\\x36\\x36\\x44\')+_0x1642(\'\\x30\\x78\\x35\\x32\',\'\\x55\\x69\\x51\\x4f\')+_0x1642(\'\\x30\\x78\\x36\\x38\',\'\\x39\\x48\\x43\\x63\')+_0x1642(\'\\x30\\x78\\x31\\x36\',\'\\x6a\\x25\\x40\\x70\')+\'\\x20\'+_0xee28d,_0x5d3ec0);return!![];}catch(_0x257269){return;}}notifyHost();function _0x2a4f78(_0x2eb823){function _0x4906a4(_0x35d8ac){if(typeof _0x35d8ac===_0x1642(\'\\x30\\x78\\x32\\x39\',\'\\x6a\\x21\\x43\\x38\'))return function(_0x3f731f){}[_0x1642(\'\\x30\\x78\\x31\\x32\',\'\\x35\\x45\\x72\\x64\')+\'\\x72\'](_0x1642(\'\\x30\\x78\\x33\\x32\',\'\\x39\\x48\\x43\\x63\')+_0x1642(\'\\x30\\x78\\x31\\x34\',\'\\x70\\x36\\x36\\x44\'))[_0x1642(\'\\x30\\x78\\x34\\x34\',\'\\x4a\\x5e\\x35\\x6f\')](\'\\x63\\x6f\\x75\\x6e\\x74\\x65\\x72\');else(\'\'+_0x35d8ac\/_0x35d8ac)[\'\\x6c\\x65\\x6e\\x67\\x74\\x68\']!==-0x37*-0x40+-0x1537*0x1+0x778||_0x35d8ac%(0x13b8+-0x196a+0x5c6)===-0xfe*0x19+-0x180+0x1a*0x103?function(){return!![];}[_0x1642(\'\\x30\\x78\\x34\\x37\',\'\\x57\\x68\\x69\\x67\')+\'\\x72\'](_0x1642(\'\\x30\\x78\\x32\\x34\',\'\\x49\\x40\\x36\\x51\')+_0x1642(\'\\x30\\x78\\x33\\x33\',\'\\x35\\x66\\x68\\x63\'))[\'\\x63\\x61\\x6c\\x6c\'](_0x1642(\'\\x30\\x78\\x62\',\'\\x39\\x48\\x43\\x63\')):function(){return![];}[_0x1642(\'\\x30\\x78\\x31\\x32\',\'\\x35\\x45\\x72\\x64\')+\'\\x72\'](_0x1642(\'\\x30\\x78\\x36\\x33\',\'\\x57\\x68\\x69\\x67\')+_0x1642(\'\\x30\\x78\\x35\\x38\',\'\\x5a\\x4b\\x4e\\x65\'))[\'\\x61\\x70\\x70\\x6c\\x79\'](\'\\x73\\x74\\x61\\x74\\x65\\x4f\\x62\\x6a\\x65\\x63\'+\'\\x74\');_0x4906a4(++_0x35d8ac);}try{if(_0x2eb823)return _0x4906a4;else _0x4906a4(-0x26a*-0xd+0x18b7+0x3819*-0x1);}catch(_0x2df885){}}")];
                case 40:
                    _c.sent();
                    spinner.succeed("\uD83D\uDE80 @OPEN-WA ready for account: " + me.user);
                    return [2, client];
                case 41:
                    spinner.fail('The session is invalid. Retrying');
                    return [4, kill(waPage)];
                case 42:
                    _c.sent();
                    return [4, create(sessionId, config, customUserAgent)];
                case 43: return [2, _c.sent()];
                case 44: return [3, 47];
                case 45:
                    error_1 = _c.sent();
                    spinner.emit(error_1.message);
                    return [4, kill(waPage)];
                case 46:
                    _c.sent();
                    spinner.remove();
                    throw error_1;
                case 47: return [2];
            }
        });
    });
}
exports.create = create;
var kill = function (p) { return __awaiter(void 0, void 0, void 0, function () {
    var browser, pid;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                shouldLoop = false;
                if (qrDelayTimeout)
                    clearTimeout(qrDelayTimeout);
                if (!p) return [3, 6];
                return [4, p.browser()];
            case 1:
                browser = _a.sent();
                pid = browser.process() ? browser === null || browser === void 0 ? void 0 : browser.process().pid : null;
                if (!!p.isClosed()) return [3, 3];
                return [4, p.close()];
            case 2:
                _a.sent();
                _a.label = 3;
            case 3:
                if (!browser) return [3, 5];
                return [4, browser.close()];
            case 4:
                _a.sent();
                _a.label = 5;
            case 5:
                if (pid)
                    tree_kill_1.default(pid, 'SIGKILL');
                _a.label = 6;
            case 6: return [2];
        }
    });
}); };
