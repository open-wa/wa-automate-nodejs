import { createRecipeEngine } from './recipe-engine.mjs';
import { resourceManifest } from './resources.mjs';
import { StickerError, abortIfRequested } from './errors.mjs';
import { renderSticker } from './render.mjs';
import { webResourceBytes, webKernelBytes } from './browser-resources.mjs';
import { manageStickerRuntime } from './lifecycle.mjs';

/** A browser driver needs only evaluate(fn, argument). Without a driver, use this page. */
export function createBrowserStickerRuntime(driver, resources) {
  return manageStickerRuntime(() => {
    const browser = createBrowserBackend(driver, resources);
    return {
      createSticker(input, job) {
        return renderSticker(input, { ...job, backend: job.backend ?? 'browser' }, { browser, standalone: { available: false, requirements: [] } });
      },
      dispose: () => browser.dispose(),
    };
  });
}

let defaultRuntime;
export function createSticker(input, job) {
  defaultRuntime ??= createBrowserStickerRuntime();
  return defaultRuntime.createSticker(input, job);
}

/** A browser driver needs only evaluate(fn, argument). Without a driver, use this page. */
export function createBrowserBackend(driver, { resourceBytes = webResourceBytes, kernelBytes = webKernelBytes } = {}) {
  const evaluate = driver ? driver.evaluate.bind(driver) : (fn, arg) => Promise.resolve().then(() => fn(arg));
  async function capabilities() {
    return evaluate(async () => {
      if (typeof createImageBitmap !== 'function' || (typeof OffscreenCanvas === 'undefined' && typeof document === 'undefined')) return { available: false, requirements: [] };
      const c = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(1,1) : document.createElement('canvas');
      c.width = c.height = 1;
      if (!c.getContext('2d')) { c.width = c.height = 0; return { available: false, requirements: [] }; }
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
    abortIfRequested(job.signal);
    const installed = await evaluate(() => globalThis.__OPENWA_STICKER_RENDERER_V1__?.version === '1');
    if (!installed) await evaluate(createRecipeEngine, { install: true, kernelBytes: Array.from(await kernelBytes(job.signal)) });
    for (const requirement of requirements.filter(value => value.startsWith('font:'))) {
      const resource = resourceManifest['font' + requirement.slice(5,6).toUpperCase() + requirement.slice(6)];
      const loaded = await evaluate(family => (globalThis.fonts || document.fonts).check(`12px "${family}"`) && !!globalThis.__OPENWA_STICKER_FONTS_V1__?.has(family), resource.family);
      if (!loaded) await evaluate(async ({ family, bytes }) => {
        const fonts = globalThis.fonts || document.fonts;
        const face = new FontFace(family, new Uint8Array(bytes)); await face.load(); fonts.add(face);
        (globalThis.__OPENWA_STICKER_FONTS_V1__ ??= new Map()).set(family, face);
      }, { family: resource.family, bytes: Array.from(await resourceBytes(resource, job.signal)) });
    }
    abortIfRequested(job.signal);
    const { signal, onProgress, ...serializable } = job;
    const renderId = Array.from(crypto.getRandomValues(new Uint32Array(4)), value => value.toString(16).padStart(8, '0')).join('');
    const cancel = () => { evaluate(id => globalThis.__OPENWA_STICKER_RENDERER_V1__?.cancel(id), renderId).catch(() => {}); };
    signal?.addEventListener('abort', cancel, { once: true });
    let result;
    try { result = await evaluate(async ({ bytes, mime, job, serialize }) => {
      try {
        const result = await globalThis.__OPENWA_STICKER_RENDERER_V1__.render(new Blob([new Uint8Array(bytes)], { type: mime }), job);
        return { result: { ...result, bytes: serialize ? Array.from(result.bytes) : result.bytes } };
      } catch (error) { return { error: { message: error.message || String(error), code: error.code || 'RENDER_FAILED' } }; }
    }, { bytes: driver ? Array.from(input.bytes) : input.bytes, mime: input.mime, job: { ...serializable, __renderId: renderId }, serialize: !!driver }); }
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
  const jobs = manageStickerRuntime(() => ({
    createSticker: ({ input, requirements }, job) => execute(input, job, requirements),
    dispose: release,
  }));
  return {
    capabilities,
    render(input, job, requirements) {
      return jobs.createSticker({ input, requirements }, job);
    },
    dispose: () => jobs.dispose(),
  };
}
