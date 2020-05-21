import * as path from 'path';
const fs = require('fs');
const ChromeLauncher = require('chrome-launcher');
const puppeteer = require('puppeteer-extra');
const devtools = require('puppeteer-extra-plugin-devtools')()
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin());
import { puppeteerConfig, useragent, width, height} from '../config/puppeteer.config';
//@ts-ignore
import { Browser, Page } from '@types/puppeteer';
const ON_DEATH = require('death'); //this is intentionally ugly
let browser;

export async function initClient(sessionId?: string, config?:any, customUserAgent?:string) {
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
  await waPage.setRequestInterception(true);
  waPage.on('request', interceptedRequest => {
  const headers = Object.assign({}, interceptedRequest.headers(), {
    DNT:1
  });
    if (interceptedRequest.url().includes('https://crashlogs.whatsapp.net/') && blockCrashLogs){
      interceptedRequest.abort();
    }
    else
      interceptedRequest.continue({headers});
  }
  );
  //check if [session].json exists in __dirname
  const sessionjsonpath = path.join(path.resolve(process.cwd(),config?.sessionDataPath || ''), `${sessionId || 'session'}.data.json`);
  let sessionjson = config?.sessionData;
  if (fs.existsSync(sessionjsonpath)) sessionjson = JSON.parse(fs.readFileSync(sessionjsonpath));
  if(sessionjson) await waPage.evaluateOnNewDocument(
    session => {
        localStorage.clear();
        Object.keys(session).forEach(key=>localStorage.setItem(key,session[key]));
    }, sessionjson);
    
  await waPage.goto(puppeteerConfig.WAUrl);
  return waPage;
}

export async function injectApi(page: Page) {
  await page.addScriptTag({
    path: require.resolve(path.join(__dirname, '../lib', 'wapi.js'))
  });
  await page.addScriptTag({
    path: require.resolve(path.join(__dirname, '../lib', 'middleware.js'))
  });
  await page.addScriptTag({
    path: require.resolve(path.join(__dirname, '../lib', 'axios.min.js'))
  });
  return page;
}

async function initBrowser(sessionId?: string, config:any={}) {

  if(config?.useChrome) {
    config.executablePath = ChromeLauncher.Launcher.getInstallations()[0];
    // console.log('\nFound chrome', config.executablePath)
  }
  if(config?.proxyServerCredentials?.address) puppeteerConfig.chromiumArgs.push(`--proxy-server=${config.proxyServerCredentials.address}`)
  const browser = await puppeteer.launch({
    headless: true,
    devtools: false,
    // executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    // userDataDir: path.join(process.cwd(), sessionId || 'session'),
    args: [...puppeteerConfig.chromiumArgs],
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
  console.log('broswerclosed')
});
