import type { MiddlewareHandler } from 'hono';
import { log } from '../utils/logging';
import { getLatestApiKey } from '../watcher/firebase_db';

/**
 * API key authentication middleware.
 *
 * Bypasses auth for:
 * - All GET requests
 * - Proxy routes (/api/*) that aren't the /list endpoint
 *
 * Validates against:
 * 1. The API_KEY environment variable
 * 2. The latest key from Firebase (fallback for key rotation)
 * 3. Cloudflare Access tokens (when CF_AUTH_ONLY is enabled)
 */
export const authMiddleware: MiddlewareHandler = async (c, next) => {
  const header = (name: string) => c.req.header(name) || c.req.header(name.toLowerCase());

  const apiKey = header('api_access_token') || header('api-access-token');
  const hasCfTokens = header('CF-Access-Client-Id') && header('CF-Access-Client-Secret');

  // Bypass auth for GET requests and proxy routes (except /list)
  if (c.req.method === 'GET' || (c.req.path.includes('/api/') && !c.req.path.endsWith('/list'))) {
    log.info('Auth bypass: GET or proxy route');
    return next();
  }

  // Cloudflare Access tokens bypass
  if (hasCfTokens && process.env.CF_AUTH_ONLY) {
    return next();
  }

  // Validate API key
  if (apiKey === process.env.API_KEY) {
    return next();
  }

  // Fallback: check Firebase for rotated keys
  const latestKey = await getLatestApiKey();
  if (apiKey === latestKey) {
    return next();
  }

  log.info('Auth rejected: invalid API key');
  return c.json({ error: 'unauthorised' }, 401);
};
