import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { readFile } from 'node:fs/promises';
import { z } from '@open-wa/plugin-sdk';
import type { VoxtralService } from './service';

export function createVoxtralRoutes(service: VoxtralService): Hono {
  const app = new Hono();
  app.onError((error, c) => c.json({ error: error.message }, error.message.includes('another view') ? 409 : 400));
  app.get('/dashboard.js', async c => c.body(await readFile(new URL('../src/dashboard.js', import.meta.url), 'utf8'), 200, { 'Content-Type': 'text/javascript; charset=utf-8', 'Cache-Control': 'no-cache' }));
  app.get('/chat.js', async c => c.body(await readFile(new URL('../src/chat.js', import.meta.url), 'utf8'), 200, { 'Content-Type': 'text/javascript; charset=utf-8', 'Cache-Control': 'no-cache' }));
  app.get('/status', c => c.json(service.status()));
  app.get('/settings', c => c.json(service.settingsView()));
  app.patch('/settings', async c => {
    const body = z.object({ revision: z.number().int().nonnegative(), settings: z.record(z.string(), z.unknown()) }).strict().parse(await c.req.json());
    return c.json(await service.updateSettings(body.settings, body.revision));
  });
  app.post('/settings/reset', async c => c.json(await service.resetSettings()));
  app.get('/settings/export', c => c.text(service.exportConfig()));
  app.get('/voices', async c => c.json(await service.provider.voices(service.input.signal)));
  app.post('/voice-preview', async c => {
    const body = z.object({ text: z.string().trim().min(1).max(500).default('Hello! This is your WhatsApp voice assistant.'), voiceId: z.string().min(1).optional() }).strict().parse(await c.req.json());
    const settings = service.settings();
    const audio = await service.provider.speech(body.text, { ...settings, voice: { id: body.voiceId ?? settings.voice.id } }, service.input.signal, 'wav');
    return c.body(new Uint8Array(audio), 200, { 'Content-Type': 'audio/wav', 'Cache-Control': 'no-store' });
  });
  app.get('/conversations', c => {
    const offset = Math.max(0, Math.min(10_000, Number(c.req.query('offset')) || 0));
    const limit = Math.max(1, Math.min(100, Number(c.req.query('limit')) || 30));
    const all = service.list(); return c.json({ items: all.slice(offset, offset + limit), total: all.length, offset, limit });
  });
  app.get('/conversations/:id', c => c.json(service.conversation(c.req.param('id'))));
  for (const paused of [true, false]) {
    const action = paused ? 'pause' : 'resume';
    app.post(`/${action}`, async c => { await service.pause(paused); return c.json(service.status()); });
    app.post(`/conversations/:id/${action}`, async c => { await service.pause(paused, c.req.param('id')); return c.json(service.conversation(c.req.param('id'))); });
  }
  app.post('/conversations/:id/reset', c => { service.resetConversation(c.req.param('id')); return c.json(service.conversation(c.req.param('id'))); });
  app.get('/usage', c => c.json(service.usage()));
  app.post('/calls/start', async c => {
    const { to } = z.object({ to: z.string().regex(/^(?:\+?[0-9]{7,15}|[0-9]+@(?:c\.us|lid))$/) }).parse(await c.req.json());
    return c.json(await service.startCall(to));
  });
  for (const action of ['answer', 'reconnect', 'resume'] as const) {
    app.post(`/calls/:id/${action}`, async c => {
      const body = z.object({ generation: z.string().min(1), summary: z.string().max(4000).optional() }).parse(await c.req.json());
      return c.json(await service.attachCall(c.req.param('id'), action, body.generation, body.summary));
    });
  }
  app.post('/calls/:id/takeover', async c => {
    const { generation } = z.object({ generation: z.string().min(1) }).parse(await c.req.json());
    return c.json(await service.takeover(c.req.param('id'), generation));
  });
  app.post('/calls/:id/clear', async c => {
    const { generation } = z.object({ generation: z.string().min(1) }).parse(await c.req.json());
    return c.json(service.clearCall(c.req.param('id'), generation));
  });
  app.post('/calls/:id/mute', async c => {
    const { generation, muted } = z.object({ generation: z.string().min(1), muted: z.boolean() }).parse(await c.req.json());
    return c.json(await service.muteCall(c.req.param('id'), generation, muted));
  });
  app.get('/events', c => streamSSE(c, async stream => {
    let alive = true; let pending = false; let writing = false; let sequence = 0;
    const peer = c.req.query('peer');
    const selected = peer ? service.openChat(peer).id : c.req.query('conversation');
    const offset = Math.max(0, Math.min(10_000, Number(c.req.query('offset')) || 0));
    const limit = Math.max(1, Math.min(100, Number(c.req.query('limit')) || 20));
    const query = (c.req.query('q') ?? '').slice(0, 100).toLowerCase();
    const push = async () => {
      if (!alive) return;
      if (writing) { pending = true; return; }
      writing = true;
      try {
        do {
          pending = false;
          let conversation: unknown = null;
          if (selected) { try { conversation = service.conversation(selected); } catch { /* Expired context is reflected by the current list. */ } }
          const people = service.list().filter(person => `${person.name} ${person.peer}`.toLowerCase().includes(query));
          await stream.writeSSE({ event: 'snapshot', id: String(++sequence), data: JSON.stringify({ status: service.status(), conversations: people.slice(offset, offset + limit), conversationTotal: people.length, conversation, usage: service.usage() }) });
        } while (pending && alive);
      } catch { alive = false; }
      finally { writing = false; }
    };
    const unsubscribe = service.subscribe(() => { void push(); });
    stream.onAbort(() => { alive = false; unsubscribe(); });
    try {
      await push();
      while (alive && !service.input.signal.aborted) { await stream.sleep(15_000); if (alive) await stream.writeSSE({ event: 'ping', data: '{}' }); }
    } finally { alive = false; unsubscribe(); }
  }));
  return app;
}
