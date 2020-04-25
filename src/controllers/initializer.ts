import { Whatsapp } from '../api/whatsapp';
import {ConfigObject} from '../api/model/index';
import * as path from 'path';
import { isAuthenticated, isInsideChat, retrieveQR } from './auth';
import { initWhatsapp, injectApi } from './browser';
import {Spin} from './events'
import axios from 'axios';
const updateNotifier = require('update-notifier');

var uniq = require('lodash.uniq');

let shouldLoop = true;
const fs = require('fs');
var pkg = require('../../package.json');
const timeout = ms => {
  return new Promise(resolve => setTimeout(resolve, ms, 'timeout'));
}
let qrTimeout;

/**
 * Should be called to initialize whatsapp client.
 * *Note* You can send all params as a single object with the new [ConfigObject](https://open-wa.github.io/wa-automate-nodejs/interfaces/configobject.html) that includes both [sessionId](https://open-wa.github.io/wa-automate-nodejs/interfaces/configobject.html#sessionId) and [customUseragent](ttps://open-wa.github.io/wa-automate-nodejs/interfaces/configobject.html#customUseragent).
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
 * @param sessionId [string | ConfigObject ]Custom id for the session, every phone should have it's own sessionId. THIS CAN BE THE CONFIG OBJECT INSTEAD
 * @param config The extended custom configuration
 * @param customUserAgent A custom user agent to set on the browser page.
 */
//export async function create(sessionId?: string, config?:ConfigObject, customUserAgent?:string) {
  //@ts-ignore
  export async function create(sessionId?: any | ConfigObject, config?:ConfigObject, customUserAgent?:string) : Promise<Whatsapp> {
    let waPage = undefined;
    const notifier = await updateNotifier({
      pkg,
      updateCheckInterval: 0
    });
    notifier.notify();
    console.log("%c         \u2588\u2588\u2588\u2588\u2588\u2588\u2557  \u2588\u2588\u2588\u2588\u2588\u2588\u2557 \u2588\u2588\u2588\u2588\u2588\u2588\u2557 \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2588\u2557   \u2588\u2588\u2557      \u2588\u2588\u2557    \u2588\u2588\u2557 \u2588\u2588\u2588\u2588\u2588\u2557         \r\n        \u2588\u2588\u2554\u2550\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2554\u2550\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2554\u2550\u2550\u2550\u2550\u255D\u2588\u2588\u2588\u2588\u2557  \u2588\u2588\u2551      \u2588\u2588\u2551    \u2588\u2588\u2551\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557        \r\n        \u2588\u2588\u2551\u2588\u2588\u2557\u2588\u2588\u2551\u2588\u2588\u2551   \u2588\u2588\u2551\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255D\u2588\u2588\u2588\u2588\u2588\u2557  \u2588\u2588\u2554\u2588\u2588\u2557 \u2588\u2588\u2551\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2551 \u2588\u2557 \u2588\u2588\u2551\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2551        \r\n        \u2588\u2588\u2551\u2588\u2588\u2551\u2588\u2588\u2551\u2588\u2588\u2551   \u2588\u2588\u2551\u2588\u2588\u2554\u2550\u2550\u2550\u255D \u2588\u2588\u2554\u2550\u2550\u255D  \u2588\u2588\u2551\u255A\u2588\u2588\u2557\u2588\u2588\u2551\u255A\u2550\u2550\u2550\u2550\u255D\u2588\u2588\u2551\u2588\u2588\u2588\u2557\u2588\u2588\u2551\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2551        \r\n        \u255A\u2588\u2551\u2588\u2588\u2588\u2588\u2554\u255D\u255A\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255D\u2588\u2588\u2551     \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2551 \u255A\u2588\u2588\u2588\u2588\u2551      \u255A\u2588\u2588\u2588\u2554\u2588\u2588\u2588\u2554\u255D\u2588\u2588\u2551  \u2588\u2588\u2551        \r\n         \u255A\u255D\u255A\u2550\u2550\u2550\u255D  \u255A\u2550\u2550\u2550\u2550\u2550\u255D \u255A\u2550\u255D     \u255A\u2550\u2550\u2550\u2550\u2550\u2550\u255D\u255A\u2550\u255D  \u255A\u2550\u2550\u2550\u255D       \u255A\u2550\u2550\u255D\u255A\u2550\u2550\u255D \u255A\u2550\u255D  \u255A\u2550\u255D        \r\n                                                                                    \r\n        \u2588\u2588\u2557    \u2588\u2588\u2557\u2588\u2588\u2557  \u2588\u2588\u2557 \u2588\u2588\u2588\u2588\u2588\u2557 \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557 \u2588\u2588\u2588\u2588\u2588\u2557 \u2588\u2588\u2588\u2588\u2588\u2588\u2557 \u2588\u2588\u2588\u2588\u2588\u2588\u2557          \r\n        \u2588\u2588\u2551    \u2588\u2588\u2551\u2588\u2588\u2551  \u2588\u2588\u2551\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\u255A\u2550\u2550\u2588\u2588\u2554\u2550\u2550\u255D\u2588\u2588\u2554\u2550\u2550\u2550\u2550\u255D\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557         \r\n        \u2588\u2588\u2551 \u2588\u2557 \u2588\u2588\u2551\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2551\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2551   \u2588\u2588\u2551   \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2551\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255D\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255D         \r\n        \u2588\u2588\u2551\u2588\u2588\u2588\u2557\u2588\u2588\u2551\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2551\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2551   \u2588\u2588\u2551   \u255A\u2550\u2550\u2550\u2550\u2588\u2588\u2551\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2551\u2588\u2588\u2554\u2550\u2550\u2550\u255D \u2588\u2588\u2554\u2550\u2550\u2550\u255D          \r\n        \u255A\u2588\u2588\u2588\u2554\u2588\u2588\u2588\u2554\u255D\u2588\u2588\u2551  \u2588\u2588\u2551\u2588\u2588\u2551  \u2588\u2588\u2551   \u2588\u2588\u2551   \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2551\u2588\u2588\u2551  \u2588\u2588\u2551\u2588\u2588\u2551     \u2588\u2588\u2551              \r\n         \u255A\u2550\u2550\u255D\u255A\u2550\u2550\u255D \u255A\u2550\u255D  \u255A\u2550\u255D\u255A\u2550\u255D  \u255A\u2550\u255D   \u255A\u2550\u255D   \u255A\u2550\u2550\u2550\u2550\u2550\u2550\u255D\u255A\u2550\u255D  \u255A\u2550\u255D\u255A\u2550\u255D     \u255A\u2550\u255D              \r\n                                                                                    \r\n     \u2588\u2588\u2588\u2588\u2588\u2557 \u2588\u2588\u2557   \u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557 \u2588\u2588\u2588\u2588\u2588\u2588\u2557 \u2588\u2588\u2588\u2557   \u2588\u2588\u2588\u2557 \u2588\u2588\u2588\u2588\u2588\u2557 \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557 \u2588\u2588\u2588\u2588\u2588\u2588\u2557 \u2588\u2588\u2588\u2588\u2588\u2588\u2557 \r\n    \u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2551   \u2588\u2588\u2551\u255A\u2550\u2550\u2588\u2588\u2554\u2550\u2550\u255D\u2588\u2588\u2554\u2550\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2557 \u2588\u2588\u2588\u2588\u2551\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\u255A\u2550\u2550\u2588\u2588\u2554\u2550\u2550\u255D\u2588\u2588\u2554\u2550\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\r\n    \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2551\u2588\u2588\u2551   \u2588\u2588\u2551   \u2588\u2588\u2551   \u2588\u2588\u2551   \u2588\u2588\u2551\u2588\u2588\u2554\u2588\u2588\u2588\u2588\u2554\u2588\u2588\u2551\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2551   \u2588\u2588\u2551   \u2588\u2588\u2551   \u2588\u2588\u2551\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255D\r\n    \u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2551\u2588\u2588\u2551   \u2588\u2588\u2551   \u2588\u2588\u2551   \u2588\u2588\u2551   \u2588\u2588\u2551\u2588\u2588\u2551\u255A\u2588\u2588\u2554\u255D\u2588\u2588\u2551\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2551   \u2588\u2588\u2551   \u2588\u2588\u2551   \u2588\u2588\u2551\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\r\n    \u2588\u2588\u2551  \u2588\u2588\u2551\u255A\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255D   \u2588\u2588\u2551   \u255A\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255D\u2588\u2588\u2551 \u255A\u2550\u255D \u2588\u2588\u2551\u2588\u2588\u2551  \u2588\u2588\u2551   \u2588\u2588\u2551   \u255A\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255D\u2588\u2588\u2551  \u2588\u2588\u2551\r\n    \u255A\u2550\u255D  \u255A\u2550\u255D \u255A\u2550\u2550\u2550\u2550\u2550\u255D    \u255A\u2550\u255D    \u255A\u2550\u2550\u2550\u2550\u2550\u255D \u255A\u2550\u255D     \u255A\u2550\u255D\u255A\u2550\u255D  \u255A\u2550\u255D   \u255A\u2550\u255D    \u255A\u2550\u2550\u2550\u2550\u2550\u255D \u255A\u2550\u255D  \u255A\u2550\u255D\r\n                                                                                    ", 'background: #000; color: #F0F; padding: 6px;');
  
  if(typeof sessionId === 'object' && (sessionId as ConfigObject)) {
    config = sessionId;
    sessionId = config.sessionId;
    customUserAgent = config.customUserAgent;
    }
    if (!sessionId) sessionId = 'session';
  const spinner = new Spin(sessionId,'STARTUP');
  try{
    qrTimeout = undefined;
    shouldLoop = true;
  spinner.start('Initializing whatsapp');
  waPage = await initWhatsapp(sessionId, config, customUserAgent);
  spinner.succeed();
  const throwOnError=config&&config.throwErrorOnTosBlock==true;

  const PAGE_UA =  await waPage.evaluate('navigator.userAgent');
  const BROWSER_VERSION = await waPage.browser().version();

  const WA_AUTOMATE_VERSION = `${pkg.version}${notifier.update ? ` UPDATE AVAILABLE: ${notifier.update.latest}` : ''}`;
  //@ts-ignore
  const WA_VERSION = await waPage.evaluate(()=>window.Debug?window.Debug.VERSION:'I think you have been TOS_BLOCKed')
  //@ts-ignore
  const canInjectEarly = await waPage.evaluate(() => {return (typeof webpackJsonp !== "undefined")});
  const debugInfo = {
    WA_VERSION,
    PAGE_UA,
    WA_AUTOMATE_VERSION,
    BROWSER_VERSION,
  };
  spinner.emit(debugInfo,"DebugInfo");
  console.table(debugInfo);

  if(canInjectEarly) {
    spinner.start('Injecting api');
    waPage = await injectApi(waPage);
    spinner.start('WAPI injected');
  } else {
    if(throwOnError) throw Error('TOSBLOCK');
    console.log('Possilby TOS_BLOCKed')
  }

  spinner.start('Authenticating');
  let authenticated = await isAuthenticated(waPage);
  let autoRefresh = config ? config.autoRefresh : false;
 
  const qrLoop = async () => {
    if(!shouldLoop) return;
    console.log(' ')
    await retrieveQR(waPage,sessionId,autoRefresh,throwOnError);
    console.log(' ')
    qrTimeout = timeout((config?(config.qrRefreshS || 10):10)*1000);
    await qrTimeout;
    if(autoRefresh)qrLoop();
  };

  if (authenticated) {
    spinner.succeed('Authenticated');
  } else {
    spinner.info('Authenticate to continue');
    const qrSpin = new Spin(sessionId,'QR');
    qrSpin.start('Loading QR');
    qrSpin.succeed();
    qrLoop();
    const race = [];
    race.push(isInsideChat(waPage).toPromise());
    if(config&&config.killTimer){
      race.push(timeout(config.killTimer*1000))
    }
    const result = await Promise.race(race);
    if(result=='timeout') {
      console.log('Session timed out. Shutting down')
      await kill(waPage);
      throw new Error('QR Timeout');
      
    }
    shouldLoop = false;
    clearTimeout(qrTimeout);
    spinner.succeed();
  }
  const pre = canInjectEarly? 'Rei':'I';
  spinner.start(`${pre}njecting api`);
  waPage = await injectApi(waPage);
  spinner.succeed(`WAPI ${pre}njected`);

  if(canInjectEarly) {
    //check if page is valid after 5 seconds
    spinner.start('Checking if session is valid');
    await timeout(5000);
  }

  //@ts-ignore
  const VALID_SESSION = await waPage.evaluate(()=>window.Store&&window.Store.Msg?true:false);
  if(VALID_SESSION)  {
    spinner.succeed('Whatsapp is ready');
    const localStorage = JSON.parse(await waPage.evaluate(() => {
      return JSON.stringify(window.localStorage);
  }));
  const sessionjsonpath = path.join(process.cwd(), `${sessionId || 'session'}.data.json`);
  const sessionData = {
    WABrowserId: localStorage.WABrowserId,
    WASecretBundle: localStorage.WASecretBundle,
    WAToken1: localStorage.WAToken1,
    WAToken2: localStorage.WAToken2
};

spinner.emit(sessionData,"sessionData");

  fs.writeFile(sessionjsonpath, JSON.stringify(sessionData), (err) => {
  if (err) {  console.error(err);  return; };
});
if(config?.restartOnCrash) waPage.on('error', async error => {
  console.error('Page Crashed! Restarting...', error);
  await kill(waPage);
  await create(sessionId,config,customUserAgent).then(config.restartOnCrash);
});
/**
 * now test to see if all features are functioning as expected
 * 1. Open wapi.js as text file
 * 2. Regex match all relevant functions
 * 3. remove brackets
 * 4. go through each and test if exists.
*/
const BROKEN_METHODS = config?.skipBrokenMethodsCheck ? [] : await waPage.evaluate((checkList)=>{
  return checkList.filter(check=> {
    try{
      return eval(check)?false:true;
    } catch(error) {
      return true;
    }
  })
},uniq(fs.readFileSync(path.join(__dirname, '../lib', 'wapi.js'), 'utf8').match(/(Store[.\w]*)\(/g).map((x:string)=>x.replace("(",""))));
//@ts-ignores
const LANG_CHECK = await waPage.evaluate(()=>{if(window.l10n.localeStrings['en'])return window.l10n.localeStrings['en'][0].findIndex((x)=>x.toLowerCase()=='use here')==260;else return false;})
if(BROKEN_METHODS.length>0) console.log("!!!!!BROKEN METHODS DETECTED!!!!\n\n\nPlease make a new issue in:\n\n https://github.com/open-wa/wa-automate-nodejs/issues \n\nwith the following title:\n\nBROKEN METHODS: ",WA_VERSION,"\n\nAdd this to the body of the issue:\n\n",BROKEN_METHODS,"\n\n\n!!!!!BROKEN METHODS DETECTED!!!!")
if(!LANG_CHECK) console.log('Some language based features (e.g forceRefocus) are broken. Please report this in Github.');
const client = new Whatsapp(waPage);
if(config?.licenseKey) {
  spinner.start('Checking License')
  const {me} = await client.getMe();
  const {data} = await axios.post(pkg.licenseCheckUrl, {key: config.licenseKey,number: me.user,...debugInfo});
  if(data) {
    await waPage.evaluate(data => eval(data),data);
    spinner.succeed('License Valid');
  } else spinner.fail('Invalid license key')
}
    return client;
  }
  else {
    spinner.fail('The session is invalid. Retrying')
    await kill(waPage)
    return await create(sessionId,config,customUserAgent);
  }
} catch(error){
  spinner.emit(error.message);
	await kill(waPage);
	throw error;
}
}

const kill = async (p) => {
  shouldLoop = false;
  if(qrTimeout) clearTimeout(qrTimeout);
  if(p){
    await p.close();
    if(p.browser())await p.browser().close();
  }
}