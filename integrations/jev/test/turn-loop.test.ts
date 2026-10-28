import { afterEach, expect, test } from 'bun:test';
import { JevActionRouter, type ActionFormat } from '../src/jev';
import { fixtureAnswers } from './fixtures';

const actualFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = actualFetch; });
async function classify(results: Array<{ format: string; status: string }>, options: { scalarAction?: string; requestedFormats?: ActionFormat[]; needs?: Record<string, string> } = {}) {
  let request: any;
  globalThis.fetch = (async (_url, init) => {
    request = JSON.parse(String(init?.body));
    const action = options.scalarAction ?? (Object.hasOwn(request.questions.action.criteria, 'buttons') ? 'buttons' : 'none');
    return Response.json({ model: 'fixture', answers: fixtureAnswers(request, { action, next: action === 'none' ? 'respond' : 'act', reply: 'accept', proposal: 'accept', field: 'none', button: 'reply', ...options.needs }) });
  }) as typeof fetch;
  const decision = await new JevActionRouter(() => 'test-only').classify([{ role: 'user', content: 'Send a booking card and separate Confirm or Reschedule buttons.' }], 'fixture', true, AbortSignal.timeout(1000), 'message', undefined, { phase: 'result', requestedFormats: options.requestedFormats, results: results.map(result => ({ tool: 'send_chat_message', result })), recentActions: [] });
  return { request, decision };
}

test('completed formats leave the current turn’s action menu so review can finish', async () => {
  const { request, decision } = await classify([{ format: 'booking', status: 'submitted' }, { format: 'buttons', status: 'already_submitted' }]);
  expect(request.questions.action.criteria).not.toHaveProperty('booking');
  expect(request.questions.action.criteria).not.toHaveProperty('buttons');
  expect(decision.format).toBe('none');
  expect(decision.nextStep).toBe('respond');
});

test('a definitely failed format remains available, then leaves after successful recovery', async () => {
  const failed = await classify([{ format: 'buttons', status: 'failed' }]);
  expect(failed.request.questions.action.criteria).toHaveProperty('buttons');
  expect(failed.decision.nextStep).toBe('act');
  const recovered = await classify([{ format: 'buttons', status: 'failed' }, { format: 'buttons', status: 'submitted' }]);
  expect(recovered.request.questions.action.criteria).not.toHaveProperty('buttons');
  expect(recovered.decision.nextStep).toBe('respond');
});


test('independent intents retain an unfinished second message when the scalar route says none', async () => {
  const { request, decision } = await classify([{ format: 'booking', status: 'submitted' }], { scalarAction: 'none', requestedFormats: ['booking', 'buttons'], needs: { need_buttons: 'ready' } });
  expect(request.questions.need_buttons.criteria).not.toHaveProperty('no');
  expect(decision.requestedFormats).toEqual(['booking', 'buttons']);
  expect(decision.format).toBe('buttons');
  expect(decision.nextStep).toBe('act');
});

test('an unfinished format with missing required facts prompts clarification', async () => {
  const { decision } = await classify([], { scalarAction: 'booking', requestedFormats: ['booking'], needs: { need_booking: 'clarify', need_buttons: 'no' } });
  expect(decision.format).toBe('clarify');
  expect(decision.nextStep).toBe('clarify');
});
