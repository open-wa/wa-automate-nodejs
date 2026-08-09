import { describe, expect, it, vi } from 'vitest';
import { getHttpMethodDefinitions } from '@open-wa/schema';
import '@open-wa/schema/methods';
import { createApiMiddleware } from '../src/createApiMiddleware.js';

describe('live patch Easy API', () => {
  it('keeps the update route callable while the normal runtime surface is gated', async () => {
    const updateLivePatch = vi.fn().mockResolvedValue({
      updated: true,
      status: 'updated',
      oldHash: 'a'.repeat(64),
      newHash: 'b'.repeat(64),
      reloadDurationMs: 123,
      totalDurationMs: 150,
    });
    const definitions = getHttpMethodDefinitions('/api');
    const definition = definitions.find(
      (entry) => entry.functionName === 'updateLivePatch',
    );
    expect(definition).toMatchObject({
      path: '/api/session/updateLivePatch',
      httpMethod: 'POST',
      availableDuringRuntimeMutation: true,
    });

    const app = createApiMiddleware(
      { updateLivePatch },
      {
        config: { sessionId: 'session', apiLifecycle: 'wait' } as never,
        isSessionConnected: () => false,
        methodDefinitions: definitions,
      },
    );
    const response = await app.request('/session/updateLivePatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    expect(response.status).toBe(200);
    expect(updateLivePatch).toHaveBeenCalledWith('api');
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      data: { updated: true, oldHash: 'a'.repeat(64), newHash: 'b'.repeat(64) },
    });
  });
});
