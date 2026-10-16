import { createBrowserBackend as backend, createBrowserStickerRuntime as runtime } from './browser-core.mjs';
import { StickerError } from './errors.mjs';
export { listEffects, effectCatalogue } from './catalogue.mjs';
export { STICKER_PROFILE } from './profile.mjs';
export { validateStickerJob } from './planner.mjs';

async function resourceBytes(resource, signal) {
  if (typeof process !== 'undefined' && process.versions?.node) {
    const { cachedResource } = await import('./resource-cache.mjs');
    const { readFile } = await import('node:fs/promises');
    return readFile(await cachedResource(resource, { signal }), { signal });
  }
  const response = await fetch(resource.url, { signal });
  if (!response.ok) throw new StickerError('RESOURCE_UNAVAILABLE', 'Font download failed.');
  const bytes = new Uint8Array(await response.arrayBuffer());
  const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(v => v.toString(16).padStart(2,'0')).join('');
  if (bytes.length !== resource.bytes || hash !== resource.sha256) throw new StickerError('RESOURCE_REJECTED', 'Font does not match its pinned digest.');
  return bytes;
}
async function kernelBytes(signal) {
  const url = new URL('../wasm/kernels.wasm', import.meta.url);
  if (url.protocol === 'file:') { const { readFile } = await import('node:fs/promises'); return readFile(url, { signal }); }
  const response = await fetch(url, { signal });
  if (!response.ok) throw new StickerError('RESOURCE_UNAVAILABLE', 'The shared kernel resource is unavailable.');
  return new Uint8Array(await response.arrayBuffer());
}

export function createBrowserBackend(driver) { return backend(driver, { resourceBytes, kernelBytes }); }
export function createBrowserStickerRuntime(driver) { return runtime(driver, { resourceBytes, kernelBytes }); }
let defaultRuntime;
export function createSticker(input, job) {
  defaultRuntime ??= createBrowserStickerRuntime();
  return defaultRuntime.createSticker(input, job);
}
