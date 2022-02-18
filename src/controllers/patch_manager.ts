import * as crypto from 'crypto';
import { ConfigObject } from '../api/model/index';
import { Spin } from './events';
import { SessionInfo } from '../api/model/sessionInfo';
import { Page } from 'puppeteer';
import { pkg } from './initializer';
import axios from 'axios';
import { existsSync, readFileSync, writeFileSync, statSync } from 'fs';
const { default: PQueue } = require("p-queue");
const queue = new PQueue();

/**
 * @private
 */
export async function getPatch(config: ConfigObject, spinner?: Spin, sessionInfo?: SessionInfo): Promise<{
  data: any;
  tag: string;
}> {
  var data = null;
  var headers : any = {};
  const ghUrl = `https://raw.githubusercontent.com/open-wa/wa-automate-nodejs/master/patches.json`;
  const hasSpin = !!spinner;
  const patchFilePath = `${process.cwd()}/patches.ignore.data.json`;
  /**
   * If cachedPatch is true then search for patch in current working directory.
   */
  if(config?.cachedPatch) {
    spinner.info('Searching for cached patch');
    // open file called patches.json and read as string
    if(existsSync(patchFilePath)) {
      spinner.info('Found cached patch');
      const lastModifiedDate = statSync(patchFilePath).mtimeMs;
      /**
       * Check if patchFilePath file is more than 1 day old
       */
      if((lastModifiedDate + 86400000) < Date.now()) {
        //this patch is stale.
        spinner.fail('Cached patch is stale.');
      } else {
        const patch = readFileSync(patchFilePath, 'utf8');
        data = JSON.parse(patch);
        spinner.info('Cached patch loaded');
      }
    } else spinner.fail('Cached patch not found');
  }
  
  const freshPatchFetchPromise : () => Promise<{data:any, tag: string}> = () => new Promise(async (resolve, reject) => {
    const patchesBaseUrl = config?.ghPatch ? ghUrl : pkg.patches;
    const patchesUrl = patchesBaseUrl + `?wv=${sessionInfo.WA_VERSION}&wav=${sessionInfo.WA_AUTOMATE_VERSION}`;
    if (!spinner)
      spinner = new Spin(config.sessionId, "FETCH_PATCH", config.disableSpins, true);
    spinner?.start(`Downloading ${config?.cachedPatch ? 'cached ' : ''}patches from ${patchesBaseUrl}`, hasSpin ? undefined : 2);
    const START = Date.now();
    var { data, headers } = await axios.get(patchesUrl).catch(() => {
      spinner?.info('Downloading patches. Retrying.');
      return axios.get(`${ghUrl}?v=${Date.now()}`);
    });
    const END = Date.now();
    if (!headers['etag']) {
      spinner?.info('Generating patch hash');
      headers['etag'] = crypto.createHash('md5').update(typeof data === 'string' ? data : JSON.stringify(data)).digest("hex").slice(-5);
    }
    spinner?.succeed(`Downloaded patches in ${(END - START) / 1000}s`);
    if(config?.cachedPatch) {
      //save patches.json to current working directory
      spinner?.info('Saving patches to current working directory');
      writeFileSync(patchFilePath, JSON.stringify(data, null, 2));
      spinner?.succeed('Saved patches to current working directory');
    }
    return resolve({
      data,
      tag: `${(headers.etag || '').replace(/"/g, '').slice(-5)}`
    });
  });
  if(config?.cachedPatch && data) {
    queue.add(freshPatchFetchPromise);
    return { data, tag: `CACHED-${(crypto.createHash('md5').update(typeof data === 'string' ? data : JSON.stringify(data)).digest("hex").slice(-5)).replace(/"/g, '').slice(-5)}` };
  } else return await freshPatchFetchPromise();
}
/**
 * @private
 * @param page
 * @param spinner
 */

export async function injectLivePatch(page: Page, patch: {
  data: any;
  tag: string;
}, spinner?: Spin): Promise<void> {
  const { data, tag } = patch;
  spinner?.info('Installing patches');
  await Promise.all(data.map(patch => page.evaluate(`${patch}`)));
  spinner?.succeed(`Patches Installed: ${tag}`);
}
/**
 * @private
 */

export async function getAndInjectLivePatch(page: Page, spinner?: Spin, preloadedPatch?: {
  data: any;
  tag: string;
}, config?: ConfigObject, sessionInfo?: SessionInfo): Promise<void> {
  let patch = preloadedPatch;
  if (!patch)
    patch = await getPatch(config, spinner, sessionInfo);
  await injectLivePatch(page, patch, spinner);
}
/**
 * @private
 */

export async function getLicense(config: ConfigObject, me: {
  _serialized: string;
}, debugInfo: SessionInfo, spinner?: Spin): Promise<string | false> {
  if (!config?.licenseKey || !me?._serialized)
    return false;
  const hasSpin = !!spinner;
  if (!spinner)
    spinner = new Spin(config.sessionId || "session", "FETCH_LICENSE", config.disableSpins, true);
  spinner?.start(`Fetching License: ${Array.isArray(config.licenseKey) ? config.licenseKey : typeof config.licenseKey === "string" ? config.licenseKey.indexOf("-") == -1 ? config.licenseKey.slice(-4) : config.licenseKey.split("-").slice(-1)[0] : config.licenseKey}`, hasSpin ? undefined : 2);
  try {
    const START = Date.now();
    const { data } = await axios.post(pkg.licenseCheckUrl, { key: config.licenseKey, number: me._serialized, ...debugInfo });
    const END = Date.now();
    spinner?.succeed(`Downloaded License in ${(END - START) / 1000}s`);
    return data;
  } catch (error) {
    spinner?.fail(`License request failed: ${error.statusCode || error.status || error.code} ${error.message}`);
    return false;
  }
}

export async function earlyInjectionCheck(page: Page): Promise<(page: Page) => boolean> {
  //@ts-ignore
  await page.waitForFunction(()=>Object.entries(window).filter(([, o]) => o && o.push && (o.push != [].push))[0] ? true : false, { timeout: 10, polling: 500 }).catch(()=>{})
  //@ts-ignore
  return await page.evaluate(() => { if (window.webpackChunkwhatsapp_web_client) { window.webpackChunkbuild = window.webpackChunkwhatsapp_web_client; } else { (function () { const f = Object.entries(window).filter(([, o]) => o && o.push && (o.push != [].push)); if (f[0]) { window.webpackChunkbuild = window[f[0][0]]; } })(); } return (typeof window.webpackChunkbuild !== "undefined"); });
}

export async function getAndInjectLicense(page: Page, config: ConfigObject, me: {
  _serialized: string;
}, debugInfo: SessionInfo, spinner?: Spin, preloadedLicense?: string | false): Promise<boolean> {
  if (!config?.licenseKey || !me?._serialized)
    return false;
  let l_err;
  let data = preloadedLicense;
  spinner?.info('Checking License');
  try {
    if (!data) {
      spinner?.info('Fethcing License...');
      data = await getLicense(config, me, debugInfo, spinner);
    }
    if (data) {
      spinner?.info('Injecting License...');
      const l_success = await page.evaluate(data => eval(data), data);
      if (!l_success) {
        spinner?.info('License injection failed. Getting error..');
        l_err = await page.evaluate('window.launchError');
      } else {
        spinner?.info('License injected successfully..');
        const keyType = await page.evaluate('window.KEYTYPE || false');
        spinner?.succeed(`License Valid${keyType ? `: ${keyType}` : ''}`);
        return true;
      }
    } else
      l_err = "The key is invalid";
    if (l_err) {
      spinner?.fail(`License issue${l_err ? `: ${l_err}` : ""}`);
    }
    return false;
  } catch (error) {
    spinner?.fail(`License request failed: ${error.statusCode || error.status || error.code} ${error.message}`);
    return false;
  }
}

// export * from './init_patch';