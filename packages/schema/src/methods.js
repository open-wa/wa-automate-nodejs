"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGroupMembers = exports.sendLocation = exports.forwardMessages = exports.deleteMessage = exports.getMessageById = exports.getAllContacts = exports.getAllChats = exports.getAllMessages = exports.sendImage = exports.sendText = void 0;
const zod_1 = require("zod");
const registry_1 = require("./registry");
const common_types_1 = require("./common-types");
exports.sendText = (0, registry_1.defineMethod)('sendText', {
    meta: {
        description: 'Sends a text message to a chat',
        example: 'await client.sendText("1234567890@c.us", "Hello world!")'
    },
    input: zod_1.z.object({
        to: zod_1.z.string().describe('The chat id to send to'),
        content: zod_1.z.string().describe('The text content to send'),
        options: zod_1.z.any().optional().describe('Message options')
    }),
    output: common_types_1.MessageIdReturnSchema.or(zod_1.z.boolean()).or(zod_1.z.string())
});
exports.sendImage = (0, registry_1.defineMethod)('sendImage', {
    meta: {
        description: 'Sends an image to a chat',
    },
    input: zod_1.z.object({
        to: zod_1.z.string(),
        imgData: zod_1.z.string().describe('Base64 data or URL'),
        filename: zod_1.z.string().optional(),
        caption: zod_1.z.string().optional(),
        id: zod_1.z.string().optional().describe('Quoted message ID'),
        waitForId: zod_1.z.boolean().optional().default(false)
    }),
    output: common_types_1.MessageIdReturnSchema.or(zod_1.z.boolean()).or(zod_1.z.string())
});
exports.getAllMessages = (0, registry_1.defineMethod)('getAllMessages', {
    meta: {
        description: 'Retrieves all messages in the session',
    },
    input: zod_1.z.object({
        chatId: zod_1.z.string().optional(),
        includeMe: zod_1.z.boolean().optional().default(true),
        includeNotifications: zod_1.z.boolean().optional().default(false),
    }),
    output: zod_1.z.array(common_types_1.MessageSchema)
});
exports.getAllChats = (0, registry_1.defineMethod)('getAllChats', {
    meta: {
        description: 'Retrieves all chats',
    },
    input: zod_1.z.object({
        withNewMessagesOnly: zod_1.z.boolean().optional().default(false)
    }),
    output: zod_1.z.array(common_types_1.ChatSchema)
});
exports.getAllContacts = (0, registry_1.defineMethod)('getAllContacts', {
    meta: {
        description: 'Retrieves all contacts',
    },
    input: zod_1.z.object({}),
    output: zod_1.z.array(common_types_1.ContactSchema)
});
exports.getMessageById = (0, registry_1.defineMethod)('getMessageById', {
    meta: {
        description: 'Retrieves a specific message by ID',
    },
    input: zod_1.z.object({
        messageId: zod_1.z.string()
    }),
    output: common_types_1.MessageSchema
});
exports.deleteMessage = (0, registry_1.defineMethod)('deleteMessage', {
    meta: {
        description: 'Deletes a message',
    },
    input: zod_1.z.object({
        chatId: zod_1.z.string(),
        messageId: zod_1.z.array(zod_1.z.string()).or(zod_1.z.string()),
        onlyLocal: zod_1.z.boolean().optional().default(false)
    }),
    output: zod_1.z.boolean()
});
exports.forwardMessages = (0, registry_1.defineMethod)('forwardMessages', {
    meta: {
        description: 'Forwards messages to a chat',
    },
    input: zod_1.z.object({
        to: zod_1.z.string(),
        messages: zod_1.z.array(zod_1.z.string()).or(zod_1.z.string()),
        skipMyMessages: zod_1.z.boolean().optional().default(false)
    }),
    output: zod_1.z.array(common_types_1.MessageIdReturnSchema).or(zod_1.z.boolean())
});
exports.sendLocation = (0, registry_1.defineMethod)('sendLocation', {
    meta: {
        description: 'Sends a location to a chat',
    },
    input: zod_1.z.object({
        to: zod_1.z.string(),
        lat: zod_1.z.any(),
        lng: zod_1.z.any(),
        loc: zod_1.z.string().optional()
    }),
    output: common_types_1.MessageIdReturnSchema.or(zod_1.z.boolean())
});
exports.getGroupMembers = (0, registry_1.defineMethod)('getGroupMembers', {
    meta: {
        description: 'Retrieves members of a group',
    },
    input: zod_1.z.object({
        groupId: zod_1.z.string()
    }),
    output: zod_1.z.array(common_types_1.ContactSchema)
});
//# sourceMappingURL=methods.js.map