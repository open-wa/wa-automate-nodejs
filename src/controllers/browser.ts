import * as path from 'path';
import puppeteer from 'puppeteer';
import { puppeteerConfig, useragent } from '../config/puppeteer.config';
const ON_DEATH = require('death'); //this is intentionally ugly
let browser;
export async function initWhatsapp() {
  browser = await initBrowser();
  const waPage = await getWhatsappPage(browser);
  await waPage.setUserAgent(useragent);

  await waPage.goto(puppeteerConfig.whatsappUrl);
  return waPage;
}

export async function injectApi(page: puppeteer.Page) {
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

async function getWhatsappPage(browser: puppeteer.Browser) {
  const pages = await browser.pages();
  console.assert(pages.length > 0);
  return pages[0];
}

ON_DEATH(async (signal, err) => {
  //clean up code here
  if (browser) await browser.close();
});