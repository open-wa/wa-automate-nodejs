import * as puppeteer from 'puppeteer';
import * as qrcode from 'qrcode-terminal';
import { from, merge } from 'rxjs';
import { take } from 'rxjs/operators';
import {EvEmitter} from './events'
import { QRFormat, QRQuality } from '../api/model';

/**
 * Validates if client is authenticated
 * @returns true if is authenticated, false otherwise
 * @param waPage
 */
export const isAuthenticated = (waPage: puppeteer.Page) => merge(needsToScan(waPage), isInsideChat(waPage)).pipe(take(1)).toPromise()

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
        "(document.getElementsByClassName('app')[0] && document.getElementsByClassName('app')[0].attributes && !!document.getElementsByClassName('app')[0].attributes.tabindex) || (document.getElementsByClassName('two')[0] && document.getElementsByClassName('two')[0].attributes && !!document.getElementsByClassName('two')[0].attributes.tabindex)",
        { timeout: 0 }
      )
      .then(() => true)
  );
};

export const phoneIsOutOfReach = async (waPage: puppeteer.Page) => {
  return await waPage
    .waitForFunction(
      'document.querySelector("body").innerText.includes("Trying to reach phone")',
      { timeout: 0, polling: 'mutation' }
    );
};

    //@ts-ignore
const checkIfCanAutoRefresh = (waPage: puppeteer.Page) => waPage.evaluate(() => {if(window.Store && window.Store.State) {window.Store.State.default.state="UNPAIRED";window.Store.State.default.run();return true;} else {return false;}})

export async function retrieveQR(waPage: puppeteer.Page, sessionId?:string, autoRefresh:boolean=false,throwErrorOnTosBlock:boolean=false, qrLogSkip: boolean = false, format: QRFormat = QRFormat.PNG, quality: QRQuality = QRQuality.TEN) {
  const qrEv = new EvEmitter(sessionId,'qr');
  if (autoRefresh) {
    const evalResult = await checkIfCanAutoRefresh(waPage)
    if (evalResult === false) {
      console.log('Seems as though you have been TOS_BLOCKed, unable to refresh QR Code. Please see https://github.com/open-wa/wa-automate-nodejs#best-practice for information on how to prevent this from happeing. You will most likely not get a QR Code');
      if (throwErrorOnTosBlock) throw new Error('TOSBLOCK');
    }
  }
  let targetElementFound;
  while (!targetElementFound) {
    try {
      targetElementFound = await waPage.waitForSelector( "canvas[aria-label='Scan me!']",{
        timeout: 10000,
        visible: true,
        });
    } catch(error) {}
  }
  let qrData;
  while(!qrData){
    qrData = await waPage.evaluate(`document.querySelector("canvas[aria-label='Scan me!']")?document.querySelector("canvas[aria-label='Scan me!']").parentElement.getAttribute("data-ref"):false`);
  }
  const qrCode = await waPage.evaluate(`document.querySelector("canvas[aria-label='Scan me!']").toDataURL('image/${format}', ${quality})`);
  qrEv.emit(qrCode);
  if(!qrLogSkip) qrcode.generate(qrData,{small: true});
  return true;
}