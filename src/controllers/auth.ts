import * as qrcode from 'qrcode-terminal';
import { from, Observable, race } from 'rxjs';
import { EvEmitter, Spin } from './events'
import { screenshot } from './initializer'
import { ConfigObject } from '../api/model';
import { Page } from 'puppeteer';
import { processSend, timeout, timePromise } from '../utils/tools';
import { BROWSER_START_TS, injectApi, kill } from './browser';
import axios from 'axios';
import { log } from '../logging/logging';

/**
 * Validates if client is authenticated
 * @returns true if is authenticated, false otherwise
 * @param waPage
 */
export const isAuthenticated = (waPage: Page): Promise<unknown> => race(needsToScan(waPage), isInsideChat(waPage), sessionDataInvalid(waPage)).toPromise();

export const needsToScan = (waPage: Page): Observable<unknown> => {
  return from(new Promise(async resolve => {
    try {
      await Promise.race([
        waPage.waitForFunction('checkQrRefresh()', { timeout: 0, polling: 1000 }).catch(() => { }),
        await waPage
          .waitForSelector('body > div > div > .landing-wrapper', {
            timeout: 0
          }).catch(() => resolve(true))
      ]).catch(() => { })
      await waPage.waitForSelector("canvas[aria-label='Scan me!']", { timeout: 0 }).catch(() => { })
      resolve(false)
    } catch (error) {
      console.log("needsToScan -> error", error)
      log.error("needsToScan -> error", error)
    }
  }))
};

export const isInsideChat = (waPage: Page): Observable<boolean> => {
  return from(
    waPage
      .waitForFunction(
        "!!window.WA_AUTHENTICATED || (document.getElementsByClassName('app')[0] && document.getElementsByClassName('app')[0].attributes && !!document.getElementsByClassName('app')[0].attributes.tabindex) || (document.getElementsByClassName('two')[0] && document.getElementsByClassName('two')[0].attributes && !!document.getElementsByClassName('two')[0].attributes.tabindex)",
        { timeout: 0 }
      )
      .then(() => true)
  );
};

export const waitForRipeSession = async (waPage: Page): Promise<boolean> => {
  try {
    await waPage.waitForFunction(`window.isRipeSession()`,
      { timeout: 0, polling: 'mutation' });
    return true;
  } catch (error) {
    return false;
  }
}

export const sessionDataInvalid = async (waPage: Page): Promise<string> => {
  await waPage
    .waitForFunction(
      '!window.getQrPng',
      { timeout: 0, polling: 'mutation' }
    )
  await injectApi(waPage);
  await waPage
    .waitForFunction(
      '!window.getQrPng',
      { timeout: 0, polling: 'mutation' }
    )
  //if the code reaches here it means the browser was refreshed. Nuke the session data and restart `create`
  return 'NUKE';
}

export const phoneIsOutOfReach = async (waPage: Page): Promise<boolean> => {
  return await waPage
    .waitForFunction(
      'document.querySelector("body").innerText.includes("Trying to reach phone")',
      { timeout: 0, polling: 'mutation' }
    )
    .then(() => true)
    .catch(() => false);
};

export class QRManager {
  qrEv = null;
  qrNum = 0;
  hash = 'START';
  config: ConfigObject = null;
  firstEmitted = false;
  _internalQrPngLoaded = false;
  qrCheck = `document.querySelector("canvas[aria-label='Scan me!']")?document.querySelector("canvas[aria-label='Scan me!']").parentElement.getAttribute("data-ref"):false`

  constructor(config = null) {
    this.config = config;
  }

  setConfig(config) {
    this.config = config;
    this.qrEvF(this.config)
  }

  qrEvF(config = this.config) {
    if (!this.qrEv) this.qrEv = new EvEmitter(config.sessionId || 'session', 'qr');
    return this.qrEv
  }

  async grabAndEmit(qrData, waPage: Page, config: ConfigObject, spinner: Spin) {
    this.qrNum++;
    if (config.qrMax && this.qrNum > config.qrMax) {
      spinner.info('QR Code limit reached, exiting...');
      await kill(waPage, null, true, null, "QR_LIMIT_REACHED")
    }
    const qrEv = this.qrEvF(config)
    if ((!this.qrNum || this.qrNum == 1) && BROWSER_START_TS) spinner.info(`First QR: ${Date.now() - BROWSER_START_TS} ms`)
    if (qrData) {
      qrEv.emit(qrData, `qrData`);
      if (!config.qrLogSkip) qrcode.generate(qrData, { small: true });
      else {
        console.log(`New QR Code generated. Not printing in console because qrLogSkip is set to true`)
        log.info(`New QR Code generated. Not printing in console because qrLogSkip is set to true`)
      }
    }
    if(!this._internalQrPngLoaded) {
      log.info("Waiting for internal QR renderer to load")
      const t = await timePromise(() => waPage.waitForFunction(`window.getQrPng || false`, { timeout: 0, polling: 'mutation' }))
      log.info(`Internal QR renderer loaded in ${t} ms`)
      this._internalQrPngLoaded = true;
    }
    try {
      const qrPng = await waPage.evaluate(`window.getQrPng()`);
      if (qrPng) {
        qrEv.emit(qrPng);
        processSend('ready');
        if (config.ezqr) {
          const host = 'https://qr.openwa.cloud/'
          await axios.post(host, {
            value: qrPng,
            hash: this.hash
          }).then(({ data }) => {
            if (this.hash === 'START') {
              const qrUrl = `${host}${data}`
              qrEv.emit(qrUrl, `qrUrl`);
              console.log(`Scan the qr code at ${qrUrl}`)
              log.info(`Scan the qr code at ${qrUrl}`)
            }
            this.hash = data;
          }).catch(e => {
            this.hash = 'START';
          })
        }
      } else {
        spinner.info("Something went wrong while retreiving new the QR code but it should not affect the session launch procedure.")
      }
    } catch (error) {
      //@ts-ignore
      const lr = await waPage.evaluate("window.launchres")
      console.log(lr)
      log.info('smartQr -> error', { lr })
      spinner.info(`Something went wrong while retreiving new the QR code but it should not affect the session launch procedure: ${error.message}`);
    }
  }

  async smartQr(waPage: Page, config?: ConfigObject, spinner?: Spin): Promise<boolean | void | string> {
    const evalResult = await waPage.evaluate("window.Store && window.Store.State")
    if (evalResult === false) {
      console.log('Seems as though you have been TOS_BLOCKed, unable to refresh QR Code. Please see https://github.com/open-wa/wa-automate-nodejs#best-practice for information on how to prevent this from happeing. You will most likely not get a QR Code');
      log.warn('Seems as though you have been TOS_BLOCKed, unable to refresh QR Code. Please see https://github.com/open-wa/wa-automate-nodejs#best-practice for information on how to prevent this from happeing. You will most likely not get a QR Code');
      if (config.throwErrorOnTosBlock) throw new Error('TOSBLOCK');
    }

    const isAuthed = await isAuthenticated(waPage);
    if (isAuthed) return true;


    const _hasDefaultStateYet = await waPage.evaluate("!!(window.Store &&  window.Store.State && window.Store.State.Socket)")
    if (!_hasDefaultStateYet) {
      //expecting issue, take a screenshot then wait a few seconds before continuing
      await timeout(2000);
    }

    return new Promise(async resolve => {
      const funcName = '_smartQr';
      const md = "MULTI_DEVICE_DETECTED"
      let gotResult = false;
      const fn = async (qrData) => {
        if (qrData.length > 200 && !config?.multiDevice) {
          spinner.fail(`Multi-Device detected, please set multiDevice to true in your config or add the --multi-device flag`)
          return resolve(md)
        }
        if (!gotResult && (qrData === 'QR_CODE_SUCCESS' || qrData === md)) {
          gotResult = true;
          spinner?.succeed(qrData === md ? "Multi device support for this project is EXPERIMENTAL. Some things may not work...." : "QR code scanned. Loading session...")
          return resolve(await isInsideChat(waPage).toPromise())
        }
        if (!gotResult) this.grabAndEmit(qrData, waPage, config, spinner);
      }
      const set = () => waPage.evaluate(({ funcName }) => {
        //@ts-ignore
        return window['smartQr'] ? window[`smartQr`](obj => window[funcName](obj)) : false
      }, { funcName });
      await waPage.exposeFunction(funcName, (obj: any) => fn(obj)).then(set).catch(async e => {
        //if an error occurs during the qr launcher then take a screenshot.
        await screenshot(waPage);
        console.log("qr -> e", e);
        log.error("qr -> e", e);
      })
      await this.emitFirst(waPage, config, spinner)
    })
  }

  async emitFirst(waPage: Page, config?: ConfigObject, spinner?: Spin){
    if(this.firstEmitted) return;
    this.firstEmitted = true;
    const firstQr = await waPage.evaluate(this.qrCheck);
    await this.grabAndEmit(firstQr, waPage, config, spinner);
  }

  async waitFirstQr(waPage: Page, config?: ConfigObject, spinner?: Spin){
    const fqr = await waPage.waitForFunction(`!!(${this.qrCheck})`, {
      polling: 500,
      timeout: 10000
    })
    .catch(e=>false)
    if(fqr) await this.emitFirst(waPage,config,spinner);
    return;
  }
}

export const qrManager = new QRManager();