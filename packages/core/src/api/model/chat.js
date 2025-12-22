"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatMuteDuration = exports.ChatTypes = exports.ChatState = void 0;
var ChatState;
(function (ChatState) {
    ChatState[ChatState["TYPING"] = 0] = "TYPING";
    ChatState[ChatState["RECORDING"] = 1] = "RECORDING";
    ChatState[ChatState["PAUSED"] = 2] = "PAUSED";
})(ChatState || (exports.ChatState = ChatState = {}));
var ChatTypes;
(function (ChatTypes) {
    ChatTypes["SOLO"] = "solo";
    ChatTypes["GROUP"] = "group";
    ChatTypes["UNKNOWN"] = "unknown";
})(ChatTypes || (exports.ChatTypes = ChatTypes = {}));
var ChatMuteDuration;
(function (ChatMuteDuration) {
    ChatMuteDuration["EIGHT_HOURS"] = "EIGHT_HOURS";
    ChatMuteDuration["ONE_WEEK"] = "ONE_WEEK";
    ChatMuteDuration["FOREVER"] = "FOREVER";
})(ChatMuteDuration || (exports.ChatMuteDuration = ChatMuteDuration = {}));
//# sourceMappingURL=chat.js.map