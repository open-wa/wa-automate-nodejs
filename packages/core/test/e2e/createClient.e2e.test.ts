import { describe, it, expect, afterEach } from 'vitest';
import { createClient, OpenWAClient } from '../../src/createClient.js';
import { PuppeteerDriver } from '@open-wa/driver-puppeteer';
import { execSync } from 'child_process';

function findChromePath(): string | undefined {
  try {
    return execSync('which google-chrome || which chromium || which chromium-browser || ls ~/.cache/puppeteer/chrome/*/chrome-linux64/chrome 2>/dev/null | head -1', { encoding: 'utf-8' }).trim() || undefined;
  } catch {
    return undefined;
  }
}

describe('createClient E2E', () => {
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
