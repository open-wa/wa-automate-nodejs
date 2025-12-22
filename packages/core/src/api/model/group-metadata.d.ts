import { ChatId, ContactId, GroupChatId, NonSerializedId, DataURL, GroupId, MessageId } from './aliases';
import { Contact } from './contact';
export interface Participant {
    contact: Contact;
    id: NonSerializedId;
    isAdmin: boolean;
    isSuperAdmin: boolean;
}
export interface GroupMetadata {
    id: GroupChatId;
    creation: number;
    owner: NonSerializedId;
    participants: Participant[];
    pendingParticipants: Participant[];
    desc?: string;
    descOwner?: ContactId;
    trusted?: boolean;
    suspended?: boolean;
    support?: boolean;
    isParentGroup?: boolean;
    groupType: 'DEAFULT' | 'SUBGROUP' | 'COMMUNITY';
    defaultSubgroup: boolean;
    isParentGroupClosed: boolean;
    joinedSubgroups: GroupId[];
}
export declare enum groupChangeEvent {
    remove = "remove",
    add = "add"
}
export interface ParticipantChangedEventModel {
    by: ContactId;
    action: groupChangeEvent;
    who: ContactId[];
    chat: ChatId;
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
export interface NewCommunityGroup {
    subject: string;
    icon?: DataURL;
    ephemeralDuration?: number;
}
export interface GenericGroupChangeEvent {
    author: Contact;
    body: string;
    groupMetadata: GroupMetadata;
    groupPic: string;
    id: MessageId;
    type: 'picutre' | 'create' | 'delete' | 'subject' | 'revoke_invite' | 'description' | 'restrict' | 'announce' | 'no_frequently_forwarded' | 'announce_msg_bounce' | 'add' | 'remove' | 'demote' | 'promote' | 'invite' | 'leave' | 'modify' | 'v4_add_invite_sent' | 'v4_add_invite_join' | 'growth_locked' | 'growth_unlocked' | 'linked_group_join';
}
//# sourceMappingURL=group-metadata.d.ts.map