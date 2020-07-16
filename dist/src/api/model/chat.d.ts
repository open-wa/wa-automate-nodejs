import { Contact } from './contact';
import { GroupMetadata } from './group-metadata';
import { Id } from './id';
export interface Chat {
    archive: boolean;
    changeNumberNewJid: any;
    changeNumberOldJid: any;
    contact: Contact;
    groupMetadata: GroupMetadata;
    id: Id;
    isAnnounceGrpRestrict: any;
    formattedTitle?: string;
    isGroup: boolean;
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
}
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
