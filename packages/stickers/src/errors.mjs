export class StickerError extends Error {
  constructor(code, message, detail = {}, cause) {
    super(message, cause === undefined ? undefined : { cause });
    this.name = 'StickerError';
    this.code = code;
    this.detail = Object.freeze({ ...detail });
  }
}

export function abortIfRequested(signal) {
  if (signal?.aborted) throw new StickerError('CANCELLED', 'Sticker creation was cancelled.');
}
