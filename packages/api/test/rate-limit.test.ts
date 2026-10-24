import { expect, it } from 'vitest';
import { Hono } from 'hono';
import { rateLimitMiddleware } from '../src/middleware/rate-limit';

it('keeps session-control polling separate from the runtime request budget', async () => {
  const app = new Hono();
  app.use('/controls/*', rateLimitMiddleware(1));
  app.use('/runtime/*', rateLimitMiddleware(1));
  app.get('/controls/status', c => c.json({ ready: true }));
  app.get('/runtime/messages', c => c.json([]));
  expect((await app.request('/controls/status')).status).toBe(200);
  expect((await app.request('/runtime/messages')).status).toBe(200);
  expect((await app.request('/controls/status')).status).toBe(429);
  expect((await app.request('/runtime/messages')).status).toBe(429);
});
