import { ChatId, MessageId } from "./aliases";
import { Button, Row, Section } from "./button";
import { Chat } from "./chat";
import { Contact } from "./contact";

export interface Message {
  /**
   * The ID of the selected button
   */ 
  selectedButtonId: string;
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
  self: "in" | "out";
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
  /**
   * When `config.messagePreprocessor: "AUTO_DECRYPT_SAVE"` is set, media is decrypted and saved on disk in a folder called media relative to the current working directory.
   * 
   * This is the filePath of the decrypted file.
   */
  filePath ?: string;
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
  chat: Chat;
  chatId: ChatId;
  author: string;
  /**
   * @deprecated
   * 
   * Ironically, you should be using `deprecatedMms3Url` instead
   */
  clientUrl: string;
  deprecatedMms3Url: string;
  quotedMsg ?: Message;
  quotedMsgObj ?: Message;
  mediaData: unknown;
  shareDuration: number;
  isAnimated: boolean;
  /**
   * The URL of the file after being uploaded to the cloud using a cloud upload message preprocessor.
   */
   cloudUrl?: string;
   /**
    * Buttons associated with the message
    */
   buttons ?: Button[]
   /**
    * List response associated with the message
    */
    listResponse ?: Row
    /**
     * The list associated with the list message
     */
    list ?: {
      "sections": Section[],
      "title": string,
      "description": string,
      "buttonText":  string,
    }
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
  ORDER = 'order',
  BUTTONS_RESPONSE = 'buttons_response',
  LIST_RESPONSE = "list_response",
  UNKNOWN = 'unknown'
}

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
}
