import type { OpenWAEventMap } from '../events/eventMap.js';

type RuntimeBridgeEvent = Extract<
  keyof OpenWAEventMap,
  'message.received' | 'message.any' | 'ack.changed' | 'session.state.changed' | 'group.addedToGroup'
>;

type RuntimeNavigationEvent = Extract<keyof OpenWAEventMap, 'session.logout'>;

export interface RuntimeWapiListenerSurfaceEntry {
  kind: 'wapi';
  event: RuntimeBridgeEvent;
  bindingName: string;
  wapiMethod: string;
  required: boolean;
}

export interface RuntimeNavigationListenerSurfaceEntry {
  kind: 'navigation';
  event: RuntimeNavigationEvent;
  observerId: string;
}

export type RuntimeListenerSurfaceEntry =
  | RuntimeWapiListenerSurfaceEntry
  | RuntimeNavigationListenerSurfaceEntry;

export const runtimeListenerSurface = {
  'message.received': {
    kind: 'wapi',
    event: 'message.received',
    bindingName: 'OpenWA_RuntimeMessageReceived',
    wapiMethod: 'onAnyMessage',
    required: true,
  },
  'message.any': {
    kind: 'wapi',
    event: 'message.any',
    bindingName: 'OpenWA_RuntimeAnyMessage',
    wapiMethod: 'onAnyMessage',
    required: false,
  },
  'ack.changed': {
    kind: 'wapi',
    event: 'ack.changed',
    bindingName: 'OpenWA_RuntimeAckChanged',
    wapiMethod: 'onAck',
    required: true,
  },
  'session.state.changed': {
    kind: 'wapi',
    event: 'session.state.changed',
    bindingName: 'OpenWA_RuntimeStateChanged',
    wapiMethod: 'onStateChanged',
    required: true,
  },
  'group.addedToGroup': {
    kind: 'wapi',
    event: 'group.addedToGroup',
    bindingName: 'OpenWA_RuntimeAddedToGroup',
    wapiMethod: 'onAddedToGroup',
    required: false,
  },
  'session.logout': {
    kind: 'navigation',
    event: 'session.logout',
    observerId: 'session.logout',
  },
} as const satisfies Record<string, RuntimeListenerSurfaceEntry>;

export function getRuntimeListenerSurfaceEntry<EventName extends keyof typeof runtimeListenerSurface>(
  eventName: EventName,
): (typeof runtimeListenerSurface)[EventName] {
  return runtimeListenerSurface[eventName];
}

export const requiredRuntimeWapiMethods = [
  ...new Set(
    Object.values(runtimeListenerSurface)
      .flatMap((entry) => (entry.kind === 'wapi' && entry.required ? [entry.wapiMethod] : [])),
  ),
].sort();
