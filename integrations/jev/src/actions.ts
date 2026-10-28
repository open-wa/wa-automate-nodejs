import { z } from '@open-wa/plugin-sdk';
import { compileOpenUI, createOpenUIMessage, ReceiptProps, openUIResponseText } from '@open-wa/plugin-sdk/openui';
import { ReplyActionSchema, LinkActionSchema, CallActionSchema, CopyActionSchema, ButtonsContentSchema, ListContentSchema, FormContentSchema, BookingContentSchema, InteractiveContentSchema, type InteractiveContent } from '@open-wa/schema';
import { formatLabels, type ActionFormat, type ActionDecision, type TurnFeedback } from './jev';
import { bookingInstant } from './booking';
import { groundedBooking, copyLiteralReferences, type GroundedFacts } from './facts';

export const chatMessageArguments = z.object({ text: z.string().trim().min(1).max(4096) }).strict();
const templateArguments = ReceiptProps;
const body = z.string().trim().min(1).describe('A short, non-empty message introducing the content. Compose it naturally from the request; the person does not need to dictate this wording. Include only business facts actually supplied in the conversation; do not introduce an appointment date or confirmed status when none was provided.');
const bookingFields = BookingContentSchema.shape.booking.omit({ startAt: true, endAt: true, labels: true }).extend({
    date: z.iso.date().describe('Appointment date in YYYY-MM-DD, from the conversation.'),
    time: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/).describe('Local appointment start time in 24-hour HH:mm, for example 14:00.'),
    timeZone: z.string().trim().min(1).describe('IANA timezone from the conversation, for example Europe/London. The plugin calculates daylight saving.'),
    durationMinutes: z.number().int().positive().optional().describe('Only include when the appointment duration is known.'),
    utcOffset: z.string().regex(/^[+-](?:[01]\d|2[0-3]):[0-5]\d$/).optional().describe('Only include if the person explicitly specifies an offset, particularly to disambiguate a repeated local time.'),
  });
const bookingArguments = BookingContentSchema.omit({ type: true, version: true, body: true, actions: true, buttonLabel: true }).extend({
  booking: bookingFields.refine(value => [value.location, value.url, value.phoneNumber].some(item => item?.trim()), { path: ['location'], message: 'Supply the known location, booking URL or phone number.' }).describe('Date, local time, IANA timezone and one destination (location, booking URL or phone number) are required. Omit unknown optional contact details and URLs; never supply empty strings for them.'),
});
export type BookingInput = z.output<typeof bookingArguments>;
const bookingCorrectionArguments = z.object({
  booking: bookingFields.partial().refine(value => Object.values(value).some(item => item !== undefined), 'Supply at least one corrected booking field.'),
}).strict();
const schemas = {
  text: chatMessageArguments, template: templateArguments,
  buttons: ButtonsContentSchema.omit({ type: true, version: true, header: true }).extend({ body }),
  list: ListContentSchema.omit({ type: true, version: true }).extend({ body }),
  form: FormContentSchema.omit({ type: true, version: true }).extend({ body }),
  booking: bookingArguments,
};
export type SendFormat = keyof typeof schemas;
export type ToolCall = { id: string; type: 'function'; function: { name: string; arguments: string } };
type FunctionTool = { type: 'function'; function: { name: string; description: string; parameters: Record<string, unknown> } };
export type AgentActions = {
  instructions: string;
  decision?: ActionDecision;
  /** Re-evaluate actual results and unsent replies before continuing the turn. */
  review?: (feedback: TurnFeedback, signal: AbortSignal) => Promise<{ accept: boolean; actions: AgentActions }>;
  tools: FunctionTool[];
  /** Factual acknowledgement rendered from a verified selection, without model generation. */
  acknowledgement?: string;
  /** Render a factual result after the host has completed an action. */
  acknowledgeResult?: (result: unknown) => string | undefined;
  execute: (call: ToolCall, signal: AbortSignal) => Promise<unknown>;
};
export type ActionPreview = { title?: string; fields?: { label: string; value: string }[]; options?: string[]; footer?: string };
export type PreparedAction = { method: 'sendText' | 'sendInteractive'; value: string | InteractiveContent; text: string; preview?: ActionPreview; interactive?: InteractiveContent; openui: string; bookingInput?: BookingInput };

export function actionDefinition(format: ActionFormat, previousBooking?: BookingInput, options?: { buttonKind: 'reply' | 'cta'; facts?: GroundedFacts; timeZone?: string }): { tool: FunctionTool; prepare: (args: string) => PreparedAction } | undefined {
  if (format === 'none' || format === 'clarify') return;
  if (format === 'correct-booking') {
    if (!previousBooking) return;
    return {
      tool: { type: 'function', function: {
        name: 'correct_booking_card',
        description: 'Correct the latest booking card sent by this assistant to this person. Supply ONLY the fields the person corrects. The plugin preserves all other details, sends a corrected card, then removes the old card. This changes the chat card only, not a reservation in a booking system.',
        parameters: z.toJSONSchema(bookingCorrectionArguments, { io: 'input' }) as Record<string, unknown>,
      } },
      prepare(args) {
        const raw = JSON.parse(args);
        const changes = bookingCorrectionArguments.parse(options?.facts ? { booking: groundedBooking(raw.booking ?? {}, options.facts, true, previousBooking.booking, options.timeZone) } : raw);
        const booking = { ...previousBooking.booking, ...changes.booking };
        if ((changes.booking.date || changes.booking.time || changes.booking.timeZone) && !changes.booking.utcOffset) delete booking.utcOffset;
        return actionDefinition('booking')!.prepare(JSON.stringify({ ...previousBooking, booking }));
      },
    };
  }
  const schema = format === 'buttons' && options ? schemas.buttons.extend({
    actions: options.buttonKind === 'reply' ? z.array(ReplyActionSchema).min(1) : z.array(z.discriminatedUnion('type', [LinkActionSchema, CallActionSchema, CopyActionSchema])).min(1),
  }) : schemas[format];
  return {
    tool: { type: 'function' as const, function: {
      name: 'send_chat_message',
      description: `Send one ${formatLabels[format].toLowerCase()} to the person in this WhatsApp conversation. Jev selected this format. ${formatRules[format]} This does not create or change a reservation in an external booking system.`,
      parameters: z.toJSONSchema(schema, { io: 'input' }) as Record<string, unknown>,
    } },
    prepare(args: string): PreparedAction {
      const input = JSON.parse(args);
      if (options?.facts) {
        if (format === 'booking') input.booking = groundedBooking(input.booking ?? {}, options.facts, false, undefined, options.timeZone);
        copyLiteralReferences(input, options.facts);
      }
      if (format === 'text') {
        const { text } = chatMessageArguments.parse(input);
        const openui = createOpenUIMessage('TextMessage', { text });
        return { ...compileOpenUI(openui), openui };
      }
      if (format === 'template') {
        const template = templateArguments.parse(input);
        const openui = createOpenUIMessage('Receipt', template);
        return { ...compileOpenUI(openui), openui, preview: template };
      }
      let document: unknown;
      let bookingTimeZone: string | undefined;
      let bookingInput: BookingInput | undefined;
      if (format === 'booking') {
        bookingInput = bookingArguments.parse(input);
        const { booking, ...message } = bookingInput;
        const { date, time, timeZone, durationMinutes, utcOffset, ...details } = booking;
        const startAt = bookingInstant(date, time, timeZone, utcOffset);
        bookingTimeZone = timeZone;
        const endAt = durationMinutes ? new Date(Date.parse(startAt) + durationMinutes * 60_000).toISOString() : undefined;
        const when = new Intl.DateTimeFormat('en-GB', { timeZone, year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZoneName: 'short' });
        const body = endAt ? when.formatRange(new Date(startAt), new Date(endAt)) : when.format(new Date(startAt));
        document = { ...message, body, type: 'booking', booking: { ...details, startAt, ...(endAt ? { endAt } : {}) } };
      } else document = { ...schema.parse(input), type: format };
      const content = InteractiveContentSchema.parse(document);
      const preview: ActionPreview = { footer: content.footer };
      if ('title' in content) preview.title = content.title;
      if (content.type === 'buttons') preview.options = content.actions.map(action => action.label);
      if (content.type === 'list') preview.options = content.sections.flatMap(section => section.rows.map(row => row.title));
      if (content.type === 'form') preview.options = content.questions.map(question => question.label);
      const displayDate = (value: string) => new Intl.DateTimeFormat('en-GB', { timeZone: bookingTimeZone, dateStyle: 'long', timeStyle: 'short' }).format(new Date(value));
      if (content.type === 'booking') preview.fields = [
        { label: 'Starts', value: displayDate(content.booking.startAt) },
        ...(content.booking.endAt ? [{ label: 'Ends', value: displayDate(content.booking.endAt) }] : []),
        ...(content.booking.location ? [{ label: 'Location', value: content.booking.location }] : []),
        ...(content.booking.description ? [{ label: 'Details', value: content.booking.description }] : []),
      ];
      const { type, version: _version, ...props } = content;
      const name = { buttons: 'ReplyButtons', list: 'ChoiceList', form: 'Form', booking: 'BookingCard' }[type] as 'ReplyButtons' | 'ChoiceList' | 'Form' | 'BookingCard';
      const openui = createOpenUIMessage(name, { ...props, ...(bookingTimeZone ? { timeZone: bookingTimeZone } : {}) });
      return { ...compileOpenUI(openui, [name]), openui, preview, bookingInput };
    },
  };
}

/** Only interpret replies to our own previously submitted interactive message. */
export const selectionText = openUIResponseText;
/** The input is the validated summary returned by selectionText. */
export function selectionAcknowledgement(text: string): string {
  if (text.startsWith('Form response:\n')) {
    return `Thanks, I've noted your answers here. ${text.slice('Form response:\n'.length).split('\n').join('. ')}.`;
  }
  const prefix = text.startsWith('Selected button: ') ? 'Selected button: ' : 'Selected option: ';
  return `Thanks, I've noted your choice here: ${text.slice(prefix.length)}.`;
}
/** Render observed tool facts; Jev still decides whether this answers the turn. */
export function actionResultAcknowledgement(results: unknown[]): string | undefined {
  const observations = results.filter((result): result is { status: string; format?: ActionFormat } => Boolean(result && typeof result === 'object' && 'status' in result));
  const last = observations.at(-1);
  if (!last || !['submitted', 'already_submitted', 'unknown'].includes(last.status)) return;
  const formats = [...new Set(observations.filter(result => ['submitted', 'already_submitted'].includes(result.status) && result.format).map(result => formatLabels[result.format!].toLowerCase()))];
  const sent = formats.length ? `I've sent the ${formats.join(' and ')} in this chat.` : '';
  return last.status === 'unknown' ? `${sent}${sent ? ' ' : ''}I couldn't confirm the latest message submission. Please check your chat before asking me to send it again.` : sent || 'The message has been submitted to this chat.';
}
export function bookingCorrectionAcknowledgement(text: string, location: string | undefined, removal: 'removed' | 'failed' | 'unknown'): string {
  return `I've sent the corrected booking card for ${text}${location ? ` at ${location}` : ''}. ${removal === 'removed' ? 'The old card was removed.' : removal === 'failed' ? "The old card couldn't be removed, so it is still visible." : "I couldn't confirm removal of the old card, so it may still be visible."}`;
}
export const selectionInstructions = 'The latest input is a verified reply to a message already sent in this conversation. Acknowledge the selected labels or form answers briefly and naturally. Do not ask for booking details merely to acknowledge a choice, or resend the original buttons or form. A selection records the person\'s preference in this conversation only. Do not promise to confirm, reschedule, cancel or save a booking in an external system. If the choice concerns changing a booking, make clear that the choice was received and the booking itself has not been changed. Send another chat message only if the person explicitly requested one in their reply.';

const formatRules: Record<ActionFormat, string> = {
  none: 'This turn needs only a conversational response; no chat action is available.',
  clarify: 'Ask one brief question to clarify what they want in their chat. No send tool is available yet.',
  text: 'Write the requested content in text. The recipient is already selected.',
  template: 'Compose a title and labelled fields from the agreed details. No appointment date, name or email is required unless needed for the requested content.',
  buttons: 'Compose a brief body and the requested reply, URL, call or copy buttons. For reply buttons, create stable IDs. No booking date, name or email is required.',
  list: 'Compose a brief body and group the known choices into sections. Create stable row IDs. No booking details are required.',
  form: 'Compose a non-empty introductory body, such as Choose your preferences, and the requested questions and choices. Create stable question and option IDs. Questions about reminders or appointments do not require a booking date, name or email to send this form.',
  booking: 'Send a card displaying the agreed details. Reply choices are a separate buttons action; do not embed actions in the booking card. The local date, time, IANA timezone and at least one destination (location, booking URL or phone number) are required by WhatsApp. Supply date, time and timeZone directly; the plugin calculates timestamps, daylight saving and the displayed date/time. Do not supply a body. Include durationMinutes if known. Do not ask for a name, email, reference or booking-system confirmation. Omit optional fields when unknown. Sending the card does not create a reservation.',
  'correct-booking': 'Correct the latest card using only the facts the person changes. For example, "No, I said 2 pm" changes time to 14:00 and keeps the date, timezone, duration and location. The plugin merges these facts and sends a corrected card before removing the old card. Report the actual replacement and removal results; if removal fails or is unknown, say the old card may still be visible. This does not change a reservation in a booking system.',
};
export function actionContext(format: ActionFormat, referenceInstant: number, timeZone?: string) {
  return `Jev selected ${format}. Turn reference instant: ${new Date(referenceInstant).toISOString()}. Agreed timezone: ${timeZone ?? 'not specified'}. ${formatRules[format]}`;
}
export const actionInstructions = `Fulfil the actual user request directly, including simply remembering information in this conversation. Do not turn a complete conversational request into a request for a new chat card or choices. Ask only for information needed to fulfil the actual request. Jev chooses the chat action format. Use only the supplied tool and schema for the current person. Their request to send is enough: when required facts are known, call the tool now without asking them to confirm those facts again. Ask only for missing facts required by that format. Compose message bodies, titles and labels naturally from the request; these are wording, not missing business facts. Omit unknown optional fields rather than filling them with empty strings. The available tool sends chat messages only. It cannot create, confirm, reschedule, cancel or save a reservation in an external booking system. Do not promise to perform those operations, even in the future. Use user statements and accepted tool results as facts. Rejected tool arguments and unsent drafts are not facts: do not preserve their unsupported details when repairing them. Never invent dates, times, contact details, URLs, references, availability, payment status or completed reservations. A button or form response records a conversational choice, not an external transaction. Never claim a message was sent before the tool returns status submitted or already_submitted. Submitted means WhatsApp accepted the message, not that it was delivered or read. If status is unknown, say you could not confirm the send, ask them to check their chat, and do not retry automatically. Correct invalid_arguments using the supplied field errors; ask the person only if a required fact is actually missing. When a later accepted result completes an earlier failed attempt, report the latest outcome instead of repeating the old failure. Explain failures honestly. Write short, plain sentences without Markdown formatting; the channel adapter decides whether to speak or send the response. Do not read IDs, tool arguments or classifier metadata aloud.`;

export function invalidActionArguments(error: unknown) {
  return { status: 'invalid_arguments', reason: 'Correct the tool arguments using these field errors, then call the tool again. Compose missing message wording from the request; ask only for missing required business facts. The recipient and format are already selected.', fields: error instanceof z.ZodError ? error.issues.map(issue => ({ path: issue.path.join('.'), message: issue.message })) : [{ path: '', message: 'Provide a valid JSON object matching the selected tool schema.' }] };
}
