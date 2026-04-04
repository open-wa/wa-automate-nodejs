/** Mapping from message type to WhatsApp's internal media-type key name. */
export const mediaTypes: Record<string, string> = {
  IMAGE: 'Image',
  VIDEO: 'Video',
  AUDIO: 'Audio',
  PTT: 'Audio',
  DOCUMENT: 'Document',
  STICKER: 'Image',
} as const;

/** Message types where a missing `size` field is tolerable. */
export const NON_SIZE_TYPES = ['sticker'] as const;

/** The default user-agent used for fetching encrypted media blobs. */
export const DEFAULT_USER_AGENT =
  'WhatsApp/2.16.352 Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.92 Safari/537.36';

/** Thrown when a message is missing fields required for decryption. */
export class MissingCriticalDataError extends Error {
  override readonly name = 'MissingCriticalDataError';

  constructor(message: string) {
    super(message);
  }
}
