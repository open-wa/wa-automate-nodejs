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
      createSticker(input, job) {
        return renderSticker(input, job, {
          browser, standalone: { available: node, requirements: localRequirements },
          getStandalone() {
            standalone ??= import('./library.mjs').then(({ createLibraryBackend }) =>
              createLibraryBackend({ cacheDirectory: options.cacheDirectory, offline: options.offline }))
              .catch(error => { standalone = undefined; throw error; });
            return standalone;
          },
        });
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
