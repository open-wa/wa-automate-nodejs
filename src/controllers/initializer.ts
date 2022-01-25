import * as fs from 'fs';
import boxen from 'boxen';
import osName from 'os-name';
import { default as updateNotifier } from 'update-notifier';
import { Client } from '../api/Client';
import { ConfigObject, SessionExpiredError } from '../api/model/index';
import * as path from 'path';
import { phoneIsOutOfReach, isAuthenticated, qrManager, waitForRipeSession } from './auth';
import { deleteSessionData, initPage, injectApi, kill } from './browser';
import { Spin } from './events'
import { integrityCheck, checkWAPIHash } from './launch_checks';
import CFonts from 'cfonts';
import { generateGHIssueLink, getConfigFromProcessEnv } from '../utils/tools';
import { SessionInfo } from '../api/model/sessionInfo';
import { Page } from 'puppeteer';
import { createHash } from 'crypto';
import { readJsonSync } from 'fs-extra'
import { upload } from 'pico-s3';
import { injectInitPatch } from './init_patch'
import { earlyInjectionCheck, getLicense, getPatch, getAndInjectLivePatch, getAndInjectLicense } from './patch_manager';
import { log, setupLogging } from '../logging/logging';

export const pkg = readJsonSync(path.join(__dirname,'../../package.json')),
configWithCases = readJsonSync(path.join(__dirname,'../../bin/config-schema.json')),
timeout = (ms : number) => {
  return new Promise(resolve => setTimeout(resolve, ms, 'timeout'));
}

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
  if(config.logging) {
    if(Array.isArray(config?.logging))
    config.logging = setupLogging(config?.logging, `owa-${config?.sessionId || 'session'}`)
  }
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
      log.info('UPDATING @OPEN-WA')
      const crossSpawn = await import('cross-spawn')
      
      const result = crossSpawn.sync('npm', ['i', '@open-wa/wa-automate'], { stdio: 'inherit' });
      if(!result.stderr) {
          console.log('UPDATED SUCCESSFULLY')
          log.info('UPDATED SUCCESSFULLY')
      }
      console.log('RESTARTING PROCESS')
      log.info('RESTARTING PROCESS')
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
    log.info(`You can also authenticate the session at: ${popupaddr}`)
  }
  if (!sessionId) sessionId = 'session';
  const spinner = new Spin(sessionId, 'STARTUP', config?.disableSpins);
  qrManager.setConfig(config);
  try {
    if(typeof config === 'string') console.error("AS OF VERSION 3+ YOU CAN NO LONGER SET THE SESSION ID AS THE FIRST PARAMETER OF CREATE. CREATE CAN ONLY TAKE A CONFIG OBJECT. IF YOU STILL HAVE CONFIGS AS A SECOND PARAMETER, THEY WILL HAVE NO EFFECT! PLEASE SEE DOCS.")
    spinner.start('Starting');
    spinner.succeed(`Version: ${pkg.version}`);
    spinner.info(`Initializing WA`);
    /**
     * Check if the IGNORE folder exists, therefore, assume that the session is MD.
     */
    const mdDir = config["userDataDir"] ||  `${config?.inDocker ? '/sessions' : config?.sessionDataPath || '.' }/_IGNORE_${config?.sessionId || 'session'}`
    if(process.env.AUTO_MD && fs.existsSync(mdDir) && !config?.multiDevice) {
      spinner.info(`Multi-Device directory detected. multiDevice set to true.`);
      config.multiDevice = true;
    }
    if(config?.multiDevice && config?.chromiumArgs) spinner.info(`Using custom chromium args with multi device will cause issues! Please remove them: ${config?.chromiumArgs}`);
    if(config?.multiDevice && !config?.useChrome) spinner.info(`It is recommended to set useChrome: true or use the --use-chrome flag if you are experiencing issues with Multi device support`);
    waPage = await initPage(sessionId, config, customUserAgent, spinner);
    spinner.succeed('Page loaded');
    const browserLaunchedTs = performance.now();
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
    const canInjectEarly = await earlyInjectionCheck(waPage as Page)
    const attemptingReauth = await waPage.evaluate(`!!(localStorage['WAToken2'] || localStorage['last-wid-md'])`)
    let debugInfo : SessionInfo = {
      WA_VERSION,
      PAGE_UA,
      WA_AUTOMATE_VERSION,
      BROWSER_VERSION,
      OS,
      START_TS
    };
    if(config?.logDebugInfoAsObject || config?.disableSpins) spinner.succeed(`Debug info: ${JSON.stringify(debugInfo, null, 2)}`);
     else {
      console.table(debugInfo);
      log.info('Debug info:', debugInfo);
     }
     debugInfo.LATEST_VERSION = !(notifier?.update && (notifier?.update.latest !== pkg.version))
     debugInfo.CLI = process.env.OWA_CLI && true || false
     // eslint-disable-next-line @typescript-eslint/no-unused-vars
     spinner.succeed('Use this easy pre-filled link to report an issue: ' + generateGHIssueLink(config,debugInfo));
     spinner.info(`Time to injection: ${(performance.now() - browserLaunchedTs).toFixed(0)     }ms`);
    if (canInjectEarly) {
      if(attemptingReauth) await waPage.evaluate(`window.Store = {"Msg": true}`)
      spinner.start('Injecting api');
      waPage = await injectApi(waPage, spinner);
      spinner.start('WAPI injected');
    } else {
      spinner.remove();
      if (throwOnError) throw Error('TOSBLOCK');
    }

    spinner.start('Authenticating');
    const authRace = [];
    authRace.push(isAuthenticated(waPage).catch(()=>{}))
    if (config?.authTimeout!==0) {
      authRace.push(timeout((config.authTimeout || config.multiDevice ? 120 : 60) * 1000))
    }

    const authenticated = await Promise.race(authRace);
    if(authenticated==='NUKE' && !config?.ignoreNuke) {
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
      race.push(qrManager.smartQr(waPage, config, spinner))
      if (config?.qrTimeout!==0) {
        let to = (config?.qrTimeout || 60) * 1000
        if(config?.multiDevice) to = to * 2
        race.push(timeout(to))
      }
      const result = await Promise.race(race);
      if(result === "MULTI_DEVICE_DETECTED" && !config?.multiDevice) {
        await kill(waPage)
        return create({
          ...config,
          multiDevice: true
        })
      }
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
    if(attemptingReauth) {
      await waPage.evaluate("window.Store = undefined")
      if(config?.waitForRipeSession) {
        spinner.start("Waiting for ripe session...")
        if(await waitForRipeSession(waPage)) spinner.succeed("Session ready for injection");
        else spinner.fail("You may experience issues in headless mode. Continuing...")
      }
    }
    const pre = canInjectEarly ? 'Rei' : 'I';
    spinner.start(`${pre}njecting api`);
    waPage = await injectApi(waPage, spinner);
    spinner.succeed(`WAPI ${pre}njected`);

    if (canInjectEarly) {
      //check if page is valid after 5 seconds
      spinner.start('Checking if session is valid');
      if(config?.safeMode) await timeout(5000);
    }
    //@ts-ignore
    const VALID_SESSION = await waPage.evaluate(() => window.Store && window.Store.Msg ? true : false);
    if (VALID_SESSION) {
      /**
       * Session is valid, attempt to preload patches
       */
      const patchPromise = getPatch(config, spinner, debugInfo)
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
      if(config?.sessionDataBucketAuth) {
        try {
          spinner?.info('Uploading new session data to cloud storage..')
          await upload({
            directory: '_sessionData',
            ...JSON.parse(Buffer.from(config.sessionDataBucketAuth, 'base64').toString('ascii')),
            filename: `${config.sessionId || 'session'}.data.json`,
            file: `data:text/plain;base64,${Buffer.from(sdB64).toString('base64')}`
          })
          spinner?.succeed('Successfully uploaded session data file to cloud storage!')
        } catch (error) {
          spinner?.fail(`Something went wrong while uploading new session data to cloud storage bucket. Continuing...`)
        }
      }
      /**
       * Set page-level logging
       */
       waPage.on('console', msg => {
        if (config?.logConsole) console.log(msg)
        log.info('Page Console:', msg.text())
       });
       waPage.on('error', error => {
        if (config?.logConsoleErrors) console.error(error)
        log.error('Page Console Error:', error.text())
       });
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
      //@ts-ignore
      const metrics = await waPage.evaluate(({config}) => WAPI.launchMetrics(config), {config});
      const purgedMessage = metrics?.purged ? Object.entries(metrics.purged).filter(([,e])=>e>0).map(([k,e])=>`${e} ${k}`).join(" and ") : "";
      if(metrics.isMd && !config?.multiDevice) spinner.info("!!!Please set multiDevice: true in the config or use the --mutli-Device flag!!!")
      spinner.succeed(`Client loaded for ${metrics.isBiz ? "business" : "normal"} account ${metrics.isMd && "[MD] " || ''}with ${metrics.contacts} contacts, ${metrics.chats} chats & ${metrics.messages} messages ${purgedMessage ? `+ purged ${purgedMessage} ` : ``}in ${LAUNCH_TIME_MS/1000}s`);
      if(config?.deleteSessionDataOnLogout || config?.killClientOnLogout) config.eventMode = true;
      const client = new Client(waPage, config, debugInfo);
      const { me } = await client.getMe();
      if (config?.licenseKey || me._serialized!==earlyWid) {
         await getAndInjectLicense(waPage, config, me, debugInfo, spinner, me._serialized!==earlyWid ? false : await licensePromise)
      }
      spinner.info("Finalizing web session...")
      await injectInitPatch(waPage)
      spinner.info("Finalizing client...")
      await client.loaded();
      if(config.ensureHeadfulIntegrity && !attemptingReauth) {
        spinner.info("QR scanned for the first time. Refreshing...")
        await client.refresh();
        spinner.info("Session refreshed.")
      }
      spinner.succeed(`🚀 @OPEN-WA ready for account: ${me.user.slice(-4)}`);
      spinner.emit('SUCCESS');
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
    if(error.name === "ProtocolError" && error.message?.includes("Target closed")) {
      spinner.fail(error.message);
      process.exit()
    }
    if(error.name === "TimeoutError" && config?.multiDevice){
      spinner.fail(`Please delete the ${config?.userDataDir} folder and any related data.json files and try again. It is highly suggested to set useChrome: true also.`)
    }
    if(error.name === "TimeoutError" && config?.killProcessOnTimeout) {
      process.exit()
    } else {
      spinner.remove();
      throw error;
    }
  }
}
