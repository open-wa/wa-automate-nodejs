import { afterEach, expect, test } from 'bun:test';
import { randomUUID, createHash } from 'node:crypto';
import { rm } from 'node:fs/promises';
import { Effect } from 'effect';
import { HyperEmitter } from '../../../packages/hyperemitter/src';
import { createLogger } from '../../../packages/logger/src';
import { PluginHost } from '../../../packages/core/src/plugins/PluginHost';
import type { OpenWAEventMap } from '../../../packages/core/src/events/eventMap';
import jevPlugin from '../src';
import { fixtureAnswers } from './fixtures';

const originalFetch = globalThis.fetch;
const cleanups: Array<() => Promise<void>> = [];
afterEach(async () => { globalThis.fetch = originalFetch; for (const cleanup of cleanups.splice(0)) await cleanup(); });
const peer = '447700900123@c.us';
const appointment = '26 October 2026 at 14:00 London time for 30 minutes at OpenWA office';
const booking = { title: 'Demo appointment', booking: { date: '2026-10-26', time: '14:00', timeZone: 'Europe/London', durationMinutes: 30, location: 'OpenWA office' } };
const buttons = { body: 'Choose', actions: [{ type: 'reply', id: 'confirm', label: 'Confirm' }, { type: 'reply', id: 'reschedule', label: 'Reschedule' }] };
const form = { body: 'Choose your preferences', questions: [{ type: 'singleSelect', id: 'reminder', label: 'Reminder', options: [{ id: 'hour', label: 'One hour before' }, { id: 'day', label: 'One day before' }] }, { type: 'multiSelect', id: 'drinks', label: 'Drinks', options: [{ id: 'tea', label: 'Tea' }, { id: 'water', label: 'Water' }] }] };
async function until(predicate: () => Promise<boolean>) { const deadline = Date.now() + 5000; while (!await predicate()) { if (Date.now() > deadline) throw new Error('Assistant did not settle'); await Bun.sleep(5); } }
async function setup(options: { formats?: string[]; unknown?: boolean; interactive?: boolean; maliciousCorrection?: boolean; unconfirmedDescription?: boolean; withVoxtral?: boolean; reverse?: boolean; forgetRemaining?: boolean } = {}) {
  const sessionId = `jev-standalone-test-${randomUUID()}`, controller = new AbortController();
  const events = new HyperEmitter<OpenWAEventMap>();
  const host = new PluginHost(events, createLogger({ component: 'jev-test' }));
  const sent: Array<{ method: string; args: any[] }> = [], requests: any[] = [];
  const formats = options.formats ?? [];
  host.bindRuntime(async (method, args) => {
    if (method === 'getLicenseFeatures') return { status: 'valid', features: { interactive: options.interactive !== false } };
    if (options.withVoxtral && method === 'decryptMedia') return 'data:audio/ogg;base64,T2dnUw==';
    if (![...['sendText', 'sendInteractive', 'deleteMessage'], ...(options.withVoxtral ? ['sendPtt'] : [])].includes(method)) throw new Error(`Standalone Jev invoked an audio or unsupported operation: ${method}`);
    sent.push({ method, args });
    if (options.unknown && method === 'sendInteractive') throw new Error('Connection lost after dispatch');
    return method === 'deleteMessage' ? true : `true_${peer}_OUT${sent.length}`;
  });
  globalThis.fetch = (async (url: any, init: any) => {
    const path = new URL(String(url)).pathname, body = init.body instanceof FormData ? init.body : JSON.parse(init.body); requests.push({ path, body });
    if (options.withVoxtral && path.endsWith('/audio/transcriptions')) return Response.json({ text: 'Send Confirm or Reschedule reply buttons.' });
    if (options.withVoxtral && path.endsWith('/audio/speech')) { const pcm = Buffer.alloc(9600); for (let i = 0; i < 2400; i++) pcm.writeFloatLE(0.2 * Math.sin(i / 8), i * 4); return Response.json({ audio_data: pcm.toString('base64') }); }
    if (path.endsWith('/systemone')) {
      const outcomes = body.state.actionResults.map((entry: any) => entry.result);
      const uncertain = outcomes.some((entry: any) => entry.status === 'unknown');
      const completed = outcomes.filter((entry: any) => ['submitted', 'already_submitted'].includes(entry.status)).map((entry: any) => entry.format);
      const correction = /^No, I said/.test(body.state.latestRequest);
      let action = body.state.latestInput === 'selection' || correction && completed.includes('correct-booking') ? 'none' : correction && !completed.length ? 'correct-booking' : formats.find(format => !completed.includes(format)) ?? 'none';
      if (uncertain || !Object.hasOwn(body.questions.action.criteria, action) || options.forgetRemaining && completed.length > 0) action = 'none';
      const needs = options.forgetRemaining && body.state.latestInput !== 'selection' ? Object.fromEntries(formats.map(format => [`need_${format}`, completed.includes(format) ? 'no' : 'ready'])) : {};
      const answers = fixtureAnswers(body, { action, next: uncertain ? 'reconcile' : action === 'none' ? 'respond' : 'act', reply: 'accept', proposal: 'accept', field: 'none', button: 'reply', ...needs });
      if (options.unconfirmedDescription && correction && body.state.phase === 'input' && answers.change_description) answers.change_description = { type: 'choice', choice: 'change', confidence: 1, probabilities: { keep: 0, change: 1 } };
      return Response.json({ model: 'jev-fixture', answers });
    }
    if (path.endsWith('/chat/completions')) {
      if (!body.tools?.length) return Response.json({ choices: [{ message: { content: body.messages.filter((entry: any) => entry.role === 'user').length > 1 ? 'I remember pineapple and seven.' : 'I will remember pineapple and seven.' }, finish_reason: 'stop' }] });
      const tool = body.tools[0].function;
      const args = tool.name === 'correct_booking_card' ? { booking: { time: '14:00', ...(options.maliciousCorrection ? { date: '2030-01-01', location: 'Invented location', durationMinutes: 999 } : {}), ...(options.unconfirmedDescription ? { description: 'An unrelated remembered word' } : {}) } }
        : tool.parameters.properties.booking ? booking : tool.parameters.properties.questions ? form : buttons;
      return Response.json({ choices: [{ finish_reason: 'tool_calls', message: { content: null, tool_calls: [{ id: randomUUID(), type: 'function', function: { name: tool.name, arguments: JSON.stringify(args) } }] } }] });
    }
    throw new Error(`Standalone Jev used a non-chat endpoint: ${path}`);
  }) as typeof fetch;
  const registerVoice = async () => { const { default: voxtral } = await import('../../voxtral/src'); await host.register(voxtral, { sessionId, client: {} as any, pluginConfig: { voxtral: { apiKey: 'test-only', jevApiKey: 'test-only', voiceNotes: { acceptText: true } } } }); };
  if (options.withVoxtral && options.reverse) await registerVoice();
  await host.register(jevPlugin, { sessionId, client: {} as any, pluginConfig: { jev: { apiKey: 'test-only', jevApiKey: 'test-only' } } });
  if (options.withVoxtral && !options.reverse) await registerVoice();
  const routes = host.getRoutes().find(entry => entry.name === 'jev')!.router;
  const get = async (path: string) => (await routes.request(path)).json() as Promise<any>;
  const post = async (path: string, value?: unknown) => routes.request(path, { method: 'POST', ...(value ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value) } : {}) });
  await events.emit('client.ready', { sessionId } as any);
  const message = async (text: string, id = randomUUID()) => {
    await events.emit('message.received', { message: { id, from: peer, type: 'chat', body: text } } as any);
    await until(async () => { const list = await get('/conversations'); if (!list.items.length) return false; const person = await get(`/conversations/${list.items[0].id}`); return person.turns.some((turn: any) => turn.messageId === id && turn.state === 'Processed'); });
    return id;
  };
  const person = async () => { const list = await get('/conversations'); return get(`/conversations/${list.items[0].id}`); };
  cleanups.push(async () => { controller.abort(); await host.dispose(); await Effect.runPromise(events.close()); const hash = createHash('sha256').update(sessionId).digest('hex').slice(0, 24); for (const name of ['jev', 'jev-conversations', 'voxtral']) await rm(`.open-wa/plugins/${name}/${hash}`, { recursive: true, force: true }); });
  return { host, events, sent, requests, get, post, message, person };
}

test('Jev alone registers and answers text with context, without any Voxtral or audio path', async () => {
  const { host, sent, requests, get, message, person } = await setup();
  expect(host.getPluginNames()).toEqual(['jev']); expect((await get('/status')).voice).toBe(false);
  await message('Remember pineapple and seven.'); await message('What word and number did I ask you to remember?');
  expect(sent.map(entry => entry.method)).toEqual(['sendText', 'sendText']); expect(sent[1].args[1]).toContain('pineapple and seven');
  expect(requests.every(entry => ['/v1/systemone', '/v1/chat/completions'].includes(entry.path))).toBe(true);
  expect((await person()).turns.filter((turn: any) => turn.role === 'user')).toHaveLength(2);
  expect((await get('/settings')).keyConfigured).toBe(true);
  expect(JSON.stringify(await get('/settings'))).not.toContain('test-only');
});

test('standalone text submits a booking and separate buttons once, retaining grounding evidence', async () => {
  const { sent, message, person } = await setup({ formats: ['booking', 'buttons'] });
  await message(`Send a booking card for ${appointment} and separate Confirm or Reschedule buttons.`, 'request-1');
  expect(sent.map(entry => entry.method)).toEqual(['sendInteractive', 'sendInteractive', 'sendText']);
  expect(sent[0].args[1].booking).toMatchObject({ startAt: '2026-10-26T14:00:00Z', endAt: '2026-10-26T14:30:00Z', location: 'OpenWA office' });
  expect(sent[1].args[1].actions.every((action: any) => action.type === 'reply')).toBe(true);
  const source = (await person()).turns.find((turn: any) => turn.id === 'request-1');
  expect(source.classification.facts.selected.time).toMatchObject({ text: '14:00', normalized: '14:00', turnId: 'request-1' });
  expect(source.classification.distributions).toHaveProperty('date_day');
  await message(`Send a booking card for ${appointment} and separate Confirm or Reschedule buttons.`, 'request-1');
  expect(sent).toHaveLength(3);
});

test('standalone multi-message requests complete even when the scalar route forgets the second format', async () => {
  const { sent, requests, message, person } = await setup({ formats: ['booking', 'buttons'], forgetRemaining: true });
  await message(`Send a booking card for ${appointment} and separate Confirm or Reschedule buttons.`, 'multi-request');
  expect(sent.map(entry => entry.method)).toEqual(['sendInteractive', 'sendInteractive', 'sendText']);
  expect(sent.slice(0, 2).map(entry => entry.args[1].type)).toEqual(['booking', 'buttons']);
  expect(requests.filter(entry => entry.path.endsWith('/completions'))).toHaveLength(2);
  expect((await person()).turns.find((turn: any) => turn.id === 'multi-request').requestedFormats.sort()).toEqual(['booking', 'buttons']);
});

for (const format of ['buttons', 'form']) test(`standalone ${format} selection sends one factual text response`, async () => {
  const { events, sent, message, person } = await setup({ formats: [format] });
  await message(`Send a ${format} with appointment choices.`);
  const originalMessageId = (await person()).turns.find((turn: any) => turn.interactive)?.textId;
  const response = { messageId: 'selection-1', originalMessageId, chatId: peer, senderId: peer, raw: {}, ...(format === 'buttons' ? { type: 'reply', id: 'confirm' } : { type: 'form', answers: { reminder: 'hour', drinks: ['tea', 'water'] } }) };
  await events.emit('interactive.response', { response } as any);
  await until(async () => (await person()).turns.some((turn: any) => turn.id === 'selection-1' && turn.state === 'Processed'));
  expect(sent.filter(entry => entry.method === 'sendText')).toHaveLength(2);
  expect(sent.at(-1)!.args[1]).toContain(format === 'buttons' ? 'Confirm' : 'Tea, Water');
  await events.emit('interactive.response', { response } as any); await Bun.sleep(20);
  expect(sent).toHaveLength(3);
});

test('a correction cannot overwrite fields outside Jev’s mask even when the generator supplies them', async () => {
  const { sent, message } = await setup({ formats: ['booking'], maliciousCorrection: true });
  await message(`Send a booking card for ${appointment}.`); await message('No, I said 2 pm.');
  const cards = sent.filter(entry => entry.method === 'sendInteractive');
  expect(cards).toHaveLength(2); expect(cards[1].args[1].booking).toMatchObject({ startAt: '2026-10-26T14:00:00Z', endAt: '2026-10-26T14:30:00Z', location: 'OpenWA office' });
  const removal = sent.find(entry => entry.method === 'deleteMessage'); expect(removal?.args[1]).toBe(`true_${peer}_OUT1`);
  expect(sent.findIndex(entry => entry === cards[1])).toBeLessThan(sent.indexOf(removal!));
});

test('correction content review removes a field that its initial mask over-selected', async () => {
  const { sent, message } = await setup({ formats: ['booking'], unconfirmedDescription: true });
  await message(`Send a booking card for ${appointment}.`);
  await message('No, I said 2 pm.');
  const cards = sent.filter(entry => entry.method === 'sendInteractive');
  expect(cards).toHaveLength(2);
  expect(cards[1].args[1].booking).not.toHaveProperty('description');
  expect(cards[1].args[1].booking.location).toBe('OpenWA office');
});

test('an uncertain standalone send is reconciled without an automatic duplicate', async () => {
  const { sent, message } = await setup({ formats: ['buttons'], unknown: true });
  await message('Send Confirm and Reschedule reply buttons.');
  expect(sent.filter(entry => entry.method === 'sendInteractive')).toHaveLength(1);
  expect(sent.at(-1)!.args[1]).toContain("couldn't confirm");
});

test('unlicensed standalone Jev still answers text without exposing interactive tools', async () => {
  const { requests, sent, message } = await setup({ formats: ['booking'], interactive: false });
  await message('Hello.'); expect(sent.map(entry => entry.method)).toEqual(['sendText']);
  expect(requests.filter(entry => entry.path.endsWith('systemone')).every(entry => !Object.hasOwn(entry.body.questions.action.criteria, 'booking'))).toBe(true);
});


for (const reverse of [false, true]) test(`text and voice share one conversation and selection owner (${reverse ? 'Voxtral first' : 'Jev first'})`, async () => {
 const formats: string[] = [];
 const { host, events, sent, requests, get, message, person } = await setup({ withVoxtral: true, reverse, formats });
 await message('Remember pineapple and seven.');
 expect(sent.map(entry => entry.method)).toEqual(['sendText']);
 formats.push('buttons');
 await events.emit('message.received', { message: { id: 'voice-1', from: peer, type: 'ptt' } } as any);
 await until(async () => (await person()).turns.some((turn: any) => turn.audioId));
 expect(sent.map(entry => entry.method)).toEqual(['sendText', 'sendInteractive', 'sendPtt']);
 const voiceRequest = requests.find(entry => entry.path.endsWith('/chat/completions') && entry.body.messages.some((turn: any) => turn.content === 'Send Confirm or Reschedule reply buttons.'));
 expect(voiceRequest.body.messages.some((turn: any) => turn.content === 'Remember pineapple and seven.')).toBe(true);
 const originalMessageId = (await person()).turns.find((turn: any) => turn.interactive)?.textId;
 await events.emit('interactive.response', { response: { type: 'reply', messageId: 'voice-selection', chatId: peer, senderId: peer, originalMessageId, id: 'confirm', raw: {} } } as any);
 await until(async () => sent.filter(entry => entry.method === 'sendPtt').length === 2);
 expect(sent.filter(entry => entry.method === 'sendText')).toHaveLength(1);
 expect((await get('/status')).voice).toBe(true);
 const voiceRoutes = host.getRoutes().find(entry => entry.name === 'voxtral')!.router;
 const conversations = await (await voiceRoutes.request('/conversations')).json() as any;
 expect(conversations.items[0].id).toBe((await person()).id);
});
