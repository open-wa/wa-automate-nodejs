import { Hono } from 'hono';
import type { Config } from '@open-wa/schema';
import type { ClientMethodMap } from '../types';
import { apiKeyMiddleware } from '../auth/api-key';
import { rateLimitMiddleware } from '../middleware/rate-limit';

/** Host controls stay available while document-owned WAPI calls are interrupted. */
export function registerSessionRefreshRoutes(app: Hono, config: Config, getClient: () => ClientMethodMap | undefined) {
  const controls = new Hono();
  controls.use('*', rateLimitMiddleware(100, 60_000));
  if (config.apiKey) controls.use('*', apiKeyMiddleware(config.apiKey));
  controls.get('/', async c => {
    c.header('Cache-Control', 'no-store');
    const client = getClient();
    if (!client?.getRefreshStatus) return c.json({ error: 'Session controls are unavailable.' }, 503);
    return c.json(await client.getRefreshStatus());
  });
  controls.post('/', async c => {
    const client = getClient();
    if (!client?.requestRefresh) return c.json({ error: 'Session controls are unavailable.' }, 503);
    let body: unknown;
    try { body = await c.req.json(); } catch { return c.json({ error: 'Invalid refresh request.' }, 400); }
    try { return c.json(client.requestRefresh(body), 202); }
    catch (error) {
      const status = error instanceof Error && 'status' in error && error.status === 400 ? 400
        : error instanceof Error && 'status' in error && error.status === 409 ? 409 : 503;
      return c.json({ error: status === 400 ? 'Provide a non-empty license key or omit it.'
        : status === 409 ? 'The session is busy or is not available for refresh.' : 'Session controls are unavailable.' }, status);
    }
  });
  app.route('/api/session/refresh', controls);
}
