import type { Context, Next } from 'hono';
import { timingSafeEqual } from 'node:crypto';

function apiKeysMatch(candidate: string, expected: string): boolean {
  const candidateBuffer = Buffer.from(candidate);
  const expectedBuffer = Buffer.from(expected);

  return candidateBuffer.length === expectedBuffer.length
    && timingSafeEqual(candidateBuffer, expectedBuffer);
}

export function apiKeyMiddleware(apiKey: string) {
  return async (c: Context, next: Next) => {
    const resolvedKey = c.req.header('X-API-Key');

    if (!resolvedKey || !apiKeysMatch(resolvedKey, apiKey)) {
      return c.json({ error: 'Unauthorized', details: 'Invalid or missing API key' }, 401);
    }

    return await next();
  };
}
