import { generateKeyPairSync, sign } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import {
  LivePatchActivityGate,
  LivePatchAutomation,
  LivePatchCoordinator,
  LivePatchControlClient,
  canonicalizeLivePatchManifest,
  createLivePatchAnalytics,
  normalizePollPatchSchedule,
  sha256Hex,
  verifyLivePatchManifest,
  type LivePatchReleaseManifest,
} from '../../src/livePatch/index.js';

describe('live patch contract', () => {
  it('uses the complete artifact SHA-256 as the release identity', () => {
    expect(sha256Hex('["patch"]')).toBe(
      '00240fc5fd6d4f98f9bdc20236815a1b1b37bace4412b884b6dae9e4aab8b502',
    );
  });

  it('canonicalizes signed manifest fields without the signature', () => {
    const manifest: LivePatchReleaseManifest = {
      version: 1,
      hash: 'a'.repeat(64),
      url: 'https://cdn.openwa.dev/patches/aa.json',
      size: 123,
      publishedAt: '2026-07-16T12:00:00.000Z',
      minCoreVersion: '5.0.0-alpha.8',
      signature: 'signature',
    };

    expect(canonicalizeLivePatchManifest(manifest)).toBe(
      '{"version":1,"hash":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","url":"https://cdn.openwa.dev/patches/aa.json","size":123,"publishedAt":"2026-07-16T12:00:00.000Z","minCoreVersion":"5.0.0-alpha.8"}',
    );
  });

  it('verifies Ed25519 manifests and rejects modified release metadata', () => {
    const { privateKey, publicKey } = generateKeyPairSync('ed25519');
    const manifest: LivePatchReleaseManifest = {
      version: 1,
      hash: 'a'.repeat(64),
      url: 'https://cdn.openwa.dev/patches/aa.json',
      size: 123,
      publishedAt: '2026-07-16T12:00:00.000Z',
      signature: '',
    };
    manifest.signature = sign(
      null,
      Buffer.from(canonicalizeLivePatchManifest(manifest)),
      privateKey,
    ).toString('base64');
    const publicKeyPem = publicKey
      .export({ type: 'spki', format: 'pem' })
      .toString();

    expect(() => verifyLivePatchManifest(manifest, publicKeyPem)).not.toThrow();
    expect(() =>
      verifyLivePatchManifest({ ...manifest, size: 124 }, publicKeyPem),
    ).toThrow(/signature/i);
  });

  it('downloads only a bundle whose byte length and SHA-256 match the signed manifest', async () => {
    const bundle = '["patch"]';
    const manifest: LivePatchReleaseManifest = {
      version: 1,
      hash: sha256Hex(bundle),
      url: 'https://cdn.openwa.dev/patches/release.json',
      size: Buffer.byteLength(bundle),
      publishedAt: '2026-07-16T12:00:00.000Z',
      signature: 'verified-by-control-plane',
    };
    const fetchImpl = vi
      .fn()
      .mockImplementation(async () => new Response(bundle, { status: 200 }));
    const client = new LivePatchControlClient({
      endpoint: 'https://patch.openwa.dev/v1',
      publicKey: 'unused',
      fetch: fetchImpl,
      verifyManifest: vi.fn(),
    });

    await expect(client.download(manifest)).resolves.toEqual(['patch']);
    await expect(
      client.download({ ...manifest, hash: 'f'.repeat(64) }),
    ).rejects.toThrow(/sha-256/i);
  });

  it('hashes and truncates the normalized host without sending the raw value', () => {
    const analytics = createLivePatchAnalytics({
      hostNumber: ' 447700900123@c.us ',
      waVersion: '2.3000.1',
      coreVersion: '5.0.0-alpha.8',
      driver: 'puppeteer',
      trigger: 'poll',
      currentHash: 'a'.repeat(64),
    });

    expect(analytics.hostHash).toBe('03313');
    expect(JSON.stringify(analytics)).not.toContain('447700900123');
  });

  it('normalizes boolean and numeric polling while enforcing five minutes', () => {
    expect(normalizePollPatchSchedule(true)).toEqual({
      kind: 'interval',
      minutes: 5,
    });
    expect(normalizePollPatchSchedule(15)).toEqual({
      kind: 'interval',
      minutes: 15,
    });
    expect(() => normalizePollPatchSchedule(4)).toThrow(/at least 5 minutes/i);
  });

  it('accepts cron only when consecutive occurrences stay five minutes apart', () => {
    expect(normalizePollPatchSchedule('*/10 * * * *')).toEqual({
      kind: 'cron',
      expression: '*/10 * * * *',
    });
    expect(() => normalizePollPatchSchedule('* * * * *')).toThrow(
      /at least 5 minutes/i,
    );
  });
});

describe('LivePatchActivityGate', () => {
  it('waits for continuous inactivity, freezes new work, and drains in-flight work', async () => {
    vi.useFakeTimers();
    const gate = new LivePatchActivityGate(10_000);
    let releaseOperation!: () => void;
    const operation = gate.runOperation(
      () =>
        new Promise<void>((resolve) => {
          releaseOperation = resolve;
        }),
    );

    const quiescing = gate.quiesce(true);
    await vi.advanceTimersByTimeAsync(9_999);
    expect(gate.isFrozen()).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(gate.isFrozen()).toBe(true);
    expect(() => gate.runOperation(async () => undefined)).toThrow(
      /live patch update/i,
    );

    releaseOperation();
    await operation;
    await quiescing;

    gate.resume();
    expect(gate.isFrozen()).toBe(false);
    vi.useRealTimers();
  });

  it('lets manual updates skip the idle wait while still draining operations', async () => {
    const gate = new LivePatchActivityGate(10_000);
    await gate.quiesce(false);
    expect(gate.isFrozen()).toBe(true);
    gate.resume();
  });
});

describe('LivePatchCoordinator', () => {
  it('coalesces concurrent update requests into one generation transaction', async () => {
    const manifest: LivePatchReleaseManifest = {
      version: 1,
      hash: 'b'.repeat(64),
      url: 'https://cdn.openwa.dev/patches/bb.json',
      size: 10,
      publishedAt: '2026-07-16T12:00:00.000Z',
      signature: 'signature',
    };
    let releaseApply!: () => void;
    const apply = vi.fn(
      () =>
        new Promise<{
          reloadDurationMs: number;
          activeHash: string;
          rolledBack: boolean;
        }>((resolve) => {
          releaseApply = () =>
            resolve({
              reloadDurationMs: 321,
              activeHash: manifest.hash,
              rolledBack: false,
            });
        }),
    );
    const coordinator = new LivePatchCoordinator({
      gate: new LivePatchActivityGate(0),
      getCurrentHash: () => 'a'.repeat(64),
      check: vi.fn().mockResolvedValue(manifest),
      apply,
    });

    const first = coordinator.update('client');
    const second = coordinator.update('api');
    await vi.waitFor(() => expect(apply).toHaveBeenCalledTimes(1));
    releaseApply();

    await expect(first).resolves.toMatchObject({
      updated: true,
      status: 'updated',
      oldHash: 'a'.repeat(64),
      newHash: 'b'.repeat(64),
      reloadDurationMs: 321,
    });
    await expect(second).resolves.toEqual(await first);
  });

  it('returns up_to_date without quiescing when the control plane has no newer release', async () => {
    const gate = new LivePatchActivityGate(0);
    const quiesce = vi.spyOn(gate, 'quiesce');
    const coordinator = new LivePatchCoordinator({
      gate,
      getCurrentHash: () => 'a'.repeat(64),
      check: vi.fn().mockResolvedValue(null),
      apply: vi.fn(),
    });

    await expect(coordinator.update('client')).resolves.toMatchObject({
      updated: false,
      status: 'up_to_date',
      oldHash: 'a'.repeat(64),
      newHash: 'a'.repeat(64),
      reloadDurationMs: null,
    });
    expect(quiesce).not.toHaveBeenCalled();
  });

  it('reports a rollback to a built-in generation without inventing a hash', async () => {
    const manifest: LivePatchReleaseManifest = {
      version: 1,
      hash: 'b'.repeat(64),
      url: 'https://cdn.openwa.dev/patches/bb.json',
      size: 10,
      publishedAt: '2026-07-16T12:00:00.000Z',
      signature: 'signature',
    };
    const coordinator = new LivePatchCoordinator({
      gate: new LivePatchActivityGate(0),
      getCurrentHash: () => null,
      check: vi.fn().mockResolvedValue(manifest),
      apply: vi
        .fn()
        .mockResolvedValue({
          activeHash: null,
          reloadDurationMs: 91,
          rolledBack: true,
        }),
    });

    await expect(coordinator.update('client')).resolves.toMatchObject({
      updated: false,
      status: 'rolled_back',
      oldHash: null,
      newHash: null,
      reloadDurationMs: 91,
    });
  });
});

describe('LivePatchAutomation', () => {
  it('checks immediately when the socket connects and on a release notification', async () => {
    const listeners = new Map<string, (event: { data?: unknown }) => void>();
    class FakeSocket {
      close = vi.fn();
      constructor(_url: string) {}
      addEventListener(
        type: string,
        listener: (event: { data?: unknown }) => void,
      ): void {
        listeners.set(type, listener);
      }
    }
    const update = vi.fn().mockResolvedValue({});
    const automation = new LivePatchAutomation({
      config: { livePatch: true, endpoint: 'https://patch.openwa.dev/v1' },
      update,
      WebSocket: FakeSocket,
    });

    automation.start();
    listeners.get('open')?.({});
    listeners.get('message')?.({
      data: JSON.stringify({ type: 'patch.available' }),
    });
    await vi.waitFor(() => expect(update).toHaveBeenCalledTimes(2));
    expect(update).toHaveBeenNthCalledWith(1, 'socket');
    expect(update).toHaveBeenNthCalledWith(2, 'socket');
    automation.stop();
  });

  it('polls at the configured interval and never below five minutes', async () => {
    vi.useFakeTimers();
    const update = vi.fn().mockResolvedValue({});
    const automation = new LivePatchAutomation({
      config: { pollPatch: true, endpoint: 'https://patch.openwa.dev/v1' },
      update,
    });

    automation.start();
    await vi.advanceTimersByTimeAsync(5 * 60_000 - 1);
    expect(update).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(update).toHaveBeenCalledWith('poll');
    automation.stop();
    vi.useRealTimers();
  });
});
