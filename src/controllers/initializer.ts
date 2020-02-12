import { Whatsapp } from '../api/whatsapp';
import * as path from 'path';
import { isAuthenticated, isInsideChat, retrieveQR, randomMouseMovements } from './auth';
import { initWhatsapp, injectApi } from './browser';
import { EventEmitter2 } from 'eventemitter2';
import * as spinner from './step';
import * as qrSpin from './step';

let shouldLoop = true;
var pjson = require('../../package.json');

const timeout = ms => {
  return new Promise(resolve => setTimeout(resolve, ms, 'timeout'));
}
let waPage;
let qrTimeout;


export const evCreate = new EventEmitter2({
  wildcard: true
});

/**
 * Should be called to initialize whatsapp client
 */
export async function create(sessionId?: string, puppeteerConfigOverride?:any, customUserAgent?:string) {
  if (!sessionId) sessionId = 'session';
  
  spinner.eventEmitter(sessionId, evCreate); 
  spinner.start('Initializing whatsapp');
  
  waPage = await initWhatsapp(sessionId, puppeteerConfigOverride, customUserAgent);
  spinner.succeed();

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
  evCreate.emit(sessionId, 'Debug Info' + JSON.stringify({
    WA_VERSION,
    PAGE_UA,
    SULLA_HOTFIX_VERSION,
    BROWSER_VERSION
  }));

  //check if you can inject early
  //@ts-ignore
  const canInjectEarly = await waPage.evaluate(() => {return (typeof webpackJsonp !== "undefined")});
  if(canInjectEarly) {
    spinner.start('Injecting api');	
    waPage = await injectApi(waPage);
    spinner.start('WAPI injected');
  } else {
    console.log('Possilby TOS_BLOCKED')
	evCreate.emit(sessionId, 'Possilby TOS_BLOCKED');
  }  

  spinner.start('Authenticating');  
  
  let authenticated = await isAuthenticated(waPage);
  let autoRefresh = puppeteerConfigOverride ? puppeteerConfigOverride.autoRefresh : false;
 
  const qrLoop = async () => {
    if(!shouldLoop) return;
    console.log(' ')
    await retrieveQR(waPage,sessionId,autoRefresh,puppeteerConfigOverride&&puppeteerConfigOverride.throwErrorOnTosBlock==true);
    console.log(' ')
    qrTimeout = timeout((puppeteerConfigOverride?(puppeteerConfigOverride.qrRefreshS || 10):10)*1000);
    await qrTimeout;
    if(autoRefresh) qrLoop();
  };

  if (authenticated) {
    spinner.succeed();
  } else {
	spinner.info('Authenticate to continue');
	
    //const qrSpin = ora();
	qrSpin.eventEmitter(sessionId, evCreate);
    qrSpin.start('Loading QR');
    qrSpin.succeed();
    qrLoop().catch(e => {
		if(e.message === 'TOSBLOCK')
		return;
		throw new Error(e.message)
	});
    const race = [];
    race.push(isInsideChat(waPage).toPromise());
    if(puppeteerConfigOverride&&puppeteerConfigOverride.killTimer){
      race.push(timeout(puppeteerConfigOverride.killTimer*1000))
    }
    const result = await Promise.race(race);
    if(result=='timeout') {
      console.log('QR Session timed out. Shutting down')
	  evCreate.emit(sessionId, 'QR Session timed out. Shutting down');
      await kill();
      throw new Error('QR Timeout');
      
    }
    shouldLoop = false;
    clearTimeout(qrTimeout);
    spinner.succeed();
  }
  if(canInjectEarly) {
    //check if page is valid after 5 seconds
    spinner.start('Checking if session is valid');
    await timeout(5000);
  } else {
    spinner.start('Injecting api');
    waPage = await injectApi(waPage);
  }

  //@ts-ignore
  const VALID_SESSION = await waPage.evaluate(()=>window.Store&&window.Store.Msg?true:false);
  if(VALID_SESSION)  {
    spinner.succeed('Whatsapp is ready');
    return new Whatsapp(waPage);
  }
  else {
    spinner.fail('The session is invalid. Retrying');
    await kill()
    return await create(sessionId,puppeteerConfigOverride,customUserAgent);
  }
}

const kill = async () => {
  shouldLoop = false;
if(qrTimeout) clearTimeout(qrTimeout);
  await waPage.close();
  await waPage.browser().close();
}
