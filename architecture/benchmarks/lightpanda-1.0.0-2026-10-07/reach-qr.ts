import { LightpandaDriver } from '../../../packages/driver-lightpanda/src/LightpandaDriver';
import { writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { execFile } from 'node:child_process';

const executablePath = process.env.LIGHTPANDA_EXECUTABLE_PATH;
if (!executablePath) throw new Error('Set LIGHTPANDA_EXECUTABLE_PATH to the separate UA-enabled v1 executable; see qr-experiment.md.');
const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36';
const started = performance.now();
const driver = new LightpandaDriver();
await driver.init();
const browser = await driver.launch({ executablePath, timeoutMs: 15000, lightpanda: { experimentalWhatsApp: true, disableTelemetry: true } });
const page = await browser.newPage();
const errors: string[] = [];
const observations: unknown[] = [];
let reached = false;
let peakRssKiB = 0;
let elapsedMs: number | undefined;
const pid = browser.processId?.();
const sampler = setInterval(() => {
  if (pid) execFile('ps', ['-o', 'rss=', '-p', String(pid)], (error, output) => {
    if (!error) peakRssKiB = Math.max(peakRssKiB, Number(output.trim()) || 0);
  });
}, 100);
const raw = page.unwrap() as any;
raw.on('pageerror', (error: Error) => { errors.push(error.message); console.error('pageerror', error.message); });
try {
  await page.setUserAgent(ua);
  await page.goto('https://web.whatsapp.com/', { waitUntil: 'domcontentloaded', timeoutMs: 30000 });
  for (let i = 0; i < 60; i++) {
    const snapshot = await page.evaluateScript<any>(`({
      url:location.href,title:document.title,text:document.body?.innerText?.slice(0,1000),ua:navigator.userAgent,
      qr:document.querySelector('[data-ref]')?.getAttribute('data-ref'),canvas:document.querySelectorAll('canvas').length,
      refs:document.querySelectorAll('[data-ref]').length,sw:typeof navigator.serviceWorker,caches:typeof caches
    })`);
    observations.push({ ...snapshot, qr: snapshot.qr ? 'present' : null });
    if (i === 0 || i % 10 === 0 || snapshot.qr) console.log('progress', JSON.stringify({ ...snapshot, qr: snapshot.qr ? 'present' : null }));
    if (snapshot.qr) {
      elapsedMs = Math.round(performance.now() - started);
      const require = createRequire(import.meta.url);
      await require('qrcode').toFile(new URL('./lightpanda-qr.png', import.meta.url).pathname, snapshot.qr, { width: 512 });
      reached = true;
      console.log('QR_REACHED', JSON.stringify({ elapsedMs, peakRssMiB: Math.round(peakRssKiB / 1024 * 10) / 10 }));
      break;
    }
    if (/Browser not supported|To use WhatsApp, update/i.test(snapshot.text)) throw new Error(snapshot.text);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  if (!reached) throw new Error('WhatsApp did not generate a QR before the deadline.');
} finally {
  clearInterval(sampler);
  await writeFile(new URL('./qr-progress.json', import.meta.url), JSON.stringify({
    recordedAt: new Date().toISOString(), outcome: reached ? 'QR_REACHED' : 'NO_QR', executablePath,
    experimentalWhatsApp: true, elapsedMs, peakRssMiB: Math.round(peakRssKiB / 1024 * 10) / 10, errors, observations,
    limits: ['UA-enabled local binary, not stock v1', 'CryptoKey references survive only this page', 'No login or message delivery exercised', 'QR image re-encoded from WhatsApp data-ref; not a browser screenshot'],
  }, null, 2) + '\n');
  await browser.close();
}
