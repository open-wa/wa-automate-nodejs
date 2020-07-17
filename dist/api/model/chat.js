"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatTypes = exports.ChatState = void 0;
var ChatState;
(function (ChatState) {
    ChatState[ChatState["TYPING"] = 0] = "TYPING";
    ChatState[ChatState["RECORDING"] = 1] = "RECORDING";
    ChatState[ChatState["PAUSED"] = 2] = "PAUSED";
})(ChatState = exports.ChatState || (exports.ChatState = {}));
var ChatTypes;
(function (ChatTypes) {
    ChatTypes["SOLO"] = "solo";
    ChatTypes["GROUP"] = "group";
    ChatTypes["UNKNOWN"] = "unknown";
})(ChatTypes = exports.ChatTypes || (exports.ChatTypes = {}));
;
