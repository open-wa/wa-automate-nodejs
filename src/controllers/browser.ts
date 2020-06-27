import * as path from 'path';
const fs = require('fs');
const ChromeLauncher = require('chrome-launcher');
const puppeteer = require('puppeteer-extra');
const devtools = require('puppeteer-extra-plugin-devtools')()
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
import { puppeteerConfig, useragent, width, height} from '../config/puppeteer.config';
//@ts-ignore
import { Browser, Page } from '@types/puppeteer';
import { Spin } from './events';
import { ConfigObject } from '../api/model';
const ON_DEATH = require('death'); //this is intentionally ugly
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
  await waPage.setRequestInterception(true);
  waPage.on('request', interceptedRequest => {
    if (interceptedRequest.url().includes('https://crashlogs.whatsapp.net/') && blockCrashLogs){
      interceptedRequest.abort();
    }
    else
      interceptedRequest.continue();
  }
  );
  //check if [session].json exists in __dirname
  const sessionjsonpath = path.join(path.resolve(process.cwd(),config?.sessionDataPath || ''), `${sessionId || 'session'}.data.json`);
  let sessionjson = process.env[`${sessionId.toUpperCase()}_DATA_JSON`] ? JSON.parse(process.env[`${sessionId.toUpperCase()}_DATA_JSON`]) : config?.sessionData;
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
    path: require.resolve(path.join(__dirname, '../lib', 'axios.min.js'))
  });
  await page.addScriptTag({
    path: require.resolve(path.join(__dirname, '../lib', 'base64.js'))
  });
  return page;
}

async function initBrowser(sessionId?: string, config:any={}) {
  if(config?.useChrome) {
    config.executablePath = ChromeLauncher.Launcher.getInstallations()[0];
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
  
  if(config?.proxyServerCredentials?.address) puppeteerConfig.chromiumArgs.push(`--proxy-server=${config.proxyServerCredentials.address}`)
  const browser = (config?.browserWSEndpoint) ? await puppeteer.connect({...config}): await puppeteer.launch({
    headless: true,
    devtools: false,
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
});
