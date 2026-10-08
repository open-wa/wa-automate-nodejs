import { MessageIdReturnSchema, MessageIdSchema, MessageSchema } from '../common-types';
import { LLMMessageSchema, MessageInfoSchema } from '../return-types';
import { z } from 'zod';
import { defineMethodV2 } from '../registry';

import {
    chatIdParam,
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

/** The normalized serialized message key returned by the public sendText client. */
export const SendTextResultSchema = z.string()
    .regex(/^(true|false)_[^\s_]+@[^\s_]+_[^\s]+$/)
    .brand('MessageId')
    .describe('Validated serialized message ID. This confirms the send returned an ID, not delivery or reading.');

export const StickerJobSchema = z.object({
    effects: z.array(z.union([z.string(), z.object({ name: z.string(), options: z.record(z.string(), z.unknown()).optional() }).strict()])).max(8).optional(),
    backend: z.enum(['auto','browser','standalone']).optional().describe('Defaults to browser when it supports the entire job; otherwise the entire job runs standalone.'),
    quality: z.number().min(0.01).max(1).optional().describe('Maximum encoding quality; encoding can reduce quality to meet sticker byte limits.'),
    fit: z.enum(['contain','cover']).optional(),
    circle: z.boolean().optional(), background: z.string().max(64).optional(),
    trim: z.tuple([z.number().nonnegative(),z.number().positive()]).refine(([start,end])=>end>start).optional(),
    fps: z.number().int().min(1).max(30).optional(),
    loopCount: z.number().int().min(0).max(65535).optional(),
    author: z.string().max(128).optional(), pack: z.string().max(128).optional(),
    quotedMsgId: messageIdParam.optional().describe('Reply with the sticker to a loaded message in the destination chat.'),
}).strict();

export const sendSticker = defineMethodV2('sendSticker', {
    meta: {
        description: 'Render a sticker locally using automatic whole-job backend selection and ordered effects, then submit through the private donor finalizer. Author and pack labels are configurable; donor app links are owned by the installed patch. Returns a submitted message ID, not a delivery receipt. Unknown send outcomes must be reconciled before retrying.',
        action: 'send', namespace: 'messages', license: 'none', functionality: 'both', httpMethod: 'POST',
        wapiOverride: 'sendStickerJob',
    },
    input: z.object({
        to: toParam,
        input: z.string().regex(/^(?:data:(?:image|video)\/[^;,]+;base64,[A-Za-z0-9+/]+={0,2}|https?:\/\/\S+)$/).describe('A media data URL or HTTP(S) URL. The local library additionally accepts bytes, Blob and local filenames.'),
        job: StickerJobSchema.optional(),
    }),
    parameterOrder: ['to','input','job'],
    output: SendTextResultSchema,
});

export const AlbumMediaSchema = z.object({
    file: z.string().regex(/^data:(image|video)\/[^;,]+;base64,[A-Za-z0-9+/]+={0,2}$/)
        .describe('Image or video as a base64 data URL. For a WhatsApp GIF, supply an MP4 video and set isGif to true.'),
    filename: z.string().min(1).describe('Filename including its extension'),
    isGif: z.boolean().optional().describe('Send an MP4 video as a looping WhatsApp GIF'),
}).refine(media => !media.isGif || media.file.startsWith('data:video/mp4;base64,'), {
    message: 'GIF album items require MP4 video data',
    path: ['file'],
});
export type AlbumMedia = z.infer<typeof AlbumMediaSchema>;

export const AlbumSendResultSchema = z.object({
    albumId: MessageIdSchema,
    messageIds: z.array(MessageIdSchema).min(2),
}).describe('Submitted album parent and child message IDs, in input order. Submission does not confirm recipient delivery. Runtime failures include the album ID and submitted child IDs when available. A lost connection can leave the send outcome unknown; inspect the chat before retrying.');
export type AlbumSendResult = z.infer<typeof AlbumSendResultSchema>;

export const sendAlbum = defineMethodV2('sendAlbum', {
    meta: {
        description: 'Sends images and videos together as a native WhatsApp album with one caption on its first item. GIFs use MP4 video data with isGif: true. Documents are rejected. Phone-number IDs are resolved to LIDs; the destination chat must already be loaded and allow sending. WhatsApp controls the minimum item count and upload limits. Runtime failures include the parent and submitted child IDs when available; inspect the chat before retrying.',
        action: 'send',
        namespace: 'messages',
        license: 'none',
        functionality: 'both',
        httpMethod: 'POST',
    },
    input: z.object({
        to: toParam,
        media: z.array(AlbumMediaSchema).min(2).describe('Album items in send order'),
        caption: captionParam.optional().default(''),
        quotedMsgId: messageIdParam.optional().describe('Message to quote on the first album item'),
    }),
    parameterOrder: ['to', 'media', 'caption', 'quotedMsgId'],
    output: AlbumSendResultSchema,
});

/**
 * Sends a text message to a chat
 */
export const sendText = defineMethodV2('sendText', {
    meta: {
        description: 'Sends a text message and returns a validated serialized message ID. The in-process Client throws SendTextError on failure. An unknown outcome means the message may have been sent: check the chat before retrying. Starting a chat with a new number requires an applied restricted or premium license.',
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
    output: SendTextResultSchema
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
        aliases: {
            explicit: ['sendVoiceNote'],
        },
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
        to: toParam,
        vcard: z.string().describe('vCard string'),
        contactName: z.string().optional().describe('Contact display name'),
        contactNumber: z.string().optional().describe('Contact number with country code')
    }),
    parameterOrder: ['to', 'vcard', 'contactName', 'contactNumber'],
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
    output: MessageIdReturnSchema.or(z.boolean()).or(z.void())
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
        aliases: {
            explicit: ['sendContacts'],
            namespacedName: 'sendContacts',
        },
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
        aliases: {
            explicit: ['sendList'],
        },
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
export const sendYouTubeLink = defineMethodV2('sendYouTubeLink', {
    meta: {
        description: 'Sends a YouTube link with auto-generated preview',
        action: 'send',
        namespace: 'messages',
        license: 'none',
        functionality: 'both',
        httpMethod: 'POST',
        aliases: {
            deprecated: ['sendYoutubeLink'],
        },
        wapiOverride: 'sendYoutubeLink',
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
        aliases: {
            explicit: ['sendLink'],
        },
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
        aliases: {
            explicit: ['sendLinkWithThumbnail'],
            namespacedName: 'sendLinkWithThumbnail',
        },
    },
    input: z.object({
        thumb: z.string().describe('Base64 thumbnail (max 200x200px)'),
        url: z.string().url().describe('Link URL'),
        title: z.string().describe('Link title'),
        description: z.string().describe('Link description'),
        content: contentParam,
        to: toParam,
        quotedMsgId: messageIdParam.optional(),
        customSize: z.object({
            height: z.number(),
            width: z.number()
        }).optional().describe('Custom thumbnail size')
    }),
    parameterOrder: ['thumb', 'url', 'title', 'description', 'content', 'to', 'quotedMsgId', 'customSize'],
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
        aliases: {
            namespacedName: 'forward',
        },
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
        aliases: {
            namespacedName: 'delete',
        },
    },
    input: z.object({
        chatId: chatIdParam,
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
        aliases: {
            explicit: ['getMessage'],
            namespacedName: 'get',
        },
    },
    input: z.object({
        messageId: messageIdParam
    }),
    parameterOrder: ['messageId'],
    output: MessageSchema.nullable().or(z.literal(false)),
});

export const getAlbumMessages = defineMethodV2('getAlbumMessages', {
    meta: {
        description: 'Returns currently loaded image and video messages associated with an album, including GIF videos. The album can arrive before its media, so the array may be incomplete. Returns false if the album is not loaded or the ID belongs to another message type.',
        action: 'read',
        namespace: 'messages',
        license: 'none',
        functionality: 'both',
        httpMethod: 'GET',
    },
    input: z.object({ messageId: messageIdParam.describe('Album container message ID') }),
    parameterOrder: ['messageId'],
    output: z.array(MessageSchema).or(z.literal(false))
        .describe('A snapshot of currently loaded album media. An empty or partial array does not mean that the sender sent an empty or partial album. Each item retains its caption and can be passed to decryptMedia or downloadMedia.'),
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
        chatId: chatIdParam.optional(),
        includeMe: z.boolean().optional().default(true).describe('Include own messages'),
        includeNotifications: z.boolean().optional().default(false).describe('Include notification messages'),
    }),
    parameterOrder: ['chatId', 'includeMe', 'includeNotifications'],
    output: z.array(MessageSchema),
});

export const getMyLastMessage = defineMethodV2('getMyLastMessage', {
    meta: {
        description: 'Get last message sent by host',
        action: 'read',
        namespace: 'messages',
        license: 'none',
        functionality: 'both',
        httpMethod: 'GET',
    },
    input: z.object({
        chatId: chatIdParam.optional(),
    }),
    parameterOrder: ['chatId'],
    output: MessageSchema.optional(),
});

export const getStarredMessages = defineMethodV2('getStarredMessages', {
    meta: {
        description: 'Get starred messages',
        action: 'read',
        namespace: 'messages',
        license: 'insiders',
        functionality: 'both',
        httpMethod: 'GET',
    },
    input: z.object({
        chatId: chatIdParam.optional(),
    }),
    parameterOrder: ['chatId'],
    output: z.array(MessageSchema),
});

export const getUnsentMessages = defineMethodV2('getUnsentMessages', {
    meta: {
        description: 'Get unsent/pending messages',
        action: 'read',
        namespace: 'messages',
        license: 'none',
        functionality: 'both',
        httpMethod: 'GET',
    },
    input: z.object({}),
    parameterOrder: [],
    output: z.array(MessageSchema),
});

export const getMessageInfo = defineMethodV2('getMessageInfo', {
    meta: {
        description: 'Get message delivery info',
        action: 'read',
        namespace: 'messages',
        license: 'none',
        functionality: 'both',
        httpMethod: 'GET',
    },
    input: z.object({
        messageId: messageIdParam,
    }),
    parameterOrder: ['messageId'],
    output: MessageInfoSchema,
});

export const getVCards = defineMethodV2('getVCards', {
    meta: {
        description: 'Extract vCards from message',
        action: 'read',
        namespace: 'messages',
        license: 'none',
        functionality: 'both',
        httpMethod: 'GET',
    },
    input: z.object({
        messageId: messageIdParam,
    }),
    parameterOrder: ['messageId'],
    output: z.array(z.string()),
});

export const getMessagesForLLM = defineMethodV2('getMessagesForLLM', {
    meta: {
        description: 'Get messages formatted for LLMs',
        action: 'read',
        namespace: 'messages',
        license: 'none',
        functionality: 'both',
        httpMethod: 'GET',
        aliases: {
            deprecated: ['getGptArray'],
        },
        wapiOverride: 'getGptArray',
    },
    input: z.object({
        chatId: chatIdParam,
        last: z.number().optional().default(10),
    }),
    parameterOrder: ['chatId', 'last'],
    output: z.array(LLMMessageSchema),
});

export const starMessage = defineMethodV2('starMessage', {
    meta: {
        description: 'Star a message',
        action: 'update',
        namespace: 'messages',
        license: 'none',
        functionality: 'both',
        httpMethod: 'PUT',
    },
    input: z.object({
        messageId: messageIdParam,
    }),
    parameterOrder: ['messageId'],
    output: z.boolean(),
});

export const unstarMessage = defineMethodV2('unstarMessage', {
    meta: {
        description: 'Unstar a message',
        action: 'update',
        namespace: 'messages',
        license: 'none',
        functionality: 'both',
        httpMethod: 'PUT',
    },
    input: z.object({
        messageId: messageIdParam,
    }),
    parameterOrder: ['messageId'],
    output: z.boolean(),
});

export const react = defineMethodV2('react', {
    meta: {
        description: 'React to message with emoji',
        action: 'send',
        namespace: 'messages',
        license: 'none',
        functionality: 'both',
        httpMethod: 'POST',
    },
    input: z.object({
        messageId: messageIdParam,
        emoji: z.string().describe('Emoji reaction'),
    }),
    parameterOrder: ['messageId', 'emoji'],
    output: z.boolean(),
});

export const sendSeen = defineMethodV2('sendSeen', {
    meta: {
        description: 'Mark message as seen',
        action: 'update',
        namespace: 'messages',
        license: 'none',
        functionality: 'both',
        httpMethod: 'PUT',
    },
    input: z.object({
        chatId: chatIdParam,
    }),
    parameterOrder: ['chatId'],
    output: z.boolean(),
});

export const loadEarlierMessages = defineMethodV2('loadEarlierMessages', {
    meta: {
        description: 'Loads earlier messages from a chat',
        action: 'read',
        namespace: 'messages',
        license: 'none',
        functionality: 'both',
        httpMethod: 'POST',
        aliases: {
            explicit: ['loadOlderMessages'],
            namespacedName: 'loadEarlier',
        },
    },
    input: z.object({
        chatId: chatIdParam,
        count: z.number().positive().optional().describe('Number of messages to load (default: 20)'),
        includeMe: z.boolean().optional().describe('Whether to include messages from the host account (default: false)'),
    }),
    parameterOrder: ['chatId', 'count', 'includeMe'],
    output: z.array(MessageSchema),
});

export const sendFileFromUrl = defineMethodV2('sendFileFromUrl', {
    meta: {
        description: 'Downloads a file from a URL and sends it to a chat',
        action: 'send',
        namespace: 'messages',
        license: 'none',
        functionality: 'both',
        httpMethod: 'POST',
    },
    input: z.object({
        to: toParam,
        url: z.string().url().describe('URL of the file to download'),
        filename: z.string().describe('Filename for the sent file'),
        caption: z.string().optional().describe('Caption for the file'),
        headers: z.record(z.string(), z.string()).optional().describe('HTTP headers for the download request'),
    }),
    parameterOrder: ['to', 'url', 'filename', 'caption', 'headers'],
    output: z.string().or(z.boolean()).describe('Message ID or success status'),
});
