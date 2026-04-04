import type { Context, Next } from 'hono';

const requests = new Map<string, number[]>();

function getRequestKey(c: Context): string {
  const forwarded = c.req.header('x-forwarded-for');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  return c.req.header('x-real-ip') || 'unknown';
}

export function rateLimitMiddleware(maxRequests = 100, windowMs = 60000) {
  return async (c: Context, next: Next) => {
    const requestKey = getRequestKey(c);
    const now = Date.now();
    const recentRequests = (requests.get(requestKey) || []).filter((time) => now - time < windowMs);

    if (recentRequests.length >= maxRequests) {
      return c.json({ error: 'Too Many Requests', details: 'Rate limit exceeded' }, 429);
    }

    recentRequests.push(now);
    requests.set(requestKey, recentRequests);

    return await next();
  };
}
