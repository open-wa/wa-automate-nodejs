import { normalizeJob, requirementsFor, chooseBackend } from './planner.mjs';
import { resolveInput } from './input.mjs';
import { probeInput } from './probe.mjs';
import { parseWebp } from './webp.mjs';
import { admitSticker, STICKER_PROFILE } from './profile.mjs';
import { StickerError, abortIfRequested } from './errors.mjs';
import { createBrowserBackend } from './browser.mjs';
export { StickerError, STICKER_PROFILE };
export { listEffects, effectCatalogue } from './catalogue.mjs';
export { resourceManifest } from './resources.mjs';

const noBrowser = { available: false, requirements: [] };
const localRequirements = ['canvas2d','encode:image/webp',...['image/png','image/jpeg','image/gif','image/webp'].map(mime=>`decode:${mime}`),...['image/png','image/gif','image/webp'].map(mime=>`animation:${mime}`),...['invert','grayscale','stereo','dilate','erode','bayer'].map(name=>`kernel:${name}`),'font:sans','font:serif','font:mono'];

export function createStickerRuntime(options = {}) {
  const node = typeof process !== 'undefined' && !!process.versions?.node;
  const browser = options.browser || (!node ? createBrowserBackend() : undefined);
  let standalone, closed = false;
  return {
    async createSticker(input, jobOptions = {}) {
      if (closed) throw new StickerError('RUNTIME_CLOSED', 'The sticker runtime is closed.');
      const started = performance.now(), job = normalizeJob(jobOptions);
      const source = probeInput(await resolveInput(input, job));
      const requirements = requirementsFor(source, job);
      const backend = chooseBackend(requirements, browser ? await browser.capabilities() : noBrowser, { available: node, requirements: localRequirements }, job.backend);
      abortIfRequested(job.signal);
      if (backend === 'standalone' && !standalone) {
        const { createLibraryBackend } = await import('./library.mjs');
        standalone = createLibraryBackend({ cacheDirectory: options.cacheDirectory, offline: options.offline });
      }
      const renderer = backend === 'browser' ? browser : standalone;
      const result = await renderer.render(source, job, requirements);
      const info = parseWebp(result.bytes);
      admitSticker(info, result.bytes.length, STICKER_PROFILE.metadataReserveBytes);
      const { author, pack } = job;
      return Object.freeze({ ...result, ...info, chunks: undefined, backend, mime: 'image/webp', author, pack, elapsedMs: performance.now() - started });
    },
    async dispose() { closed = true; await Promise.all([browser?.dispose(), standalone?.dispose()]); },
  };
}
let defaultRuntime;
export async function createSticker(input, job) { defaultRuntime ??= createStickerRuntime(); return defaultRuntime.createSticker(input, job); }
export async function disposeStickerRuntime() { const runtime = defaultRuntime; defaultRuntime = undefined; await runtime?.dispose(); }
