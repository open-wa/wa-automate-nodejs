export type SendTextErrorCode =
  | 'INVALID_ARGUMENT'
  | 'LICENSE_REQUIRED'
  | 'SEND_REJECTED'
  | 'INVALID_SEND_RESULT'
  | 'SEND_FAILED';

/** An unknown outcome must be reconciled before another send is attempted. */
export type SendTextOutcome = 'not_sent' | 'unknown';

/**
 * A sendText failure. The client never retries a send automatically.
 * When outcome is unknown, WhatsApp may have accepted the message already.
 */
export class SendTextError extends Error {
  override readonly name = 'SendTextError';
  readonly code: SendTextErrorCode;
  readonly outcome: SendTextOutcome;

  constructor(
    message: string,
    options: { code: SendTextErrorCode; outcome: SendTextOutcome; cause?: unknown },
  ) {
    super(message, { cause: options.cause });
    this.code = options.code;
    this.outcome = options.outcome;
  }
}
