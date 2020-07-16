export interface Call {
    id: string;
    peerJid: string;
    offerTime: number;
    isVideo: boolean;
    isGroup: boolean;
    canHandleLocally: boolean;
    outgoing: boolean;
    webClientShouldHandle: boolean;
    participants: [any];
}
