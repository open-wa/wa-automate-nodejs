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
exports.useragent = exports.Client = exports.namespace = void 0;
const mime_types_1 = __importDefault(require("mime-types"));
const axios_1 = __importDefault(require("axios"));
const puppeteer_config_1 = require("../config/puppeteer.config");
const model_1 = require("./model");
const errors_1 = require("./model/errors");
const p_queue_1 = __importDefault(require("p-queue"));
const events_1 = require("../controllers/events");
const uuid_1 = require("uuid");
const parse_function_1 = __importDefault(require("parse-function"));
const fs = __importStar(require("fs"));
const datauri_1 = __importDefault(require("datauri"));
const is_url_superb_1 = __importDefault(require("is-url-superb"));
const fs_extra_1 = require("fs-extra");
const browser_1 = require("../controllers/browser");
const auth_1 = require("../controllers/auth");
const wa_decrypt_1 = require("@open-wa/wa-decrypt");
const path = __importStar(require("path"));
const media_1 = require("./model/media");
const patch_manager_1 = require("../controllers/patch_manager");
const events_2 = require("./model/events");
const MessageCollector_1 = require("../structures/MessageCollector");
const init_patch_1 = require("../controllers/init_patch");
const preProcessors_1 = require("../structures/preProcessors");
const tools_1 = require("../utils/tools");
const logging_1 = require("../logging/logging");
const pid_utils_1 = require("../utils/pid_utils");
const pkg = (0, fs_extra_1.readJsonSync)(path.join(__dirname, '../../package.json'));
var namespace;
(function (namespace) {
    namespace["Chat"] = "Chat";
    namespace["Msg"] = "Msg";
    namespace["Contact"] = "Contact";
    namespace["GroupMetadata"] = "GroupMetadata";
})(namespace || (exports.namespace = namespace = {}));
class Client {
    constructor(page, createConfig, sessionInfo) {
        this._currentlyBeingKilled = false;
        this._refreshing = false;
        this._loaded = false;
        this._prio = Number.MAX_SAFE_INTEGER;
        this._pageListeners = [];
        this._registeredPageListeners = [];
        this._onLogoutCallbacks = [];
        this._queues = {};
        this._autoEmojiSet = false;
        this._autoEmojiQ = new p_queue_1.default({
            concurrency: 1,
            intervalCap: 1,
            carryoverConcurrencyCount: true
        });
        this._onLogoutSet = false;
        this._preprocIdempotencyCheck = {};
        this._registeredWebhookListeners = {};
        this.middleware = (useSessionIdInPath = false, PORT) => async (req, res, next) => {
            if (useSessionIdInPath && !req.path.includes(this._createConfig.sessionId) && this._createConfig.sessionId !== 'session')
                return next();
            const methodFromPath = this._createConfig.sessionId && this._createConfig.sessionId !== 'session' && req.path.includes(this._createConfig.sessionId) ? req.path.replace(`/${this._createConfig.sessionId}/`, '') : req.path.replace('/', '');
            if (req.get('owa-check-property') && req.get('owa-check-value')) {
                const checkProp = req.get('owa-check-property');
                const checkValue = req.get('owa-check-value');
                const sessionId = this._createConfig.sessionId;
                const hostAccountNumber = await this.getHostNumber();
                let checkPassed = false;
                switch (checkProp) {
                    case 'session':
                        checkPassed = sessionId === checkValue;
                        break;
                    case 'number':
                        checkPassed = hostAccountNumber.includes(checkValue);
                        break;
                }
                if (!checkPassed) {
                    if (PORT)
                        (0, tools_1.processSendData)({ port: PORT });
                    return res.status(412).send({
                        success: false,
                        error: {
                            name: 'CHECK_FAILED',
                            message: `Check FAILED - Are you sure you meant to send the request to this session?`,
                            data: {
                                incomingCheckProperty: checkProp,
                                incomingCheckValue: checkValue,
                                sessionId,
                                hostAccountNumber: `${hostAccountNumber.substr(-4)}`
                            }
                        }
                    });
                }
            }
            if (req.method === 'POST') {
                const rb = req?.body || {};
                let { args } = rb;
                const m = rb?.method || methodFromPath;
                logging_1.log.info(`MDLWR - ${m} : ${JSON.stringify(rb || {})}`);
                let methodRequiresArgs = false;
                if (args && !Array.isArray(args)) {
                    const methodArgs = (0, parse_function_1.default)().parse(this[m]).args;
                    logging_1.log.info(`methodArgs: ${methodArgs}`);
                    if (methodArgs?.length > 0)
                        methodRequiresArgs = true;
                    args = methodArgs.map(argName => args[argName]);
                }
                else if (!args)
                    args = [];
                if (this[m]) {
                    try {
                        const response = await this[m](...args);
                        let success = true;
                        if (typeof response == 'string' && (response.startsWith("Error") || response.startsWith("ERROR")))
                            success = false;
                        return res.send({
                            success,
                            response
                        });
                    }
                    catch (error) {
                        console.error("middleware -> error", error);
                        if (methodRequiresArgs && Array.isArray(args))
                            error.message = `${req?.params ? "Please set arguments in request json body, not in params." : "Args expected, none found."} ${error.message}`;
                        return res.send({
                            success: false,
                            error: {
                                name: error.name,
                                message: error.message,
                                data: error.data
                            }
                        });
                    }
                }
                return res.status(404).send(`Cannot find method: ${m}`);
            }
            if (req.method === "GET") {
                if (["snapshot", "getSnapshot"].includes(methodFromPath)) {
                    const snapshot = await this.getSnapshot();
                    const snapshotBuffer = Buffer.from(snapshot.split(',')[1], 'base64');
                    res.writeHead(200, {
                        'Content-Type': 'image/png',
                        'Content-Length': snapshotBuffer.length
                    });
                    return res.end(snapshotBuffer);
                }
            }
            return next();
        };
        this._page = page;
        this._createConfig = createConfig || {};
        this._loadedModules = [];
        this._sessionInfo = sessionInfo;
        this._sessionInfo.INSTANCE_ID = (0, uuid_1.v4)();
        this._listeners = {};
        this._setOnClose();
    }
    async loaded() {
        logging_1.log.info('Waiting for internal session to finish syncing');
        const syncT = await (0, tools_1.timePromise)(() => this._page.waitForFunction(() => WAPI.isSessionLoaded(), { timeout: 20000, polling: 50 })).catch(() => 20001);
        logging_1.log.info(`Internal session finished syncing in ${syncT}ms`);
        if (this._createConfig?.eventMode) {
            await this.registerAllSimpleListenersOnEv();
        }
        this._sessionInfo.PHONE_VERSION = (await this.getMe())?.phone?.wa_version;
        logging_1.log.info('LOADED', {
            PHONE_VERSION: this._sessionInfo.PHONE_VERSION
        });
        if ((this._createConfig?.autoEmoji === undefined || this._createConfig?.autoEmoji) && !this._autoEmojiSet) {
            const ident = typeof this._createConfig?.autoEmoji === "string" ? this._createConfig?.autoEmoji : ":";
            this.onMessage(async (message) => {
                if (message?.body && message.body.startsWith(ident) && message.body.endsWith(ident)) {
                    const emojiId = message.body.replace(new RegExp(ident, 'g'), "");
                    if (!emojiId)
                        return;
                    await this._autoEmojiQ.add(async () => this.sendEmoji(message.from, emojiId, message.id).catch(() => { }));
                }
                return message;
            });
            this._autoEmojiSet = true;
        }
        if ((this._createConfig?.deleteSessionDataOnLogout || this._createConfig?.killClientOnLogout) && !this._onLogoutSet) {
            this.onLogout(async () => {
                await this.waitAllQEmpty();
                await this._queues?.onLogout?.onEmpty();
                await this._queues?.onLogout?.onIdle();
                await (0, browser_1.invalidateSesssionData)(this._createConfig);
                if (this._createConfig?.deleteSessionDataOnLogout)
                    await (0, browser_1.deleteSessionData)(this._createConfig);
                if (this._createConfig?.killClientOnLogout) {
                    console.log("Session logged out. Killing client");
                    logging_1.log.warn("Session logged out. Killing client");
                    this.kill("LOGGED_OUT");
                }
            }, -1);
            this._onLogoutSet = true;
        }
        this._loaded = true;
    }
    async registerAllSimpleListenersOnEv() {
        await Promise.all(Object.keys(events_2.SimpleListener).map(eventKey => this.registerEv(events_2.SimpleListener[eventKey])));
    }
    getSessionId() {
        return this._createConfig.sessionId || 'session';
    }
    getPage() {
        return this._page;
    }
    _setOnClose() {
        this._page.on('close', () => {
            if (!this._refreshing) {
                console.log("Browser page has closed. Killing client");
                logging_1.log.warn("Browser page has closed. Killing client");
                this.kill("PAGE_CLOSED");
                if (this._createConfig?.killProcessOnBrowserClose)
                    process.exit();
            }
        });
    }
    async _reInjectWapi(newTab) {
        await (0, browser_1.injectApi)(newTab || this._page, null, true);
    }
    async _reRegisterListeners() {
        return Object.keys(this._listeners).forEach((listenerName) => this[listenerName](this._listeners[listenerName]));
    }
    async download(url, optionsOverride = {}) {
        return await (0, tools_1.getDUrl)(url, optionsOverride);
    }
    logger() {
        return logging_1.log;
    }
    async refresh() {
        this._refreshing = true;
        const spinner = new events_1.Spin(this._createConfig?.sessionId || 'session', 'REFRESH', this._createConfig?.disableSpins);
        const { me } = await this.getMe();
        const preloadlicense = this._createConfig?.licenseKey ? await (0, patch_manager_1.getLicense)(this._createConfig, me, this._sessionInfo, spinner) : false;
        spinner.info('Refreshing session');
        const START_TIME = Date.now();
        spinner.info("Opening session in new tab");
        const newTab = await this._page.browser().newPage();
        const qrManager = new auth_1.QRManager(this._createConfig);
        await (0, browser_1.initPage)(this.getSessionId(), this._createConfig, qrManager, this._createConfig.customUserAgent, spinner, newTab, true);
        const closePageOnConflict = async () => {
            const useHere = await this._page.evaluate(() => WAPI.getUseHereString());
            spinner.info("Waiting for conflict to close stale tab...");
            await this._page.waitForFunction(`[...document.querySelectorAll("div[role=button")].find(e=>{return e.innerHTML.toLowerCase().includes("${useHere.toLowerCase()}")})`, { timeout: 0, polling: 500 });
            await this._page.goto('about:blank');
            spinner.info("Closing stale tab");
            await this._page.close();
            spinner.info("Stale tab closed. Switching contexts...");
            this._page = newTab;
        };
        const setupNewPage = async () => {
            spinner.info("Checking if fresh session is authenticated...");
            if (await (0, auth_1.isAuthenticated)(newTab)) {
                this._registeredEvListeners = {};
                if (this._createConfig?.waitForRipeSession) {
                    await this._reInjectWapi(newTab);
                    spinner.start("Waiting for ripe session...");
                    if (await (0, auth_1.waitForRipeSession)(newTab))
                        spinner.succeed("Session ready for injection");
                    else
                        spinner.fail("You may experience issues in headless mode. Continuing...");
                }
                spinner.info("Injected new session...");
                await this._reInjectWapi(newTab);
                await (0, patch_manager_1.getAndInjectLivePatch)(newTab, spinner, null, this._createConfig, this._sessionInfo);
                if (this._createConfig?.licenseKey)
                    await (0, patch_manager_1.getAndInjectLicense)(newTab, this._createConfig, me, this._sessionInfo, spinner, preloadlicense);
                await (0, init_patch_1.injectInitPatch)(newTab);
            }
            else
                throw new Error("Session Logged Out. Cannot refresh. Please restart the process and scan the qr code.");
        };
        await Promise.all([
            closePageOnConflict(),
            setupNewPage()
        ]);
        spinner.info("New session live. Setting up...");
        spinner.info("Reregistering listeners");
        await this.loaded();
        if (!this._createConfig?.eventMode)
            await this._reRegisterListeners();
        spinner.succeed(`Session refreshed in ${(Date.now() - START_TIME) / 1000}s`);
        this._refreshing = false;
        spinner.remove();
        this._setOnClose();
        return true;
    }
    getSessionInfo() {
        return this._sessionInfo;
    }
    async resizePage(width = 1920, height = 1080) {
        await this._page.setViewport({
            width,
            height
        });
        return true;
    }
    getConfig() {
        const { devtools, browserWSEndpoint, sessionData, proxyServerCredentials, restartOnCrash, ...rest } = this._createConfig;
        return rest;
    }
    async pup(pageFunction, ...args) {
        const invocation_id = (0, uuid_1.v4)().slice(-5);
        const { safeMode, callTimeout, idCorrection, logging } = this._createConfig;
        let _t;
        if (safeMode) {
            if (!this._page || this._page.isClosed())
                throw new errors_1.CustomError(errors_1.ERROR_NAME.PAGE_CLOSED, 'page closed');
            const state = await this.forceUpdateConnectionState();
            if (state !== model_1.STATE.CONNECTED)
                throw new errors_1.CustomError(errors_1.ERROR_NAME.STATE_ERROR, `state: ${state}`);
        }
        if (idCorrection && args[0]) {
            const fixId = (id) => {
                let isGroup = false;
                let scrubbedId = id?.match(/\d|-/g)?.join('');
                scrubbedId = scrubbedId.match(/-/g) && scrubbedId.match(/-/g).length == 1 && scrubbedId.split('-')[1].length === 10 ? scrubbedId : scrubbedId.replace(/-/g, '');
                if (scrubbedId.includes('-') || scrubbedId.length === 18)
                    isGroup = true;
                const fixed = isGroup ?
                    `${scrubbedId?.replace(/@(c|g).us/g, '')}@g.us` :
                    `${scrubbedId?.replace(/@(c|g).us/g, '')}@c.us`;
                logging_1.log.info('Fixed ID', { id, fixed });
                return fixed;
            };
            if (typeof args[0] === 'string' && args[0] && !(args[0].includes("@g.us") || args[0].includes("@c.us")) && (pageFunction?.toString()?.match(/[^(]*\(([^)]*)\)/)[1] || "")?.replace(/\s/g, '')?.split(',')) {
                const p = (pageFunction?.toString().match(/[^(]*\(([^)]*)\)/)[1] || "").replace(/\s/g, '').split(',');
                if (["to", "chatId", "groupChatId", "groupId", "contactId"].includes(p[0]))
                    args[0] = fixId(args[0]);
            }
            else if (typeof args[0] === 'object')
                Object.entries(args[0]).map(([k, v]) => {
                    if (["to", "chatId", "groupChatId", "groupId", "contactId"].includes(k) && typeof v == "string" && v && !(v.includes("@g.us") || v.includes("@c.us"))) {
                        args[0][k] = fixId(v);
                    }
                });
        }
        if (logging) {
            const wapis = (pageFunction?.toString()?.match(/WAPI\.(\w*)\(/g) || [])?.map(s => s.replace(/WAPI|\.|\(/g, ''));
            _t = Date.now();
            const _args = ["string", "number", "boolean"].includes(typeof args[0]) ? args[0] : { ...args[0] };
            logging_1.log.info(`IN ${invocation_id}`, {
                _method: wapis?.length === 1 ? wapis[0] : wapis,
                _args
            });
        }
        if (this._createConfig?.aggressiveGarbageCollection) {
            const gc = await this._page.evaluate(() => gc());
        }
        const mainPromise = this._page.evaluate(pageFunction, ...args);
        if (callTimeout)
            return await Promise.race([mainPromise, new Promise((resolve, reject) => setTimeout(reject, this._createConfig?.callTimeout, new errors_1.PageEvaluationTimeout()))]);
        const res = await mainPromise;
        if (_t && logging) {
            logging_1.log.info(`OUT ${invocation_id}: ${Date.now() - _t}ms`, { res });
        }
        return this.responseWrap(res);
    }
    responseWrap(res) {
        if (this._loaded && typeof res === "string" && res.includes("requires") && res.includes("license")) {
            console.info('\x1b[36m', "🔶", res, "🔶", '\x1b[0m');
        }
        if (this._createConfig.onError && typeof res == "string" && (res.startsWith("Error") || res.startsWith("ERROR"))) {
            const e = this._createConfig.onError;
            if (e == model_1.OnError.LOG_AND_FALSE ||
                e == model_1.OnError.LOG_AND_STRING ||
                res.includes("get.openwa.dev"))
                console.error(res);
            if (e == model_1.OnError.AS_STRING ||
                e == model_1.OnError.NOTHING ||
                e == model_1.OnError.LOG_AND_STRING)
                return res;
            if (e == model_1.OnError.LOG_AND_FALSE ||
                e == model_1.OnError.RETURN_FALSE)
                return false;
            if (e == model_1.OnError.RETURN_ERROR)
                return new Error(res);
            if (e == model_1.OnError.THROW)
                throw new Error(res);
        }
        return res;
    }
    removeListener(listener) {
        events_1.ev.removeAllListeners(this.getEventSignature(listener));
        return true;
    }
    removeAllListeners() {
        Object.keys(this._registeredEvListeners).map(listener => events_1.ev.removeAllListeners(this.getEventSignature(listener)));
        return true;
    }
    async registerListener(funcName, _fn, queueOptions) {
        let fn;
        if (queueOptions) {
            if (!this._queues[funcName]) {
                this._queues[funcName] = new p_queue_1.default(queueOptions);
            }
            fn = async (data) => this._queues[funcName].add(() => _fn(data), {
                priority: this.tickPriority()
            });
        }
        else {
            fn = _fn;
        }
        if (this._registeredEvListeners && this._registeredEvListeners[funcName]) {
            return events_1.ev.on(this.getEventSignature(funcName), ({ data }) => fn(data), { objectify: true });
        }
        const set = () => this.pup(({ funcName }) => {
            return window[funcName] ? WAPI[`${funcName}`](obj => window[funcName](obj)) : false;
        }, { funcName });
        if (this._listeners[funcName] && !this._refreshing) {
            return true;
        }
        this._listeners[funcName] = fn;
        const exists = await this.pup(({ checkFuncName }) => window[checkFuncName] ? true : false, { checkFuncName: funcName });
        if (exists)
            return await set();
        const res = await this._page.exposeFunction(funcName, (obj) => fn(obj)).then(set).catch(() => set);
        return res;
    }
    registerPageEventListener(_event, callback, priority) {
        const event = _event;
        this._pageListeners.push({
            event,
            callback,
            priority
        });
        if (this._registeredPageListeners.includes(event))
            return true;
        this._registeredPageListeners.push(event);
        logging_1.log.info(`setting page listener: ${String(event)}`, this._registeredPageListeners);
        this._page.on(event, async (...args) => {
            await Promise.all(this._pageListeners.filter(l => l.event === event).filter(({ priority }) => priority !== -1).sort((a, b) => (b.priority || 0) - (a.priority || 0)).map(l => l.callback(...args)));
            await Promise.all(this._pageListeners.filter(l => l.event === event).filter(({ priority }) => priority == -1).sort((a, b) => (b.priority || 0) - (a.priority || 0)).map(l => l.callback(...args)));
            return;
        });
    }
    async gc() {
        await this._page.evaluate(() => gc());
        return;
    }
    async onLogout(fn, priority) {
        const event = 'framenavigated';
        this._onLogoutCallbacks.push({
            callback: fn,
            priority
        });
        if (!this._queues[event])
            this._queues[event] = new p_queue_1.default({
                concurrency: 1,
                intervalCap: 1,
                carryoverConcurrencyCount: true
            });
        if (this._registeredPageListeners.includes(event))
            return true;
        this.registerPageEventListener(event, async (frame) => {
            if (frame.url().includes('post_logout=1')) {
                console.log("LOGGED OUT");
                logging_1.log.warn("LOGGED OUT");
                await Promise.all(this._onLogoutCallbacks.filter(c => c.priority !== -1).map(({ callback }) => this._queues[event].add(() => callback(true))));
                await this._queues[event].onEmpty();
                await Promise.all(this._onLogoutCallbacks.filter(c => c.priority == -1).map(({ callback }) => this._queues[event].add(() => callback(true))));
                await this._queues[event].onEmpty();
            }
        }, priority || 1);
        return true;
    }
    async waitWhQIdle() {
        if (this._webhookQueue) {
            return await this._webhookQueue.onIdle();
        }
        return true;
    }
    async waitAllQEmpty() {
        return await Promise.all([
            this._webhookQueue,
            ...Object.values(this._queues)
        ].filter(q => q).map(q => q?.onEmpty()));
        return true;
    }
    getListenerQueues() {
        return this._queues;
    }
    async preprocessMessage(message, source) {
        let alreadyProcessed = false;
        if (this._preprocIdempotencyCheck[message.id]) {
            logging_1.log.info(`preprocessMessage: ${message.id} already being processed`);
            alreadyProcessed = true;
        }
        this._preprocIdempotencyCheck[message.id] = true;
        let fil = "";
        try {
            fil = typeof this._createConfig.preprocFilter == "function" ? this._createConfig.preprocFilter : typeof this._createConfig.preprocFilter == "string" ? eval(this._createConfig.preprocFilter || "undefined") : undefined;
        }
        catch (error) {
        }
        const m = fil ? [message].filter(typeof fil == "function" ? fil : x => x)[0] : message;
        if (m && this._createConfig.messagePreprocessor) {
            if (!Array.isArray(this._createConfig.messagePreprocessor))
                this._createConfig.messagePreprocessor = [this._createConfig.messagePreprocessor];
            let _m = m;
            await Promise.all(this._createConfig.messagePreprocessor.map(async (preproc, index) => {
                let custom = false;
                const start = Date.now();
                if (typeof preproc === "function") {
                    custom = true;
                    _m = await preproc(_m, this, alreadyProcessed, source);
                }
                else if (typeof preproc === "string" && preProcessors_1.MessagePreprocessors[preproc])
                    _m = await preProcessors_1.MessagePreprocessors[preproc](_m, this, alreadyProcessed, source);
                logging_1.log.info(`Preproc ${custom ? 'CUSTOM' : preproc} ${index} ${fil} ${message.id} ${m.id} ${Date.now() - start}ms`);
                return _m;
            }));
            const preprocres = _m || message;
            delete this._preprocIdempotencyCheck[message.id];
            return preprocres;
        }
        delete this._preprocIdempotencyCheck[message.id];
        return message;
    }
    async onMessage(fn, queueOptions) {
        const _fn = async (message) => fn(await this.preprocessMessage(message, 'onMessage'));
        return this.registerListener(events_2.SimpleListener.Message, _fn, this?._createConfig?.pQueueDefault || queueOptions);
    }
    async onAnyMessage(fn, queueOptions) {
        const _fn = async (message) => fn(await this.preprocessMessage(message, 'onAnyMessage'));
        return this.registerListener(events_2.SimpleListener.AnyMessage, _fn, this?._createConfig?.pQueueDefault || queueOptions);
    }
    async onMessageDeleted(fn) {
        return this.registerListener(events_2.SimpleListener.MessageDeleted, fn);
    }
    async onChatDeleted(fn) {
        return this.registerListener(events_2.SimpleListener.ChatDeleted, fn);
    }
    async onButton(fn) {
        return this.registerListener(events_2.SimpleListener.Button, fn);
    }
    async onPollVote(fn) {
        return this.registerListener(events_2.SimpleListener.PollVote, fn);
    }
    async onBroadcast(fn) {
        return this.registerListener(events_2.SimpleListener.Broadcast, fn);
    }
    async onBattery(fn) {
        return this.registerListener(events_2.SimpleListener.Battery, fn);
    }
    async onPlugged(fn) {
        return this.registerListener(events_2.SimpleListener.Plugged, fn);
    }
    async onStory(fn) {
        return this.registerListener(events_2.SimpleListener.Story, fn);
    }
    async onStateChanged(fn) {
        return this.registerListener(events_2.SimpleListener.StateChanged, fn);
    }
    async onIncomingCall(fn) {
        return this.registerListener(events_2.SimpleListener.IncomingCall, fn);
    }
    async onCallState(fn) {
        return this.registerListener(events_2.SimpleListener.CallState, fn);
    }
    async onLabel(fn) {
        return this.registerListener(events_2.SimpleListener.Label, fn);
    }
    async onOrder(fn) {
        return this.registerListener(events_2.SimpleListener.Order, fn);
    }
    async onNewProduct(fn) {
        return this.registerListener(events_2.SimpleListener.NewProduct, fn);
    }
    async onReaction(fn) {
        return this.registerListener(events_2.SimpleListener.Reaction, fn);
    }
    async onChatState(fn) {
        return this.registerListener(events_2.SimpleListener.ChatState, fn);
    }
    async onAck(fn) {
        const _fn = async (message) => fn(message);
        return this.registerListener(events_2.SimpleListener.Ack, _fn);
    }
    async onGlobalParticipantsChanged(fn) {
        return this.registerListener(events_2.SimpleListener.GlobalParticipantsChanged, fn);
    }
    async onGroupApprovalRequest(fn) {
        return this.registerListener(events_2.SimpleListener.GroupApprovalRequest, fn);
    }
    async onGroupChange(fn) {
        return this.registerListener(events_2.SimpleListener.GroupChange, fn);
    }
    async onAddedToGroup(fn) {
        return this.registerListener(events_2.SimpleListener.AddedToGroup, fn);
    }
    async onRemovedFromGroup(fn) {
        return this.registerListener(events_2.SimpleListener.RemovedFromGroup, fn);
    }
    async onChatOpened(fn) {
        return this.registerListener(events_2.SimpleListener.ChatOpened, fn);
    }
    async onContactAdded(fn) {
        return this.registerListener(events_2.SimpleListener.ChatOpened, fn);
    }
    async onParticipantsChanged(groupId, fn, legacy = false) {
        const funcName = "onParticipantsChanged_" + groupId.replace('_', "").replace('_', "");
        return this._page.exposeFunction(funcName, (participantChangedEvent) => fn(participantChangedEvent))
            .then(() => this.pup(({ groupId, funcName, legacy }) => {
            if (legacy)
                return WAPI._onParticipantsChanged(groupId, window[funcName]);
            else
                return WAPI.onParticipantsChanged(groupId, window[funcName]);
        }, { groupId, funcName, legacy }));
    }
    async onLiveLocation(chatId, fn) {
        const funcName = "onLiveLocation_" + chatId.replace('_', "").replace('_', "");
        return this._page.exposeFunction(funcName, (liveLocationChangedEvent) => fn(liveLocationChangedEvent))
            .then(() => this.pup(({ chatId, funcName }) => {
            return WAPI.onLiveLocation(chatId, window[funcName]);
        }, { chatId, funcName }));
    }
    async testCallback(callbackToTest, testData) {
        return this.pup(({ callbackToTest, testData }) => {
            return WAPI.testCallback(callbackToTest, testData);
        }, { callbackToTest, testData });
    }
    async setPresence(available) {
        return await this.pup(available => WAPI.setPresence(available), available);
    }
    async setMyStatus(newStatus) {
        return await this.pup(({ newStatus }) => WAPI.setMyStatus(newStatus), { newStatus });
    }
    async createLabel(label) {
        return await this.pup(({ label }) => WAPI.createLabel(label), { label });
    }
    async addLabel(label, chatId) {
        return await this.pup(({ label, chatId }) => WAPI.addOrRemoveLabels(label, chatId, 'add'), { label, chatId });
    }
    async getAllLabels() {
        return await this.pup(() => WAPI.getAllLabels());
    }
    async removeLabel(label, chatId) {
        return await this.pup(({ label, chatId }) => WAPI.addOrRemoveLabels(label, chatId, 'remove'), { label, chatId });
    }
    async getChatsByLabel(label) {
        const res = await this.pup(({ label }) => WAPI.getChatsByLabel(label), { label });
        if (typeof res == 'string')
            new errors_1.CustomError(errors_1.ERROR_NAME.INVALID_LABEL, res);
        return res;
    }
    async sendVCard(chatId, vcard, contactName, contactNumber) {
        return await this.pup(({ chatId, vcard, contactName, contactNumber }) => WAPI.sendVCard(chatId, vcard, contactName, contactNumber), { chatId, vcard, contactName, contactNumber });
    }
    async setMyName(newName) {
        return await this.pup(({ newName }) => WAPI.setMyName(newName), { newName });
    }
    async setChatState(chatState, chatId) {
        return await this.pup(({ chatState, chatId }) => WAPI.setChatState(chatState, chatId), { chatState, chatId });
    }
    async getConnectionState() {
        return await this._page.evaluate(() => WAPI.getState());
    }
    async getUnsentMessages() {
        return await this._page.evaluate(() => WAPI.getUnsentMessages());
    }
    async forceUpdateConnectionState(killBeforeReconnect) {
        return await this._page.evaluate((killBeforeReconnect) => WAPI.forceUpdateConnectionState(killBeforeReconnect), killBeforeReconnect);
    }
    async getChatWithNonContacts() {
        return await this._page.evaluate(() => WAPI.getChatWithNonContacts());
    }
    async kill(reason = "MANUALLY_KILLED") {
        if (this._currentlyBeingKilled)
            return;
        this._currentlyBeingKilled = true;
        console.log(`Killing client. Shutting Down: ${reason}`);
        logging_1.log.info(`Killing client. Shutting Down: ${reason}`);
        const browser = await this?._page?.browser();
        const pid = browser?.process() ? browser?.process()?.pid : null;
        try {
            await (0, browser_1.kill)(this._page, browser, false, pid, reason);
        }
        catch (error) {
        }
        this._currentlyBeingKilled = false;
        return true;
    }
    async forceRefocus() {
        const useHere = await this._page.evaluate(() => WAPI.getUseHereString());
        await this._page.waitForFunction(`[...document.querySelectorAll("div[role=button")].find(e=>{return e.innerHTML.toLowerCase().includes("${useHere.toLowerCase()}")})`, { timeout: 0 });
        await this._page.evaluate(`[...document.querySelectorAll("div[role=button")].find(e=>{return e.innerHTML.toLowerCase().includes("${useHere.toLowerCase()}")}).click()`);
        return true;
    }
    async isPhoneDisconnected() {
        const phoneNotConnected = await this._page.evaluate(() => WAPI.getLocaledString('active Internet connection'));
        return await this.pup(`!![...document.querySelectorAll("div")].find(e=>{return e.innerHTML.toLowerCase().includes("${phoneNotConnected.toLowerCase()}")})`);
    }
    async healthCheck() {
        return await this._page.evaluate(() => WAPI.healthCheck());
    }
    async getProcessStats() {
        return await (0, pid_utils_1.pidTreeUsage)([process.pid, this._page.browser().process().pid]);
    }
    async forceUpdateLiveLocation(chatId) {
        return await this.pup(({ chatId }) => WAPI.forceUpdateLiveLocation(chatId), { chatId });
    }
    async testButtons(chatId) {
        return await this.pup(({ chatId }) => WAPI.testButtons(chatId), { chatId });
    }
    async link(params) {
        const _p = [this._createConfig?.linkParams, params].filter(x => x).join('&');
        return `https://get.openwa.dev/l/${await this.getHostNumber()}${_p ? `?${_p}` : ''}`;
    }
    async getLicenseLink(params) {
        return await this.link(params);
    }
    async sendText(to, content) {
        if (!content)
            content = '';
        if (typeof content !== 'string')
            content = String(content);
        const err = [
            'Not able to send message to broadcast',
            'Not a contact',
            'Error: Number not linked to WhatsApp Account',
            'ERROR: Please make sure you have at least one chat'
        ];
        content = content?.trim() || content;
        const res = await this.pup(({ to, content }) => {
            WAPI.sendSeen(to);
            return WAPI.sendMessage(to, content);
        }, { to, content });
        if (err.includes(res)) {
            let msg = res;
            if (res == err[1])
                msg = `ERROR: ${res}. Unlock this feature and support open-wa by getting a license: ${await this.link()}`;
            console.error(`\n${msg}\n`);
            return this.responseWrap(msg);
        }
        return (err.includes(res) ? false : res);
    }
    async sendTextWithMentions(to, content, hideTags, mentions) {
        content = content.replace(/@c.us/, "");
        return await this.pup(({ to, content, hideTags, mentions }) => {
            WAPI.sendSeen(to);
            return WAPI.sendMessageWithMentions(to, content, hideTags, mentions);
        }, { to, content, hideTags, mentions });
    }
    async editMessage(messageId, text) {
        return await this.pup(({ messageId, text }) => {
            return WAPI.editMessage(messageId, text);
        }, { messageId, text });
    }
    async sendPaymentRequest(to, amount, currency, message) {
        return await this.pup(({ to, amount, currency, message }) => {
            return WAPI.sendPaymentRequest(to, amount, currency, message);
        }, { to, amount, currency, message });
    }
    async sendButtons(to, body, buttons, title, footer) {
        return await this.pup(({ to, body, buttons, title, footer }) => {
            return WAPI.sendButtons(to, body, buttons, title, footer);
        }, { to, body, buttons, title, footer });
    }
    async sendAdvancedButtons(to, body, buttons, text, footer, filename) {
        if (typeof body !== "string" && body.lat) {
            body = body;
        }
        else if (typeof body == "string" && !(0, tools_1.isDataURL)(body) && !(0, tools_1.isBase64)(body) && !body.includes("data:")) {
            const relativePath = path.join(path.resolve(process.cwd(), body || ''));
            if (typeof body == "string" && fs.existsSync(body) || fs.existsSync(relativePath)) {
                body = await (0, datauri_1.default)(fs.existsSync(body) ? body : relativePath);
            }
            else if (typeof body == "string" && (0, is_url_superb_1.default)(body)) {
                body = await (0, tools_1.getDUrl)(body);
            }
            else
                throw new errors_1.CustomError(errors_1.ERROR_NAME.FILE_NOT_FOUND, `Cannot find file. Make sure the file reference is relative, a valid URL or a valid DataURL: ${body.slice(0, 25)}`);
        }
        else if (typeof body == "string" && (body.includes("data:") && body.includes("undefined") || body.includes("application/octet-stream") && filename && mime_types_1.default.lookup(filename))) {
            body = `data:${mime_types_1.default.lookup(filename)};base64,${body.split(',')[1]}`;
        }
        return await this.pup(({ to, body, buttons, text, footer, filename }) => {
            return WAPI.sendAdvancedButtons(to, body, buttons, text, footer, filename);
        }, { to, body, buttons, text, footer, filename });
    }
    async sendBanner(to, base64) {
        return await this.pup(({ to, base64 }) => {
            return WAPI.sendBanner(to, base64);
        }, { to, base64 });
    }
    async sendListMessage(to, sections, title, description, actionText) {
        return await this.pup(({ to, sections, title, description, actionText }) => {
            return WAPI.sendListMessage(to, sections, title, description, actionText);
        }, { to, sections, title, description, actionText });
    }
    async sendReplyWithMentions(to, content, replyMessageId, hideTags, mentions) {
        content = content.replace(/@c.us/, "");
        return await this.pup(({ to, content, replyMessageId, hideTags, mentions }) => {
            WAPI.sendSeen(to);
            return WAPI.sendReplyWithMentions(to, content, replyMessageId, hideTags, mentions);
        }, { to, content, replyMessageId, hideTags, mentions });
    }
    async tagEveryone(groupId, content, hideTags, formatting, messageBeforeTags) {
        return await this.pup(({ groupId, content, hideTags, formatting, messageBeforeTags }) => WAPI.tagEveryone(groupId, content, hideTags, formatting, messageBeforeTags), { groupId, content, hideTags, formatting, messageBeforeTags });
    }
    async sendMessageWithThumb(thumb, url, title, description, text, chatId, quotedMsgId, customSize) {
        return await this.pup(({ thumb, url, title, description, text, chatId, quotedMsgId, customSize }) => {
            WAPI.sendMessageWithThumb(thumb, url, title, description, text, chatId, quotedMsgId, customSize);
        }, {
            thumb,
            url,
            title,
            description,
            text,
            chatId,
            quotedMsgId,
            customSize
        });
    }
    async sendLocation(to, lat, lng, loc, address, url) {
        return await this.pup(({ to, lat, lng, loc, address, url }) => WAPI.sendLocation(to, lat, lng, loc, address, url), { to, lat, lng, loc, address, url });
    }
    async getGeneratedUserAgent(userA) {
        const ua = userA || puppeteer_config_1.useragent;
        return await this.pup(({ ua }) => WAPI.getGeneratedUserAgent(ua), { ua });
    }
    async decryptMedia(message) {
        let m;
        if (typeof message === "string")
            m = await this.getMessageById(message);
        else
            m = message;
        if (!m.mimetype)
            throw new errors_1.CustomError(errors_1.ERROR_NAME.NOT_MEDIA, "Not a media message");
        if (m.type == "sticker")
            m = await this.getStickerDecryptable(m.id);
        if (m === false) {
            console.error(`\nUnable to decrypt sticker. Unlock this feature and support open-wa by getting a license: ${await this.link("v=i")}\n`);
            throw new errors_1.CustomError(errors_1.ERROR_NAME.STICKER_NOT_DECRYPTED, 'Sticker not decrypted');
        }
        const mediaData = await (0, wa_decrypt_1.decryptMedia)(m);
        return `data:${m.mimetype};base64,${mediaData.toString('base64')}`;
    }
    async sendImage(to, file, filename, caption, quotedMsgId, waitForId, ptt, withoutPreview, hideTags, viewOnce, requestConfig) {
        const err = [
            'Not able to send message to broadcast',
            'Not a contact',
            'Error: Number not linked to WhatsApp Account',
            'ERROR: Please make sure you have at least one chat'
        ];
        const [[inputElementId, inputElement], fileAsLocalTemp] = await Promise.all([
            (async () => {
                const inputElementId = await this._page.evaluate(() => WAPI.createTemporaryFileInput());
                const inputElement = await this._page.$(`#${inputElementId}`);
                return [inputElementId, inputElement];
            })(),
            (0, tools_1.assertFile)(file, filename, tools_1.FileOutputTypes.TEMP_FILE_PATH, requestConfig || {})
        ]);
        await inputElement.uploadFile(fileAsLocalTemp);
        file = inputElementId;
        const res = await this.pup(({ to, file, filename, caption, quotedMsgId, waitForId, ptt, withoutPreview, hideTags, viewOnce }) => WAPI.sendImage(file, to, filename, caption, quotedMsgId, waitForId, ptt, withoutPreview, hideTags, viewOnce), { to, file, filename, caption, quotedMsgId, waitForId, ptt, withoutPreview, hideTags, viewOnce });
        if (fileAsLocalTemp)
            await (0, tools_1.rmFileAsync)(fileAsLocalTemp);
        if (err.includes(res))
            console.error(res);
        return (err.includes(res) ? false : res);
    }
    async sendYoutubeLink(to, url, text = '', thumbnail, quotedMsgId, customSize) {
        return this.sendLinkWithAutoPreview(to, url, text, thumbnail, quotedMsgId, customSize);
    }
    async sendLinkWithAutoPreview(to, url, text, thumbnail, quotedMsgId, customSize) {
        let linkData;
        let thumb;
        try {
            linkData = (await axios_1.default.get(`${this._createConfig?.linkParser || "https://link.openwa.cloud/api"}?url=${url}`)).data;
            logging_1.log.info("Got link data");
            if (!thumbnail)
                thumb = await (0, tools_1.getDUrl)(linkData.image);
        }
        catch (error) {
            console.error(error);
        }
        if (linkData && (thumbnail || thumb))
            return await this.sendMessageWithThumb(thumbnail || thumb, url, linkData.title, linkData.description, text, to, quotedMsgId, customSize);
        else
            return await this.pup(({ to, url, text, thumbnail }) => WAPI.sendLinkWithAutoPreview(to, url, text, thumbnail), { to, url, text, thumbnail });
    }
    async reply(to, content, quotedMsgId, sendSeen) {
        if (sendSeen)
            await this.sendSeen(to);
        return await this.pup(({ to, content, quotedMsgId }) => WAPI.reply(to, content, quotedMsgId), { to, content, quotedMsgId });
    }
    async checkReadReceipts(contactId) {
        return await this.pup(({ contactId }) => WAPI.checkReadReceipts(contactId), { contactId });
    }
    async sendFile(to, file, filename, caption, quotedMsgId, waitForId, ptt, withoutPreview, hideTags, viewOnce, requestConfig) {
        return this.sendImage(to, file, filename, caption, quotedMsgId, waitForId, ptt, withoutPreview, hideTags, viewOnce, requestConfig);
    }
    async isGroupIdUnsafe(groupChatId) {
        const { data } = await axios_1.default.post('https://openwa.dev/groupId-check', {
            groupChatId,
            sessionInfo: this.getSessionInfo(),
            config: this.getConfig()
        });
        if (data.unsafe)
            console.warn(`${groupChatId} is marked as unsafe`);
        return data.err || data.unsafe;
    }
    async sendPtt(to, file, quotedMsgId) {
        return this.sendImage(to, file, 'ptt.ogg', '', quotedMsgId ? quotedMsgId : null, true, true);
    }
    async sendAudio(to, file, quotedMsgId) {
        return this.sendFile(to, file, 'file.mp3', '', quotedMsgId, true, false, false, false);
    }
    async sendPoll(to, name, options, quotedMsgId, allowMultiSelect) {
        return await this.pup(({ to, name, options, quotedMsgId, allowMultiSelect }) => {
            return WAPI.sendPoll(to, name, options, quotedMsgId, allowMultiSelect);
        }, { to, name, options, quotedMsgId, allowMultiSelect });
    }
    async sendVideoAsGif(to, file, filename, caption, quotedMsgId, requestConfig = {}) {
        if (!(0, tools_1.isDataURL)(file)) {
            const relativePath = path.join(path.resolve(process.cwd(), file || ''));
            if (fs.existsSync(file) || fs.existsSync(relativePath)) {
                file = await (0, datauri_1.default)(fs.existsSync(file) ? file : relativePath);
            }
            else if ((0, is_url_superb_1.default)(file)) {
                file = await (0, tools_1.getDUrl)(file, requestConfig);
            }
            else
                throw new errors_1.CustomError(errors_1.ERROR_NAME.FILE_NOT_FOUND, 'Cannot find file. Make sure the file reference is relative, a valid URL or a valid DataURL');
        }
        return await this.pup(({ to, file, filename, caption, quotedMsgId }) => {
            return WAPI.sendVideoAsGif(file, to, filename, caption, quotedMsgId);
        }, { to, file, filename, caption, quotedMsgId });
    }
    async sendGiphy(to, giphyMediaUrl, caption) {
        const ue = /^https?:\/\/media\.giphy\.com\/media\/([a-zA-Z0-9]+)/;
        const n = ue.exec(giphyMediaUrl);
        if (n) {
            const r = `https://i.giphy.com/${n[1]}.mp4`;
            const filename = `${n[1]}.mp4`;
            const dUrl = await (0, tools_1.getDUrl)(r);
            return await this.pup(({ to, dUrl, filename, caption }) => {
                WAPI.sendVideoAsGif(dUrl, to, filename, caption);
            }, { to, dUrl, filename, caption });
        }
        else {
            console.log('something is wrong with this giphy link');
            logging_1.log.error('something is wrong with this giphy link', giphyMediaUrl);
            return;
        }
    }
    async sendFileFromUrl(to, url, filename, caption, quotedMsgId, requestConfig = {}, waitForId, ptt, withoutPreview, hideTags, viewOnce) {
        return await this.sendFile(to, url, filename, caption, quotedMsgId, waitForId, ptt, withoutPreview, hideTags, viewOnce, requestConfig);
    }
    async getMe() {
        return await this._page.evaluate(() => WAPI.getMe());
    }
    async getFeatures() {
        return await this._page.evaluate(() => WAPI.getFeatures());
    }
    async getSnapshot(chatId, width, height) {
        if (width && height)
            await this.resizePage(width, height);
        const snapshotElement = chatId ? await this._page.evaluateHandle(({ chatId }) => WAPI.getSnapshotElement(chatId), { chatId }) : this.getPage();
        const screenshot = await snapshotElement.screenshot({
            type: "png",
            encoding: "base64"
        });
        return `data:image/png;base64,${screenshot}`;
    }
    async metrics() {
        const metrics = await this._page.metrics();
        const sessionMetrics = await this.pup(() => WAPI.launchMetrics());
        const res = {
            ...(metrics || {}),
            ...(sessionMetrics || {})
        };
        logging_1.log.info("Metrics:", res);
        return res;
    }
    async iAmAdmin() {
        return await this.pup(() => WAPI.iAmAdmin());
    }
    async getKickedGroups() {
        return await this.pup(() => WAPI.getKickedGroups());
    }
    async syncContacts() {
        return await this.pup(() => WAPI.syncContacts());
    }
    async getAmountOfLoadedMessages() {
        return await this.pup(() => WAPI.getAmountOfLoadedMessages());
    }
    async getBusinessProfilesProducts(id) {
        return await this.pup(({ id }) => WAPI.getBusinessProfilesProducts(id), { id });
    }
    async getBusinessProfile(id) {
        return await this.pup(({ id }) => WAPI.getBusinessProfile(id), { id });
    }
    async sendImageWithProduct(to, image, caption, bizNumber, productId) {
        return await this.pup(({ to, image, bizNumber, caption, productId }) => {
            WAPI.sendImageWithProduct(image, to, caption, bizNumber, productId);
        }, { to, image, bizNumber, caption, productId });
    }
    async sendCustomProduct(to, image, productData) {
        return await this.pup(({ to, image, productData }) => WAPI.sendCustomProduct(to, image, productData), { to, image, productData });
    }
    async sendContact(to, contactId) {
        return await this.pup(({ to, contactId }) => WAPI.sendContact(to, contactId), { to, contactId });
    }
    async sendMultipleContacts(to, contactIds) {
        return await this.pup(({ to, contactIds }) => WAPI.sendMultipleContacts(to, contactIds), { to, contactIds });
    }
    async simulateTyping(to, on) {
        return await this.pup(({ to, on }) => WAPI.simulateTyping(to, on), { to, on });
    }
    async simulateRecording(to, on) {
        return await this.pup(({ to, on }) => WAPI.simulateRecording(to, on), { to, on });
    }
    async archiveChat(id, archive) {
        return await this.pup(({ id, archive }) => WAPI.archiveChat(id, archive), { id, archive });
    }
    async pinChat(id, pin) {
        return await this.pup(({ id, pin }) => WAPI.pinChat(id, pin), { id, pin });
    }
    async pinMessage(id, pin, pinDuration = "ThirtyDays") {
        return await this.pup(({ id, pin, pinDuration }) => WAPI.pinMessage(id, pin, pinDuration), { id, pin, pinDuration });
    }
    async keepMessage(id, keep) {
        return await this.pup(({ id, keep }) => WAPI.keepMessage(id, keep), { id, keep });
    }
    async muteChat(chatId, muteDuration) {
        return await this.pup(({ chatId, muteDuration }) => WAPI.muteChat(chatId, muteDuration), { chatId, muteDuration });
    }
    async isChatMuted(chatId) {
        return await this.pup(({ chatId }) => WAPI.isChatMuted(chatId), { chatId });
    }
    async unmuteChat(chatId) {
        return await this.pup(({ chatId }) => WAPI.unmuteChat(chatId), { chatId });
    }
    async forwardMessages(to, messages, skipMyMessages) {
        return await this.pup(({ to, messages, skipMyMessages }) => WAPI.forwardMessages(to, messages, skipMyMessages), { to, messages, skipMyMessages });
    }
    async ghostForward(to, messageId) {
        return await this.pup(({ to, messageId }) => WAPI.ghostForward(to, messageId), { to, messageId });
    }
    async getAllContacts() {
        return await this.pup(() => WAPI.getAllContacts());
    }
    async getWAVersion() {
        return await this.pup(() => WAPI.getWAVersion());
    }
    async getIssueLink() {
        return (0, tools_1.generateGHIssueLink)(this.getConfig(), this.getSessionInfo());
    }
    async isConnected() {
        return await this.pup(() => WAPI.isConnected());
    }
    async logout(preserveSessionData = false) {
        if (!preserveSessionData) {
            logging_1.log.info(`LOGOUT CALLED. INVALIDATING SESSION DATA`);
            await (0, browser_1.invalidateSesssionData)(this._createConfig);
        }
        return await this.pup(() => WAPI.logout());
    }
    async getBatteryLevel() {
        return await this.pup(() => WAPI.getBatteryLevel());
    }
    async getIsPlugged() {
        return await this.pup(() => WAPI.getIsPlugged());
    }
    async getHostNumber() {
        if (!this._hostAccountNumber)
            this._hostAccountNumber = await this.pup(() => WAPI.getHostNumber());
        return this._hostAccountNumber;
    }
    async getLicenseType() {
        return await this.pup(() => WAPI.getLicenseType());
    }
    async getTunnelCode() {
        const sessionId = this.getSessionId();
        return await this.pup(sessionId => WAPI.getTunnelCode(sessionId), sessionId);
    }
    async getLastMsgTimestamps() {
        return await this.pup(() => WAPI.getLastMsgTimestamps());
    }
    async getAllChats(withNewMessageOnly = false) {
        if (withNewMessageOnly) {
            return await this.pup(() => WAPI.getAllChatsWithNewMsg());
        }
        else {
            return await this.pup(() => WAPI.getAllChats());
        }
    }
    async getAllChatIds() {
        return await this.pup(() => WAPI.getAllChatIds());
    }
    async getBlockedIds() {
        return await this.pup(() => WAPI.getBlockedIds());
    }
    async getAllChatsWithMessages(withNewMessageOnly = false) {
        return JSON.parse(await this.pup(withNewMessageOnly => WAPI.getAllChatsWithMessages(withNewMessageOnly), withNewMessageOnly));
    }
    async getGptArray(chatId, last = 10) {
        return await this.pup(({ chatId, last }) => WAPI.getGptArray(chatId, last), { chatId, last });
    }
    async getAllGroups(withNewMessagesOnly = false) {
        return await this.pup((withNewMessagesOnly) => WAPI.getAllGroups(withNewMessagesOnly), withNewMessagesOnly);
    }
    async getAllCommunities() {
        return await this.pup(() => WAPI.getCommunities());
    }
    async getGroupMembersId(groupId) {
        return await this.pup(groupId => WAPI.getGroupParticipantIDs(groupId), groupId);
    }
    async getGroupInfo(groupId) {
        return await this.pup(groupId => WAPI.getGroupInfo(groupId), groupId);
    }
    async getCommunityInfo(communityId) {
        return await this.pup(communityId => WAPI.getCommunityInfo(communityId), communityId);
    }
    async acceptGroupJoinRequest(messageId) {
        return await this.pup(messageId => WAPI.acceptGroupJoinRequest(messageId), messageId);
    }
    async getCommunityParticipantIds(communityId) {
        return await this.pup(communityId => WAPI.getCommunityParticipantIds(communityId), communityId);
    }
    async getCommunityAdminIds(communityId) {
        return await this.pup(communityId => WAPI.getCommunityAdminIds(communityId), communityId);
    }
    async getCommunityParticipants(communityId) {
        return await this.pup(communityId => WAPI.getCommunityParticipants(communityId), communityId);
    }
    async getCommunityAdmins(communityId) {
        return await this.pup(communityId => WAPI.getCommunityAdmins(communityId), communityId);
    }
    async joinGroupViaLink(link, returnChatObj) {
        return await this.pup(({ link, returnChatObj }) => WAPI.joinGroupViaLink(link, returnChatObj), { link, returnChatObj });
    }
    async contactBlock(id) {
        return await this.pup(id => WAPI.contactBlock(id), id);
    }
    async reportSpam(id) {
        return await this.pup(id => WAPI.REPORTSPAM(id), id);
    }
    async contactUnblock(id) {
        return await this.pup(id => WAPI.contactUnblock(id), id);
    }
    async leaveGroup(groupId) {
        return await this.pup(groupId => WAPI.leaveGroup(groupId), groupId);
    }
    async getVCards(msgId) {
        return await this.pup(msgId => WAPI.getVCards(msgId), msgId);
    }
    async getGroupMembers(groupId) {
        const membersIds = await this.getGroupMembersId(groupId);
        logging_1.log.info("group members ids", membersIds);
        if (!Array.isArray(membersIds)) {
            console.error("group members ids is not an array", membersIds);
            return [];
        }
        const actions = membersIds.map(memberId => {
            return this.getContact(memberId);
        });
        return await Promise.all(actions);
    }
    async getContact(contactId) {
        return await this.pup(contactId => WAPI.getContact(contactId), contactId);
    }
    async getChatById(contactId) {
        return await this.pup(contactId => WAPI.getChatById(contactId), contactId);
    }
    async getMessageById(messageId) {
        return await this.pup(messageId => WAPI.getMessageById(messageId), messageId);
    }
    async getMessageInfo(messageId) {
        return await this.pup(messageId => WAPI.getMessageInfo(messageId), messageId);
    }
    async getOrder(id) {
        return await this.pup(id => WAPI.getOrder(id), id);
    }
    async createNewProduct(name, price, currency, images, description, url, internalId, isHidden) {
        if (!Array.isArray(images))
            images = [images];
        images = await Promise.all(images.map(image => (0, tools_1.ensureDUrl)(image)));
        return await this.pup(({ name, price, currency, images, description, url, internalId, isHidden }) => WAPI.createNewProduct(name, price, currency, images, description, url, internalId, isHidden), { name, price, currency, images, description, url, internalId, isHidden });
    }
    async editProduct(productId, name, price, currency, images, description, url, internalId, isHidden) {
        return await this.pup(({ productId, name, price, currency, images, description, url, internalId, isHidden }) => WAPI.editProduct(productId, name, price, currency, images, description, url, internalId, isHidden), { productId, name, price, currency, images, description, url, internalId, isHidden });
    }
    async sendProduct(chatId, productId) {
        return await this.pup(({ chatId, productId }) => WAPI.sendProduct(chatId, productId), { chatId, productId });
    }
    async removeProduct(productId) {
        return await this.pup(({ productId }) => WAPI.removeProduct(productId), { productId });
    }
    async getMyLastMessage(chatId) {
        return await this.pup(chatId => WAPI.getMyLastMessage(chatId), chatId);
    }
    async getStarredMessages(chatId) {
        return await this.pup(chatId => WAPI.getStarredMessages(chatId), chatId);
    }
    async starMessage(messageId) {
        return await this.pup(messageId => WAPI.starMessage(messageId), messageId);
    }
    async unstarMessage(messageId) {
        return await this.pup(messageId => WAPI.unstarMessage(messageId), messageId);
    }
    async react(messageId, emoji) {
        return await this.pup(({ messageId, emoji }) => WAPI.react(messageId, emoji), { messageId, emoji });
    }
    async getStickerDecryptable(messageId) {
        const m = await this.pup(messageId => WAPI.getStickerDecryptable(messageId), messageId);
        if (!m)
            return false;
        return {
            t: m.t,
            id: m.id,
            ...(0, wa_decrypt_1.bleachMessage)(m)
        };
    }
    async forceStaleMediaUpdate(messageId) {
        const m = await this.pup(messageId => WAPI.forceStaleMediaUpdate(messageId), messageId);
        if (!m)
            return false;
        return {
            ...(0, wa_decrypt_1.bleachMessage)(m)
        };
    }
    async getChat(contactId) {
        return await this.pup(contactId => WAPI.getChat(contactId), contactId);
    }
    async getCommonGroups(contactId) {
        return await this.pup(contactId => WAPI.getCommonGroups(contactId), contactId);
    }
    async getLastSeen(chatId) {
        return await this.pup(chatId => WAPI.getLastSeen(chatId), chatId);
    }
    async getProfilePicFromServer(chatId) {
        return await this.pup(chatId => WAPI.getProfilePicFromServer(chatId), chatId);
    }
    async sendSeen(chatId) {
        return await this.pup(chatId => WAPI.sendSeen(chatId), chatId);
    }
    async markAllRead() {
        return await this.pup(() => WAPI.markAllRead());
    }
    async markAsUnread(chatId) {
        return await this.pup(chatId => WAPI.markAsUnread(chatId), chatId);
    }
    async isChatOnline(chatId) {
        return await this.pup(chatId => WAPI.isChatOnline(chatId), chatId);
    }
    async loadEarlierMessages(contactId) {
        return await this.pup(contactId => WAPI.loadEarlierMessages(contactId), contactId);
    }
    async getStatus(contactId) {
        return await this.pup(contactId => WAPI.getStatus(contactId), contactId);
    }
    async B(chatId, payload) {
        return await this.pup(({ chatId, payload }) => WAPI.B(chatId, payload), { chatId, payload });
    }
    async loadAllEarlierMessages(contactId) {
        return await this.pup(contactId => WAPI.loadAllEarlierMessages(contactId), contactId);
    }
    async loadEarlierMessagesTillDate(contactId, timestamp) {
        return await this.pup(({ contactId, timestamp }) => WAPI.loadEarlierMessagesTillDate(contactId, timestamp), { contactId, timestamp });
    }
    async deleteChat(chatId) {
        return await this.pup(chatId => WAPI.deleteConversation(chatId), chatId);
    }
    async clearChat(chatId) {
        return await this.pup(chatId => WAPI.clearChat(chatId), chatId);
    }
    async getGroupInviteLink(chatId) {
        return await this.pup(chatId => WAPI.getGroupInviteLink(chatId), chatId);
    }
    async inviteInfo(link) {
        return await this.pup(link => WAPI.inviteInfo(link), link);
    }
    async favSticker(msgId, fav = true) {
        return await this.pup(({ msgId, fav }) => WAPI.favSticker(msgId, fav), { msgId, fav });
    }
    async sendFavSticker(chatId, favId) {
        return await this.pup(({ chatId, favId }) => WAPI.sendFavSticker(chatId, favId), { chatId, favId });
    }
    async getFavStickers() {
        return await this.pup(() => WAPI.getFavStickers());
    }
    async revokeGroupInviteLink(chatId) {
        return await this.pup(chatId => WAPI.revokeGroupInviteLink(chatId), chatId);
    }
    async getGroupApprovalRequests(groupChatId) {
        return await this.pup(groupChatId => WAPI.getGroupApprovalRequests(groupChatId), groupChatId);
    }
    async approveGroupJoinRequest(groupChatId, contactId) {
        return await this.pup(({ groupChatId, contactId }) => WAPI.approveGroupJoinRequest(groupChatId, contactId), { groupChatId, contactId });
    }
    async rejectGroupJoinRequest(groupChatId, contactId) {
        return await this.pup(({ groupChatId, contactId }) => WAPI.rejectGroupJoinRequest(groupChatId, contactId), { groupChatId, contactId });
    }
    async deleteMessage(chatId, messageId, onlyLocal = false) {
        return await this.pup(({ chatId, messageId, onlyLocal }) => WAPI.smartDeleteMessages(chatId, messageId, onlyLocal), { chatId, messageId, onlyLocal });
    }
    async checkNumberStatus(contactId) {
        return await this.pup(contactId => WAPI.checkNumberStatus(contactId), contactId);
    }
    async getUnreadMessages(includeMe, includeNotifications, use_unread_count) {
        return await this.pup(({ includeMe, includeNotifications, use_unread_count }) => WAPI.getUnreadMessages(includeMe, includeNotifications, use_unread_count), { includeMe, includeNotifications, use_unread_count });
    }
    async getAllNewMessages() {
        return await this.pup(() => WAPI.getAllNewMessages());
    }
    async getAllUnreadMessages() {
        return await this.pup(() => WAPI.getAllUnreadMessages());
    }
    async getIndicatedNewMessages() {
        return JSON.parse(await this.pup(() => WAPI.getIndicatedNewMessages()));
    }
    async emitUnreadMessages() {
        return await this.pup(() => WAPI.emitUnreadMessages());
    }
    async getAllMessagesInChat(chatId, includeMe, includeNotifications) {
        return await this.pup(({ chatId, includeMe, includeNotifications }) => WAPI.getAllMessagesInChat(chatId, includeMe, includeNotifications), { chatId, includeMe, includeNotifications });
    }
    async loadAndGetAllMessagesInChat(chatId, includeMe, includeNotifications) {
        return await this.pup(({ chatId, includeMe, includeNotifications }) => WAPI.loadAndGetAllMessagesInChat(chatId, includeMe, includeNotifications), { chatId, includeMe, includeNotifications });
    }
    async createGroup(groupName, contacts) {
        return await this.pup(({ groupName, contacts }) => WAPI.createGroup(groupName, contacts), { groupName, contacts });
    }
    async createCommunity(communityName, communitySubject, icon, existingGroups = [], newGroups) {
        return await this.pup(({ communityName, communitySubject, icon, existingGroups, newGroups }) => WAPI.createCommunity(communityName, communitySubject, icon, existingGroups, newGroups), { communityName, communitySubject, icon, existingGroups, newGroups });
    }
    async removeParticipant(groupId, participantId) {
        return await this.pup(({ groupId, participantId }) => WAPI.removeParticipant(groupId, participantId), { groupId, participantId });
    }
    async setGroupIcon(groupId, image) {
        const mimeInfo = (0, tools_1.base64MimeType)(image);
        if (!mimeInfo || mimeInfo.includes("image")) {
            let imgData;
            imgData = await this.stickerServerRequest('convertGroupIcon', {
                image
            });
            return await this.pup(({ groupId, imgData }) => WAPI.setGroupIcon(groupId, imgData), { groupId, imgData });
        }
    }
    async setGroupIconByUrl(groupId, url, requestConfig = {}) {
        try {
            const base64 = await (0, tools_1.getDUrl)(url, requestConfig);
            return await this.setGroupIcon(groupId, base64);
        }
        catch (error) {
            throw error;
        }
    }
    async addParticipant(groupId, participantId) {
        const res = await this.pup(({ groupId, participantId }) => WAPI.addParticipant(groupId, participantId), { groupId, participantId });
        if (typeof res === "object")
            throw new errors_1.AddParticipantError('Unable to add some participants', res);
        if (typeof res === "string")
            throw new errors_1.AddParticipantError(res);
        return res;
    }
    async promoteParticipant(groupId, participantId) {
        return await this.pup(({ groupId, participantId }) => WAPI.promoteParticipant(groupId, participantId), { groupId, participantId });
    }
    async demoteParticipant(groupId, participantId) {
        return await this.pup(({ groupId, participantId }) => WAPI.demoteParticipant(groupId, participantId), { groupId, participantId });
    }
    async setGroupToAdminsOnly(groupId, onlyAdmins) {
        return await this.pup(({ groupId, onlyAdmins }) => WAPI.setGroupToAdminsOnly(groupId, onlyAdmins), { groupId, onlyAdmins });
    }
    async setGroupEditToAdminsOnly(groupId, onlyAdmins) {
        return await this.pup(({ groupId, onlyAdmins }) => WAPI.setGroupEditToAdminsOnly(groupId, onlyAdmins), { groupId, onlyAdmins });
    }
    async setGroupApprovalMode(groupId, requireApproval) {
        return await this.pup(({ groupId, requireApproval }) => WAPI.setGroupApprovalMode(groupId, requireApproval), { groupId, requireApproval });
    }
    async setGroupDescription(groupId, description) {
        return await this.pup(({ groupId, description }) => WAPI.setGroupDescription(groupId, description), { groupId, description });
    }
    async setGroupTitle(groupId, title) {
        return await this.pup(({ groupId, title }) => WAPI.setGroupTitle(groupId, title), { groupId, title });
    }
    async getGroupAdmins(groupId) {
        return await this.pup((groupId) => WAPI.getGroupAdmins(groupId), groupId);
    }
    async setChatBackgroundColourHex(hex) {
        return await this.pup((hex) => WAPI.setChatBackgroundColourHex(hex), hex);
    }
    async joinWebBeta(join) {
        return await this.pup((join) => WAPI.joinWebBeta(join), join);
    }
    async darkMode(activate) {
        return await this.pup((activate) => WAPI.darkMode(activate), activate);
    }
    async autoReject(message) {
        return await this.pup((message) => WAPI.autoReject(message), message);
    }
    async getMessageReaders(messageId) {
        return await this.pup((messageId) => WAPI.getMessageReaders(messageId), messageId);
    }
    async getPollData(messageId) {
        return await this.pup((messageId) => WAPI.getPollData(messageId), messageId);
    }
    async sendStickerfromUrl(to, url, requestConfig = {}, stickerMetadata) {
        const base64 = await (0, tools_1.getDUrl)(url, requestConfig);
        return await this.sendImageAsSticker(to, base64, stickerMetadata);
    }
    async sendStickerfromUrlAsReply(to, url, messageId, requestConfig = {}, stickerMetadata) {
        const dUrl = await (0, tools_1.getDUrl)(url, requestConfig);
        const processingResponse = await this.prepareWebp(dUrl, stickerMetadata);
        if (!processingResponse)
            return false;
        const { webpBase64, metadata } = processingResponse;
        return await this.pup(({ webpBase64, to, metadata, messageId }) => WAPI.sendStickerAsReply(webpBase64, to, metadata, messageId), { webpBase64, to, metadata, messageId });
    }
    async sendImageAsStickerAsReply(to, image, messageId, stickerMetadata) {
        if ((Buffer.isBuffer(image) || typeof image === 'object' || image?.type === 'Buffer') && image.toString) {
            image = image.toString('base64');
        }
        else if (typeof image === 'string') {
            if (!(0, tools_1.isDataURL)(image) && !(0, tools_1.isBase64)(image)) {
                if ((0, is_url_superb_1.default)(image)) {
                    image = await (0, tools_1.getDUrl)(image);
                }
                else {
                    const relativePath = path.join(path.resolve(process.cwd(), image || ''));
                    if (fs.existsSync(image) || fs.existsSync(relativePath)) {
                        image = await (0, datauri_1.default)(fs.existsSync(image) ? image : relativePath);
                    }
                    else
                        return 'FILE_NOT_FOUND';
                }
            }
        }
        const processingResponse = await this.prepareWebp(image, stickerMetadata);
        if (!processingResponse)
            return false;
        const { webpBase64, metadata } = processingResponse;
        return await this.pup(({ webpBase64, to, metadata, messageId }) => WAPI.sendStickerAsReply(webpBase64, to, metadata, messageId), { webpBase64, to, metadata, messageId });
    }
    async getSingleProperty(namespace, id, property) {
        return await this.pup(({ namespace, id, property }) => WAPI.getSingleProperty(namespace, id, property), { namespace, id, property });
    }
    async stickerServerRequest(func, a = {}, fallback = false) {
        const stickerUrl = this._createConfig.stickerServerEndpoint || (fallback ? pkg.stickerUrl : "https://sticker-api.openwa.dev") || "https://sticker-api.openwa.dev";
        if (func === 'convertMp4BufferToWebpDataUrl')
            fallback = true;
        const sessionInfo = this.getSessionInfo();
        sessionInfo.WA_AUTOMATE_VERSION = sessionInfo.WA_AUTOMATE_VERSION.split(' ')[0];
        if (a.file || a.image || a.emojiId) {
            if (!a.emojiId) {
                const key = a.file ? 'file' : 'image';
                if (!(0, tools_1.isDataURL)(a[key]) && !(0, is_url_superb_1.default)(a[key]) && !(0, tools_1.isBase64)(a[key])) {
                    const relativePath = path.join(path.resolve(process.cwd(), a[key] || ''));
                    if (fs.existsSync(a[key]) || fs.existsSync(relativePath)) {
                        a[key] = await (0, datauri_1.default)(fs.existsSync(a[key]) ? a[key] : relativePath);
                    }
                    else {
                        console.error('FILE_NOT_FOUND');
                        throw new errors_1.CustomError(errors_1.ERROR_NAME.FILE_NOT_FOUND, 'FILE NOT FOUND');
                    }
                }
                if (a?.stickerMetadata && typeof a?.stickerMetadata !== "object")
                    throw new errors_1.CustomError(errors_1.ERROR_NAME.BAD_STICKER_METADATA, `Received ${typeof a?.stickerMetadata}: ${a?.stickerMetadata}`);
            }
            if (this._createConfig?.discord) {
                a.stickerMetadata = {
                    ...(a.stickerMetadata || {}),
                    discord: `${a.stickerMetadata?.discord || this._createConfig.discord}`
                };
            }
            try {
                const url = `${stickerUrl.replace(/\/$/, '')}/${func}`;
                logging_1.log.info(`Requesting sticker from ${url}`);
                const { data } = await axios_1.default.post(url, {
                    ...a,
                    sessionInfo,
                    config: this.getConfig()
                }, {
                    maxBodyLength: 20000000,
                    maxContentLength: 1500000
                });
                return data;
            }
            catch (err) {
                if (err?.message.includes("maxContentLength size")) {
                    throw new errors_1.CustomError(errors_1.ERROR_NAME.STICKER_TOO_LARGE, err?.message);
                }
                else if (!fallback) {
                    return await this.stickerServerRequest(func, a, true);
                }
                console.error(err?.response?.status, err?.response?.data);
                throw err;
                return false;
            }
        }
        else {
            console.error("Media is missing from this request");
            throw new errors_1.CustomError(errors_1.ERROR_NAME.MEDIA_MISSING, "Media is missing from this request");
        }
    }
    async prepareWebp(image, stickerMetadata) {
        if ((0, tools_1.isDataURL)(image) && !image.includes("image")) {
            console.error("Not an image. Please use convertMp4BufferToWebpDataUrl to process video stickers");
            return false;
        }
        return await this.stickerServerRequest('prepareWebp', {
            image,
            stickerMetadata
        });
    }
    async sendImageAsSticker(to, image, stickerMetadata) {
        if ((Buffer.isBuffer(image) || typeof image === 'object' || image?.type === 'Buffer') && image.toString) {
            image = image.toString('base64');
        }
        else if (typeof image === 'string') {
            if (!(0, tools_1.isDataURL)(image) && !(0, tools_1.isBase64)(image)) {
                if ((0, is_url_superb_1.default)(image)) {
                    image = await (0, tools_1.getDUrl)(image);
                }
                else {
                    const relativePath = path.join(path.resolve(process.cwd(), image || ''));
                    if (fs.existsSync(image) || fs.existsSync(relativePath)) {
                        image = await (0, datauri_1.default)(fs.existsSync(image) ? image : relativePath);
                    }
                    else
                        return 'FILE_NOT_FOUND';
                }
            }
        }
        const processingResponse = await this.prepareWebp(image, stickerMetadata);
        if (!processingResponse)
            return false;
        const { webpBase64, metadata } = processingResponse;
        return await this.pup(({ webpBase64, to, metadata }) => WAPI.sendImageAsSticker(webpBase64, to, metadata), { webpBase64, to, metadata });
    }
    async sendMp4AsSticker(to, file, processOptions = media_1.defaultProcessOptions, stickerMetadata, messageId) {
        if ((Buffer.isBuffer(file) || typeof file === 'object' || file?.type === 'Buffer') && file.toString) {
            file = file.toString('base64');
        }
        if (typeof file === 'string') {
            if (!(0, tools_1.isDataURL)(file) && !(0, tools_1.isBase64)(file)) {
                if ((0, is_url_superb_1.default)(file)) {
                    file = await (0, tools_1.getDUrl)(file);
                }
                else {
                    const relativePath = path.join(path.resolve(process.cwd(), file || ''));
                    if (fs.existsSync(file) || fs.existsSync(relativePath)) {
                        file = await (0, datauri_1.default)(fs.existsSync(file) ? file : relativePath);
                    }
                    else
                        return 'FILE_NOT_FOUND';
                }
            }
        }
        const convertedStickerDataUrl = await this.stickerServerRequest('convertMp4BufferToWebpDataUrl', {
            file,
            processOptions,
            stickerMetadata
        });
        try {
            if (!convertedStickerDataUrl)
                return false;
            return await (messageId && this._createConfig.licenseKey) ? this.sendRawWebpAsStickerAsReply(to, messageId, convertedStickerDataUrl, true) : this.sendRawWebpAsSticker(to, convertedStickerDataUrl, true);
        }
        catch (error) {
            const msg = 'Stickers have to be less than 1MB. Please lower the fps or shorten the duration using the processOptions parameter: https://open-wa.github.io/wa-automate-nodejs/classes/client.html#sendmp4assticker';
            console.log(msg);
            logging_1.log.warn(msg);
            throw new errors_1.CustomError(errors_1.ERROR_NAME.STICKER_TOO_LARGE, msg);
        }
    }
    async sendEmoji(to, emojiId, messageId) {
        const webp = await this.stickerServerRequest('emoji', {
            emojiId
        });
        if (webp) {
            if (messageId)
                return await this.sendRawWebpAsStickerAsReply(to, messageId, webp, true);
            return await this.sendRawWebpAsSticker(to, webp, true);
        }
        return false;
    }
    async sendRawWebpAsSticker(to, webpBase64, animated = false) {
        const metadata = {
            format: 'webp',
            width: 512,
            height: 512,
            animated,
        };
        webpBase64 = webpBase64.replace(/^data:image\/(png|gif|jpeg|webp|octet-stream);base64,/, '');
        return await this.pup(({ webpBase64, to, metadata }) => WAPI.sendImageAsSticker(webpBase64, to, metadata), { webpBase64, to, metadata });
    }
    async sendRawWebpAsStickerAsReply(to, messageId, webpBase64, animated = false) {
        const metadata = {
            format: 'webp',
            width: 512,
            height: 512,
            animated,
        };
        webpBase64 = webpBase64.replace(/^data:image\/(png|gif|jpeg|webp);base64,/, '');
        return await this.pup(({ webpBase64, to, metadata, messageId }) => WAPI.sendStickerAsReply(webpBase64, to, metadata, messageId), { webpBase64, to, metadata, messageId });
    }
    async setChatEphemeral(chatId, ephemeral) {
        return await this.pup(({ chatId, ephemeral }) => WAPI.setChatEphemeral(chatId, ephemeral), { chatId, ephemeral });
    }
    async sendGiphyAsSticker(to, giphyMediaUrl) {
        return await this.pup(({ to, giphyMediaUrl }) => WAPI.sendGiphyAsSticker(to, giphyMediaUrl), { to, giphyMediaUrl });
    }
    async postTextStatus(text, textRgba, backgroundRgba, font) {
        return await this.pup(({ text, textRgba, backgroundRgba, font }) => WAPI.postTextStatus(text, textRgba, backgroundRgba, font), { text, textRgba, backgroundRgba, font });
    }
    async postThumbnailStatus(url, text, textRgba, backgroundRgba, font, thumbnail) {
        let linkData;
        let thumb = thumbnail;
        try {
            linkData = (await axios_1.default.get(`${this._createConfig?.linkParser || "https://link.openwa.cloud/api"}?url=${url}`)).data;
            logging_1.log.info("Got link data");
            if (!thumbnail)
                thumb = await (0, tools_1.getDUrl)(linkData.image);
        }
        catch (error) {
            console.error(error);
        }
        const { title, description } = linkData;
        return await this.pup(({ thumb, url, title, description, text, textRgba, backgroundRgba, font }) => WAPI.sendStoryWithThumb(thumb, url, title, description, text, textRgba, backgroundRgba, font), { thumb, url, title, description, text, textRgba, backgroundRgba, font });
    }
    async postImageStatus(data, caption) {
        return await this.pup(({ data, caption }) => WAPI.postImageStatus(data, caption), { data, caption });
    }
    async postVideoStatus(data, caption) {
        return await this.pup(({ data, caption }) => WAPI.postVideoStatus(data, caption), { data, caption });
    }
    async deleteStory(statusesToDelete) {
        return await this.pup(({ statusesToDelete }) => WAPI.deleteStatus(statusesToDelete), { statusesToDelete });
    }
    async deleteStatus(statusesToDelete) {
        return await this.deleteStory(statusesToDelete);
    }
    async deleteAllStories() {
        return await this.pup(() => WAPI.deleteAllStatus());
    }
    async deleteAllStatus() {
        return await this.deleteAllStories();
    }
    async getMyStoryArray() {
        return await this.pup(() => WAPI.getMyStatusArray());
    }
    async getMyStatusArray() {
        return await this.getMyStoryArray();
    }
    async getStoryViewers(id) {
        return await this.pup(({ id }) => WAPI.getStoryViewers(id), { id });
    }
    async clearAllChats(ts) {
        return await this.pup(({ ts }) => WAPI.clearAllChats(ts), { ts });
    }
    async cutMsgCache() {
        return await this.pup(() => WAPI.cutMsgCache());
    }
    async cutChatCache() {
        return await this.pup(() => WAPI.cutChatCache());
    }
    async deleteStaleChats(startingFrom) {
        return await this.pup(({ startingFrom }) => WAPI.deleteStaleChats(startingFrom), { startingFrom });
    }
    async downloadProfilePicFromMessage(message) {
        return await this.downloadFileWithCredentials(message.sender.profilePicThumbObj.imgFull);
    }
    async downloadFileWithCredentials(url) {
        if (!url)
            throw new errors_1.CustomError(errors_1.ERROR_NAME.MISSING_URL, 'Missing URL');
        return await this.pup(({ url }) => WAPI.downloadFileWithCredentials(url), { url });
    }
    async setProfilePic(data) {
        return await this.pup(({ data }) => WAPI.setProfilePic(data), { data });
    }
    async listWebhooks() {
        return this._registeredWebhooks ? Object.keys(this._registeredWebhooks).map(id => this._registeredWebhooks[id]).map(({ requestConfig, ...rest }) => rest) : [];
    }
    async removeWebhook(webhookId) {
        if (this._registeredWebhooks[webhookId]) {
            delete this._registeredWebhooks[webhookId];
            return true;
        }
        return false;
    }
    async updateWebhook(webhookId, events) {
        if (events === "all")
            events = Object.keys(events_2.SimpleListener).map(eventKey => events_2.SimpleListener[eventKey]);
        if (!Array.isArray(events))
            events = [events];
        const validListeners = await this._setupWebhooksOnListeners(events);
        if (this._registeredWebhooks[webhookId]) {
            this._registeredWebhooks[webhookId].events = validListeners;
            const { requestConfig, ...rest } = this._registeredWebhooks[webhookId];
            return rest;
        }
        return false;
    }
    async _setupWebhooksOnListeners(events) {
        if (events === "all")
            events = Object.keys(events_2.SimpleListener).map(eventKey => events_2.SimpleListener[eventKey]);
        if (!Array.isArray(events))
            events = [events];
        if (!this._registeredWebhookListeners)
            this._registeredWebhookListeners = {};
        if (!this._registeredWebhooks)
            this._registeredWebhooks = {};
        const validListeners = [];
        events.map(event => {
            if (!event.startsWith("on"))
                event = `on${event}`;
            if (this[event]) {
                validListeners.push(event);
                if (this._registeredWebhookListeners[event] === undefined) {
                    this._registeredWebhookListeners[event] = this[event](async (_data) => await this._webhookQueue.add(async () => await Promise.all([
                        ...Object.keys(this._registeredWebhooks).map(webhookId => this._registeredWebhooks[webhookId]).filter(webhookEntry => webhookEntry.events.includes(event))
                    ].map(({ id, url, requestConfig }) => {
                        const whStart = (0, tools_1.now)();
                        return (0, axios_1.default)({
                            method: 'post',
                            url,
                            data: this.prepEventData(_data, event, { webhook_id: id }),
                            ...requestConfig
                        })
                            .then(({ status }) => {
                            const t = ((0, tools_1.now)() - whStart).toFixed(0);
                            logging_1.log.info("Client Webhook", event, status, t);
                        })
                            .catch(err => logging_1.log.error(`CLIENT WEBHOOK ERROR: `, url, err.message));
                    }))), 10000);
                }
            }
        });
        return validListeners;
    }
    async registerWebhook(url, events, requestConfig = {}, concurrency = 5) {
        if (!this._webhookQueue)
            this._webhookQueue = new p_queue_1.default({ concurrency });
        const validListeners = await this._setupWebhooksOnListeners(events);
        const id = (0, uuid_1.v4)();
        if (validListeners.length) {
            this._registeredWebhooks[id] = {
                id,
                ts: Date.now(),
                url,
                events: validListeners,
                requestConfig
            };
            return this._registeredWebhooks[id];
        }
        console.log('Invalid listener(s)', events);
        logging_1.log.warn('Invalid listener(s)', events);
        return false;
    }
    prepEventData(data, event, extras) {
        const sessionId = this.getSessionId();
        return {
            ts: Date.now(),
            sessionId,
            id: (0, uuid_1.v4)(),
            event,
            data,
            ...extras
        };
    }
    getEventSignature(simpleListener) {
        return `${simpleListener || '**'}.${this._createConfig.sessionId || 'session'}.${this._sessionInfo.INSTANCE_ID}`;
    }
    async registerEv(simpleListener) {
        if (this[simpleListener]) {
            if (!this._registeredEvListeners)
                this._registeredEvListeners = {};
            if (this._registeredEvListeners[simpleListener]) {
                console.log('Listener already registered');
                logging_1.log.warn('Listener already registered');
                return false;
            }
            this._registeredEvListeners[simpleListener] = await this[simpleListener](data => events_1.ev.emit(this.getEventSignature(simpleListener), this.prepEventData(data, simpleListener)));
            return true;
        }
        console.log('Invalid lisetner', simpleListener);
        logging_1.log.warn('Invalid lisetner', simpleListener);
        return false;
    }
    tickPriority() {
        this._prio = this._prio - 1;
        return this._prio;
    }
    getInstanceId() {
        return this._sessionInfo.INSTANCE_ID;
    }
    createMessageCollector(c, filter, options) {
        const chatId = (c?.chat?.id || c?.id || c);
        return new MessageCollector_1.MessageCollector(this.getSessionId(), this.getInstanceId(), chatId, filter, options, events_1.ev);
    }
    awaitMessages(c, filter, options = {}) {
        return new Promise((resolve, reject) => {
            const collector = this.createMessageCollector(c, filter, options);
            collector.once('end', (collection, reason) => {
                if (options.errors && options.errors.includes(reason)) {
                    reject(collection);
                }
                else {
                    resolve(collection);
                }
            });
        });
    }
}
exports.Client = Client;
var puppeteer_config_2 = require("../config/puppeteer.config");
Object.defineProperty(exports, "useragent", { enumerable: true, get: function () { return puppeteer_config_2.useragent; } });
//# sourceMappingURL=Client.js.map