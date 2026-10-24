import { afterEach, expect, mock, test } from 'bun:test';
import WebSocket, { WebSocketServer } from 'ws';
import { settingsSchema } from '../src/config';

let endpoint = '';
let requestedEndpoint = '';
const ActualWebSocket = WebSocket;
mock.module('ws', () => ({ default: class extends ActualWebSocket {
  constructor(url: string, options: any) { requestedEndpoint = url; super(endpoint, options); }
} }));
const { LiveCall } = await import('../src/live-call');
const cleanups: Array<() => Promise<void>> = [];
afterEach(async () => { for (const cleanup of cleanups.splice(0)) await cleanup(); });
async function until(predicate: () => boolean) {
  const deadline = Date.now() + 3000;
  while (!predicate()) { if (Date.now() > deadline) throw new Error('Timed out waiting for call state'); await Bun.sleep(10); }
}

async function setup(options: { slowSpeech?: boolean } = {}) {
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
  let answerRequests = 0, clearRequests = 0, observerStopped = 0;
  const snapshot = { id: 'call-1', generation: 'generation-1', peer: '447700900123@c.us', state: 'active', terminal: false, direction: 'incoming' };
  const call = { ...snapshot, clearAudio: async () => { clearRequests++; return { ok: true }; }, observeAudio: async () => ({ ok: true, stop: async () => { observerStopped++; } }) };
  const pcm = Buffer.alloc(4800);
  for (let i = 0; i < pcm.length / 2; i++) pcm.writeInt16LE(Math.round(8000 * Math.sin(i / 8)), i * 2);
  const live = new LiveCall({
    runtime: { invoke: async () => call } as any,
    key: () => 'test-only', settings: () => settings, signal: new AbortController().signal,
    canRespond: () => true, history: () => history as any,
    user: text => { history.push({ role: 'user', content: text }); },
    assistant: text => { answers.push(text); history.push({ role: 'assistant', content: text }); }, changed() {},
    provider: {
      answerStream: async function* (turns: any[]) { expect(turns.at(-1)?.content).toBe('Remember blue.'); answerRequests++; yield 'I will remember blue.'; },
      speechStream: async function* (_text: string, _settings: any, signal: AbortSignal) {
        speechSignals.push(signal); yield pcm;
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
  const consuming = (async () => { while (true) { const next = await reader.read(); if (next.done) return; frames.push(next.value); } })();
  await live.connect(); live.update(snapshot as any);
  cleanups.push(async () => { live.close(); await consuming; for (const client of server.clients) client.terminate(); await new Promise<void>(resolve => server.close(() => resolve())); });
  const emit = (event: any) => peer!.send(JSON.stringify(event));
  const turn = () => { emit({ type: 'turn.start', time_s: 0 }); emit({ type: 'transcription.text.delta', text: 'Remember blue.' }); emit({ type: 'turn.end', time_s: 1, end_reason: 'threshold' }); };
  return { live, media, received, emit, turn, answers, speechSignals, frames, history,
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
test('a completed caller turn produces a contextual answer and non-silent 16 kHz frames', async () => {
  const { live, turn, answers, frames } = await setup(); turn();
  await until(() => answers.length === 1);
  expect(answers[0]).toBe('I will remember blue.');
  expect(frames.some(frame => frame.some(Boolean))).toBe(true);
  expect(frames.every(frame => frame.length === 640)).toBe(true);
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
