import { ChatId, ContactId, GroupChatId, NonSerializedId, DataURL, GroupId, MessageId } from './aliases';
import { Contact } from './contact'

export interface Participant {
  contact: Contact,
  id: NonSerializedId,
  isAdmin: boolean,
  isSuperAdmin: boolean
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
  /**
   * The description of the group
   */
  desc ?: string;
  /**
   * The account that set the description last.
   */
  descOwner ?: ContactId;
  /**
   * 
   */
  trusted ?: boolean;
  /**
   * Not sure what this represents
   */
  suspended ?: boolean;
  /**
   * Not sure what this represents
   */
  support ?: boolean;
  /**
   * Is this group a parent group (a.k.a community)
   */
   isParentGroup ?: boolean
   /**
   * The type of group
   */
   groupType: 'DEAFULT' | 'SUBGROUP' | 'COMMUNITY'
   /**
    * Communities have a default group chat
    */
   defaultSubgroup: boolean
   /**
    * 
    */
   isParentGroupClosed: boolean
   /**
    * List of Group IDs that the host account has joined as part of this community
    */
   joinedSubgroups: GroupId[]
}

export enum groupChangeEvent {
  remove = 'remove',
  add = 'add'
}

export interface ParticipantChangedEventModel {
  by: ContactId,
  action: groupChangeEvent,
  who: ContactId[]
  chat: ChatId
}

/**
 * Group notification types
 * @readonly
 * @enum {string}
 */
export enum GroupNotificationTypes {
  ADD = 'add',
  INVITE = 'invite',
  REMOVE = 'remove',
  LEAVE = 'leave',
  SUBJECT = 'subject',
  DESCRIPTION = 'description',
  PICTURE = 'picture',
  ANNOUNCE = 'announce',
  RESTRICT = 'restrict',
}

/**
 * Used when creating a new community with.
 */
export interface NewCommunityGroup {
  subject : string,
  icon ?: DataURL,
  ephemeralDuration ?: number
}

export interface GenericGroupChangeEvent {
  /**
   * The contact who triggered this event. (E.g the contact who changed the group picture)
   */
  author: Contact,
  /**
   * Some more information about the event
   */
  body: string,
  groupMetadata: GroupMetadata,
  /**
   * Base 64 encoded image
   */
  groupPic: string
  id: MessageId,
  /**
   * Type of the event
   */
  type: 'picutre' | 'create' | 'delete' | 'subject' | 'revoke_invite' | 'description' | 'restrict' | 'announce' | 'no_frequently_forwarded' | 'announce_msg_bounce' | 'add' | 'remove' | 'demote' | 'promote' | 'invite' | 'leave' | 'modify' | 'v4_add_invite_sent' | 'v4_add_invite_join' | 'growth_locked' | 'growth_unlocked' | 'linked_group_join'
}