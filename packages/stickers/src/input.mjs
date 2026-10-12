import { StickerError, abortIfRequested } from './errors.mjs';
import { STICKER_PROFILE } from './profile.mjs';

export function sniffMime(bytes) {
  const text = (start, count) => String.fromCharCode(...bytes.subarray(start, start + count));
  if (bytes[0] === 0x89 && text(1, 3) === 'PNG') return 'image/png';
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (text(0, 4) === 'GIF8') return 'image/gif';
  if (text(0, 4) === 'RIFF' && text(8, 4) === 'WEBP') return 'image/webp';
  if (text(4, 4) === 'ftyp') return text(8, 4).startsWith('avi') ? 'image/avif' : 'video/mp4';
  throw new StickerError('INVALID_INPUT', 'Supported inputs are PNG, JPEG, GIF, WebP, AVIF or MP4 media.');
}

export async function resolveInput(input, options = {}) {
  abortIfRequested(options.signal);
  let bytes;
  if (input instanceof Uint8Array || input instanceof ArrayBuffer) {
    if (input.byteLength > STICKER_PROFILE.maxInputBytes) throw new StickerError('INPUT_TOO_LARGE', 'Input exceeds the byte limit.');
    bytes = input instanceof Uint8Array ? new Uint8Array(input) : new Uint8Array(input).slice();
  }
  else if (typeof Blob !== 'undefined' && input instanceof Blob) {
    if (input.size > STICKER_PROFILE.maxInputBytes) throw new StickerError('INPUT_TOO_LARGE', 'Input exceeds the byte limit.');
    bytes = new Uint8Array(await input.arrayBuffer());
  } else if (typeof input === 'string' && input.startsWith('data:')) {
    const match = /^data:(?:image|video)\/[\w.+-]+;base64,([A-Za-z0-9+/]*={0,2})$/.exec(input);
    if (!match || match[1].length > Math.ceil(STICKER_PROFILE.maxInputBytes / 3) * 4 || match[1].length % 4) throw new StickerError('INVALID_INPUT', 'Invalid or oversized media data URL.');
    const raw = atob(match[1]); bytes = Uint8Array.from(raw, char => char.charCodeAt(0));
  } else if (typeof input === 'string' && /^https?:\/\//.test(input)) {
    const response = await fetch(input, { signal: options.signal });
    if (!response.ok) throw new StickerError('INPUT_UNAVAILABLE', `Input request returned HTTP ${response.status}.`);
    if (Number(response.headers.get('content-length')) > STICKER_PROFILE.maxInputBytes) throw new StickerError('INPUT_TOO_LARGE', 'Input exceeds the byte limit.');
    const reader = response.body?.getReader();
    if (!reader) throw new StickerError('INPUT_UNAVAILABLE', 'Input response has no readable body.');
    const parts = []; let size = 0;
    try {
      while (true) {
        abortIfRequested(options.signal);
        const { value, done } = await reader.read(); if (done) break;
        size += value.length;
        if (size > STICKER_PROFILE.maxInputBytes) throw new StickerError('INPUT_TOO_LARGE', 'Input exceeds the byte limit.');
        parts.push(value);
      }
    } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
    bytes = new Uint8Array(size); let at = 0;
    for (const part of parts) { bytes.set(part, at); at += part.length; }
  } else if (typeof input === 'string') {
    if (typeof process === 'undefined' || !process.versions?.node) throw new StickerError('INVALID_INPUT', 'Browser inputs must be bytes, a Blob or a media data URL.');
    const { open } = await import('node:fs/promises');
    const file = await open(input, 'r');
    try {
      const stat = await file.stat();
      if (!stat.isFile() || stat.size > STICKER_PROFILE.maxInputBytes) throw new StickerError('INPUT_TOO_LARGE', 'Input is not a bounded regular file.');
      const buffer = new Uint8Array(stat.size + 1); let at = 0;
      while (at < buffer.length) {
        const { bytesRead } = await file.read(buffer, at, buffer.length - at, at);
        if (!bytesRead) break; at += bytesRead;
      }
      if (at > STICKER_PROFILE.maxInputBytes || at > stat.size) throw new StickerError('INPUT_TOO_LARGE', 'Input changed or exceeded its byte limit.');
      bytes = buffer.subarray(0, at);
    } finally { await file.close(); }
  } else throw new StickerError('INVALID_INPUT', 'Supply image bytes, a Blob, media data URL, URL or local filename.');
  if (!bytes.length || bytes.length > STICKER_PROFILE.maxInputBytes) throw new StickerError('INPUT_TOO_LARGE', 'Input is empty or exceeds the byte limit.');
  abortIfRequested(options.signal);
  return { bytes, mime: sniffMime(bytes) };
}
