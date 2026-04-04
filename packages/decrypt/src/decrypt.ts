/**
 * Main decryptMedia entry point.
 *
 * Downloads the encrypted blob → decrypts with AES-256-CBC via HKDF-derived keys.
 */
import { MissingCriticalDataError, NON_SIZE_TYPES } from './constants.js';
import { decryptBuffer } from './crypto.js';
import { downloadEncryptedMedia } from './download.js';
import type { DecryptableMessage, DecryptOptions } from './types.js';

/**
 * Download and decrypt a WhatsApp media message.
 *
 * @param message — A message object with at least the required decryption fields.
 * @param optionsOrUa — Either a {@link DecryptOptions} object or a legacy user-agent string.
 * @returns The decrypted media as a Buffer.
 *
 * @example
 * ```ts
 * import { decryptMedia } from '@open-wa/decrypt';
 *
 * const buffer = await decryptMedia(message);
 * ```
 */
export async function decryptMedia(
  message: DecryptableMessage,
  optionsOrUa?: DecryptOptions | string,
): Promise<Buffer> {
  // Normalise options — accept legacy string signature for backward compat
  const opts: DecryptOptions =
    typeof optionsOrUa === 'string'
      ? { useragent: optionsOrUa }
      : optionsOrUa ?? {};

  validateMessage(message);

  const url = (message.deprecatedMms3Url ?? message.clientUrl)!.trim();
  const encrypted = await downloadEncryptedMedia(url, opts);

  return decryptBuffer(
    encrypted,
    message.mediaKey,
    message.type,
    message.size,
    message.mimetype,
  );
}

function validateMessage(message: DecryptableMessage): void {
  const missing: string[] = [];

  if (!message.mediaKey) missing.push('mediaKey');
  if (!message.filehash) missing.push('filehash');
  if (!message.mimetype) missing.push('mimetype');
  if (!message.type) missing.push('type');
  if (!message.size) missing.push('size');

  if (missing.length === 0) return;

  // Size-only omission is a warning for non-sticker types, not an error
  if (missing.length === 1 && missing[0] === 'size') {
    if (!NON_SIZE_TYPES.includes(message.type as (typeof NON_SIZE_TYPES)[number])) {
      console.warn(
        '@open-wa/decrypt: size property is missing. File will fail an integrity check.',
      );
    }
    return;
  }

  throw new MissingCriticalDataError(
    `Message is missing critical data: ${missing.join(', ')}`,
  );
}
