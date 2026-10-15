import type { Effect } from 'effect';

export type AnyFn = (...args: any[]) => any;

export type EventMap = { [key: string]: unknown };

export type ListenerResult = void | Promise<unknown> | Effect.Effect<unknown, unknown>;

export type HyperEmission<TMap extends object> = {
  [K in keyof TMap & string]: { readonly event: K; readonly payload: TMap[K] };
}[keyof TMap & string];

export type EventListener<T> = (payload: T) => ListenerResult;

export type AnyEventListener = (event: string, payload: any) => ListenerResult;

export interface ListenerOptions {
  /**
   * AbortSignal to auto-remove the listener when aborted.
   */
  signal?: AbortSignal;
  /** Insert before other listeners registered for this pattern. */
  prepend?: boolean;
  /**
   * Mark the listener as weak; provide a target object to track.
   * When the target is GC'd, the listener is removed.
   */
  weak?: object;
  /**
   * Enable captureRejections for this listener (fallbacks to emitter-level).
   */
  captureRejections?: boolean;
}

export interface HyperEmitterOptions {
  delimiter?: string;
  /** Public OpenWA emitter uses * and **; client.events uses MQTT wildcards. */
  wildcardStyle?: 'mqtt' | 'eventemitter';
  captureRejections?: boolean;
  onError?: (error: unknown) => void;
  /**
   * Enable debug logging (uses @open-wa/logger).
   */
  debug?: boolean;
  /**
   * Optional logger instance; if omitted, a child logger will be created.
   */
  logger?: import('@open-wa/logger').Logger;
  /**
   * Additional bound context for logger child.
   */
  loggerContext?: import('@open-wa/logger').LogContext;
}
