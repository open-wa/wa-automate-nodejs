import { afterEach, describe, expect, it } from 'vitest';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createClient } from '../../src/createClient.js';
import type { OpenWAClient } from '../../src/createClient.js';
import { LightpandaDriver } from '../../../driver-lightpanda/src/LightpandaDriver.js';

const require = createRequire(import.meta.url);

function hasResolvableDependency(specifier: string): boolean {
  try {
    require.resolve(specifier);
    return true;
  } catch {
    return false;
  }
}

function resolveExecutableOverride(): string | undefined {
  return process.env.OPENWA_LIGHTPANDA_EXECUTABLE_PATH ?? process.env.LIGHTPANDA_EXECUTABLE_PATH;
}

function resolveLightpandaSmokeGate(): { enabled: boolean; executablePath?: string } {
  if (process.env.OPENWA_LIGHTPANDA_SMOKE !== 'true') {
    return { enabled: false };
  }

  if (!hasResolvableDependency('@lightpanda/browser') || !hasResolvableDependency('puppeteer')) {
    return { enabled: false };
  }

  const executablePath = resolveExecutableOverride();
  if (executablePath && !existsSync(executablePath)) {
    return { enabled: false };
  }

  return { enabled: true, executablePath };
}

function createSessionId(): string {
  return `lightpanda-smoke-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const lightpandaSmokeGate = resolveLightpandaSmokeGate();
const describeLightpandaSmoke = lightpandaSmokeGate.enabled ? describe : describe.skip;

describeLightpandaSmoke('createClient Lightpanda smoke E2E', () => {
  let client: OpenWAClient | null = null;
  let sessionDataPath: string | null = null;

  afterEach(async () => {
    if (client) {
      await client.stop('lightpanda_smoke_cleanup').catch(() => undefined);
      client = null;
    }

    if (sessionDataPath) {
      rmSync(sessionDataPath, { recursive: true, force: true });
      sessionDataPath = null;
    }
  });

  it('spawns local Lightpanda, connects over CDP, creates a page, reaches QR bootstrap, and shuts down cleanly', async () => {
    const driverLogs: Array<{ message: string; meta?: Record<string, unknown> }> = [];
    const runtimeDriver = new LightpandaDriver();
    await runtimeDriver.init({
      logger: {
        debug: () => undefined,
        info: (message, meta) => {
          driverLogs.push({ message, meta });
        },
        warn: () => undefined,
        error: () => undefined,
      },
    });

    const browser = await runtimeDriver.launch({
      executablePath: lightpandaSmokeGate.executablePath,
      timeoutMs: 45_000,
    });

    try {
      expect(browser.isConnected()).toBe(true);
      const browserVersion = await browser.versionString();
      expect(typeof browserVersion).toBe('string');
      expect(browserVersion.length).toBeGreaterThan(0);

      const connectionLog = driverLogs.find((entry) => entry.message === 'Lightpanda browser executable version');
      expect(connectionLog?.meta?.host).toBe('127.0.0.1');
      expect(Number(connectionLog?.meta?.port)).toBeGreaterThanOrEqual(9000);

      const page = await browser.newPage();
      const userAgent = await page.evaluateScript<string>('navigator.userAgent');
      expect(typeof userAgent).toBe('string');
      expect(userAgent.length).toBeGreaterThan(0);
      await page.close();
    } finally {
      await browser.close();
    }

    sessionDataPath = mkdtempSync(join(tmpdir(), 'openwa-lightpanda-smoke-'));
    client = await createClient({
      driver: new LightpandaDriver(),
      sessionId: createSessionId(),
      headless: true,
      qrTimeoutMs: 60_000,
      sessionDataPath,
      executablePath: lightpandaSmokeGate.executablePath,
    });

    const qrGenerated = new Promise<{ qr: string; attemptInThisCycle?: number }>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timed out waiting for the Lightpanda QR bootstrap milestone'));
      }, 60_000);

      client!.events.on('launch.auth.qr.generated', (event) => {
        clearTimeout(timeout);
        resolve(event.details!);
      });

      client!.events.on('error', (event) => {
        if (event.fatal) {
          clearTimeout(timeout);
          reject(event.error ?? new Error(`Fatal Lightpanda bootstrap error in ${event.scope}`));
        }
      });
    });

    void client.start().catch(() => undefined);

    const qrPayload = await qrGenerated;
    expect(typeof qrPayload.qr).toBe('string');
    expect(qrPayload.qr.length).toBeGreaterThan(0);
    expect(qrPayload.attemptInThisCycle).toBe(1);
    expect(client.getState()).toBe('AUTHENTICATING');

    await client.stop('lightpanda_smoke_complete');
    expect(client.getState()).toBe('STOPPED');
    client = null;
  }, 120_000);
});
