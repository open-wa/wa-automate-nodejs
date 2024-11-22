import { ChatId, ContactId, GroupChatId, NonSerializedId, DataURL, GroupId, MessageId } from './aliases';
import { Contact } from './contact'

export interface Participant {
  contact: Contact,
  id: ContactId,
  isAdmin: boolean,
  isSuperAdmin: boolean
}

export interface PastParticipant {
  id: ContactId,
  leaveTs: number,
  leaveReason: "Removed" | "Left"
}

export interface membershipApprovalRequest {
  id: ContactId,
  t: number
  addedBy: ContactId
  /**
   * The only known value is 'LinkedGroupJoin'
   */
  requestMethod: string
  parentGroupId: GroupId
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
  owner: ContactId;
  /**
   * The name of the Group
   */
  subject: string;
  /**
   * The creation time of the group
   */
  subjectTime: number;
  /**
   * The description of the group
   */
  desc ?: string;
  /**
   * Unknown
   */
  descId ?: string;
  /**
   * The timestamp of when the description was last updated, it appear to be only exists within communities group?
   */
  descTime ?: number;
  /**
   * The account that set the description last.
   */
  descOwner ?: ContactId;
  /**
   * Unknown use
   */
  restrict : boolean;
  /**
   * Unknown use
   */
  announce : boolean;
  /**
   * Unknown use
   */
  noFrequentlyForwarded : boolean;
  /**
   * Unknown use
   */
  ephemeralDuration : number;
  /**
   * Is member need to be approved to join
   */
  membershipApprovalMode : boolean;
  /**
   * Member add mode
   */
  memberAddMode ?: "all_member_add" | "admin_add"
  /**
   * Unknown use
   */
  reportToAdminMode ?: boolean;
  /**
   * Group size
   */
  size : number;
  /**
   * Not sure what this represents
   */
  support ?: boolean;
  /**
   * Not sure what this represents
   */
  suspended ?: boolean;
  /**
   * Not sure what this represents
   */
  terminated ?: boolean;
  /**
   * Not sure what this represents
   */
  uniqueShortNameMap : Record<any, any>;
  /**
   * Not sure what this represents
   */
  isLidAddressingMode : boolean;
  /**
   * Is this group a parent group (a.k.a community)
   */
  isParentGroup : boolean
  /**
   * 
   */
  isParentGroupClosed: boolean
  /**
   * The id of the parent group [[GroupId]]
   */
  parentGroup: GroupId
  /**
   * Communities have a default group chat
   */
  defaultSubgroup: boolean
  /**
   * Unknown
   */
  generalSubgroup: boolean
  /**
   * Unknown
   */
  generalChatAutoAddDisabled: boolean
  /**
   * Allow non admin to create subgroups
   */
  allowNonAdminSubGroupCreation: boolean
  /**
   * Unknown
   */
  lastActivityTimestamp?: number
  /**
   * Unknown
   */
  incognito: boolean
  /**
   * Unknown
   */
  hasCapi ?: boolean
  /**
   * An array of participants in the group
   */
  participants: Participant[];
  /**
   * Unknown.
   */
  pendingParticipants: Participant[];
  /**
   * An array of past participants, could be an empty array
   */
  pastParticipants: PastParticipant[];
  /**
   * members that is not approved to join group yet, could be an empty array if the bot is not an admin
   */
  membershipApprovalRequests: membershipApprovalRequest[];
  /**
   * Unknown, usually an empty array, please check if you found any value
   */
  subgroupSuggestions: []
  /**
   * The type of group - it seems to never appeared in the message
   */
  groupType?: 'DEFAULT' | 'SUBGROUP' | 'COMMUNITY'
  /**
   * List of Group IDs that the host account has joined as part of this community - it seems to never appeared in the message
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
