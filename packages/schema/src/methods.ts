import { z } from 'zod';
import { defineMethod } from './registry';
import { MessageSchema, ChatSchema, ContactSchema, MessageIdReturnSchema } from './common-types';

// 1. sendText
export const sendText = defineMethod('sendText', {
    meta: {
        description: 'Sends a text message to a chat',
        example: 'await client.sendText("1234567890@c.us", "Hello world!")'
    },
    input: z.object({
        to: z.string().describe('The chat id to send to'),
        content: z.string().describe('The text content to send'),
        options: z.any().optional().describe('Message options')
    }),
    output: MessageIdReturnSchema.or(z.boolean()).or(z.string())
});

// 2. sendImage
export const sendImage = defineMethod('sendImage', {
    meta: {
        description: 'Sends an image to a chat',
    },
    input: z.object({
        to: z.string(),
        imgData: z.string().describe('Base64 data or URL'),
        filename: z.string().optional(),
        caption: z.string().optional(),
        id: z.string().optional().describe('Quoted message ID'),
        waitForId: z.boolean().optional().default(false)
    }),
    output: MessageIdReturnSchema.or(z.boolean()).or(z.string())
});

// 3. getAllMessages
export const getAllMessages = defineMethod('getAllMessages', {
    meta: {
        description: 'Retrieves all messages in the session',
    },
    input: z.object({
        chatId: z.string().optional(),
        includeMe: z.boolean().optional().default(true),
        includeNotifications: z.boolean().optional().default(false),
    }),
    output: z.array(MessageSchema)
});

// 4. getAllChats
export const getAllChats = defineMethod('getAllChats', {
    meta: {
        description: 'Retrieves all chats',
    },
    input: z.object({
        withNewMessagesOnly: z.boolean().optional().default(false)
    }),
    output: z.array(ChatSchema)
});

// 5. getAllContacts
export const getAllContacts = defineMethod('getAllContacts', {
    meta: {
        description: 'Retrieves all contacts',
    },
    input: z.object({}),
    output: z.array(ContactSchema)
});

// 6. getMessageById
export const getMessageById = defineMethod('getMessageById', {
    meta: {
        description: 'Retrieves a specific message by ID',
    },
    input: z.object({
        messageId: z.string()
    }),
    output: MessageSchema
});

// 7. deleteMessage
export const deleteMessage = defineMethod('deleteMessage', {
    meta: {
        description: 'Deletes a message',
    },
    input: z.object({
        chatId: z.string(),
        messageId: z.array(z.string()).or(z.string()),
        onlyLocal: z.boolean().optional().default(false)
    }),
    output: z.boolean()
});

// 8. forwardMessages
export const forwardMessages = defineMethod('forwardMessages', {
    meta: {
        description: 'Forwards messages to a chat',
    },
    input: z.object({
        to: z.string(),
        messages: z.array(z.string()).or(z.string()),
        skipMyMessages: z.boolean().optional().default(false)
    }),
    output: z.array(MessageIdReturnSchema).or(z.boolean())
});

// 9. sendLocation
export const sendLocation = defineMethod('sendLocation', {
    meta: {
        description: 'Sends a location to a chat',
    },
    input: z.object({
        to: z.string(),
        lat: z.any(), // can be number or string
        lng: z.any(),
        loc: z.string().optional()
    }),
    output: MessageIdReturnSchema.or(z.boolean())
});

// 10. getGroupMembers
export const getGroupMembers = defineMethod('getGroupMembers', {
    meta: {
        description: 'Retrieves members of a group',
    },
    input: z.object({
        groupId: z.string()
    }),
    output: z.array(ContactSchema)
});
