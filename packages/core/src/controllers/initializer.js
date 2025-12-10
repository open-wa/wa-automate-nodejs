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
exports.screenshot = exports.timeout = exports.configWithCases = exports.pkg = void 0;
exports.create = create;
const fs = __importStar(require("fs"));
const boxen_1 = __importDefault(require("boxen"));
const os_name_1 = __importDefault(require("os-name"));
const update_notifier_1 = __importDefault(require("update-notifier"));
const Client_1 = require("../api/Client");
const index_1 = require("../api/model/index");
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const auth_1 = require("./auth");
const browser_1 = require("./browser");
const events_1 = require("./events");
const launch_checks_1 = require("./launch_checks");
const cfonts_1 = __importDefault(require("cfonts"));
const tools_1 = require("../utils/tools");
const crypto_1 = require("crypto");
const fs_extra_1 = require("fs-extra");
const pico_s3_1 = require("pico-s3");
const init_patch_1 = require("./init_patch");
const patch_manager_1 = require("./patch_manager");
const logging_1 = require("../logging/logging");
const timeout = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms, 'timeout'));
};
exports.pkg = (0, fs_extra_1.readJsonSync)(path.join(__dirname, '../../package.json')), exports.configWithCases = (0, fs_extra_1.readJsonSync)(path.join(__dirname, '../../bin/config-schema.json')), exports.timeout = timeout;
async function create(config = {}) {
    const START_TIME = Date.now();
    if (config.logging) {
        if (Array.isArray(config?.logging))
            config.logging = (0, logging_1.setupLogging)(config?.logging, `owa-${config?.sessionId || 'session'}`);
    }
    let waPage = undefined;
    let notifier;
    let sessionId = '';
    let customUserAgent;
    if (!config || config?.eventMode !== false) {
        config.eventMode = true;
    }
    if (config?.waitForRipeSession !== false)
        config.waitForRipeSession = true;
    if (config?.multiDevice !== false)
        config.multiDevice = true;
    if (config?.deleteSessionDataOnLogout !== false)
        config.deleteSessionDataOnLogout = true;
    if (!config?.skipUpdateCheck || config?.keepUpdated) {
        notifier = await (0, update_notifier_1.default)({
            pkg: exports.pkg,
            updateCheckInterval: 0
        });
        notifier.notify();
        if (notifier?.update && config?.keepUpdated && notifier?.update.latest !== exports.pkg.version) {
            console.log('UPDATING @OPEN-WA');
            logging_1.log.info('UPDATING @OPEN-WA');
            const crossSpawn = await Promise.resolve().then(() => __importStar(require('cross-spawn')));
            const result = crossSpawn.sync('npm', ['i', '@open-wa/wa-automate'], { stdio: 'inherit' });
            if (!result.stderr) {
                console.log('UPDATED SUCCESSFULLY');
                logging_1.log.info('UPDATED SUCCESSFULLY');
            }
            console.log('RESTARTING PROCESS');
            logging_1.log.info('RESTARTING PROCESS');
            process.on("exit", function () {
                crossSpawn.spawn(process.argv.shift(), process.argv, {
                    cwd: process.cwd(),
                    detached: true,
                    stdio: "inherit"
                });
            });
            process.exit();
        }
    }
    if (config?.inDocker) {
        config = {
            ...config,
            ...(0, tools_1.getConfigFromProcessEnv)(exports.configWithCases)
        };
        config.chromiumArgs = config?.chromiumArgs || [];
        customUserAgent = config.customUserAgent;
    }
    if (sessionId === '' || config?.sessionId)
        sessionId = config?.sessionId || 'session';
    const prettyFont = cfonts_1.default.render(('@OPEN-WA|WHATSAPP|AUTOMATOR'), {
        font: '3d',
        color: 'candy',
        align: 'center',
        gradient: ["red", "#f80"],
        lineHeight: 3
    });
    console.log(config?.disableSpins ? (0, boxen_1.default)([
        `@open-wa/wa-automate   `,
        `${exports.pkg.description}`,
        `Version: ${exports.pkg.version}   `,
        `Check out the latest changes: https://github.com/open-wa/wa-automate-nodejs#latest-changes   `,
    ].join('\n'), { padding: 1, borderColor: 'yellow', borderStyle: 'bold' }) : prettyFont.string);
    if (config?.popup) {
        const { popup } = await Promise.resolve().then(() => __importStar(require('./popup')));
        const popupaddr = await popup(config);
        console.log(`You can also authenticate the session at: ${popupaddr}`);
        logging_1.log.info(`You can also authenticate the session at: ${popupaddr}`);
    }
    if (!sessionId)
        sessionId = 'session';
    const spinner = new events_1.Spin(sessionId, 'STARTUP', config?.disableSpins);
    const qrManager = new auth_1.QRManager(config);
    const RAM_INFO = `Total: ${parseFloat(`${os.totalmem() / 1000000000}`).toFixed(2)} GB | Free: ${parseFloat(`${os.freemem() / 1000000000}`).toFixed(2)} GB`;
    logging_1.log.info("RAM INFO", RAM_INFO);
    const PPTR_VERSION = (0, fs_extra_1.readJsonSync)(require.resolve("puppeteer/package.json"), { throws: false })?.version || "UNKNOWN";
    logging_1.log.info("PPTR VERSION INFO", PPTR_VERSION);
    try {
        if (typeof config === 'string')
            console.error("AS OF VERSION 3+ YOU CAN NO LONGER SET THE SESSION ID AS THE FIRST PARAMETER OF CREATE. CREATE CAN ONLY TAKE A CONFIG OBJECT. IF YOU STILL HAVE CONFIGS AS A SECOND PARAMETER, THEY WILL HAVE NO EFFECT! PLEASE SEE DOCS.");
        spinner.start('Starting');
        spinner.succeed(`Version: ${exports.pkg.version}`);
        spinner.info(`Initializing WA`);
        const mdDir = config["userDataDir"] || `${config?.sessionDataPath || (config?.inDocker ? '/sessions' : config?.sessionDataPath || '.')}/_IGNORE_${config?.sessionId || 'session'}`;
        if (process.env.AUTO_MD && fs.existsSync(mdDir) && !config?.multiDevice) {
            spinner.info(`Multi-Device directory detected. multiDevice set to true.`);
            config.multiDevice = true;
        }
        if (config?.multiDevice && config?.chromiumArgs)
            spinner.info(`Using custom chromium args with multi device will cause issues! Please remove them: ${config?.chromiumArgs}`);
        if (config?.multiDevice && !config?.useChrome)
            spinner.info(`It is recommended to set useChrome: true or use the --use-chrome flag if you are experiencing issues with Multi device support`);
        waPage = await (0, browser_1.initPage)(sessionId, config, qrManager, customUserAgent, spinner);
        spinner.succeed('Page loaded');
        const browserLaunchedTs = (0, tools_1.now)();
        const throwOnError = config && config.throwErrorOnTosBlock == true;
        const PAGE_UA = await waPage.evaluate('navigator.userAgent');
        const BROWSER_VERSION = await waPage.browser().version();
        const OS = (0, os_name_1.default)();
        const START_TS = Date.now();
        const screenshotPath = `./logs/${config.sessionId || 'session'}/${START_TS}`;
        exports.screenshot = async (page) => {
            await page.screenshot({
                path: `${screenshotPath}/${Date.now()}.jpg`
            }).catch(() => {
                fs.mkdirSync(screenshotPath, { recursive: true });
                return (0, exports.screenshot)(page);
            });
            console.log('Screenshot taken. path:', `${screenshotPath}`);
        };
        if (config?.screenshotOnInitializationBrowserError)
            waPage.on('console', async (msg) => {
                for (let i = 0; i < msg.args().length; ++i)
                    console.log(`${i}: ${msg.args()[i]}`);
                if (msg.type() === 'error' && !msg.text().includes('apify') && !msg.text().includes('crashlogs'))
                    await (0, exports.screenshot)(waPage);
            });
        const WA_AUTOMATE_VERSION = `${exports.pkg.version}${notifier?.update && (notifier?.update.latest !== exports.pkg.version) ? ` UPDATE AVAILABLE: ${notifier?.update.latest}` : ''}`;
        await waPage.waitForFunction('window.Debug!=undefined && window.Debug.VERSION!=undefined && require');
        const WA_VERSION = await waPage.evaluate(() => window.Debug ? window.Debug.VERSION : 'I think you have been TOS_BLOCKed');
        const canInjectEarly = await (0, patch_manager_1.earlyInjectionCheck)(waPage);
        const attemptingReauth = await waPage.evaluate(`!!(localStorage['WAToken2'] || localStorage['last-wid-md'])`);
        let debugInfo = {
            WA_VERSION,
            PAGE_UA,
            WA_AUTOMATE_VERSION,
            BROWSER_VERSION,
            OS,
            START_TS,
            RAM_INFO,
            PPTR_VERSION
        };
        if (config?.logDebugInfoAsObject || config?.disableSpins)
            spinner.succeed(`Debug info: ${JSON.stringify(debugInfo, null, 2)}`);
        else {
            console.table(debugInfo);
            logging_1.log.info('Debug info:', debugInfo);
        }
        debugInfo.LATEST_VERSION = !(notifier?.update && (notifier?.update.latest !== exports.pkg.version));
        debugInfo.CLI = process.env.OWA_CLI && true || false;
        spinner.succeed('Use this easy pre-filled link to report an issue: ' + (0, tools_1.generateGHIssueLink)(config, debugInfo));
        spinner.info(`Time to injection: ${((0, tools_1.now)() - browserLaunchedTs).toFixed(0)}ms`);
        const invariantAviodanceTs = (0, tools_1.now)();
        await Promise.race([
            waPage.waitForFunction(`(()=>{return require && require("__debug").modulesMap["WAWebCollections"] ? true : false})()`, { timeout: 10000 }).catch(() => { }),
            waPage.waitForFunction(`[...document.getElementsByTagName('div')].filter(x=>x.dataset && x.dataset.testid)[0]?.dataset?.testid === 'qrcode'`, { timeout: 10000 }).catch(() => { }),
            waPage.waitForFunction(`document.getElementsByTagName('circle').length===1`, { timeout: 10000 }).catch(() => { })
        ]);
        spinner.info(`Invariant Violation Avoidance: ${((0, tools_1.now)() - invariantAviodanceTs).toFixed(0)}ms`);
        if (canInjectEarly) {
            if (attemptingReauth)
                await waPage.evaluate(`window.Store = {"Msg": true}`);
            spinner.start('Injecting api');
            waPage = await (0, browser_1.injectApi)(waPage, spinner);
            spinner.start('WAPI injected');
        }
        else {
            spinner.remove();
            if (throwOnError)
                throw Error('TOSBLOCK');
        }
        spinner.start('Authenticating');
        const authRace = [];
        authRace.push((0, auth_1.isAuthenticated)(waPage).catch(() => { }));
        if (config?.authTimeout !== 0) {
            authRace.push((0, exports.timeout)((config.authTimeout || config.multiDevice ? 120 : 60) * 1000));
        }
        const authenticated = await Promise.race(authRace);
        if (authenticated === 'NUKE' && !config?.ignoreNuke) {
            spinner.fail("Session data most likely expired due to manual host account logout. Please re-authenticate this session.");
            await (0, browser_1.kill)(waPage);
            if (config?.deleteSessionDataOnLogout)
                await (0, browser_1.deleteSessionData)(config);
            if (config?.throwOnExpiredSessionData) {
                throw new index_1.SessionExpiredError();
            }
            else
                return create({
                    ...config,
                    sessionData: authenticated
                });
        }
        const earlyWid = await waPage.evaluate(`(localStorage["last-wid"] || '').replace(/"/g,"")`);
        const licensePromise = (0, patch_manager_1.getLicense)(config, {
            _serialized: earlyWid
        }, debugInfo, spinner);
        if (authenticated == 'timeout') {
            const oorProms = [(0, auth_1.phoneIsOutOfReach)(waPage)];
            if (config?.oorTimeout !== 0)
                oorProms.push((0, exports.timeout)((config?.oorTimeout || 60) * 1000));
            const outOfReach = await Promise.race(oorProms);
            spinner.emit(outOfReach && outOfReach !== 'timeout' ? 'appOffline' : 'authTimeout');
            spinner.fail(outOfReach && outOfReach !== 'timeout' ? 'Authentication timed out. Please open the app on the phone. Shutting down' : 'Authentication timed out. Shutting down. Consider increasing authTimeout config variable: https://open-wa.github.io/wa-automate-nodejs/interfaces/configobject.html#authtimeout');
            await (0, browser_1.kill)(waPage);
            if (config?.killProcessOnTimeout)
                process.exit();
            throw new Error(outOfReach ? 'App Offline' : 'Auth Timeout. Consider increasing authTimeout config variable: https://open-wa.github.io/wa-automate-nodejs/interfaces/configobject.html#authtimeout');
        }
        if (authenticated) {
            spinner.succeed('Authenticated');
        }
        else {
            spinner.info('Authenticate to continue');
            const race = [];
            if (config?.linkCode) {
                race.push(qrManager.linkCode(waPage, config, spinner));
            }
            else
                race.push(qrManager.smartQr(waPage, config, spinner));
            if (config?.qrTimeout !== 0) {
                let to = (config?.qrTimeout || 60) * 1000;
                if (config?.multiDevice)
                    to = to * 2;
                race.push((0, exports.timeout)(to));
            }
            const result = await Promise.race(race);
            if (result === "MULTI_DEVICE_DETECTED" && !config?.multiDevice) {
                await (0, browser_1.kill)(waPage);
                return create({
                    ...config,
                    multiDevice: true
                });
            }
            if (result == 'timeout') {
                spinner.emit('qrTimeout');
                spinner.fail('QR scan took too long. Session Timed Out. Shutting down. Consider increasing qrTimeout config variable: https://open-wa.github.io/wa-automate-nodejs/interfaces/configobject.html#qrtimeout');
                await (0, browser_1.kill)(waPage);
                if (config?.killProcessOnTimeout)
                    process.exit();
                throw new Error('QR Timeout');
            }
            spinner.emit('successfulScan');
            spinner.succeed();
        }
        if (config.logInternalEvents)
            await waPage.evaluate("debugEvents=true");
        await waPage.evaluate("window.critlis=true");
        const tI = await (0, tools_1.timePromise)(() => (0, init_patch_1.injectInternalEventHandler)(waPage));
        logging_1.log.info(`Injected internal event handler: ${tI} ms`);
        if (attemptingReauth) {
            await waPage.evaluate("window.Store = undefined");
            if (config?.waitForRipeSession) {
                spinner.start("Waiting for ripe session....");
                if (await (0, auth_1.waitForRipeSession)(waPage, config?.waitForRipeSessionTimeout))
                    spinner.succeed("Session ready for injection");
                else
                    spinner.fail("You may experience issues in headless mode. Continuing...");
            }
        }
        const pre = canInjectEarly ? 'Rei' : 'I';
        spinner.start(`${pre}njecting api`);
        waPage = await (0, browser_1.injectApi)(waPage, spinner, true);
        spinner.succeed(`WAPI ${pre}njected`);
        if (canInjectEarly) {
            spinner.start('Checking if session is valid');
            if (config?.safeMode) {
                await (0, exports.timeout)(5000);
                await (0, browser_1.injectApi)(waPage, spinner, true);
            }
        }
        const VALID_SESSION = await waPage.waitForFunction(`window.Store && window.Store.Msg ? true : false`, { timeout: 9000, polling: 200 }).catch(async (e) => {
            logging_1.log.error("Valid session check failed", e);
            return false;
        });
        if (VALID_SESSION) {
            const patchPromise = (0, patch_manager_1.getPatch)(config, spinner, debugInfo);
            spinner.succeed('Client is ready');
            const localStorage = JSON.parse(await waPage.evaluate(() => {
                return JSON.stringify(window.localStorage);
            }));
            const stdSessionJsonPath = (config?.sessionDataPath && config?.sessionDataPath.includes('.data.json')) ? path.join(path.resolve(process.cwd(), config?.sessionDataPath || '')) : path.join(path.resolve(process.cwd(), config?.sessionDataPath || ''), `${sessionId || 'session'}.data.json`);
            const altMainModulePath = require?.main?.path || process?.mainModule?.path;
            const altSessionJsonPath = !altMainModulePath ? null : (config?.sessionDataPath && config?.sessionDataPath.includes('.data.json')) ? path.join(path.resolve(altMainModulePath, config?.sessionDataPath || '')) : path.join(path.resolve(altMainModulePath, config?.sessionDataPath || ''), `${sessionId || 'session'}.data.json`);
            const sessionjsonpath = altSessionJsonPath && fs.existsSync(altSessionJsonPath) ? altSessionJsonPath : stdSessionJsonPath;
            const sessionData = {
                WABrowserId: localStorage.WABrowserId,
                WASecretBundle: localStorage.WASecretBundle,
                WAToken1: localStorage.WAToken1,
                WAToken2: localStorage.WAToken2
            };
            if (config.multiDevice) {
                delete sessionData.WABrowserId;
                logging_1.log.info("Multi-device detected. Removing Browser ID from session data to prevent session reauth corruption");
            }
            const sdB64 = Buffer.from(JSON.stringify(sessionData)).toString('base64');
            spinner.emit(sessionData, "sessionData");
            spinner.emit(sdB64, "sessionDataBase64");
            if (!config?.skipSessionSave)
                fs.writeFile(sessionjsonpath, sdB64, (err) => {
                    if (err) {
                        console.error(err);
                        return;
                    }
                });
            if (config?.sessionDataBucketAuth) {
                try {
                    spinner?.info('Uploading new session data to cloud storage..');
                    await (0, pico_s3_1.upload)({
                        directory: '_sessionData',
                        ...JSON.parse(Buffer.from(config.sessionDataBucketAuth, 'base64').toString('ascii')),
                        filename: `${config.sessionId || 'session'}.data.json`,
                        file: `data:text/plain;base64,${Buffer.from(sdB64).toString('base64')}`
                    });
                    spinner?.succeed('Successfully uploaded session data file to cloud storage!');
                }
                catch (error) {
                    spinner?.fail(`Something went wrong while uploading new session data to cloud storage bucket. Continuing...`);
                }
            }
            waPage.on('console', msg => {
                if (config?.logConsole)
                    console.log(msg);
                logging_1.log.info('Page Console:', msg.text());
            });
            waPage.on('error', error => {
                if (config?.logConsoleErrors)
                    console.error(error);
                logging_1.log.error('Page Console Error:', error.message || error?.text());
            });
            if (config?.restartOnCrash)
                waPage.on('error', async (error) => {
                    console.error('Page Crashed! Restarting...', error);
                    await (0, browser_1.kill)(waPage);
                    await create(config).then(config.restartOnCrash);
                });
            const pureWAPI = await (0, launch_checks_1.checkWAPIHash)();
            if (!pureWAPI) {
                config.skipBrokenMethodsCheck = true;
            }
            if (config?.hostNotificationLang) {
                await waPage.evaluate(`window.hostlang="${config.hostNotificationLang}"`);
            }
            if (!config?.skipPatches) {
                await (0, patch_manager_1.getAndInjectLivePatch)(waPage, spinner, await patchPromise, config, debugInfo);
                debugInfo.OW_KEY = await waPage.evaluate(`window.o()`);
            }
            const NUM = (await waPage.evaluate(`(window.moi() || "").replace('@c.us','').replace(/"/g,"")`) || "");
            debugInfo.NUM = NUM.slice(-4);
            debugInfo.NUM_HASH = (0, crypto_1.createHash)('md5').update(NUM, 'utf8').digest('hex');
            if (config?.skipBrokenMethodsCheck !== true)
                await (0, launch_checks_1.integrityCheck)(waPage, notifier, spinner, debugInfo);
            const LAUNCH_TIME_MS = Date.now() - START_TIME;
            debugInfo = { ...debugInfo, LAUNCH_TIME_MS };
            spinner.emit(debugInfo, "DebugInfo");
            const metrics = await waPage.evaluate(({ config }) => WAPI.launchMetrics(config), { config });
            const purgedMessage = metrics?.purged ? Object.entries(metrics.purged).filter(([, e]) => Number(e) > 0).map(([k, e]) => `${e} ${k}`).join(" and ") : "";
            if (metrics.isMd && !config?.multiDevice)
                spinner.info("!!!Please set multiDevice: true in the config or use the --mutli-Device flag!!!");
            spinner.succeed(`Client loaded for ${metrics.isBiz ? "business" : "normal"} account ${metrics.isMd && "[MD] " || ''}with ${metrics.contacts} contacts, ${metrics.chats} chats & ${metrics.messages} messages ${purgedMessage ? `+ purged ${purgedMessage} ` : ``}in ${LAUNCH_TIME_MS / 1000}s`);
            debugInfo.ACC_TYPE = metrics.isBiz ? "BUSINESS" : "PERSONAL";
            if (config?.deleteSessionDataOnLogout || config?.killClientOnLogout)
                config.eventMode = true;
            const client = new Client_1.Client(waPage, config, {
                ...debugInfo,
                ...metrics
            });
            const { me } = await client.getMe();
            const licIndex = process.argv.findIndex(arg => arg === "--license-key" || arg === "-l");
            config.licenseKey = config.licenseKey || licIndex !== -1 && process.argv[licIndex + 1];
            if (config?.licenseKey || me._serialized !== earlyWid) {
                await (0, patch_manager_1.getAndInjectLicense)(waPage, config, me, debugInfo, spinner, me._serialized !== earlyWid ? false : await licensePromise);
            }
            spinner.info("Finalizing web session...");
            await (0, init_patch_1.injectInitPatch)(waPage);
            spinner.info("Finalizing client...");
            await client.loaded();
            if (config.ensureHeadfulIntegrity && !attemptingReauth) {
                spinner.info("QR scanned for the first time. Refreshing...");
                await client.refresh();
                spinner.info("Session refreshed.");
            }
            const issueLink = await client.getIssueLink();
            console.log((0, boxen_1.default)("Use the link below to easily report issues:👇👇👇", { padding: 1, borderColor: 'red' }));
            spinner.succeed(issueLink);
            spinner.succeed(`🚀 @OPEN-WA ready for account: ${me.user.slice(-4)}`);
            if (!debugInfo.CLI && !config.licenseKey)
                spinner.succeed(`Use this link to get a license: ${await client.getLicenseLink()}`);
            spinner.emit('SUCCESS');
            spinner.remove();
            return client;
        }
        else {
            const storeKeys = await waPage.evaluate(`Object.keys(window.Store || {})`);
            logging_1.log.info("Store keys", storeKeys);
            spinner.fail('The session is invalid. Retrying');
            await (0, browser_1.kill)(waPage);
            return await create(config);
        }
    }
    catch (error) {
        spinner.emit(error.message);
        logging_1.log.error(error.message);
        if (error.stack) {
            logging_1.log.error(error.stack);
            console.error(error.stack);
        }
        await (0, browser_1.kill)(waPage);
        if (error.name === "ProtocolError" && error.message?.includes("Target closed")) {
            spinner.fail(error.message);
            process.exit();
        }
        if (error.name === "TimeoutError" && config?.multiDevice) {
            spinner.fail(`Please delete the ${config?.userDataDir} folder and any related data.json files and try again. It is highly suggested to set useChrome: true also.`);
        }
        if (error.name === "TimeoutError" && config?.killProcessOnTimeout) {
            process.exit();
        }
        else {
            spinner.remove();
            throw error;
        }
    }
}
//# sourceMappingURL=initializer.js.map