import { createRecipeEngine } from './recipe-engine.mjs';
import { resourceManifest } from './resources.mjs';
import { StickerError, abortIfRequested } from './errors.mjs';

async function resourceBytes(resource) {
  if (typeof process !== 'undefined' && process.versions?.node) {
    const { cachedResource } = await import('./resource-cache.mjs');
    const { readFile } = await import('node:fs/promises');
    return readFile(await cachedResource(resource));
  }
  const response = await fetch(resource.url);
  if (!response.ok) throw new StickerError('RESOURCE_UNAVAILABLE', 'Font download failed.');
  const bytes = new Uint8Array(await response.arrayBuffer());
  const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(v => v.toString(16).padStart(2,'0')).join('');
  if (bytes.length !== resource.bytes || hash !== resource.sha256) throw new StickerError('RESOURCE_REJECTED', 'Font does not match its pinned digest.');
  return bytes;
}
async function kernelBytes() {
  const url = new URL('../wasm/kernels.wasm', import.meta.url);
  if (url.protocol === 'file:') { const { readFile } = await import('node:fs/promises'); return readFile(url); }
  const response = await fetch(url);
  if (!response.ok) throw new StickerError('RESOURCE_UNAVAILABLE', 'The shared kernel resource is unavailable.');
  return new Uint8Array(await response.arrayBuffer());
}

/** A browser driver needs only evaluate(fn, argument). Without a driver, use this page. */
export function createBrowserBackend(driver) {
  const evaluate = driver ? driver.evaluate.bind(driver) : (fn, arg) => Promise.resolve().then(() => fn(arg));
  let tail = Promise.resolve(), queued = 0, pendingBytes = 0, closed = false, timer;
  async function capabilities() {
    return evaluate(async () => {
      if (typeof createImageBitmap !== 'function' || (typeof OffscreenCanvas === 'undefined' && typeof document === 'undefined')) return { available: false, requirements: [] };
      const c = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(1,1) : document.createElement('canvas');
      c.width = c.height = 1;
      let blob; try { blob = c.convertToBlob ? await c.convertToBlob({ type: 'image/webp' }) : await new Promise(resolve => c.toBlob(resolve, 'image/webp')); } finally { c.width = c.height = 0; }
      if (blob?.type !== 'image/webp') return { available: false, requirements: [] };
      const requirements = ['canvas2d','encode:image/webp','decode:image/png','decode:image/jpeg','decode:image/webp'];
      if (typeof ImageDecoder !== 'undefined') for (const type of ['image/gif','image/png','image/webp','image/avif']) if (await ImageDecoder.isTypeSupported(type)) requirements.push(`decode:${type}`,`animation:${type}`);
      if (typeof WebAssembly !== 'undefined') requirements.push(...['invert','grayscale','stereo','dilate','erode','bayer'].map(name => `kernel:${name}`));
      if (typeof FontFace !== 'undefined' && (globalThis.fonts || globalThis.document?.fonts)) requirements.push('font:sans','font:serif','font:mono');
      return { available: true, requirements };
    });
  }
  async function execute(input, job, requirements) {
    if (closed) throw new StickerError('RUNTIME_CLOSED', 'The browser sticker runtime is closed.');
    abortIfRequested(job.signal);
    const installed = await evaluate(() => globalThis.__OPENWA_STICKER_RENDERER_V1__?.version === '1');
    if (!installed) await evaluate(createRecipeEngine, { install: true, kernelBytes: Array.from(await kernelBytes()) });
    for (const requirement of requirements.filter(value => value.startsWith('font:'))) {
      const resource = resourceManifest['font' + requirement.slice(5,6).toUpperCase() + requirement.slice(6)];
      const loaded = await evaluate(family => (globalThis.fonts || document.fonts).check(`12px "${family}"`) && !!globalThis.__OPENWA_STICKER_FONTS_V1__?.has(family), resource.family);
      if (!loaded) await evaluate(async ({ family, bytes }) => {
        const fonts = globalThis.fonts || document.fonts;
        const face = new FontFace(family, new Uint8Array(bytes)); await face.load(); fonts.add(face);
        (globalThis.__OPENWA_STICKER_FONTS_V1__ ??= new Map()).set(family, face);
      }, { family: resource.family, bytes: Array.from(await resourceBytes(resource)) });
    }
    abortIfRequested(job.signal);
    const { signal, onProgress, ...serializable } = job;
    const renderId = crypto.randomUUID();
    const cancel = () => { evaluate(id => globalThis.__OPENWA_STICKER_RENDERER_V1__?.cancel(id), renderId).catch(() => {}); };
    signal?.addEventListener('abort', cancel, { once: true });
    let result;
    try { result = await evaluate(async ({ bytes, mime, job }) => {
      try {
        const result = await globalThis.__OPENWA_STICKER_RENDERER_V1__.render(new Blob([new Uint8Array(bytes)], { type: mime }), job);
        return { result: { ...result, bytes: Array.from(result.bytes) } };
      } catch (error) { return { error: { message: error.message || String(error), code: error.code || 'RENDER_FAILED' } }; }
    }, { bytes: Array.from(input.bytes), mime: input.mime, job: { ...serializable, __renderId: renderId } }); }
    finally { signal?.removeEventListener('abort', cancel); }
    abortIfRequested(signal);
    if (result.error) throw new StickerError(result.error.code, result.error.message);
    const output = { ...result.result, bytes: new Uint8Array(result.result.bytes) };
    onProgress?.({ frame: output.frames, frames: output.frames });
    return output;
  }
  async function release() {
    await evaluate(() => {
      if (globalThis.__OPENWA_STICKER_RENDERER_V1__?.busy) return;
      globalThis.__OPENWA_STICKER_RENDERER_V1__?.dispose(); delete globalThis.__OPENWA_STICKER_RENDERER_V1__;
      const fonts = globalThis.fonts || globalThis.document?.fonts;
      for (const face of globalThis.__OPENWA_STICKER_FONTS_V1__?.values() || []) fonts?.delete(face);
      delete globalThis.__OPENWA_STICKER_FONTS_V1__;
    });
  }
  return {
    capabilities,
    render(input, job, requirements) {
      if (closed) return Promise.reject(new StickerError('RUNTIME_CLOSED', 'The browser sticker runtime is closed.'));
      if (queued >= 4 || pendingBytes + input.bytes.length > 64 * 1024 * 1024) return Promise.reject(new StickerError('QUEUE_FULL', 'The bounded browser sticker queue is full.'));
      clearTimeout(timer); queued++; pendingBytes += input.bytes.length;
      const promise = tail.then(() => execute(input, job, requirements));
      tail = promise.catch(() => {}).finally(() => {
        queued--; pendingBytes -= input.bytes.length;
        if (!queued) { timer = setTimeout(() => { tail = tail.then(release).catch(() => {}); }, 60_000); timer.unref?.(); }
      });
      return promise;
    },
    async dispose() { closed = true; clearTimeout(timer); await tail; await release(); },
  };
}
