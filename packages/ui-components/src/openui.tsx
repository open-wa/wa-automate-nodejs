import * as React from 'react';
import {
  createLibrary,
  Renderer,
  useTriggerAction,
  type ComponentRenderProps,
} from '@openuidev/react-lang';
import {
  compileOpenUI,
  createOpenUIMessage,
  openwaLibrary,
  openUIResponseText,
  OpenUISelectionSchema,
  type OpenUIComponent,
  type OpenUISelection,
} from '@open-wa/plugin-sdk/openui';
import type { InteractiveAction } from '@open-wa/schema/interactive';
import type { z } from 'zod';
import type {
  BookingCardProps,
  ChoiceListProps,
  FormProps,
  ReceiptProps,
  ReplyButtonsProps,
  TextMessageProps,
} from '@open-wa/plugin-sdk/openui';
import { Button } from './components/ui/button';

export type { OpenUISelection } from '@open-wa/plugin-sdk/openui';
const PreviewContext = React.createContext(true);
const Frame = ({
  title,
  body,
  footer,
  children,
}: {
  title?: string;
  body?: string;
  footer?: string;
  children?: React.ReactNode;
}) => (
  <article className="space-y-3 rounded-xl border border-border bg-background p-4 text-sm text-foreground">
    {title && <h3 className="font-semibold">{title}</h3>}
    {body && <p className="whitespace-pre-wrap break-words">{body}</p>}
    {children}
    {footer && <p className="text-xs text-muted-foreground">{footer}</p>}
  </article>
);
function Fields({ values }: { values: { label: string; value?: string }[] }) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
      {values
        .filter((field) => field.value)
        .map((field) => (
          <React.Fragment key={field.label}>
            <dt className="font-medium">{field.label}</dt>
            <dd className="m-0 whitespace-pre-wrap break-words">
              {field.value}
            </dd>
          </React.Fragment>
        ))}
    </dl>
  );
}
function TextMessage({
  props,
}: ComponentRenderProps<z.infer<typeof TextMessageProps>>) {
  return <p className="whitespace-pre-wrap break-words">{props.text}</p>;
}
function Receipt({
  props,
}: ComponentRenderProps<z.infer<typeof ReceiptProps>>) {
  return (
    <Frame title={props.title} footer={props.footer}>
      <Fields values={props.fields} />
    </Frame>
  );
}
function BookingCard({
  props,
}: ComponentRenderProps<z.infer<typeof BookingCardProps>>) {
  const { booking } = props;
  const format = new Intl.DateTimeFormat(undefined, {
    timeZone: props.timeZone,
    dateStyle: 'long',
    timeStyle: 'short',
  });
  return (
    <Frame title={props.title || 'Booking details'} footer={props.footer}>
      <Fields
        values={[
          { label: 'Starts', value: format.format(new Date(booking.startAt)) },
          {
            label: 'Ends',
            value: booking.endAt && format.format(new Date(booking.endAt)),
          },
          {
            label: 'Time zone',
            value: props.timeZone || format.resolvedOptions().timeZone,
          },
          { label: 'Location', value: booking.location },
          { label: 'Details', value: booking.description },
          { label: 'Phone', value: booking.phoneNumber },
          { label: 'Email', value: booking.email },
        ]}
      />
      <p className="whitespace-pre-wrap">{props.body}</p>
      {(booking.url || booking.managementUrl) && (
        <div className="flex flex-wrap gap-3">
          {booking.url && (
            <a
              className="underline"
              href={booking.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              View booking
            </a>
          )}
          {booking.managementUrl && (
            <a
              className="underline"
              href={booking.managementUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Manage booking
            </a>
          )}
        </div>
      )}
    </Frame>
  );
}
function ActionButtons({ actions }: { actions: InteractiveAction[] }) {
  const readOnly = React.useContext(PreviewContext);
  const trigger = useTriggerAction();
  const [error, setError] = React.useState('');
  const click = async (action: InteractiveAction) => {
    try {
      setError('');
      if (action.type === 'reply')
        await trigger(`Selected button: ${action.label}`, undefined, {
          type: 'reply',
          params: { id: action.id },
        });
      else if (action.type === 'copy')
        await navigator.clipboard.writeText(action.code);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'The action could not complete.',
      );
    }
  };
  return (
    <>
      <div className="flex flex-wrap gap-2">
        {actions.map((action, index) =>
          action.type === 'url' ? (
            <a
              key={index}
              className="rounded-md border border-border px-3 py-2 underline"
              href={action.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {action.label}
            </a>
          ) : action.type === 'call' ? (
            <a
              key={index}
              className="rounded-md border border-border px-3 py-2 underline"
              href={`tel:${encodeURIComponent(action.phoneNumber)}`}
            >
              {action.label}
            </a>
          ) : (
            <Button
              key={index}
              size="sm"
              variant="outline"
              disabled={readOnly && action.type === 'reply'}
              onClick={() => void click(action)}
            >
              {action.label}
            </Button>
          ),
        )}
      </div>
      {error && <p role="alert">{error}</p>}
    </>
  );
}
function ReplyButtons({
  props,
}: ComponentRenderProps<z.infer<typeof ReplyButtonsProps>>) {
  return (
    <Frame body={props.body} footer={props.footer}>
      <ActionButtons actions={props.actions} />
    </Frame>
  );
}
function ChoiceList({
  props,
}: ComponentRenderProps<z.infer<typeof ChoiceListProps>>) {
  const readOnly = React.useContext(PreviewContext),
    trigger = useTriggerAction();
  return (
    <Frame title={props.title} body={props.body} footer={props.footer}>
      {props.sections.map((section, index) => (
        <section className="space-y-2" key={index}>
          {section.title && <h4 className="font-medium">{section.title}</h4>}
          {section.rows.map((row) => (
            <Button
              key={row.id}
              variant="outline"
              className="h-auto w-full justify-start whitespace-normal text-left"
              disabled={readOnly}
              onClick={() =>
                void trigger(`Selected option: ${row.title}`, undefined, {
                  type: 'list',
                  params: { id: row.id },
                })
              }
            >
              <span>
                {row.title}
                {row.description && (
                  <span className="block font-normal">{row.description}</span>
                )}
              </span>
            </Button>
          ))}
        </section>
      ))}
    </Frame>
  );
}
function Form({ props }: ComponentRenderProps<z.infer<typeof FormProps>>) {
  const readOnly = React.useContext(PreviewContext),
    trigger = useTriggerAction(),
    name = React.useId();
  const [error, setError] = React.useState(''),
    [busy, setBusy] = React.useState(false);
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy || readOnly) return;
    const data = new FormData(event.currentTarget);
    const answers = Object.fromEntries(
      props.questions.flatMap((question, index) => {
        const values = data.getAll(`question-${index}`).map(String);
        const custom = String(data.get(`custom-${index}`) || '').trim();
        if (custom) {
          if (question.type === 'singleSelect')
            values.splice(0, values.length, custom);
          else values.push(custom);
        }
        return values.length
          ? [
              [
                question.id,
                question.type === 'singleSelect' ? values[0] : values,
              ],
            ]
          : [];
      }),
    );
    setBusy(true);
    setError('');
    try {
      await trigger('Submitted form', undefined, {
        type: 'form',
        params: { answers },
      });
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'The answers could not be submitted.',
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <Frame title={props.title} body={props.body} footer={props.footer}>
      <form onSubmit={(event) => void submit(event)} className="space-y-4">
        <fieldset disabled={readOnly || busy} className="space-y-4">
          {props.questions.map((question, index) => (
            <fieldset className="space-y-2" key={question.id}>
              <legend className="mb-2 font-medium">{question.label}</legend>
              {question.options.map((option, optionIndex) => (
                <label key={option.id} className="flex items-center gap-2">
                  <input
                    type={
                      question.type === 'singleSelect' ? 'radio' : 'checkbox'
                    }
                    name={`question-${index}`}
                    value={option.id}
                    id={`${name}-${index}-${optionIndex}`}
                  />
                  {option.label}
                </label>
              ))}
              {question.allowCustomAnswer && (
                <label className="block space-y-1">
                  Other answer
                  <input
                    className="block w-full rounded border border-border bg-background p-2"
                    name={`custom-${index}`}
                  />
                </label>
              )}
            </fieldset>
          ))}
          <Button type="submit" size="sm">
            {busy ? 'Submitting…' : 'Submit answers'}
          </Button>
        </fieldset>
        {error && <p role="alert">{error}</p>}
      </form>
    </Frame>
  );
}
const renderers = {
  TextMessage,
  Receipt,
  BookingCard,
  ReplyButtons,
  ChoiceList,
  Form,
  Message: ({
    props,
    renderNode,
  }: ComponentRenderProps<{ content: unknown }>) => (
    <>{renderNode(props.content)}</>
  ),
};
export const openwaReactLibrary = createLibrary({
  root: 'Message',
  id: 'open-wa',
  components: Object.values(openwaLibrary.components).map((definition) => ({
    ...definition,
    component: renderers[definition.name as keyof typeof renderers],
  })),
});

/** Neo uses read-only recipient previews; interactive callers bind their own action handler. */
export function OpenUIMessage({
  source,
  allowed,
  onAction,
}: {
  source: string;
  allowed?: readonly OpenUIComponent[];
  onAction?: (selection: OpenUISelection) => void | Promise<void>;
}) {
  const result = React.useMemo(() => {
    try {
      return { message: compileOpenUI(source, allowed) };
    } catch (error) {
      return {
        error:
          error instanceof Error
            ? error.message
            : 'The message could not be displayed.',
      };
    }
  }, [source, allowed]);
  const [error, setError] = React.useState('');
  if (!result.message) return <p role="alert">{result.error}</p>;
  const message = result.message;
  const handle = async (event: {
    type: string;
    params: Record<string, unknown>;
  }) => {
    if (!onAction || !message.interactive) return;
    try {
      setError('');
      const selection = OpenUISelectionSchema.parse({
        ...event.params,
        type: event.type,
      });
      if (!openUIResponseText(message.interactive, selection))
        throw new Error('Choose a valid reply from this message.');
      await onAction(selection);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'The response could not complete.',
      );
    }
  };
  return (
    <PreviewContext value={!onAction}>
      <div
        className="min-w-0 space-y-2"
        data-openwa-component={message.component}
      >
        <Renderer
          response={message.source}
          library={openwaReactLibrary}
          isStreaming={false}
          onAction={handle}
        />
        {!onAction &&
          ['ReplyButtons', 'ChoiceList', 'Form'].includes(
            message.component,
          ) && (
            <p className="text-xs text-muted-foreground">
              Replies are made in WhatsApp.
            </p>
          )}
        {error && <p role="alert">{error}</p>}
      </div>
    </PreviewContext>
  );
}

const samples = {
  Booking: createOpenUIMessage('BookingCard', {
    title: 'Demo appointment',
    body: 'Your appointment details',
    timeZone: 'Europe/London',
    booking: {
      startAt: '2026-10-26T14:00:00.000Z',
      endAt: '2026-10-26T14:30:00.000Z',
      location: 'OpenWA office',
    },
  }),
  Buttons: createOpenUIMessage('ReplyButtons', {
    body: 'Would you like directions?',
    actions: [
      { type: 'reply', id: 'yes', label: 'Yes please' },
      { type: 'reply', id: 'no', label: 'No thanks' },
    ],
  }),
  List: createOpenUIMessage('ChoiceList', {
    body: 'Choose a service.',
    sections: [
      {
        title: 'Appointments',
        rows: [
          { id: 'demo', title: 'Product demo' },
          { id: 'support', title: 'Support session' },
        ],
      },
    ],
  }),
  Form: createOpenUIMessage('Form', {
    title: 'Your preferences',
    body: 'Choose your reminder and refreshments.',
    questions: [
      {
        type: 'singleSelect',
        id: 'reminder',
        label: 'When should we remind you?',
        options: [
          { id: 'day', label: 'One day before' },
          { id: 'hour', label: 'One hour before' },
        ],
      },
      {
        type: 'multiSelect',
        id: 'drinks',
        label: 'What would you like?',
        options: [
          { id: 'tea', label: 'Tea' },
          { id: 'water', label: 'Water' },
        ],
      },
    ],
  }),
  Receipt: createOpenUIMessage('Receipt', {
    title: 'Appointment summary',
    fields: [
      { label: 'Date', value: '26 October 2026' },
      { label: 'Time', value: '2–2:30 pm' },
      { label: 'Location', value: 'OpenWA office' },
    ],
  }),
};

/** A local renderer/action preview. It has no client, recipient or sending capability. */
export function OpenUIWorkbench() {
  const [source, setSource] = React.useState(samples.Booking),
    [reply, setReply] = React.useState('');
  const id = React.useId();
  const result = React.useMemo(() => {
    try {
      return { message: compileOpenUI(source) };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Check the message.',
      };
    }
  }, [source]);
  return (
    <div className="space-y-5">
      <p className="text-sm">
        Try a message and its replies here. This preview sends nothing to
        WhatsApp.
      </p>
      <div
        role="group"
        aria-label="Message examples"
        className="flex flex-wrap gap-2"
      >
        {Object.entries(samples).map(([label, value]) => (
          <Button
            key={label}
            size="sm"
            variant="outline"
            onClick={() => {
              setSource(value);
              setReply('');
            }}
          >
            {label}
          </Button>
        ))}
      </div>
      <label className="block space-y-2 text-sm" htmlFor={id}>
        OpenUI document
        <textarea
          id={id}
          rows={6}
          spellCheck={false}
          value={source}
          onChange={(event) => {
            setSource(event.target.value);
            setReply('');
          }}
          className="block w-full rounded-lg border border-border bg-background p-3 font-mono text-xs"
        />
      </label>
      {result.message ? (
        <>
          <OpenUIMessage
            key={source}
            source={source}
            onAction={(selection) =>
              setReply(JSON.stringify(selection, null, 2))
            }
          />
          <p className="text-xs text-muted-foreground">
            WhatsApp message:{' '}
            {result.message.method === 'sendText'
              ? 'Text'
              : result.message.interactive?.type}
          </p>
        </>
      ) : (
        <p role="alert">{result.error}</p>
      )}
      {reply && (
        <div role="status" className="rounded-lg border border-border p-3">
          <p className="mb-2 text-sm font-medium">Preview reply</p>
          <pre className="overflow-auto text-xs">{reply}</pre>
        </div>
      )}
    </div>
  );
}
