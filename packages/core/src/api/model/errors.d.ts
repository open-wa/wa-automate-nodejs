export declare class PageEvaluationTimeout extends Error {
    constructor(...args: any[]);
}
export declare class SessionExpiredError extends Error {
    constructor();
}
export declare enum ERROR_NAME {
    STICKER_TOO_LARGE = "STICKER_TOO_LARGE",
    MISSING_URL = "MISSING_URL",
    PAGE_CLOSED = "PAGE_CLOSED",
    STATE_ERROR = "STATE_ERROR",
    NOT_MEDIA = "NOT_MEDIA",
    MEDIA_MISSING = "MEDIA_MISSING",
    STICKER_NOT_DECRYPTED = "STICKER_NOT_DECRYPTED",
    FILE_NOT_FOUND = "FILE_NOT_FOUND",
    BAD_STICKER_METADATA = "BAD_STICKER_METADATA",
    SENDTEXT_FAILURE = "SENDTEXT_FAILURE",
    INVALID_LABEL = "INVALID_LABEL"
}
export declare class CustomError extends Error {
    constructor(name: ERROR_NAME, message?: string, ...params: any[]);
}
export declare enum AddParticipantErrorStatusCode {
    ALREADY_IN_GROUP = 409,
    PRIVACY_SETTINGS = 403,
    RECENTLY_LEFT = 408,
    GROUP_FULL = 500
}
export declare class AddParticipantError extends Error {
    data: {
        [contactId: string]: number;
    };
    constructor(message: string, data?: {
        [contactId: string]: number;
    });
}
//# sourceMappingURL=errors.d.ts.map