import assert from 'node:assert/strict';
import { execFile, fork } from 'node:child_process';
import { copyFile, mkdtemp, mkdir, readdir, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const run = promisify(execFile);
const repoRoot = fileURLToPath(new URL('../../', import.meta.url));
let installation;

before(async () => {
  // ESM stack frames URL-encode this directory; CJS frames use filesystem paths.
  installation = await realpath(await mkdtemp(join(tmpdir(), 'openwa-3559 space % ')));
  const tarballs = join(installation, 'tarballs');
  await mkdir(tarballs);
  const dependencies = {};
  for (const name of ['core', 'wa-automate', 'driver-puppeteer']) {
    // Use a matched published package set only when demonstrating a known failure.
    if (process.env.OPENWA_TEST_VERSION) {
      dependencies[`@open-wa/${name}`] = process.env.OPENWA_TEST_VERSION;
      continue;
    }
    await run('pnpm', ['pack', '--pack-destination', tarballs], {
      cwd: join(repoRoot, 'packages', name), timeout: 60_000, maxBuffer: 4 * 1024 * 1024,
    });
    const archive = (await readdir(tarballs)).find(file => file.startsWith(`open-wa-${name}-`));
    assert.ok(archive, `Missing packed @open-wa/${name}`);
    dependencies[`@open-wa/${name}`] = `file:${join(tarballs, archive)}`;
  }
  await writeFile(join(installation, 'package.json'), JSON.stringify({ private: true, dependencies }));
  await run('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', '--registry=https://registry.npmjs.org'], {
    cwd: installation, timeout: 180_000, maxBuffer: 4 * 1024 * 1024,
    env: { ...process.env, PUPPETEER_SKIP_DOWNLOAD: '1' },
  });
}, { timeout: 240_000 });

after(async () => {
  if (installation) await rm(installation, { recursive: true, force: true });
});

for (const format of ['commonjs', 'module']) {
  test(`${format} core resolves readable packaged WAPI and launch assets from an escaped installation path`, async () => {
    const load = format === 'module'
      ? "import { Transport } from '@open-wa/core'; import { readFileSync } from 'node:fs';"
      : "const { Transport } = require('@open-wa/core'); const { readFileSync } = require('node:fs');";
    const script = `${load}
      const paths = [Transport.resolveWapiScriptPath(), Transport.resolveLaunchScriptPath()];
      for (const path of paths) {
        if (!readFileSync(path, 'utf8').trim()) throw new Error('Empty runtime asset: ' + path);
      }
      console.log(JSON.stringify(paths));`;
    const { stdout } = await run(process.execPath, [`--input-type=${format}`, '--eval', script], {
      cwd: installation, timeout: 20_000, maxBuffer: 1024 * 1024,
    });
    assert.deepEqual(JSON.parse(stdout.trim()), ['wapi.js', 'launch.js'].map(name =>
      join(installation, 'node_modules', '@open-wa', 'core', 'dist', 'transport', 'assets', name)));
  });
}

test('CommonJS create(configObject) emits matching native and public QR events without a phone scan', { timeout: 120_000 }, async () => {
  const fixture = join(installation, 'qr-startup.cjs');
  await copyFile(new URL('./fixtures/qr-startup.cjs', import.meta.url), fixture);
  const child = fork(fixture, [], {
    cwd: installation, stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
    env: { ...process.env, PUPPETEER_SKIP_DOWNLOAD: '1' },
  });
  let output = '';
  for (const stream of [child.stdout, child.stderr]) {
    stream.on('data', chunk => { output = (output + chunk).slice(-12_000); });
  }
  const exited = new Promise(resolve => child.once('exit', resolve));
  let timeout;
  try {
    const qr = await new Promise((resolve, reject) => {
      timeout = setTimeout(() => reject(new Error(`No QR event within 90 seconds\n${output}`)), 90_000);
      child.once('error', reject);
      child.once('exit', (code, signal) => reject(new Error(`Startup exited before QR (${code ?? signal})\n${output}`)));
      child.on('message', message => {
        if (message.type === 'qr') resolve(message);
        if (message.type === 'failure') reject(new Error(`${message.error}\n${output}`));
      });
    });
    assert.equal(qr.sessionId, 'regression-3559');
    assert.equal(qr.namespace, 'qr');
    assert.equal(qr.payloadType, 'string');
    assert.ok(qr.length > 32, 'Expected a nonempty WhatsApp pairing payload');
    assert.equal(qr.matchesNative, true, 'Public QR must match launch.auth.qr.generated');
  } finally {
    clearTimeout(timeout);
    // Puppeteer's SIGTERM handler closes only the Chrome instance this child owns.
    child.kill('SIGTERM');
    let killTimeout;
    await Promise.race([exited, new Promise(resolve => { killTimeout = setTimeout(resolve, 5_000); })]);
    clearTimeout(killTimeout);
    if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
    await exited;
  }
});
