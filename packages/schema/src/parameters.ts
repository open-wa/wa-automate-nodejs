import { z } from 'zod';
import { parameterRegistry } from './registry';
import {
    ChatIdCodecSchema,
    ContactIdCodecSchema,
    GroupIdCodecSchema,
    MessageIdCodecSchema,
    FileToDataUrlSchema
} from './codecs';

/**
 * Chat & Contact Parameters
 */

export const chatIdParam = ChatIdCodecSchema.describe('Chat ID (phone number or formatted ID)');
parameterRegistry.set(chatIdParam, {
    example: '447123456789@c.us'
});

export const contactIdParam = ContactIdCodecSchema.describe('Contact ID (phone number)');
parameterRegistry.set(contactIdParam, {
    example: '447123456789@c.us'
});

export const groupIdParam = GroupIdCodecSchema.describe('Group chat ID');
parameterRegistry.set(groupIdParam, {
    example: '447123456789-1445627445@g.us'
});

export const messageIdParam = MessageIdCodecSchema.describe('Message ID');
parameterRegistry.set(messageIdParam, {
    example: 'false_447123456789@c.us_9C4D0965EA5C09D591334AB6BDB07FEB'
});

export const toParam = chatIdParam.describe('Recipient chat ID');
parameterRegistry.set(toParam, {
    example: '447123456789@c.us'
});

/**
 * Content Parameters
 */

export const contentParam = z.string().min(1).describe('Message content');
parameterRegistry.set(contentParam, {
    example: 'Hello, world!'
});

export const captionParam = z.string().optional().describe('Media caption');
parameterRegistry.set(captionParam, {
    example: 'Check out this image!'
});

export const filenameParam = z.string().optional().describe('Filename with extension');
parameterRegistry.set(filenameParam, {
    example: 'document.pdf'
});

/**
 * File Parameters
 */

export const imageDataParam = FileToDataUrlSchema.describe('Image file (path, URL, DataURL, or Base64)');
parameterRegistry.set(imageDataParam, {
    example: 'data:image/png;base64,iVBORw0KGgo...'
});

export const fileDataParam = FileToDataUrlSchema.describe('File (path, URL, DataURL, Base64, or Buffer)');
parameterRegistry.set(fileDataParam, {
    example: 'data:application/pdf;base64,JVBERi0xLjQK...'
});

export const audioDataParam = FileToDataUrlSchema.describe('Audio file (path, URL, DataURL, or Base64)');
parameterRegistry.set(audioDataParam, {
    example: 'data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAA...'
});

export const videoDataParam = FileToDataUrlSchema.describe('Video file (path, URL, DataURL, or Base64)');
parameterRegistry.set(videoDataParam, {
    example: 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21...'
});

export const documentDataParam = FileToDataUrlSchema.describe('Document file (path, URL, DataURL, or Base64)');
parameterRegistry.set(documentDataParam, {
    example: 'data:application/pdf;base64,JVBERi0xLjQK...'
});

export const stickerDataParam = FileToDataUrlSchema.describe('Sticker file (path, URL, DataURL, or Base64)');
parameterRegistry.set(stickerDataParam, {
    example: 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAw...'
});

/**
 * Location Parameters
 */

export const latitudeParam = z.union([z.number(), z.string()]).describe('Latitude coordinate');
parameterRegistry.set(latitudeParam, {
    example: 51.5074
});

export const longitudeParam = z.union([z.number(), z.string()]).describe('Longitude coordinate');
parameterRegistry.set(longitudeParam, {
    example: -0.1278
});

export const locationNameParam = z.string().optional().describe('Location name or description');
parameterRegistry.set(locationNameParam, {
    example: 'London, UK'
});

/**
 * Boolean & Option Parameters
 */

export const waitForIdParam = z.boolean().optional().default(false).describe('Wait for message ID');
parameterRegistry.set(waitForIdParam, {
    example: true
});

export const includeMeParam = z.boolean().optional().default(true).describe('Include own messages');
parameterRegistry.set(includeMeParam, {
    example: true
});

export const includeNotificationsParam = z.boolean().optional().default(false).describe('Include notification messages');
parameterRegistry.set(includeNotificationsParam, {
    example: false
});

export const onlyLocalParam = z.boolean().optional().default(false).describe('Delete only locally');
parameterRegistry.set(onlyLocalParam, {
    example: false
});

export const skipMyMessagesParam = z.boolean().optional().default(false).describe('Skip own messages');
parameterRegistry.set(skipMyMessagesParam, {
    example: false
});

export const withNewMessagesOnlyParam = z.boolean().optional().default(false).describe('Only chats with unread messages');
parameterRegistry.set(withNewMessagesOnlyParam, {
    example: false
});

/**
 * Array Parameters
 */

export const messageIdsParam = z.union([
    z.array(messageIdParam),
    messageIdParam
]).describe('Message ID(s) to process');
parameterRegistry.set(messageIdsParam, {
    example: ['false_447123456789@c.us_ABC123', 'false_447123456789@c.us_DEF456']
});

export const mentionedJidListParam = z.array(contactIdParam).optional().describe('List of mentioned contact IDs');
parameterRegistry.set(mentionedJidListParam, {
    example: ['447123456789@c.us', '441234567890@c.us']
});

/**
 * Generic Options Parameter
 */

export const messageOptionsParam = z.any().optional().describe('Additional message options');
parameterRegistry.set(messageOptionsParam, {
    example: { quotedMsg: 'messageId', mentionedJidList: ['447123456789@c.us'] }
});
