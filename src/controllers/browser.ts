import * as path from 'path';
const fs = require('fs');
// import opuppeteer from 'puppeteer';
// puppeteer-extra is a drop-in replacement for puppeteer,
// it augments the installed puppeteer with plugin functionality
const puppeteer = require('puppeteer-extra');
// add stealth plugin and use defaults (all evasion techniques)
const pluginStealth = require('puppeteer-extra-plugin-stealth');
puppeteer.use(pluginStealth());
import { puppeteerConfig, useragent } from '../config/puppeteer.config';
//@ts-ignore
import { Browser, Page } from '@types/puppeteer';
const ON_DEATH = require('death'); //this is intentionally ugly
let browser;
export async function initWhatsapp() {
  browser = await initBrowser();
  const waPage = await getWhatsappPage(browser);
  await waPage.setUserAgent(useragent);

  await waPage.goto(puppeteerConfig.whatsappUrl);
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

async function initBrowser() {
  const browser = await puppeteer.launch({
    // headless: false,
    headless: true,
    devtools: false,
    // executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    userDataDir: path.join(process.cwd(), 'session'),
    args: [...puppeteerConfig.chroniumArgs]
  });
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
});