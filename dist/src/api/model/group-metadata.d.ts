import { Id } from './id';
export interface GroupMetadata {
    id: Id;
    creation: number;
    owner: {
        server: string;
        user: string;
        _serialized: string;
    };
    participants: any[];
    pendingParticipants: any[];
}
export declare enum groupChangeEvent {
    remove = "remove",
    add = "add"
}
export interface ParticipantChangedEventModel {
    by: Id;
    action: groupChangeEvent;
    who: [Id];
    chat: Id;
}
export declare enum GroupNotificationTypes {
    ADD = "add",
    INVITE = "invite",
    REMOVE = "remove",
    LEAVE = "leave",
    SUBJECT = "subject",
    DESCRIPTION = "description",
    PICTURE = "picture",
    ANNOUNCE = "announce",
    RESTRICT = "restrict"
}
