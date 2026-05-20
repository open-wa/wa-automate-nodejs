import { describe, it, expect, afterEach } from 'vitest';
import { createClient, OpenWAClient } from '../../src/createClient.js';
import { PuppeteerDriver } from '@open-wa/driver-puppeteer';
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const runCreateClientE2E = process.env.OPENWA_CORE_E2E === 'true';
const describeCreateClientE2E = runCreateClientE2E ? describe : describe.skip;

function findChromePath(): string | undefined {
  const commandPath = findChromeFromCommand();
  if (commandPath) {
    return commandPath;
  }

  return getKnownChromePaths().find((candidate) => existsSync(candidate)) ?? findPuppeteerChromePath();
}

function findChromeFromCommand(): string | undefined {
  const executableNames = process.platform === 'win32'
    ? ['chrome.exe', 'chromium.exe', 'msedge.exe']
    : ['google-chrome', 'chromium', 'chromium-browser'];
  const locator = process.platform === 'win32' ? 'where' : 'which';

  for (const executableName of executableNames) {
    try {
      const output = execFileSync(locator, [executableName], {
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'ignore'],
      });
      const firstMatch = output.split(/\r?\n/).find(Boolean)?.trim();
      if (firstMatch) {
        return firstMatch;
      }
    } catch (error) {
      if (!(error instanceof Error)) {
        throw error;
      }
    }
  }

  return undefined;
}

function getKnownChromePaths(): string[] {
  if (process.platform === 'win32') {
    return [
      process.env.PROGRAMFILES,
      process.env['PROGRAMFILES(X86)'],
      process.env.LOCALAPPDATA,
    ].flatMap((basePath) => {
      if (!basePath) {
        return [];
      }

      return [
        `${basePath}\\Google\\Chrome\\Application\\chrome.exe`,
        `${basePath}\\Chromium\\Application\\chromium.exe`,
        `${basePath}\\Microsoft\\Edge\\Application\\msedge.exe`,
      ];
    });
  }

  if (process.platform === 'darwin') {
    return [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    ];
  }

  return [
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/snap/bin/chromium',
  ];
}

function findPuppeteerChromePath(): string | undefined {
  const platformDirectory = process.platform === 'win32'
    ? 'chrome-win64'
    : process.platform === 'darwin'
      ? process.arch === 'arm64' ? 'chrome-mac-arm64' : 'chrome-mac-x64'
      : 'chrome-linux64';
  const executableName = process.platform === 'win32'
    ? 'chrome.exe'
    : process.platform === 'darwin'
      ? 'Google Chrome for Testing'
      : 'chrome';
  const chromeCacheDir = join(homedir(), '.cache', 'puppeteer', 'chrome');

  try {
    return readdirSync(chromeCacheDir)
      .map((revision) => join(chromeCacheDir, revision, platformDirectory, executableName))
      .find((candidate) => existsSync(candidate));
  } catch (error) {
    if (!(error instanceof Error)) {
      throw error;
    }

    return undefined;
  }
}

describeCreateClientE2E('createClient E2E', () => {
  let client: OpenWAClient | null = null;

  afterEach(async () => {
    if (client) {
      await client.stop('test_cleanup');
      client = null;
    }
  });

  it('should emit launch.auth.qr.generated event when QR code appears', async () => {
    const driver = new PuppeteerDriver();
    const headless = process.env.HEADLESS !== 'false';
    const executablePath = process.env.CHROME_PATH || findChromePath();
    
    client = await createClient({
      driver,
      sessionId: 'e2e-test',
      headless,
      qrTimeoutMs: 60000,
      executablePath,
      browserArgs: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const qrPromise = new Promise<{ qr: string; attemptInThisCycle?: number }>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout waiting for QR code event'));
      }, 60000);

      client!.events.on('launch.auth.qr.generated', (event) => {
        clearTimeout(timeout);
        resolve(event.details!);
      });
    });

    client.start().catch((err) => {
      console.error('Client start error:', err);
    });

    const qrData = await qrPromise;

    expect(qrData).toBeDefined();
    expect(qrData.qr).toBeDefined();
    expect(typeof qrData.qr).toBe('string');
    expect(qrData.qr.length).toBeGreaterThan(0);
    expect(qrData.attemptInThisCycle).toBe(1);
  }, 90000);
});
