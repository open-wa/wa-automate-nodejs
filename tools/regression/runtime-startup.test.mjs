import assert from 'node:assert/strict';
import { execFile, spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { copyFile, mkdtemp, mkdir, readFile, readdir, realpath, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const run = promisify(execFile);
const repoRoot = fileURLToPath(new URL('../../', import.meta.url));
const marker = 'OPENWA_STARTUP_RESULT ';
const roots = ['@open-wa/core', '@open-wa/wa-automate', '@open-wa/client', '@open-wa/cli', '@open-wa/driver-puppeteer'];
const runtimes = [
  { name: 'Node', executable: process.execPath },
  { name: 'Bun', executable: process.env.OPENWA_TEST_BUN || 'bun' },
];
const formats = ['commonjs', 'module'];
const runtimeEnv = Object.fromEntries(Object.entries(process.env).filter(([key]) =>
  !/^(WA_|OPENWA_|OPEN_WA_)/.test(key) && !['NODE_OPTIONS', 'NODE_PATH', 'BUN_OPTIONS'].includes(key)));
const entrypoints = [
  { package: '@open-wa/wa-automate', method: 'create', kind: 'create' },
  { package: '@open-wa/wa-automate', method: 'createClient', kind: 'core' },
  { package: '@open-wa/core', method: 'createClient', kind: 'core' },
  { package: '@open-wa/wa-automate', method: 'Client.start', kind: 'facade' },
  { package: '@open-wa/client', method: 'Client.start', kind: 'facade' },
  { package: '@open-wa/wa-automate', method: 'runCli', kind: 'cli-main' },
  { package: '@open-wa/wa-automate', method: 'startCli', kind: 'cli-start' },
  { package: '@open-wa/cli', method: 'main', kind: 'cli-main' },
  { package: '@open-wa/cli', method: 'start', kind: 'cli-start' },
];
let installation;
let chrome;
const binaries = [];

async function runtimePackages() {
  const workspaces = new Map();
  for (const root of ['packages', 'integrations', 'apps', 'sdks']) {
    let directories;
    try { directories = await readdir(join(repoRoot, root), { withFileTypes: true }); }
    catch (error) { if (error.code === 'ENOENT') continue; throw error; }
    for (const directory of directories) {
      if (!directory.isDirectory()) continue;
      const path = join(repoRoot, root, directory.name);
      try {
        const manifest = JSON.parse(await readFile(join(path, 'package.json'), 'utf8'));
        workspaces.set(manifest.name, { path, manifest });
      } catch (error) { if (error.code !== 'ENOENT') throw error; }
    }
  }
  const selected = new Map();
  function visit(name) {
    if (selected.has(name)) return;
    const pkg = workspaces.get(name);
    assert.ok(pkg && !pkg.manifest.private, `Missing public runtime package ${name}`);
    selected.set(name, pkg);
    for (const [dependency, version] of Object.entries({ ...pkg.manifest.dependencies, ...pkg.manifest.optionalDependencies })) {
      if (version.startsWith('workspace:')) visit(dependency);
    }
  }
  roots.forEach(visit);
  return selected;
}

before(async () => {
  for (const runtime of runtimes) {
    const { stdout } = await run(runtime.executable, ['--eval', 'console.log(JSON.stringify(process.versions))'], { env: runtimeEnv, timeout: 10_000 });
    const versions = JSON.parse(stdout);
    assert.ok(runtime.name === 'Bun' ? versions.bun : versions.node && !versions.bun, `Expected a real ${runtime.name} executable`);
    console.log(`# Startup runtime: ${runtime.name} ${versions.bun || versions.node}`);
  }
  // Node ESM URL-encodes this directory; both runtimes must locate real assets.
  installation = await realpath(await mkdtemp(join(tmpdir(), 'openwa-3559 space % ')));
  const tarballs = join(installation, 'tarballs');
  await mkdir(tarballs);
  const dependencies = {};
  const packages = await runtimePackages();
  if (process.env.OPENWA_TEST_VERSION) {
    for (const name of roots) dependencies[name] = process.env.OPENWA_TEST_VERSION;
  } else {
    // Pack every runtime workspace dependency so registry copies cannot hide bugs.
    for (const [name, pkg] of packages) {
      await run('pnpm', ['pack', '--pack-destination', tarballs], {
        cwd: pkg.path, timeout: 60_000, maxBuffer: 4 * 1024 * 1024,
      });
      const archive = `${name.replace('@', '').replace('/', '-')}-${pkg.manifest.version}.tgz`;
      dependencies[name] = `file:${join(tarballs, archive)}`;
    }
  }
  await writeFile(join(installation, 'package.json'), JSON.stringify({ private: true, dependencies }));
  await run('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', '--registry=https://registry.npmjs.org'], {
    cwd: installation, timeout: 180_000, maxBuffer: 4 * 1024 * 1024,
    env: { ...process.env, PUPPETEER_SKIP_DOWNLOAD: '1' },
  });
  const installedRequire = createRequire(join(installation, 'package.json'));
  if (!process.env.OPENWA_TEST_VERSION) {
    for (const pkg of packages.values()) {
      const consumer = createRequire(join(installation, 'node_modules', pkg.manifest.name, 'package.json'));
      for (const dependency of Object.keys({ ...pkg.manifest.dependencies, ...pkg.manifest.optionalDependencies })) {
        if (packages.has(dependency)) {
          // Type-only packages can deliberately have no require export.
          const found = consumer.resolve.paths(dependency).map(path => join(path, dependency))
            .find(path => existsSync(join(path, 'package.json')));
          assert.ok(found, `${pkg.manifest.name} must resolve ${dependency}`);
          assert.equal(await realpath(found), join(installation, 'node_modules', dependency), `${pkg.manifest.name} must use local ${dependency}`);
        }
      }
    }
  }
  const sdkRequire = createRequire(installedRequire.resolve('@open-wa/wa-automate'));
  chrome = process.env.OPENWA_TEST_CHROME || sdkRequire('chrome-launcher').Launcher.getInstallations()[0];
  assert.ok(chrome, 'Install Chrome or set OPENWA_TEST_CHROME to its executable.');
  for (const name of ['@open-wa/wa-automate', '@open-wa/cli']) {
    const pkg = JSON.parse(await readFile(join(installation, 'node_modules', name, 'package.json'), 'utf8'));
    // Derive this inventory from the packed manifests, including every alias.
    for (const [command, path] of Object.entries(pkg.bin)) {
      binaries.push({ package: name, command, path: join(installation, 'node_modules', name, path) });
    }
  }
  for (const name of ['qr-observer.cjs', 'startup-common.cjs', 'startup.cjs', 'startup.mjs']) {
    await copyFile(new URL(`./fixtures/${name}`, import.meta.url), join(installation, name));
  }
}, { timeout: 360_000 });

after(async () => {
  if (installation) await rm(installation, { recursive: true, force: true });
});

for (const runtime of runtimes) {
  for (const format of formats) {
    test(`${runtime.name} ${format} core resolves readable packaged assets from an escaped path`, async () => {
      const load = format === 'module'
        ? "import { Transport } from '@open-wa/core'; import { readFileSync } from 'node:fs';"
        : "const { Transport } = require('@open-wa/core'); const { readFileSync } = require('node:fs');";
      const script = `${load}
        const paths = [Transport.resolveWapiScriptPath(), Transport.resolveLaunchScriptPath()];
        for (const path of paths) {
          if (!readFileSync(path, 'utf8').trim()) throw new Error('Empty runtime asset: ' + path);
        }
        console.log(JSON.stringify(paths));`;
      const fixture = join(installation, `assets.${format === 'module' ? 'mjs' : 'cjs'}`);
      await writeFile(fixture, script);
      const { stdout } = await run(runtime.executable, [fixture], { cwd: installation, env: runtimeEnv, timeout: 20_000, maxBuffer: 1024 * 1024 });
      assert.deepEqual(JSON.parse(stdout.trim()), ['wapi.js', 'launch.js'].map(name =>
        join(installation, 'node_modules', '@open-wa', 'core', 'dist', 'transport', 'assets', name)));
    });
  }
}

async function freePort() {
  const server = createServer();
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const { port } = server.address();
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  return port;
}

async function reachesQr(runtime, entry, signal) {
  const id = 'startup-' + createHash('sha256').update(JSON.stringify({ runtime: runtime.name, entry })).digest('hex').slice(0, 12);
  const directory = join(installation, id);
  await mkdir(directory);
  const cli = entry.kind?.startsWith('cli') || entry.command;
  const rootOnLinux = process.platform === 'linux' && process.getuid() === 0;
  const config = {
    sessionId: id, sessionDataPath: join(directory, 'checkpoint'), userDataDir: join(directory, 'chrome-profile'),
    headless: true, executablePath: chrome, authTimeout: 0, qrTimeout: 0, qrLogSkip: !cli,
    chromiumArgs: rootOnLinux ? ['--no-sandbox', '--disable-setuid-sandbox'] : [], allowDangerousBrowserArgs: rootOnLinux,
    deleteSessionDataOnLogout: false, killClientOnLogout: false, logConsole: false, logConsoleErrors: false,
    host: '127.0.0.1', port: await freePort(),
  };
  const configPath = join(directory, 'wa.config.json');
  await writeFile(configPath, JSON.stringify(config));
  const args = entry.command
    ? [entry.path, '--config', configPath, '--non-interactive']
    : [join(installation, entry.format === 'module' ? 'startup.mjs' : 'startup.cjs')];
  const child = spawn(runtime.executable, args, {
    cwd: directory, stdio: ['ignore', 'pipe', 'pipe'], signal,
    env: { ...runtimeEnv, PUPPETEER_SKIP_DOWNLOAD: '1', OPENWA_STARTUP_CONFIG: configPath, OPENWA_STARTUP_ENTRY: JSON.stringify(entry) },
  });
  // close also fires after a failed spawn, when there is no process to exit.
  const exited = new Promise(resolve => child.once('close', resolve));
  let stdout = '';
  let stderr = '';
  let tail = '';
  let qr;
  let timeout;
  try {
    await new Promise((resolve, reject) => {
      const finish = () => {
        // CLI coverage includes the actual terminal renderer, not just an event.
        if ((entry.command || qr) && (!cli || (stdout.includes(`WhatsApp login: ${id}`) && /[\u2580-\u259f]/u.test(stdout)))) resolve();
      };
      timeout = setTimeout(() => reject(new Error(`No ${cli ? 'rendered ' : ''}QR within 90 seconds\n${stderr}\n${stdout}`)), 90_000);
      child.once('error', reject);
      child.once('exit', (code, signal) => reject(new Error(`Startup exited before QR (${code ?? signal})\n${stderr}\n${stdout}`)));
      child.stderr.setEncoding('utf8').on('data', chunk => { stderr = (stderr + chunk).slice(-12_000); });
      child.stdout.setEncoding('utf8').on('data', chunk => {
        stdout = (stdout + chunk).slice(-64_000);
        tail += chunk;
        const lines = tail.split('\n');
        tail = lines.pop();
        for (const line of lines) {
          if (!line.startsWith(marker)) continue;
          try {
            const message = JSON.parse(line.slice(marker.length));
            if (message.type === 'failure') reject(new Error(message.error));
            if (message.type === 'qr') {
              assert.equal(message.sessionId, id);
              assert.equal(message.namespace, 'qr');
              assert.equal(message.payloadType, 'string');
              assert.ok(message.length > 32, 'Expected a WhatsApp pairing payload');
              assert.equal(message.matchesNative, true, 'Public QR must match launch.auth.qr.generated');
              qr = message;
            }
          } catch (error) { reject(error); }
        }
        finish();
      });
    });
  } finally {
    clearTimeout(timeout);
    // Puppeteer owns the browser's SIGTERM cleanup; never target other sessions.
    child.kill('SIGTERM');
    let killTimeout;
    await Promise.race([exited, new Promise(resolve => { killTimeout = setTimeout(resolve, 5_000); })]);
    clearTimeout(killTimeout);
    if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
    await exited;
  }
}

test('all public startup entrypoints reach a real QR', { concurrency: 2, timeout: 30 * 60_000 }, async t => {
  const cases = [];
  for (const runtime of runtimes) {
    for (const format of formats) {
      for (const entry of entrypoints) {
        cases.push({ runtime, entry: { ...entry, format }, name: `${runtime.name} ${format} ${entry.package} ${entry.method} → QR` });
      }
    }
    for (const entry of binaries) {
      cases.push({ runtime, entry, name: `${runtime.name} ${entry.package} binary ${entry.command} → rendered QR` });
    }
  }
  const selected = process.env.OPENWA_STARTUP_CASE
    ? cases.filter(({ name }) => name.includes(process.env.OPENWA_STARTUP_CASE))
    : cases;
  assert.ok(selected.length > 0, 'OPENWA_STARTUP_CASE did not match a startup entrypoint');
  await Promise.all(selected.map(({ runtime, entry, name }) => t.test(name, { timeout: 120_000 }, child => reachesQr(runtime, entry, child.signal))));
});
