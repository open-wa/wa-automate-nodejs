"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CallState = void 0;
var CallState;
(function (CallState) {
    CallState["INCOMING_RING"] = "INCOMING_RING";
    CallState["OUTGOING_RING"] = "OUTGOING_RING";
    CallState["OUTGOING_CALLING"] = "OUTGOING_CALLING";
    CallState["CONNECTING"] = "CONNECTING";
    CallState["CONNECTION_LOST"] = "CONNECTION_LOST";
    CallState["ACTIVE"] = "ACTIVE";
    CallState["HANDLED_REMOTELY"] = "HANDLED_REMOTELY";
    CallState["ENDED"] = "ENDED";
    CallState["REJECTED"] = "REJECTED";
    CallState["REMOTE_CALL_IN_PROGRESS"] = "REMOTE_CALL_IN_PROGRESS";
    CallState["FAILED"] = "FAILED";
    CallState["NOT_ANSWERED"] = "NOT_ANSWERED";
})(CallState || (exports.CallState = CallState = {}));
//# sourceMappingURL=call.js.map