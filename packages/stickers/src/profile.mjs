import { StickerError } from './errors.mjs';

export const STICKER_PROFILE = Object.freeze({
  version: '1', width: 512, height: 512,
  maxInputBytes: 20 * 1024 * 1024,
  maxSourcePixels: 16_000_000,
  maxFrames: 120, maxDurationMs: 10_000, maxEffects: 8,
  maxStaticBytes: 100_000, maxAnimatedBytes: 512_000,
  metadataReserveBytes: 4096,
});

export function admitSticker(info, bytes, reserve = 0) {
  if (info.width !== 512 || info.height !== 512) {
    throw new StickerError('OUTPUT_REJECTED', 'Stickers must be 512 × 512 pixels.', { width: info.width, height: info.height });
  }
  if (info.frames > STICKER_PROFILE.maxFrames || info.durationMs > STICKER_PROFILE.maxDurationMs) {
    throw new StickerError('OUTPUT_REJECTED', 'Sticker animation exceeds the frame or duration limit.', { frames: info.frames, durationMs: info.durationMs });
  }
  const limit = info.animated ? STICKER_PROFILE.maxAnimatedBytes : STICKER_PROFILE.maxStaticBytes;
  if (bytes + reserve > limit) {
    throw new StickerError('OUTPUT_TOO_LARGE', `Encoded sticker exceeds its ${limit}-byte budget.`, { bytes, reserve, limit });
  }
}
