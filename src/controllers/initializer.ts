import * as fs from 'fs';
import boxen from 'boxen';
import osName from 'os-name';
import { default as updateNotifier } from 'update-notifier';
import * as crypto from 'crypto';
import { Client } from '../api/Client';
import { ConfigObject, SessionExpiredError } from '../api/model/index';
import * as path from 'path';
import { phoneIsOutOfReach, isAuthenticated, smartQr } from './auth';
import { deleteSessionData, initPage, injectApi } from './browser';
import { Spin } from './events'
import { integrityCheck, checkWAPIHash } from './launch_checks';
import treekill from 'tree-kill';
import CFonts from 'cfonts';
import { getConfigFromProcessEnv } from '../utils/tools';
import { SessionInfo } from '../api/model/sessionInfo';
import { Page } from 'puppeteer';
import { createHash } from 'crypto';
import { injectInitPatch } from './init_patch';
import { readJsonSync } from 'fs-extra'

const pkg = readJsonSync(path.join(__dirname,'../../package.json')),
configWithCases = readJsonSync(path.join(__dirname,'../../bin/config-schema.json')),
timeout = (ms : number) => {
  return new Promise(resolve => setTimeout(resolve, ms, 'timeout'));
}

let axios;
export let screenshot;


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
export async function create(config: ConfigObject = {}): Promise<Client> {
  const START_TIME = Date.now();
  let waPage = undefined;
  let notifier;
  let sessionId = '';
  let customUserAgent;

  if(!config || config?.eventMode!==false) {
    config.eventMode = true
  }

  if(!config?.skipUpdateCheck || config?.keepUpdated) {
    notifier = await updateNotifier({
      pkg,
      updateCheckInterval: 0
    });
    notifier.notify();
    if(notifier?.update && config?.keepUpdated && notifier?.update.latest !== pkg.version) {
      console.log('UPDATING @OPEN-WA')
      const crossSpawn = await import('cross-spawn')
      
      const result = crossSpawn.sync('npm', ['i', '@open-wa/wa-automate'], { stdio: 'inherit' });
      if(!result.stderr) {
          console.log('UPDATED SUCCESSFULLY')
      }
      console.log('RESTARTING PROCESS')
      process.on("exit", function () {
        crossSpawn.spawn(process.argv.shift(), process.argv, {
            cwd: process.cwd(),
            detached : true,
            stdio: "inherit"
        });
    });
    process.exit();
    }
  }

  if(config?.inDocker) {
    //try to infer config variables from process.env
    config = {
      ...config,
      ...getConfigFromProcessEnv(configWithCases)
  }
  config.chromiumArgs = config?.chromiumArgs || [];
  customUserAgent = config.customUserAgent;
  }
  if(sessionId ===  '' || config?.sessionId) sessionId = config?.sessionId || 'session';

  const prettyFont = CFonts.render(('@OPEN-WA|WHATSAPP|AUTOMATOR'), {
    font: '3d',
    color: 'candy',
    align: 'center',
    gradient: ["red","#f80"],
    lineHeight: 3
  });

  console.log(config?.disableSpins ? boxen([
    `@open-wa/wa-automate   `,
    `${pkg.description}`, //.replace(' 💬 🤖 ','')
    `Version: ${pkg.version}   `,
    `Check out the latest changes: https://github.com/open-wa/wa-automate-nodejs#latest-changes   `,
  ].join('\n'), {padding: 1, borderColor: 'yellow', borderStyle: 'bold'}) : prettyFont.string)
  
  if(config?.popup) {
    const {popup} = await import('./popup')
    const popupaddr = await popup(config);
    console.log(`You can also authenticate the session at: ${popupaddr}`)
  }
  if (!sessionId) sessionId = 'session';
  const spinner = new Spin(sessionId, 'STARTUP', config?.disableSpins);
  try {
    if(typeof config === 'string') console.error("AS OF VERSION 3+ YOU CAN NO LONGER SET THE SESSION ID AS THE FIRST PARAMETER OF CREATE. CREATE CAN ONLY TAKE A CONFIG OBJECT. IF YOU STILL HAVE CONFIGS AS A SECOND PARAMETER, THEY WILL HAVE NO EFFECT! PLEASE SEE DOCS.")
    spinner.start('Starting');
    spinner.succeed(`Version: ${pkg.version}`);
    spinner.info(`Initializing WA`);
    waPage = await initPage(sessionId, config, customUserAgent, spinner);
    spinner.succeed('Browser Launched');
    const throwOnError = config && config.throwErrorOnTosBlock == true;

    const PAGE_UA = await waPage.evaluate('navigator.userAgent');
    const BROWSER_VERSION = await waPage.browser().version();
    const OS = osName();
    const START_TS = Date.now();
    const screenshotPath = `./logs/${config.sessionId || 'session'}/${START_TS}`
    screenshot = async (page: Page) => {
      await page.screenshot({
        path:`${screenshotPath}/${Date.now()}.jpg`
    }).catch(()=>{
      fs.mkdirSync(screenshotPath, {recursive: true});
      return screenshot(page)
    });
    console.log('Screenshot taken. path:', `${screenshotPath}`)
    }
    
    if(config?.screenshotOnInitializationBrowserError) waPage.on('console', async msg => {
      for (let i = 0; i < msg.args().length; ++i)
        console.log(`${i}: ${msg.args()[i]}`);
      if(msg.type() === 'error' && !msg.text().includes('apify') && !msg.text().includes('crashlogs')) await screenshot(waPage)
    });

    const WA_AUTOMATE_VERSION = `${pkg.version}${notifier?.update && (notifier?.update.latest !== pkg.version) ? ` UPDATE AVAILABLE: ${notifier?.update.latest}` : ''}`;
    await waPage.waitForFunction('window.Debug!=undefined && window.Debug.VERSION!=undefined');
    //@ts-ignore
    const WA_VERSION = await waPage.evaluate(() => window.Debug ? window.Debug.VERSION : 'I think you have been TOS_BLOCKed')
    //@ts-ignore
    const canInjectEarly = await waPage.evaluate(() => { if(window.webpackChunkwhatsapp_web_client) {window.webpackChunkbuild = window.webpackChunkwhatsapp_web_client} else {(function(){const f = Object.entries(window).filter(([,o])=>o && o.push && (o.push != [].push));if(f[0]) {window.webpackChunkbuild = window[f[0][0]]}})()} return (typeof webpackChunkbuild !== "undefined") });
    let debugInfo : SessionInfo = {
      WA_VERSION,
      PAGE_UA,
      WA_AUTOMATE_VERSION,
      BROWSER_VERSION,
      OS,
      START_TS
    };
    if(config?.logDebugInfoAsObject || config?.disableSpins) spinner.succeed(`Debug info: ${JSON.stringify(debugInfo, null, 2)}`);
     else console.table(debugInfo);

    /**
     * Attempt to preload patches
     */
    const patchPromise = getPatch(config, spinner, debugInfo)
    if (canInjectEarly) {
      spinner.start('Injecting api');
      waPage = await injectApi(waPage);
      spinner.start('WAPI injected');
    } else {
      spinner.remove();
      if (throwOnError) throw Error('TOSBLOCK');
    }

    spinner.start('Authenticating');
    const authRace = [];
    authRace.push(isAuthenticated(waPage).catch(()=>{}))
    if (config?.authTimeout!==0) {
      authRace.push(timeout((config.authTimeout || 60) * 1000))
    }

    const authenticated = await Promise.race(authRace);
    if(authenticated==='NUKE') {
      //kill the browser
      spinner.fail("Session data most likely expired due to manual host account logout. Please re-authenticate this session.")
      await kill(waPage)
      if(config?.deleteSessionDataOnLogout) deleteSessionData(config)
      if(config?.throwOnExpiredSessionData) {
        throw new SessionExpiredError();
      } else
      //restart the process with no session data
      return create({
        ...config,
        sessionData: authenticated
      })
    }


    /**
     * Attempt to preload the license
     */
     const earlyWid = await waPage.evaluate(`(localStorage["last-wid"] || '').replace(/"/g,"")`);
     const licensePromise = getLicense(config,{
       _serialized: earlyWid
     },debugInfo,spinner)

    if (authenticated == 'timeout') {
      const outOfReach = await Promise.race([phoneIsOutOfReach(waPage), timeout(20 * 1000)]);
      spinner.emit(outOfReach && outOfReach !== 'timeout' ? 'appOffline' : 'authTimeout');
      spinner.fail(outOfReach && outOfReach !== 'timeout' ? 'Authentication timed out. Please open the app on the phone. Shutting down' : 'Authentication timed out. Shutting down. Consider increasing authTimeout config variable: https://open-wa.github.io/wa-automate-nodejs/interfaces/configobject.html#authtimeout');
      await kill(waPage);
      if(config?.killProcessOnTimeout) process.exit()
      throw new Error(outOfReach ? 'App Offline' : 'Auth Timeout. Consider increasing authTimeout config variable: https://open-wa.github.io/wa-automate-nodejs/interfaces/configobject.html#authtimeout');
    }

    if (authenticated) {
      spinner.succeed('Authenticated');
    } else {
      spinner.info('Authenticate to continue');
      const race = [];
      race.push(smartQr(waPage, config, spinner))
      if (config?.qrTimeout!==0) {
        race.push(timeout((config?.qrTimeout || 60) * 1000))
      }
      const result = await Promise.race(race);
      if (result == 'timeout') {
        spinner.emit('qrTimeout');
        spinner.fail('QR scan took too long. Session Timed Out. Shutting down. Consider increasing qrTimeout config variable: https://open-wa.github.io/wa-automate-nodejs/interfaces/configobject.html#qrtimeout');
        await kill(waPage);
        if(config?.killProcessOnTimeout) process.exit()
        throw new Error('QR Timeout');
      }
      spinner.emit('successfulScan');
      spinner.succeed();
    }
    const pre = canInjectEarly ? 'Rei' : 'I';
    spinner.start(`${pre}njecting api`);
    waPage = await injectApi(waPage);
    spinner.succeed(`WAPI ${pre}njected`);

    if (canInjectEarly) {
      //check if page is valid after 5 seconds
      spinner.start('Checking if session is valid');
      if(config?.safeMode) await timeout(5000);
    }
    //@ts-ignore
    const VALID_SESSION = await waPage.evaluate(() => window.Store && window.Store.Msg ? true : false);
    if (VALID_SESSION) {
      spinner.succeed('Client is ready');
      const localStorage = JSON.parse(await waPage.evaluate(() => {
        return JSON.stringify(window.localStorage);
      }));
      const stdSessionJsonPath = (config?.sessionDataPath && config?.sessionDataPath.includes('.data.json')) ? path.join(path.resolve(process.cwd(),config?.sessionDataPath || '')) : path.join(path.resolve(process.cwd(),config?.sessionDataPath || ''), `${sessionId || 'session'}.data.json`);
      const altMainModulePath = require?.main?.path || process?.mainModule?.path;
      const altSessionJsonPath = !altMainModulePath ? null : (config?.sessionDataPath && config?.sessionDataPath.includes('.data.json')) ? path.join(path.resolve(altMainModulePath,config?.sessionDataPath || '')) : path.join(path.resolve(altMainModulePath,config?.sessionDataPath || ''), `${sessionId || 'session'}.data.json`);
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

      if(!config?.skipSessionSave) fs.writeFile(sessionjsonpath, sdB64, (err) => {
        if (err) { console.error(err); return; }
      });
      if (config?.logConsole) waPage.on('console', msg => console.log(msg));
      if (config?.logConsoleErrors) waPage.on('error', error => console.log(error));
      if (config?.restartOnCrash) waPage.on('error', async error => {
        console.error('Page Crashed! Restarting...', error);
        await kill(waPage);
        await create(config).then(config.restartOnCrash);
      });
      const pureWAPI = await checkWAPIHash();
      if(!pureWAPI) {
        config.skipBrokenMethodsCheck = true;
        // config.skipPatches = true;
      }
      debugInfo.NUM = await waPage.evaluate(`(window.localStorage['last-wid'] || '').replace('@c.us','').replace(/"/g,"").slice(-4)`);
      debugInfo.NUM_HASH = createHash('md5').update(await waPage.evaluate(`(window.localStorage['last-wid'] || '').replace('@c.us','').replace(/"/g,"")`), 'utf8').digest('hex')
      if(config?.hostNotificationLang){
        await waPage.evaluate(`window.hostlang="${config.hostNotificationLang}"`)
      }
      //patch issues with wapi.js
      if (!config?.skipPatches){
        await getAndInjectLivePatch(waPage,spinner, await patchPromise, config, debugInfo)
        debugInfo.OW_KEY = await waPage.evaluate(`window.o()`);
      }
      if (config?.skipBrokenMethodsCheck !== true) await integrityCheck(waPage, notifier, spinner, debugInfo);
      const LAUNCH_TIME_MS = Date.now() - START_TIME;
      debugInfo = {...debugInfo, LAUNCH_TIME_MS};
      spinner.emit(debugInfo, "DebugInfo");
      const metrics = await waPage.evaluate(`WAPI.launchMetrics()`);
      spinner.succeed(`Client loaded with ${metrics.contacts} contacts, ${metrics.chats} chats & ${metrics.messages} messages in ${LAUNCH_TIME_MS/1000}s`);
      if(config?.deleteSessionDataOnLogout || config?.killClientOnLogout) config.eventMode = true;
      const client = new Client(waPage, config, debugInfo);
      const { me } = await client.getMe();
      if (config?.licenseKey || me._serialized!==earlyWid) {
         await getAndInjectLicense(waPage, config, me, debugInfo, spinner, me._serialized!==earlyWid ? false : await licensePromise)
      }
      await injectInitPatch(waPage)
      spinner.succeed(`🚀 @OPEN-WA ready for account: ${me.user.slice(-4)}`);
      spinner.emit('SUCCESS');
      await client.loaded();
      spinner.remove();
      return client;
    }
    else {
      spinner.fail('The session is invalid. Retrying')
      await kill(waPage)
      return await create(config);
    }
  } catch (error) {
    spinner.emit(error.message);
    await kill(waPage);
    if(error.name === "TimeoutError" && config?.killProcessOnTimeout) {
      process.exit()
    } else {
      spinner.remove();
      throw error;
    }
  }
}
/**
 * @internal
 */
const kill = async (p) => {
  if (p) {
    const browser = await p?.browser();
    if(!browser) return;
    const pid = browser?.process() ? browser?.process().pid : null;
    if(!pid) return;
    if (!p?.isClosed()) await p?.close();
    if (browser) await browser?.close().catch(()=>{});
    if(pid) treekill(pid, 'SIGKILL')
  }
}

/**
 * @private
 */

export async function getPatch(config: ConfigObject, spinner ?: Spin, sessionInfo ?: SessionInfo) : Promise<{
  data: any,
  tag: string
}> {
  const ghUrl = `https://raw.githubusercontent.com/open-wa/wa-automate-nodejs/master/patches.json`
  const hasSpin = !!spinner;
  /**
   * Undo below comment when a githack alternative is found.
   */
  const patchesBaseUrl = config?.cachedPatch ?  ghUrl : pkg.patches
  const patchesUrl = patchesBaseUrl + `?wv=${sessionInfo.WA_VERSION}&wav=${sessionInfo.WA_AUTOMATE_VERSION}`
  if(!spinner) spinner = new Spin(config.sessionId, "FETCH_PATCH", config.disableSpins,true)
  spinner?.start(`Downloading ${config?.cachedPatch ? 'cached ': ''}patches from ${patchesBaseUrl}`, hasSpin ? undefined : 2)
  if(!axios) axios = await import('axios');
  const START = Date.now();
  const { data, headers } = await axios.get(patchesUrl).catch(()=>{
    spinner?.info('Downloading patches. Retrying.')
    return axios.get(`${ghUrl}?v=${Date.now()}`)
  });
  const END = Date.now();
  if(!headers['etag']) {
    spinner?.info('Generating patch hash');
    headers['etag'] = crypto.createHash('md5').update(typeof data === 'string' ? data : JSON.stringify(data)).digest("hex").slice(-5);
  }
  spinner?.succeed(`Downloaded patches in ${(END-START)/1000}s`)
  return {
    data,
    tag: `${(headers.etag || '').replace(/"/g,'').slice(-5)}`
  }
}

/**
 * @private
 * @param page 
 * @param spinner 
 */
export async function injectLivePatch(page: Page, patch : {
  data: any,
  tag: string
}, spinner ?: Spin) : Promise<void> {
  const {data, tag} = patch
  spinner?.info('Installing patches')
  await Promise.all(data.map(patch => page.evaluate(`${patch}`)))
  spinner?.succeed(`Patches Installed: ${tag}`)
}

/**
 * @private
 */
export async function getAndInjectLivePatch(page: Page, spinner ?: Spin, preloadedPatch ?: {
  data: any,
  tag: string
}, config ?: ConfigObject, sessionInfo ?: SessionInfo) : Promise<void> {
  let patch = preloadedPatch;
  if(!patch) patch = await getPatch(config, spinner, sessionInfo)
  await injectLivePatch(page, patch, spinner)
}

/**
 * @private
 */
export async function getLicense(config: ConfigObject, me : {
  _serialized: string
}, debugInfo: SessionInfo, spinner ?: Spin) : Promise<string | false> {
  if(!config?.licenseKey || !me?._serialized) return false;
  if(!axios) axios = await import('axios');
  const hasSpin = !!spinner;
  if(!spinner) spinner = new Spin(config.sessionId || "session", "FETCH_LICENSE", config.disableSpins,true)
  spinner?.start('Fetching License', hasSpin ? undefined : 2)
  try {
  const START = Date.now()
  const { data } = await axios.post(pkg.licenseCheckUrl, { key: config.licenseKey, number: me._serialized, ...debugInfo });
  const END = Date.now()
  spinner?.succeed(`Downloaded License in ${(END-START)/1000}s`)
  return data;
  } catch (error) {
    spinner?.fail(`License request failed: ${error.statusCode || error.code || error.message}`);
    return false;
  }
}

export async function getAndInjectLicense(page: Page, config: ConfigObject, me : {
  _serialized: string
}, debugInfo: SessionInfo, spinner ?: Spin, preloadedLicense ?: string | false): Promise<boolean> {
  if(!config?.licenseKey || !me?._serialized) return false;
  if(!axios) axios = await import('axios');
  let l_err;
  let data = preloadedLicense;
  spinner?.info('Checking License')
  try {
    if(!data) data = await getLicense(config, me, debugInfo, spinner)
  if (data) {
    const l_success = await page.evaluate(data => eval(data), data);
    if(!l_success) {
      l_err = await page.evaluate('window.launchError');
    } else {
      const keyType = await page.evaluate('window.KEYTYPE || false');
      spinner?.succeed(`License Valid${keyType?`: ${keyType}`:''}`);
      return true;
    }
  } else l_err = "The key is invalid"
  if(l_err) {
    spinner?.fail(`License issue${l_err ? `: ${l_err}` : ""}`);
  }
  return false;
  } catch (error) {
    spinner?.fail(`License request failed: ${error.statusCode || error.code || error.message}`);
    return false;
  }
}