import { ChatId, ContactId, MessageId, GroupChatId } from "./aliases";
import { Button, Row, Section } from "./button";
import { Chat } from "./chat";
import { Contact } from "./contact";
export type MessagePinDuration = "FifteenSeconds" | "FiveSeconds" | "OneDay" | "OneMinute" | "SevenDays" | "ThirtyDays";
export interface Message {
    selectedButtonId: string;
    id: MessageId;
    mId: string;
    body: string;
    device: number;
    local: boolean;
    text: string;
    type: MessageTypes;
    filehash?: string;
    mimetype?: string;
    lat?: string;
    lng?: string;
    loc?: string;
    t: number;
    notifyName: string;
    from: ChatId;
    to: ChatId;
    self: "in" | "out";
    duration?: string | number;
    ack: MessageAck;
    invis: boolean;
    isNewMsg: boolean;
    star: boolean;
    recvFresh: boolean;
    broadcast: boolean;
    isForwarded: boolean;
    labels: string[];
    mentionedJidList: ContactId[];
    caption: string;
    sender: Contact;
    timestamp: number;
    filePath?: string;
    filename?: string;
    content: string;
    isGroupMsg: boolean;
    isMMS: boolean;
    isMedia: boolean;
    isNotification: boolean;
    isPSA: boolean;
    fromMe: boolean;
    chat: Chat;
    chatId: ChatId;
    author: string;
    stickerAuthor?: string;
    stickerPack?: string;
    clientUrl: string;
    deprecatedMms3Url: string;
    isQuotedMsgAvailable: boolean;
    quotedMsg?: Message;
    quotedMsgObj?: Message;
    isGroupJoinRequest?: GroupChatId;
    senderId?: string;
    quotedRemoteJid?: string;
    quotedParentGroupJid?: GroupChatId;
    mediaData: unknown;
    shareDuration: number;
    isAnimated: boolean;
    ctwaContext?: {
        sourceUrl: string;
        thumbnail: string | null;
        mediaType: number;
        isSuspiciousLink: boolean | null;
    };
    isViewOnce: boolean;
    quoteMap: QuoteMap;
    cloudUrl?: string;
    buttons?: Button[];
    listResponse?: Row;
    list?: {
        "sections": Section[];
        "title": string;
        "description": string;
        "buttonText": string;
    };
    pollOptions?: PollOption[];
    reactionByMe?: ReactionSender;
    reactions: {
        aggregateEmoji: string;
        senders: ReactionSender[];
        hasReactionByMe: boolean;
        id: string;
    }[];
}
export interface ReactionSender {
    parentMsgKey: MessageId;
    senderUserJid: ContactId;
    msgKey: MessageId;
    reactionText: string;
    timestamp: number;
    orphan: number;
    read: boolean;
    t?: number;
    id: MessageId;
    isSendFailure: boolean;
    ack?: number;
}
export interface PollOption {
    name: string;
    localId: number;
}
export interface PollData {
    totalVotes: number;
    pollOptions: (PollOption & {
        count: number;
    })[];
    votes: PollVote[];
    pollMessage: Message;
}
export interface PollVote {
    ack: number;
    id: string;
    msgKey: string;
    parentMsgKey: string;
    pollOptions: PollOption[];
    selectedOptionLocalIds: number[];
    selectedOptionValues: string[];
    sender: ContactId;
    senderObj: Contact;
    senderTimestampMs: number;
    stale: boolean;
}
export interface QuoteMap {
    [messageId: string]: {
        body: string;
        quotes?: MessageId;
    };
}
export interface MessageInfoInteraction {
    id: ContactId;
    t: number;
}
export interface MessageInfo {
    deliveryRemaining: number;
    playedRemaining: number;
    readRemaining: number;
    delivery: MessageInfoInteraction[];
    read: MessageInfoInteraction[];
    played: MessageInfoInteraction[];
    id: MessageId;
}
export declare enum MessageTypes {
    TEXT = "chat",
    AUDIO = "audio",
    VOICE = "ptt",
    IMAGE = "image",
    VIDEO = "video",
    DOCUMENT = "document",
    STICKER = "sticker",
    LOCATION = "location",
    CONTACT_CARD = "vcard",
    CONTACT_CARD_MULTI = "multi_vcard",
    REVOKED = "revoked",
    ORDER = "order",
    BUTTONS_RESPONSE = "buttons_response",
    LIST_RESPONSE = "list_response",
    UNKNOWN = "unknown"
}
export declare enum MessageAck {
    ACK_ERROR = -1,
    ACK_PENDING = 0,
    ACK_SERVER = 1,
    ACK_DEVICE = 2,
    ACK_READ = 3,
    ACK_PLAYED = 4
}
//# sourceMappingURL=message.d.ts.map