import { expect, test } from 'bun:test';
import { compileOpenUI, createOpenUIMessage, openUIPrompt, openUIResponseText, sendOpenUI } from '@open-wa/plugin-sdk/openui';
import { actionDefinition } from '../../jev/src/actions';
import { interactiveMethods } from '../../../packages/client/src/methods/interactive';
import { getHttpMethodDefinitions } from '@open-wa/schema';
import { createOpenApiDocument } from '../../../packages/api/src/docs/openapi';

const props = {
  TextMessage: { text: 'Hello "there"\nroot = Mutation("send")' },
  Receipt: { title: 'Appointment', fields: [{ label: 'Time', value: '2 pm' }] },
  BookingCard: { title: 'Appointment', body: 'Your appointment', timeZone: 'Europe/London', booking: { startAt: '2026-10-26T14:00:00Z', endAt: '2026-10-26T14:30:00Z', location: 'OpenWA office' } },
  ReplyButtons: { body: 'Choose', actions: [{ type: 'reply', id: 'yes', label: 'Yes' }] },
  ChoiceList: { body: 'Choose', sections: [{ rows: [{ id: 'demo', title: 'Demo' }] }] },
  Form: { body: 'Choose', questions: [{ type: 'multiSelect', id: 'drinks', label: 'Drinks', options: [{ id: 'tea', label: 'Tea' }, { id: 'water', label: 'Water' }] }] },
} as const;

test('every catalogue document compiles to the existing public method with no recipient in the source', async () => {
  const sent: { method: string; args: unknown[] }[] = [];
  for (const [name, value] of Object.entries(props)) {
    const source = createOpenUIMessage(name as keyof typeof props, value);
    const compiled = compileOpenUI(source);
    expect(compiled.component).toBe(name);
    expect(compiled.source).toBe(source);
    expect(compiled.method).toBe(['TextMessage', 'Receipt'].includes(name) ? 'sendText' : 'sendInteractive');
    const runtime = { invoke: async <T>(method: string, args: unknown[] = []) => { sent.push({ method, args }); return 'message-id' as T; } };
    expect(await sendOpenUI(runtime, '447700900123@c.us', source)).toBe('message-id');
    expect(sent.at(-1)?.args).toEqual(['447700900123@c.us', compiled.value]);
  }
  expect(compileOpenUI(createOpenUIMessage('TextMessage', props.TextMessage)).text).toBe(props.TextMessage.text);
  expect(compileOpenUI(createOpenUIMessage('Receipt', props.Receipt)).text).toBe('*Appointment*\n*Time:* 2 pm');
});

test('partial, executable, unsupported and invalid messages cannot dispatch', async () => {
  const good = createOpenUIMessage('ReplyButtons', props.ReplyButtons);
  const invalid = [good.slice(0, -2), good + '\nextra = TextMessage("unused")', good + '\nq = Query("sendText", {})', good + '\nm = Mutation("sendText", {})', good + '\n$state = 1', 'root = Message(TextMessage(@OpenUrl("https://example.com")))', 'root = Message(Unknown("hello"))', 'root = Message(TextMessage("one", "extra"))'];
  let calls = 0;
  const runtime = { invoke: async <T>() => { calls++; return 'id' as T; } };
  for (const source of invalid) await expect(sendOpenUI(runtime, '447700900123@c.us', source)).rejects.toThrow();
  expect(calls).toBe(0);
  expect(() => compileOpenUI(good, ['BookingCard'])).toThrow('not available');
  expect(() => createOpenUIMessage('ReplyButtons', { ...props.ReplyButtons, to: 'another-person' })).toThrow();
  expect(() => createOpenUIMessage('BookingCard', { ...props.BookingCard, booking: { ...props.BookingCard.booking, endAt: '2026-10-26T13:00:00Z' } })).toThrow('after');
  expect(() => createOpenUIMessage('BookingCard', { ...props.BookingCard, booking: { startAt: '2026-10-26T14:00:00Z' } })).toThrow('location');
  expect(openUIPrompt(['BookingCard'])).toContain('BookingCard(');
  expect(openUIPrompt(['BookingCard'])).not.toContain('ReplyButtons(');
});

test('reply IDs and form answers are interpreted from the same compiled document', () => {
  const form = compileOpenUI(createOpenUIMessage('Form', props.Form)).interactive!;
  expect(openUIResponseText(form, { type: 'form', answers: { drinks: ['tea', 'water'] } })).toBe('Form response:\nDrinks: Tea, Water');
  expect(openUIResponseText(form, { type: 'form', answers: { drinks: ['other'] } })).toBeUndefined();
  expect(openUIResponseText(form, { type: 'form', answers: { drinks: ['tea', 'tea'] } })).toBeUndefined();
  expect(openUIResponseText(form, { type: 'form', answers: { injected: 'tea' } })).toBeUndefined();
  const buttons = compileOpenUI(createOpenUIMessage('ReplyButtons', props.ReplyButtons)).interactive!;
  expect(openUIResponseText(buttons, { type: 'reply', id: 'yes' })).toBe('Selected button: Yes');
  expect(openUIResponseText(buttons, { type: 'reply', id: 'wrong' })).toBeUndefined();
});

test('Voxtral booking tool uses the shared OpenUI source and preserves date/time on compilation', () => {
  const prepared = actionDefinition('booking')!.prepare(JSON.stringify({ title: 'Demo appointment', booking: { date: '2026-10-26', time: '14:00', timeZone: 'Europe/London', durationMinutes: 30, location: 'OpenWA office' } }));
  const compiled = compileOpenUI(prepared.openui);
  expect(compiled.component).toBe('BookingCard');
  expect(compiled.value).toEqual(prepared.value);
  expect(compiled.value).toMatchObject({ booking: { startAt: '2026-10-26T14:00:00Z', endAt: '2026-10-26T14:30:00Z', location: 'OpenWA office' } });
  expect(compiled.props.timeZone).toBe('Europe/London');
});

test('the SDK normalizes booking dates before native dispatch without mutating caller documents', async () => {
  const dispatched: any[] = [];
  const client = { evaluate: async (_fn: unknown, input: unknown) => { dispatched.push(input); return { ok: true, id: 'message-id' }; } };
  const methods = interactiveMethods(client as any);
  const content = { type: 'booking' as const, body: 'Details', booking: { startAt: '2026-07-26T14:00:00.000+01:00', endAt: '2026-07-26T14:30:00.000+01:00', location: 'OpenWA office' } };
  await methods.sendInteractive('447700900123@c.us', content);
  expect(dispatched[0].content.booking).toEqual({ startAt: '2026-07-26T13:00:00Z', endAt: '2026-07-26T13:30:00Z', location: 'OpenWA office' });
  expect(content.booking.startAt).toBe('2026-07-26T14:00:00.000+01:00');
  await expect(methods.sendInteractive('447700900123@c.us', { ...content, booking: { ...content.booking, startAt: '2026-07-26T14:00:00.100+01:00', endAt: '2026-07-26T14:00:00.500+01:00' } })).rejects.toThrow('after');
  expect(dispatched).toHaveLength(1);
});

test('Easy API documentation exposes accepted date inputs and preserves codec metadata', () => {
  const methods = getHttpMethodDefinitions();
  const document = createOpenApiDocument(methods, { origin: 'http://localhost:8080' });
  const path = methods.find(method => method.functionName === 'sendInteractive')!.path;
  const content = document.paths[path].post.requestBody.content['application/json'].schema.properties.content;
  const booking = content.oneOf.find((value: { properties: { type: { enum: string[] } } }) => value.properties.type.enum.includes('booking'));
  const timestamp = booking.properties.booking.properties.startAt;
  expect(timestamp.format).toBe('date-time');
  expect(timestamp.description).toContain('Decoding converts');
  expect(new RegExp(timestamp.pattern).test('2026-07-26T14:00:00.123+01:00')).toBe(true);
});
