import { ChatId, ContactId, GroupChatId } from './aliases';
import { Contact } from './contact';
import { GroupMetadata } from './group-metadata';

export interface Chat {
  archive: boolean;
  changeNumberNewJid: any;
  changeNumberOldJid: any;
  contact: Contact;
  groupMetadata: GroupMetadata;
  id: ChatId;
  isAnnounceGrpRestrict: any;
  formattedTitle?: string;
  canSend?: boolean;
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
  /**
   * @deprecated This is unreliable. Use the method [`isChatOnline`](https://open-wa.github.io/wa-automate-nodejs/classes/client.html#ischatonline) instead.
   */
  isOnline?: any;
  /**
   * @deprecated This is unreliable. Use the method [`getLastSeen`](https://open-wa.github.io/wa-automate-nodejs/classes/client.html#getlastseen) instead.
   */
  lastSeen?: any;
}

export interface LiveLocationChangedEvent {
  id: string,
  lat: number,
  lng: number,
  speed: number,
  lastUpdated: number,
  accuracy: number,
  degrees: any,
  /**
   * The message id that was sent when the liveLocation session was started.
   */
  msgId?: string
}

/**
 * The ChatState represents the state you'd normally see represented under the chat name in the app.
 */
export enum ChatState {
  /**
   * `typing...`
   */
  TYPING,
  /**
   * `recording audio...`
   */
  RECORDING,
  /**
   * `online`
   */
  PAUSED
}

/**
 * Chat types
 * @readonly
 * @enum {string}
 */
export enum ChatTypes {
  SOLO = 'solo',
  GROUP = 'group',
  UNKNOWN = 'unknown'
}

/**
 * Valid durations for muting a chat using [[muteChat]]
 *
 * @readonly
 */
export enum ChatMuteDuration {
  /**
   * Mutes chat for 8 hours
   */
  EIGHT_HOURS = 'EIGHT_HOURS',
  /**
   * Mutes chat for 1 week
   */
  ONE_WEEK = 'ONE_WEEK',
  /**
   * Mutes chat forever
   */
  FOREVER = 'FOREVER'
}

export interface GroupChatCreationParticipantAddResponse {
  /**
   * The resultant status code for adding the participant. 
   * 
   * 200 if the participant was added successfully during the creation of the group. 
   * 
   * 403 if the participant does not allow their account to be added to group chats. If you receive a 403, you will also get an `invite_code` and `invite_code_exp`
   */
  code: 200 | 400 | 403,
  /**
   * If the participant is not allowed to be added to group chats due to their privacy settings, you will receive an `invite_code` which you can send to them via a text.
   */
  invite_code ?: string,
  /**
   * The expiry ts of the invite_code. It is a number wrapped in a string, in order to get the proper time you can use this:
   * 
   * ```javascript
   *   new Date(Number(invite_code_exp)*1000)
   * ```
   */
  invite_code_exp ?: string

}
export interface GroupChatCreationResponse {
  /**
   * The resultant status code of the group chat creation.
   * 
   * 200 if the group was created successfully.
   * 
   * 400 if the initial participant does not exist
   */
    status: 200 | 400,
    /**
     * The group chat id
     */
    gid: GroupChatId;
    /**
     * The initial requested participants and their corresponding add responses
     */
    participants: {
      ContactId ?: GroupChatCreationParticipantAddResponse
    }[]
}