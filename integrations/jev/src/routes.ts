import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { readFile } from 'node:fs/promises';
import { z } from '@open-wa/plugin-sdk';
import type { JevService } from './service';
export function createJevRoutes(service: JevService) {
  const app = new Hono();
  app.onError((error, c) => c.json({ error: error.message }, error.message.includes('another view') ? 409 : 400));
  for (const file of ['dashboard.js', 'chat.js']) app.get(`/${file}`, async c => c.body(await readFile(new URL(`../src/${file}`, import.meta.url), 'utf8'), 200, { 'Content-Type': 'text/javascript; charset=utf-8', 'Cache-Control': 'no-cache' }));
  app.get('/status', c => c.json(service.status()));
  app.get('/settings', c => c.json(service.settingsView()));
  app.patch('/settings', async c => { const body = z.object({ revision: z.number().int().nonnegative(), settings: z.record(z.string(), z.unknown()) }).strict().parse(await c.req.json()); return c.json(await service.updateSettings(body.settings, body.revision)); });
  app.post('/settings/reset', async c => c.json(await service.resetSettings()));
  app.get('/usage', c => c.json(service.usage()));
  app.get('/conversations', c => c.json({ items: service.list() }));
  app.get('/conversations/:id', c => c.json(service.conversation(c.req.param('id'))));
  for (const [action, paused] of [['pause', true], ['resume', false]] as const) {
    app.post(`/${action}`, async c => { await service.pause(paused); return c.json(service.status()); });
    app.post(`/conversations/:id/${action}`, async c => { await service.pause(paused, c.req.param('id')); return c.json(service.conversation(c.req.param('id'))); });
  }
  app.post('/conversations/:id/reset', c => { service.resetConversation(c.req.param('id')); return c.json(service.conversation(c.req.param('id'))); });
  app.post('/actions/preview', async c => { const { text } = z.object({ text: z.string().trim().min(1).max(3000) }).parse(await c.req.json()); return c.json(await service.previewAction(text, AbortSignal.any([service.input.signal, c.req.raw.signal]))); });
  app.get('/events', c => streamSSE(c, async stream => {
    const peer = c.req.query('peer'); const id = peer ? service.openChat(peer).id : undefined;
    let alive = true, writing = false, pending = false;
    const push = async () => {
      if (!alive) return; if (writing) { pending = true; return; } writing = true;
      try {
        do { pending = false; let conversation: unknown = null; if (id) { try { conversation = service.conversation(id); } catch { /* Expiry appears in the next snapshot. */ } }
          await stream.writeSSE({ event: 'snapshot', data: JSON.stringify({ status: service.status(), conversation, usage: service.usage() }) });
        } while (pending && alive);
      } catch { alive = false; } finally { writing = false; }
    };
    const unsubscribe = service.subscribe(() => { void push(); });
    stream.onAbort(() => { alive = false; unsubscribe(); });
    try { await push(); while (alive && !service.input.signal.aborted) { await stream.sleep(15_000); if (alive) await stream.writeSSE({ event: 'ping', data: '{}' }); } }
    finally { alive = false; unsubscribe(); }
  }));
  return app;
}
