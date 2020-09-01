 /**
  * @hidden
  */
/** */
import * as path from 'path';
const fs = require('fs');
const ChromeLauncher = require('chrome-launcher');
const puppeteer = require('puppeteer-extra');
const devtools = require('puppeteer-extra-plugin-devtools')()
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
import { puppeteerConfig, useragent, width, height} from '../config/puppeteer.config';
//@ts-ignore
import { Browser, Page } from '@types/puppeteer';
import { Spin, EvEmitter } from './events';
import { ConfigObject } from '../api/model';
const ON_DEATH = require('death'); //this is intentionally ugly
const useProxy = require('puppeteer-page-proxy');
let browser;

export async function initClient(sessionId?: string, config?:ConfigObject, customUserAgent?:string) {
  if(config?.useStealth) puppeteer.use(StealthPlugin());
  browser = await initBrowser(sessionId,config);
  const waPage = await getWAPage(browser);
  if (config?.proxyServerCredentials) {
    await waPage.authenticate(config.proxyServerCredentials);
  }
  await waPage.setUserAgent(customUserAgent||useragent);
  await waPage.setViewport({
    width,
    height,
    deviceScaleFactor: 1
  });
  const cacheEnabled = config?.cacheEnabled === false ? false : true;
  const blockCrashLogs = config?.blockCrashLogs === false ? false : true;
  await waPage.setBypassCSP(config?.bypassCSP || false);
  await waPage.setCacheEnabled(cacheEnabled);
  // const waPage : any = waPage;
  const blockAssets = !config?.headless ? false : config?.blockAssets || false;
  if(blockAssets){
    puppeteer.use(require('puppeteer-extra-plugin-block-resources')({
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
  if(interceptAuthentication || proxyAddr || blockCrashLogs){
    await waPage.setRequestInterception(true);  
    let authCompleteEv = new EvEmitter(sessionId, 'AUTH');
    waPage.on('request', async request => {
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
    else if (proxyAddr) useProxy(request, proxyAddr);
    else request.continue();
    })
  }

  // if (blockAssets || blockCrashLogs || proxyAddr) {
  //   let patterns = [];
    
  //   if (interceptAuthentication) {
  //     authCompleteEv = new EvEmitter(sessionId, 'AUTH');
  //     patterns.push({ urlPattern: '*_priority_components*' });
  //   }
    
  
  //   if (blockCrashLogs) patterns.push({ urlPattern: '*crashlogs' });
  
  //   if (blockAssets) {
  //     //@ts-ignore
  //     await waPage._client.send('Network.enable');
  //     //@ts-ignore
  //     waPage._client.send('Network.setBypassServiceWorker', {
  //       bypass: true,
  //     });
  
  //     patterns = [
  //       ...patterns,
  //       ...[
  //         { urlPattern: '*.css' },
  //         { urlPattern: '*.jpg' },
  //         { urlPattern: '*.jpg*' },
  //         { urlPattern: '*.jpeg' },
  //         { urlPattern: '*.jpeg*' },
  //         { urlPattern: '*.webp' },
  //         { urlPattern: '*.png' },
  //         { urlPattern: '*.mp3' },
  //         { urlPattern: '*.svg' },
  //         { urlPattern: '*.woff' },
  //         { urlPattern: '*.pdf' },
  //         { urlPattern: '*.zip' },
  //         { urlPattern: '*crashlogs' },
  //       ],
  //     ];
  //   }
  
  //     //@ts-ignore
  //   await waPage._client.send('Network.setRequestInterception', {
  //     patterns,
  //   });
  
  //     //@ts-ignore
  //   waPage._client.on(
  //     'Network.requestIntercepted',
  //     async ({ interceptionId, request }) => {
  //       const extensions = [
  //         '.css',
  //         '.jpg',
  //         '.jpeg',
  //         '.webp',
  //         '.mp3',
  //         '.png',
  //         '.svg',
  //         '.woff',
  //         '.pdf',
  //         '.zip',
  //       ];
  
  //       const req_extension = path.extname(request.url);
  
  //       if (
  //         (blockAssets && extensions.includes(req_extension)) ||
  //         request.url.includes('.jpg') ||
  //         (blockCrashLogs && request.url.includes('crashlogs'))
  //       ) {
  //         await (waPage as any)._client.send(
  //           'Network.continueInterceptedRequest',
  //           {
  //             interceptionId,
  //             rawResponse: '',
  //           }
  //         );
  //       } else {
  //         if(proxyAddr) {
  //           console.log("initClient -> proxyAddr", proxyAddr, request.url)
  //           await useProxy(request, {
  //             proxy: proxyAddr,
  //             headers: {
  //               ...request.headers,
  //               referer:"https://web.whatsapp.com/",
  //               host: "https://web.whatsapp.com"
  //             }});
  //         } else 
  //         await (waPage as any)._client.send(
  //           'Network.continueInterceptedRequest',
  //           {
  //             interceptionId,
  //           }
  //         );

          
  //       }
  //     }
  //   );
  // }

  //check if [session].json exists in __dirname
  const sessionjsonpath = (config?.sessionDataPath && config?.sessionDataPath.includes('.data.json')) ? path.join(path.resolve(process.cwd(),config?.sessionDataPath || '')) : path.join(path.resolve(process.cwd(),config?.sessionDataPath || ''), `${sessionId || 'session'}.data.json`);
  let sessionjson = '';
  let sd = process.env[`${sessionId.toUpperCase()}_DATA_JSON`] ? JSON.parse(process.env[`${sessionId.toUpperCase()}_DATA_JSON`]) : config?.sessionData;
  sessionjson = (typeof sd === 'string') ? JSON.parse(Buffer.from(sd, 'base64').toString('ascii')) : sd;
  if (fs.existsSync(sessionjsonpath)) {
    let s = fs.readFileSync(sessionjsonpath, "utf8");
    try {
      sessionjson = JSON.parse(s);
    } catch (error) {
      sessionjson = JSON.parse(Buffer.from(s, 'base64').toString('ascii'));
    }
  }
  if(sessionjson) await waPage.evaluateOnNewDocument(
    session => {
        localStorage.clear();
        Object.keys(session).forEach(key=>localStorage.setItem(key,session[key]));
    }, sessionjson);
    if(config?.proxyServerCredentials) {
      await useProxy(waPage, proxyAddr);
      console.log(`Active proxy: ${config.proxyServerCredentials.address}`)
    }
  await waPage.goto(puppeteerConfig.WAUrl)
  return waPage;
}

export async function injectApi(page: Page) {
  await page.addScriptTag({
    path: require.resolve(path.join(__dirname, '../lib', 'wapi.js'))
  });
  await page.addScriptTag({
    path: require.resolve(path.join(__dirname, '../lib', 'axios.min.js'))
  });
  await page.addScriptTag({
    path: require.resolve(path.join(__dirname, '../lib', 'jsSha.min.js'))
  });
  await page.addScriptTag({
    path: require.resolve(path.join(__dirname, '../lib', 'base64.js'))
  });
  return page;
}

async function initBrowser(sessionId?: string, config:any={}) {
  if(config?.useChrome && !config?.executablePath) {
    config.executablePath = ChromeLauncher.Launcher.getInstallations()[0];
    console.log(`You have used the useChrome (--use-chrome) config option. In order to improve startup time please use "executablePath": "${config.executablePath}" to save a few seconds on next startup.`)
    // console.log('\nFound chrome', config.executablePath)
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
  
  // if(config?.proxyServerCredentials?.address) puppeteerConfig.chromiumArgs.push(`--proxy-server=${config.proxyServerCredentials.address}`)
  if(config?.browserWsEndpoint) config.browserWSEndpoint = config.browserWsEndpoint;
  let args = [...puppeteerConfig.chromiumArgs,...(config?.chromiumArgs||[])];
  if(config?.corsFix) args.push('--disable-web-security');
  const browser = (config?.browserWSEndpoint) ? await puppeteer.connect({...config}): await puppeteer.launch({
    headless: true,
    devtools: false,
    args,
    ...config
  });
  //devtools
  if(config&&config.devtools){
    if(config.devtools.user&&config.devtools.pass) devtools.setAuthCredentials(config.devtools.user, config.devtools.pass)
    try {
      // const tunnel = await devtools.createTunnel(browser);
      const tunnel = devtools.getLocalDevToolsUrl(browser);
      console.log('\ndevtools URL: '+tunnel);
    } catch (error) {
    console.log("TCL: initBrowser -> error", error)
    }
  }
  return browser;
}

async function getWAPage(browser: Browser) {
  const pages = await browser.pages();
  console.assert(pages.length > 0);
  return pages[0];
}

ON_DEATH(async (signal, err) => {
  //clean up code here
  if (browser) await browser.close();
});
