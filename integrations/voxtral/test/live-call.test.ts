import { makeServices } from '../../jev/test/fixtures';
import { afterEach, expect, mock, test } from 'bun:test';
import WebSocket, { WebSocketServer } from 'ws';
import { settingsSchema } from '../src/config';
import { createHash, randomUUID } from 'node:crypto';
import { rm } from 'node:fs/promises';

let endpoint = '';
let requestedEndpoint = '';
const ActualWebSocket = WebSocket;
mock.module('ws', () => ({ default: class extends ActualWebSocket {
  constructor(url: string, options: any) { requestedEndpoint = url; super(endpoint, options); }
} }));
const { LiveCall } = await import(process.env.OPENWA_LIVECALL_IMPLEMENTATION ?? '../src/live-call');
const { VoxtralService } = await import('../src/service');
const cleanups: Array<() => Promise<void>> = [];
afterEach(async () => { for (const cleanup of cleanups.splice(0)) await cleanup(); });
async function until(predicate: () => boolean) {
  const deadline = Date.now() + 3000;
  while (!predicate()) { if (Date.now() > deadline) throw new Error('Timed out waiting for call state'); await Bun.sleep(10); }
}

async function setup(options: { slowSpeech?: boolean; slowClassifier?: boolean; expectedInput?: string; longSpeech?: boolean; pacedPlayback?: boolean; clearDelay?: number; failFirstAnswer?: boolean } = {}) {
  const server = new WebSocketServer({ port: 0, host: '127.0.0.1' });
  await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address() as { port: number };
  endpoint = `ws://127.0.0.1:${address.port}`;
  let peer: WebSocket | undefined;
  const received: any[] = [];
  server.on('connection', socket => {
    peer = socket;
    socket.on('message', raw => {
      const event = JSON.parse(String(raw)); received.push(event);
      if (event.type === 'session.update') socket.send(JSON.stringify({ type: 'session.updated', session: event.session }));
    });
    socket.send(JSON.stringify({ type: 'session.created', session: {} }));
  });
  const settings = settingsSchema.parse({ mode: 'both', calls: { greeting: '' } });
  const history: Array<{ role: string; content: string }> = [];
  const answers: string[] = [];
  const speechSignals: AbortSignal[] = [];
  const classificationSignals: AbortSignal[] = [];
  const selectionIds: Array<string | undefined> = [];
  let answerRequests = 0, clearRequests = 0, clearCompleted = 0, observerStopped = 0;
  const clearsBeforeSpeech: number[] = [];
  const snapshot = { id: 'call-1', generation: 'generation-1', peer: '447700900123@c.us', state: 'active', terminal: false, direction: 'incoming' };
  const call = { ...snapshot, clearAudio: async () => { clearRequests++; if (options.clearDelay) await Bun.sleep(options.clearDelay); clearCompleted++; return { ok: true }; }, observeAudio: async () => ({ ok: true, stop: async () => { observerStopped++; } }) };
  const pcm = Buffer.alloc(options.longSpeech ? 384000 : 4800);
  for (let i = 0; i < pcm.length / 2; i++) pcm.writeInt16LE(Math.round(8000 * Math.sin(i / 8)), i * 2);
  const live = new LiveCall({
    runtime: { invoke: async () => call } as any,
    key: () => 'test-only', settings: () => settings, signal: new AbortController().signal,
    canRespond: () => true, history: () => history as any,
    user: (text, selectionId) => { history.push({ role: 'user', content: text }); selectionIds.push(selectionId); return selectionId ?? `turn-${history.length}`; },
    actions: async (_id, _current, signal) => {
      classificationSignals.push(signal);
      if (options.slowClassifier) await new Promise<void>((_resolve, reject) => {
        const aborted = () => reject(signal.reason);
        if (signal.aborted) aborted(); else signal.addEventListener('abort', aborted, { once: true });
      });
      return { tools: [], instructions: 'No chat action is needed.', execute: async () => ({ status: 'failed' }) };
    },
    assistant: text => { answers.push(text); history.push({ role: 'assistant', content: text }); }, changed() {},
    provider: {
      answerStream: async function* (turns: any[]) { expect(turns.at(-1)?.content).toBe(options.expectedInput ?? 'Remember blue.'); answerRequests++; if (options.failFirstAnswer && answerRequests === 1) throw new Error('unknown certificate verification error'); yield 'I will remember blue.'; },
      speechStream: async function* (_text: string, _settings: any, signal: AbortSignal) {
        speechSignals.push(signal); clearsBeforeSpeech.push(clearCompleted); yield pcm;
        if (options.slowSpeech) await new Promise<void>((_resolve, reject) => {
          const aborted = () => reject(signal.reason);
          if (signal.aborted) aborted(); else signal.addEventListener('abort', aborted, { once: true });
        });
      },
    } as any,
  }, false);
  const media = live.media();
  const reader = media.microphone.getReader();
  const frames: Uint8Array[] = [];
  const consuming = (async () => { while (true) { const next = await reader.read(); if (next.done) return; frames.push(next.value); if (options.pacedPlayback) await Bun.sleep(80); } })();
  await live.connect(); live.update(snapshot as any);
  cleanups.push(async () => { live.close(); await consuming; for (const client of server.clients) client.terminate(); await new Promise<void>(resolve => server.close(() => resolve())); });
  const emit = (event: any) => peer!.send(JSON.stringify(event));
  const turn = () => { emit({ type: 'turn.start', time_s: 0 }); emit({ type: 'transcription.text.delta', text: 'Remember blue.' }); emit({ type: 'turn.end', time_s: 1, end_reason: 'threshold' }); };
  return { live, media, received, emit, turn, answers, speechSignals, classificationSignals, selectionIds, frames, history, clearsBeforeSpeech,
    counts: () => ({ answerRequests, clearRequests, observerStopped }), disconnect: () => peer!.close() };
}

test('real WebSocket handshake configures 16 kHz audio before accepting caller samples', async () => {
  const { media, received } = await setup();
  expect(requestedEndpoint).toContain('wss://api.mistral.ai/v1/audio/transcriptions/realtime?model=');
  expect(received[0]).toEqual({ type: 'session.update', session: { audio_format: { encoding: 'pcm_s16le', sample_rate: 16000 }, target_streaming_delay_ms: 480, turn_detection: {}, context_bias: [] } });
  const writer = media.speaker.getWriter(); const pcm = Buffer.alloc(640, 3); await writer.write(pcm); writer.releaseLock();
  await until(() => received.length === 2);
  expect(received[1]).toEqual({ type: 'input_audio.append', audio: pcm.toString('base64') });
});

test('turn end waits for the delayed final words before asking Jev or answering', async () => {
  const { emit, history, counts } = await setup({ expectedInput: 'What time is the appointment?' });
  emit({ type: 'turn.start', time_s: 0 });
  emit({ type: 'transcription.text.delta', text: 'What time is the' });
  emit({ type: 'turn.end', time_s: 1 });
  await Bun.sleep(400);
  expect(counts().answerRequests).toBe(0);
  expect(history).toHaveLength(0);
  emit({ type: 'transcription.text.delta', text: ' appointment?' });
  await until(() => counts().answerRequests === 1);
  expect(history[0].content).toBe('What time is the appointment?');
});

test('realtime errors retain the provider reason without exposing the API key', async () => {
  const { live, emit } = await setup();
  emit({ type: 'error', error: { code: 3051, message: 'Audio limit reached for test-only' } });
  await until(() => Boolean(live.error));
  expect(live.error).toContain('3051');
  expect(live.error).toContain('Audio limit reached');
  expect(live.error).not.toContain('test-only');
});

test('a disconnected transcription socket reattaches to the same native call', async () => {
  const { disconnect } = await setup();
  const sessionId = 'voxtral-reconnect-' + randomUUID();
  let attachments = 0;
  const snapshot = { id: 'recover-call', generation: 'recover-generation', peer: '447700900123@c.us', state: 'active', terminal: false, direction: 'incoming' };
  const call = { ...snapshot, accept: async () => ({ ok: true }), setMedia: async () => { attachments++; return { ok: true }; } };
  const service = await VoxtralService.create({ services: makeServices(), sessionId, config: { apiKey: 'test-only', mode: 'calls', calls: { greeting: '' } }, signal: new AbortController().signal, events: { on() {} }, logger: { error() {} }, runtime: { invoke: async (method: string) => { if (method === 'getActiveCall') return call; throw new Error('Recovery attempted an unexpected action: ' + method); } } } as any);
  cleanups.push(async () => { await service.dispose(); const hash = createHash('sha256').update(sessionId).digest('hex').slice(0, 24); await rm('.open-wa/plugins/voxtral/' + hash, { recursive: true, force: true }); });
  service.clientReady();
  await service.incoming(snapshot as any);
  disconnect();
  await until(() => attachments === 1);
  expect(service.status().call?.call?.id).toBe(snapshot.id);
  expect(service.status().call?.error).toBeUndefined();
  expect(service.status().call?.stage).toBe('Listening');
});
test('a completed caller turn produces a contextual answer and non-silent 16 kHz frames', async () => {
  const { live, turn, answers, frames } = await setup(); turn();
  await until(() => answers.length === 1);
  expect(answers[0]).toBe('I will remember blue.');
  expect(frames.some(frame => frame.some(Boolean))).toBe(true);
  expect(frames.every(frame => frame.length === 2560)).toBe(true);
  expect(live.stage).toBe('Listening');
});
test('caller interruption aborts speech and clears the current call audio', async () => {
  const { live, turn, emit, speechSignals, counts, answers } = await setup({ slowSpeech: true }); turn();
  await until(() => speechSignals.length === 1);
  emit({ type: 'turn.start', time_s: 2 });
  await until(() => speechSignals[0].aborted);
  expect(counts().clearRequests).toBeGreaterThanOrEqual(2);
  expect(live.stage).toBe('Listening');
  expect(answers).toHaveLength(0);
});
test('human takeover keeps caller transcription but suppresses AI responses and stops its observer', async () => {
  const { live, turn, history, counts } = await setup(); await live.takeover(); turn();
  await until(() => history.length === 1);
  expect(counts().answerRequests).toBe(0);
  expect(live.owner).toBe('human');
  expect(live.stage).toBe('Human takeover');
  live.close(); await until(() => counts().observerStopped === 1);
});
test('provider disconnect exposes a recoverable failure instead of continuing to show listening', async () => {
  const { live, disconnect } = await setup(); disconnect();
  await until(() => !!live.error);
  expect(live.stage).toBe('Audio disconnected');
  expect(live.error).toContain('Reconnect');
});
test('hangup clears interim speech and publishes the ended stage', async () => {
  const { live, turn, speechSignals } = await setup({ slowSpeech: true }); turn();
  await until(() => speechSignals.length === 1);
  live.interim = 'unfinished speech'; live.muted = true;
  live.update({ ...live.call!, state: 'ended', terminal: true });
  expect(speechSignals[0].aborted).toBe(true);
  expect(live.snapshot()).toMatchObject({ stage: 'Call ended', interim: '', muted: false, call: { terminal: true } });
});
test('a failed outgoing call leaves an honest state and a successful retry clears its error', async () => {
  await setup(); // The local WebSocket server handles the actual provider handshake.
  const sessionId = `voxtral-call-test-${randomUUID()}`;
  let active: any = null, fail = true;
  const service = await VoxtralService.create({ services: makeServices(),
    sessionId, config: { apiKey: 'test-only', mode: 'calls', calls: { greeting: '' } },
    signal: new AbortController().signal, events: { on() {} }, logger: { error() {} },
    runtime: { invoke: async (method: string) => {
      if (method === 'getActiveCall') return active;
      if (method === 'startCall') {
        if (fail) return { ok: false, status: 'failed', reason: { message: 'Calling is unavailable.' } };
        active = { id: 'retry-call', generation: 'retry-generation', peer: '447700900123@c.us', state: 'ringing', terminal: false, direction: 'outgoing' };
        return { ok: true, status: 'requested' };
      }
      throw new Error(`Unexpected call method: ${method}`);
    } },
  } as any);
  cleanups.push(async () => {
    await service.dispose();
    const scope = createHash('sha256').update(sessionId).digest('hex').slice(0, 24);
    await rm(`.open-wa/plugins/voxtral/${scope}`, { recursive: true, force: true });
  });
  await expect(service.startCall('447700900123@c.us')).rejects.toThrow('Calling is unavailable.');
  expect(service.list()[0].state).toBe('Call failed');
  expect(service.status().error).toBe('Calling is unavailable.');
  fail = false;
  expect(await service.startCall('447700900123@c.us')).toMatchObject({ ok: true });
  expect(service.status().error).toBeUndefined();
  service.callState({ ...active, state: 'ended', terminal: true });
  expect(service.status().call?.stage).toBe('Call ended');
});

test('caller interruption aborts an in-flight Jev decision before the answer or send begins', async () => {
  const { live, turn, emit, classificationSignals, counts, answers } = await setup({ slowClassifier: true });
  turn(); await until(() => classificationSignals.length === 1);
  emit({ type: 'turn.start', time_s: 2 });
  await until(() => classificationSignals[0].aborted);
  expect(counts().answerRequests).toBe(0);
  expect(answers).toHaveLength(0);
  expect(live.stage).toBe('Listening');
});
test('a correlated chat selection becomes a call turn and responds through call audio', async () => {
  const { live, answers, frames, selectionIds, history } = await setup({ expectedInput: 'Selected button: Yes please' });
  await live.respondToSelection('Selected button: Yes please', 'incoming-selection');
  expect(selectionIds).toEqual(['incoming-selection']);
  expect(history[0]).toEqual({ role: 'user', content: 'Selected button: Yes please' });
  expect(answers).toHaveLength(1);
  expect(frames.some(frame => frame.some(Boolean))).toBe(true);
  expect(live.stage).toBe('Listening');
});


test('overlapping caller turns cannot let stale playback disconnect the current call', async () => {
  const { live, turn, emit, speechSignals } = await setup({ longSpeech: true, pacedPlayback: true });
  turn(); await until(() => speechSignals.length === 1); await Bun.sleep(30);
  // The next completed utterance arrives without a VAD start. The previous
  // producer is still backpressured inside the real CallPlayback queue.
  emit({ type: 'transcription.text.delta', text: 'Remember blue.' });
  emit({ type: 'turn.end', time_s: 3 });
  await until(() => speechSignals.length === 2);
  emit({ type: 'turn.start', time_s: 4 }); await Bun.sleep(100);
  expect(live.error).toBeUndefined();
  expect(speechSignals[0].aborted).toBe(true);
  expect(speechSignals[1].aborted).toBe(true);
  expect(live.stage).toBe('Listening');
});

test('a delayed browser clear settles before the next reply starts producing audio', async () => {
  const { live, clearsBeforeSpeech } = await setup({ clearDelay: 120, expectedInput: 'Selected button: Confirm' });
  await live.respondToSelection('Selected button: Confirm', 'confirm-1');
  expect(clearsBeforeSpeech).toEqual([1]);
  expect(live.error).toBeUndefined();
});


test('a failed answer keeps transcription open and the next caller turn can respond', async () => {
  const { live, turn, answers, received, media } = await setup({ failFirstAnswer: true });
  turn();
  await until(() => Boolean(live.snapshot().error));
  expect(live.stage).toBe('Listening');
  expect(live.snapshot().error).toContain('certificate verification');
  const writer = media.speaker.getWriter();
  await writer.write(Buffer.alloc(640, 3)); writer.releaseLock();
  await until(() => received.some(event => event.type === 'input_audio.append'));
  turn();
  await until(() => answers.length === 1);
  expect(live.snapshot().error).toBeUndefined();
  expect(live.stage).toBe('Listening');
});
