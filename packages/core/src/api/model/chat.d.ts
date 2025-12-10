import { ContactId, GroupChatId } from './aliases';
import { Contact } from './contact';
import { GroupMetadata } from './group-metadata';
export interface BaseChat {
    archive: boolean;
    changeNumberNewJid: any;
    changeNumberOldJid: any;
    contact: Contact;
    groupMetadata: GroupMetadata;
    isAnnounceGrpRestrict: any;
    formattedTitle?: string;
    canSend?: boolean;
    isReadOnly: boolean;
    kind: string;
    labels: any;
    lastReceivedKey: any;
    modifyTag: number;
    msgs: any;
    muteExpiration: number;
    name: string;
    notSpam: boolean;
    pendingMsgs: boolean;
    pin: number;
    presence: any;
    t: number;
    unreadCount: number;
    ack?: any;
    isOnline?: any;
    lastSeen?: any;
    pic?: string;
}
export interface SingleChat extends BaseChat {
    id: ContactId;
    isGroup: false;
}
export interface GroupChat extends BaseChat {
    id: GroupChatId;
    isGroup: true;
    groupType: 'DEFAULT' | 'COMMUNITY' | 'LINKED_ANNOUNCEMENT_GROUP' | 'LINKED_GENERAL_GROUP' | 'LINKED_SUBGROUP';
}
export type Chat = SingleChat | GroupChat;
export interface LiveLocationChangedEvent {
    id: string;
    lat: number;
    lng: number;
    speed: number;
    lastUpdated: number;
    accuracy: number;
    degrees: any;
    msgId?: string;
}
export declare enum ChatState {
    TYPING = 0,
    RECORDING = 1,
    PAUSED = 2
}
export declare enum ChatTypes {
    SOLO = "solo",
    GROUP = "group",
    UNKNOWN = "unknown"
}
export declare enum ChatMuteDuration {
    EIGHT_HOURS = "EIGHT_HOURS",
    ONE_WEEK = "ONE_WEEK",
    FOREVER = "FOREVER"
}
export interface GroupChatCreationParticipantAddResponse {
    code: 200 | 400 | 403;
    invite_code?: string;
    invite_code_exp?: string;
}
export interface GroupChatCreationResponse {
    status: 200 | 400;
    gid: GroupChatId;
    participants: {
        ContactId?: GroupChatCreationParticipantAddResponse;
    }[];
}
export type EphemeralDuration = 86400 | 604800 | 7776000;
//# sourceMappingURL=chat.d.ts.map