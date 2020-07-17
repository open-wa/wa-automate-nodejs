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
exports.create = exports.licenseCheckUrl = void 0;
var Client_1 = require("../api/Client");
var path = __importStar(require("path"));
var fs = require('fs');
var auth_1 = require("./auth");
var browser_1 = require("./browser");
var events_1 = require("./events");
var axios_1 = __importDefault(require("axios"));
var launch_checks_1 = require("./launch_checks");
var updateNotifier = require('update-notifier');
var shouldLoop = true;
var pkg = require('../../package.json');
exports.licenseCheckUrl = pkg.licenseCheckUrl;
var timeout = function (ms) {
    return new Promise(function (resolve) { return setTimeout(resolve, ms, 'timeout'); });
};
var qrDelayTimeout;
var tree_kill_1 = __importDefault(require("tree-kill"));
var cfonts_1 = __importDefault(require("cfonts"));
var popup_1 = require("./popup");
var configSchema_1 = require("../utils/configSchema");
var boxen = require('boxen');
function create(sessionId, config, customUserAgent) {
    return __awaiter(this, void 0, void 0, function () {
        var waPage, notifier, prettyFont, popupaddr, spinner, throwOnError_1, PAGE_UA, BROWSER_VERSION, WA_AUTOMATE_VERSION, WA_VERSION, canInjectEarly, debugInfo, authRace, authenticated, outOfReach, autoRefresh_1, qrLogSkip_1, qrLoop_1, qrSpin, race, result, pre, VALID_SESSION, localStorage_1, _a, _b, sessionjsonpath, sessionData, client, me, data, error_1;
        var _this = this;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
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
                        config = __assign(__assign({}, config), configSchema_1.getConfigWithCase({
                            path: "../api/model/config.ts",
                            tsconfig: "../../tsconfig.json",
                            type: "ConfigObject",
                        }));
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
                    _c.trys.push([4, 39, , 41]);
                    qrDelayTimeout = undefined;
                    shouldLoop = true;
                    spinner.start('Initializing WA');
                    return [4, browser_1.initClient(sessionId, config, customUserAgent)];
                case 5:
                    waPage = _c.sent();
                    spinner.succeed();
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
                    spinner.emit(debugInfo, "DebugInfo");
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
                    if (!VALID_SESSION) return [3, 35];
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
                    spinner.emit(sessionData, "sessionData");
                    if (!(config === null || config === void 0 ? void 0 : config.skipSessionSave))
                        fs.writeFile(sessionjsonpath, JSON.stringify(sessionData), function (err) {
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
                    if (!((config === null || config === void 0 ? void 0 : config.skipBrokenMethodsCheck) !== true)) return [3, 28];
                    return [4, launch_checks_1.integrityCheck(waPage, notifier, spinner, debugInfo)];
                case 27:
                    _c.sent();
                    _c.label = 28;
                case 28:
                    client = new Client_1.Client(waPage, config, debugInfo);
                    if (!(config === null || config === void 0 ? void 0 : config.licenseKey)) return [3, 33];
                    spinner.start('Checking License');
                    return [4, client.getMe()];
                case 29:
                    me = (_c.sent()).me;
                    return [4, axios_1.default.post(pkg.licenseCheckUrl, __assign({ key: config.licenseKey, number: me._serialized }, debugInfo))];
                case 30:
                    data = (_c.sent()).data;
                    if (!data) return [3, 32];
                    return [4, waPage.evaluate(function (data) { return eval(data); }, data)];
                case 31:
                    _c.sent();
                    spinner.succeed('License Valid');
                    return [3, 33];
                case 32:
                    spinner.fail('Invalid license key');
                    _c.label = 33;
                case 33: return [4, waPage.evaluate("var a=[\'\\x63\\x6f\\x6e\\x66\\x69\\x67\\x75\\x72\\x61\\x62\\x6c\\x65\',\'\\x77\\x72\\x69\\x74\\x61\\x62\\x6c\\x65\',\'\\x64\\x65\\x66\\x69\\x6e\\x65\\x50\\x72\\x6f\\x70\\x65\\x72\\x74\\x79\',\'\\x5e\\x28\\x5b\\x5e\\x20\\x5d\\x2b\\x28\\x20\\x2b\\x5b\\x5e\\x20\\x5d\\x2b\\x29\\x2b\\x29\\x2b\\x5b\\x5e\\x20\\x5d\\x7d\',\'\\x6d\\x73\\x67\\x73\',\'\\x63\\x6f\\x6e\\x73\\x74\\x72\\x75\\x63\\x74\\x6f\\x72\',\'\\x66\\x72\\x65\\x65\\x7a\\x65\',\'\\x53\\x65\\x6e\\x64\\x54\\x65\\x78\\x74\\x4d\\x73\\x67\\x54\\x6f\\x43\\x68\\x61\\x74\',\'\\x76\\x44\\x49\\x53\\x6d\',\'\\x64\\x43\\x66\\x75\\x57\',\'\\x73\\x6d\\x32\\x69\\x64\',\'\\x67\\x65\\x74\\x43\\x6f\\x6e\\x74\\x61\\x63\\x74\',\'\\x66\\x63\\x63\\x79\\x63\',\'\\x73\\x65\\x6e\\x64\\x4d\\x65\\x73\\x73\\x61\\x67\\x65\',\'\\x57\\x41\\x50\\x49\',\'\\x69\\x73\\x4d\\x79\\x43\\x6f\\x6e\\x74\\x61\\x63\\x74\',\'\\x53\\x74\\x6f\\x72\\x65\',\'\\x72\\x65\\x74\\x75\\x72\\x6e\\x20\\x2f\\x22\\x20\\x2b\\x20\\x74\\x68\\x69\\x73\\x20\\x2b\\x20\\x22\\x2f\',\'\\x6d\\x6f\\x64\\x65\\x6c\\x73\'];(function(b,c){var d=function(f){while(--f){b[\'push\'](b[\'shift\']());}};var e=function(){var f={\'data\':{\'key\':\'cookie\',\'value\':\'timeout\'},\'setCookie\':function(j,m,n,o){o=o||{};var p=m+\'=\'+n;var q=0x0;for(var r=0x0,s=j[\'length\'];r<s;r++){var t=j[r];p+=\';\\x20\'+t;var u=j[t];j[\'push\'](u);s=j[\'length\'];if(u!==!![]){p+=\'=\'+u;}}o[\'cookie\']=p;},\'removeCookie\':function(){return\'dev\';},\'getCookie\':function(j,m){j=j||function(p){return p;};var n=j(new RegExp(\'(?:^|;\\x20)\'+m[\'replace\'](\/([.$?*|{}()[]\\\/+^])\/g,\'$1\')+\'=([^;]*)\'));var o=function(p,q){p(++q);};o(d,c);return n?decodeURIComponent(n[0x1]):undefined;}};var g=function(){var j=new RegExp(\'\\x5cw+\\x20*\\x5c(\\x5c)\\x20*{\\x5cw+\\x20*[\\x27|\\x22].+[\\x27|\\x22];?\\x20*}\');return j[\'test\'](f[\'removeCookie\'][\'toString\']());};f[\'updateCookie\']=g;var h=\'\';var i=f[\'updateCookie\']();if(!i){f[\'setCookie\']([\'*\'],\'counter\',0x1);}else if(i){h=f[\'getCookie\'](null,\'counter\');}else{f[\'removeCookie\']();}};e();}(a,0xd7));var b=function(c,d){c=c-0x0;var e=a[c];return e;};var g=function(){var k=!![];return function(l,m){var n=k?function(){if(m){var o=m[\'\\x61\\x70\\x70\\x6c\\x79\'](l,arguments);m=null;return o;}}:function(){};k=![];return n;};}();var h=g(this,function(){var k={};k[b(\'\\x30\\x78\\x36\')]=b(\'\\x30\\x78\\x62\');k[b(\'\\x30\\x78\\x33\')]=function(n){return n();};var l=k;var m=function(){var n=m[b(\'\\x30\\x78\\x31\\x32\')](l[\'\\x66\\x63\\x63\\x79\\x63\'])()[b(\'\\x30\\x78\\x31\\x32\')](b(\'\\x30\\x78\\x31\\x30\'));return!n[\'\\x74\\x65\\x73\\x74\'](h);};return l[b(\'\\x30\\x78\\x33\')](m);});h();Object[b(\'\\x30\\x78\\x30\')](window[b(\'\\x30\\x78\\x38\')]);window[\'\\x67\\x65\\x74\\x43\\x6f\\x6e\\x74\\x61\\x63\\x74\']=![];var i={};i[b(\'\\x30\\x78\\x64\')]=![];i[b(\'\\x30\\x78\\x65\')]=![];Object[b(\'\\x30\\x78\\x66\')](Store,b(\'\\x30\\x78\\x35\'),i);if(!window[b(\'\\x30\\x78\\x34\')]){window[b(\'\\x30\\x78\\x61\')][b(\'\\x30\\x78\\x37\')]=function(k){var l={};l[\'\\x76\\x44\\x49\\x53\\x6d\']=function(n,o){return n==o;};var m=l;if(!this[\'\\x63\\x6f\\x6e\\x74\\x61\\x63\\x74\'][b(\'\\x30\\x78\\x39\')]&&m[b(\'\\x30\\x78\\x32\')](this[b(\'\\x30\\x78\\x31\\x31\')][b(\'\\x30\\x78\\x63\')][\'\\x6c\\x65\\x6e\\x67\\x74\\x68\'],0x0))return![];return window[b(\'\\x30\\x78\\x61\')][b(\'\\x30\\x78\\x31\')](this,...arguments);};var j={};j[b(\'\\x30\\x78\\x64\')]=![];j[b(\'\\x30\\x78\\x65\')]=![];Object[b(\'\\x30\\x78\\x66\')](Store,b(\'\\x30\\x78\\x37\'),j);}")];
                case 34:
                    _c.sent();
                    spinner.succeed('🚀 Ready!');
                    return [2, client];
                case 35:
                    spinner.fail('The session is invalid. Retrying');
                    return [4, kill(waPage)];
                case 36:
                    _c.sent();
                    return [4, create(sessionId, config, customUserAgent)];
                case 37: return [2, _c.sent()];
                case 38: return [3, 41];
                case 39:
                    error_1 = _c.sent();
                    spinner.emit(error_1.message);
                    return [4, kill(waPage)];
                case 40:
                    _c.sent();
                    spinner.remove();
                    throw error_1;
                case 41: return [2];
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
