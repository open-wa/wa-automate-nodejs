/**
 * Enum of error names specific to this library
 */
export enum ERROR_NAME {
    /**
     * The sticker file exceeds the maximum 1MB limit
     */
    STICKER_TOO_LARGE = "STICKER_TOO_LARGE",
    /**
     * An expected URL is missing
     */
    MISSING_URL = "MISSING_URL",
    /**
     * The puppeteer page has been closed or the client has lost the connection with the page. This can happen if your computer/server has gone to sleep and waken up. Please restart your session.
     */
    PAGE_CLOSED = "PAGE_CLOSED",
    /**
     * The client state is preventing the command from completing.
     */
    STATE_ERROR = "STATE_ERROR",
    /**
     * The message is not a media message.
     */
    NOT_MEDIA = "NOT_MEDIA",
    /**
     * Expected media is missing.
     */
    MEDIA_MISSING = "MEDIA_MISSING",
    /**
     * The attempt to decrypt a sticker message has failed.
     */
    STICKER_NOT_DECRYPTED = "STICKER_NOT_DECRYPTED",
    /**
     * File was not found at given path.
     */
    FILE_NOT_FOUND = "FILE_NOT_FOUND",
    /**
     * The sticker metadata parameter is wrong.
     */
    STICKERMETADATA_ERROR = "STICKERMETADATA_ERROR"
}

/**
 * A simple custom error class that takes the first parameter as the name using the [[ERROR_NAME]] enum
 */
export class CustomError extends Error {
  constructor(name:ERROR_NAME, ...params) {
    super(...params)
    this.name = name
  }
}