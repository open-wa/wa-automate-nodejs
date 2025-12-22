import { z } from 'zod';
import { defineMethod, defineMethodV2 } from './registry';
import { MessageSchema, ChatSchema, ContactSchema, MessageIdReturnSchema } from './common-types';


// ============================================================================
// V2 Methods (Dual-Mode Support)
// ============================================================================

import {
    toParam,
    contentParam,
    messageOptionsParam,
    imageDataParam,
    filenameParam,
    captionParam,
    messageIdParam,
    waitForIdParam,
    includeMeParam,
    includeNotificationsParam,
    withNewMessagesOnlyParam,
    messageIdsParam,
    onlyLocalParam,
    skipMyMessagesParam,
    latitudeParam,
    longitudeParam,
    locationNameParam,
    groupIdParam
} from './parameters';

// ============================================================================
// V2 Methods (Dual-Mode Support)
// ============================================================================

// Example: sendText with V2 dual-mode support
export const sendTextV2 = defineMethodV2('sendText', {
    meta: {
        description: 'Sends a text message to a chat',
        action: 'send',
        namespace: 'messages',
        license: 'none',
        functionality: 'both',
        httpMethod: 'POST',
    },
    input: z.object({
        to: toParam,
        content: contentParam,
        options: messageOptionsParam
    }),
    parameterOrder: ['to', 'content', 'options'],
    output: MessageIdReturnSchema.or(z.boolean()).or(z.string())
});

// Example: sendImage with V2 dual-mode support and parameter examples
export const sendImageV2 = defineMethodV2('sendImage', {
    meta: {
        description: 'Sends an image to a chat',
        action: 'send',
        namespace: 'messages',
        license: 'none',
        functionality: 'both',
        httpMethod: 'POST',
    },
    input: z.object({
        to: toParam,
        imgData: imageDataParam,
        filename: filenameParam,
        caption: captionParam,
        id: messageIdParam.optional(),
        waitForId: waitForIdParam
    }),
    parameterOrder: ['to', 'imgData', 'filename', 'caption', 'id', 'waitForId'],
    output: MessageIdReturnSchema.or(z.boolean()).or(z.string())
});

// ============================================================================
// Legacy Methods (Backward Compatibility)
// ============================================================================

// 1. sendText
export const sendText = defineMethod('sendText', {
    meta: {
        description: 'Sends a text message to a chat',
        example: 'await client.sendText("1234567890@c.us", "Hello world!")'
    },
    input: z.object({
        to: toParam,
        content: contentParam,
        options: messageOptionsParam
    }),
    output: MessageIdReturnSchema.or(z.boolean()).or(z.string())
});

// 2. sendImage
export const sendImage = defineMethod('sendImage', {
    meta: {
        description: 'Sends an image to a chat',
    },
    input: z.object({
        to: toParam,
        imgData: imageDataParam,
        filename: filenameParam,
        caption: captionParam,
        id: messageIdParam.optional(),
        waitForId: waitForIdParam
    }),
    output: MessageIdReturnSchema.or(z.boolean()).or(z.string())
});

// 3. getAllMessages
export const getAllMessages = defineMethod('getAllMessages', {
    meta: {
        description: 'Retrieves all messages in the session',
    },
    input: z.object({
        chatId: toParam.optional(),
        includeMe: includeMeParam,
        includeNotifications: includeNotificationsParam,
    }),
    output: z.array(MessageSchema)
});

// 4. getAllChats
export const getAllChats = defineMethod('getAllChats', {
    meta: {
        description: 'Retrieves all chats',
    },
    input: z.object({
        withNewMessagesOnly: withNewMessagesOnlyParam
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
        messageId: messageIdParam
    }),
    output: MessageSchema
});

// 7. deleteMessage
export const deleteMessage = defineMethod('deleteMessage', {
    meta: {
        description: 'Deletes a message',
    },
    input: z.object({
        chatId: toParam,
        messageId: messageIdsParam,
        onlyLocal: onlyLocalParam
    }),
    output: z.boolean()
});

// 8. forwardMessages
export const forwardMessages = defineMethod('forwardMessages', {
    meta: {
        description: 'Forwards messages to a chat',
    },
    input: z.object({
        to: toParam,
        messages: messageIdsParam,
        skipMyMessages: skipMyMessagesParam
    }),
    output: z.array(MessageIdReturnSchema).or(z.boolean())
});

// 9. sendLocation
export const sendLocation = defineMethod('sendLocation', {
    meta: {
        description: 'Sends a location to a chat',
    },
    input: z.object({
        to: toParam,
        lat: latitudeParam,
        lng: longitudeParam,
        loc: locationNameParam
    }),
    output: MessageIdReturnSchema.or(z.boolean())
});

// 10. getGroupMembers
export const getGroupMembers = defineMethod('getGroupMembers', {
    meta: {
        description: 'Retrieves members of a group',
    },
    input: z.object({
        groupId: groupIdParam
    }),
    output: z.array(ContactSchema)
});
