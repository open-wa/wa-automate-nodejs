import { afterEach, expect, test } from 'bun:test';
import { MistralProvider } from '../src/provider';
import { settingsSchema } from '../src/config';
import { selectionAcknowledgement } from '../../jev/src/actions';

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });
const settings = settingsSchema.parse({});
test('verified selections use the same factual script in voice-note and call responses without model generation', async () => {
  globalThis.fetch = async () => { throw new Error('Selection acknowledgements must not call the answer model'); };
  const provider = new MistralProvider(() => 'test-only', () => {});
  const acknowledgement = selectionAcknowledgement('Selected button: Confirm appointment');
  const actions = { tools: [], instructions: '', acknowledgement, execute: async () => { throw new Error('No chat send was requested'); } };
  expect(await provider.answer([], settings, AbortSignal.timeout(1000), actions)).toBe("Thanks, I've noted your choice here: Confirm appointment.");
  const streamed: string[] = [];
  for await (const part of provider.answerStream([], settings, AbortSignal.timeout(1000), actions)) streamed.push(part);
  expect(streamed.join('')).toBe(acknowledgement);
});
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

test('streamed function arguments settle before speech acknowledges the chat action', async () => {
  const { actionDefinition } = await import('../../jev/src/actions');
  const definition = actionDefinition('booking')!;
  const args = JSON.stringify({ booking: { date: '2026-10-26', time: '14:00', timeZone: 'Europe/London', location: 'OpenWA office' } });
  let round = 0, executed = 0;
  let finishSend!: () => void;
  let markStarted!: () => void;
  const sendStarted = new Promise<void>(resolve => { markStarted = resolve; });
  const sendFinished = new Promise<void>(resolve => { finishSend = resolve; });
  const spoken: string[] = [];
  globalThis.fetch = (async (_url: any, init: any) => {
    const body = JSON.parse(init.body);
    if (round++ === 0) {
      expect(body.tool_choice).toEqual({ type: 'function', function: { name: 'send_chat_message' } });
      return fragmentedSSE([
      { choices: [{ delta: { content: 'I will send that now.', tool_calls: [{ index: 0, id: 'booking123', type: 'function', function: { name: 'send_chat_message', arguments: args.slice(0, 20) } }] } }] },
      { choices: [{ delta: { tool_calls: [{ index: 0, function: { arguments: args.slice(20) } }] } }] },
      { choices: [{ delta: {}, finish_reason: 'tool_calls' }] },
    ].map(event => `data: ${JSON.stringify(event)}\n\n`).join('') + 'data: [DONE]\n\n');
    }
    expect(body.tool_choice).toBe('auto');
    expect(body.messages.find((message: any) => message.role === 'tool')).toMatchObject({ tool_call_id: 'booking123', name: 'send_chat_message' });
    expect(body.messages.find((message: any) => message.role === 'tool').content).toContain('submitted');
    return fragmentedSSE('data: {"choices":[{"delta":{"content":"I sent the booking card."},"finish_reason":"stop"}]}\n\ndata: [DONE]\n\n');
  }) as typeof fetch;
  const provider = new MistralProvider(() => 'test-only', () => {});
  const consume = (async () => {
    for await (const delta of provider.answerStream([{ role: 'user', content: 'Send the booking card.' }], settings, AbortSignal.timeout(3000), {
      tools: [definition.tool], instructions: 'Jev selected booking.',
      execute: async (call) => {
        executed++; expect(definition.prepare(call.function.arguments).method).toBe('sendInteractive');
        markStarted(); await sendFinished; return { status: 'submitted' };
      },
    })) spoken.push(delta);
  })();
  await sendStarted;
  expect(spoken).toEqual([]);
  finishSend(); await consume;
  expect(executed).toBe(1);
  expect(spoken.join('')).toBe('I sent the booking card.');
});

test('none, clarify and classifier failure retain their instructions without empty tools', async () => {
  const bodies: any[] = [];
  globalThis.fetch = (async (_url: any, init: any) => { bodies.push(JSON.parse(init.body)); return Response.json({ choices: [{ message: { content: 'What time is the appointment?' }, finish_reason: 'stop' }] }); }) as typeof fetch;
  const provider = new MistralProvider(() => 'test-only', () => {});
  for (const instructions of ['Jev selected none.', 'Jev selected clarify.', 'Chat actions are currently unavailable.']) {
    await provider.answer([{ role: 'user', content: 'Please send it.' }], settings, AbortSignal.timeout(1000), { instructions, tools: [], execute: async () => { throw new Error('No tool is available'); } });
    expect(bodies.at(-1).tools).toBeUndefined();
    expect(bodies.at(-1).messages[0].content).toContain(instructions);
  }
});

for (const stream of [false, true]) test(`Jev-selected sends execute on the first request without reconfirmation (${stream ? 'call' : 'voice note'})`, async () => {
  const { actionDefinition } = await import('../../jev/src/actions');
  const definition = actionDefinition('booking')!;
  let executed = 0;
  globalThis.fetch = (async (_url: any, init: any) => {
    const body = JSON.parse(init.body);
    const result = body.messages.some((message: any) => message.role === 'tool');
    const forced = typeof body.tool_choice === 'object' && body.tool_choice.function.name === 'send_chat_message';
    const message = !result && forced ? { content: null, tool_calls: [{ id: 'first-send', type: 'function', function: {
      name: 'send_chat_message', arguments: JSON.stringify({ booking: { date: '2026-10-26', time: '14:00', timeZone: 'Europe/London', location: 'OpenWA office' } }),
    } }] } : { content: result ? 'I sent the booking card.' : 'Please confirm those details before I send the card.' };
    const finish_reason = 'tool_calls' in message ? 'tool_calls' : 'stop';
    return stream ? fragmentedSSE(`data: ${JSON.stringify({ choices: [{ delta: message, finish_reason }] })}\n\ndata: [DONE]\n\n`)
      : Response.json({ choices: [{ message, finish_reason }] });
  }) as typeof fetch;
  const provider = new MistralProvider(() => 'test-only', () => {});
  const turns = [{ role: 'user' as const, content: 'Send my booking card for 26 October 2026 at 2 pm London time at the OpenWA office.' }];
  const actions = { tools: [definition.tool], instructions: 'Jev selected booking.', execute: async (call: any) => {
    definition.prepare(call.function.arguments); executed++; return { status: 'submitted' };
  } };
  let script = '';
  if (stream) for await (const delta of provider.answerStream(turns, settings, AbortSignal.timeout(1000), actions)) script += delta;
  else script = await provider.answer(turns, settings, AbortSignal.timeout(1000), actions);
  expect(executed).toBe(1);
  expect(script).toBe('I sent the booking card.');
});

for (const stream of [false, true]) test(`outcome review repairs an unsent promise before speaking (${stream ? 'call' : 'voice note'})`, async () => {
  const { actionDefinition } = await import('../../jev/src/actions');
  const definition = actionDefinition('buttons')!;
  const args = JSON.stringify({ body: 'Choose an option', actions: [{ type: 'reply', id: 'yes', label: 'Yes' }] });
  const checkpoints: string[] = [], spoken: string[] = [];
  let rounds = 0, executed = 0;
  const complete: any = { instructions: 'Only acknowledge observed results.', tools: [], execute: async () => ({}), review: async (feedback: any) => {
    checkpoints.push(feedback.phase);
    expect(feedback.results.at(-1)?.result.status).toBe('submitted');
    return { accept: true, actions: complete };
  } };
  const perform: any = { instructions: 'The request is still unfinished. Send the buttons.', tools: [definition.tool], decision: { nextStep: 'act' },
    execute: async (call: any) => { definition.prepare(call.function.arguments); executed++; return { status: 'submitted' }; },
    review: async (feedback: any) => { checkpoints.push(feedback.phase); return { accept: false, actions: complete }; },
  };
  const initial: any = { instructions: 'Consider the request.', tools: [], execute: async () => ({}), review: async (feedback: any) => {
    checkpoints.push(feedback.phase); expect(feedback.reply).toBe('I have created a confirmed reservation.');
    return { accept: false, actions: perform };
  } };
  globalThis.fetch = (async (_url: any, init: any) => {
    const request = JSON.parse(init.body), round = rounds++;
    if (round === 1) expect(request.tool_choice).toEqual({ type: 'function', function: { name: 'send_chat_message' } });
    const message = round === 1 ? { content: null, tool_calls: [{ id: 'review-recovery', type: 'function', function: { name: 'send_chat_message', arguments: args } }] }
      : { content: round === 0 ? 'I have created a confirmed reservation.' : 'The buttons are now in the chat.' };
    const finish_reason = round === 1 ? 'tool_calls' : 'stop';
    return stream ? fragmentedSSE(`data: ${JSON.stringify({ choices: [{ delta: message, finish_reason }] })}\n\ndata: [DONE]\n\n`)
      : Response.json({ choices: [{ message, finish_reason }] });
  }) as typeof fetch;
  const provider = new MistralProvider(() => 'test-only', () => {});
  if (stream) for await (const part of provider.answerStream([{ role: 'user', content: 'Send buttons.' }], settings, AbortSignal.timeout(2000), initial)) spoken.push(part);
  else spoken.push(await provider.answer([{ role: 'user', content: 'Send buttons.' }], settings, AbortSignal.timeout(2000), initial));
  expect(checkpoints).toEqual(['reply', 'result', 'reply']);
  expect(executed).toBe(1);
  expect(spoken).toEqual(['The buttons are now in the chat.']);
});

test('bounded reply repairs preserve known success instead of disconnecting the call', async () => {
  const { actionDefinition } = await import('../../jev/src/actions');
  const definition = actionDefinition('buttons')!;
  let requests = 0, sends = 0;
  const reject: any = { instructions: 'Revise the unsent draft.', tools: [], decision: { nextStep: 'respond' }, execute: async () => ({}), review: async () => ({ accept: false, actions: reject }) };
  const actions: any = { instructions: 'Send the requested buttons.', tools: [definition.tool], decision: { nextStep: 'act' },
    execute: async () => { sends++; return { status: 'submitted', format: 'buttons' }; }, review: async () => ({ accept: false, actions: reject }),
  };
  globalThis.fetch = (async () => {
    const message = requests++ === 0 ? { content: null, tool_calls: [{ id: 'bounded-repair', type: 'function', function: { name: 'send_chat_message', arguments: JSON.stringify({ body: 'Choose', actions: [{ type: 'reply', id: 'yes', label: 'Yes' }] }) } }] } : { content: 'An unsupported draft.' };
    return Response.json({ choices: [{ message, finish_reason: 'tool_calls' in message ? 'tool_calls' : 'stop' }] });
  }) as typeof fetch;
  const provider = new MistralProvider(() => 'test-only', () => {});
  expect(await provider.answer([{ role: 'user', content: 'Send the buttons.' }], settings, AbortSignal.timeout(1000), actions)).toBe("I've sent the button message in this chat.");
  expect(requests).toBe(6);
  expect(sends).toBe(1);
});
