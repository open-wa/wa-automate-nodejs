"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.STATE = exports.Events = exports.Status = void 0;
var Status;
(function (Status) {
    Status[Status["INITIALIZING"] = 0] = "INITIALIZING";
    Status[Status["AUTHENTICATING"] = 1] = "AUTHENTICATING";
    Status[Status["READY"] = 3] = "READY";
})(Status = exports.Status || (exports.Status = {}));
;
var Events;
(function (Events) {
    Events["AUTHENTICATED"] = "authenticated";
    Events["AUTHENTICATION_FAILURE"] = "auth_failure";
    Events["READY"] = "ready";
    Events["MESSAGE_RECEIVED"] = "message";
    Events["MESSAGE_CREATE"] = "message_create";
    Events["MESSAGE_REVOKED_EVERYONE"] = "message_revoke_everyone";
    Events["MESSAGE_REVOKED_ME"] = "message_revoke_me";
    Events["MESSAGE_ACK"] = "message_ack";
    Events["GROUP_JOIN"] = "group_join";
    Events["GROUP_LEAVE"] = "group_leave";
    Events["GROUP_UPDATE"] = "group_update";
    Events["QR_RECEIVED"] = "qr";
    Events["DISCONNECTED"] = "disconnected";
    Events["STATE_CHANGED"] = "change_state";
})(Events = exports.Events || (exports.Events = {}));
;
var STATE;
(function (STATE) {
    STATE["CONFLICT"] = "CONFLICT";
    STATE["CONNECTED"] = "CONNECTED";
    STATE["DEPRECATED_VERSION"] = "DEPRECATED_VERSION";
    STATE["OPENING"] = "OPENING";
    STATE["PAIRING"] = "PAIRING";
    STATE["PROXYBLOCK"] = "PROXYBLOCK";
    STATE["SMB_TOS_BLOCK"] = "SMB_TOS_BLOCK";
    STATE["TIMEOUT"] = "TIMEOUT";
    STATE["TOS_BLOCK"] = "TOS_BLOCK";
    STATE["UNLAUNCHED"] = "UNLAUNCHED";
    STATE["UNPAIRED"] = "UNPAIRED";
    STATE["UNPAIRED_IDLE"] = "UNPAIRED_IDLE";
})(STATE = exports.STATE || (exports.STATE = {}));
;
__exportStar(require("./config"), exports);
