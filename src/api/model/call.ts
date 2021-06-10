import { Id } from "./id";
import { ContactId } from "./aliases";

export interface Call {
  /**
   * The id of the call
   */
    id: string;
    /**
     * The id of the account calling
     */
    peerJid: ContactId;
    /**
     * The epoch timestamp of the call. You will have to multiply this by 1000 to get the actual epoch timestamp
     */
    offerTime: number;
    /**
     * Whether or not the call is a video call
     */
    isVideo: boolean;
    /**
     * Whether or not the call is a group call
     */
    isGroup: boolean;
    canHandleLocally: boolean;
    /**
     * The direction of the call.
     */
    outgoing: boolean;
    webClientShouldHandle: boolean;
    /**
     * The other participants on a group call
     */
    participants: ContactId[]
  } 