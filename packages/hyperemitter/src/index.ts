export { HyperEmitter } from './core/HyperEmitter';
export type {
  EventMap,
  HyperEmission,
  EventListener,
  AnyEventListener,
  ListenerResult,
  ListenerOptions,
  HyperEmitterOptions
} from './types/index';

export { EventEmitter } from './core/EventEmitter';
export type { EventName, EventEmission, EventCallback, EventSubscription, EventEmitterListenerOptions, EventEmitterOptions, WaitForOptions, CancelablePromise, ListenToOptions } from './core/EventEmitter';

export type { PubSubOptions, PubSubStatus } from './core/EmissionHub';
