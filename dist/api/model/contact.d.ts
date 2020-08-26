import { Id } from './id';
export interface Contact {
    formattedName: string;
    id: Id;
    isBusiness: boolean;
    isEnterprise: boolean;
    isHighLevelVerified: any;
    isMe: boolean;
    isMyContact: boolean;
    isPSA: boolean;
    isUser: boolean;
    isVerified: any;
    isWAContact: boolean;
    labels: any[];
    msgs: any;
    name: string;
    plaintextDisabled: boolean;
    profilePicThumbObj: {
        eurl: string;
        id: Id;
        img: string;
        imgFull: string;
        raw: any;
        tag: string;
    };
    pushname: string;
    sectionHeader: any;
    shortName: string;
    statusMute: boolean;
    type: string;
    verifiedLevel: any;
    verifiedName: any;
    isOnline?: any;
    lastSeen?: any;
}
