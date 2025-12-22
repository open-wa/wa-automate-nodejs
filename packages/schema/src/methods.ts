import { z } from 'zod';
import { defineMethodV2 } from './registry';
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
// Methods (Dual-Mode Support)
// ============================================================================

// 1. sendText
export const sendText = defineMethodV2('sendText', {
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

// 2. sendImage
export const sendImage = defineMethodV2('sendImage', {
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

// 3. getAllMessages
export const getAllMessages = defineMethodV2('getAllMessages', {
    meta: {
        description: 'Retrieves all messages in the session',
        action: 'read',
        namespace: 'messages',
        license: 'none',
        functionality: 'both',
        httpMethod: 'GET',
    },
    input: z.object({
        chatId: toParam.optional(),
        includeMe: includeMeParam,
        includeNotifications: includeNotificationsParam,
    }),
    parameterOrder: ['chatId', 'includeMe', 'includeNotifications'],
    output: z.array(MessageSchema)
});

// 4. getAllChats
export const getAllChats = defineMethodV2('getAllChats', {
    meta: {
        description: 'Retrieves all chats',
        action: 'read',
        namespace: 'chats',
        license: 'none',
        functionality: 'both',
        httpMethod: 'GET',
    },
    input: z.object({
        withNewMessagesOnly: withNewMessagesOnlyParam
    }),
    parameterOrder: ['withNewMessagesOnly'],
    output: z.array(ChatSchema)
});

// 5. getAllContacts
export const getAllContacts = defineMethodV2('getAllContacts', {
    meta: {
        description: 'Retrieves all contacts',
        action: 'read',
        namespace: 'contacts',
        license: 'none',
        functionality: 'both',
        httpMethod: 'GET',
    },
    input: z.object({}),
    parameterOrder: [],
    output: z.array(ContactSchema)
});

// 6. getMessageById
export const getMessageById = defineMethodV2('getMessageById', {
    meta: {
        description: 'Retrieves a specific message by ID',
        action: 'read',
        namespace: 'messages',
        license: 'none',
        functionality: 'both',
        httpMethod: 'GET',
    },
    input: z.object({
        messageId: messageIdParam
    }),
    parameterOrder: ['messageId'],
    output: MessageSchema
});

// 7. deleteMessage
export const deleteMessage = defineMethodV2('deleteMessage', {
    meta: {
        description: 'Deletes a message',
        action: 'delete',
        namespace: 'messages',
        license: 'none',
        functionality: 'both',
        httpMethod: 'DELETE',
    },
    input: z.object({
        chatId: toParam,
        messageId: messageIdsParam,
        onlyLocal: onlyLocalParam
    }),
    parameterOrder: ['chatId', 'messageId', 'onlyLocal'],
    output: z.boolean()
});

// 8. forwardMessages
export const forwardMessages = defineMethodV2('forwardMessages', {
    meta: {
        description: 'Forwards messages to a chat',
        action: 'send',
        namespace: 'messages',
        license: 'none',
        functionality: 'both',
        httpMethod: 'POST',
    },
    input: z.object({
        to: toParam,
        messages: messageIdsParam,
        skipMyMessages: skipMyMessagesParam
    }),
    parameterOrder: ['to', 'messages', 'skipMyMessages'],
    output: z.array(MessageIdReturnSchema).or(z.boolean())
});

// 9. sendLocation
export const sendLocation = defineMethodV2('sendLocation', {
    meta: {
        description: 'Sends a location to a chat',
        action: 'send',
        namespace: 'messages',
        license: 'none',
        functionality: 'both',
        httpMethod: 'POST',
    },
    input: z.object({
        to: toParam,
        lat: latitudeParam,
        lng: longitudeParam,
        loc: locationNameParam
    }),
    parameterOrder: ['to', 'lat', 'lng', 'loc'],
    output: MessageIdReturnSchema.or(z.boolean())
});

// 10. getGroupMembers
export const getGroupMembers = defineMethodV2('getGroupMembers', {
    meta: {
        description: 'Retrieves members of a group',
        action: 'read',
        namespace: 'groups',
        license: 'none',
        functionality: 'both',
        httpMethod: 'GET',
    },
    input: z.object({
        groupId: groupIdParam
    }),
    parameterOrder: ['groupId'],
    output: z.array(ContactSchema)
});
