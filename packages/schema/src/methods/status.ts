import { z } from 'zod';
import { defineMethodV2 } from '../registry';
import { contactIdParam } from '../parameters';

export const postTextStatus = defineMethodV2('postTextStatus', {
    meta: {
        description: 'Post text status',
        action: 'send',
        namespace: 'status',
        license: 'insiders',
        functionality: 'both',
        httpMethod: 'POST',
    },
    input: z.object({
        text: z.string().describe('Status text'),
        backgroundColor: z.string().optional().describe('Background color'),
        font: z.number().optional().describe('Font style'),
    }),
    parameterOrder: ['text', 'backgroundColor', 'font'],
    output: z.any(),
});

export const postImageStatus = defineMethodV2('postImageStatus', {
    meta: {
        description: 'Post image status',
        action: 'send',
        namespace: 'status',
        license: 'insiders',
        functionality: 'both',
        httpMethod: 'POST',
    },
    input: z.object({
        image: z.string().describe('Image data URL'),
        caption: z.string().optional().describe('Status caption'),
    }),
    parameterOrder: ['image', 'caption'],
    output: z.any(),
});

export const postVideoStatus = defineMethodV2('postVideoStatus', {
    meta: {
        description: 'Post video status',
        action: 'send',
        namespace: 'status',
        license: 'insiders',
        functionality: 'both',
        httpMethod: 'POST',
    },
    input: z.object({
        video: z.string().describe('Video data URL'),
        caption: z.string().optional().describe('Status caption'),
    }),
    parameterOrder: ['video', 'caption'],
    output: z.any(),
});

export const getStories = defineMethodV2('getStories', {
    meta: {
        description: 'Get all stories',
        action: 'read',
        namespace: 'status',
        license: 'insiders',
        functionality: 'both',
        httpMethod: 'GET',
        aliases: {
            explicit: ['getStatuses'],
            namespacedName: 'getAll',
        },
    },
    input: z.object({}),
    parameterOrder: [],
    output: z.array(z.any()),
});

export const getStatus = defineMethodV2('getStatus', {
    meta: {
        description: 'Get specific status',
        action: 'read',
        namespace: 'mystatus',
        license: 'insiders',
        functionality: 'both',
        httpMethod: 'GET',
    },
    input: z.object({ contactId: contactIdParam }),
    parameterOrder: ['contactId'],
    output: z.any(),
});

export const deleteStatus = defineMethodV2('deleteStatus', {
    meta: {
        description: 'Delete status',
        action: 'delete',
        namespace: 'status',
        license: 'insiders',
        functionality: 'both',
        httpMethod: 'DELETE',
    },
    input: z.object({
        statusesToDelete: z.union([z.string(), z.array(z.string())]).describe('Status ID(s)'),
    }),
    parameterOrder: ['statusesToDelete'],
    output: z.any(),
});

export const deleteAllStatus = defineMethodV2('deleteAllStatus', {
    meta: {
        description: 'Delete all statuses',
        action: 'delete',
        namespace: 'status',
        license: 'insiders',
        functionality: 'both',
        httpMethod: 'DELETE',
        aliases: {
            explicit: ['deleteAllStatuses'],
        },
    },
    input: z.object({}),
    parameterOrder: [],
    output: z.any(),
});
