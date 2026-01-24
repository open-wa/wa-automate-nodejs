import { z } from 'zod';
import { defineMethodV2 } from '../registry';
import { MessageSchema } from '../common-types';

export const decryptMedia = defineMethodV2('decryptMedia', {
    meta: {
        description: 'Decrypts media from a message',
        action: 'read',
        namespace: 'media',
        license: 'none',
        functionality: 'both',
        httpMethod: 'POST',
    },
    input: z.object({
        message: MessageSchema.describe('Message object containing media'),
    }),
    parameterOrder: ['message'],
    output: z.string().describe('Base64 encoded decrypted media'),
});

export const downloadMedia = defineMethodV2('downloadMedia', {
    meta: {
        description: 'Downloads and decrypts media from a message to a file',
        action: 'read',
        namespace: 'media',
        license: 'none',
        functionality: 'both',
        httpMethod: 'POST',
    },
    input: z.object({
        message: MessageSchema.describe('Message object containing media'),
        path: z.string().describe('File path to save the media'),
    }),
    parameterOrder: ['message', 'path'],
    output: z.string().describe('Path to the saved file'),
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
        to: z.string().describe('Chat ID to send the file to'),
        url: z.string().url().describe('URL of the file to download'),
        filename: z.string().describe('Filename for the sent file'),
        caption: z.string().optional().describe('Caption for the file'),
        headers: z.record(z.string(), z.string()).optional().describe('HTTP headers for the download request'),
    }),
    parameterOrder: ['to', 'url', 'filename', 'caption', 'headers'],
    output: z.string().or(z.boolean()).describe('Message ID or success status'),
});

export const loadEarlierMessages = defineMethodV2('loadEarlierMessages', {
    meta: {
        description: 'Loads earlier messages from a chat',
        action: 'read',
        namespace: 'messages',
        license: 'none',
        functionality: 'both',
        httpMethod: 'POST',
    },
    input: z.object({
        chatId: z.string().describe('Chat ID to load messages from'),
        count: z.number().positive().optional().describe('Number of messages to load (default: 20)'),
        includeMe: z.boolean().optional().describe('Whether to include messages from the host account (default: false)'),
    }),
    parameterOrder: ['chatId', 'count', 'includeMe'],
    output: z.array(MessageSchema).describe('Array of loaded messages'),
});
