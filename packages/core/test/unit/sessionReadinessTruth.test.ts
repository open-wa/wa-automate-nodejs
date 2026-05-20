import { describe, expect, it, vi } from 'vitest';
import { HyperEmitter } from '@open-wa/hyperemitter';
import { SessionManager } from '../../src/sessionmanager/index.js';
import type { OpenWAEventMap } from '../../src/events/eventMap.js';

function createSessionManager() {
  return new SessionManager({
    sessionId: 'readiness-truth',
    events: new HyperEmitter<OpenWAEventMap>(),
    logger: {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    } as any,
  });
}

describe('session readiness truth', () => {
  it('keeps READY blocked until lower-level obligations are satisfied', async () => {
    const session = createSessionManager();

    session.updateReadiness('runtimeUsable', 'satisfied', 'runtime usable');
    session.updateReadiness('patchLifecycle', 'satisfied', 'patch settled');
    session.updateReadiness('licenseLifecycle', 'non_blocking', 'metadata-only is explicitly non-blocking');
    session.setFinalization('ready', 'finalization complete');
    await session.setState('READY');

    const readiness = session.getReadinessSnapshot({
      generation: {
        browserContextId: 'ctx_1',
        documentId: 'doc_1',
        runtimeId: 'rt_1',
      },
      phase: 'bridge_ready',
      driverActiveGeneration: true,
      runtimeOperational: true,
      runtimeBridgeReady: true,
      reinjectionSettled: false,
    });

    expect(readiness.ready).toBe(false);
    expect(readiness.status).toBe('not_ready');
    expect(readiness.exposureSafe).toBe(false);
    expect(readiness.pending).toContain('reinjectionSettled');
    expect(readiness.lowerLevel).toMatchObject({
      driverActiveGeneration: true,
      runtimeOperational: true,
      runtimeBridgeReady: true,
      reinjectionSettled: false,
    });
  });

  it('reports ready only when finalized requirements and lower-level truth align', async () => {
    const session = createSessionManager();

    session.updateReadiness('runtimeUsable', 'satisfied', 'runtime usable');
    session.updateReadiness('patchLifecycle', 'satisfied', 'patch settled');
    session.updateReadiness('licenseLifecycle', 'non_blocking', 'metadata-only is explicitly non-blocking');
    session.setFinalization('ready', 'finalization complete');
    await session.setState('READY');

    const readiness = session.getReadinessSnapshot({
      generation: {
        browserContextId: 'ctx_1',
        documentId: 'doc_1',
        runtimeId: 'rt_1',
      },
      phase: 'bridge_ready',
      driverActiveGeneration: true,
      runtimeOperational: true,
      runtimeBridgeReady: true,
      reinjectionSettled: true,
    });

    expect(readiness).toMatchObject({
      ready: true,
      status: 'ready',
      exposureSafe: true,
      pending: [],
      blockers: [],
      lowerLevel: {
        driverActiveGeneration: true,
        runtimeOperational: true,
        runtimeBridgeReady: true,
        reinjectionSettled: true,
      },
      requirements: {
        runtimeUsable: { state: 'satisfied' },
        patchLifecycle: { state: 'satisfied' },
        licenseLifecycle: { state: 'non_blocking' },
        finalization: { state: 'satisfied' },
      },
    });
  });
});
