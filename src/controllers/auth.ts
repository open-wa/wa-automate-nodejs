import ora from 'ora';
import * as puppeteer from 'puppeteer';
import * as qrcode from 'qrcode-terminal';
import { from, merge } from 'rxjs';
import { take } from 'rxjs/operators';

const spinner = ora();

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
        `
        document.getElementsByClassName('app')[0] &&
        document.getElementsByClassName('app')[0].attributes &&
        !!document.getElementsByClassName('app')[0].attributes.tabindex
        `,
        {
          timeout: 0
        }
      )
      .then(() => true)
  );
};

export async function retrieveQR(waPage: puppeteer.Page) {
  spinner.start('Loading QR');
  await waPage.waitForSelector("img[alt='Scan me!']", { timeout: 0 });
  const qrImage = await waPage.evaluate(
    `document.querySelector("img[alt='Scan me!']").parentElement.getAttribute("data-ref")`
  );
  spinner.succeed();
  qrcode.generate(qrImage, {
    small: true
  });

  return true;
}
