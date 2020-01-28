import ora from 'ora';
import { Whatsapp } from '../api/whatsapp';
import * as path from 'path';
import { isAuthenticated, isInsideChat, retrieveQR, randomMouseMovements } from './auth';
import { initWhatsapp, injectApi } from './browser';
const spinner = ora();
let shouldLoop = true;
const timeout = ms => {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Should be called to initialize whatsapp client
 */
export async function create(sessionId?: string, puppeteerConfigOverride?:any, customUserAgent?:string) {
  if (!sessionId) sessionId = 'session';
  spinner.start('Initializing whatsapp');
  let waPage = await initWhatsapp(sessionId, puppeteerConfigOverride, customUserAgent);
  spinner.succeed();


  spinner.start('Authenticating');
  let authenticated = await isAuthenticated(waPage);

  const qrLoop = async () => {
    if(!shouldLoop) return;
    console.log(' ')
    await retrieveQR(waPage,sessionId);
    console.log(' ')
    await timeout((puppeteerConfigOverride.qrRefreshS || 10)*1000);
    qrLoop();
  };

  if (authenticated) {
    spinner.succeed();
  } else {
    spinner.info('Authenticate to continue');
    const qrSpin = ora();
    qrSpin.start('Loading QR');
    qrSpin.succeed();
    qrLoop();
    await isInsideChat(waPage).toPromise();
    shouldLoop = false;
    spinner.succeed();
  }

  spinner.start('Injecting api');
  waPage = await injectApi(waPage);
  
  spinner.succeed('Whatsapp is ready');

  return new Whatsapp(waPage);
}
