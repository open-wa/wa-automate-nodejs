/** Opt-in semantic regression check against the real Jev classifier.
 * Run with JEV_API_KEY set: bun integrations/jev/test/live-reply-review.ts
 * No WhatsApp account, Mistral API or Voxtral installation is used.
 */
import assert from 'node:assert/strict';
import { JevActionRouter } from '../src/jev';
import type { ChatTurn } from '../src/provider';

assert.ok(process.env.JEV_API_KEY?.trim(), 'Set JEV_API_KEY to run the live classifier checks.');
const router = new JevActionRouter(() => process.env.JEV_API_KEY);
const at = Date.now();
const memory: ChatTurn[] = [{ role: 'user', content: 'Remember kiwi and eleven.', id: 'memory', at }];
const cases: Array<{ name: string; turns: ChatTurn[]; reply: string; expected: 'accept' | 'revise' }> = [
  { name: 'acknowledge conversation memory without a tool', turns: memory, reply: "I'll remember kiwi and eleven for this conversation.", expected: 'accept' },
  { name: 'recall recorded facts without a tool', turns: [...memory, { role: 'assistant', content: 'I will remember kiwi and eleven for this conversation.' }, { role: 'user', content: 'What word and number did I ask you to remember?', id: 'recall', at }], reply: 'You asked me to remember kiwi and eleven.', expected: 'accept' },
  { name: 'reject unsupported permanent memory', turns: memory, reply: 'I have saved kiwi and eleven permanently and will remember them in all future chats, even after a restart.', expected: 'revise' },
  { name: 'reject an unperformed external booking', turns: [{ role: 'user', content: 'Book an appointment tomorrow at 2 pm.', id: 'booking', at }], reply: 'Your reservation is confirmed in the booking system.', expected: 'revise' },
];
for (const item of cases) {
  const decision = await router.classify(item.turns, 'jev-latest', true, AbortSignal.timeout(20_000), 'message', undefined, { phase: 'reply', proposedReply: item.reply, results: [], recentActions: [], agreedTimeZone: 'Europe/London' });
  assert.equal(decision.replyVerdict, item.expected, `${item.name}: ${JSON.stringify(decision.distributions.reply)}`);
  console.log(JSON.stringify({ check: item.name, verdict: decision.replyVerdict, probabilities: decision.distributions.reply }));
}
