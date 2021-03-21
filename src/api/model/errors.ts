export class PageEvaluationTimeout extends Error {
    constructor(...args) {
        super(...args);
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, PageEvaluationTimeout);
        }
        this.name = 'PageEvaluationTimeout';
        this.message =
            'The method call was timed out but it may have been successfull in the WA session. It is just no longer holding up the process';
    }
}

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
    BAD_STICKER_METADATA = "BAD_STICKER_METADATA",
    /**
     * Unable to send text
     */
    SENDTEXT_FAILURE = "SENDTEXT_FAILURE",
    /**
     * Label does not exist
     */
     INVALID_LABEL = 'INVALID_LABEL'
}

/**
 * A simple custom error class that takes the first parameter as the name using the [[ERROR_NAME]] enum
 */
export class CustomError extends Error {
  constructor(name:ERROR_NAME, message?: string, ...params : any[]) {
    super(...[
      message,
      ...params])
    this.name = name
    this.message = message
  }
}

/**
 * Add Participants Status Code Enum
 */
export enum AddParticipantErrorStatusCode {
  /**
   * Participant could not be added to group because they are already in the group
   */
  ALREADY_IN_GROUP = 409,
  /**
   * Participant could not be added to group because their privacy settings do not allow you to add them.
   */
  PRIVACY_SETTINGS = 403,
  /**
   * Participant could not be added to group because they recently left.
   */
  RECENTLY_LEFT = 408,
  /**
   * Participant could not be added to group because the group is full
   */
  // GROUP_FULL = ???;
}
export class AddParticipantError extends Error {
  data: {
    [contactId : string] : number
  };
  constructor(message : string, data ?: {
    [contactId: string] : number
  }){
    super();
    this.name = "ADD_PARTICIPANTS_ERROR";
    this.message = message;
    this.data = data
  }
}