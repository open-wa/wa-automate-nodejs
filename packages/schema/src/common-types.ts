import { z } from 'zod';

// Aliases
export const ContactIdSchema = z.string().brand('ContactId').describe('Opaque WhatsApp contact identifier. Preserve the exact value returned by the API.');
export type ContactId = z.infer<typeof ContactIdSchema>;

export const ChatIdSchema = z.string().brand('ChatId').describe('Opaque conversation identifier. Use the exact value returned by a message event or chat lookup.');
export type ChatId = z.infer<typeof ChatIdSchema>;

export const MessageIdSchema = z.string().brand('MessageId').describe('Message identifier returned by a send method or message event.');
export type MessageId = z.infer<typeof MessageIdSchema>;

export const GroupChatIdSchema = z.string().brand('GroupChatId').describe('Opaque group conversation identifier returned by a group lookup or join method.');
export type GroupChatId = z.infer<typeof GroupChatIdSchema>;

export const GroupIdSchema = z.string().brand('GroupId').describe('Identifier for a WhatsApp group. Use the value returned by the API.');
export type GroupId = z.infer<typeof GroupIdSchema>;

export const DataURLSchema = z.templateLiteral(['data:', z.string(), ';base64,', z.string()]);
export type DataURL = z.infer<typeof DataURLSchema>;
export type Base64 = string;
export type Content = string | DataURL | Base64 | Buffer;

export const GroupMetadataSchema = z.object({
    id: GroupIdSchema,
    subject: z.string(),
    creation: z.number(),
    owner: ContactIdSchema.optional(),
    desc: z.string().optional(),
    descTime: z.number().optional(),
    descOwner: ContactIdSchema.optional(),
    restrict: z.boolean().optional(),
    announce: z.boolean().optional(),
    participants: z.array(z.object({
        id: ContactIdSchema,
        isAdmin: z.boolean(),
        isSuperAdmin: z.boolean().optional(),
    })),
}).passthrough().describe('Serialized group metadata returned by group lookups. Additional WhatsApp Web fields may be present.');
export type GroupMetadata = z.infer<typeof GroupMetadataSchema>;

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
    ALBUM = 'album',
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
    expectedImageCount: z.number().int().nonnegative().nullable().optional()
        .describe('Number of image messages declared by an album container; not a received-media count.'),
    expectedVideoCount: z.number().int().nonnegative().nullable().optional()
        .describe('Number of video messages declared by an album container, including GIF videos.'),
    parentMsgKey: MessageIdSchema.nullable().optional()
        .describe('Serialized parent message ID for associated media.'),
    associationType: z.string().nullable().optional()
        .describe('WhatsApp association type. Album media uses MEDIA_ALBUM.'),
    isGif: z.boolean().optional(),
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
    msgs: z.array(z.unknown()).nullable().optional(), // Raw nested messages avoid recursive serialization
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

// Location
export const LocationSchema = z.object({
    lat: z.number().describe('Latitude coordinate'),
    lng: z.number().describe('Longitude coordinate'),
    name: z.string().optional().describe('Location name'),
    address: z.string().optional().describe('Formatted address'),
    url: z.string().optional().describe('WhatsApp location URL'),
}).passthrough();

export type Location = z.infer<typeof LocationSchema>;

// Chat
export const ChatSchema = z.object({
    id: ChatIdSchema,
    name: z.string().optional(),
    formattedTitle: z.string().optional(),
    isGroup: z.boolean(),
    contact: ContactSchema.nullable(),
    groupMetadata: GroupMetadataSchema.nullable().optional(),
    presence: z.record(z.string(), z.unknown()).nullable().optional(),
    t: z.number().optional(),
    unreadCount: z.number().optional(),
    lastReceivedKey: z.any().optional(),
    msgs: z.array(z.unknown()).nullable().optional(), // Raw nested messages avoid recursive serialization
    isReadOnly: z.boolean().optional(),
    muteExpiration: z.number().optional(),
    notSpam: z.boolean().optional(),
    pin: z.number().optional(),
    ack: z.any().optional(),
}).passthrough().describe('Serialized chat returned by chat lookups and listings. Its id is an opaque ChatId; additional WhatsApp Web fields may be present.');

export type Chat = z.infer<typeof ChatSchema>;

// Full Message Schema with implementations
export const MessageSchema = MessageSchemaBase.extend({
    sender: ContactSchema,
    chat: ChatSchema,
});

export type Message = z.infer<typeof MessageSchema>;

// Additional return types
export const SerializedMessageIdSchema = z.object({
    _serialized: z.string(),
}).passthrough();

export const MessageIdReturnSchema = z.union([MessageIdSchema, SerializedMessageIdSchema])
    .describe('A message ID as a string or an object containing the serialized ID. Validate it before passing it to another method.');
export type MessageIdReturn = z.infer<typeof MessageIdReturnSchema>;

export type SerializedMessageId = z.infer<typeof SerializedMessageIdSchema>;
