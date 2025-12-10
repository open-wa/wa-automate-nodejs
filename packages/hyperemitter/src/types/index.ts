export type AnyFn = (...args: any[]) => any;

export type EventMap = Record<string, AnyFn>;

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
}
