import { afterEach, describe, expect, test } from 'bun:test';
import { createHash, randomUUID } from 'node:crypto';
import { rm } from 'node:fs/promises';
import { VoxtralService } from '../src/service';

const originalFetch = globalThis.fetch;
const fixtures: Array<{ service: VoxtralService; sessionId: string }> = [];
afterEach(async () => {
  globalThis.fetch = originalFetch;
  for (const { service, sessionId } of fixtures.splice(0)) {
    await service.dispose();
    const scope = createHash('sha256').update(sessionId).digest('hex').slice(0, 24);
    await rm(`.open-wa/plugins/voxtral/${scope}`, { recursive: true, force: true });
  }
});

async function setup(options: { earlyAck?: boolean; sendError?: boolean; includeText?: boolean } = {}) {
  const events = new Map<string, (payload: any) => void>();
  const requests: Array<{ path: string; body: any }> = [];
  const sent: any[][] = [];
  const pcm = Buffer.alloc(4800);
  for (let i = 0; i < pcm.length / 2; i++) pcm.writeInt16LE(Math.round(8000 * Math.sin(i / 8)), i * 2);
  globalThis.fetch = (async (input: any, init: any) => {
    const path = new URL(String(input)).pathname;
    const body = init.body instanceof FormData ? init.body : JSON.parse(init.body);
    requests.push({ path, body });
    if (path.endsWith('/transcriptions')) return Response.json({ text: 'Remember the number seven.', usage: { prompt_audio_seconds: 1 } });
    if (path.endsWith('/completions')) return Response.json({ choices: [{ message: { content: 'I will remember seven.' } }], usage: { prompt_tokens: 12, completion_tokens: 6 } });
    if (path.endsWith('/speech')) return Response.json({ audio_data: pcm.toString('base64') });
    throw new Error(`Unexpected request ${path}`);
  }) as typeof fetch;
  const sessionId = `voxtral-voice-test-${randomUUID()}`;
  const service = await VoxtralService.create({
    sessionId, config: { apiKey: 'test-only', agent: { instructions: [' Be brief. ', '', ' Remember context. '] }, voiceNotes: { includeText: options.includeText ?? false } },
    signal: new AbortController().signal,
    events: { on: (name: string, fn: (value: any) => void) => { events.set(name, fn); } },
    logger: { error() {} },
    runtime: { invoke: async (method: string, args: any[]) => {
      if (method === 'decryptMedia') return 'data:audio/ogg;base64,T2dnUw==';
      if (method === 'sendPtt') {
        sent.push(args);
        if (options.sendError) throw new Error('Connection lost after submission');
        if (options.earlyAck) events.get('ack.changed')?.({ ack: { id: 'outgoing-1', ack: 2 } });
        return 'outgoing-1';
      }
      if (method === 'reply') {
        if (options.earlyAck) events.get('ack.changed')?.({ ack: { id: 'text-1', ack: 3 } });
        return 'text-1';
      }
      throw new Error(`Unexpected runtime invocation ${method}`);
    } },
  } as any);
  fixtures.push({ service, sessionId });
  service.clientReady();
  return { service, requests, sent, events };
}
const message = { id: 'incoming-1', from: '447700900123@c.us', type: 'ptt', mimetype: 'audio/ogg; codecs=opus' };
async function idle(service: VoxtralService) {
  const deadline = Date.now() + 10000;
  while (service.status().processing || service.status().queued) {
    if (Date.now() > deadline) throw new Error('Voice-note processing did not finish');
    await Bun.sleep(10);
  }
}

describe('voice-note processing through the service, provider and real encoder', () => {
  test('transcribes, answers, sends playable Ogg Opus once, and observes delivery', async () => {
    const { service, requests, sent, events } = await setup();
    await service.message(message); await idle(service);
    expect(sent).toHaveLength(1);
    expect(sent[0][0]).toBe(message.from);
    const audio = Buffer.from(sent[0][1].split(',')[1], 'base64');
    expect(audio.subarray(0, 4).toString()).toBe('OggS');
    expect(audio.includes(Buffer.from('OpusHead'))).toBe(true);
    expect(sent[0][2]).toEqual({ quotedMsgId: message.id });
    expect(requests[0].body.get('file').name).toBe('voice.ogg');
    expect(requests[0].body.has('language')).toBe(false);
    expect(requests[1].body.messages[0].content).toBe('Be brief.\nRemember context.');
    expect(requests[1].body.messages[1].content).toBe('Remember the number seven.');
    events.get('ack.changed')?.({ ack: { id: 'outgoing-1', ack: 2 } });
    expect(service.conversation(service.list()[0].id).turns[1].audioState).toBe('Delivered');
    await service.message(message); await idle(service);
    expect(sent).toHaveLength(1);
  });
  test('retains delivery acknowledgement received before sendPtt returns its ID', async () => {
    const { service } = await setup({ earlyAck: true, includeText: true });
    await service.message(message); await idle(service);
    expect(service.conversation(service.list()[0].id).turns[1].audioState).toBe('Delivered');
    expect(service.conversation(service.list()[0].id).turns[1].textState).toBe('Read');
  });
  test('does not retry a send whose result is unknown', async () => {
    const { service, sent } = await setup({ sendError: true });
    await service.message(message); await idle(service);
    expect(service.list()[0].state).toBe('Send outcome unknown');
    await service.message(message); await idle(service);
    expect(sent).toHaveLength(1);
  });
});
