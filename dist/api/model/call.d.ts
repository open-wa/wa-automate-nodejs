import { Id } from "./id";
import { ContactId } from "./aliases";
export interface Call {
    id: string;
    peerJid: Id;
    offerTime: number;
    isVideo: boolean;
    isGroup: boolean;
    canHandleLocally: boolean;
    outgoing: boolean;
    webClientShouldHandle: boolean;
    participants: [ContactId];
}
