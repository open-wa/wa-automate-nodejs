import * as path from 'path';
import * as fs from 'fs';
import ON_DEATH from 'death';
// import puppeteer from 'puppeteer-extra';
import { puppeteerConfig, useragent, width, height} from '../config/puppeteer.config';
import { Browser, Page } from 'puppeteer';
import { Spin, EvEmitter } from './events';
import { ConfigObject } from '../api/model';
import { FileNotFoundError, getTextFile } from 'pico-s3';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const puppeteer = require('puppeteer-extra')
import terminate from 'terminate/promise';
import { log } from '../logging/logging';
import { now, processSendData, timeout, timePromise } from '../utils/tools';
import { QRManager } from './auth';
import { scriptLoader } from './script_preloader';
import { earlyInjectionCheck } from './patch_manager';

let browser,
wapiInjected = false,
dumbCache = undefined,
wapiAttempts = 1;

export let BROWSER_START_TS = 0;

export async function initPage(sessionId?: string, config?:ConfigObject, qrManager ?: QRManager, customUserAgent?:string, spinner ?: Spin, _page?: Page, skipAuth ?: boolean) : Promise<Page> {
  const setupPromises = [];
  await scriptLoader.loadScripts();
  if(config?.resizable === undefined || !config?.resizable == false) config.defaultViewport= null
  if(config?.useStealth) {
    const {default : stealth} = await import('puppeteer-extra-plugin-stealth')
    puppeteer.use(stealth());
  }
  let waPage = _page;
  if(!waPage) {
    spinner?.info('Launching Browser')
    const startBrowser = now();
    browser = await initBrowser(sessionId,config, spinner);
    spinner?.info(`Browser launched: ${(now() - startBrowser).toFixed(0)}ms`)
    waPage = await getWAPage(browser);
  }
  //@ts-ignore
  waPage._client.send('Network.setBypassServiceWorker', {bypass: true})
  const postBrowserLaunchTs = now();
  waPage.on("framenavigated", async frame => {
    try {
      const frameNavPromises = [];
      const content = await frame.content()
      const webpPackKey = (((content.match(/self.(?:.*)=self.*\|\|\[\]/g) || [])[0] || "").match(/self.*\w?=/g) || [""])[0].replace("=","").replace("self.","") || false
      log.info(`FRAME NAV, ${frame.url()}, ${webpPackKey}`)
      if(webpPackKey) {
        frameNavPromises.push(injectApi(waPage, spinner, true))
        frameNavPromises.push(qrManager.waitFirstQr(waPage, config, spinner))
      }
      if(frame.url().includes('post_logout=1')) {
          console.log("Session most likely logged out")
      }
      await Promise.all(frameNavPromises)
    } catch (error) {
      log.error('framenaverr', error)
    }
  })


  spinner?.info('Setting Up Page')
  if (config?.proxyServerCredentials) {
    await waPage.authenticate(config.proxyServerCredentials);
  }
  setupPromises.push(waPage.setUserAgent(customUserAgent||useragent));
  if(config?.defaultViewport!==null)
  setupPromises.push(waPage.setViewport({
    width: config?.viewport?.width || width,
    height: config?.viewport?.height || height,
    deviceScaleFactor: 1
  }));
  const cacheEnabled = config?.cacheEnabled === false ? false : true;
  const blockCrashLogs = config?.blockCrashLogs === false ? false : true;
  setupPromises.push(waPage.setBypassCSP(config?.bypassCSP || false));
  if(!config?.multiDevice) setupPromises.push(waPage.setCacheEnabled(cacheEnabled));
  const blockAssets = !config?.headless ? false : config?.blockAssets || false;
  if(blockAssets){
    const {default : block} = await import('puppeteer-extra-plugin-block-resources')
    puppeteer.use(block({
      blockedTypes: new Set(['image', 'stylesheet', 'font'])
    }))
  }

  const interceptAuthentication = !(config?.safeMode);
  const proxyAddr = config?.proxyServerCredentials ? `${config.proxyServerCredentials?.username && config.proxyServerCredentials?.password ? `${config.proxyServerCredentials.protocol || 
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
  let proxy;
  if(proxyAddr) {
    proxy = (await import('puppeteer-page-proxy')).default
  }
  if(interceptAuthentication || proxyAddr || blockCrashLogs || true){
      await waPage.setRequestInterception(true);  
      waPage.on('response', async response => {
        try {
          if(response.request().url() == "https://web.whatsapp.com/") {
            const t = await response.text()
            if(t.includes(`class="no-js"`) && t.includes(`self.`) && !dumbCache) {
              //this is a valid response, save it for later
              dumbCache = t;
              log.info("saving valid page to dumb cache")
            }
          }
        } catch (error) {
          log.error("dumb cache error", error)
        }
      })
      const authCompleteEv = new EvEmitter(sessionId, 'AUTH');
      waPage.on('request', async request => {
        //local refresh cache:
        if(request.url()==="https://web.whatsapp.com/" && dumbCache) {
          //if the dumbCache isn't set and this response includes 
          log.info("reviving page from dumb cache")
            return await request.respond({
              status: 200,
              body: dumbCache
            });
        }
        if (
          interceptAuthentication &&
          request.url().includes('_priority_components') &&
          !quickAuthed
        ) {
          authCompleteEv.emit(true);
          await waPage.evaluate('window.WA_AUTHENTICATED=true;');
          quickAuthed = true;
        }
      if (request.url().includes('https://crashlogs.whatsapp.net/') && blockCrashLogs){
        request.abort();
      }
      else if (proxyAddr && !config?.useNativeProxy) {
        proxy(request, proxyAddr)
      }
      else request.continue();
      })
    
  }
  if(skipAuth) {
    spinner.info("Skipping Authentication")
  } else {
  /**
   * AUTH
   */
  spinner?.info('Loading session data')
  let sessionjson : any = getSessionDataFromFile(sessionId, config, spinner)
  if(!sessionjson && sessionjson !== "" && config.sessionDataBucketAuth) {
    try {
      spinner?.info('Unable to find session data file locally, attempting to find session data in cloud storage..')
      sessionjson = JSON.parse(Buffer.from(await getTextFile({
        directory: '_sessionData',
        ...JSON.parse(Buffer.from(config.sessionDataBucketAuth, 'base64').toString('ascii')),
        filename: `${config.sessionId || 'session'}.data.json`
      }), 'base64').toString('ascii'));
      spinner?.succeed('Successfully downloaded session data file from cloud storage!')
    } catch (error) {
      spinner?.fail(`${error instanceof FileNotFoundError ? 'The session data file was not found in the cloud storage bucket' : 'Something went wrong while fetching session data from cloud storage bucket'}. Continuing...`)
    }
  }

  if(sessionjson) {
  spinner?.info(config.multiDevice ?  "multi-device enabled. Session data skipped..." : 'Existing session data detected. Injecting...')
  if(!config?.multiDevice) await waPage.evaluateOnNewDocument(
  session => {
        localStorage.clear();
        Object.keys(session).forEach(key=>localStorage.setItem(key,session[key]));
    }, sessionjson);
    spinner?.succeed('Existing session data injected')
  } else {
    if(config?.multiDevice) {
      spinner?.info("No session data detected. Opting in for MD.")
      spinner?.info("Make sure to keep the session alive for at least 5 minutes after scanning the QR code before trying to restart a session!!")
      await waPage.evaluateOnNewDocument(
        session => {
              localStorage.clear();
              Object.keys(session).forEach(key=>localStorage.setItem(key,session[key]));
          },{
            "md-opted-in": "true",
            "MdUpgradeWamFlag": "true",
            "remember-me": "true"
          })
    }
  }
  /**
   * END AUTH
   */
  }
    if(config?.proxyServerCredentials && !config?.useNativeProxy) {
      await proxy(waPage, proxyAddr);
    }
  if(config?.proxyServerCredentials?.address) spinner.succeed(`Active proxy: ${config.proxyServerCredentials.address}`)
  await Promise.all(setupPromises);
  spinner?.info(`Pre page launch setup complete: ${(now() - postBrowserLaunchTs).toFixed(0)}ms`)
  spinner?.info('Navigating to WA')
  try {
    //try twice 
    const WEB_START_TS = new Date().getTime();
    const webRes = await waPage.goto(puppeteerConfig.WAUrl)
    const WEB_END_TS = new Date().getTime();
    if(webRes==null) {
      spinner?.info(`Page loaded but something may have gone wrong: ${WEB_END_TS - WEB_START_TS}ms`)
    } else {
      spinner?.info(`Page loaded in ${WEB_END_TS - WEB_START_TS}ms: ${webRes.status()}${webRes.ok() ? '' : ', ' +webRes.statusText()}`)
      if(!webRes.ok()) spinner?.info(`Headers Info: ${JSON.stringify(webRes.headers(), null, 2)}`)
    }
  } catch (error) {
    spinner?.fail(error);
    throw error
  }
  return waPage;
}

const getSessionDataFromFile = (sessionId: string, config: ConfigObject, spinner ?: Spin) => {
  if(config?.sessionData == "NUKE") return '' 
  //check if [session].json exists in __dirname
  const sessionjsonpath = getSessionDataFilePath(sessionId,config)
  let sessionjson = '';
  const sd = process.env[`${sessionId.toUpperCase()}_DATA_JSON`] ? JSON.parse(process.env[`${sessionId.toUpperCase()}_DATA_JSON`]) : config?.sessionData;
  sessionjson = (typeof sd === 'string' && sd !== "") ? JSON.parse(Buffer.from(sd, 'base64').toString('ascii')) : sd;
  if (sessionjsonpath && typeof sessionjsonpath == 'string' && fs.existsSync(sessionjsonpath)) {
    spinner.succeed(`Found session data file: ${sessionjsonpath}`)
    const s = fs.readFileSync(sessionjsonpath, "utf8");
    try {
      sessionjson = JSON.parse(s);
    } catch (error) {
      try {
      sessionjson = JSON.parse(Buffer.from(s, 'base64').toString('ascii'));
      } catch (error) {
        const msg =  `${s =="LOGGED OUT" ? "The session was logged out" : "Session data json file is corrupted"}. Please re-scan the QR code.`
      if(spinner) {
        spinner.fail(msg)
      } else console.error(msg);
      return false;
      }
    }
  } else {
    spinner.succeed(`No session data file found for session : ${sessionId}`)
  }
  return sessionjson;
}

export const deleteSessionData = (config: ConfigObject) : boolean => {
  const sessionjsonpath = getSessionDataFilePath(config?.sessionId || 'session', config)
  if(typeof sessionjsonpath == 'string' && fs.existsSync(sessionjsonpath)) {
    const l = `logout detected, deleting session data file: ${sessionjsonpath}`
    console.log(l)
    log.info(l)
    fs.unlinkSync(sessionjsonpath);
  }
  return true;
}

export const invalidateSesssionData = (config: ConfigObject) : boolean => {
  const sessionjsonpath = getSessionDataFilePath(config?.sessionId || 'session', config)
  if(typeof sessionjsonpath == 'string' && fs.existsSync(sessionjsonpath)) {
    const l = `logout detected, invalidating session data file: ${sessionjsonpath}`
    console.log(l)
    log.info(l)
    fs.writeFile(sessionjsonpath, "LOGGED OUT", (err) => {
      if (err) { console.error(err); return; }
    });
  }
  return true;
}

export const getSessionDataFilePath = (sessionId: string, config: ConfigObject) : string | false => {
  const p = require?.main?.path || process?.mainModule?.path;
  const sessionjsonpath = (config?.sessionDataPath && config?.sessionDataPath.includes('.data.json')) ? path.join(path.resolve(process.cwd(),config?.sessionDataPath || '')) : path.join(path.resolve(process.cwd(),config?.sessionDataPath || ''), `${sessionId || 'session'}.data.json`);
  const altSessionJsonPath = p ? (config?.sessionDataPath && config?.sessionDataPath.includes('.data.json')) ? path.join(path.resolve(p,config?.sessionDataPath || '')) : path.join(path.resolve(p,config?.sessionDataPath || ''), `${sessionId || 'session'}.data.json`) : false;
  if(fs.existsSync(sessionjsonpath)){
    return sessionjsonpath
  } else if(p && altSessionJsonPath && fs.existsSync(altSessionJsonPath)){
    return altSessionJsonPath
  }
  return false
}

export const addScript = async (page: Page, js : string) : Promise<unknown> => page.evaluate(await scriptLoader.getScript(js)).catch(e => log.error(`Injection error: ${js}`, e))
// (page: Page, js : string) : Promise<unknown> => page.addScriptTag({
//   path: require.resolve(path.join(__dirname, '../lib', js))
// })


export async function injectPreApiScripts(page: Page, spinner ?: Spin) : Promise<Page> {
  if(await page.evaluate("!['jsSHA','axios', 'QRCode', 'Base64', 'objectHash'].find(x=>!window[x])")) return;
  const t1 = await timePromise(() => Promise.all(
   [
     'jsSha.min.js',
     'qr.min.js',
     'base64.js',
     'hash.js'
   ].map(js=>addScript(page,js))
   ))
   spinner?.info(`Base inject: ${t1}ms`);
   return page;
}

export async function injectWapi(page: Page, spinner ?: Spin, force = false) : Promise<Page> {
  const bruteInjectionAttempts = 1;
  await earlyInjectionCheck(page)
  const check = `window.WAPI && window.Store ? true : false`;
  const initCheck = await page.evaluate(check)
  if(initCheck) return;
  log.info(`WAPI CHECK: ${initCheck}`)
  if(!initCheck) force = true;
  if(wapiInjected && !force) return page;
  const multiScriptInjectPromiseArr = Array(bruteInjectionAttempts).fill("wapi.js").map((_s)=>addScript(page,_s))
  try {
    const wapi = await timePromise(()=>Promise.all(multiScriptInjectPromiseArr))
    spinner?.info(`WAPI inject: ${wapi}ms`)
  } catch (error) {
    log.error("injectWapi ~ error", error.message)
    //one of the injection attempts failed.
    return await injectWapi(page,spinner,force)
  }
  spinner?.info("Checking session integrity")
  wapiAttempts++;
   wapiInjected = !!(await page.waitForFunction(check,{ timeout: 3000, polling: 50 }).catch(e=>false))
   if(!wapiInjected) {
    spinner?.info(`Session integrity check failed, trying again... ${wapiAttempts}`);
    return await injectWapi(page, spinner, true)
  }
  spinner?.info("Session integrity check passed")
  return page;
}

export async function injectApi(page: Page, spinner ?: Spin, force = false) : Promise<Page> {
  spinner?.info("Injecting scripts")
  await injectPreApiScripts(page, spinner);
  await injectWapi(page, spinner, force)
  const launch = await timePromise(()=>addScript(page,'launch.js'))
  spinner?.succeed(`Launch inject: ${launch}ms`)
  return page;
}

async function initBrowser(sessionId?: string, config:any={}, spinner ?: Spin) {
  if(config?.raspi) {
    config.executablePath = "/usr/bin/chromium-browser"
  }

  if(config?.useChrome && !config?.executablePath) {
    const {default : storage} = await import('node-persist');
    await storage.init();
    const _savedPath = await storage.getItem('executablePath');
    if(!_savedPath) {
      const chromeLauncher = await import('chrome-launcher')
      config.executablePath = chromeLauncher.Launcher.getInstallations()[0];
      if(!config.executablePath) delete config.executablePath;
      await storage.setItem('executablePath',config.executablePath)
    } else config.executablePath = _savedPath;
  }

  if(config?.browserRevision) {
    const browserFetcher = puppeteer.createBrowserFetcher();
    const browserDownloadSpinner = new Spin(sessionId+'_browser', 'Browser',false,false);
    try {
      browserDownloadSpinner.start('Downloading browser revision: ' + config.browserRevision);
      const revisionInfo = await browserFetcher.download(config.browserRevision, function(downloadedBytes,totalBytes){
      browserDownloadSpinner.info(`Downloading Browser: ${Math.round(downloadedBytes/1000000)}/${Math.round(totalBytes/1000000)}`);
      });
      if(revisionInfo.executablePath) {
        config.executablePath = revisionInfo.executablePath;
        // config.pipe = true;
      }
      browserDownloadSpinner.succeed('Browser downloaded successfully');
    } catch (error){
      browserDownloadSpinner.succeed('Something went wrong while downloading the browser');
    }
  }
  
  if(config?.proxyServerCredentials?.address && config?.useNativeProxy) puppeteerConfig.chromiumArgs.push(`--proxy-server=${config.proxyServerCredentials.address}`)
  if(config?.browserWsEndpoint) config.browserWSEndpoint = config.browserWsEndpoint;
  let args = [...puppeteerConfig.chromiumArgs,...(config?.chromiumArgs||[])];
  if(config?.multiDevice) {
    args = args.filter(x=>x!='--incognito')
    config["userDataDir"] = config["userDataDir"] ||  `${config?.inDocker ? '/sessions' : config?.sessionDataPath || '.' }/_IGNORE_${config?.sessionId || 'session'}`
    spinner?.info('MD Enabled, turning off incognito mode.')
    spinner?.info(`Data dir: ${config["userDataDir"]}`)
  }
  if(config?.corsFix) args.push('--disable-web-security');
  if(config["userDataDir"] && !fs.existsSync(config["userDataDir"])) {
    spinner?.info(`Data dir doesnt exist, creating...: ${config["userDataDir"]}`)
    fs.mkdirSync(config["userDataDir"], {recursive: true});
  }
  const browser = (config?.browserWSEndpoint) ? await puppeteer.connect({...config}): await puppeteer.launch({
    headless: true,
    args,
    ...config,
    devtools: false
  });
  BROWSER_START_TS = Date.now();
  //devtools
  if(config?.devtools){
    const _dt = await import('puppeteer-extra-plugin-devtools')
    const devtools = _dt.default();
    if(config.devtools !== 'local' && !config?.devtools?.user && !config?.devtools?.pass){
      config.devtools = {};
      config.devtools.user = 'dev';
      const uuid = (await import('uuid-apikey')).default
      config.devtools.pass = uuid.create().apiKey;
    }

    if(config.devtools.user&&config.devtools.pass) {
      devtools.setAuthCredentials(config.devtools.user, config.devtools.pass)
    } 
    puppeteer.use(devtools)
    try {
      // const tunnel = await devtools.createTunnel(browser);
      const tunnel = config.devtools == 'local' ? devtools.getLocalDevToolsUrl(browser) : (await devtools.createTunnel(browser)).url;
      const l = `\ndevtools URL: ${ typeof config.devtools == 'object' ? JSON.stringify({
        ...config.devtools,
        tunnel
      },null,2) : tunnel}`
      spinner.info(l);
    } catch (error) {
    spinner.fail(error)
    log.error("initBrowser -> error", error)
    }
  }
  return browser;
}

async function getWAPage(browser: Browser) {
  const pages = await browser.pages();
  console.assert(pages.length > 0);
  return pages[0];
}

ON_DEATH(async () => {
  //clean up code here
  if (browser) await kill(browser)
});


/**
 * @internal
 */
 export const kill = async (p: Page, b?: Browser, exit ?: boolean, pid ?: number, reason = "LAUNCH_KILL") => {
     processSendData({
      reason
    })
    timeout(3000)
   const killBrowser = async (browser ?: Browser) => {
    if(!browser) return;
    pid = browser?.process() ? browser?.process().pid : null;
    if(!pid) return;
    if (!p?.isClosed()) await p?.close();
    if (browser) await browser?.close().catch(()=>{});
   }
  if (p) {
    const browser = p?.browser && typeof p?.browser === 'function' && p?.browser();
    await killBrowser(browser);
  } else if(b) {
    await killBrowser(b);
  }
  if(pid) await terminate(pid, 'SIGKILL').catch(e=>console.error('Error while terminating browser PID. You can just ignore this, as the process has most likely been terminated successfully already:',e.message))
  if(exit) process.exit();
  return;
}