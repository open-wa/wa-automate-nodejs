"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatMuteDuration = exports.ChatTypes = exports.ChatState = void 0;
/**
 * The ChatState represents the state you'd normally see represented under the chat name in the app.
 */
var ChatState;
(function (ChatState) {
    /**
     * `typing...`
     */
    ChatState[ChatState["TYPING"] = 0] = "TYPING";
    /**
     * `recording audio...`
     */
    ChatState[ChatState["RECORDING"] = 1] = "RECORDING";
    /**
     * `online`
     */
    ChatState[ChatState["PAUSED"] = 2] = "PAUSED";
})(ChatState = exports.ChatState || (exports.ChatState = {}));
/**
 * Chat types
 * @readonly
 * @enum {string}
 */
var ChatTypes;
(function (ChatTypes) {
    ChatTypes["SOLO"] = "solo";
    ChatTypes["GROUP"] = "group";
    ChatTypes["UNKNOWN"] = "unknown";
})(ChatTypes = exports.ChatTypes || (exports.ChatTypes = {}));
/**
 * Valid durations for muting a chat using [[muteChat]]
 *
 * @readonly
 */
var ChatMuteDuration;
(function (ChatMuteDuration) {
    /**
     * Mutes chat for 8 hours
     */
    ChatMuteDuration["EIGHT_HOURS"] = "EIGHT_HOURS";
    /**
     * Mutes chat for 1 week
     */
    ChatMuteDuration["ONE_WEEK"] = "ONE_WEEK";
    /**
     * Mutes chat forever
     */
    ChatMuteDuration["FOREVER"] = "FOREVER";
})(ChatMuteDuration = exports.ChatMuteDuration || (exports.ChatMuteDuration = {}));
