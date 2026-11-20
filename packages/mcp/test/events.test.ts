import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { Hono } from 'hono';
import { Webhook } from 'standardwebhooks';
import type { Config } from '@open-wa/schema';
import { createHonoMcpAdapter } from '../src/adapter/hono-mcp';
import { McpEventsService } from '../src/events/service';

const SECRET = `whsec_${Buffer.alloc(32, 7).toString('base64')}`;
const dirs: string[] = [];
const services: McpEventsService[] = [];
afterEach(async () => {
  await Promise.all(services.splice(0).map(service => service.close()));
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

function storePath() {
  const dir = mkdtempSync(join(tmpdir(), 'mcp-events-'));
  dirs.push(dir);
  return join(dir, 'events.sqlite');
}

interface Posted { url: string; body: string; headers: Record<string, string> }
function service(options: { path?: string; owner?: string; respond?: (posted: Posted) => { status: number; body: string } } = {}) {
  const posted: Posted[] = [];
  const instance = new McpEventsService({
    sessionId: 's1', storePath: options.path ?? storePath(), owner: () => options.owner ?? 'owner-a',
    lifetimeMs: 60 * 60_000, retentionMs: 15 * 60_000,
    post: async (url, body, headers) => {
      const call = { url, body, headers };
      posted.push(call);
      if (options.respond) return options.respond(call);
      const parsed = JSON.parse(body);
      return { status: 200, body: parsed.type === 'verification' ? JSON.stringify({ challenge: parsed.challenge }) : '' };
    },
  });
  services.push(instance);
  return { instance, posted };
}

const message = (id: string, chatId: string, body = 'hi') => ({ ctx: { correlationId: 'c', ts: Date.now() }, message: { id, chatId, from: chatId, body } });
const until = async (check: () => boolean) => {
  for (let i = 0; i < 100 && !check(); i++) await new Promise(resolve => setTimeout(resolve, 20));
  expect(check()).toBe(true);
};

describe('events/poll', () => {
  it('bootstraps with a fresh cursor, then returns matching events after it', () => {
    const { instance } = service();
    instance.publish('message.received', message('m0', 'a@c.us'));
    const first = instance.poll({ name: 'message.received', arguments: { chatId: 'a@c.us' }, cursor: null });
    expect(first).toMatchObject({ resultType: 'complete', events: [], truncated: false, hasMore: false });

    instance.publish('message.received', message('m1', 'a@c.us'));
    instance.publish('message.received', message('m2', 'b@c.us'));
    const second = instance.poll({ name: 'message.received', arguments: { chatId: 'a@c.us' }, cursor: first.cursor });
    expect(second.events.map(event => event.eventId)).toEqual(['m1']);
    expect(second.events[0]).not.toHaveProperty('cursor');

    const third = instance.poll({ name: 'message.received', arguments: { chatId: 'a@c.us' }, cursor: second.cursor });
    expect(third.events).toEqual([]);
  });

  it('pages with maxEvents without skipping events', () => {
    const { instance } = service();
    const start = instance.poll({ name: 'message.received', arguments: {}, cursor: null }).cursor;
    for (const id of ['m1', 'm2', 'm3']) instance.publish('message.received', message(id, 'a@c.us'));
    const page = instance.poll({ name: 'message.received', arguments: {}, cursor: start, maxEvents: 2 });
    expect(page.events.map(event => event.eventId)).toEqual(['m1', 'm2']);
    expect(page.hasMore).toBe(true);
    const rest = instance.poll({ name: 'message.received', arguments: {}, cursor: page.cursor, maxEvents: 2 });
    expect(rest.events.map(event => event.eventId)).toEqual(['m3']);
    expect(rest.hasMore).toBe(false);
  });

  it('reports a foreign cursor as a gap and maps errors to the spec codes', () => {
    const { instance } = service();
    const result = instance.poll({ name: 'message.received', arguments: {}, cursor: 'abcdef012345.4' });
    expect(result.truncated).toBe(true);
    expect(() => instance.poll({ name: 'nope', arguments: {}, cursor: null })).toThrow(expect.objectContaining({ code: -32023 }));
    expect(() => instance.poll({ name: 'message.received', arguments: { other: 1 }, cursor: null })).toThrow(expect.objectContaining({ code: -32602 }));
  });

  it('keeps cursors valid across a restart on the same journal', async () => {
    const path = storePath();
    const before = service({ path }).instance;
    const cursor = before.poll({ name: 'message.received', arguments: {}, cursor: null }).cursor;
    before.publish('message.received', message('m1', 'a@c.us'));
    await before.close();
    const after = service({ path }).instance;
    const result = after.poll({ name: 'message.received', arguments: {}, cursor });
    expect(result.truncated).toBe(false);
    expect(result.events.map(event => event.eventId)).toEqual(['m1']);
  });
});

describe('events/stream', () => {
  it('replays from a cursor, delivers live events and terminates when access is revoked', async () => {
    let owner = 'owner-a';
    const instance = new McpEventsService({ sessionId: 's1', storePath: storePath(), owner: () => owner, lifetimeMs: 60_000, retentionMs: 60_000 });
    services.push(instance);
    const cursor = instance.poll({ name: 'message.received', arguments: {}, cursor: null }).cursor;
    instance.publish('message.received', message('m1', 'a@c.us'));
    const sent: { method: string; params: Record<string, any> }[] = [];
    const finished = instance.stream({ name: 'message.received', arguments: {}, cursor, heartbeatMs: 5000 }, {
      requestId: 3, signal: new AbortController().signal, notify: async (method, params) => { sent.push({ method, params }); },
    });
    await until(() => sent.length === 2);
    instance.publish('message.received', message('m2', 'a@c.us'));
    await until(() => sent.length === 3);
    expect(sent.map(item => item.method)).toEqual(['notifications/events/active', 'notifications/events/event', 'notifications/events/event']);
    expect(sent.map(item => item.params.eventId).slice(1)).toEqual(['m1', 'm2']);
    expect(sent[0].params._meta).toEqual({ 'io.modelcontextprotocol/subscriptionId': 3 });

    owner = 'owner-b';
    await expect(finished).resolves.toMatchObject({ resultType: 'complete' });
    expect(sent.at(-1)).toMatchObject({ method: 'notifications/events/terminated', params: { error: { code: -32024, message: 'Forbidden' } } });
  });
});

describe('events/subscribe webhook delivery', () => {
  it('verifies, signs per delivery and carries a watermark cursor', async () => {
    const { instance, posted } = service();
    const subscription = await instance.subscribe({
      name: 'message.received', arguments: { chatId: 'a@c.us' }, delivery: { mode: 'webhook', url: 'https://hooks.example.com/x', secret: SECRET }, cursor: null,
    });
    expect(subscription).toMatchObject({ resultType: 'complete', truncated: false });
    expect(posted[0].headers['webhook-id']).toMatch(/^msg_verification_/);

    instance.publish('message.received', message('m1', 'a@c.us'));
    await until(() => posted.length === 2);
    const delivery = posted[1];
    const body = JSON.parse(delivery.body);
    expect(body).toMatchObject({ eventId: 'm1', name: 'message.received' });
    expect(delivery.headers['webhook-id']).toMatch(/^msg_[0-9a-f]{32}$/);
    expect(delivery.headers['X-MCP-Subscription-Id']).toBe(subscription.id);
    expect(() => new Webhook(SECRET).verify(delivery.body, delivery.headers)).not.toThrow();
    // The watermark never passes the event being delivered.
    expect(Number(body.cursor.split('.')[1])).toBeLessThan(Number(instance.poll({ name: 'message.received', arguments: {}, cursor: null }).cursor.split('.')[1]));

    const refresh = await instance.subscribe({
      name: 'message.received', arguments: { chatId: 'a@c.us' }, delivery: { mode: 'webhook', url: 'https://hooks.example.com/x', secret: SECRET }, cursor: body.cursor,
    });
    expect(refresh.deliveryStatus).toMatchObject({ active: true, lastError: null });
    expect(refresh.cursor).not.toBe(body.cursor);
  });

  it('replays retained events from a cursor for a new subscription', async () => {
    const { instance, posted } = service();
    const cursor = instance.poll({ name: 'message.received', arguments: {}, cursor: null }).cursor;
    instance.publish('message.received', message('m1', 'a@c.us'));
    await instance.subscribe({ name: 'message.received', arguments: {}, delivery: { mode: 'webhook', url: 'https://hooks.example.com/r', secret: SECRET }, cursor });
    await until(() => posted.some(call => call.body.includes('"m1"')));
  });

  it('rejects a failed challenge with CallbackEndpointError and no raw response', async () => {
    const { instance } = service({ respond: () => ({ status: 200, body: '{"challenge":"wrong"}' }) });
    await expect(instance.subscribe({
      name: 'message.received', arguments: {}, delivery: { mode: 'webhook', url: 'https://hooks.example.com/y', secret: SECRET },
    })).rejects.toMatchObject({ code: -32027, data: { reason: 'challenge_failed' } });
  });

  it('sends a terminated envelope when the principal changes', async () => {
    const path = storePath();
    const first = service({ path });
    await first.instance.subscribe({ name: 'ack.changed', arguments: {}, delivery: { mode: 'webhook', url: 'https://hooks.example.com/t', secret: SECRET } });
    await first.instance.close();
    const second = service({ path, owner: 'owner-b' });
    second.instance.publish('ack.changed', { ctx: { ts: Date.now() }, ack: { id: 'm1', ack: 2 } });
    await until(() => second.posted.length === 1);
    expect(JSON.parse(second.posted[0].body)).toEqual({ type: 'terminated', error: { code: -32024, message: 'Forbidden', data: { reason: 'Access revoked' } } });
    expect(second.posted[0].headers['webhook-id']).toMatch(/^msg_terminated_/);
  });

  it('answers unsubscribe for an unknown subscription with NotFound', () => {
    const { instance } = service();
    expect(() => instance.unsubscribe({ name: 'message.received', arguments: {}, delivery: { url: 'https://hooks.example.com/z' } }))
      .toThrow(expect.objectContaining({ code: -32023, data: { kind: 'subscription' } }));
  });
});

describe('MCP endpoint', () => {
  const API_KEY = 'test-api-key-123';
  function endpoint() {
    const config = {
      sessionId: 'endpoint', apiKey: API_KEY,
      mcp: { enabled: true, path: '/mcp', exposeToolsMeta: true, events: { enabled: true, storePath: storePath(), lifetimeMs: 3_600_000, retentionMs: 900_000 } },
    } as unknown as Config;
    const app = new Hono();
    const adapter = createHonoMcpAdapter({ config, clientSource: () => ({}) });
    adapter.mount(app, '/mcp');
    return { app, adapter };
  }
  const envelope = {
    'io.modelcontextprotocol/protocolVersion': '2026-07-28',
    'io.modelcontextprotocol/clientInfo': { name: 'test', version: '1.0.0' },
    'io.modelcontextprotocol/clientCapabilities': { extensions: { 'io.modelcontextprotocol/events': {} } },
  };
  function request(method: string, params: Record<string, unknown>, init: { name?: string; signal?: AbortSignal } = {}) {
    return new Request('http://localhost/mcp', {
      method: 'POST', signal: init.signal,
      headers: {
        'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', 'X-API-Key': API_KEY,
        'MCP-Protocol-Version': '2026-07-28', 'Mcp-Method': method, ...(init.name ? { 'Mcp-Name': init.name } : {}),
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: 7, method, params: { ...params, _meta: envelope } }),
    });
  }

  it('advertises the extension on server/discover and serves events/list and events/poll', async () => {
    const { app, adapter } = endpoint();
    try {
      const discover = await (await app.request(request('server/discover', {}))).json();
      expect(discover.result.capabilities.extensions['io.modelcontextprotocol/events']).toEqual({});
      expect(discover.result.capabilities.events).toEqual({});

      const list = await (await app.request(request('events/list', {}))).json();
      expect(list.result.resultType).toBe('complete');
      expect(list.result.events[0].delivery).toEqual(['poll', 'push', 'webhook']);

      const poll = await (await app.request(request('events/poll', { name: 'message.received', arguments: {}, cursor: null }, { name: 'message.received' }))).json();
      expect(poll.result).toMatchObject({ resultType: 'complete', events: [], hasMore: false });

      const mismatch = await app.request(request('events/poll', { name: 'message.received', arguments: {}, cursor: null }, { name: 'ack.changed' }));
      expect(mismatch.status).toBe(400);
      expect((await mismatch.json()).error.code).toBe(-32020);
    } finally { await adapter.close(); }
  });

  it('streams events/stream over SSE until the client aborts', async () => {
    const { app, adapter } = endpoint();
    const abort = new AbortController();
    try {
      const response = await app.request(request('events/stream', { name: 'message.received', arguments: { chatId: 'a@c.us' }, cursor: null }, { name: 'message.received', signal: abort.signal }));
      expect(response.headers.get('content-type')).toContain('text/event-stream');
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let text = '';
      const frames = () => text.split('\n').filter(line => line.startsWith('data:')).map(line => JSON.parse(line.slice(5)));
      const read = async (count: number) => {
        while (frames().length < count) {
          const { value, done } = await reader.read();
          if (done) break;
          text += decoder.decode(value, { stream: true });
        }
      };
      await read(1);
      expect(frames()[0]).toMatchObject({ method: 'notifications/events/active', params: { truncated: false, heartbeatMs: 30_000, _meta: { 'io.modelcontextprotocol/subscriptionId': 7 } } });

      adapter.publishEvent('message.received', message('m9', 'b@c.us'));
      adapter.publishEvent('message.received', message('m1', 'a@c.us'));
      await read(2);
      expect(frames()[1]).toMatchObject({ method: 'notifications/events/event', params: { eventId: 'm1', data: { chatId: 'a@c.us' } } });
      expect(frames()[1].params.cursor).toMatch(/^[0-9a-f]+\.\d+$/);
      abort.abort();
      await reader.cancel().catch(() => undefined);
    } finally { await adapter.close(); }
  });
});
