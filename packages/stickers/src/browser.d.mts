import type { BrowserBackend, StickerRuntime } from './index.mjs';
export interface BrowserEvaluator { evaluate<Argument, Result>(fn: (argument: Argument) => Result | Promise<Result>, argument: Argument): Promise<Result>; }
export function createBrowserBackend(driver?: BrowserEvaluator): BrowserBackend;
/** A browser-only runtime using the shared sticker job pipeline. */
export function createBrowserStickerRuntime(driver?: BrowserEvaluator): StickerRuntime;
export { createSticker, listEffects, effectCatalogue, STICKER_PROFILE, validateStickerJob } from './index.mjs';
