import { ChatId, ContactId, MessageId, GroupChatId } from "./aliases";
import { Button, Row, Section } from "./button";
import { Chat } from "./chat";
import { Contact } from "./contact";


export type MessagePinDuration = "FifteenSeconds" | "FiveSeconds" | "OneDay" | "OneMinute" | "SevenDays" | "ThirtyDays"

export interface Message {
  /**
   * The ID of the selected button
   */ 
  selectedButtonId: string;
  /**
   * The id of the message. Consists of the Chat ID and a unique string.
   * 
   * Example:
   * 
   * ```
   * false_447123456789@c.us_7D914FEA78BE10277743F4B785045C37
   * ```
   */
  id: MessageId;
  /**
   * The unique segment of the message id.
   * 
   * Example:
   * 
   * ```
   * 7D914FEA78BE10277743F4B785045C37
   * ```
   */
  mId: string,
  /**
   * The body of the message. If the message type is `chat` , `body` will be the text of the chat. If the message type is some sort of media, then this body will be the thumbnail of the media.
   */
  body: string;
  /**
   * The device ID of the device that sent the message. This is only present if the message was sent from host account-linked session. This is useful for determining if a message was sent from a different mobile device (note that whenever a device) or a desktop session.
   * 
   * Note: This will emit a number for the current controlled session also but the only way to know if the number represents the current session is by checking `local` (it will be `true` if the message was sent from the current session).
   * 
   * If the device ID is `0` then the message was sent from the "root" host account device.
   * 
   * This might be undefined for incoming messages.
   */
  device: number;
  /**
   * If the message was sent from this controlled session this will be `true`. This is useful for determining if a message was sent from a different mobile device (note that whenever a device) or a desktop session.
   */
  local: boolean;
  /**
   * a convenient way to get the main text content from a message.
   */
  text: string;
  /**
   * The type of the message, see [[MessageTypes]]
   */
  type: MessageTypes;
  /**
   * Used to checking the integrity of the decrypted media.
   */
  filehash ?: string;
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
   * Indicates whether the message is coming into the session or going out of the session. You can have a message sent by the host account show as `in` when the message was sent from another
   * session or from the host account device itself.
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
  mentionedJidList: ContactId[];
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
  /**
   * The given filename of the file
   */
  filename ?: string;
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
  stickerAuthor?: string;
  stickerPack?: string;
  /**
   * @deprecated
   * 
   * Ironically, you should be using `deprecatedMms3Url` instead
   */
  clientUrl: string;
  deprecatedMms3Url: string;
  /**
   * If this message is quoting (replying to) another message
   */
  isQuotedMsgAvailable: boolean;
  quotedMsg ?: Message;
  quotedMsgObj ?: Message;
  /**
   * When a user requests to join a group wihtin a community the request is received by the host as a message. This boolean will allow you to easily determine if the incoming message is a request to join a group.
   * 
   * If this is `true` then you need to determine within your own code whether or not to accept the user to the group which is indicated with `quotedRemoteJid` using `addParticipant`.
   */
  isGroupJoinRequest ?: GroupChatId;
  /**
   * The ID of the message sender
   */
  senderId ?: string,
  /**
   * The ID of the quoted group. Usually present when a user is requesting to join a group.
   */
  quotedRemoteJid ?: string,
  /**
   * The parent group ID (community ID - communities are just groups made up of other groups) of the group represented by `quotedRemoteJid`
   */
  quotedParentGroupJid ?: GroupChatId,
  mediaData: unknown;
  shareDuration: number;
  isAnimated: boolean;
  ctwaContext ?: {
    sourceUrl: string,
    thumbnail: string | null,
    mediaType: number,
    isSuspiciousLink: boolean | null
  },
  /**
   * Is the message a "view once" message
   */
  isViewOnce: boolean;
  /**
   * Use this to traverse the quote chain.
   */
  quoteMap: QuoteMap;
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
    /**
     * The options of a poll
     */
    pollOptions ?: PollOption[],
    /**
     * The reaction of the host account to this message
     */
    reactionByMe ?: ReactionSender,  
    reactions: {
      aggregateEmoji: string,
      /**
       * The senders of this reaction
       */
      senders: ReactionSender[]
      /**
       * If the host account has reacted to this message with this reaction
       */
      hasReactionByMe: boolean
      /**
       * The message ID of the reaction itself
       */
      id: string
    }[]
}

export interface ReactionSender {
    /**
     * The ID of the message being reacted to
     */
    parentMsgKey: MessageId,
    /**
     * The contact ID of the sender of the reaction
     */
    senderUserJid: ContactId,
    /**
     * The message ID of the reaction itself
     */
    msgKey: MessageId,
    /**
     * The text of the reaction
     */
    reactionText: string,
    /**
     * The timestamp of the reaction
     */
    timestamp: number,
    orphan: number,
    /**
     * If the reaction was seen/read
     */
    read: boolean,
    /**
     * The timestamp of the reaction
     */
    t?: number,
    /**
     * The message ID of the reaction itself
     */
    id: MessageId,
    isSendFailure: boolean,
    ack?: number
  }

export interface PollOption {
  name: string,
  localId: number
}

export interface PollData {
  /**
   * The total amount of votes recorded so far
   */
  totalVotes: number,
  /**
   * The poll options and their respective count of votes.
   */
  pollOptions: (PollOption & { count: number })[],
  /**
   * An arrray of vote objects
   */
  votes: PollVote[]
  /**
   * The message object of the poll
   */
  pollMessage: Message
}

export interface PollVote {
  ack: number,
  /**
   * The message ID of this vote. For some reason this is different from the msgKey and includes exclamaition marks.
   */
  id: string,
  /**
   * The message key of this vote
   */
  msgKey: string,
  /**
   * The Message ID of the original Poll message
   */
  parentMsgKey: string,
  /**
   * The original poll options available on the poll
   */
  pollOptions: PollOption[],
  /**
   * The selected option IDs of the voter
   */
  selectedOptionLocalIds: number[],
  /**
   * The selected option values by this voter
   */
  selectedOptionValues: string[],
  /**
   * The contact ID of the voter
   */
  sender: ContactId,
  /**
   * The contact object of the voter
   */
  senderObj: Contact,
  /**
   * Timestamp of the vote
   */
  senderTimestampMs: number,
  stale: boolean

}

export interface QuoteMap {
  [messageId: string]: {
    /**
     * The body of the message
     */
    body: string;
    /**
     * The message ID of the message that was quoted. Null if no message was quoted.
     */
    quotes ?: MessageId
  };
}

export interface MessageInfoInteraction {
  /**
   * The contact ID of the contact that interacted with the message.
   */
  id: ContactId,
  /**
   * The timestamp of the interaction. You have to x 1000 to use in a JS Date object.
   */
  t: number,
}

export interface MessageInfo {
  deliveryRemaining: number;
  playedRemaining: number;
  readRemaining: number;
  delivery: MessageInfoInteraction[];
  read: MessageInfoInteraction[];
  played: MessageInfoInteraction[];
  /**
   * The ID of the message
   */
  id: MessageId;
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
