import type { Context, Next } from 'hono';
import { applyDeprecationHeaders } from '../compat/deprecation';

export function apiKeyMiddleware(apiKey: string) {
  return async (c: Context, next: Next) => {
    const queryKey = c.req.query('api_key') || c.req.query('key');
    const headerKey =
      c.req.header('X-API-Key') ||
      c.req.header('api_key') ||
      c.req.header('key');

    const resolvedKey = queryKey || headerKey;

    if (c.req.query('api_key') || c.req.query('key') || c.req.header('api_key') || c.req.header('key')) {
      applyDeprecationHeaders(c, {
        route: 'legacy-api-key-alias',
        message: 'Legacy API key aliases are deprecated.',
        replacement: 'X-API-Key header',
      });
    }

    if (!resolvedKey || resolvedKey !== apiKey) {
      return c.json({ error: 'Unauthorized', details: 'Invalid or missing API key' }, 401);
    }

    return await next();
  };
}
