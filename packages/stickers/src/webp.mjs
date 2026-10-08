import { StickerError } from './errors.mjs';

const ascii = (bytes, offset, length = 4) => String.fromCharCode(...bytes.subarray(offset, offset + length));
const read24 = (bytes, offset) => bytes[offset] | bytes[offset + 1] << 8 | bytes[offset + 2] << 16;

/** Strict RIFF parsing shared by rendering and privately owned metadata finalization. */
export function parseWebp(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.length < 20 || ascii(bytes, 0) !== 'RIFF' || ascii(bytes, 8) !== 'WEBP') {
    throw new StickerError('INVALID_INPUT', 'Expected a RIFF WebP container.');
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint32(4, true) + 8 !== bytes.length) throw new StickerError('INVALID_INPUT', 'WebP RIFF length does not match the input.');
  const chunks = [];
  let offset = 12, width = 0, height = 0, animated = false, alpha = false, frames = 0, durationMs = 0, loopCount = 0;
  while (offset < bytes.length) {
    if (offset + 8 > bytes.length) throw new StickerError('INVALID_INPUT', 'Truncated WebP chunk header.');
    const id = ascii(bytes, offset), length = view.getUint32(offset + 4, true);
    const end = offset + 8 + length + (length & 1);
    if (end > bytes.length) throw new StickerError('INVALID_INPUT', 'Truncated WebP chunk.', { chunk: id });
    const data = bytes.subarray(offset + 8, offset + 8 + length);
    if (id === 'VP8X') {
      if (length !== 10 || chunks.length) throw new StickerError('INVALID_INPUT', 'Invalid WebP extended header.');
      width = read24(data, 4) + 1; height = read24(data, 7) + 1;
      animated = !!(data[0] & 2); alpha = !!(data[0] & 16);
    } else if (id === 'VP8L') {
      if (length < 5 || data[0] !== 0x2f) throw new StickerError('INVALID_INPUT', 'Invalid lossless WebP image.');
      const bits = new DataView(data.buffer, data.byteOffset, data.byteLength).getUint32(1, true);
      if (!width) { width = (bits & 0x3fff) + 1; height = ((bits >>> 14) & 0x3fff) + 1; }
      alpha ||= !!(bits & 0x10000000);
    } else if (id === 'VP8 ') {
      if (length < 10 || data[3] !== 0x9d || data[4] !== 0x01 || data[5] !== 0x2a) throw new StickerError('INVALID_INPUT', 'Invalid lossy WebP image.');
      if (!width) { width = (data[6] | data[7] << 8) & 0x3fff; height = (data[8] | data[9] << 8) & 0x3fff; }
    } else if (id === 'ANIM') {
      if (length !== 6 || !animated || chunks.some(c => c.id === 'ANIM')) throw new StickerError('INVALID_INPUT', 'Invalid animation control chunk.');
      loopCount = data[4] | data[5] << 8;
    } else if (id === 'ANMF') {
      if (length < 24 || !animated || !chunks.some(c => c.id === 'ANIM')) throw new StickerError('INVALID_INPUT', 'Invalid animation frame.');
      const x = read24(data, 0) * 2, y = read24(data, 3) * 2;
      const w = read24(data, 6) + 1, h = read24(data, 9) + 1;
      if (x + w > width || y + h > height) throw new StickerError('INVALID_INPUT', 'Animation frame exceeds the WebP canvas.');
      if (data[15] & 0xfc) throw new StickerError('INVALID_INPUT', 'Animation frame has reserved flags.');
      const frame = parseWebp(writeWebp([data.subarray(16)]));
      if (frame.animated || frame.width !== w || frame.height !== h || frame.chunks.some(c => !['ALPH','VP8 ','VP8L'].includes(c.id))) throw new StickerError('INVALID_INPUT', 'Invalid animation image payload.');
      frames++; durationMs += read24(data, 12);
    } else if (id === 'ALPH') alpha = true;
    chunks.push({ id, data, raw: bytes.subarray(offset, end) });
    offset = end;
  }
  if (!width || !height || (animated ? !frames : !chunks.some(c => c.id === 'VP8 ' || c.id === 'VP8L'))) {
    throw new StickerError('INVALID_INPUT', 'WebP contains no usable image.');
  }
  if (!animated && chunks.some(c => c.id === 'ANIM' || c.id === 'ANMF')) throw new StickerError('INVALID_INPUT', 'Inconsistent WebP animation flags.');
  return { width, height, animated, alpha, frames: animated ? frames : 1, durationMs, loopCount, chunks };
}

export function riffChunk(id, data) {
  const result = new Uint8Array(8 + data.length + (data.length & 1));
  result.set(new TextEncoder().encode(id));
  new DataView(result.buffer).setUint32(4, data.length, true);
  result.set(data, 8);
  return result;
}

export function joinBytes(parts) {
  const result = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
  let offset = 0;
  for (const part of parts) { result.set(part, offset); offset += part.length; }
  return result;
}

export function writeWebp(chunks) {
  const body = joinBytes(chunks), result = new Uint8Array(12 + body.length);
  result.set(new TextEncoder().encode('RIFF'));
  new DataView(result.buffer).setUint32(4, result.length - 8, true);
  result.set(new TextEncoder().encode('WEBP'), 8); result.set(body, 12);
  return result;
}
