import { Worker } from 'node:worker_threads';
import { StickerError, abortIfRequested } from './errors.mjs';

export const standaloneCapabilities = Object.freeze({ available: true, requirements: Object.freeze([
  'canvas2d', 'encode:image/webp',
  ...['image/png','image/jpeg','image/gif','image/webp'].map(type => `decode:${type}`),
  ...['image/png','image/gif','image/webp'].map(type => `animation:${type}`),
  ...['invert','grayscale','stereo','dilate','erode','bayer'].map(name => `kernel:${name}`),
  'font:sans','font:serif','font:mono',
]) });

/** One serial worker per backend, released after 60 seconds without work. */
export function createLibraryBackend(options = {}) {
  let worker, active, sequence = 0, idleTimer, closing = false;
  const queue = [];
  function settle(item, error, result) {
    clearTimeout(item.timer); item.signal?.removeEventListener('abort', item.abort);
    error ? item.reject(error) : item.resolve(result);
  }
  function stopWorker() {
    clearTimeout(idleTimer);
    const current = worker; worker = undefined;
    return current?.terminate();
  }
  function failActive(error) {
    if (active) { const item = active; active = undefined; settle(item, error); }
    stopWorker(); pump();
  }
  function pump() {
    if (active || closing) return;
    clearTimeout(idleTimer);
    if (!queue.length) {
      if (worker) { worker.unref(); idleTimer = setTimeout(stopWorker, options.idleMs ?? 60_000); idleTimer.unref(); }
      return;
    }
    if (!worker) {
      worker = new Worker(new URL('./worker.mjs', import.meta.url), {
        workerData: { cacheDirectory: options.cacheDirectory, offline: options.offline },
        resourceLimits: { maxOldGenerationSizeMb: 128 },
      });
      const current = worker;
      current.on('message', message => {
        if (worker !== current || !active || message.id !== active.id) return;
        if (message.progress) { try { active.onProgress?.(message.progress); } catch {} return; }
        const item = active; active = undefined;
        settle(item, message.error ? new StickerError(message.error.code, message.error.message, message.error.detail) : undefined, message.result);
        pump();
      });
      current.on('error', error => { if (worker === current) failActive(new StickerError('EXECUTOR_FAILED', 'The standalone executor stopped.', {}, error)); });
      current.on('exit', () => { if (worker === current) failActive(new StickerError('EXECUTOR_FAILED', 'The standalone executor exited before completing its job.')); });
    }
    active = queue.shift(); worker.ref();
    active.timer = setTimeout(() => failActive(new StickerError('RENDER_TIMEOUT', 'The local render exceeded its two-minute execution budget.')), 120_000);
    const { signal, onProgress, ...job } = active.job;
    worker.postMessage({ id: active.id, input: active.input, job, requirements: active.requirements });
  }
  return {
    capabilities: standaloneCapabilities,
    render(input, job, requirements) {
      abortIfRequested(job.signal);
      if (closing) return Promise.reject(new StickerError('RUNTIME_CLOSED', 'The sticker runtime is closed.'));
      if (queue.length >= 4 || queue.reduce((n,item) => n + item.input.bytes.length, 0) + input.bytes.length > 64 * 1024 * 1024) return Promise.reject(new StickerError('QUEUE_FULL', 'The bounded local sticker queue is full.'));
      return new Promise((resolve, reject) => {
        const item = { id: ++sequence, input, job, requirements, signal: job.signal, onProgress: job.onProgress, resolve, reject };
        item.abort = () => {
          if (active === item) failActive(new StickerError('CANCELLED', 'Sticker rendering was cancelled.'));
          else { const index = queue.indexOf(item); if (index >= 0) { queue.splice(index, 1); settle(item, new StickerError('CANCELLED', 'Sticker rendering was cancelled.')); } }
        };
        item.signal?.addEventListener('abort', item.abort, { once: true });
        queue.push(item); pump();
      });
    },
    async dispose() {
      closing = true;
      const error = new StickerError('RUNTIME_CLOSED', 'The sticker runtime was closed.');
      if (active) { settle(active, error); active = undefined; }
      for (const item of queue.splice(0)) settle(item, error);
      await stopWorker();
    },
  };
}
