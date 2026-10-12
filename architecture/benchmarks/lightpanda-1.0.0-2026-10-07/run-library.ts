import { create, setCliOutputSink } from '../../../packages/wa-automate/src/index';
import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { createWriteStream } from 'node:fs';
import { LightpandaDriver } from '../../../packages/driver-lightpanda/src/LightpandaDriver';

const executablePath = process.env.LIGHTPANDA_EXECUTABLE_PATH;
if (!executablePath) throw new Error('Set LIGHTPANDA_EXECUTABLE_PATH to the prepared UA-enabled binary.');
const sessionId = `lightpanda-library-${Date.now()}`;
const outputDirectory = join('/tmp/openwa-lightpanda-qr', sessionId);
await mkdir(outputDirectory, { recursive: true, mode: 0o700 });
const require = createRequire(import.meta.url);
const qrcode = require('qrcode');
const summary: Record<string, unknown> = { sessionId, executablePath, startedAt: new Date().toISOString(), stage: 'starting', qrCount: 0 };
const save = () => writeFile(join(outputDirectory, 'status.json'), JSON.stringify(summary, null, 2) + '\n');
await save();
console.log('LIBRARY_RUN', JSON.stringify({ sessionId, outputDirectory }));
setCliOutputSink({
  write(entry) { console.log(entry.level, entry.message); },
  status(update) { console.log('status', update.phase); },
  qr(payload) {
    void (async () => {
      const path = join(outputDirectory, 'live-qr.png');
      await qrcode.toFile(path, payload.qr, { width: 512 });
      summary.stage = 'awaiting_scan';
      summary.qrCount = Number(summary.qrCount) + 1;
      summary.qrAt = new Date().toISOString();
      await save();
      console.log('QR_LIVE', JSON.stringify({ path, sessionId }));
    })().catch(error => console.error('QR_OUTPUT_FAILED', error.message));
  },
});
let client: Awaited<ReturnType<typeof create>> | undefined;
let starting: ReturnType<typeof create> | undefined;
let browser: Awaited<ReturnType<LightpandaDriver['launch']>> | undefined;
let stopping = false;
const driver = new LightpandaDriver();
const launch = driver.launch.bind(driver);
driver.launch = async options => {
  browser = await launch(options);
  const child = (browser as any).processManager?.child;
  const engineLog = createWriteStream(join(outputDirectory, 'engine.log'), { mode: 0o600 });
  child?.stderr?.on('data', (data: Buffer) => engineLog.write(data));
  child?.once('exit', (code: number, signal: string) => {
    summary.engineExit = { code, signal };
    engineLog.end();
    console.log('LIGHTPANDA_EXIT', JSON.stringify({ code, signal }));
  });
  if (stopping) { await browser.close(); throw new Error('Requested run stopped'); }
  return browser;
};
async function stop() {
  if (stopping) return;
  stopping = true;
  if (client) await client.stop('requested-run-ended');
  else { await browser?.close(); await starting?.catch(() => undefined); }
  summary.stage = 'stopped';
  summary.stoppedAt = new Date().toISOString();
  await save();
  process.exit(0);
}
process.once('SIGINT', stop);
process.once('SIGTERM', stop);
try {
  starting = create({
    sessionId, driver, useLightpanda: true, headless: true,
    lightpanda: { executablePath, experimentalWhatsApp: true, disableTelemetry: true },
    sessionDataPath: join(outputDirectory, 'session'),
    qrTimeout: 0, authTimeout: 0, watermark: false,
    blockAssets: false, logConsoleErrors: true,
  });
  client = await starting;
  summary.stage = 'ready';
  summary.readyAt = new Date().toISOString();
  summary.state = client.getState();
  await save();
  console.log('LIBRARY_READY', JSON.stringify({ state: client.getState(), outputDirectory }));
  await new Promise(() => {});
} catch (error) {
  summary.stage = 'failed';
  summary.error = error instanceof Error ? error.message : String(error);
  await save();
  console.error('LIBRARY_FAILED', error);
  process.exitCode = 1;
}
