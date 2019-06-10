import ora from 'ora';
import { Whatsapp } from '../api/whatsapp';
import { isAuthenticated, isInsideChat, retrieveQR } from './auth';
import { initWhatsapp, injectApi } from './browser';
const spinner = ora();

/**
 * Should be called to initialize whatsapp client
 */
export async function create() {
  spinner.start('Initializing whatsapp');
  let waPage = await initWhatsapp();
  spinner.succeed();

  spinner.start('Authenticating');
  const authenticated = await isAuthenticated(waPage);

  // If not authenticated, show QR and wait for scan
  if (authenticated) {
    spinner.succeed();
  } else {
    spinner.info('Authenticate to continue');
    await retrieveQR(waPage);

    // Wait til inside chat
    await isInsideChat(waPage).toPromise();
    spinner.succeed();
  }

  spinner.start('Injecting api');
  waPage = await injectApi(waPage);
  spinner.succeed('Whatsapp is ready');

  return new Whatsapp(waPage);
}
