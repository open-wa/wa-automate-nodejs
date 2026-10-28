import { afterEach, expect, test } from 'bun:test';
import { createHash, randomUUID } from 'node:crypto';
import { rm } from 'node:fs/promises';
import { Effect } from 'effect';
import { createPlugin } from '@open-wa/plugin-sdk';
import { HooksConfigSchema, type HostHooks } from '@open-wa/config';
import { HyperEmitter } from '../../../packages/hyperemitter/src';
import { createLogger } from '../../../packages/logger/src';
import { PluginHost } from '../../../packages/core/src/plugins/PluginHost';
import type { PluginInput } from '@open-wa/plugin-sdk';
import jev from '../src';
import voxtral from '../../voxtral/src';
import { hydrateCall } from '../../../packages/client/src/calls';

const allowed = '447700900123@c.us', blocked = '447700900999@c.us';
const cleanups: Array<() => Promise<void>> = [];
const actualFetch = globalThis.fetch;
afterEach(async () => { globalThis.fetch = actualFetch; for (const cleanup of cleanups.splice(0)) await cleanup(); });
async function setup(hooks: HostHooks = { chatFilter: { allow: [allowed] } }) {
  const events = new HyperEmitter<any>(), calls: Array<{ method: string; args: unknown }> = [];
  const host = new PluginHost(events, createLogger({ component: 'chat-scope-test' }), hooks);
  let active: any = null, input!: PluginInput;
  const client = new Proxy({}, { get: (_target, method) => method === 'then' ? undefined : async (...args: unknown[]) => { calls.push({ method: String(method), args }); return 'submitted'; } });
  host.bindRuntime(async (method, args) => {
    if (method === 'getActiveCall') return active;
    calls.push({ method, args }); return 'submitted';
  });
  const sessionId = `chat-scope-${randomUUID()}`;
  cleanups.push(async () => { await host.dispose(); await Effect.runPromise(events.close()); const scope = createHash('sha256').update(sessionId).digest('hex').slice(0, 24); for (const name of ['jev', 'jev-conversations', 'voxtral']) await rm(`.open-wa/plugins/${name}/${scope}`, { recursive: true, force: true }); });
  await host.register(createPlugin({ meta: { name: 'probe' }, init: async value => { input = value; return {}; } }), { sessionId, client: client as any });
  return { host, events, calls, input, sessionId, client, setCall: (call: any) => { active = call; } };
}

test('chat filter covers named hooks, catch-all, on and once without consuming a blocked event', async () => {
  const { host, events, sessionId, client } = await setup();
  const seen: string[] = [];
  await host.register(createPlugin({ meta: { name: 'listeners' }, init: async input => {
    input.events.on('message.received', () => { seen.push('on'); });
    input.events.once('message.received', () => { seen.push('once'); });
    return { 'message.received': () => { seen.push('named'); }, event: ({ event }) => { if (event === 'message.received') seen.push('catchall'); } };
  } }), { sessionId, client: client as any });
  for (const message of [{ from: blocked }, { from: allowed, chatId: '123456@g.us' }, {}]) await events.emit('message.received', { message: { id: randomUUID(), type: 'chat', body: 'Hello', ...message } });
  await Bun.sleep(10); expect(seen).toEqual([]);
  await events.emit('message.received', { message: { id: randomUUID(), from: allowed, type: 'chat', body: 'Hello' } });
  await Bun.sleep(10); expect(seen.sort()).toEqual(['catchall', 'named', 'on', 'once']);
  await events.emit('message.received', { message: { id: randomUUID(), from: allowed, type: 'chat', body: 'Again' } });
  await Bun.sleep(10); expect(seen.filter(value => value === 'once')).toHaveLength(1);
});

test('outbound runtime, client and ask cannot bypass the chat filter', async () => {
  const { input, calls } = await setup();
  for (const method of ['sendText', 'sendPtt', 'sendInteractive', 'startCall', 'deleteMessage']) await expect(input.runtime.invoke(method, [blocked, 'data'])).rejects.toMatchObject({ code: 'PLUGIN_HOOK_REJECTED', outcome: 'not_sent' });
  await expect(input.client.sendText(blocked, 'Hello')).rejects.toMatchObject({ code: 'PLUGIN_HOOK_REJECTED' });
  await expect(input.client.ask('sendText', { to: blocked, content: 'Hello' })).rejects.toMatchObject({ code: 'PLUGIN_HOOK_REJECTED' });
  await expect(input.runtime.invoke('unregisteredWrite', [allowed])).rejects.toMatchObject({ code: 'PLUGIN_HOOK_REJECTED' });
  expect(calls).toEqual([]);
  await input.runtime.invoke('sendText', [allowed, 'Runtime reply']);
  await input.client.sendText(allowed, 'Client reply');
  await input.client.ask('sendText', { to: allowed, content: 'Ask reply' });
  expect(calls).toHaveLength(3);
});

test('call snapshots and identity-based call actions remain scoped', async () => {
  const { input, setCall, calls } = await setup();
  let accepted = 0;
  const identity = { id: 'call', generation: 'generation', sessionId: 'session' };
  setCall({ ...identity, peer: blocked, accept: async () => { accepted++; return { ok: true }; } });
  expect(await input.runtime.invoke('getActiveCall')).toBeNull();
  await expect(input.runtime.invoke('acceptCall', [identity])).rejects.toMatchObject({ code: 'PLUGIN_HOOK_REJECTED' });
  expect(calls).toEqual([]); expect(accepted).toBe(0);
  setCall({ ...identity, peer: allowed, accept: async () => { accepted++; return { ok: true }; } });
  const call = await input.runtime.invoke<any>('getActiveCall');
  expect(await call.accept()).toEqual({ ok: true }); expect(accepted).toBe(1);
});

test('hydrated immutable call methods stay callable through the chat guard', async () => {
  const { input, setCall } = await setup();
  let accepted = 0;
  const snapshot = { id: 'call', generation: 'generation', sessionId: 'session', peer: allowed, state: 'ringing', direction: 'incoming', video: false, terminal: false, observedAt: Date.now() } as const;
  const actual = Object.freeze(hydrateCall(snapshot, { acceptCall: async () => { accepted++; return { ok: true, status: 'requested' }; } } as any));
  setCall(actual);
  const guarded = await input.runtime.invoke<any>('getActiveCall');
  expect(await guarded.accept()).toEqual({ ok: true, status: 'requested' });
  expect(accepted).toBe(1);
  expect(Object.getOwnPropertyDescriptor(guarded, 'accept')?.enumerable).toBe(false);
  expect(JSON.stringify(guarded)).toBe(JSON.stringify(snapshot));
});

test('empty lists block every chat and custom hooks can veto without weakening the scope', async () => {
  expect(() => HooksConfigSchema.parse({ chatFilter: {} })).toThrow();
  expect(() => new PluginHost(new HyperEmitter<any>(), createLogger({ component: 'invalid-scope' }), { chatFilter: false } as any)).toThrow();
  const empty = await setup({ chatFilter: { allow: [] } });
  await expect(empty.input.runtime.invoke('sendText', [allowed, 'Hello'])).rejects.toMatchObject({ code: 'PLUGIN_HOOK_REJECTED' });
  const custom = await setup({ chatFilter: { allow: [allowed] }, beforeAction: () => false });
  await expect(custom.input.runtime.invoke('sendText', [allowed, 'Hello'])).rejects.toMatchObject({ code: 'PLUGIN_HOOK_REJECTED' });
  const changed = await setup({ chatFilter: { allow: [allowed] }, beforeAction: ({ args }) => { (args as unknown[])[0] = blocked; } });
  await expect(changed.input.runtime.invoke('sendText', [allowed, 'Hello'])).rejects.toMatchObject({ code: 'PLUGIN_HOOK_REJECTED' });
  const renamed = await setup({ chatFilter: { allow: [allowed] }, beforeAction: context => { (context.args as unknown[])[0] = blocked; (context as any).method = 'getLicenseFeatures'; } });
  await expect(renamed.input.runtime.invoke('sendText', [allowed, 'Hello'])).rejects.toThrow();
  expect([...empty.calls, ...custom.calls, ...changed.calls, ...renamed.calls]).toEqual([]);
});

test('real Jev and Voxtral do not invoke any model or action for excluded text, notes, selections or calls', async () => {
  const { host, events, sessionId, client, calls } = await setup();
  let requests = 0;
  globalThis.fetch = (async () => { requests++; throw new Error('Excluded chat reached a model.'); }) as typeof fetch;
  for (const plugin of [jev, voxtral]) await host.register(plugin, { sessionId, client: client as any, pluginConfig: { jev: { apiKey: 'test-only', jevApiKey: 'test-only' }, voxtral: { apiKey: 'test-only', jevApiKey: 'test-only', mode: 'both' } } });
  await events.emit('client.ready', { sessionId });
  await events.emit('message.received', { message: { id: 'text', from: blocked, type: 'chat', body: 'Reply to me.' } });
  await events.emit('message.received', { message: { id: 'note', from: blocked, type: 'ptt' } });
  await events.emit('interactive.response', { response: { chatId: blocked, messageId: 'selection', type: 'reply', id: 'confirm' } });
  await events.emit('call.incoming', { call: { id: 'call', generation: 'generation', peer: blocked, state: 'ringing', terminal: false } });
  await Bun.sleep(25);
  expect(requests).toBe(0); expect(calls).toEqual([]);
  for (const entry of host.getRoutes()) {
    expect((await (await entry.router.request('/conversations')).json()).items).toEqual([]);
    expect((await (await entry.router.request('/status')).json()).ready).toBe(true);
  }
});
