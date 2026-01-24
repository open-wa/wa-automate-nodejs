import { z } from 'zod';
import { defineMethodV2 } from '../registry';
import { MessageIdReturnSchema } from '../common-types';
import {
    toParam,
    contentParam,
    messageOptionsParam,
    imageDataParam,
    filenameParam,
    captionParam,
    messageIdParam,
    waitForIdParam,
    messageIdsParam,
    skipMyMessagesParam,
    latitudeParam,
    longitudeParam,
    locationNameParam,
    contactIdParam,
    mentionedJidListParam,
    fileDataParam,
    audioDataParam,
    videoDataParam
} from '../parameters';

// ============================================================================
// Messaging Methods
// ============================================================================

/**
 * Sends a text message to a chat
 */
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

/**
 * Sends a text message with mentions
 */
export const sendTextWithMentions = defineMethodV2('sendTextWithMentions', {
    meta: {
        description: 'Sends a text message that includes @mentions',
        action: 'send',
        namespace: 'messages',
        license: 'none',
        functionality: 'both',
        httpMethod: 'POST',
    },
    input: z.object({
        to: toParam,
        content: contentParam,
        hideTags: z.boolean().optional().describe('Removes all tags within the message'),
        mentions: mentionedJidListParam
    }),
    parameterOrder: ['to', 'content', 'hideTags', 'mentions'],
    output: MessageIdReturnSchema.or(z.boolean())
});

/**
 * Sends a reply with mentions
 */
export const sendReplyWithMentions = defineMethodV2('sendReplyWithMentions', {
    meta: {
        description: 'Sends a reply to a message that includes @mentions',
        action: 'send',
        namespace: 'messages',
        license: 'none',
        functionality: 'both',
        httpMethod: 'POST',
    },
    input: z.object({
        to: toParam,
        content: contentParam,
        replyMessageId: messageIdParam,
        hideTags: z.boolean().optional().describe('Removes all tags within the message'),
        mentions: mentionedJidListParam
    }),
    parameterOrder: ['to', 'content', 'replyMessageId', 'hideTags', 'mentions'],
    output: MessageIdReturnSchema.or(z.boolean())
});

/**
 * Sends a payment request
 */
export const sendPaymentRequest = defineMethodV2('sendPaymentRequest', {
    meta: {
        description: 'Sends a payment request message',
        action: 'send',
        namespace: 'messages',
        license: 'none',
        functionality: 'both',
        httpMethod: 'POST',
    },
    input: z.object({
        to: toParam,
        amount: z.number().describe('Amount in 1000 format (e.g £10 => 10000)'),
        currency: z.string().length(3).describe('3 letter currency code'),
        message: z.string().optional().describe('Optional message')
    }),
    parameterOrder: ['to', 'amount', 'currency', 'message'],
    output: MessageIdReturnSchema.or(z.boolean())
});

/**
 * Sends an image to a chat
 */
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

/**
 * Sends a file/document
 */
export const sendFile = defineMethodV2('sendFile', {
    meta: {
        description: 'Sends a file or document to a chat',
        action: 'send',
        namespace: 'messages',
        license: 'none',
        functionality: 'both',
        httpMethod: 'POST',
    },
    input: z.object({
        to: toParam,
        file: fileDataParam,
        filename: filenameParam,
        caption: captionParam
    }),
    parameterOrder: ['to', 'file', 'filename', 'caption'],
    output: MessageIdReturnSchema.or(z.string())
});

/**
 * Sends an audio file
 */
export const sendAudio = defineMethodV2('sendAudio', {
    meta: {
        description: 'Sends an audio file to a chat',
        action: 'send',
        namespace: 'messages',
        license: 'none',
        functionality: 'both',
        httpMethod: 'POST',
    },
    input: z.object({
        to: toParam,
        file: audioDataParam,
        filename: filenameParam,
        quotedMsgId: messageIdParam.optional()
    }),
    parameterOrder: ['to', 'file', 'filename', 'quotedMsgId'],
    output: MessageIdReturnSchema.or(z.boolean())
});

/**
 * Sends a voice note (PTT)
 */
export const sendPtt = defineMethodV2('sendPtt', {
    meta: {
        description: 'Sends a voice note (push-to-talk) to a chat',
        action: 'send',
        namespace: 'messages',
        license: 'none',
        functionality: 'both',
        httpMethod: 'POST',
    },
    input: z.object({
        to: toParam,
        file: audioDataParam,
        quotedMsgId: messageIdParam.optional()
    }),
    parameterOrder: ['to', 'file', 'quotedMsgId'],
    output: MessageIdReturnSchema.or(z.boolean())
});

/**
 * Sends a video as GIF
 */
export const sendVideoAsGif = defineMethodV2('sendVideoAsGif', {
    meta: {
        description: 'Sends a video as an animated GIF',
        action: 'send',
        namespace: 'messages',
        license: 'none',
        functionality: 'both',
        httpMethod: 'POST',
    },
    input: z.object({
        to: toParam,
        file: videoDataParam,
        filename: filenameParam,
        caption: captionParam,
        quotedMsgId: messageIdParam.optional()
    }),
    parameterOrder: ['to', 'file', 'filename', 'caption', 'quotedMsgId'],
    output: MessageIdReturnSchema.or(z.boolean())
});

/**
 * Sends a location
 */
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
        loc: locationNameParam,
        address: z.string().optional().describe('Address text'),
        url: z.string().url().optional().describe('Address link')
    }),
    parameterOrder: ['to', 'lat', 'lng', 'loc', 'address', 'url'],
    output: MessageIdReturnSchema.or(z.boolean())
});

/**
 * Sends a vCard
 */
export const sendVCard = defineMethodV2('sendVCard', {
    meta: {
        description: 'Sends a contact card (vCard)',
        action: 'send',
        namespace: 'messages',
        license: 'none',
        functionality: 'both',
        httpMethod: 'POST',
    },
    input: z.object({
        chatId: toParam,
        vcard: z.string().describe('vCard string'),
        contactName: z.string().optional().describe('Contact display name'),
        contactNumber: z.string().optional().describe('Contact number with country code')
    }),
    parameterOrder: ['chatId', 'vcard', 'contactName', 'contactNumber'],
    output: z.boolean()
});

/**
 * Sends a contact
 */
export const sendContact = defineMethodV2('sendContact', {
    meta: {
        description: 'Sends a single contact',
        action: 'send',
        namespace: 'messages',
        license: 'none',
        functionality: 'both',
        httpMethod: 'POST',
    },
    input: z.object({
        to: toParam,
        contactId: contactIdParam.or(z.array(contactIdParam))
    }),
    parameterOrder: ['to', 'contactId'],
    output: MessageIdReturnSchema.or(z.boolean())
});

/**
 * Sends multiple contacts
 */
export const sendMultipleContacts = defineMethodV2('sendMultipleContacts', {
    meta: {
        description: 'Sends multiple contacts',
        action: 'send',
        namespace: 'messages',
        license: 'none',
        functionality: 'both',
        httpMethod: 'POST',
    },
    input: z.object({
        to: toParam,
        contactIds: z.array(contactIdParam)
    }),
    parameterOrder: ['to', 'contactIds'],
    output: MessageIdReturnSchema.or(z.boolean())
});

/**
 * Sends button message
 */
export const sendButtons = defineMethodV2('sendButtons', {
    meta: {
        description: 'Sends a button message (deprecated)',
        action: 'send',
        namespace: 'messages',
        license: 'insiders',
        functionality: 'both',
        httpMethod: 'POST',
    },
    input: z.object({
        to: toParam,
        body: z.union([z.string(), z.any()]).describe('Message body or location'),
        buttons: z.array(z.any()).max(3).describe('Array of buttons (max 3)'),
        title: z.string().optional().describe('Message title'),
        footer: z.string().optional().describe('Message footer')
    }),
    parameterOrder: ['to', 'body', 'buttons', 'title', 'footer'],
    output: MessageIdReturnSchema.or(z.boolean())
});

/**
 * Sends advanced button message
 */
export const sendAdvancedButtons = defineMethodV2('sendAdvancedButtons', {
    meta: {
        description: 'Sends an advanced button message with media (deprecated)',
        action: 'send',
        namespace: 'messages',
        license: 'insiders',
        functionality: 'both',
        httpMethod: 'POST',
    },
    input: z.object({
        to: toParam,
        body: z.union([z.string(), z.any()]).describe('Message body, location, or media'),
        buttons: z.array(z.any()).max(3).describe('Array of advanced buttons (max 3)'),
        text: z.string().describe('Message text'),
        footer: z.string().describe('Message footer'),
        filename: z.string().describe('Filename if body is a file')
    }),
    parameterOrder: ['to', 'body', 'buttons', 'text', 'footer', 'filename'],
    output: MessageIdReturnSchema.or(z.boolean())
});

/**
 * Sends list message
 */
export const sendListMessage = defineMethodV2('sendListMessage', {
    meta: {
        description: 'Sends a list/menu message (deprecated)',
        action: 'send',
        namespace: 'messages',
        license: 'insiders',
        functionality: 'both',
        httpMethod: 'POST',
    },
    input: z.object({
        to: toParam,
        sections: z.array(z.any()).describe('List sections'),
        title: z.string().describe('List title'),
        description: z.string().describe('List description'),
        actionText: z.string().describe('Action button text')
    }),
    parameterOrder: ['to', 'sections', 'title', 'description', 'actionText'],
    output: MessageIdReturnSchema.or(z.boolean())
});

/**
 * Sends a poll
 */
export const sendPoll = defineMethodV2('sendPoll', {
    meta: {
        description: 'Sends a poll message',
        action: 'send',
        namespace: 'messages',
        license: 'none',
        functionality: 'both',
        httpMethod: 'POST',
    },
    input: z.object({
        to: toParam,
        name: z.string().describe('Poll question'),
        options: z.array(z.string()).min(2).max(12).describe('Poll options (2-12)'),
        selectableCount: z.number().optional().default(1).describe('Number of selectable options')
    }),
    parameterOrder: ['to', 'name', 'options', 'selectableCount'],
    output: MessageIdReturnSchema.or(z.boolean())
});

/**
 * Sends a banner image
 */
export const sendBanner = defineMethodV2('sendBanner', {
    meta: {
        description: 'Sends a banner image',
        action: 'send',
        namespace: 'messages',
        license: 'none',
        functionality: 'both',
        httpMethod: 'POST',
    },
    input: z.object({
        to: toParam,
        base64: z.string().describe('Base64 encoded JPEG')
    }),
    parameterOrder: ['to', 'base64'],
    output: MessageIdReturnSchema.or(z.boolean())
});

/**
 * Sends YouTube link with preview
 */
export const sendYoutubeLink = defineMethodV2('sendYoutubeLink', {
    meta: {
        description: 'Sends a YouTube link with auto-generated preview',
        action: 'send',
        namespace: 'messages',
        license: 'none',
        functionality: 'both',
        httpMethod: 'POST',
    },
    input: z.object({
        to: toParam,
        url: z.string().url().describe('YouTube URL'),
        text: contentParam.optional().default(''),
        thumbnail: z.string().optional().describe('Base64 thumbnail override'),
        quotedMsgId: messageIdParam.optional(),
        customSize: z.object({
            height: z.number(),
            width: z.number()
        }).optional().describe('Custom thumbnail size')
    }),
    parameterOrder: ['to', 'url', 'text', 'thumbnail', 'quotedMsgId', 'customSize'],
    output: MessageIdReturnSchema.or(z.boolean())
});

/**
 * Sends link with auto preview
 */
export const sendLinkWithAutoPreview = defineMethodV2('sendLinkWithAutoPreview', {
    meta: {
        description: 'Sends a link with auto-generated preview',
        action: 'send',
        namespace: 'messages',
        license: 'none',
        functionality: 'both',
        httpMethod: 'POST',
    },
    input: z.object({
        to: toParam,
        url: z.string().url().describe('Link URL'),
        text: contentParam.optional(),
        thumbnail: z.string().optional().describe('Base64 thumbnail override'),
        quotedMsgId: messageIdParam.optional(),
        customSize: z.object({
            height: z.number(),
            width: z.number()
        }).optional().describe('Custom thumbnail size')
    }),
    parameterOrder: ['to', 'url', 'text', 'thumbnail', 'quotedMsgId', 'customSize'],
    output: MessageIdReturnSchema.or(z.boolean())
});

/**
 * Sends message with custom thumbnail
 */
export const sendMessageWithThumb = defineMethodV2('sendMessageWithThumb', {
    meta: {
        description: 'Sends a link preview message with custom thumbnail',
        action: 'send',
        namespace: 'messages',
        license: 'none',
        functionality: 'both',
        httpMethod: 'POST',
    },
    input: z.object({
        thumb: z.string().describe('Base64 thumbnail (max 200x200px)'),
        url: z.string().url().describe('Link URL'),
        title: z.string().describe('Link title'),
        description: z.string().describe('Link description'),
        text: contentParam,
        chatId: toParam,
        quotedMsgId: messageIdParam.optional(),
        customSize: z.object({
            height: z.number(),
            width: z.number()
        }).optional().describe('Custom thumbnail size')
    }),
    parameterOrder: ['thumb', 'url', 'title', 'description', 'text', 'chatId', 'quotedMsgId', 'customSize'],
    output: MessageIdReturnSchema.or(z.boolean())
});

/**
 * Forwards messages to a chat
 */
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

/**
 * Deletes a message
 */
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
        onlyLocal: z.boolean().optional().default(false).describe('Delete only locally')
    }),
    parameterOrder: ['chatId', 'messageId', 'onlyLocal'],
    output: z.boolean()
});

/**
 * Retrieves a specific message by ID
 */
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
    output: z.any() // MessageSchema causes circular dependency
});

/**
 * Retrieves all messages in the session
 */
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
        includeMe: z.boolean().optional().default(true).describe('Include own messages'),
        includeNotifications: z.boolean().optional().default(false).describe('Include notification messages'),
    }),
    parameterOrder: ['chatId', 'includeMe', 'includeNotifications'],
    output: z.array(z.any()) // MessageSchema causes circular dependency
});
