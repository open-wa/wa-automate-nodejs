import { ChatId, ContactId, MessageId } from "./aliases";
import { Chat } from "./chat";
import { Contact } from "./contact";
import { GroupMetadata } from "./group-metadata";

export interface Message {
  /**
   * The id of the message
   */
  id: MessageId;
  /**
   * The body of the message. If the message type is `chat` , `body` will be the text of the chat. If the message type is some sort of media, then this body will be the thumbnail of the media.
   */
  body: string;
  /**
   * The type of the message, see [[MessageTypes]]
   */
  type: MessageTypes;
  mimetype?: string;
  /**
   * The latitude of a location message
   */
  lat?: string;
  /**
   * The longitude of a location message
   */
  lng?: string;
  /**
   * The text associated with a location message
   */
  loc?: string;
  /**
   * The timestamp of the message
   */
  t: number;
  notifyName: string;
  /**
   * The chat from which the message was sent
   */
  from: ChatId;
  /**
   * The chat id to which the message is being sent
   */
  to: ChatId;
  /**
   * Indicates whether the message was sent by the host account
   */
  self: boolean;
  /**
   * The length of the media in the message, if it exists.
   */
  duration?: string|number;
  /**
   * The acknolwedgement state of a message [[MessageAck]]
   */
  ack: MessageAck;
  invis: boolean;
  isNewMsg: boolean;
  star: boolean;
  recvFresh: boolean;
  /**
   * If the message is sent as a broadcast
   */
  broadcast: boolean;
  /**
   * If the message has been forwarded
   */
  isForwarded: boolean;
  /**
   * The labels associated with the message (used with business accounts)
   */
  labels: string[];
  /**
   * An array of all mentioned numbers in this message.
   */
  mentionedJidList: string[];
  /**
   * If the message is of a media type, it may also have a caption
   */
  caption: string;
  /**
   * The contact object of the account that sent the message
   */
  sender: Contact;
  /**
   * the timestanmp of the message
   */
  timestamp: number;
  content: string;
  isGroupMsg: boolean;
  isMMS: boolean;
  isMedia: boolean;
  isNotification: boolean;
  isPSA: boolean;
  /**
   * If the message is from the host account
   */
  fromMe: boolean;
  /**
   * The chat object
   */
  chat: {
    id: ChatId;
    pendingMsgs: boolean;
    lastReceivedKey: {
      fromMe: boolean;
      remote: ChatId;
      id: MessageId;
      _serialized: MessageId;
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
    msgs: Message[];
    kind: string;
    isGroup: boolean;
    contact: Chat;
    groupMetadata: GroupMetadata;
    presence: { id: ContactId; chatstates: any[] };
  };
  chatId: ChatId;
  author: string;
  /**
   * @deprecated
   */
  clientUrl: string;
  deprecatedMms3Url: string;
  quotedMsg: Message;
  quotedMsgObj: Message;
  mediaData: {};
  shareDuration: number;
  isAnimated: boolean;
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

