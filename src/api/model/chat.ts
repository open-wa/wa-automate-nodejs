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
   * @deprecated This is unreliable. Use the method [`isChatOnline`](https://open-wa.github.io/wa-automate-nodejs/classes/whatsapp.html#ischatonline) instead.
   */
  isOnline?: any;
  /**
   * @deprecated This is unreliable. Use the method [`getLastSeen`](https://open-wa.github.io/wa-automate-nodejs/classes/whatsapp.html#getLastSeen) instead.
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
}

export enum ChatState {
  TYPING,
  RECORDING,
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
};
