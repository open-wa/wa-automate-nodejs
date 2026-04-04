import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ConfigSchema } from '@open-wa/config';
import { WAServer } from '../hono-server';

type MatrixEntry = {
  id: string;
  classification: 'restore' | 'downgrade' | 'deprecate';
  releaseBlocker: boolean;
  status: 'gap' | 'present' | 'accepted_non_blocker';
};

const repoRoot = resolve(__dirname, '../../../../../');

function loadMatrix(): MatrixEntry[] {
  return JSON.parse(
    readFileSync(resolve(repoRoot, 'packages/core/test/fixtures/release-blocker-parity-matrix.json'), 'utf8')
  ) as MatrixEntry[];
}

describe('readiness truth parity baseline', () => {
  it('keeps host availability separate from session readiness and documents non-blockers outside the release gate', async () => {
    const matrix = loadMatrix();
    const readinessEntry = matrix.find((entry) => entry.id === 'readiness_truth_host_vs_session');

    expect(readinessEntry).toMatchObject({
      classification: 'restore',
      releaseBlocker: true,
      status: 'present',
    });

    expect(
      matrix
        .filter((entry) => !entry.releaseBlocker)
        .map((entry) => entry.id)
    ).toEqual(['popup_qr_parity', 'json_session_restore']);

    const config = ConfigSchema.parse({ sessionId: 'readiness-parity', port: 8010, apiLifecycle: 'post-connection' });
    const server = new WAServer(config);

    server.setReadinessProvider(() => ({
      ready: false,
      status: 'not_ready',
      state: 'AUTHENTICATING',
      exposureSafe: false,
      pending: ['runtimeUsable', 'finalization'],
      blockers: [],
      lowerLevel: {
        driverActiveGeneration: true,
        runtimeOperational: false,
        runtimeBridgeReady: false,
        reinjectionSettled: true,
      },
    }));

    const res = await server.getApp().request('/health');

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      status: 'ok',
      host: {
        available: true,
        api: true,
      },
      session: {
        ready: false,
        status: 'not_ready',
        state: 'AUTHENTICATING',
        lowerLevel: {
          driverActiveGeneration: true,
          runtimeOperational: false,
          runtimeBridgeReady: false,
          reinjectionSettled: true,
        },
      },
    });
  });
});
