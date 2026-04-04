/**
 * Strip a message down to the minimum fields needed for decryption.
 *
 * Useful for minimizing sensitive data in transit — removes sender info,
 * chat context, etc.
 */

const BLEACH_KEEP = new Set([
  'type',
  'clientUrl',
  'mimetype',
  'mediaKey',
  'size',
  'filehash',
  'uploadhash',
  'deprecatedMms3Url',
]);

/**
 * Return a copy of the message containing only the fields required for decryption.
 */
export function bleachMessage<T extends Record<string, unknown>>(
  message: T,
): Partial<T> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(message)) {
    if (BLEACH_KEEP.has(key)) {
      result[key] = message[key];
    }
  }
  return result as Partial<T>;
}
