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
 * What each listener's callback receives. These are the values the SDK
 * `Client` listener of the same name delivers, so a handler written for
 * `client.onMessage` works unchanged on the socket client.
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
 * value the listener delivers. Mirrors the listener bridges of the SDK `Client`.
 * A listener without `project` receives the stream payload as it arrived.
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

/** The listener names fed by a stream event, each with the value its callbacks receive. */
export function listenerDeliveries(streamEvent: string, payload: unknown, envelope: StreamEnvelope = {}): Array<[listener: string, data: unknown]> {
    const deliveries: Array<[string, unknown]> = [];
    for (const listener of LISTENERS_BY_STREAM_EVENT[streamEvent] ?? []) {
        const project = LISTENER_SOURCES[listener].project;
        const data = project ? project(payload, envelope) : payload;
        if (data !== undefined && data !== null) deliveries.push([listener, data]);
    }
    return deliveries;
}
