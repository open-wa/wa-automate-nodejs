import { afterEach, expect, test } from 'bun:test';
import { MistralProvider } from '../src/provider';
import { settingsSchema } from '../src/config';

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });
const settings = settingsSchema.parse({});
function fragmentedSSE(value: string) {
  const bytes = new TextEncoder().encode(value);
  return new Response(new ReadableStream({ start(controller) {
    for (let at = 0; at < bytes.length; at += 3) controller.enqueue(bytes.subarray(at, at + 3));
    controller.close();
  } }), { headers: { 'Content-Type': 'text/event-stream' } });
}
function floatPcm(samples: number[]) {
  const bytes = Buffer.alloc(samples.length * 4);
  samples.forEach((sample, index) => bytes.writeFloatLE(sample, index * 4));
  return bytes;
}
const speechSamples = [-2, -1, -0.5, 0, 0.5, 1, 2];
const speechIntegers = [-32768, -32768, -16384, 0, 16384, 32767, 32767];
function intSamples(bytes: Buffer) {
  return Array.from({ length: bytes.length / 2 }, (_, index) => bytes.readInt16LE(index * 2));
}
test('speech converts provider float32 PCM into signed 16-bit samples for voice notes', async () => {
  globalThis.fetch = (async () => Response.json({ audio_data: floatPcm(speechSamples).toString('base64') })) as typeof fetch;
  const provider = new MistralProvider(() => 'test-only', () => {});
  const pcm = await provider.speech('Hello', settings, AbortSignal.timeout(1000));
  expect(intSamples(pcm)).toEqual(speechIntegers);
});
test('speech preserves the WAV container returned by the provider', async () => {
  const wav = Buffer.from('RIFF-test-WAVE');
  globalThis.fetch = (async () => Response.json({ audio_data: wav.toString('base64') })) as typeof fetch;
  const provider = new MistralProvider(() => 'test-only', () => {});
  expect(await provider.speech('Hello', settings, AbortSignal.timeout(1000), 'wav')).toEqual(wav);
});
test('speech streaming converts float32 samples split across SSE audio chunks for calls', async () => {
  const audio = floatPcm(speechSamples);
  let request: any;
  globalThis.fetch = (async (_url: any, init: any) => {
    request = JSON.parse(init.body);
    let events = '';
    for (let at = 0; at < audio.length; at += 3) {
      events += `event: speech.audio.delta\r\ndata: ${JSON.stringify({ audio_data: audio.subarray(at, at + 3).toString('base64') })}\r\n\r\n`;
    }
    return fragmentedSSE(events + 'event: speech.audio.done\r\ndata: {"usage":{}}\r\n\r\n');
  }) as typeof fetch;
  const provider = new MistralProvider(() => 'test-only', () => {});
  const chunks: Uint8Array[] = [];
  for await (const chunk of provider.speechStream('Hello', settings, AbortSignal.timeout(1000))) chunks.push(chunk);
  expect(intSamples(Buffer.concat(chunks))).toEqual(speechIntegers);
  expect(request.response_format).toBe('pcm');
  expect(request.stream).toBe(true);
});
test('speech rejects invalid float samples and truncated audio instead of sending noise', async () => {
  const provider = new MistralProvider(() => 'test-only', () => {});
  for (const audio of [floatPcm([NaN]), floatPcm([Infinity]), Buffer.from([0, 0, 0])]) {
    globalThis.fetch = (async () => Response.json({ audio_data: audio.toString('base64') })) as typeof fetch;
    await expect(provider.speech('Hello', settings, AbortSignal.timeout(1000))).rejects.toThrow('PCM');
  }
  globalThis.fetch = (async () => fragmentedSSE('event: speech.audio.delta\ndata: {"audio_data":"AAAA"}\n\nevent: speech.audio.done\ndata: {}\n\n')) as typeof fetch;
  const consume = async () => { for await (const _chunk of provider.speechStream('Hello', settings, AbortSignal.timeout(1000))) {} };
  await expect(consume()).rejects.toThrow('PCM');
});
test('answer streaming preserves split Unicode text and records token usage', async () => {
  const usage: any[] = [];
  globalThis.fetch = (async () => fragmentedSSE(
    `data: ${JSON.stringify({ choices: [{ delta: { content: 'مرحبا ' } }] })}\n\n` +
    `data: ${JSON.stringify({ choices: [{ delta: { content: 'hello' } }], usage: { prompt_tokens: 10, completion_tokens: 4 } })}\n\n` +
    'data: [DONE]\n\n',
  )) as typeof fetch;
  const provider = new MistralProvider(() => 'test-only', value => usage.push(value));
  let answer = '';
  for await (const delta of provider.answerStream([{ role: 'user', content: 'Hello' }], settings, AbortSignal.timeout(1000))) answer += delta;
  expect(answer).toBe('مرحبا hello');
  expect(usage).toEqual([{ inputTokens: 10, outputTokens: 4 }]);
});
test('provider errors report status and recovery without exposing response bodies or credentials', async () => {
  globalThis.fetch = (async () => new Response('sensitive-provider-body', { status: 401 })) as typeof fetch;
  const provider = new MistralProvider(() => 'test-only-secret', () => {});
  const error = await provider.speech('Hello', settings, AbortSignal.timeout(1000)).then(() => undefined, error => error);
  expect(error?.message).toBe('Mistral returned HTTP 401. Check the API key and model access.');
});
test('a model with zero request quota explains how to select an available model', async () => {
  globalThis.fetch = (async () => new Response('sensitive-provider-body', { status: 429, headers: { 'x-ratelimit-limit-req-minute': '0' } })) as typeof fetch;
  const provider = new MistralProvider(() => 'test-only', () => {});
  await expect(provider.answer([{ role: 'user', content: 'Hello' }], settings, AbortSignal.timeout(1000))).rejects.toThrow('Choose a model with available quota in agent.model');
});
