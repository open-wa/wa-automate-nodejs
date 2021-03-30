"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddParticipantError = exports.AddParticipantErrorStatusCode = exports.CustomError = exports.ERROR_NAME = exports.PageEvaluationTimeout = void 0;
class PageEvaluationTimeout extends Error {
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
exports.PageEvaluationTimeout = PageEvaluationTimeout;
/**
 * Enum of error names specific to this library
 */
var ERROR_NAME;
(function (ERROR_NAME) {
    /**
     * The sticker file exceeds the maximum 1MB limit
     */
    ERROR_NAME["STICKER_TOO_LARGE"] = "STICKER_TOO_LARGE";
    /**
     * An expected URL is missing
     */
    ERROR_NAME["MISSING_URL"] = "MISSING_URL";
    /**
     * The puppeteer page has been closed or the client has lost the connection with the page. This can happen if your computer/server has gone to sleep and waken up. Please restart your session.
     */
    ERROR_NAME["PAGE_CLOSED"] = "PAGE_CLOSED";
    /**
     * The client state is preventing the command from completing.
     */
    ERROR_NAME["STATE_ERROR"] = "STATE_ERROR";
    /**
     * The message is not a media message.
     */
    ERROR_NAME["NOT_MEDIA"] = "NOT_MEDIA";
    /**
     * Expected media is missing.
     */
    ERROR_NAME["MEDIA_MISSING"] = "MEDIA_MISSING";
    /**
     * The attempt to decrypt a sticker message has failed.
     */
    ERROR_NAME["STICKER_NOT_DECRYPTED"] = "STICKER_NOT_DECRYPTED";
    /**
     * File was not found at given path.
     */
    ERROR_NAME["FILE_NOT_FOUND"] = "FILE_NOT_FOUND";
    /**
     * The sticker metadata parameter is wrong.
     */
    ERROR_NAME["BAD_STICKER_METADATA"] = "BAD_STICKER_METADATA";
    /**
     * Unable to send text
     */
    ERROR_NAME["SENDTEXT_FAILURE"] = "SENDTEXT_FAILURE";
    /**
     * Label does not exist
     */
    ERROR_NAME["INVALID_LABEL"] = "INVALID_LABEL";
})(ERROR_NAME = exports.ERROR_NAME || (exports.ERROR_NAME = {}));
/**
 * A simple custom error class that takes the first parameter as the name using the [[ERROR_NAME]] enum
 */
class CustomError extends Error {
    constructor(name, message, ...params) {
        super(...[
            message,
            ...params
        ]);
        this.name = name;
        this.message = message;
    }
}
exports.CustomError = CustomError;
/**
 * Add Participants Status Code Enum
 */
var AddParticipantErrorStatusCode;
(function (AddParticipantErrorStatusCode) {
    /**
     * Participant could not be added to group because they are already in the group
     */
    AddParticipantErrorStatusCode[AddParticipantErrorStatusCode["ALREADY_IN_GROUP"] = 409] = "ALREADY_IN_GROUP";
    /**
     * Participant could not be added to group because their privacy settings do not allow you to add them.
     */
    AddParticipantErrorStatusCode[AddParticipantErrorStatusCode["PRIVACY_SETTINGS"] = 403] = "PRIVACY_SETTINGS";
    /**
     * Participant could not be added to group because they recently left.
     */
    AddParticipantErrorStatusCode[AddParticipantErrorStatusCode["RECENTLY_LEFT"] = 408] = "RECENTLY_LEFT";
    /**
     * Participant could not be added to group because the group is full
     */
    AddParticipantErrorStatusCode[AddParticipantErrorStatusCode["GROUP_FULL"] = 500] = "GROUP_FULL";
})(AddParticipantErrorStatusCode = exports.AddParticipantErrorStatusCode || (exports.AddParticipantErrorStatusCode = {}));
class AddParticipantError extends Error {
    constructor(message, data) {
        super();
        this.name = "ADD_PARTICIPANTS_ERROR";
        this.message = message;
        this.data = data;
    }
}
exports.AddParticipantError = AddParticipantError;
