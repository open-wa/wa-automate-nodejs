import ora from 'ora';
import * as puppeteer from 'puppeteer';
import * as qrcode from 'qrcode-terminal';
import { from, merge } from 'rxjs';
import { take } from 'rxjs/operators';
import { width, height } from '../config/puppeteer.config';
const spinner = ora();
import {EventEmitter2} from 'eventemitter2';
export const ev = new EventEmitter2({
  wildcard:true,
});

/**
 * Validates if client is authenticated
 * @returns true if is authenticated, false otherwise
 * @param waPage
 */
export const isAuthenticated = (waPage: puppeteer.Page) => {
  return merge(needsToScan(waPage), isInsideChat(waPage))
    .pipe(take(1))
    .toPromise();
};

export const needsToScan = (waPage: puppeteer.Page) => {
  return from(
    waPage
      .waitForSelector('body > div > div > .landing-wrapper', {
        timeout: 0
      })
      .then(() => false)
  );
};

export const isInsideChat = (waPage: puppeteer.Page) => {
  return from(
    waPage
      .waitForFunction(
        "document.getElementsByClassName('app')[0] && document.getElementsByClassName('app')[0].attributes && !!document.getElementsByClassName('app')[0].attributes.tabindex",
        { timeout: 0 }
      )
      .then(() => true)
  );
};

export async function retrieveQR(waPage: puppeteer.Page, sessionId?:string, autoRefresh:boolean=false,throwErrorOnTosBlock:boolean=false) {
  if(autoRefresh) {
    //@ts-ignore
  const evalResult = await waPage.evaluate(() => {if(window.Store && window.Store.State) {window.Store.State.default.state="UNPAIRED";window.Store.State.default.run();return true;} else {return false;}});
    if(evalResult===false) {
    const em = 'Seems as though you have been TOS_BLOCKed, unable to refresh QR Code. Please see https://github.com/smashah/sulla#best-practice for information on how to prevent this from happeing. You will most likely not get a QR Code';
    console.log(em)
    if(throwErrorOnTosBlock) throw new Error('TOSBLOCK')
}
  }
  await waPage.waitForSelector("canvas[aria-label='Scan me!']", { timeout: 0 });
  const qrData = await waPage.evaluate(
    `document.querySelector("canvas[aria-label='Scan me!']").parentElement.getAttribute("data-ref")`
  );
  const qrCode = await waPage.evaluate(
    `document.querySelector("canvas[aria-label='Scan me!']").toDataURL()`
  );
  
  ev.emit(`qr${sessionId?`.${sessionId}`:``}`, qrCode, sessionId);
  // ev.emit(`qr${sessionId?`.${sessionId}`:``}`, sessionId? {qrImage,sessionId}:qrImage);
  qrcode.generate(qrData, {
    small: true
  });
  return true;
}

export async function randomMouseMovements(waPage: puppeteer.Page) {
  var twoPI = Math.PI * 2.0;
  var h = (height / 2 - 10) / 2;
  var w = width / 2;
  for (var x = 0; x < w; x++) {
    const y = h * Math.sin((twoPI * x) / width) + h;
    await waPage.mouse.move(x + 500, y);
  }
  return true;
}
