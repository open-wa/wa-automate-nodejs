"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var MessageTypes;
(function (MessageTypes) {
    MessageTypes["TEXT"] = "chat";
    MessageTypes["AUDIO"] = "audio";
    MessageTypes["VOICE"] = "ptt";
    MessageTypes["IMAGE"] = "image";
    MessageTypes["VIDEO"] = "video";
    MessageTypes["DOCUMENT"] = "document";
    MessageTypes["STICKER"] = "sticker";
    MessageTypes["LOCATION"] = "location";
    MessageTypes["CONTACT_CARD"] = "vcard";
    MessageTypes["CONTACT_CARD_MULTI"] = "multi_vcard";
    MessageTypes["REVOKED"] = "revoked";
    MessageTypes["UNKNOWN"] = "unknown";
})(MessageTypes = exports.MessageTypes || (exports.MessageTypes = {}));
;
var MessageAck;
(function (MessageAck) {
    MessageAck[MessageAck["ACK_ERROR"] = -1] = "ACK_ERROR";
    MessageAck[MessageAck["ACK_PENDING"] = 0] = "ACK_PENDING";
    MessageAck[MessageAck["ACK_SERVER"] = 1] = "ACK_SERVER";
    MessageAck[MessageAck["ACK_DEVICE"] = 2] = "ACK_DEVICE";
    MessageAck[MessageAck["ACK_READ"] = 3] = "ACK_READ";
    MessageAck[MessageAck["ACK_PLAYED"] = 4] = "ACK_PLAYED";
})(MessageAck = exports.MessageAck || (exports.MessageAck = {}));
;
