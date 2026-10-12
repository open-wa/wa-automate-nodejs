import { LightpandaDriver } from '../../../packages/driver-lightpanda/src/LightpandaDriver';
import { writeFile, readFile } from 'node:fs/promises';

const output: Record<string, unknown> = { recordedAt: new Date().toISOString(), sourceRuntime: 'Bun imports current TypeScript source; no build; no existing session profiles' };
const driver = new LightpandaDriver();
await driver.init();
let browser;
try {
  browser = await driver.launch({ executablePath: process.env.LIGHTPANDA_EXECUTABLE_PATH, timeoutMs: 15000 });
  const page = await browser.newPage();
  await page.exposeFunction('benchCallback', (value: number) => value * 2);
  output.driver = { connected: browser.isConnected(), version: await browser.versionString(),
    bridge: await page.evaluateScript('benchCallback(21)'),
    nativeUserAgent: await page.evaluateScript('navigator.userAgent') };
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36');
  (output.driver as Record<string, unknown>).userAgentAfterOverride = await page.evaluateScript('navigator.userAgent');
} catch (error) {
  output.driverError = error instanceof Error ? error.message : String(error);
} finally {
  await browser?.close();
}
let coreImported = false;
try {
  const { createClient } = await import('../../../packages/core/src/createClient');
  coreImported = true;
  await createClient({ driver: new LightpandaDriver(), sessionId: 'lightpanda-v1-benchmark-noauth',
    headless: true, lightpanda: { executablePath: process.env.LIGHTPANDA_EXECUTABLE_PATH },
  });
  output.createClient = { status: 'accepted' };
} catch (error) {
  output.createClient = { status: coreImported ? 'rejected' : 'import_failed', error: error instanceof Error ? error.message : String(error) };
}
const source = await readFile(new URL('../../../packages/core/src/createClient.ts', import.meta.url), 'utf8');
output.sourceGuard = { file: 'packages/core/src/createClient.ts', line: 228,
  present: source.includes("throw new Error('Compact authentication requires Puppeteer or Playwright')"),
  acceptedDrivers: ['puppeteer', 'playwright'], evidence: 'Current working-tree source inspection; runtime import result recorded separately' };
await writeFile(new URL('./repository-probe.json', import.meta.url), JSON.stringify(output, null, 2) + '\n');
console.log(JSON.stringify(output, null, 2));
