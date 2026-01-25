export type AnyFn = (...args: any[]) => any;

export type EventMap = { [key: string]: unknown };

export type EventListener<T> = (payload: T) => void | Promise<void>;

export interface ListenerOptions {
  /**
   * AbortSignal to auto-remove the listener when aborted.
   */
  signal?: AbortSignal;
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
