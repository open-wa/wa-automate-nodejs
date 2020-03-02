import * as path from 'path';
const fs = require('fs');
const {installMouseHelper} = require('./mouse-helper');
// import opuppeteer from 'puppeteer';
// puppeteer-extra is a drop-in replacement for puppeteer,
// it augments the installed puppeteer with plugin functionality
const puppeteer = require('puppeteer-extra');
const devtools = require('puppeteer-extra-plugin-devtools')()

// add stealth plugin and use defaults (all evasion techniques)
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin());
import { puppeteerConfig, useragent, width, height} from '../config/puppeteer.config';
//@ts-ignore
import { Browser, Page } from '@types/puppeteer';
import { randomMouseMovements } from './auth';
const ON_DEATH = require('death'); //this is intentionally ugly
let browser;

export async function initWhatsapp(sessionId?: string, puppeteerConfigOverride?:any, customUserAgent?:string) {
  browser = await initBrowser(sessionId,puppeteerConfigOverride);
  const waPage = await getWhatsappPage(browser);
  await waPage.setUserAgent(customUserAgent||useragent);
  await waPage.setViewport({
    width,
    height,
    deviceScaleFactor: 1
  });
  // await installMouseHelper(waPage);
  const cacheEnabled = puppeteerConfigOverride&&puppeteerConfigOverride.cacheEnabled? puppeteerConfigOverride.cacheEnabled :true
  const blockCrashLogs = puppeteerConfigOverride&&puppeteerConfigOverride.blockCrashLogs? puppeteerConfigOverride.blockCrashLogs :false;
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
  
  await waPage.goto(puppeteerConfig.whatsappUrl);
  await randomMouseMovements(waPage);
  return waPage;
}

export async function injectApi(page: Page) {
  // const preloadFile = fs.readFileSync('./preload', 'utf8');
  // await page.evaluateOnNewDocument(preloadFile);
  await page.addScriptTag({
    path: require.resolve(path.join(__dirname, '../lib', 'wapi.js'))
  });
  await page.addScriptTag({
    path: require.resolve(path.join(__dirname, '../lib', 'middleware.js'))
  });

  return page;
}

async function initBrowser(sessionId?: string, puppeteerConfigOverride:any={}) {
  const browser = await puppeteer.launch({
    headless: true,
    devtools: false,
    // executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    userDataDir: path.join(process.cwd(), sessionId || 'session'),
    args: [...puppeteerConfig.chromiumArgs],
    ...puppeteerConfigOverride
  });
  //devtools
  if(puppeteerConfigOverride&&puppeteerConfigOverride.devtools){
    if(puppeteerConfigOverride.devtools.user&&puppeteerConfigOverride.devtools.pass) devtools.setAuthCredentials(puppeteerConfigOverride.devtools.user, puppeteerConfigOverride.devtools.pass)
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

async function getWhatsappPage(browser: Browser) {
  const pages = await browser.pages();
  console.assert(pages.length > 0);
  return pages[0];
}

ON_DEATH(async (signal, err) => {
  //clean up code here
  if (browser) await browser.close();
  console.log('broswerclosed')
});