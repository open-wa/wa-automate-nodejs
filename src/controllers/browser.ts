import * as path from 'path';
import * as puppeteer from 'puppeteer';
import { puppeteerConfig } from '../config/puppeteer.config';

export async function initWhatsapp() {
  const browser = await initBrowser();
  const waPage = await getWhatsappPage(browser);
  await waPage.setUserAgent(
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3312.0 Safari/537.36'
  );

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
