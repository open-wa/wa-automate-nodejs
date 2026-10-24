/**
 * Core crypto routines for WhatsApp media decryption.
 *
 * Uses only `node:crypto` builtins — no external HKDF library needed.
 * `crypto.hkdfSync` landed in Node 15 and is available in Bun.
 */
import { createDecipheriv, createHmac, hkdfSync, timingSafeEqual } from 'node:crypto';

import { mediaTypes } from './constants';

/**
 * Derive the AES-256-CBC key and IV from the media key using HKDF-SHA256,
 * then decrypt the ciphertext.
 */
export function decryptBuffer(
  encryptedData: Uint8Array,
  mediaKeyBase64: string,
  mediaType: string,
  expectedSize?: number,
  mimetype?: string,
): Buffer {
  if (encryptedData.length < 26 || (encryptedData.length - 10) % 16 !== 0) {
    throw new Error('Encrypted media has an invalid ciphertext or authentication tag length.');
  }
  const ciphertext = encryptedData.subarray(0, encryptedData.length - 10);
  const tag = encryptedData.subarray(encryptedData.length - 10);
  const mediaKeyBytes = Buffer.from(mediaKeyBase64, 'base64');

  // Resolve the info string: "WhatsApp <Type> Keys"
  const typeKey =
    mediaTypes[mediaType.toUpperCase()] ??
    mediaTypes[
      Object.keys(mediaTypes).find((t) =>
        mimetype?.includes(t.toLowerCase()),
      ) ?? ''
    ];

  const info = `WhatsApp ${typeKey} Keys`;

  // HKDF expand to 112 bytes (iv=16 + cipherKey=32 + macKey=32 + refKey=32)
  const expanded = Buffer.from(
    hkdfSync('sha256', mediaKeyBytes, Buffer.alloc(32), info, 112),
  );

  const iv = expanded.subarray(0, 16);
  const cipherKey = expanded.subarray(16, 48);
  const macKey = expanded.subarray(48, 80);
  const expectedTag = createHmac('sha256', macKey).update(iv).update(ciphertext).digest().subarray(0, 10);
  if (!timingSafeEqual(expectedTag, tag)) {
    throw new Error('Encrypted media authentication failed.');
  }

  const decipher = createDecipheriv('aes-256-cbc', cipherKey, iv);
  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  if (expectedSize !== undefined && decrypted.length !== expectedSize) {
    throw new Error('Decrypted media size does not match the message.');
  }
  return decrypted;
}
