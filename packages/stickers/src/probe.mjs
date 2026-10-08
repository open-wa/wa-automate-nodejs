import { StickerError } from './errors.mjs';
import { STICKER_PROFILE } from './profile.mjs';
import { parseWebp } from './webp.mjs';

export function probeInput(input) {
  const { bytes, mime } = input;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let width, height, animated = false;
  if (mime === 'image/webp') ({ width, height, animated } = parseWebp(bytes));
  else if (mime === 'image/png') {
    if (bytes.length < 33) throw new StickerError('INVALID_INPUT', 'Truncated PNG header.');
    width = view.getUint32(16); height = view.getUint32(20);
    for (let at = 8; at + 12 <= bytes.length;) {
      const size = view.getUint32(at);
      if (at + size + 12 > bytes.length) throw new StickerError('INVALID_INPUT', 'Truncated PNG chunk.');
      const name = String.fromCharCode(...bytes.subarray(at + 4, at + 8));
      if (name === 'acTL') animated = true;
      if (name === 'IDAT') break;
      at += size + 12;
    }
  } else if (mime === 'image/gif') {
    if (bytes.length < 10) throw new StickerError('INVALID_INPUT', 'Truncated GIF header.');
    width = view.getUint16(6, true); height = view.getUint16(8, true); animated = true;
  } else if (mime === 'image/jpeg') {
    let at = 2;
    while (at + 4 <= bytes.length) {
      if (bytes[at] !== 255) throw new StickerError('INVALID_INPUT', 'Invalid JPEG marker.');
      while (bytes[at] === 255) at++;
      const marker = bytes[at++];
      if (marker === 0xda || marker === 0xd9) break;
      if (marker === 0xd8 || marker === 1 || (marker >= 0xd0 && marker <= 0xd7)) continue;
      if (at + 2 > bytes.length) break;
      const size = view.getUint16(at);
      if (size < 2 || at + size > bytes.length) throw new StickerError('INVALID_INPUT', 'Truncated JPEG segment.');
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4,0xc8,0xcc].includes(marker)) {
        if (size < 8) throw new StickerError('INVALID_INPUT', 'Invalid JPEG dimensions.');
        height = view.getUint16(at + 3); width = view.getUint16(at + 5); break;
      }
      at += size;
    }
    if (!width || !height) throw new StickerError('INVALID_INPUT', 'JPEG has no usable dimensions.');
  }
  if (width !== undefined && (!width || !height || width * height > STICKER_PROFILE.maxSourcePixels)) throw new StickerError('INPUT_TOO_LARGE', 'Source dimensions exceed the pixel budget.', { width, height });
  return { ...input, width, height, animated };
}
