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
  verifiedLevel: string;
  verifiedName: string;
  isOnline?: boolean;
  lastSeen?: number;
}
