import { ContactId } from "./aliases";
export declare enum CallState {
    INCOMING_RING = "INCOMING_RING",
    OUTGOING_RING = "OUTGOING_RING",
    OUTGOING_CALLING = "OUTGOING_CALLING",
    CONNECTING = "CONNECTING",
    CONNECTION_LOST = "CONNECTION_LOST",
    ACTIVE = "ACTIVE",
    HANDLED_REMOTELY = "HANDLED_REMOTELY",
    ENDED = "ENDED",
    REJECTED = "REJECTED",
    REMOTE_CALL_IN_PROGRESS = "REMOTE_CALL_IN_PROGRESS",
    FAILED = "FAILED",
    NOT_ANSWERED = "NOT_ANSWERED"
}
export interface Call {
    id: string;
    peerJid: ContactId;
    offerTime: number;
    isVideo: boolean;
    isGroup: boolean;
    canHandleLocally: boolean;
    outgoing: boolean;
    webClientShouldHandle: boolean;
    participants: ContactId[];
    State: CallState;
}
//# sourceMappingURL=call.d.ts.map