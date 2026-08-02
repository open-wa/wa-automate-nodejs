import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';
import { rateLimitMiddleware } from '../src/middleware/rate-limit.js';

describe('rateLimitMiddleware', () => {
  it('cannot be bypassed with spoofed forwarding headers', async () => {
    const app = new Hono();
    app.use('/*', rateLimitMiddleware(2, 60_000));
    app.get('/health/live', (c) => c.json({ status: 'ok' }));

    const first = await app.request('/health/live', {
      headers: { 'X-Forwarded-For': '198.51.100.1' },
    });
    const second = await app.request('/health/live', {
      headers: { 'X-Forwarded-For': '198.51.100.2' },
    });
    const blocked = await app.request('/health/live', {
      headers: { 'X-Forwarded-For': '198.51.100.3' },
    });

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(blocked.status).toBe(429);
  });
});
