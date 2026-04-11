import { z } from 'zod';
import { defineMethodV2 } from '../registry';
import { toParam } from '../parameters';

// ============================================================================
// Label Methods
// ============================================================================

/**
 * Get all labels
 */
export const getAllLabels = defineMethodV2('getAllLabels', {
    meta: {
        description: 'Get all labels',
        action: 'read',
        namespace: 'labels',
        license: 'none',
        functionality: 'business-only',
        httpMethod: 'GET',
    },
    input: z.object({}),
    parameterOrder: [],
    output: z.array(z.any())
});

/**
 * Get chats by label
 */
export const getChatsByLabel = defineMethodV2('getChatsByLabel', {
    meta: {
        description: 'Get chats by label',
        action: 'read',
        namespace: 'labels',
        license: 'none',
        functionality: 'business-only',
        httpMethod: 'GET',
        aliases: {
            namespacedName: 'getChats',
        },
    },
    input: z.object({
        label: z.string().describe('Label name')
    }),
    parameterOrder: ['label'],
    output: z.array(z.any())
});

/**
 * Add label
 */
export const addLabel = defineMethodV2('addLabel', {
    meta: {
        description: 'Add label to chat',
        action: 'update',
        namespace: 'labels',
        license: 'none',
        functionality: 'business-only',
        httpMethod: 'PUT',
    },
    input: z.object({
        label: z.string().describe('Label ID or name'),
        chatId: toParam
    }),
    parameterOrder: ['label', 'chatId'],
    output: z.boolean()
});

/**
 * Remove label
 */
export const removeLabel = defineMethodV2('removeLabel', {
    meta: {
        description: 'Remove label from chat',
        action: 'update',
        namespace: 'labels',
        license: 'none',
        functionality: 'business-only',
        httpMethod: 'PUT',
    },
    input: z.object({
        label: z.string().describe('Label ID or name'),
        chatId: toParam
    }),
    parameterOrder: ['label', 'chatId'],
    output: z.boolean()
});
