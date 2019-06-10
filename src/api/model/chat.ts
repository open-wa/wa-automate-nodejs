import { Contact } from './contact';

export interface Chat {
  archive: boolean;
  changeNumberNewJid: any;
  changeNumberOldJid: any;
  contact: Contact;
  groupMetadata: any;
  id: any;
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
}
