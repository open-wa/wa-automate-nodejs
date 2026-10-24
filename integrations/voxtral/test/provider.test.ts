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
test('speech streaming decodes split SSE events into unchanged PCM bytes', async () => {
  const audio = Buffer.from([0, 2, 255, 127, 0, 128]);
  let request: any;
  globalThis.fetch = (async (_url: any, init: any) => {
    request = JSON.parse(init.body);
    return fragmentedSSE(`event: speech.audio.delta\r\ndata: ${JSON.stringify({ audio_data: audio.subarray(0, 3).toString('base64') })}\r\n\r\nevent: speech.audio.delta\r\ndata: ${JSON.stringify({ audio_data: audio.subarray(3).toString('base64') })}\r\n\r\nevent: speech.audio.done\r\ndata: {"usage":{}}\r\n\r\n`);
  }) as typeof fetch;
  const provider = new MistralProvider(() => 'test-only', () => {});
  const chunks: Uint8Array[] = [];
  for await (const chunk of provider.speechStream('Hello', settings, AbortSignal.timeout(1000))) chunks.push(chunk);
  expect(Buffer.concat(chunks).equals(audio)).toBe(true);
  expect(request.response_format).toBe('pcm');
  expect(request.stream).toBe(true);
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
