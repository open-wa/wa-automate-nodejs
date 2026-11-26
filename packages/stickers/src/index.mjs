import { renderSticker } from './render.mjs';
import { STICKER_PROFILE } from './profile.mjs';
import { StickerError } from './errors.mjs';
import { createBrowserBackend } from './browser.mjs';
import { manageStickerRuntime } from './lifecycle.mjs';
export { StickerError, STICKER_PROFILE };
export { listEffects, effectCatalogue } from './catalogue.mjs';
export { resourceManifest } from './resources.mjs';
export { validateStickerJob } from './planner.mjs';

const localRequirements = ['canvas2d','encode:image/webp',...['image/png','image/jpeg','image/gif','image/webp'].map(mime=>`decode:${mime}`),...['image/png','image/gif','image/webp'].map(mime=>`animation:${mime}`),...['invert','grayscale','stereo','dilate','erode','bayer'].map(name=>`kernel:${name}`),'font:sans','font:serif','font:mono'];

export function createStickerRuntime(options = {}) {
  const node = typeof process !== 'undefined' && !!process.versions?.node;
  return manageStickerRuntime(() => {
    const browser = options.browser || (!node ? createBrowserBackend() : undefined);
    let standalone;
    return {
      async createSticker(input, job) {
        const render = source => renderSticker(source, job, {
          browser, standalone: { available: node, requirements: localRequirements },
          getStandalone() {
            standalone ??= import('./library.mjs').then(({ createLibraryBackend }) =>
              createLibraryBackend({ cacheDirectory: options.cacheDirectory, offline: options.offline }))
              .catch(error => { standalone = undefined; throw error; });
            return standalone;
          },
        });
        try { return await render(input); }
        catch (error) {
          // A video the browser cannot decode, such as HEVC, is converted once with the system's ffmpeg.
          if (!node || error?.code !== 'VIDEO_UNDECODABLE') throw error;
          const [{ convertVideo }, { resolveInput }] = await Promise.all([import('./ffmpeg.mjs'), import('./input.mjs')]);
          const { bytes } = await resolveInput(input, job ?? {});
          return render(await convertVideo(bytes, { signal: job?.signal }));
        }
      },
      async dispose() {
        await Promise.all([browser !== options.browser ? browser?.dispose() : undefined, standalone?.then(backend => backend.dispose())]);
      },
    };
  }, node && !options.browser ? 2 : 1, () => options.browser?.dispose());
}
let defaultRuntime;
export async function createSticker(input, job) { defaultRuntime ??= createStickerRuntime(); return defaultRuntime.createSticker(input, job); }
export async function disposeStickerRuntime() { const runtime = defaultRuntime; defaultRuntime = undefined; await runtime?.dispose(); }
