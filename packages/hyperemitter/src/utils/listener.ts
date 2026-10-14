import type { ListenerOptions } from '../types/index';
import type { Scope } from 'effect';

export type ListenerFn = (...args: any[]) => any;

export interface ListenerRecord<T extends ListenerFn> {
  fn: T;
  original?: T;
  once: boolean;
  any: boolean;
  fired?: boolean;
  signal?: AbortSignal;
  abortHandler?: () => void;
  weakRef?: WeakRef<object>;
  finalizerToken?: object;
  captureRejections?: boolean;
  scope?: Scope.Closeable;
}

export function createRecord<T extends ListenerFn>(
  fn: T,
  opts: ListenerOptions,
  finalizer?: FinalizationRegistry<unknown>
): ListenerRecord<T> {
  const record: ListenerRecord<T> = {
    fn,
    once: false,
    any: false,
    signal: opts.signal,
    captureRejections: opts.captureRejections
  };

  if (opts.weak && typeof WeakRef !== 'undefined') {
    const weakRef = new WeakRef(opts.weak);
    record.weakRef = weakRef;
    if (finalizer) {
      const token = {};
      record.finalizerToken = token;
      finalizer.register(opts.weak, token, token);
    }
  }

  return record;
}

export function attachAbort(
  record: ListenerRecord<any>,
  remove: () => void
) {
  if (!record.signal) return;
  if (record.signal.aborted) {
    remove();
    return;
  }
  const handler = () => remove();
  record.abortHandler = handler;
  record.signal.addEventListener('abort', handler, { once: true });
}

export function cleanupAbort(record: ListenerRecord<any>) {
  if (record.signal && record.abortHandler) {
    record.signal.removeEventListener('abort', record.abortHandler);
    record.abortHandler = undefined;
  }
}
