import { describe, expect, it } from 'vitest';
import { sanitizeAnalytics } from '../src/contracts';

describe('live patch Worker analytics', () => {
  it('keeps only the privacy whitelist and never forwards raw session details', () => {
    const analytics = sanitizeAnalytics({
      schemaVersion: 1,
      hostHash: 'abc12',
      hostNumber: '447700900123@c.us',
      sessionId: 'customer-production',
      licenseKey: 'secret',
      coreVersion: '5.0.0',
      nodeVersion: 'v22',
      platform: 'darwin',
      arch: 'arm64',
      driver: 'puppeteer',
      trigger: 'poll',
      currentHash: 'a'.repeat(64),
      result: {
        updated: true,
        status: 'updated',
        oldHash: 'a'.repeat(64),
        newHash: 'b'.repeat(64),
        reloadDurationMs: 120,
        totalDurationMs: 180,
        licenseKey: 'nested-secret',
      },
    });

    expect(analytics?.hostHash).toBe('abc12');
    expect(JSON.stringify(analytics)).not.toContain('447700900123');
    expect(JSON.stringify(analytics)).not.toContain('customer-production');
    expect(JSON.stringify(analytics)).not.toContain('secret');
    expect(analytics?.result).toEqual({
      updated: true,
      status: 'updated',
      oldHash: 'a'.repeat(64),
      newHash: 'b'.repeat(64),
      reloadDurationMs: 120,
      totalDurationMs: 180,
    });
  });
});
