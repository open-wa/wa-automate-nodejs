import { randomUUID } from 'node:crypto';
import { EventEmitter2 } from 'eventemitter2';
import { Effect } from 'effect';
import type { HyperEmitter } from '@open-wa/hyperemitter';
import type { OpenWAEventMap } from './eventMap';

type GlobalListener = Parameters<EventEmitter2['on']>[1];
type SessionBridge = { hasMessageListeners: () => boolean; detach: () => void };
type GlobalEvents = {
  emitter: EventEmitter2;
  bridges: WeakMap<HyperEmitter<OpenWAEventMap>, SessionBridge>;
};

// ESM and CommonJS entry points must share the same emitter. Do not tie the
// singleton to a session scope: consumers use it between modules before create().
const globalKey = Symbol.for('@open-wa/core/global-events/v5');
const globals = globalThis as typeof globalThis & { [globalKey]?: GlobalEvents };
const shared: GlobalEvents = globals[globalKey] ??= {
  emitter: new EventEmitter2({ wildcard: true, delimiter: '.', ignoreErrors: true }),
  bridges: new WeakMap<HyperEmitter<OpenWAEventMap>, SessionBridge>(),
};

/** Shared, synchronous event helper with v4 wildcard and variadic-argument support. */
export const ev = shared.emitter;

/** Register a listener for the lifetime of the calling Effect scope. */
export const onGlobalEvent = (event: string, listener: GlobalListener) =>
  Effect.acquireRelease(
    Effect.sync(() => {
      // Own this registration even if the same callback was registered elsewhere.
      const owned: GlobalListener = function (this: EventEmitter2, ...args) { return listener.apply(this, args); };
      ev.on(event, owned);
      return owned;
    }),
    owned => Effect.sync(() => { ev.off(event, owned); }),
  ).pipe(Effect.asVoid);

/** @internal Allow global onMessage consumers to activate portable delivery. */
export const hasGlobalMessageListeners = (events: HyperEmitter<OpenWAEventMap>): boolean =>
  shared.bridges.get(events)?.hasMessageListeners() ?? false;

/** @internal The caller owns detach through its Effect session scope. */
export function attachGlobalEvents(
  events: HyperEmitter<OpenWAEventMap>,
  sessionId: string,
  eventMode: boolean,
  onError: (error: unknown) => void,
): () => void {
  const existing = shared.bridges.get(events);
  if (existing) return existing.detach;

  const instanceId = randomUUID();
  const signature = (listener: string) => `${listener}.${sessionId}.${instanceId}`;
  const interested = (event: string) => ev.hasListeners(event) || ev.listenersAny().length > 0;
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
    // Native v5 names remain available, with the originating session as arg 2.
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
      case 'ack.changed': emitListener('onAck', payload.ack); break;
      case 'session.state.changed': emitListener('onStateChanged', payload.details?.next); break;
      case 'session.logout': emitListener('onLogout', payload.details); break;
      case 'interactive.response':
        emitListener('onInteractiveResponse', payload.response);
        if (payload.response?.type === 'form') emitListener('onFormResponse', payload.response);
        break;
    }
  };

  let attached = true;
  const detach = () => {
    if (!attached) return;
    attached = false;
    events.offAny(forward);
    shared.bridges.delete(events);
  };
  shared.bridges.set(events, {
    hasMessageListeners: () => interested('message.received')
      || (eventMode && interested(signature('onMessage'))),
    detach,
  });
  events.onAny(forward);
  return detach;
}
