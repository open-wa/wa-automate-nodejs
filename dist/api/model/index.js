"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.STATE = exports.Events = exports.Status = void 0;
__exportStar(require("./chat"), exports);
__exportStar(require("./contact"), exports);
__exportStar(require("./message"), exports);
__exportStar(require("./errors"), exports);
/**
 * Client status
 * @readonly
 * @enum {number}
 */
var Status;
(function (Status) {
    Status[Status["INITIALIZING"] = 0] = "INITIALIZING";
    Status[Status["AUTHENTICATING"] = 1] = "AUTHENTICATING";
    Status[Status["READY"] = 3] = "READY";
})(Status = exports.Status || (exports.Status = {}));
;
/**
 * Events that can be emitted by the client
 * @readonly
 * @enum {string}
 */
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
/**
 * The state of the WA Web session. You can listen to session state changes using [[onStateChanged]]. Just to be clear, some of these states aren't understood completely.
 * @readonly
 * @enum {string}
 */
var STATE;
(function (STATE) {
    /**
     * Another WA web session has been opened for this account somewhere else.
     */
    STATE["CONFLICT"] = "CONFLICT";
    /**
     * The session is successfully connected and ready to send and receive messages.
     */
    STATE["CONNECTED"] = "CONNECTED";
    /**
     * WA web updates every fortnight (or so). This state would be emitted then.
     */
    STATE["DEPRECATED_VERSION"] = "DEPRECATED_VERSION";
    /**
     * This probably shows up when reloading an already authenticated session.
     */
    STATE["OPENING"] = "OPENING";
    /**
     * This probably shows up immediately after the QR code is scanned
     */
    STATE["PAIRING"] = "PAIRING";
    /**
     * This state probably represented a block on the proxy address your app is using.
     */
    STATE["PROXYBLOCK"] = "PROXYBLOCK";
    /**
     * This usually shows up when the session has been blocked by WA due to some issue with the browser/user agent. This is a different version of a Terms of Service Block from what we know. It may also show up when the host account is banned.
     */
    STATE["SMB_TOS_BLOCK"] = "SMB_TOS_BLOCK";
    /**
     * The trigger for this state is as of yet unknown
     */
    STATE["TIMEOUT"] = "TIMEOUT";
    /**
     * This usually shows up when the session has been blocked by WA due to some issue with the browser/user agent. It literally stands for Terms of Service Block. It may also show up when the host account is banned.
     */
    STATE["TOS_BLOCK"] = "TOS_BLOCK";
    /**
     * The same (probably replacement) for CONFLICT
     */
    STATE["UNLAUNCHED"] = "UNLAUNCHED";
    /**
     * When `UNPAIRED` the page is waiting for a QR Code scan. If your state becomes `UNPAIRED` then the session is most likely signed out by the host account.
     */
    STATE["UNPAIRED"] = "UNPAIRED";
    /**
     * This state is fired when the QR code has not been scanned for a long time (about 1 minute). On the page it will show "Click to reload QR code"
     */
    STATE["UNPAIRED_IDLE"] = "UNPAIRED_IDLE";
    /**
     * This is fired when the QR code is scanned
     */
    STATE["SYNCING"] = "SYNCING";
    /**
     * This is fired when the connection between web and the host account primary device is disconnected. This is fired frequently to save battery.
     */
    STATE["DISCONNECTED"] = "DISCONNECTED";
})(STATE = exports.STATE || (exports.STATE = {}));
;
__exportStar(require("./config"), exports);
__exportStar(require("./media"), exports);
__exportStar(require("./aliases"), exports);
