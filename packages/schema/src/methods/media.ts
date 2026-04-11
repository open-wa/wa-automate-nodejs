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
