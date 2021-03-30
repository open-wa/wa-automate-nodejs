import { Id } from './id';
import { GroupChatId, NonSerializedId } from './aliases';
export interface Participant {
    id: NonSerializedId;
    isAdmin: boolean;
    isSuperAdmin: boolean;
}
export interface GroupMetadata {
    /**
     * The chat id of the group [[GroupChatId]]
     */
    id: GroupChatId;
    /**
     * The timestamp of when the group was created
     */
    creation: number;
    /**
     * The id of the owner of the group [[ContactId]]
     */
    owner: NonSerializedId;
    /**
     * An array of participants in the group
     */
    participants: Participant[];
    /**
     * Unknown.
     */
    pendingParticipants: Participant[];
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
/**
 * Group notification types
 * @readonly
 * @enum {string}
 */
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
