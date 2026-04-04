/**
 * Type definitions for decryptable WhatsApp media messages.
 *
 * Self-contained — no external type deps like type-fest or wa-automate-types-only.
 */

/**
 * Utility type: at least one of the specified keys must be present.
 * Replaces the `type-fest` RequireAtLeastOne import.
 */
type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<
  T,
  Exclude<keyof T, Keys>
> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];

/** The absolute minimum fields needed for decryption. */
export interface RequiredDecryptionMessage {
  mediaKey: string;
  filehash: string;
  mimetype: string;
  type: string;
  size: number;
}

/**
 * A message with enough data to download + decrypt the media attachment.
 * At least one of `clientUrl` or `deprecatedMms3Url` must be present.
 */
export type DecryptableMessage = RequireAtLeastOne<
  {
    clientUrl?: string;
    deprecatedMms3Url?: string;
  },
  'clientUrl' | 'deprecatedMms3Url'
> &
  RequiredDecryptionMessage;

/** Options for the decryptMedia function. */
export interface DecryptOptions {
  /** Custom User-Agent header for the download request. */
  useragent?: string;
  /** Maximum number of retry attempts for the download (default: 3). */
  maxRetries?: number;
  /** Delay in ms between retries (default: 2000). */
  retryDelay?: number;
}
