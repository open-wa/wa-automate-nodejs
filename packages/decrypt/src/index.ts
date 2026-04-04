/**
 * @open-wa/decrypt — WhatsApp media decryption with zero external dependencies.
 *
 * All crypto uses node:crypto builtins (hkdfSync, createDecipheriv).
 * HTTP fetching uses the global fetch API (Bun/Node 18+).
 */

export { decryptMedia } from './decrypt.js';
export { bleachMessage } from './bleach.js';
export type {
  DecryptableMessage,
  RequiredDecryptionMessage,
  DecryptOptions,
} from './types.js';
export { mediaTypes, MissingCriticalDataError } from './constants.js';
