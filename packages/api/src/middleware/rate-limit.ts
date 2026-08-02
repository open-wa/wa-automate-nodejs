import type { Context, Next } from 'hono';

const requests = new Map<string, number[]>();

function getRequestKey(_c: Context): string {
  // The standalone server has no trusted-proxy boundary, so client-supplied
  // forwarding headers cannot safely identify callers. A process-wide bucket
  // is conservative and cannot be bypassed by spoofing X-Forwarded-For.
  return 'global';
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
