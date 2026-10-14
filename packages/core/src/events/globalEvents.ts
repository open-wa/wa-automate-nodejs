import { randomUUID } from 'node:crypto';
import { Effect, Exit, Scope } from 'effect';
import { EventEmitter, HyperEmitter, type EventCallback, type EventName } from '@open-wa/hyperemitter';
import type { OpenWAEventMap } from './eventMap';
import { eventRegistry } from '@open-wa/schema';

type SessionBridge = { hasMessageListeners: () => boolean; detach: () => Promise<void> };
type GlobalEvents = {
  emitter: EventEmitter;
  bridges: WeakMap<HyperEmitter<OpenWAEventMap>, SessionBridge>;
};

// ESM and CommonJS entry points must share the same emitter. Do not tie the
// singleton to a session scope: consumers use it between modules before create().
const globalKey = Symbol.for('@open-wa/core/global-events/effect-hyperemitter');
const globals = globalThis as typeof globalThis & { [globalKey]?: GlobalEvents };
const shared: GlobalEvents = globals[globalKey] ??= {
  emitter: new EventEmitter({ delimiter: '.', ignoreErrors: true }),
  bridges: new WeakMap<HyperEmitter<OpenWAEventMap>, SessionBridge>(),
};

/** Shared synchronous, variadic event helper with star namespace wildcards and Effect ownership. */
export const ev = shared.emitter;

/** Register a listener for the lifetime of the calling Effect scope. */
export const onGlobalEvent = (event: EventName, listener: EventCallback) =>
  ev.onScoped(event, listener);

/** @internal Allow queued and global consumers to activate portable delivery. */
export const hasGlobalMessageListeners = (events: HyperEmitter<OpenWAEventMap>): boolean =>
  events.hasPubSub || (shared.bridges.get(events)?.hasMessageListeners() ?? false);

/** @internal The caller owns detach through its Effect session scope. */
export function attachGlobalEvents(
  events: HyperEmitter<OpenWAEventMap>,
  sessionId: string,
  eventMode: boolean,
  onError: (error: unknown) => void,
): () => Promise<void> {
  const existing = shared.bridges.get(events);
  if (existing) return existing.detach;

  const instanceId = randomUUID();
  const signature = (listener: string) => `${listener}.${sessionId}.${instanceId}`;
  const interested = (event: string) => ev.hasPubSub || ev.hasListeners(event) || ev.listenersAny().length > 0;
  const emit = (event: string, data: unknown, namespace: string) => {
    // Global application callbacks must not interrupt authentication or cleanup.
    try { ev.emit(event, data, sessionId, namespace); } catch (error) { onError(error); }
  };
  const emitListener = (name: string, data: unknown) => {
    if (!eventMode) return;
    const event = signature(name);
    if (!interested(event)) return;
    emit(event, { ts: Date.now(), sessionId, id: randomUUID(), event: name, data }, name);
  };

  const forward = (event: string, payload: any) => {
    if (interested(event)) emit(event, payload, event);
    switch (event as keyof OpenWAEventMap) {
      case 'launch.auth.qr.generated':
        emit(`qr.${sessionId}`, payload.details?.qr, 'qr');
        break;
      case 'launch.auth.linkCode.generated':
        emit(`linkCode.${sessionId}`, payload.details?.linkCode, 'linkCode');
        break;
      case 'session.data':
        if (interested(`sessionData.${sessionId}`)) {
          emit(`sessionData.${sessionId}`, JSON.parse(payload.data), 'sessionData');
        }
        if (interested(`sessionDataBase64.${sessionId}`)) {
          emit(`sessionDataBase64.${sessionId}`, Buffer.from(payload.data).toString('base64'), 'sessionDataBase64');
        }
        break;
      case 'message.received': emitListener('onMessage', payload.message); break;
      case 'message.any': emitListener('onAnyMessage', payload.message); break;
      case 'poll.vote': emitListener('onPollVote', payload.vote); break;
      case 'event.changed': emitListener('onEvent', payload.event); break;
      case 'event.response': emitListener('onEventResponse', payload.response); break;
      case 'ack.changed': emitListener('onAck', payload.ack); break;
      case 'session.state.changed': emitListener('onStateChanged', payload.details?.next); break;
      case 'session.logout': emitListener('onLogout', payload.details); break;
      case 'group.participants.changed.global': {
        const definition = eventRegistry.get('participantsChanged');
        if (definition) {
          for (const name of [definition.meta.legacyName, ...(definition.meta.aliases ?? [])]) {
            emitListener(name, payload.change);
          }
        }
        break;
      }
      case 'interactive.response':
        emitListener('onInteractiveResponse', payload.response);
        if (payload.response?.type === 'form') emitListener('onFormResponse', payload.response);
        break;
    }
  };

  let attached = true;
  const scope = Scope.makeUnsafe();
  const detach = async () => {
    if (!attached) return;
    attached = false;
    shared.bridges.delete(events);
    await Effect.runPromise(Scope.close(scope, Exit.void));
  };
  shared.bridges.set(events, {
    hasMessageListeners: () => interested('message.received')
      || (eventMode && interested(signature('onMessage'))),
    detach,
  });
  Effect.runSync(events.onAnyScoped(forward).pipe(Scope.provide(scope)));
  return detach;
}
