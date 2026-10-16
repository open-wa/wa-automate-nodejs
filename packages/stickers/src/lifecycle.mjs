import { StickerError, abortIfRequested } from './errors.mjs';

const IDLE_MS = 60_000;
const EXECUTION_MS = 120_000;

/** Queue before reading inputs, keep a warm host for bursts, release it on idle. */
export function manageStickerRuntime(createHost, concurrency = 1, onDispose = () => {}) {
  const waiting = new Map(), active = new Set();
  const subscriptions = new Map();
  let host, idleTimer, closed = false, cleanup = Promise.resolve(), disposal;

  function unsubscribe(item) {
    const signal = item.job.signal, group = subscriptions.get(signal);
    if (!group) return;
    group.items.delete(item);
    if (!group.items.size) {
      signal.removeEventListener('abort', group.abort);
      subscriptions.delete(signal);
    }
  }

  function subscribe(item) {
    const signal = item.job.signal;
    if (!signal) return;
    let group = subscriptions.get(signal);
    if (!group) {
      group = { items: new Set() };
      group.abort = () => { for (const item of group.items) item.abort(); };
      subscriptions.set(signal, group);
      signal.addEventListener('abort', group.abort, { once: true });
    }
    group.items.add(item);
  }

  function releaseHost() {
    const current = host;
    host = undefined;
    cleanup = cleanup.then(() => current?.dispose()).catch(() => {});
    return cleanup;
  }

  function idle() {
    clearTimeout(idleTimer);
    if (!closed && !active.size && !waiting.size && host) {
      idleTimer = setTimeout(releaseHost, IDLE_MS);
      idleTimer.unref?.();
    }
  }

  function pump() {
    while (!closed && active.size < concurrency && waiting.size) {
      const item = waiting.keys().next().value;
      waiting.delete(item);
      active.add(item);
      item.timeout = setTimeout(() => {
        item.controller.abort(new StickerError('RENDER_TIMEOUT', 'Sticker creation exceeded its two-minute execution budget.'));
      }, EXECUTION_MS);
      item.finished = (async () => {
        try {
          await cleanup;
          abortIfRequested(item.controller.signal);
          host ??= createHost();
          const result = await host.createSticker(item.input, { ...item.job, signal: item.controller.signal });
          abortIfRequested(item.controller.signal);
          item.resolve(result);
        } catch (error) {
          item.reject(item.controller.signal.aborted ? item.controller.signal.reason : error);
        } finally {
          clearTimeout(item.timeout);
          unsubscribe(item);
          item.input = item.job = undefined;
          active.delete(item);
          pump();
          idle();
        }
      })();
    }
  }

  return {
    createSticker(input, job = {}) {
      if (closed) return Promise.reject(new StickerError('RUNTIME_CLOSED', 'The sticker runtime is closed.'));
      if (job.signal?.aborted) return Promise.reject(new StickerError('CANCELLED', 'Sticker creation was cancelled.'));
      clearTimeout(idleTimer);
      return new Promise((resolve, reject) => {
        const item = { input, job: { ...job }, resolve, reject, controller: new AbortController() };
        item.abort = () => {
          const error = new StickerError('CANCELLED', 'Sticker creation was cancelled.');
          item.controller.abort(error);
          if (waiting.delete(item)) {
            unsubscribe(item);
            item.input = item.job = undefined;
            reject(error);
            idle();
          }
        };
        subscribe(item);
        waiting.set(item, true);
        pump();
      });
    },
    dispose() {
      if (disposal) return disposal;
      closed = true;
      clearTimeout(idleTimer);
      const error = new StickerError('RUNTIME_CLOSED', 'The sticker runtime was closed.');
      for (const item of waiting.keys()) {
        unsubscribe(item);
        item.input = item.job = undefined;
        item.reject(error);
      }
      waiting.clear();
      for (const item of active) item.controller.abort(error);
      disposal = Promise.allSettled([...active].map(item => item.finished)).then(releaseHost).then(onDispose);
      return disposal;
    },
  };
}
