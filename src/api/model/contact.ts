import { ContactId } from './aliases';
import { Id } from './id';
import { Message } from './message';

export interface NumberCheck {
    id: Id,
    status: 200 | 404,
    isBusiness: boolean,
    canReceiveMessage: boolean,
    numberExists: boolean
}
export interface Contact {
  formattedName: string;
  id: ContactId;
  isBusiness: boolean;
  /**
   * Most likely true when the account has a green tick. See `verifiedLevel` also.
   */
  isEnterprise: boolean;
  isMe: boolean;
  isMyContact: boolean;
  isPSA: boolean;
  isUser: boolean;
  isWAContact: boolean;
  labels: string[];
  msgs: Message[];
  name: string;
  plaintextDisabled: boolean;
  profilePicThumbObj: {
    eurl: string;
    id: Id;
    img: string;
    imgFull: string;
    raw: string;
    tag: string;
  };
  pushname: string;
  shortName: string;
  statusMute: boolean;
  type: string;
  /**
   * 0 = not verified
   * 2 = verified (most likely represents a blue tick)
   */
  verifiedLevel: number;
  /**
   * The business account name verified by WA.
   */
  verifiedName: string;
  isOnline?: boolean;
  lastSeen?: number;
}
