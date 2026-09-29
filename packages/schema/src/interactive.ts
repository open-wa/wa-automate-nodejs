import { z } from 'zod';

/** A portable JSON document shared by the SDK, HTTP API and message builders. */
export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };
export const JsonValueSchema: z.ZodType<JsonValue> = z.lazy(() => z.union([
  z.null(), z.boolean(), z.number().finite(), z.string(),
  z.array(JsonValueSchema), z.record(z.string(), JsonValueSchema),
]));
export const JsonObjectSchema = z.record(z.string(), JsonValueSchema);
const text = z.string().min(1);
const url = z.url().refine(value => /^https?:\/\//i.test(value), 'Use an HTTP or HTTPS URL');
const id = text.describe('Stable application-defined ID returned when the recipient chooses this item');

export const ReplyActionSchema = z.object({ type: z.literal('reply'), id, label: text }).strict();
export const LinkActionSchema = z.object({ type: z.literal('url'), label: text, url }).strict();
export const CallActionSchema = z.object({ type: z.literal('call'), label: text, phoneNumber: text }).strict();
export const CopyActionSchema = z.object({ type: z.literal('copy'), label: text, code: text }).strict();
export const InteractiveActionSchema = z.discriminatedUnion('type', [
  ReplyActionSchema, LinkActionSchema, CallActionSchema, CopyActionSchema,
]);
export const NativeActionSchema = z.object({
  name: text.describe('WhatsApp native action name; availability depends on the recipient and account'),
  parameters: JsonObjectSchema.optional(),
}).strict();
const actions = z.array(InteractiveActionSchema).min(1).superRefine((items, ctx) => {
  const replies = items.filter(item => item.type === 'reply');
  if (replies.length && replies.length !== items.length) {
    ctx.addIssue({ code: 'custom', message: 'Reply actions cannot be mixed with URL, call or copy actions' });
  }
  const ids = new Set<string>();
  items.forEach((item, index) => {
    if (item.type !== 'reply') return;
    if (ids.has(item.id)) ctx.addIssue({ code: 'custom', path: [index, 'id'], message: 'Duplicate reply ID' });
    ids.add(item.id);
  });
});

const media = {
  source: text.describe('HTTP(S) URL, local file path or base64 data URL; resolved by the client before sending'),
  filename: text.optional(),
  title: z.string().optional(),
};
export const InteractiveHeaderSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('text'), text }).strict(),
  z.object({ type: z.literal('image'), ...media }).strict(),
  z.object({ type: z.literal('video'), ...media }).strict(),
  z.object({ type: z.literal('document'), ...media }).strict(),
]);
const base = {
  version: z.literal(1).optional().describe('Document format version, defaults to 1; independent of WhatsApp protocol versions'),
  body: text,
  footer: z.string().optional(),
};
export const ButtonsContentSchema = z.object({
  ...base, type: z.literal('buttons'), header: InteractiveHeaderSchema.optional(), actions,
}).strict();
export const ListRowSchema = z.object({ id, title: text, description: z.string().optional() }).strict();
export const ListContentSchema = z.object({
  ...base, type: z.literal('list'), title: z.string().optional(), buttonLabel: text.default('Choose an option'),
  sections: z.array(z.object({ title: z.string().optional(), rows: z.array(ListRowSchema).min(1) }).strict()).min(1),
}).strict();
export const FormQuestionSchema = z.object({
  type: z.enum(['singleSelect', 'multiSelect']), id, label: text,
  options: z.array(z.object({ id, label: text }).strict()).min(1),
  allowCustomAnswer: z.boolean().optional(),
}).strict();
export const FormContentSchema = z.object({
  ...base, type: z.literal('form'), title: z.string().optional(), questions: z.array(FormQuestionSchema).min(1),
}).strict();
export const CarouselCardSchema = z.object({
  body: text,
  header: z.object({ type: z.literal('image'), ...media }).strict(),
  actions,
}).strict();
export const CarouselContentSchema = z.object({
  ...base, type: z.literal('carousel'), cards: z.array(CarouselCardSchema).min(1),
}).strict();
export const BookingContentSchema = z.object({
  ...base, type: z.literal('booking'), title: z.string().optional(), buttonLabel: text.default('View booking'),
  booking: z.object({
    startAt: z.iso.datetime({ offset: true }), endAt: z.iso.datetime({ offset: true }).optional(),
    location: z.string().optional(), url: url.optional(), managementUrl: url.optional(),
    phoneNumber: z.string().optional(), email: z.email().optional(), description: z.string().optional(),
    labels: z.object({
      language: z.string().optional(), meetingType: z.string().optional(), detailsTitle: z.string().optional(),
      addToCalendar: z.string().optional(), viewOnMap: z.string().optional(), manageBooking: z.string().optional(),
    }).strict().optional(),
  }).strict(),
  actions: z.array(z.discriminatedUnion('type', [LinkActionSchema, CallActionSchema, CopyActionSchema])).optional(),
}).strict();
export const NativeContentSchema = z.object({
  ...base, type: z.literal('native'), header: InteractiveHeaderSchema.optional(),
  actions: z.array(NativeActionSchema).min(1), parameters: JsonObjectSchema.optional(),
}).strict().describe('Advanced extension for new native action types; parameters are passed through without claiming recipient support');

export const InteractiveContentSchema = z.discriminatedUnion('type', [
  ButtonsContentSchema, ListContentSchema, FormContentSchema, CarouselContentSchema, BookingContentSchema, NativeContentSchema,
]).superRefine((content, ctx) => {
  const unique = (items: { id: string }[], path: (string | number)[]) => {
    const seen = new Set<string>();
    items.forEach((item, index) => {
      if (seen.has(item.id)) ctx.addIssue({ code: 'custom', path: [...path, index, 'id'], message: 'IDs must be unique' });
      seen.add(item.id);
    });
  };
  if (content.type === 'form') {
    unique(content.questions, ['questions']);
    content.questions.forEach((q, index) => {
      unique(q.options, ['questions', index, 'options']);
      if (q.id === '__openwa_form__') ctx.addIssue({ code: 'custom', path: ['questions', index, 'id'], message: 'This question ID is reserved' });
    });
  }
  if (content.type === 'list') {
    const seen = new Set<string>();
    content.sections.forEach((section, s) => section.rows.forEach((row, r) => {
      if (seen.has(row.id)) ctx.addIssue({ code: 'custom', path: ['sections', s, 'rows', r, 'id'], message: 'Row IDs must be unique across sections' });
      seen.add(row.id);
    }));
  }
  if (content.type === 'booking' && content.booking.endAt && Date.parse(content.booking.endAt) <= Date.parse(content.booking.startAt)) {
    ctx.addIssue({ code: 'custom', path: ['booking', 'endAt'], message: 'Booking end must be after its start' });
  }
});

export type InteractiveContent = z.input<typeof InteractiveContentSchema>;
export type InteractiveAction = z.infer<typeof InteractiveActionSchema>;
export type InteractiveHeader = z.infer<typeof InteractiveHeaderSchema>;
export type FormQuestion = z.infer<typeof FormQuestionSchema>;
/** Validate a JSON document without sending it or loading media; suitable for UI builders. */
export function defineInteractiveMessage<T extends InteractiveContent>(content: T): Extract<z.output<typeof InteractiveContentSchema>, { type: T['type'] }> {
  return InteractiveContentSchema.parse(content) as Extract<z.output<typeof InteractiveContentSchema>, { type: T['type'] }>;
}

const responseBase = {
  messageId: text, chatId: text, senderId: text,
  originalMessageId: z.string().optional().describe('Original WhatsApp stanza ID; may not be a full serialized message key'),
  timestamp: z.number().optional(),
  raw: JsonObjectSchema,
};
export const FormResponseSchema = z.object({
  ...responseBase, type: z.literal('form'),
  answers: z.record(z.string(), z.union([z.string(), z.array(z.string())])),
});
export const InteractiveResponseSchema = z.discriminatedUnion('type', [
  FormResponseSchema,
  z.object({ ...responseBase, type: z.literal('reply'), id: text, label: z.string().optional() }),
  z.object({ ...responseBase, type: z.literal('list'), id: text, label: z.string().optional() }),
  z.object({ ...responseBase, type: z.literal('native'), name: text, parameters: JsonValueSchema.optional(), parseError: z.string().optional() }),
]);
export type FormResponse = z.infer<typeof FormResponseSchema>;
export type InteractiveResponse = z.infer<typeof InteractiveResponseSchema>;
