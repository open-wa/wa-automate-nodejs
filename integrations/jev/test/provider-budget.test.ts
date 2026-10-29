import { afterEach, expect, test } from 'bun:test';
import { MistralChatProvider } from '../src/provider';
import { settingsSchema } from '../src/config';
import type { AgentActions } from '../src/actions';
const actualFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = actualFetch; });
const tool = { type: 'function' as const, function: { name: 'send_chat_message', description: 'Send current format', parameters: { type: 'object', properties: {} } } };

test('a three-format turn can repair arguments and finish every requested format', async () => {
 let requests = 0, attempts = 0;
 const sent: string[] = [], formats = ['booking', 'buttons', 'form'];
 globalThis.fetch = (async () => {
  requests++;
  return Response.json({ choices: [{ finish_reason: sent.length === 3 ? 'stop' : 'tool_calls', message: sent.length === 3 ? { content: 'The card, buttons and form were submitted.' } : { tool_calls: [{ id: 'call-' + requests, type: 'function', function: { name: tool.function.name, arguments: '{}' } }] } }] });
 }) as typeof fetch;
 const actions = (): AgentActions => ({ tools: sent.length < 3 ? [tool] : [], instructions: 'Finish the remaining formats',
  decision: { nextStep: sent.length < 3 ? 'act' : 'respond', requestedFormats: formats } as any,
  execute: async () => {
   if (++attempts <= 5) return { status: 'invalid_arguments', reason: 'Discard unsupported wording' };
   const format = formats[sent.length]; sent.push(format); return { status: 'submitted', format };
  }, review: async () => ({ accept: sent.length === 3, actions: actions() }),
 });
 const answer = await new MistralChatProvider(() => 'test-only', () => {}).answer([{ role: 'user', content: 'Send a card, buttons and a form' }], settingsSchema.parse({}), AbortSignal.timeout(3000), actions());
 expect(sent).toEqual(formats);
 expect(answer).toContain('card, buttons and form');
 expect(requests).toBe(9);
});

test('tool requests after the bounded repair budget produce an honest response', async () => {
 globalThis.fetch = (async () => Response.json({ choices: [{ finish_reason: 'tool_calls', message: { tool_calls: [{ id: 'call', type: 'function', function: { name: tool.function.name, arguments: '{}' } }] } }] })) as typeof fetch;
 const actions = (): AgentActions => ({ tools: [tool], instructions: 'Repair only from supplied facts', decision: { nextStep: 'act', requestedFormats: ['form'] } as any,
  execute: async () => ({ status: 'invalid_arguments' }), review: async () => ({ accept: false, actions: actions() }),
 });
 const answer = await new MistralChatProvider(() => 'test-only', () => {}).answer([{ role: 'user', content: 'Send a form' }], settingsSchema.parse({}), AbortSignal.timeout(3000), actions());
 expect(answer).toContain("couldn't complete");
});
