/** A sticker send failure; unknown outcomes must be reconciled before retrying. */
export class SendStickerError extends Error {
  override readonly name = 'SendStickerError';
  readonly code: string;
  readonly outcome: 'not_sent' | 'unknown';
  constructor(message: string, options: { code: string; outcome: 'not_sent' | 'unknown'; cause?: unknown }) {
    super(message, { cause: options.cause });
    this.code = options.code; this.outcome = options.outcome;
  }
}
