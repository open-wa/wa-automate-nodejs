"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddParticipantError = exports.AddParticipantErrorStatusCode = exports.CustomError = exports.ERROR_NAME = exports.SessionExpiredError = exports.PageEvaluationTimeout = void 0;
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
class SessionExpiredError extends Error {
    constructor() {
        super("This session has been deauthenticated!");
        this.name = "SessionExpiredError";
    }
}
exports.SessionExpiredError = SessionExpiredError;
var ERROR_NAME;
(function (ERROR_NAME) {
    ERROR_NAME["STICKER_TOO_LARGE"] = "STICKER_TOO_LARGE";
    ERROR_NAME["MISSING_URL"] = "MISSING_URL";
    ERROR_NAME["PAGE_CLOSED"] = "PAGE_CLOSED";
    ERROR_NAME["STATE_ERROR"] = "STATE_ERROR";
    ERROR_NAME["NOT_MEDIA"] = "NOT_MEDIA";
    ERROR_NAME["MEDIA_MISSING"] = "MEDIA_MISSING";
    ERROR_NAME["STICKER_NOT_DECRYPTED"] = "STICKER_NOT_DECRYPTED";
    ERROR_NAME["FILE_NOT_FOUND"] = "FILE_NOT_FOUND";
    ERROR_NAME["BAD_STICKER_METADATA"] = "BAD_STICKER_METADATA";
    ERROR_NAME["SENDTEXT_FAILURE"] = "SENDTEXT_FAILURE";
    ERROR_NAME["INVALID_LABEL"] = "INVALID_LABEL";
})(ERROR_NAME || (exports.ERROR_NAME = ERROR_NAME = {}));
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
var AddParticipantErrorStatusCode;
(function (AddParticipantErrorStatusCode) {
    AddParticipantErrorStatusCode[AddParticipantErrorStatusCode["ALREADY_IN_GROUP"] = 409] = "ALREADY_IN_GROUP";
    AddParticipantErrorStatusCode[AddParticipantErrorStatusCode["PRIVACY_SETTINGS"] = 403] = "PRIVACY_SETTINGS";
    AddParticipantErrorStatusCode[AddParticipantErrorStatusCode["RECENTLY_LEFT"] = 408] = "RECENTLY_LEFT";
    AddParticipantErrorStatusCode[AddParticipantErrorStatusCode["GROUP_FULL"] = 500] = "GROUP_FULL";
})(AddParticipantErrorStatusCode || (exports.AddParticipantErrorStatusCode = AddParticipantErrorStatusCode = {}));
class AddParticipantError extends Error {
    constructor(message, data) {
        super();
        this.name = "ADD_PARTICIPANTS_ERROR";
        this.message = message;
        this.data = data;
    }
}
exports.AddParticipantError = AddParticipantError;
//# sourceMappingURL=errors.js.map