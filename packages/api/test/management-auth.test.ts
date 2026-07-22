import { describe, expect, it } from 'vitest';
import type { Config } from '@open-wa/config';
import { createApiServer } from '../src/createApiServer.js';

function createConfig(apiKey?: string): Config {
  return {
    sessionName: 'management-auth-test',
    apiKey,
    cors: '*',
    ezqr: true,
    integrations: {
      chatwoot: {
        enabled: true,
        config: { apiAccessToken: 'integration-secret' },
      },
    },
  };
}

describe('management route authentication', () => {
  it.each([
    '/meta/debug/memory',
    '/meta/debug/config',
    '/meta/debug/info',
    '/meta/integrations',
    '/qr',
    '/screencast',
  ])(
    'rejects unauthenticated requests to %s when an API key is configured',
    async (path) => {
      const app = createApiServer(createConfig('configured-secret')).getApp();

      const response = await app.request(path);

      expect(response.status).toBe(401);
    },
  );

  it('does not mutate integration configuration without the API key', async () => {
    const config = createConfig('configured-secret');
    const app = createApiServer(config).getApp();

    const response = await app.request('/meta/integrations/chatwoot', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: false }),
    });

    expect(response.status).toBe(401);
    expect(config.integrations?.chatwoot?.enabled).toBe(true);
  });

  it('allows authenticated management requests', async () => {
    const server = createApiServer(createConfig('configured-secret'));
    server.setQR('private-qr-data');
    const app = server.getApp();

    const integrations = await app.request('/meta/integrations', {
      headers: { 'X-API-Key': 'configured-secret' },
    });
    const qr = await app.request('/qr?api_key=configured-secret');

    expect(integrations.status).toBe(200);
    expect(await integrations.json()).toEqual({
      chatwoot: {
        enabled: true,
        config: { apiAccessToken: 'integration-secret' },
      },
    });
    expect(qr.status).toBe(200);
    expect(await qr.json()).toEqual({
      qr: 'private-qr-data',
      note: 'Scan this QR code in WhatsApp',
    });
  });

  it('does not expose QR data through the public health endpoint', async () => {
    const server = createApiServer(createConfig('configured-secret'));
    server.setQR('private-qr-data');

    const response = await server.getApp().request('/health');
    const health = (await response.json()) as { qr: string | null };

    expect(response.status).toBe(200);
    expect(health.qr).toBeNull();
  });

  it('preserves management routes when authentication is not configured', async () => {
    const app = createApiServer(createConfig()).getApp();

    const response = await app.request('/meta/integrations');

    expect(response.status).toBe(200);
  });
});
