import { Whatsapp } from '../api/whatsapp';
import {ConfigObject} from '../api/model/index';
import * as path from 'path';
import { isAuthenticated, isInsideChat, retrieveQR, randomMouseMovements } from './auth';
import { initWhatsapp, injectApi } from './browser';

import { EventEmitter2 } from 'eventemitter2';
import * as spinner from './step';
import * as qrSpin from './step';

import {ev} from './events';
const fs = require('fs');

var pjson = require('../../package.json');
const timeout = ms => {
  return new Promise(resolve => setTimeout(resolve, ms, 'timeout'));
}
let waPage;
let qrTimeout;
let shouldLoop = true;

export const evCreate = new EventEmitter2({
  wildcard: true
});


/**
 * Should be called to initialize whatsapp client
 */
export async function create(sessionId?: string, puppeteerConfigOverride?:ConfigObject, customUserAgent?:string) {
try{
  waPage = undefined;
  qrTimeout = undefined;
  shouldLoop = true;
  if (!sessionId) sessionId = 'session';
  spinner.eventEmitter(sessionId, evCreate);
  qrSpin.eventEmitter(sessionId, evCreate);  					
	  
  spinner.start('Initializing whatsapp');
  waPage = await initWhatsapp(sessionId, puppeteerConfigOverride, customUserAgent);
  spinner.succeed();
  const throwOnError=puppeteerConfigOverride&&puppeteerConfigOverride.throwErrorOnTosBlock==true;

  const PAGE_UA =  await waPage.evaluate('navigator.userAgent');
  const BROWSER_VERSION = await waPage.browser().version();
  const SULLA_HOTFIX_VERSION = pjson.version;
  //@ts-ignore
  const WA_VERSION = await waPage.evaluate(()=>window.Debug?window.Debug.VERSION:'I think you have been TOS_BLOCKed')
  
  console.log('Debug Info', {
    WA_VERSION,
    PAGE_UA,
    SULLA_HOTFIX_VERSION,
    BROWSER_VERSION
  })
  evCreate.emit(sessionId, 'DebugInfo' + JSON.stringify({
	WA_VERSION,
	PAGE_UA,
	SULLA_HOTFIX_VERSION,
	BROWSER_VERSION
  }));  
  

  //@ts-ignore
  const canInjectEarly = await waPage.evaluate(() => {return (typeof webpackJsonp !== "undefined")});
  //@ts-ignore
  const BROWSER_ID = canInjectEarly?await waPage.evaluate(() => {return webpackJsonp([],null,['bhaehigaaa'])?webpackJsonp([],null,['bhaehigaaa']).default.getBrowserId():''}):'';
    
  if(canInjectEarly) {
    spinner.start('Injecting api');
    waPage = await injectApi(waPage);
    spinner.start('WAPI injected');
  } else {
    console.log('Possilby TOS_BLOCKed')
	evCreate.emit(sessionId, 'Possilby TOS_BLOCKED');
	if(throwOnError) throw Error('TOSBLOCK');
  }

  spinner.start('Authenticating');
  let authenticated = await isAuthenticated(waPage);
  let autoRefresh = puppeteerConfigOverride ? puppeteerConfigOverride.autoRefresh : false;
 
  const qrLoop = async () => {
    if(!shouldLoop) return;
    console.log(' ')
    await retrieveQR(waPage,sessionId,autoRefresh,throwOnError);
    console.log(' ')
    qrTimeout = timeout((puppeteerConfigOverride?(puppeteerConfigOverride.qrRefreshS || 10):10)*1000);
    await qrTimeout;
    if(autoRefresh)qrLoop();
  };

  if (authenticated) {
    spinner.succeed('Authenticated');
  } else {
    spinner.info('Authenticate to continue');
    //const qrSpin = ora();
    qrSpin.start('Loading QR');
    qrSpin.succeed();
    qrLoop();
    const race = [];
    race.push(isInsideChat(waPage).toPromise());
    if(puppeteerConfigOverride&&puppeteerConfigOverride.killTimer){
      race.push(timeout(puppeteerConfigOverride.killTimer*1000))
    }
    const result = await Promise.race(race);
    if(result=='timeout') {
      console.log('Session timed out. Shutting down');
	  evCreate.emit(sessionId, 'QR Session timed out. Shutting down');	
      await kill();
      throw new Error('QR Timeout');
      
    }
    shouldLoop = false;
    clearTimeout(qrTimeout);
    spinner.succeed();
  }
  const pre = canInjectEarly? 'Rei':'I';
  spinner.start(`${pre}njecting api`);
  waPage = await injectApi(waPage);
  spinner.succeed(`WAPI ${pre}njected`);

  if(canInjectEarly) {
    //check if page is valid after 5 seconds
    spinner.start('Checking if session is valid');
    await timeout(5000);
  }

  //@ts-ignore
  const VALID_SESSION = await waPage.evaluate(()=>window.Store&&window.Store.Msg?true:false);
  if(VALID_SESSION)  {
    spinner.succeed('Whatsapp is ready');
    const localStorage = JSON.parse(await waPage.evaluate(() => {
      return JSON.stringify(window.localStorage);
  }));
  const sessionjsonpath = path.join(process.cwd(), `${sessionId || 'session'}.data.json`);
  const sessionData = {
    WABrowserId: localStorage.WABrowserId,
    WASecretBundle: localStorage.WASecretBundle,
    WAToken1: localStorage.WAToken1,
    WAToken2: localStorage.WAToken2
};

ev.emit(`sessionData${sessionId?`.${sessionId}`:``}`, sessionData, sessionId);

  fs.writeFile(sessionjsonpath, JSON.stringify(sessionData), (err) => {
  if (err) {  console.error(err);  return; };
});
    return new Whatsapp(waPage);
  }
  else {
    spinner.fail('The session is invalid. Retrying')
    await kill()
    return await create(sessionId,puppeteerConfigOverride,customUserAgent);
  }
} catch(e) {
	console.log('pegueii');
	evCreate.emit(sessionId, e.message);
	await kill();
	throw e;
}	
  
}

const kill = async () => {
  shouldLoop = false;
  if(qrTimeout) clearTimeout(qrTimeout);
  try{
  await waPage.close();
  await waPage.browser().close();
  }catch(e) {}
}
