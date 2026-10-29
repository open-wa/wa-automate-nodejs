import { z } from 'zod';
import {
  createLibrary,
  createParser,
  defineComponent,
  jsonToOpenUI,
  type ElementNode,
} from '@openuidev/lang-core';
import {
  BookingContentSchema,
  ButtonsContentSchema,
  FormContentSchema,
  ListContentSchema,
  InteractiveContentSchema,
  type InteractiveContent,
  type DecodedInteractiveContent,
  type InteractiveResponse,
} from '@open-wa/schema/interactive';
import type { PluginRuntime } from './types';

const text = z.string().trim().min(1);
export const TextMessageProps = z.object({ text: text.max(4096) }).strict();
export const ReceiptProps = z
  .object({
    title: text.max(120),
    fields: z
      .array(z.object({ label: text.max(80), value: text.max(1000) }).strict())
      .min(1)
      .max(20),
    footer: z.string().max(500).optional(),
  })
  .strict();
export const BookingCardProps = BookingContentSchema.omit({
  type: true,
  version: true,
}).extend({
  timeZone: z
    .string()
    .refine((value) => {
      try {
        new Intl.DateTimeFormat('en', { timeZone: value });
        return true;
      } catch {
        return false;
      }
    }, 'Use an IANA timezone')
    .optional(),
});
export const ReplyButtonsProps = ButtonsContentSchema.omit({
  type: true,
  version: true,
  header: true,
});
export const ChoiceListProps = ListContentSchema.omit({
  type: true,
  version: true,
});
export const FormProps = FormContentSchema.omit({ type: true, version: true });
const componentSchemas = {
  TextMessage: TextMessageProps,
  Receipt: ReceiptProps,
  BookingCard: BookingCardProps,
  ReplyButtons: ReplyButtonsProps,
  ChoiceList: ChoiceListProps,
  Form: FormProps,
};
const component = <T extends z.ZodObject>(
  name: string,
  props: T,
  description: string,
) => defineComponent({ name, props, description, component: null });
const TextMessage = component(
  'TextMessage',
  TextMessageProps,
  'Send plain text to the current person.',
);
const Receipt = component(
  'Receipt',
  ReceiptProps,
  'Display known confirmation details as labelled fields. This does not charge or create a reservation.',
);
const BookingCard = component(
  'BookingCard',
  BookingCardProps,
  'Display an appointment with ISO start/end timestamps, location and optional booking links.',
);
const ReplyButtons = component(
  'ReplyButtons',
  ReplyButtonsProps,
  'A message with reply choices or URL, call and copy actions. Never mix reply and external actions.',
);
const ChoiceList = component(
  'ChoiceList',
  ChoiceListProps,
  'A sectioned list of choices with stable row IDs.',
);
const Form = component(
  'Form',
  FormProps,
  'Single or multiple choice questions with stable question and option IDs.',
);
const Message = component(
  'Message',
  z
    .object({
      content: z.union([
        TextMessage.ref,
        Receipt.ref,
        BookingCard.ref,
        ReplyButtons.ref,
        ChoiceList.ref,
        Form.ref,
      ]),
    })
    .strict(),
  'One message to the current person.',
);

/** The same catalogue supplies agent prompts, server validation and Neo's renderers. */
export const openwaLibrary = createLibrary({
  id: 'open-wa',
  root: 'Message',
  components: [
    Message,
    TextMessage,
    Receipt,
    BookingCard,
    ReplyButtons,
    ChoiceList,
    Form,
  ],
});
export const openUIComponents = [
  'TextMessage',
  'Receipt',
  'BookingCard',
  'ReplyButtons',
  'ChoiceList',
  'Form',
] as const;
export type OpenUIComponent = (typeof openUIComponents)[number];
export const OpenUISelectionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('reply'), id: text }).strict(),
  z.object({ type: z.literal('list'), id: text }).strict(),
  z
    .object({
      type: z.literal('form'),
      answers: z.record(z.string(), z.union([text, z.array(text).min(1)])),
    })
    .strict(),
]);
export type OpenUISelection = z.infer<typeof OpenUISelectionSchema>;
export type CompiledOpenUI = {
  component: OpenUIComponent;
  source: string;
  props: Record<string, unknown>;
  method: 'sendText' | 'sendInteractive';
  value: string | DecodedInteractiveContent;
  text: string;
  interactive?: DecodedInteractiveContent;
};
const parser = createParser(openwaLibrary.toJSONSchema(), openwaLibrary.root);
const plain = (value: string) => value.replace(/[*_~`\r\n]/g, ' ').trim();

export function openUIPrompt(
  allowed: readonly OpenUIComponent[] = openUIComponents,
): string {
  const selected = new Set(allowed);
  if (
    !selected.size ||
    [...selected].some((name) => !openUIComponents.includes(name))
  )
    throw new Error('Choose at least one OpenWA component.');
  const library =
    selected.size === openUIComponents.length
      ? openwaLibrary
      : openwaLibrary.extend({
          components: {
            remove: openUIComponents.filter((name) => !selected.has(name)),
          },
        });
  return library.prompt({
    toolCalls: false,
    bindings: false,
    builtinFunctions: false,
    additionalRules: [
      'Return exactly one Message containing one allowed component. Use only literal data and component references.',
      'The host supplies the recipient. Do not include recipients, tools, queries, mutations, state variables or executable actions.',
      'Use known facts only. A card displays details; it does not create a booking, take payment or execute a transaction.',
    ],
  });
}

/** Accept complete, static messages only; partial streaming UI must never cause a send. */
export function compileOpenUI(
  source: string,
  allowed: readonly OpenUIComponent[] = openUIComponents,
): CompiledOpenUI {
  if (typeof source !== 'string' || !source.trim() || source.length > 64_000)
    throw new Error(
      'OpenUI messages must contain between 1 and 64000 characters.',
    );
  const result = parser.parse(source);
  if (
    result.meta.incomplete ||
    result.meta.errors.length ||
    result.meta.unresolved.length ||
    result.meta.orphaned.length ||
    result.rootExpression ||
    result.queryStatements.length ||
    result.mutationStatements.length ||
    Object.keys(result.stateDeclarations).length
  ) {
    throw new Error(
      result.meta.errors.map((error) => error.message).join('; ') ||
        'Use a complete static OpenWA message without queries, mutations, state or unused statements.',
    );
  }
  if (!result.root || result.root.typeName !== 'Message' || result.root.partial)
    throw new Error('The root must be Message(content).');
  const node = result.root.props.content as ElementNode | undefined;
  if (
    !node ||
    node.type !== 'element' ||
    node.partial ||
    !openUIComponents.includes(node.typeName as OpenUIComponent) ||
    !allowed.includes(node.typeName as OpenUIComponent)
  )
    throw new Error('This OpenUI component is not available for this action.');
  const name = node.typeName as OpenUIComponent;
  // Revalidate with Zod: OpenUI's renderer intentionally tolerates imperfect output.
  const schema: z.ZodObject<Record<string, z.ZodType>> = componentSchemas[name];
  // Positional arguments use null to skip optional slots before a later prop.
  const literalProps = Object.fromEntries(
    Object.entries(node.props).filter(
      ([key, value]) => !(value === null && schema.shape[key]?.isOptional()),
    ),
  );
  const props = schema.parse(literalProps) as Record<string, unknown>;
  const canonical = sourceFor(name, props);
  if (name === 'TextMessage') {
    const { text } = TextMessageProps.parse(props);
    return {
      component: name,
      source: canonical,
      props,
      method: 'sendText',
      value: text,
      text,
    };
  }
  if (name === 'Receipt') {
    const receipt = ReceiptProps.parse(props);
    const value = [
      `*${plain(receipt.title)}*`,
      ...receipt.fields.map(
        (field) => `*${plain(field.label)}:* ${plain(field.value)}`,
      ),
      ...(receipt.footer ? ['', plain(receipt.footer)] : []),
    ].join('\n');
    TextMessageProps.parse({ text: value });
    return {
      component: name,
      source: canonical,
      props,
      method: 'sendText',
      value,
      text: value,
    };
  }
  const { timeZone: _timeZone, ...content } = props;
  const type = {
    BookingCard: 'booking',
    ReplyButtons: 'buttons',
    ChoiceList: 'list',
    Form: 'form',
  }[name];
  const value = InteractiveContentSchema.parse({ ...content, type });
  return {
    component: name,
    source: canonical,
    props,
    method: 'sendInteractive',
    value,
    text: value.body,
    interactive: value,
  };
}

function sourceFor(
  name: OpenUIComponent,
  props: Record<string, unknown>,
): string {
  const node: ElementNode = {
    type: 'element',
    typeName: name,
    props,
    partial: false,
  };
  return jsonToOpenUI(
    {
      type: 'element',
      typeName: 'Message',
      props: { content: node },
      partial: false,
    },
    openwaLibrary,
  );
}

/** Convert validated tool arguments or a message builder into a portable OpenUI document. */
export function createOpenUIMessage(
  name: OpenUIComponent,
  props: unknown,
): string {
  if (!openUIComponents.includes(name))
    throw new Error('Unknown OpenWA component.');
  const parsed = componentSchemas[name].parse(props) as Record<string, unknown>;
  return compileOpenUI(sourceFor(name, parsed), [name]).source;
}

/** Uses the existing public methods and host license checks; never retries a send. */
export async function sendOpenUI(
  runtime: PluginRuntime,
  to: string,
  source: string,
  allowed?: readonly OpenUIComponent[],
): Promise<string> {
  if (!/^[0-9]+@(?:c\.us|lid)$/.test(to))
    throw new Error('Choose an individual WhatsApp chat.');
  const message = compileOpenUI(source, allowed);
  const id = await runtime.invoke(message.method, [to, message.value]);
  if (typeof id !== 'string' || !id)
    throw new Error(
      'WhatsApp did not confirm message submission. Check the chat before sending again.',
    );
  return id;
}

/** Call only after correlating the response to this person's own sent message. */
export function openUIResponseText(
  content: InteractiveContent,
  response: Pick<InteractiveResponse, 'type'> & {
    id?: string;
    answers?: Record<string, string | string[]>;
  },
): string | undefined {
  if (content.type === 'buttons' && response.type === 'reply') {
    const item = content.actions.find(
      (action) => action.type === 'reply' && action.id === response.id,
    );
    return item ? `Selected button: ${item.label}` : undefined;
  }
  if (content.type === 'list' && response.type === 'list') {
    const item = content.sections
      .flatMap((section) => section.rows)
      .find((row) => row.id === response.id);
    return item ? `Selected option: ${item.title}` : undefined;
  }
  if (content.type !== 'form' || response.type !== 'form' || !response.answers)
    return;
  const fields: string[] = [];
  for (const [id, value] of Object.entries(response.answers)) {
    const question = content.questions.find((question) => question.id === id);
    if (!question) return;
    const values = Array.isArray(value) ? value : [value];
    if (
      !values.length ||
      new Set(values).size !== values.length ||
      (question.type === 'singleSelect' && values.length !== 1)
    )
      return;
    const labels = values.map(
      (id) =>
        question.options.find((option) => option.id === id)?.label ??
        (question.allowCustomAnswer ? id : undefined),
    );
    if (labels.some((label) => !label)) return;
    fields.push(`${question.label}: ${labels.join(', ')}`);
  }
  return fields.length
    ? `Form response:\n${fields.join('\n')}`.slice(0, 4000)
    : undefined;
}
