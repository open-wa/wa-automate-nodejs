/**
 * Core crypto routines for WhatsApp media decryption.
 *
 * Uses only `node:crypto` builtins — no external HKDF library needed.
 * `crypto.hkdfSync` landed in Node 15 and is available in Bun.
 */
import { createDecipheriv, hkdfSync } from 'node:crypto';

import { mediaTypes } from './constants.js';

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

  const decipher = createDecipheriv('aes-256-cbc', cipherKey, iv);
  // WhatsApp handles padding manually — disable OpenSSL auto-padding
  decipher.setAutoPadding(false);
  const decrypted = Buffer.concat([
    decipher.update(encryptedData),
    decipher.final(),
  ]);

  return expectedSize ? fixPadding(decrypted, expectedSize) : decrypted;
}

/**
 * Correct PKCS#7-style padding that WhatsApp applies inconsistently.
 */
function fixPadding(data: Buffer, expectedSize: number): Buffer {
  const padding = (16 - (expectedSize % 16)) & 0xf;
  if (padding > 0) {
    if (expectedSize + padding === data.length) {
      // Trim trailing padding bytes
      return data.subarray(0, data.length - padding);
    }
    if (data.length + padding === expectedSize) {
      // Append missing padding
      const pad = Buffer.alloc(padding, padding);
      return Buffer.concat([data, pad]);
    }
  }
  return data;
}
