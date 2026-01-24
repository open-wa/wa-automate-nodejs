import { z } from 'zod';
import { defineMethodV2 } from '../registry';
import { toParam, messageIdParam } from '../parameters';

// ============================================================================
// Utility Methods
// ============================================================================

// Session Info
export const getMe = defineMethodV2('getMe', {
    meta: {
        description: 'Get host account info',
        action: 'read',
        namespace: 'utilities',
        license: 'none',
        functionality: 'both',
        httpMethod: 'GET',
    },
    input: z.object({}),
    parameterOrder: [],
    output: z.any()
});

export const getHostNumber = defineMethodV2('getHostNumber', {
    meta: {
        description: 'Get host phone number',
        action: 'read',
        namespace: 'utilities',
        license: 'none',
        functionality: 'both',
        httpMethod: 'GET',
    },
    input: z.object({}),
    parameterOrder: [],
    output: z.string()
});

export const getConnectionState = defineMethodV2('getConnectionState', {
    meta: {
        description: 'Get connection state',
        action: 'read',
        namespace: 'utilities',
        license: 'none',
        functionality: 'both',
        httpMethod: 'GET',
    },
    input: z.object({}),
    parameterOrder: [],
    output: z.any()
});

export const getWAVersion = defineMethodV2('getWAVersion', {
    meta: {
        description: 'Get WhatsApp Web version',
        action: 'read',
        namespace: 'utilities',
        license: 'none',
        functionality: 'both',
        httpMethod: 'GET',
    },
    input: z.object({}),
    parameterOrder: [],
    output: z.string()
});

export const getBatteryLevel = defineMethodV2('getBatteryLevel', {
    meta: {
        description: 'Get phone battery level',
        action: 'read',
        namespace: 'utilities',
        license: 'none',
        functionality: 'both',
        httpMethod: 'GET',
    },
    input: z.object({}),
    parameterOrder: [],
    output: z.number()
});

export const getIsPlugged = defineMethodV2('getIsPlugged', {
    meta: {
        description: 'Check if phone is charging',
        action: 'read',
        namespace: 'utilities',
        license: 'none',
        functionality: 'both',
        httpMethod: 'GET',
    },
    input: z.object({}),
    parameterOrder: [],
    output: z.boolean()
});

// Configuration
export const getFeatures = defineMethodV2('getFeatures', {
    meta: {
        description: 'Get enabled features',
        action: 'read',
        namespace: 'utilities',
        license: 'none',
        functionality: 'both',
        httpMethod: 'GET',
    },
    input: z.object({}),
    parameterOrder: [],
    output: z.any()
});

export const getLicenseType = defineMethodV2('getLicenseType', {
    meta: {
        description: 'Get license type',
        action: 'read',
        namespace: 'utilities',
        license: 'none',
        functionality: 'both',
        httpMethod: 'GET',
    },
    input: z.object({}),
    parameterOrder: [],
    output: z.union([z.any(), z.boolean()])
});

export const getGeneratedUserAgent = defineMethodV2('getGeneratedUserAgent', {
    meta: {
        description: 'Get user agent',
        action: 'read',
        namespace: 'utilities',
        license: 'none',
        functionality: 'both',
        httpMethod: 'GET',
    },
    input: z.object({
        userA: z.string().optional()
    }),
    parameterOrder: ['userA'],
    output: z.string()
});

// Diagnostics
export const getProcessStats = defineMethodV2('getProcessStats', {
    meta: {
        description: 'Get process statistics',
        action: 'read',
        namespace: 'utilities',
        license: 'none',
        functionality: 'both',
        httpMethod: 'GET',
    },
    input: z.object({}),
    parameterOrder: [],
    output: z.any()
});

export const getAmountOfLoadedMessages = defineMethodV2('getAmountOfLoadedMessages', {
    meta: {
        description: 'Get loaded message count',
        action: 'read',
        namespace: 'utilities',
        license: 'none',
        functionality: 'both',
        httpMethod: 'GET',
    },
    input: z.object({}),
    parameterOrder: [],
    output: z.number()
});

export const getSnapshot = defineMethodV2('getSnapshot', {
    meta: {
        description: 'Take screenshot',
        action: 'read',
        namespace: 'utilities',
        license: 'none',
        functionality: 'both',
        httpMethod: 'GET',
    },
    input: z.object({
        chatId: toParam.optional(),
        width: z.number().optional(),
        height: z.number().optional()
    }),
    parameterOrder: ['chatId', 'width', 'height'],
    output: z.string()
});

export const healthCheck = defineMethodV2('healthCheck', {
    meta: {
        description: 'Health check',
        action: 'read',
        namespace: 'utilities',
        license: 'none',
        functionality: 'both',
        httpMethod: 'GET',
    },
    input: z.object({}),
    parameterOrder: [],
    output: z.any()
});

// Profile Operations
export const setMyName = defineMethodV2('setMyName', {
    meta: {
        description: 'Set host name',
        action: 'update',
        namespace: 'utilities',
        license: 'none',
        functionality: 'personal-only',
        httpMethod: 'PUT',
    },
    input: z.object({
        newName: z.string()
    }),
    parameterOrder: ['newName'],
    output: z.boolean()
});

export const setMyStatus = defineMethodV2('setMyStatus', {
    meta: {
        description: 'Set host status',
        action: 'update',
        namespace: 'utilities',
        license: 'none',
        functionality: 'both',
        httpMethod: 'PUT',
    },
    input: z.object({
        newStatus: z.string()
    }),
    parameterOrder: ['newStatus'],
    output: z.union([z.boolean(), z.void()])
});

export const setProfilePic = defineMethodV2('setProfilePic', {
    meta: {
        description: 'Set profile picture',
        action: 'update',
        namespace: 'utilities',
        license: 'insiders',
        functionality: 'both',
        httpMethod: 'PUT',
    },
    input: z.object({
        image: z.string().describe('Image data URL')
    }),
    parameterOrder: ['image'],
    output: z.boolean()
});

// Message Operations
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
        chatId: toParam.optional()
    }),
    parameterOrder: ['chatId'],
    output: z.union([z.any(), z.undefined()])
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
        chatId: toParam.optional()
    }),
    parameterOrder: ['chatId'],
    output: z.array(z.any())
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
    output: z.array(z.any())
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
        messageId: messageIdParam
    }),
    parameterOrder: ['messageId'],
    output: z.any()
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
        msgId: messageIdParam
    }),
    parameterOrder: ['msgId'],
    output: z.array(z.string())
});

export const getGptArray = defineMethodV2('getGptArray', {
    meta: {
        description: 'Get messages formatted for GPT',
        action: 'read',
        namespace: 'messages',
        license: 'none',
        functionality: 'both',
        httpMethod: 'GET',
    },
    input: z.object({
        chatId: toParam,
        last: z.number().optional().default(10)
    }),
    parameterOrder: ['chatId', 'last'],
    output: z.any()
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
        messageId: messageIdParam
    }),
    parameterOrder: ['messageId'],
    output: z.boolean()
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
        messageId: messageIdParam
    }),
    parameterOrder: ['messageId'],
    output: z.boolean()
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
        emoji: z.string().describe('Emoji reaction')
    }),
    parameterOrder: ['messageId', 'emoji'],
    output: z.boolean()
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
        chatId: toParam
    }),
    parameterOrder: ['chatId'],
    output: z.boolean()
});
