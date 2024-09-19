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
import boxen from 'boxen';

/**
 * isAuthenticated
 * Validates if client is authenticated
 * @returns true if is authenticated, false otherwise
 * @param waPage
 */
export const isAuthenticated = (waPage: Page): Promise<unknown> => race(needsToScan(waPage), isInsideChat(waPage), sessionDataInvalid(waPage)).toPromise();

export const needsToScan = (waPage: Page): Observable<unknown> => {
  return from(new Promise(async resolve => {
    try {
      /**
       * TODO: COMMENTING OUT THE BELOW LINES MAY CAUSE A REGRESSION IN RELOGIN? REVERT IF NEEDED.
       */
      // const raceResult = await Promise.race([
      //   waPage.waitForFunction('checkQrRefresh()', { timeout: 0, polling: 1000 }).catch(() => { }),
      //   await waPage
      //     .waitForSelector('body > div > div > .landing-wrapper', {
      //       timeout: 0
      //     }).catch(() => resolve(true))
      // ]).catch(() => { })
      // console.log("🚀 ~ needsToScan ~ raceResult:", raceResult)
      const elementResult = await Promise.race([
        waPage.waitForSelector("canvas[aria-label='Scan this QR code to link a device!']", { timeout: 0 }).catch(() => { }),
        waPage.waitForSelector("canvas[aria-label]", { timeout: 0 }).catch(() => { })
      ])
      log.info("🚀 ~ needsToScan ~ elementResult:", elementResult)
      resolve(false)
    } catch (error) {
      console.log("needsToScan -> error", error)
      log.error("needsToScan -> error", error)
    }
  }))
};

const isInsideChat = (waPage: Page): Observable<boolean> => {
  return from(
    waPage
      .waitForFunction(
        "!!window.WA_AUTHENTICATED || (document.getElementsByClassName('app')[0] && document.getElementsByClassName('app')[0].attributes && !!document.getElementsByClassName('app')[0].attributes.tabindex) || (document.getElementsByClassName('two')[0] && document.getElementsByClassName('two')[0].attributes && !!document.getElementsByClassName('two')[0].attributes.tabindex)",
        { timeout: 0 }
      )
      .then(() => true)
  );
};

const isTosBlocked  = (waPage: Page): Observable<string | boolean> => {
  return from(
    waPage
      .waitForFunction(
        `document.getElementsByTagName("html")[0].classList[0] === 'no-js'`,
        { timeout: 0 }
      )
      .then(() => false)
  );
};

export const waitForRipeSession = async (waPage: Page, waitForRipeSessionTimeout ?: number): Promise<boolean> => {
  try {
    await waPage.waitForFunction(`window.isRipeSession()`,
      { timeout: (waitForRipeSessionTimeout ?? 5) * 1000, polling: 1000 });
    return true;
  } catch (error) {
    return false;
  }
}

export const sessionDataInvalid = async (waPage: Page): Promise<string> => {
  const check = `Object.keys(localStorage).includes("old-logout-cred")`
  await waPage
    .waitForFunction(
      check,
      { timeout: 0, polling: 'mutation' }
    )
  // await injectApi(waPage, null, true);
  // await waPage
  //   .waitForFunction(
  //     '!window.getQrPng',
  //     { timeout: 0, polling: 'mutation' }
  //   )
    // await timeout(1000000)
    //NEED A DIFFERENT WAY TO DETERMINE IF THE SESSION WAS LOGGED OUT!!!!
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
  qrCheck = `document.querySelector("canvas[aria-label]")?document.querySelector("canvas[aria-label]").parentElement.getAttribute("data-ref"):false`

  constructor(config = null) {
    this.config = config;
    this.setConfig(this.config)
  }

  setConfig(config) {
    this.config = config;
    this.qrEvF(this.config)
  }

  qrEvF(config = this.config) {
    // return new EvEmitter(config.sessionId || 'session', 'qr');
    if (!this.qrEv) this.qrEv = new EvEmitter(config.sessionId || 'session', 'qr');
    return this.qrEv
  }

  async grabAndEmit(qrData, waPage: Page, config: ConfigObject, spinner: Spin) {
    const isLinkCode = qrData.length === 9
    this.qrNum++;
    if (config.qrMax && this.qrNum > config.qrMax) {
      spinner.info('QR Code limit reached, exiting...');
      await kill(waPage, null, true, null, "QR_LIMIT_REACHED")
    }
    const qrEv = this.qrEvF(config)
    if ((!this.qrNum || this.qrNum == 1) && BROWSER_START_TS) spinner.info(`First QR: ${Date.now() - BROWSER_START_TS} ms`)
    if (qrData) {
      qrEv.emit(qrData, `qrData`);
      if (!config.qrLogSkip) {
        if(isLinkCode) {
          console.log(boxen(qrData, {title: `ENTER THIS CODE ON THE HOST ACCOUNT DEVICE: ${config.sessionId}`, padding: 1, titleAlignment: 'center'}));
        } else {
          qrcode.generate(qrData, { small: true }, terminalQrCode => {
            console.log(boxen(terminalQrCode, {title: config.sessionId, padding: 1, titleAlignment: 'center'}));
          });
      }
      }
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
      const qrPng = isLinkCode ? qrData : await waPage.evaluate(`window.getQrPng()`);
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
            console.error(e)
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

  async linkCode(waPage: Page, config?: ConfigObject, spinner?: Spin): Promise<boolean | void | string> {
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
    spinner.info('Link Code requested, please use the link code to login from your host account device')
    const linkCode = await waPage.evaluate((number)=> window['linkCode'](number), config?.linkCode)
    spinner?.succeed(`Link Code please use this to login from your host account device: ${linkCode}`)
    await this.grabAndEmit(linkCode, waPage, config, spinner)
    return await isInsideChat(waPage).toPromise()
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
          spinner.emit(true,"MD_DETECT")
          return resolve(md)
        }
        if (!gotResult && (qrData === 'QR_CODE_SUCCESS' || qrData === md)) {
          gotResult = true;
          spinner?.succeed("QR code scanned. Loading session...")
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

  /**
   * Wait 10 seconds for the qr element to show.
   * If it doesn't show up within 10 seconds then assume the session is authed already or blocked therefore ignore and return promise
   */
  async waitFirstQr(waPage: Page, config?: ConfigObject, spinner?: Spin){
    /**
     * Check if session is authed already
     */
    const fqr = await waPage.waitForFunction(`!!(${this.qrCheck})`, {
      polling: 500,
      timeout: 10000
    })
    .catch(()=>false)
    if(fqr) await this.emitFirst(waPage,config,spinner);
    return;
  }
}
