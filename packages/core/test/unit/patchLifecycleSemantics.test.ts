import { afterEach, describe, expect, it, vi } from 'vitest';
import { HyperEmitter } from '@open-wa/hyperemitter';
import { createLogger } from '@open-wa/logger';
import type { IDriver } from '@open-wa/driver-interface';
import { Transport } from '../../src/transport/Transport.js';
import type { OpenWAEventMap } from '../../src/events/eventMap.js';
import * as httpClient from '../../src/transport/httpClient.js';

function createTransport(patchConfig?: ConstructorParameters<typeof Transport>[0]['patchConfig']): Transport {
  return new Transport({
    driver: {} as IDriver,
    events: new HyperEmitter<OpenWAEventMap>({
      delimiter: '.',
      captureRejections: true,
      logger: createLogger({ component: 'core-test', sessionId: 'patch-semantics' }),
      debug: false,
      onError: () => undefined,
    }),
    logger: createLogger({ component: 'core-test', sessionId: 'patch-semantics' }),
    patchConfig,
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('transport patch lifecycle semantics', () => {
  it('keeps disk cache opt-in instead of reading or writing it by default', async () => {
    const transport = createTransport({ cachedPatch: false });
    const loadCachedSpy = vi.spyOn(transport as never as { loadCachedLivePatches: () => Promise<unknown> }, 'loadCachedLivePatches');
    const saveCachedSpy = vi.spyOn(transport as never as { saveCachedLivePatches: (value: unknown) => Promise<void> }, 'saveCachedLivePatches');
    const fetchSpy = vi.spyOn(httpClient, 'fetchPatches').mockResolvedValue({
      data: ['console.log("remote")'],
      tag: 'remote-tag',
    });

    const result = await (transport as never as {
      fetchLivePatchesWithCache: (sessionInfo?: { WA_VERSION?: string; WA_AUTOMATE_VERSION?: string }) => Promise<{ source: string; tag: string; data: string[] }>;
    }).fetchLivePatchesWithCache({
      WA_VERSION: '2.2400.1',
      WA_AUTOMATE_VERSION: '5.0.0',
    });

    expect(result).toMatchObject({ source: 'remote', tag: 'remote-tag' });
    expect(loadCachedSpy).not.toHaveBeenCalled();
    expect(saveCachedSpy).not.toHaveBeenCalled();
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://cdn.openwa.dev/patches.json',
      expect.objectContaining({ waVersion: '2.2400.1', waAutomateVersion: '5.0.0' }),
      { fallbackUrl: 'https://raw.githubusercontent.com/open-wa/wa-automate-nodejs/master/patches.json' },
    );
  });

  it('returns a fresh cache hit immediately and refreshes it in the background when cachedPatch is enabled', async () => {
    const transport = createTransport({ cachedPatch: true });
    vi.spyOn(transport as never as { loadCachedLivePatches: () => Promise<{ data: string[]; tag: string } | null> }, 'loadCachedLivePatches').mockResolvedValue({
      data: ['console.log("cached")'],
      tag: 'cached-tag',
    });
    const refreshSpy = vi.spyOn(transport as never as {
      fetchFreshLivePatches: (sessionInfo?: { WA_VERSION?: string; WA_AUTOMATE_VERSION?: string }) => Promise<{ data: string[]; tag: string }>;
    }, 'fetchFreshLivePatches').mockResolvedValue({
      data: ['console.log("fresh")'],
      tag: 'fresh-tag',
    });

    const result = await (transport as never as {
      fetchLivePatchesWithCache: (sessionInfo?: { WA_VERSION?: string; WA_AUTOMATE_VERSION?: string }) => Promise<{ source: string; tag: string; data: string[] }>;
    }).fetchLivePatchesWithCache({
      WA_VERSION: '2.2400.1',
      WA_AUTOMATE_VERSION: '5.0.0',
    });

    expect(result).toMatchObject({
      source: 'cached',
      tag: 'cached-tag',
      data: ['console.log("cached")'],
    });

    await vi.waitFor(() => {
      expect(refreshSpy).toHaveBeenCalledTimes(1);
    });
  });

  it('treats ghPatch as the primary GitHub source selector instead of a vague fallback toggle', async () => {
    const transport = createTransport({ ghPatch: true, cachedPatch: false });
    const fetchSpy = vi.spyOn(httpClient, 'fetchPatches').mockResolvedValue({
      data: ['console.log("remote")'],
      tag: 'github-tag',
    });

    const result = await (transport as never as {
      fetchFreshLivePatches: (sessionInfo?: { WA_VERSION?: string; WA_AUTOMATE_VERSION?: string }) => Promise<{ tag: string; data: string[] }>;
    }).fetchFreshLivePatches({
      WA_VERSION: '2.2400.1',
      WA_AUTOMATE_VERSION: '5.0.0',
    });

    expect(result).toMatchObject({ tag: 'github-tag' });
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://raw.githubusercontent.com/open-wa/wa-automate-nodejs/master/patches.json',
      expect.objectContaining({ waVersion: '2.2400.1', waAutomateVersion: '5.0.0' }),
      { fallbackUrl: undefined },
    );
  });
});
