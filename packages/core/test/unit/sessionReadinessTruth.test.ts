import { describe, expect, it, vi } from 'vitest';
import { HyperEmitter } from '@open-wa/hyperemitter';
import { SessionManager } from '../../src/sessionmanager/index';
import type { OpenWAEventMap } from '../../src/events/eventMap';

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
  it('follows the session state and keeps unsettled lower-level work observable', async () => {
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

    // Readiness is the session state. Lower-level work no longer blocks it; it is
    // listed as pending so callers can still see it.
    expect(readiness.ready).toBe(true);
    expect(readiness.status).toBe('ready');
    expect(readiness.exposureSafe).toBe(true);
    expect(readiness.pending).toEqual(['reinjectionSettled']);
    expect(readiness.blockers).toEqual([]);
    expect(readiness.lowerLevel).toMatchObject({
      driverActiveGeneration: true,
      runtimeOperational: true,
      runtimeBridgeReady: true,
      reinjectionSettled: false,
      pending: ['reinjectionSettled'],
    });
  });

  it('stays not ready until the session reaches READY, whatever the requirements report', async () => {
    const session = createSessionManager();

    session.updateReadiness('runtimeUsable', 'satisfied', 'runtime usable');
    session.updateReadiness('patchLifecycle', 'satisfied', 'patch settled');
    session.updateReadiness('licenseLifecycle', 'satisfied', 'license valid');
    session.setFinalization('ready', 'finalization complete');
    await session.setState('AUTHENTICATING');

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
      state: 'AUTHENTICATING',
      ready: false,
      status: 'not_ready',
      exposureSafe: false,
      pending: [],
      blockers: [],
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
