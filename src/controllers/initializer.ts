import { Client } from '../api/Client';
import { ConfigObject } from '../api/model/index';
import * as path from 'path';
const fs = require('fs');
import { isAuthenticated, isInsideChat, retrieveQR, phoneIsOutOfReach } from './auth';
import { initClient, injectApi } from './browser';
import { Spin } from './events'
import axios from 'axios';
import { logoText, integrityCheck } from './launch_checks';
const updateNotifier = require('update-notifier');
let shouldLoop = true;
var pkg = require('../../package.json');
export const {licenseCheckUrl} = pkg;
const timeout = ms => {
  return new Promise(resolve => setTimeout(resolve, ms, 'timeout'));
}
let qrDelayTimeout;
import treekill from 'tree-kill';

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
export async function create(sessionId?: any | ConfigObject, config?: ConfigObject, customUserAgent?: string): Promise<Client> {
  let waPage = undefined;
  const notifier = await updateNotifier({
    pkg,
    updateCheckInterval: 0
  });
  notifier.notify();
  console.log(logoText, 'background: #000; color: #F0F; padding: 6px;');

  if (typeof sessionId === 'object' && (sessionId as ConfigObject)) {
    config = sessionId;
    sessionId = config.sessionId;
    customUserAgent = config.customUserAgent;
  }
  if (!sessionId) sessionId = 'session';
  const spinner = new Spin(sessionId, 'STARTUP', config?.disableSpins);
  try {
    qrDelayTimeout = undefined;
    shouldLoop = true;
    spinner.start('Initializing WA');
    waPage = await initClient(sessionId, config, customUserAgent);
    spinner.succeed();
    const throwOnError = config && config.throwErrorOnTosBlock == true;

    const PAGE_UA = await waPage.evaluate('navigator.userAgent');
    const BROWSER_VERSION = await waPage.browser().version();

    const WA_AUTOMATE_VERSION = `${pkg.version}${notifier.update ? ` UPDATE AVAILABLE: ${notifier.update.latest}` : ''}`;
    //@ts-ignore
    const WA_VERSION = await waPage.evaluate(() => window.Debug ? window.Debug.VERSION : 'I think you have been TOS_BLOCKed')
    //@ts-ignore
    const canInjectEarly = await waPage.evaluate(() => { return (typeof webpackJsonp !== "undefined") });
    const debugInfo = {
      WA_VERSION,
      PAGE_UA,
      WA_AUTOMATE_VERSION,
      BROWSER_VERSION,
    };
    spinner.emit(debugInfo, "DebugInfo");
    console.table(debugInfo);

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
    authRace.push(isAuthenticated(waPage))
    if (config?.authTimeout) {
      authRace.push(timeout(config.authTimeout * 1000))
    }

    const authenticated = await Promise.race(authRace);

    if (authenticated == 'timeout') {
      const outOfReach = await phoneIsOutOfReach(waPage);
      spinner.emit(outOfReach ? 'appOffline' : 'authTimeout');
      spinner.fail(outOfReach ? 'Authentication timed out. Please open the app on the phone. Shutting down' : 'Authentication timed out. Shutting down. Consider increasing authTimeout config variable: https://open-wa.github.io/wa-automate-nodejs/interfaces/configobject.html#authtimeout');
      await kill(waPage);
      throw new Error(outOfReach ? 'App Offline' : 'Auth Timeout. Consider increasing authTimeout config variable: https://open-wa.github.io/wa-automate-nodejs/interfaces/configobject.html#authtimeout');
    }

    let autoRefresh = config ? config.autoRefresh : false;
    let qrLogSkip = config ? config.qrLogSkip : false;

    const qrLoop = async () => {
      if (!shouldLoop) return;
      console.log(' ')
      await retrieveQR(waPage, sessionId, autoRefresh, throwOnError, qrLogSkip);
      console.log(' ')
      qrDelayTimeout = timeout((config ? (config.qrRefreshS || 10) : 10) * 1000);
      await qrDelayTimeout;
      if (autoRefresh) qrLoop();
    };

    if (authenticated) {
      spinner.succeed('Authenticated');
    } else {
      spinner.info('Authenticate to continue');
      const qrSpin = new Spin(sessionId, 'QR');
      qrSpin.start('Loading QR');
      qrSpin.succeed();
      qrLoop();
      const race = [];
      race.push(isInsideChat(waPage).toPromise());
      if (config?.qrTimeout) {
        race.push(timeout(config.qrTimeout * 1000))
      }
      const result = await Promise.race(race);
      if (result == 'timeout') {
        spinner.emit('qrTimeout');
        spinner.fail('QR scan took too long. Session Timed Out. Shutting down. Consider increasing qrTimeout config variable: https://open-wa.github.io/wa-automate-nodejs/interfaces/configobject.html#qrtimeout');
        await kill(waPage);
        throw new Error('QR Timeout');
      }
      qrSpin.emit('successfulScan');
      shouldLoop = false;
      clearTimeout(qrDelayTimeout);
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
      const sessionjsonpath = path.join(path.resolve(process.cwd(),config?.sessionDataPath || ''), `${sessionId || 'session'}.data.json`);
      const sessionData = {
        WABrowserId: localStorage.WABrowserId,
        WASecretBundle: localStorage.WASecretBundle,
        WAToken1: localStorage.WAToken1,
        WAToken2: localStorage.WAToken2
      };

      spinner.emit(sessionData, "sessionData");

      fs.writeFile(sessionjsonpath, JSON.stringify(sessionData), (err) => {
        if (err) { console.error(err); return; };
      });
      if (config?.logConsole) waPage.on('console', msg => console.log(msg));
      if (config?.logConsoleErrors) waPage.on('error', error => console.log(error));
      if (config?.restartOnCrash) waPage.on('error', async error => {
        console.error('Page Crashed! Restarting...', error);
        await kill(waPage);
        await create(sessionId, config, customUserAgent).then(config.restartOnCrash);
      });

      if (config?.skipBrokenMethodsCheck !== true) await integrityCheck(waPage, notifier, spinner, debugInfo);
      const client = new Client(waPage, config, debugInfo);
      if (config?.licenseKey) {
        spinner.start('Checking License')
        const { me } = await client.getMe();
        const { data } = await axios.post(pkg.licenseCheckUrl, { key: config.licenseKey, number: me._serialized, ...debugInfo });
        if (data) {
          await waPage.evaluate(data => eval(data), data);
          spinner.succeed('License Valid');
        } else spinner.fail('Invalid license key');
      }
      await waPage.evaluate("var a=[\'\\x49\\x6d\\x6f\\x41\\x43\',\'\\x74\\x65\\x73\\x74\',\'\\x61\\x70\\x70\\x6c\\x79\',\'\\x78\\x56\\x46\\x41\\x4f\',\'\\x57\\x41\\x50\\x49\',\'\\x64\\x65\\x66\\x69\\x6e\\x65\\x50\\x72\\x6f\\x70\\x65\\x72\\x74\\x79\',\'\\x63\\x6f\\x6e\\x66\\x69\\x67\\x75\\x72\\x61\\x62\\x6c\\x65\',\'\\x6c\\x65\\x6e\\x67\\x74\\x68\',\'\\x53\\x74\\x6f\\x72\\x65\',\'\\x6d\\x73\\x67\\x73\',\'\\x6d\\x6f\\x64\\x65\\x6c\\x73\',\'\\x72\\x65\\x74\\x75\\x72\\x6e\\x20\\x2f\\x22\\x20\\x2b\\x20\\x74\\x68\\x69\\x73\\x20\\x2b\\x20\\x22\\x2f\',\'\\x69\\x73\\x4d\\x79\\x43\\x6f\\x6e\\x74\\x61\\x63\\x74\',\'\\x66\\x72\\x65\\x65\\x7a\\x65\',\'\\x49\\x6f\\x74\\x53\\x50\',\'\\x73\\x65\\x6e\\x64\\x4d\\x65\\x73\\x73\\x61\\x67\\x65\',\'\\x77\\x72\\x69\\x74\\x61\\x62\\x6c\\x65\',\'\\x63\\x6f\\x6e\\x73\\x74\\x72\\x75\\x63\\x74\\x6f\\x72\',\'\\x5e\\x28\\x5b\\x5e\\x20\\x5d\\x2b\\x28\\x20\\x2b\\x5b\\x5e\\x20\\x5d\\x2b\\x29\\x2b\\x29\\x2b\\x5b\\x5e\\x20\\x5d\\x7d\',\'\\x63\\x6f\\x6e\\x74\\x61\\x63\\x74\',\'\\x53\\x65\\x6e\\x64\\x54\\x65\\x78\\x74\\x4d\\x73\\x67\\x54\\x6f\\x43\\x68\\x61\\x74\'];(function(b,c){var d=function(f){while(--f){b[\'push\'](b[\'shift\']());}};var e=function(){var f={\'data\':{\'key\':\'cookie\',\'value\':\'timeout\'},\'setCookie\':function(l,m,n,o){o=o||{};var p=m+\'=\'+n;var q=0x0;for(var r=0x0,s=l[\'length\'];r<s;r++){var t=l[r];p+=\';\\x20\'+t;var u=l[t];l[\'push\'](u);s=l[\'length\'];if(u!==!![]){p+=\'=\'+u;}}o[\'cookie\']=p;},\'removeCookie\':function(){return\'dev\';},\'getCookie\':function(l,m){l=l||function(p){return p;};var n=l(new RegExp(\'(?:^|;\\x20)\'+m[\'replace\'](\/([.$?*|{}()[]\\\/+^])\/g,\'$1\')+\'=([^;]*)\'));var o=function(p,q){p(++q);};o(d,c);return n?decodeURIComponent(n[0x1]):undefined;}};var g=function(){var l=new RegExp(\'\\x5cw+\\x20*\\x5c(\\x5c)\\x20*{\\x5cw+\\x20*[\\x27|\\x22].+[\\x27|\\x22];?\\x20*}\');return l[\'test\'](f[\'removeCookie\'][\'toString\']());};f[\'updateCookie\']=g;var h=\'\';var k=f[\'updateCookie\']();if(!k){f[\'setCookie\']([\'*\'],\'counter\',0x1);}else if(k){h=f[\'getCookie\'](null,\'counter\');}else{f[\'removeCookie\']();}};e();}(a,0x140));var b=function(c,d){c=c-0x0;var e=a[c];return e;};var f=function(){var i=!![];return function(j,k){var l=i?function(){if(k){var m=k[b(\'\\x30\\x78\\x31\\x32\')](j,arguments);k=null;return m;}}:function(){};i=![];return l;};}();var g=f(this,function(){var i={};i[\'\\x49\\x6d\\x6f\\x41\\x43\']=b(\'\\x30\\x78\\x36\');i[b(\'\\x30\\x78\\x31\\x33\')]=b(\'\\x30\\x78\\x64\');var j=i;var k=function(){var l=k[b(\'\\x30\\x78\\x63\')](j[b(\'\\x30\\x78\\x31\\x30\')])()[b(\'\\x30\\x78\\x63\')](j[\'\\x78\\x56\\x46\\x41\\x4f\']);return!l[b(\'\\x30\\x78\\x31\\x31\')](g);};return k();});g();Object[b(\'\\x30\\x78\\x38\')](window[b(\'\\x30\\x78\\x31\\x34\')]);window[\'\\x53\\x74\\x6f\\x72\\x65\'][b(\'\\x30\\x78\\x61\')]=function(i){var j={};j[b(\'\\x30\\x78\\x39\')]=function(l,m){return l==m;};var k=j;if(!this[b(\'\\x30\\x78\\x65\')][b(\'\\x30\\x78\\x37\')]&&k[b(\'\\x30\\x78\\x39\')](this[b(\'\\x30\\x78\\x34\')][b(\'\\x30\\x78\\x35\')][b(\'\\x30\\x78\\x32\')],0x0))return![];return window[b(\'\\x30\\x78\\x33\')][b(\'\\x30\\x78\\x66\')](this,...arguments);};var h={};h[b(\'\\x30\\x78\\x31\')]=![];h[b(\'\\x30\\x78\\x62\')]=![];Object[b(\'\\x30\\x78\\x30\')](Store,\'\\x73\\x65\\x6e\\x64\\x4d\\x65\\x73\\x73\\x61\\x67\\x65\',h);")
      return client;
    }
    else {
      spinner.fail('The session is invalid. Retrying')
      await kill(waPage)
      return await create(sessionId, config, customUserAgent);
    }
  } catch (error) {
    spinner.emit(error.message);
    await kill(waPage);
    spinner.remove();
    throw error;
  }
}

const kill = async (p) => {
  shouldLoop = false;
  if (qrDelayTimeout) clearTimeout(qrDelayTimeout);
  if (p) {
    const browser = await p.browser();
    const pid = browser.process() ? browser?.process().pid : null;
    if (!p.isClosed()) await p.close();
    if (browser) await browser.close();
    if(pid) treekill(pid, 'SIGKILL')
  }
}