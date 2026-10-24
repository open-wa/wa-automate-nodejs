import { describe, expect, it } from 'vitest';
import { Hono } from 'hono';
import { createApiServer } from '../src/createApiServer';
import type { Config } from '@open-wa/schema';

function server() {
  return createApiServer({ sessionId: 'plugin-test', apiKey: 'test-key', cors: '*',
    dashboard: false, logLevel: 'warn' } as Config);
}

function plugin() {
  const router = new Hono();
  router.get('/ping', c => c.json({ plugin: true }));
  router.post('/echo', async c => c.json(await c.req.json()));
  return { getRoutes: () => [{ name: 'test', router, routeAuth: 'host' }],
    getManifest: () => ({ plugins: [{ name: 'test' }] }) } as any;
}

describe('plugin routes after server requests', () => {
  it.each(['/health', '/plugins/manifest', '/plugins/test/ping'])('mounts plugins after a request to %s', async path => {
    const api = server();
    await api.getApp().request(path);
    api.mountPlugins(plugin());
    const result = await api.getApp().request('/plugins/test/ping', { headers: { 'X-API-Key': 'test-key' } });
    expect(result.status).toBe(200);
    expect(await result.json()).toEqual({ plugin: true });
    const echo = await api.getApp().request('/plugins/test/echo', { method: 'POST',
      headers: { 'X-API-Key': 'test-key', 'Content-Type': 'application/json' }, body: JSON.stringify({ value: 7 }) });
    expect(await echo.json()).toEqual({ value: 7 });
    expect((await api.getApp().request('/plugins/manifest')).status).toBe(200);
  });

  it('keeps host authentication on the delegated plugin routes', async () => {
    const api = server();
    await api.getApp().request('/health');
    api.mountPlugins(plugin());
    expect((await api.getApp().request('/plugins/test/ping')).status).toBe(401);
  });
});
