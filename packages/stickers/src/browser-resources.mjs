import { StickerError } from './errors.mjs';

export async function webResourceBytes(resource, signal) {
  if (!globalThis.crypto?.subtle) throw new StickerError('SECURE_CONTEXT_REQUIRED', 'Font verification requires a secure browser context. Serve the dashboard over HTTPS.');
  const response = await fetch(resource.url, { signal });
  if (!response.ok) throw new StickerError('RESOURCE_UNAVAILABLE', 'Font download failed.');
  const bytes = new Uint8Array(await response.arrayBuffer());
  const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(value => value.toString(16).padStart(2, '0')).join('');
  if (bytes.length !== resource.bytes || hash !== resource.sha256) throw new StickerError('RESOURCE_REJECTED', 'Font does not match its pinned digest.');
  return bytes;
}

export async function webKernelBytes(signal) {
  const response = await fetch(new URL('../wasm/kernels.wasm', import.meta.url), { signal });
  if (!response.ok) throw new StickerError('RESOURCE_UNAVAILABLE', 'The shared kernel resource is unavailable.');
  return new Uint8Array(await response.arrayBuffer());
}
