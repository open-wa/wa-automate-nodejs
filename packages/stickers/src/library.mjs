import { Worker } from 'node:worker_threads';
import { availableParallelism } from 'node:os';
import { StickerError, abortIfRequested } from './errors.mjs';

export const standaloneCapabilities = Object.freeze({ available: true, requirements: Object.freeze([
  'canvas2d', 'encode:image/webp',
  ...['image/png','image/jpeg','image/gif','image/webp'].map(type => `decode:${type}`),
  ...['image/png','image/gif','image/webp'].map(type => `animation:${type}`),
  ...['invert','grayscale','stereo','dilate','erode','bayer'].map(name => `kernel:${name}`),
  'font:sans','font:serif','font:mono',
]) });

/** Grow a small CPU-aware pool on demand, retaining warm workers for a burst. */
export function createLibraryBackend(options = {}) {
  const workers = new Set(), queue = new Map();
  const capacity = Math.max(1, Math.min(2, availableParallelism() - 1));
  let sequence = 0, closing = false, disposal;

  function settle(item, error, result) {
    clearTimeout(item.timer);
    item.signal?.removeEventListener('abort', item.abort);
    item.input = item.job = item.requirements = item.slot = undefined;
    error ? item.reject(error) : item.resolve(result);
  }

  function stopWorker(slot) {
    if (slot.stopping) return slot.stopping;
    clearTimeout(slot.idleTimer);
    slot.stopping = slot.worker.terminate().catch(() => {}).finally(() => {
      workers.delete(slot);
      pump();
    });
    return slot.stopping;
  }

  function failWorker(slot, error) {
    const item = slot.active;
    slot.active = undefined;
    if (item) settle(item, error);
    stopWorker(slot);
  }

  function idle(slot) {
    slot.worker.unref();
    slot.idleTimer = setTimeout(() => stopWorker(slot), options.idleMs ?? 60_000);
    slot.idleTimer.unref();
  }

  function startWorker() {
    const worker = new Worker(new URL('./worker.mjs', import.meta.url), {
      workerData: { cacheDirectory: options.cacheDirectory, offline: options.offline },
      resourceLimits: { maxOldGenerationSizeMb: 128 },
    });
    const slot = { worker };
    workers.add(slot);
    worker.on('message', message => {
      const item = slot.active;
      if (slot.stopping || !item || message.id !== item.id) return;
      if (message.progress) { try { item.onProgress?.(message.progress); } catch {} return; }
      slot.active = undefined;
      settle(item, message.error ? new StickerError(message.error.code, message.error.message, message.error.detail) : undefined, message.result);
      idle(slot);
      pump();
    });
    worker.on('error', error => {
      if (!slot.stopping) failWorker(slot, new StickerError('EXECUTOR_FAILED', 'The standalone executor stopped.', {}, error));
    });
    worker.on('exit', () => {
      if (!slot.stopping) failWorker(slot, new StickerError('EXECUTOR_FAILED', 'The standalone executor exited before completing its job.'));
    });
    return slot;
  }

  function pump() {
    while (!closing && queue.size) {
      const item = queue.keys().next().value;
      let slot = [...workers].find(value => !value.active && !value.stopping);
      if (!slot && workers.size >= capacity) return;
      if (!slot) {
        try { slot = startWorker(); }
        catch (error) {
          queue.delete(item);
          settle(item, new StickerError('EXECUTOR_FAILED', 'The standalone executor could not start.', {}, error));
          continue;
        }
      }
      queue.delete(item);
      clearTimeout(slot.idleTimer);
      slot.active = item;
      item.slot = slot;
      slot.worker.ref();
      item.timer = setTimeout(() => failWorker(slot, new StickerError('RENDER_TIMEOUT', 'The local render exceeded its two-minute execution budget.')), 120_000);
      const { signal, onProgress, ...job } = item.job;
      try { slot.worker.postMessage({ id: item.id, input: item.input, job, requirements: item.requirements }); }
      catch (error) { failWorker(slot, new StickerError('EXECUTOR_FAILED', 'The standalone executor could not receive its job.', {}, error)); }
    }
  }

  return {
    capabilities: standaloneCapabilities,
    render(input, job, requirements) {
      abortIfRequested(job.signal);
      if (closing) return Promise.reject(new StickerError('RUNTIME_CLOSED', 'The sticker runtime is closed.'));
      return new Promise((resolve, reject) => {
        const item = { id: ++sequence, input, job, requirements, signal: job.signal, onProgress: job.onProgress, resolve, reject };
        item.abort = () => {
          const error = new StickerError('CANCELLED', 'Sticker rendering was cancelled.');
          if (item.slot) failWorker(item.slot, error);
          else if (queue.delete(item)) settle(item, error);
        };
        item.signal?.addEventListener('abort', item.abort, { once: true });
        queue.set(item, true);
        pump();
      });
    },
    dispose() {
      if (disposal) return disposal;
      closing = true;
      const error = new StickerError('RUNTIME_CLOSED', 'The sticker runtime was closed.');
      for (const item of queue.keys()) settle(item, error);
      queue.clear();
      for (const slot of workers) {
        if (slot.active) { settle(slot.active, error); slot.active = undefined; }
      }
      disposal = Promise.all([...workers].map(stopWorker)).then(() => {});
      return disposal;
    },
  };
}
