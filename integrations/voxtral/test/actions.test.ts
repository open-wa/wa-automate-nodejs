import { makeServices, fixtureAnswers } from '../../jev/test/fixtures';
import { afterEach, expect, test } from 'bun:test';
import { createHash, randomUUID } from 'node:crypto';
import { rm } from 'node:fs/promises';
import { VoxtralService } from '../src/service';
import { actionDefinition } from '../../jev/src/actions';
import { JevActionRouter } from '../../jev/src/jev';
import { HyperEmitter } from '../../../packages/hyperemitter/src';
import { createEventGateway } from '../../../packages/core/src/plugins/EventGateway';
import type { OpenWAEventMap } from '../../../packages/core/src/events/eventMap';
import { createLogger } from '../../../packages/logger/src';
import { Effect } from 'effect';

const originalFetch = globalThis.fetch;
const fixtures: Array<{ service: VoxtralService; sessionId: string; events: HyperEmitter<OpenWAEventMap>; controller: AbortController }> = [];
afterEach(async () => {
  globalThis.fetch = originalFetch;
  for (const { service, sessionId, events, controller } of fixtures.splice(0)) {
    await service.dispose();
    controller.abort();
    await Effect.runPromise(events.close());
    await rm(`.open-wa/plugins/voxtral/${createHash('sha256').update(sessionId).digest('hex').slice(0, 24)}`, { recursive: true, force: true });
  }
});
async function until(predicate: () => boolean) {
  const deadline = Date.now() + 3000;
  while (!predicate()) { if (Date.now() > deadline) throw new Error('Chat action did not settle'); await Bun.sleep(10); }
}
const peer = '447700900123@c.us';
const examples = {
  booking: { title: 'Demo booking', booking: { date: '2026-10-26', time: '14:00', timeZone: 'Europe/London', durationMinutes: 30, location: 'OpenWA office' } },
  buttons: { body: 'Would you like directions?', actions: [{ type: 'reply', id: 'yes', label: 'Yes please' }, { type: 'reply', id: 'no', label: 'No thanks' }] },
  form: { body: 'Choose your preferences', questions: [{ type: 'singleSelect', id: 'reminder', label: 'Reminder', options: [{ id: 'day', label: 'One day before' }, { id: 'hour', label: 'One hour before' }] }, { type: 'multiSelect', id: 'drinks', label: 'Drinks', options: [{ id: 'tea', label: 'Tea' }, { id: 'water', label: 'Water' }] }] },
};
async function setup(format: keyof typeof examples, options: { unknownSend?: boolean; interactive?: boolean; repeat?: boolean; invalidFirst?: boolean; initialTime?: string; correction?: unknown; deleteResult?: boolean; deleteThrows?: boolean; followup?: boolean; definiteFailureFirst?: boolean; badFirstReply?: boolean; inventedOptional?: boolean } = {}) {
  const sessionId = `voxtral-actions-test-${randomUUID()}`;
  const events = new HyperEmitter<OpenWAEventMap>();
  const controller = new AbortController();
  const gateway = createEventGateway(events, 'voxtral', createLogger({ component: 'voxtral-test' }), controller.signal);
  const sent: Array<{ method: string; args: any[] }> = [];
  const requests: any[] = [];
  let classifyAs: string = format;
  let chatAttempts = 0, draftCount = 0;
  let transcript = `Send those agreed details in this chat for 26 October 2026 at ${options.initialTime ?? '14:00'} London time for 30 minutes at OpenWA office.`, incoming = 0;
  const pcm = Buffer.alloc(9600);
  for (let i = 0; i < pcm.length / 4; i++) pcm.writeFloatLE(0.25 * Math.sin(i / 8), i * 4);
  globalThis.fetch = (async (input: any, init: any) => {
    const path = new URL(String(input)).pathname;
    const body = init.body instanceof FormData ? init.body : JSON.parse(init.body);
    requests.push({ path, body });
    if (path.endsWith('/transcriptions')) return Response.json({ text: transcript });
    if (path.endsWith('/systemone')) {
      const candidates = Object.keys(body.questions.action.criteria);
      const outcomes = body.state.actionResults.map((entry: any) => entry.result);
      const accepted = outcomes.filter((result: any) => result.status === 'submitted');
      const unknown = outcomes.some((result: any) => result.status === 'unknown');
      const choice = unknown || accepted.length && !(options.followup && accepted.length === 1) ? 'none'
        : options.followup && accepted.length === 1 ? 'buttons' : candidates.includes(classifyAs) ? classifyAs : candidates.includes('template') ? 'template' : 'none';
      const next = unknown ? 'reconcile' : ['none', 'clarify'].includes(choice) ? choice === 'clarify' ? 'clarify' : 'respond' : 'act';
      const unsupported = options.inventedOptional && body.state.proposedAction?.content?.footer?.includes('447000000000');
      const values = { action: choice, next, button: 'reply', proposal: unsupported ? 'repair' : 'accept', field: unsupported ? 'footer' : 'none', reply: body.state.proposedReply === 'I booked your appointment in the reservation system.' ? 'revise' : 'accept' };
      return Response.json({ model: 'jev-test', answers: fixtureAnswers(body, values) });
    }
    if (path.endsWith('/completions')) {
      const results = body.messages.filter((message: any) => message.role === 'tool');
      const properties = body.tools?.[0]?.function.parameters.properties;
      const chosenFormat = properties?.booking ? 'booking' : properties?.questions ? 'form' : properties?.actions ? 'buttons' : format;
      let args = body.tools?.[0]?.function.name === 'correct_booking_card' ? options.correction ?? { booking: { time: '14:00' } }
        : options.invalidFirst && !results.length ? { ...examples[chosenFormat], body: '' }
        : chosenFormat === 'booking' && options.initialTime ? { ...examples.booking, booking: { ...examples.booking.booking, time: options.initialTime } } : examples[chosenFormat];
      if (options.inventedOptional && chosenFormat === 'booking') args = { ...args, footer: 'Call +447000000000 to confirm' } as any;
      if (body.tools?.length) return Response.json({ choices: [{ finish_reason: 'tool_calls', message: { content: null, tool_calls: [{ id: `tool-${results.length}`, type: 'function', function: { name: body.tools[0].function.name, arguments: JSON.stringify(args) } }] } }] });
      if (options.badFirstReply && draftCount++ === 0) return Response.json({ choices: [{ finish_reason: 'stop', message: { content: 'I booked your appointment in the reservation system.' } }] });
      return Response.json({ choices: [{ finish_reason: 'stop', message: { content: results.at(-1)?.content.includes('unknown') ? 'Please check your chat; I could not confirm the send.' : 'Here are the details.' } }] });
    }
    if (path.endsWith('/speech')) return Response.json({ audio_data: pcm.toString('base64') });
    throw new Error(`Unexpected request ${path}`);
  }) as typeof fetch;
  const service = await VoxtralService.create({ services: makeServices(), sessionId, config: { apiKey: 'test-only', jevApiKey: 'test-only', mode: 'both' }, signal: controller.signal,
    events: gateway, logger: { error() {} },
    runtime: { invoke: async (method: string, args: any[]) => {
      if (method === 'getLicenseFeatures') return { status: 'valid', features: { interactive: options.interactive ?? true } };
      if (method === 'decryptMedia') return 'data:audio/ogg;base64,T2dnUw==';
      if (method === 'deleteMessage') {
        sent.push({ method, args });
        if (options.deleteThrows) throw new Error('Connection lost during old-card removal');
        return options.deleteResult ?? true;
      }
      if (method === 'sendInteractive' || method === 'sendText' || method === 'sendPtt') {
        sent.push({ method, args });
        if (method !== 'sendPtt' && options.definiteFailureFirst && chatAttempts++ === 0) throw Object.assign(new Error('Not submitted; connection not open'), { outcome: 'not_sent' });
        if (method !== 'sendPtt' && options.unknownSend) throw new Error('Connection lost after dispatch');
        return method === 'sendPtt' ? `true_${peer}_VOICE${sent.length}` : `true_${peer}_CARD${sent.length}`;
      }
      throw new Error(`Unexpected invocation ${method}`);
    } },
  } as any);
  fixtures.push({ service, sessionId, events, controller }); service.clientReady();
  const process = async (text?: string) => { transcript = text ?? transcript; await service.message({ id: `incoming-${++incoming}`, from: peer, type: 'ptt' }); await until(() => !service.status().processing && !service.status().queued); };
  return { service, events, sent, requests, process, classify: (value: string) => { classifyAs = value; } };
}

for (const format of ['booking', 'buttons', 'form'] as const) test(`voice request submits a Jev-selected ${format} before its spoken acknowledgement`, async () => {
  const { service, sent, requests, process } = await setup(format); await process();
  expect(sent.map(send => send.method)).toEqual(['sendInteractive', 'sendPtt']);
  expect(sent[0].args[0]).toBe(peer);
  expect(sent[0].args[1]).toMatchObject(format === 'booking' ? { type: 'booking', booking: { startAt: '2026-10-26T14:00:00Z', endAt: '2026-10-26T14:30:00Z', location: 'OpenWA office' } } : { ...examples[format], type: format });
  expect(requests.find(request => request.path.endsWith('/systemone')).body.state.latestRequest).toBe('Send those agreed details in this chat for 26 October 2026 at 14:00 London time for 30 minutes at OpenWA office.');
  const completion = requests.find(request => request.path.endsWith('/completions'));
  expect(completion.body.tools).toHaveLength(1);
  expect(completion.body.tools[0].function.parameters.properties).not.toHaveProperty('to');
  expect(service.conversation(service.list()[0].id).turns.find(turn => turn.action)).toMatchObject({ classification: { format }, state: 'Submitted', openui: expect.stringContaining('root = Message(') });
});

for (const format of ['buttons', 'form'] as const) test(`${format} replies correlate by stanza ID, bypass acceptText, and are processed once`, async () => {
  const { service, events, sent, requests, process, classify } = await setup(format); await process(); classify('none');
  const completionsBeforeSelection = requests.filter(request => request.path.endsWith('/completions')).length;
  const response = { messageId: 'incoming-selection', chatId: peer, senderId: peer, originalMessageId: 'CARD1', raw: {}, ...(format === 'buttons' ? { type: 'reply', id: 'yes' } : { type: 'form', answers: { reminder: 'hour', drinks: ['tea', 'water'] } }) };
  const ctx = { correlationId: 'test-selection', ts: Date.now() };
  events.emit('interactive.response', { ctx, response: { ...response, originalMessageId: 'UNRELATED' } });
  expect(service.conversation(service.list()[0].id).turns.filter(turn => turn.selection)).toHaveLength(0);
  events.emit('interactive.response', { ctx, response });
  await until(() => sent.filter(send => send.method === 'sendPtt').length === 2);
  await until(() => !service.status().processing);
  const turns = service.conversation(service.list()[0].id).turns;
  expect(turns.find(turn => turn.selection)?.text).toBe(format === 'buttons' ? 'Selected button: Yes please' : 'Form response:\nReminder: One hour before\nDrinks: Tea, Water');
  const routedSelection = requests.filter(request => request.path.endsWith('/systemone')).at(-1);
  expect(routedSelection.body.state.latestInput).toBe('selection');
  expect(requests.filter(request => request.path.endsWith('/completions'))).toHaveLength(completionsBeforeSelection);
  const spoken = requests.filter(request => request.path.endsWith('/speech')).at(-1).body.input;
  expect(spoken).toBe(format === 'buttons' ? "Thanks, I've noted your choice here: Yes please." : "Thanks, I've noted your answers here. Reminder: One hour before. Drinks: Tea, Water.");
  expect(turns.at(-1)?.text).toBe(spoken);
  events.emit('interactive.response', { ctx, response });
  expect(sent.filter(send => send.method === 'sendPtt')).toHaveLength(2);
  expect(sent.filter(send => send.method === 'sendInteractive')).toHaveLength(1);
});

test('model retries never duplicate a submitted card or an uncertain send', async () => {
  for (const unknownSend of [false, true]) {
    const { service, sent, process } = await setup('booking', { repeat: true, unknownSend }); await process();
    expect(sent.filter(send => send.method === 'sendInteractive')).toHaveLength(1);
    expect(service.conversation(service.list()[0].id).turns.find(turn => turn.action)?.state).toBe(unknownSend ? 'Send outcome unknown' : 'Submitted');
  }
});

test('only licensed formats are sent to Jev and keys stay out of settings and exports', async () => {
  const { service, requests } = await setup('booking', { interactive: false });
  expect((await service.previewAction('Send booking details.', AbortSignal.timeout(1000))).format).toBe('template');
  expect(Object.keys(requests[0].body.questions.action.criteria)).toEqual(['none', 'clarify', 'text', 'template']);
  expect(JSON.stringify(service.settingsView())).not.toContain('test-only');
  expect(service.exportConfig()).not.toContain('test-only');
});

test('selected schemas reject injected recipients, host media and invalid booking ranges', () => {
  expect(() => actionDefinition('booking')!.prepare(JSON.stringify({ ...examples.booking, to: 'somebody-else' }))).toThrow();
  expect(() => actionDefinition('booking')!.prepare(JSON.stringify({ ...examples.booking, booking: { date: '2026-10-26', time: '14:00', timeZone: 'Unknown/Zone' } }))).toThrow();
  expect(() => actionDefinition('buttons')!.prepare(JSON.stringify({ ...examples.buttons, header: { type: 'document', source: '/private/file' } }))).toThrow();
  expect(actionDefinition('none')).toBeUndefined();
  expect(actionDefinition('clarify')).toBeUndefined();
});

test('invalid generated wording returns precise repair feedback before WhatsApp is invoked', async () => {
  const { sent, requests, process } = await setup('form', { invalidFirst: true }); await process();
  expect(sent.map(send => send.method)).toEqual(['sendInteractive', 'sendPtt']);
  const repair = requests.filter(request => request.path.endsWith('/completions'))[1].body.messages.find((message: any) => message.role === 'tool');
  expect(JSON.parse(repair.content)).toMatchObject({ status: 'invalid_arguments', fields: [{ path: 'body' }] });
  expect(sent[0].args[1].body).toBe('Choose your preferences');
});

test('booking wall-clock time uses the timezone rules for the appointment date', () => {
  const booking = actionDefinition('booking')!;
  for (const [date, expected] of [['2026-10-26', '2026-10-26T14:00:00Z'], ['2026-07-26', '2026-07-26T13:00:00Z']]) {
    const prepared = booking.prepare(JSON.stringify({ booking: { date, time: '14:00', timeZone: 'Europe/London', durationMinutes: 30, location: 'OpenWA office' } }));
    expect(prepared.value).toMatchObject({ booking: { startAt: expected } });
    expect(prepared.text).toContain('14:00');
    expect(prepared.text).toContain(date === '2026-10-26' ? 'GMT' : 'BST');
    expect(prepared.text).not.toContain('Time zone:');
    expect(prepared.text).not.toContain('Duration:');
    expect(prepared.text.split('\n')).toHaveLength(1);
    expect(prepared.preview?.fields?.find(field => field.label === 'Starts')?.value).not.toContain('T14:00:00');
  }
  expect(() => booking.prepare(JSON.stringify({ booking: { date: '2026-03-29', time: '01:30', timeZone: 'Europe/London', location: 'OpenWA office' } }))).toThrow('does not exist');
  expect(() => booking.prepare(JSON.stringify({ booking: { date: '2026-10-25', time: '01:30', timeZone: 'Europe/London', location: 'OpenWA office' } }))).toThrow('occurs twice');
  expect(booking.prepare(JSON.stringify({ booking: { date: '2026-10-25', time: '01:30', timeZone: 'Europe/London', utcOffset: '+00:00', location: 'OpenWA office' } })).value).toMatchObject({ booking: { startAt: '2026-10-25T01:30:00Z' } });
});

test('a spoken booking correction preserves other facts and submits the replacement before removing only its predecessor', async () => {
  const { service, sent, requests, process, classify } = await setup('booking', { initialTime: '20:00', repeat: true });
  await process(); classify('correct-booking'); await process('No, I said 2 pm.');
  expect(sent.map(item => item.method)).toEqual(['sendInteractive', 'sendPtt', 'sendInteractive', 'deleteMessage', 'sendPtt']);
  expect(sent[2].args).toMatchObject([peer, { title: 'Demo booking', booking: { startAt: '2026-10-26T14:00:00Z', endAt: '2026-10-26T14:30:00Z', location: 'OpenWA office' } }]);
  expect(sent[3].args).toEqual([peer, `true_${peer}_CARD1`, false]);
  const routing = requests.filter(request => request.path.endsWith('/systemone') && request.body.state.phase === 'input').at(-1).body;
  expect(routing.state.latestBooking.booking.time).toBe('20:00');
  const turns = service.conversation(service.list()[0].id).turns;
  expect(turns.find(turn => turn.textId === `true_${peer}_CARD1`)).toMatchObject({ state: 'Replaced', replacedByMessageId: `true_${peer}_CARD3` });
  expect(turns.find(turn => turn.action === 'correct_booking_card')).toMatchObject({ state: 'Submitted', previousCardRemoval: 'removed', replacesMessageId: `true_${peer}_CARD1` });
  await process('No, I said 2 pm.');
  expect(sent.filter(item => item.method === 'deleteMessage').map(item => item.args[1])).toEqual([`true_${peer}_CARD1`, `true_${peer}_CARD3`]);
});

test('an uncertain replacement never removes the known original booking card', async () => {
  const options = { initialTime: '20:00', unknownSend: false };
  const { service, sent, process, classify } = await setup('booking', options);
  await process(); options.unknownSend = true; classify('correct-booking'); await process('No, I said 2 pm.');
  expect(sent.filter(item => item.method === 'deleteMessage')).toHaveLength(0);
  const turns = service.conversation(service.list()[0].id).turns;
  expect(turns.find(turn => turn.textId === `true_${peer}_CARD1`)?.state).toBe('Submitted');
  expect(turns.find(turn => turn.action === 'correct_booking_card')?.state).toBe('Send outcome unknown');
});

for (const deleteThrows of [false, true]) test(`old-card removal ${deleteThrows ? 'disconnect' : 'rejection'} preserves the submitted replacement and reports the actual outcome`, async () => {
  const { service, sent, requests, process, classify } = await setup('booking', { initialTime: '20:00', deleteResult: false, deleteThrows });
  await process(); classify('correct-booking'); await process('No, I said 2 pm.');
  expect(sent.filter(item => item.method === 'sendInteractive')).toHaveLength(2);
  const correction = service.conversation(service.list()[0].id).turns.find(turn => turn.action === 'correct_booking_card');
  expect(correction).toMatchObject({ state: 'Submitted', previousCardRemoval: deleteThrows ? 'unknown' : 'failed' });
  const script = requests.filter(request => request.path.endsWith('/speech')).at(-1).body.input;
  expect(script).toContain('corrected booking card for 26 October 2026, 14:00');
  expect(script).toContain(deleteThrows ? 'may still be visible' : 'still visible');
  expect(script).not.toContain('booking was changed');
});

test('corrections require a known own card and reject recipient or message ID injection', () => {
  expect(actionDefinition('correct-booking')).toBeUndefined();
  const original = actionDefinition('booking')!.prepare(JSON.stringify(examples.booking)).bookingInput!;
  const correction = actionDefinition('correct-booking', original)!;
  for (const invalid of [{ booking: {} }, { booking: { time: '25:00' } }, { booking: { time: '14:00' }, messageId: 'arbitrary-message' }, { booking: { time: '14:00', to: 'somebody-else' } }]) {
    expect(() => correction.prepare(JSON.stringify(invalid))).toThrow();
  }
});


test('each exchange is reviewed against real action results before the voice reply', async () => {
  const { service, requests, process } = await setup('buttons'); await process();
  const checkpoints = requests.filter(request => request.path.endsWith('/systemone'));
  expect(checkpoints.map(request => request.body.state.phase)).toEqual(['input', 'proposal', 'result', 'reply']);
  expect(checkpoints[2].body.state.actionResults[0].result.status).toBe('submitted');
  expect(checkpoints[3].body.state.proposedReply).toBe("I've sent the button message in this chat.");
  expect(service.conversation(service.list()[0].id).turns[0].decisionTrail).toHaveLength(4);
});

test('result review advances another unfinished action without repeating the completed card', async () => {
  const { sent, requests, process } = await setup('booking', { followup: true }); await process('Send the booking card for 26 October 2026 at 14:00 London time for 30 minutes at OpenWA office and buttons for confirming or rescheduling.');
  expect(sent.filter(send => send.method === 'sendInteractive').map(send => send.args[1].type)).toEqual(['booking', 'buttons']);
  expect(requests.filter(request => request.path.endsWith('/systemone')).map(request => request.body.state.phase)).toEqual(['input', 'proposal', 'result', 'proposal', 'result', 'reply']);
});

test('a definitely-not-sent failure can be retried after Jev reassesses it', async () => {
  const { sent, requests, process } = await setup('buttons', { definiteFailureFirst: true }); await process();
  expect(sent.filter(send => send.method === 'sendInteractive')).toHaveLength(2);
  const observations = requests.filter(request => request.path.endsWith('/systemone')).map(request => request.body.state.actionResults);
  expect(observations.some(results => results.some((entry: any) => entry.result.definitelyNotSent === true))).toBe(true);
  expect(sent.filter(send => send.method === 'sendPtt')).toHaveLength(1);
});

test('an unsupported proposed reply is revised before any speech is generated', async () => {
  const { service, requests, process } = await setup('booking', { badFirstReply: true });
  const acknowledge = service.provider.answer.bind(service.provider);
  service.provider.answer = (turns, settings, signal, actions) => acknowledge(turns, settings, signal, actions && { ...actions, acknowledgeResult: undefined }); await process();
  const drafts = requests.filter(request => request.path.endsWith('/systemone') && request.body.state.phase === 'reply');
  expect(drafts.map(request => request.body.state.proposedReply)).toEqual(['I booked your appointment in the reservation system.', 'Here are the details.']);
  expect(requests.find(request => request.path.endsWith('/speech')).body.input).toBe('Here are the details.');
});


test('Jev locates an unsupported optional field and the host repairs it through the schema', async () => {
  const { service, sent, requests, process } = await setup('booking', { inventedOptional: true }); await process();
  const messages = sent.filter(send => send.method === 'sendInteractive');
  expect(messages).toHaveLength(1);
  expect(messages[0].args[1].footer ?? '').not.toContain('447000000000');
  expect(requests.filter(request => request.path.endsWith('/completions'))).toHaveLength(1);
  const proposals = service.conversation(service.list()[0].id).turns[0].decisionTrail!.filter(entry => entry.phase === 'proposal');
  expect(proposals.map(entry => entry.decision.proposalVerdict)).toEqual(['repair', 'accept']);
});

test('tool parameters describe input fields so schema defaults are not required arguments', () => {
  const definition = actionDefinition('booking')!;
  expect(definition.tool.function.parameters.required).toEqual(['booking']);
  expect(definition.prepare(JSON.stringify(examples.booking)).interactive).toMatchObject({ type: 'booking', buttonLabel: 'View booking' });
});


test('rounded Jev probabilities totaling 0.99 remain a valid distribution', async () => {
  globalThis.fetch = (async (_url: any, init: any) => {
    const request = JSON.parse(init.body), choices = { action: 'booking', next: 'act', reply: 'accept', proposal: 'accept', field: 'none', button: 'reply' };
    const answers = fixtureAnswers(request, choices);
    answers.action.probabilities = Object.fromEntries(Object.keys(request.questions.action.criteria).map(key => [key, key === 'booking' ? 0.93 : key === 'clarify' ? 0.04 : key === 'buttons' ? 0.02 : 0]));
    return Response.json({ model: 'jev-test', answers });
  }) as typeof fetch;
  expect((await new JevActionRouter(() => 'test-only').classify([{ role: 'user', content: 'Send the known booking details.' }], 'jev-test', true, AbortSignal.timeout(1000))).format).toBe('booking');
});


test('Jev button intent constrains the tool to reply controls or external actions', () => {
  const replies = actionDefinition('buttons', undefined, { buttonKind: 'reply' })!;
  expect(() => replies.prepare(JSON.stringify({ body: 'Choose', actions: [{ type: 'copy', label: 'Confirm', code: 'yes' }] }))).toThrow();
  expect(replies.prepare(JSON.stringify(examples.buttons)).interactive).toMatchObject({ type: 'buttons' });
  const cta = actionDefinition('buttons', undefined, { buttonKind: 'cta' })!;
  expect(() => cta.prepare(JSON.stringify(examples.buttons))).toThrow();
});
