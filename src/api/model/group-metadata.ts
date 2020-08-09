import { Id } from './id';
import { GroupChatId } from './aliases';

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
  owner: {
    server: string;
    user: string;
    _serialized: string;
  };
  /**
   * An array of participants in the group
   */
  participants: any[];
  /**
   * Unknown.
   */
  pendingParticipants: any[];
}

export enum groupChangeEvent {
  remove = 'remove',
  add = 'add'
}


export interface ParticipantChangedEventModel {
  by: Id,
  action: groupChangeEvent,
  who: [Id]
  chat: Id
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
};