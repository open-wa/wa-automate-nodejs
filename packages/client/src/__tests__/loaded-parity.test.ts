import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { HyperEmitter } from '@open-wa/hyperemitter';
import { Client } from '../Client.js';
import type { OpenWAClient, STATE, Transport } from '@open-wa/core';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '../../../../');
const legacyRoot = process.env.OPENWA_LEGACY_ROOT ?? '/Users/Mohammed/projects/tools/wa copy/src';

function readRepoFile(relativePath: string): string {
  return readFileSync(resolve(repoRoot, relativePath), 'utf8');
}

function readLegacyFile(relativePath: string): string {
  return readFileSync(resolve(legacyRoot, relativePath), 'utf8');
}

function createTestClient() {
  const events = new HyperEmitter({ delimiter: '.', captureRejections: true });
  let finalizationHook: (() => Promise<void> | void) | undefined;

  const openwaClient: OpenWAClient = {
    sessionId: 'loaded-parity',
    events: events as any,
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } as any,
    session: {} as any,
    plugins: {} as any,
    config: {},
    registerFinalizationHook: vi.fn((hook: () => Promise<void> | void) => {
      finalizationHook = hook;
      return () => {
        finalizationHook = undefined;
      };
    }),
    start: vi.fn(),
    stop: vi.fn(),
    getState: vi.fn(() => 'READY' as STATE),
    getReadiness: vi.fn(),
    getTransport: vi.fn(),
    screenshot: vi.fn(),
    evaluateScript: vi.fn(),
  };

  const transport: Transport = {
    evaluate: vi.fn(),
  } as any;

  return {
    client: new Client({ client: openwaClient, transport }),
    events,
    openwaClient,
    transport,
    getFinalizationHook: () => finalizationHook,
  };
}

afterEach(() => {
  vi.useRealTimers();
});

describe('Client.loaded parity', () => {
  it('keeps the legacy loaded() semantics visible in the audited source', () => {
    const legacyClientSource = readLegacyFile('api/Client.ts');
    const currentClientSource = readRepoFile('packages/client/src/Client.ts');
    const { client } = createTestClient();

    expect(legacyClientSource).toMatch(/async loaded\(\) : Promise<void>/);
    expect(legacyClientSource).toMatch(/WAPI\.isSessionLoaded\(\)/);
    expect(legacyClientSource).toMatch(/registerAllSimpleListenersOnEv\(/);
    expect(legacyClientSource).toMatch(/deleteSessionDataOnLogout|killClientOnLogout/);

    expect(typeof client.loaded).toBe('function');
    expect(currentClientSource).toMatch(/loaded\(\): Promise<void>/);
    expect(currentClientSource).toMatch(/isSessionLoaded|registerAllSimpleListenersOnEv|session\.logout|phoneVersion|waitForQueuesToDrain/);
  });

  it('runs loaded-equivalent finalization through the registered core hook before ready exposure', async () => {
    vi.useFakeTimers();
    const { client, events, transport, openwaClient, getFinalizationHook } = createTestClient();
    const evaluate = vi.mocked(transport.evaluate as any);

    evaluate
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce('2.26.3');

    const finalizationHook = getFinalizationHook();
    expect(openwaClient.registerFinalizationHook).toHaveBeenCalledTimes(1);
    expect(typeof finalizationHook).toBe('function');

    const runPromise = finalizationHook?.();
    await vi.advanceTimersByTimeAsync(100);
    await runPromise;

    expect(client.phoneVersion).toBe('2.26.3');
    expect(events.listenerCount('message.received')).toBeGreaterThan(0);
    expect(events.listenerCount('message.any')).toBeGreaterThan(0);
    expect(events.listenerCount('ack.changed')).toBeGreaterThan(0);
    expect(events.listenerCount('session.state.changed')).toBeGreaterThan(0);
    expect(events.listenerCount('message.deleted')).toBeGreaterThan(0);
    expect(events.listenerCount('session.logout')).toBeGreaterThan(0);
    expect(evaluate).toHaveBeenCalledTimes(4);
  });
});
