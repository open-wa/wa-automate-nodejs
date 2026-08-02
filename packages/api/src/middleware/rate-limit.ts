import type { Context, Next } from 'hono';

export function rateLimitMiddleware(maxRequests = 100, windowMs = 60000) {
  let requests: number[] = [];

  return async (c: Context, next: Next) => {
    const now = Date.now();
    requests = requests.filter((time) => now - time < windowMs);

    if (requests.length >= maxRequests) {
      return c.json({ error: 'Too Many Requests', details: 'Rate limit exceeded' }, 429);
    }

    // The standalone server has no trusted-proxy boundary. A per-server
    // bucket cannot be bypassed with client-supplied forwarding headers.
    requests.push(now);

    return await next();
  };
}
