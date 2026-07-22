import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { cpus, homedir, platform, release, tmpdir, totalmem } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const DRIVER_LOADERS = {
  puppeteer: async () => new (await import('../packages/driver-puppeteer/dist/index.cjs')).PuppeteerDriver(),
  playwright: async () => new (await import('../packages/driver-playwright/dist/index.cjs')).PlaywrightDriver('chromium'),
  lightpanda: async () => new (await import('../packages/driver-lightpanda/dist/index.cjs')).LightpandaDriver(),
};

function parseArgs(argv) {
  const value = (flag, fallback) => {
    const index = argv.indexOf(flag);
    return index === -1 ? fallback : argv[index + 1];
  };
  if (argv.includes('--help')) return { help: true };

  const driver = value('--driver', 'puppeteer');
  const mode = value('--mode', 'browser');
  if (!(driver in DRIVER_LOADERS)) throw new Error(`Unsupported driver: ${driver}`);
  if (!['browser', 'session'].includes(mode)) throw new Error(`Unsupported mode: ${mode}`);

  const profileRoot = value('--profile-root');
  if (mode === 'session' && !profileRoot) {
    throw new Error('--profile-root is required for authenticated full-session benchmarks');
  }

  return {
    help: false,
    driver,
    mode,
    samples: Number(value('--samples', '5')),
    concurrency: value('--concurrency', '1,3').split(',').map(Number),
    url: value('--url', mode === 'session' ? 'https://web.whatsapp.com' : 'about:blank'),
    executablePath: value('--executable-path'),
    profileRoot: profileRoot ? resolve(profileRoot.replace(/^~(?=\/)/, homedir())) : undefined,
    output: value('--output'),
    timeoutMs: Number(value('--timeout-ms', '120000')),
  };
}

function printHelp() {
  console.log(`Usage: pnpm bench:runtime:real -- [options]

  --driver puppeteer|playwright|lightpanda
  --mode browser|session
  --samples 5
  --concurrency 1,3
  --url about:blank
  --executable-path /path/to/browser
  --profile-root /path/to/authenticated/profiles
  --timeout-ms 120000
  --output architecture/benchmarks/runtime-host.json

Session mode runs the complete open-wa startup and requires one authenticated
profile per concurrency slot at <profile-root>/session-0, session-1, etc.`);
}

async function processTreeRssMb(rootPid = process.pid) {
  if (!['darwin', 'linux'].includes(platform())) {
    throw new Error(`Process-tree RSS sampling is not implemented for ${platform()}`);
  }

  const { stdout } = await execFileAsync('ps', ['-axo', 'pid=,ppid=,rss=']);
  const rows = stdout.trim().split('\n').map((line) => {
    const [pid, ppid, rssKb] = line.trim().split(/\s+/).map(Number);
    return { pid, ppid, rssKb };
  });
  const children = new Map();
  for (const row of rows) {
    const list = children.get(row.ppid) ?? [];
    list.push(row);
    children.set(row.ppid, list);
  }

  let rssKb = 0;
  const pending = [...(children.get(rootPid) ?? [])];
  while (pending.length > 0) {
    const row = pending.pop();
    rssKb += row.rssKb;
    pending.push(...(children.get(row.pid) ?? []));
  }
  return rssKb / 1024;
}

async function measure(run) {
  let peakBrowserTreeRssMb = 0;
  let sampling = true;
  const sampler = (async () => {
    while (sampling) {
      peakBrowserTreeRssMb = Math.max(peakBrowserTreeRssMb, await processTreeRssMb());
      await new Promise((resolveDelay) => setTimeout(resolveDelay, 50));
    }
  })();
  const startedAt = performance.now();

  try {
    const value = await run();
    return {
      durationMs: Math.round(performance.now() - startedAt),
      peakBrowserTreeRssMb: Number(peakBrowserTreeRssMb.toFixed(1)),
      ...value,
    };
  } finally {
    sampling = false;
    await sampler;
  }
}

async function launchBrowser(options, slot, cleanup) {
  const driver = await DRIVER_LOADERS[options.driver]();
  await driver.init();
  const temporaryProfile = options.profileRoot
    ? undefined
    : await mkdtemp(join(tmpdir(), `openwa-${options.driver}-${slot}-`));
  const userDataDir = options.profileRoot
    ? join(options.profileRoot, `session-${slot}`)
    : temporaryProfile;
  await mkdir(userDataDir, { recursive: true });

  const browser = await driver.launch({
    headless: true,
    executablePath: options.executablePath,
    userDataDir,
    timeoutMs: options.timeoutMs,
  });
  cleanup.push(async () => browser.close());
  if (temporaryProfile) cleanup.push(async () => rm(temporaryProfile, { recursive: true, force: true }));

  const page = await browser.newPage();
  await page.goto(options.url, { waitUntil: 'domcontentloaded', timeoutMs: options.timeoutMs });
  return { browserVersion: await browser.versionString() };
}

async function launchSession(options, slot, cleanup) {
  const [{ createClient }, driver] = await Promise.all([
    import('../packages/core/dist/index.mjs'),
    DRIVER_LOADERS[options.driver](),
  ]);
  const client = await createClient({
    sessionId: `benchmark-${slot}`,
    driver,
    headless: true,
    executablePath: options.executablePath,
    userDataDir: join(options.profileRoot, `session-${slot}`),
    waWebUrl: options.url,
    navigationTimeoutMs: options.timeoutMs,
    authTimeoutMs: options.timeoutMs,
    qrTimeoutMs: options.timeoutMs,
  });
  cleanup.push(async () => client.stop('benchmark-complete'));
  await client.start();
  return { readiness: client.getReadiness() };
}

async function runGroup(options, concurrency) {
  const cleanup = [];
  try {
    return await measure(async () => {
      const sessions = await Promise.all(Array.from({ length: concurrency }, (_, slot) =>
        options.mode === 'session'
          ? launchSession(options, slot, cleanup)
          : launchBrowser(options, slot, cleanup)));
      return { sessions };
    });
  } finally {
    for (const releaseResource of cleanup.reverse()) {
      await releaseResource().catch(() => undefined);
    }
  }
}

function summarize(samples) {
  const percentile = (values, ratio) => {
    const sorted = [...values].sort((a, b) => a - b);
    return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * ratio) - 1)];
  };
  return {
    samples,
    medianDurationMs: percentile(samples.map((sample) => sample.durationMs), 0.5),
    p95DurationMs: percentile(samples.map((sample) => sample.durationMs), 0.95),
    medianPeakBrowserTreeRssMb: percentile(samples.map((sample) => sample.peakBrowserTreeRssMb), 0.5),
    p95PeakBrowserTreeRssMb: percentile(samples.map((sample) => sample.peakBrowserTreeRssMb), 0.95),
  };
}

const options = parseArgs(process.argv.slice(2));
if (options.help) {
  printHelp();
  process.exit(0);
}
if (!Number.isInteger(options.samples) || options.samples < 1) {
  throw new Error(`Invalid sample count: ${options.samples}`);
}
if (!options.executablePath && options.driver !== 'lightpanda') {
  const { Launcher } = await import('chrome-launcher');
  options.executablePath = Launcher.getInstallations()[0];
  if (!options.executablePath) {
    throw new Error('No local Chrome installation found; pass --executable-path');
  }
}

const results = {};
for (const concurrency of options.concurrency) {
  if (!Number.isInteger(concurrency) || concurrency < 1) throw new Error(`Invalid concurrency: ${concurrency}`);
  const samples = [];
  for (let index = 0; index < options.samples; index += 1) {
    samples.push(await runGroup(options, concurrency));
  }
  results[`${concurrency}Session`] = {
    cold: samples[0],
    warm: summarize(samples.slice(1).length > 0 ? samples.slice(1) : samples),
  };
}

const report = {
  benchmark: 'openwa-real-runtime',
  recordedAt: new Date().toISOString(),
  scope: options.mode === 'session' ? 'authenticated-openwa-readiness' : 'browser-navigation',
  driver: options.driver,
  mode: options.mode,
  url: options.url,
  host: {
    platform: platform(),
    release: release(),
    arch: process.arch,
    node: process.version,
    cpu: cpus()[0]?.model,
    cpuCount: cpus().length,
    totalMemoryMb: Math.round(totalmem() / 1024 / 1024),
  },
  results,
};

const output = `${JSON.stringify(report, null, 2)}\n`;
if (options.output) {
  await mkdir(dirname(resolve(options.output)), { recursive: true });
  await writeFile(resolve(options.output), output);
}
console.log(output);
