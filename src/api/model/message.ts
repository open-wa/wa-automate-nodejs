export interface Message {
  id: string;
  body: string;
  type: string;
  mimetype?: string;
  lat?: string;
  lng?: string;
  loc?: string;
  t: number;
  notifyName: string;
  from: string;
  to: string;
  self: string;
  duration?: string|number;
  ack: number;
  invis: boolean;
  isNewMsg: boolean;
  star: boolean;
  recvFresh: boolean;
  broadcast: boolean;
  isForwarded: boolean;
  labels: any[];
  /**
   * An array of all mentioned numbers in this message.
   */
  mentionedJidList: string[];
  caption: string;
  sender: {
    id: string;
    name: string;
    shortName: string;
    pushname: string;
    type: string;
    plaintextDisabled: boolean;
    isBusiness: boolean;
    isEnterprise: boolean;
    statusMute: boolean;
    labels: any[];
    formattedName: string;
    isMe: boolean;
    isMyContact: boolean;
    isPSA: boolean;
    isUser: boolean;
    isWAContact: boolean;
    profilePicThumbObj: {
      eurl: string;
      id: string;
      img: string;
      imgFull: string;
      raw: any;
      tag: string;
    };
    msgs: any;
  };
  timestamp: number;
  content: string;
  isGroupMsg: boolean;
  isMMS: boolean;
  isMedia: boolean;
  isNotification: boolean;
  isPSA: boolean;
  fromMe: boolean;
  chat: {
    id: string;
    pendingMsgs: boolean;
    lastReceivedKey: {
      fromMe: boolean;
      remote: string;
      id: string;
      _serialized: string;
    };
    t: number;
    unreadCount: number;
    archive: boolean;
    isReadOnly: boolean;
    modifyTag: number;
    muteExpiration: number;
    name: string;
    notSpam: boolean;
    pin: number;
    msgs: any;
    kind: string;
    isGroup: boolean;
    contact: {
      id: string;
      name: string;
      shortName: string;
      pushname: string;
      type: string;
      plaintextDisabled: boolean;
      isBusiness: boolean;
      isEnterprise: boolean;
      statusMute: boolean;
      labels: any[];
      formattedName: string;
      isMe: boolean;
      isMyContact: boolean;
      isPSA: boolean;
      isUser: boolean;
      isWAContact: boolean;
      profilePicThumbObj: any[];
      msgs: any;
    };
    groupMetadata: any;
    presence: { id: string; chatstates: any[] };
  };
  chatId: string;
  author: string;
  clientUrl: string;
  quotedMsg: any;
  quotedMsgObj: any;
  mediaData: {};
  shareDuration: number;
}


/**
 * Message types
 * @readonly
 * @enum {string}
 */
export enum MessageTypes {
  TEXT = 'chat',
  AUDIO = 'audio',
  VOICE = 'ptt',
  IMAGE = 'image',
  VIDEO = 'video',
  DOCUMENT = 'document',
  STICKER = 'sticker',
  LOCATION = 'location',
  CONTACT_CARD = 'vcard',
  CONTACT_CARD_MULTI = 'multi_vcard',
  REVOKED = 'revoked',
  UNKNOWN = 'unknown'
};

/**
 * Message ACK
 * @readonly
 * @enum {number}
 */
export enum MessageAck {
  ACK_ERROR = -1,
  ACK_PENDING = 0,
  ACK_SERVER = 1,
  ACK_DEVICE = 2,
  ACK_READ = 3,
  ACK_PLAYED = 4,
};

