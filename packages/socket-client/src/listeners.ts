import type {
    Call,
    EventResponse,
    FormResponse,
    InteractiveResponse,
    Message,
    ParticipantChange,
    PollVote,
    SimpleListener,
    WhatsAppEvent,
} from '@open-wa/schema';

/**
 * What `client.onMessage(callback)` and the other listener methods deliver.
 * These are the values the SDK `Client` listener of the same name delivers,
 * so a handler written for `client.onMessage` works unchanged on the socket
 * client.
 */
export interface ListenerPayloads {
    onMessage: Message;
    onAnyMessage: Message;
    onAck: Message;
    /** The new session state, for example `READY` or `DISCONNECTED`. */
    onStateChanged: string;
    onLogout: { reason?: string; timestamp: number };
    onPollVote: PollVote;
    onEvent: WhatsAppEvent;
    onEventResponse: EventResponse;
    onInteractiveResponse: InteractiveResponse;
    onFormResponse: FormResponse;
    onGlobalParticipantsChanged: ParticipantChange;
    onIncomingCall: Call;
    onCallState: Call;
}

/** The context the Easy API stamps on a stream event. */
export type StreamContext = { correlationId: string; ts: number; attempt?: number };

type Wrapped<K extends string, T> = { ctx: StreamContext } & { [P in K]: T };

/** A session step event, such as a state change or a logout. */
export type SessionStepPayload = StreamContext & {
    step: string;
    details?: Record<string, unknown>;
    durationMs?: number;
    error?: { name: string; message: string; stack?: string };
};

/**
 * What a `listen(name, callback)` callback receives: the Easy API stream
 * payload as it was sent. `listen('onMessage', ...)` gets `{ ctx, message }`.
 * For the bare value, use the listener method: `client.onMessage(callback)`.
 */
export interface ListenPayloads {
    onMessage: Wrapped<'message', Message>;
    onAnyMessage: Wrapped<'message', Message>;
    onAck: Wrapped<'ack', Message>;
    onStateChanged: SessionStepPayload;
    onLogout: SessionStepPayload;
    onPollVote: Wrapped<'vote', PollVote>;
    onEvent: Wrapped<'event', WhatsAppEvent>;
    onEventResponse: Wrapped<'response', EventResponse>;
    onInteractiveResponse: Wrapped<'response', InteractiveResponse | FormResponse>;
    onFormResponse: Wrapped<'response', InteractiveResponse | FormResponse>;
    onGlobalParticipantsChanged: Wrapped<'change', ParticipantChange>;
    onIncomingCall: Call;
    onCallState: Call;
}

export type ListenPayload<L extends string> = L extends keyof ListenPayloads ? ListenPayloads[L] : unknown;

export type ListenCallback<L extends string> = (data: ListenPayload<L>) => unknown;

/** A listener whose payload type is known. */
export type TypedListenerName = keyof ListenerPayloads;

/** Every listener name `listen` accepts, as the string or the `SimpleListener` member. */
export type ListenerName = TypedListenerName | `${SimpleListener}`;

export type ListenerPayload<L extends string> = L extends TypedListenerName ? ListenerPayloads[L] : unknown;

export type ListenerCallback<L extends string> = (data: ListenerPayload<L>) => unknown;

/** `client.onMessage(callback)` and the other one-callback listener methods. */
export type ListenerMethods = {
    [L in TypedListenerName]: (callback: ListenerCallback<L>) => Promise<string>;
};

type StreamEnvelope = { ts?: number };

type ListenerSource = {
    /** The Easy API stream event that feeds this listener. */
    event: string;
    /** Turns the stream payload into the listener's value; `undefined` skips the callback. */
    project?: (payload: any, envelope: StreamEnvelope) => unknown;
};

/**
 * The stream event behind each listener name, and how its payload becomes the
 * value the listener method delivers. Mirrors the listener bridges of the SDK
 * `Client`. A listener without `project` receives the stream payload as it arrived.
 */
export const LISTENER_SOURCES: Readonly<Record<string, ListenerSource>> = {
    onMessage: { event: 'message.received', project: (payload) => payload?.message },
    onAnyMessage: { event: 'message.any', project: (payload) => payload?.message },
    onAck: { event: 'ack.changed', project: (payload) => payload?.ack },
    onStateChanged: { event: 'session.state.changed', project: (payload) => payload?.details?.next },
    onLogout: {
        event: 'session.logout',
        project: (payload, envelope) => ({ reason: payload?.details?.reason, timestamp: envelope.ts ?? Date.now() }),
    },
    onPollVote: { event: 'poll.vote', project: (payload) => payload?.vote },
    onEvent: { event: 'event.changed', project: (payload) => payload?.event },
    onEventResponse: { event: 'event.response', project: (payload) => payload?.response },
    onInteractiveResponse: { event: 'interactive.response', project: (payload) => payload?.response },
    onFormResponse: {
        event: 'interactive.response',
        project: (payload) => (payload?.response?.type === 'form' ? payload.response : undefined),
    },
    onGlobalParticipantsChanged: { event: 'group.participants.changed.global', project: (payload) => payload?.change },
    onAddedToGroup: { event: 'group.addedToGroup' },
    onChatState: { event: 'chat.state' },
};

const LISTENERS_BY_STREAM_EVENT = Object.entries(LISTENER_SOURCES).reduce<Record<string, string[]>>(
    (acc, [listener, source]) => {
        (acc[source.event] ??= []).push(listener);
        return acc;
    },
    {},
);

/** The stream event to subscribe to for a listener name; other names are stream events already. */
export function streamEventForListener(listener: string): string {
    return LISTENER_SOURCES[listener]?.event ?? listener;
}

/** The listener names fed by a stream event. */
export function listenersForStreamEvent(streamEvent: string): readonly string[] {
    return LISTENERS_BY_STREAM_EVENT[streamEvent] ?? [];
}

/**
 * Turns a stream payload into the value the SDK `Client` listener of that name
 * delivers. `undefined` means the callback is skipped.
 */
export function clientListenerValue(listener: string, payload: unknown, envelope: StreamEnvelope = {}): unknown {
    const project = LISTENER_SOURCES[listener]?.project;
    const data = project ? project(payload, envelope) : payload;
    return data === null ? undefined : data;
}
