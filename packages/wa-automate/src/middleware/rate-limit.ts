import { Context, Next } from 'hono';

const requests = new Map<string, number[]>();

export function rateLimitMiddleware(maxRequests: number = 100, windowMs: number = 60000) {
    return async (c: Context, next: Next) => {
        const ip = c.req.header('x-forwarded-for') || 'unknown';
        const now = Date.now();

        if (!requests.has(ip)) {
            requests.set(ip, []);
        }

        const userRequests = requests.get(ip)!;
        // Filter out old requests
        const recentRequests = userRequests.filter(time => now - time < windowMs);

        if (recentRequests.length >= maxRequests) {
            return c.json({ error: 'Too Many Requests', details: 'Rate limit exceeded' }, 429);
        }

        recentRequests.push(now);
        requests.set(ip, recentRequests);

        return await next();
    };
}
