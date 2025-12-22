import { z } from 'zod';

// Aliases
export const ContactIdSchema = z.string().brand('ContactId');
export type ContactId = z.infer<typeof ContactIdSchema>;

export const ChatIdSchema = z.string().brand('ChatId');
export type ChatId = z.infer<typeof ChatIdSchema>;

export const MessageIdSchema = z.string().brand('MessageId');
export type MessageId = z.infer<typeof MessageIdSchema>;

export const GroupChatIdSchema = z.string().brand('GroupChatId');
export type GroupChatId = z.infer<typeof GroupChatIdSchema>;

// Id
export const IdSchema = z.object({
    server: z.string(),
    user: z.string(),
    _serialized: z.string(),
});
export type Id = z.infer<typeof IdSchema>;

// Enums
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

export enum MessageAck {
    ACK_ERROR = -1,
    ACK_PENDING = 0,
    ACK_SERVER = 1,
    ACK_DEVICE = 2,
    ACK_READ = 3,
    ACK_PLAYED = 4,
}

/**
 * An enum of all the "simple listeners". A simple listener is a listener that just takes one parameter which is the callback function to handle the event.
 */
export enum SimpleListener {
    /**
     * Represents [[onMessage]]
     */
    Message = 'onMessage',
    /**
     * Represents [[onAnyMessage]]
     */
    AnyMessage = 'onAnyMessage',
    /**
     * Represents [[onMessageDeleted]]
     */
    MessageDeleted = 'onMessageDeleted',
    /**
     * Represents [[onAck]]
     */
    Ack = 'onAck',
    /**
     * Represents [[onAddedToGroup]]
     */
    AddedToGroup = 'onAddedToGroup',
    /**
     * Represents [[onChatDeleted]]
     */
    ChatDeleted = 'onChatDeleted',
    /**
     * Represents [[onBattery]]
     */
    Battery = 'onBattery',
    /**
     * Represents [[onChatOpened]]
     */
    ChatOpened = 'onChatOpened',
    /**
     * Represents [[onIncomingCall]]
     */
    IncomingCall = 'onIncomingCall',
    /**
     * Represents [[onGlobalParticipantsChanged]]
     */
    GlobalParticipantsChanged = 'onGlobalParticipantsChanged',
    /**
     * Represents [[onChatState]]
     */
    ChatState = 'onChatState',
    /**
     * Represents [[onLogout]]
     */
    Logout = 'onLogout',
    /**
     * Represents [[onPlugged]]
     */
    Plugged = 'onPlugged',
    /**
     * Represents [[onStateChanged]]
     */
    StateChanged = 'onStateChanged',
    /**
     * Represents [[onButton]]
     */
    Button = 'onButton',
    /**
     * Requires licence
     * Represents [[onStory]]
     */
    Story = 'onStory',
    /**
     * Requires licence
     * Represents [[onRemovedFromGroup]]
     */
    RemovedFromGroup = 'onRemovedFromGroup',
    /**
     * Requires licence
     * Represents [[onContactAdded]]
     */
    ContactAdded = 'onContactAdded',
    /**
     * Represents [[onOrder]]
     */
    Order = 'onOrder',
}

// Forward declarations
const MessageSchemaBase = z.object({
    id: MessageIdSchema,
    body: z.string(),
    type: z.nativeEnum(MessageTypes),
    t: z.number(),
    notifyName: z.string().optional(),
    from: ChatIdSchema,
    to: ChatIdSchema,
    self: z.enum(['in', 'out']),
    ack: z.nativeEnum(MessageAck),
    invis: z.boolean().optional(),
    isNewMsg: z.boolean().optional(),
    star: z.boolean().optional(),
    recvFresh: z.boolean().optional(),
    broadcast: z.boolean().optional(),
    isForwarded: z.boolean().optional(),
    labels: z.array(z.string()).optional(),
    mentionedJidList: z.array(ContactIdSchema).optional(),
    caption: z.string().optional(),
    sender: z.any(), // Circular reference handled later/lazy
    timestamp: z.number(),
    content: z.string(),
    isGroupMsg: z.boolean(),
    isMMS: z.boolean().optional(),
    isMedia: z.boolean(),
    isNotification: z.boolean(),
    isPSA: z.boolean().optional(),
    fromMe: z.boolean(),
    chat: z.any(), // Circular reference handled later/lazy
    chatId: ChatIdSchema,
    author: z.string().optional(),
    clientUrl: z.string().optional(),
    deprecatedMms3Url: z.string().optional(),
    isQuotedMsgAvailable: z.boolean(),
    quotedMsg: z.any().optional(), // z.lazy(() => MessageSchema.optional()),
    quotedMsgObj: z.any().optional(), // z.lazy(() => MessageSchema.optional()),
    senderId: z.string().optional(),
}).passthrough();


// Contact
export const ContactSchema = z.object({
    id: ContactIdSchema,
    name: z.string().optional(),
    shortName: z.string().optional(),
    pushname: z.string().optional(),
    formattedName: z.string().optional(),
    isBusiness: z.boolean().optional(),
    isEnterprise: z.boolean().optional(),
    isMe: z.boolean().optional(),
    isMyContact: z.boolean().optional(),
    isPSA: z.boolean().optional(),
    isUser: z.boolean().optional(),
    isWAContact: z.boolean().optional(),
    labels: z.array(z.string()).optional(),
    msgs: z.array(z.any()).optional(), // Avoid infinite recursion
    profilePicThumbObj: z.object({
        eurl: z.string().optional(),
        id: IdSchema.optional(),
        img: z.string().optional(),
        imgFull: z.string().optional(),
        tag: z.string().optional(),
    }).optional(),
    statusMute: z.boolean().optional(),
    type: z.string().optional(),
    verifiedLevel: z.number().optional(),
    verifiedName: z.string().optional(),
    isOnline: z.boolean().optional(),
    lastSeen: z.number().optional(),
}).passthrough();

export type Contact = z.infer<typeof ContactSchema>;

// Chat
export const ChatSchema = z.object({
    id: ContactIdSchema.or(GroupChatIdSchema),
    name: z.string().optional(),
    formattedTitle: z.string().optional(),
    isGroup: z.boolean(),
    contact: ContactSchema,
    groupMetadata: z.any().optional(), // Metadata
    presence: z.any().optional(),
    t: z.number().optional(),
    unreadCount: z.number().optional(),
    lastReceivedKey: z.any().optional(),
    msgs: z.array(z.any()).optional(), // Avoid infinite recursion
    isReadOnly: z.boolean().optional(),
    muteExpiration: z.number().optional(),
    notSpam: z.boolean().optional(),
    pin: z.number().optional(),
    ack: z.any().optional(),
}).passthrough();

export type Chat = z.infer<typeof ChatSchema>;

// Full Message Schema with implementations
export const MessageSchema = MessageSchemaBase.extend({
    sender: ContactSchema,
    chat: ChatSchema,
});

export type Message = z.infer<typeof MessageSchema>;

// Additional return types
export const MessageIdReturnSchema = z.object({
    _serialized: z.string(),
}).passthrough();
