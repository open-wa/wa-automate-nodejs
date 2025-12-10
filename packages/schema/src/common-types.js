"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageIdReturnSchema = exports.MessageSchema = exports.ChatSchema = exports.ContactSchema = exports.MessageAck = exports.MessageTypes = exports.IdSchema = exports.GroupChatIdSchema = exports.MessageIdSchema = exports.ChatIdSchema = exports.ContactIdSchema = void 0;
const zod_1 = require("zod");
exports.ContactIdSchema = zod_1.z.string().brand('ContactId');
exports.ChatIdSchema = zod_1.z.string().brand('ChatId');
exports.MessageIdSchema = zod_1.z.string().brand('MessageId');
exports.GroupChatIdSchema = zod_1.z.string().brand('GroupChatId');
exports.IdSchema = zod_1.z.object({
    server: zod_1.z.string(),
    user: zod_1.z.string(),
    _serialized: zod_1.z.string(),
});
var MessageTypes;
(function (MessageTypes) {
    MessageTypes["TEXT"] = "chat";
    MessageTypes["AUDIO"] = "audio";
    MessageTypes["VOICE"] = "ptt";
    MessageTypes["IMAGE"] = "image";
    MessageTypes["VIDEO"] = "video";
    MessageTypes["DOCUMENT"] = "document";
    MessageTypes["STICKER"] = "sticker";
    MessageTypes["LOCATION"] = "location";
    MessageTypes["CONTACT_CARD"] = "vcard";
    MessageTypes["CONTACT_CARD_MULTI"] = "multi_vcard";
    MessageTypes["REVOKED"] = "revoked";
    MessageTypes["ORDER"] = "order";
    MessageTypes["BUTTONS_RESPONSE"] = "buttons_response";
    MessageTypes["LIST_RESPONSE"] = "list_response";
    MessageTypes["UNKNOWN"] = "unknown";
})(MessageTypes || (exports.MessageTypes = MessageTypes = {}));
var MessageAck;
(function (MessageAck) {
    MessageAck[MessageAck["ACK_ERROR"] = -1] = "ACK_ERROR";
    MessageAck[MessageAck["ACK_PENDING"] = 0] = "ACK_PENDING";
    MessageAck[MessageAck["ACK_SERVER"] = 1] = "ACK_SERVER";
    MessageAck[MessageAck["ACK_DEVICE"] = 2] = "ACK_DEVICE";
    MessageAck[MessageAck["ACK_READ"] = 3] = "ACK_READ";
    MessageAck[MessageAck["ACK_PLAYED"] = 4] = "ACK_PLAYED";
})(MessageAck || (exports.MessageAck = MessageAck = {}));
const MessageSchemaBase = zod_1.z.object({
    id: exports.MessageIdSchema,
    body: zod_1.z.string(),
    type: zod_1.z.nativeEnum(MessageTypes),
    t: zod_1.z.number(),
    notifyName: zod_1.z.string().optional(),
    from: exports.ChatIdSchema,
    to: exports.ChatIdSchema,
    self: zod_1.z.enum(['in', 'out']),
    ack: zod_1.z.nativeEnum(MessageAck),
    invis: zod_1.z.boolean().optional(),
    isNewMsg: zod_1.z.boolean().optional(),
    star: zod_1.z.boolean().optional(),
    recvFresh: zod_1.z.boolean().optional(),
    broadcast: zod_1.z.boolean().optional(),
    isForwarded: zod_1.z.boolean().optional(),
    labels: zod_1.z.array(zod_1.z.string()).optional(),
    mentionedJidList: zod_1.z.array(exports.ContactIdSchema).optional(),
    caption: zod_1.z.string().optional(),
    sender: zod_1.z.any(),
    timestamp: zod_1.z.number(),
    content: zod_1.z.string(),
    isGroupMsg: zod_1.z.boolean(),
    isMMS: zod_1.z.boolean().optional(),
    isMedia: zod_1.z.boolean(),
    isNotification: zod_1.z.boolean(),
    isPSA: zod_1.z.boolean().optional(),
    fromMe: zod_1.z.boolean(),
    chat: zod_1.z.any(),
    chatId: exports.ChatIdSchema,
    author: zod_1.z.string().optional(),
    clientUrl: zod_1.z.string().optional(),
    deprecatedMms3Url: zod_1.z.string().optional(),
    isQuotedMsgAvailable: zod_1.z.boolean(),
    quotedMsg: zod_1.z.any().optional(),
    quotedMsgObj: zod_1.z.any().optional(),
    senderId: zod_1.z.string().optional(),
}).passthrough();
exports.ContactSchema = zod_1.z.object({
    id: exports.ContactIdSchema,
    name: zod_1.z.string().optional(),
    shortName: zod_1.z.string().optional(),
    pushname: zod_1.z.string().optional(),
    formattedName: zod_1.z.string().optional(),
    isBusiness: zod_1.z.boolean().optional(),
    isEnterprise: zod_1.z.boolean().optional(),
    isMe: zod_1.z.boolean().optional(),
    isMyContact: zod_1.z.boolean().optional(),
    isPSA: zod_1.z.boolean().optional(),
    isUser: zod_1.z.boolean().optional(),
    isWAContact: zod_1.z.boolean().optional(),
    labels: zod_1.z.array(zod_1.z.string()).optional(),
    msgs: zod_1.z.array(zod_1.z.any()).optional(),
    profilePicThumbObj: zod_1.z.object({
        eurl: zod_1.z.string().optional(),
        id: exports.IdSchema.optional(),
        img: zod_1.z.string().optional(),
        imgFull: zod_1.z.string().optional(),
        tag: zod_1.z.string().optional(),
    }).optional(),
    statusMute: zod_1.z.boolean().optional(),
    type: zod_1.z.string().optional(),
    verifiedLevel: zod_1.z.number().optional(),
    verifiedName: zod_1.z.string().optional(),
    isOnline: zod_1.z.boolean().optional(),
    lastSeen: zod_1.z.number().optional(),
}).passthrough();
exports.ChatSchema = zod_1.z.object({
    id: exports.ContactIdSchema.or(exports.GroupChatIdSchema),
    name: zod_1.z.string().optional(),
    formattedTitle: zod_1.z.string().optional(),
    isGroup: zod_1.z.boolean(),
    contact: exports.ContactSchema,
    groupMetadata: zod_1.z.any().optional(),
    presence: zod_1.z.any().optional(),
    t: zod_1.z.number().optional(),
    unreadCount: zod_1.z.number().optional(),
    lastReceivedKey: zod_1.z.any().optional(),
    msgs: zod_1.z.array(zod_1.z.any()).optional(),
    isReadOnly: zod_1.z.boolean().optional(),
    muteExpiration: zod_1.z.number().optional(),
    notSpam: zod_1.z.boolean().optional(),
    pin: zod_1.z.number().optional(),
    ack: zod_1.z.any().optional(),
}).passthrough();
exports.MessageSchema = MessageSchemaBase.extend({
    sender: exports.ContactSchema,
    chat: exports.ChatSchema,
});
exports.MessageIdReturnSchema = zod_1.z.object({
    _serialized: zod_1.z.string(),
}).passthrough();
//# sourceMappingURL=common-types.js.map