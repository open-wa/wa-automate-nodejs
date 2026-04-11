import { z } from 'zod';
import { defineMethodV2 } from '../registry';
import { chatIdParam, imageDataParam, nameParam, statusTextParam, userAgentParam } from '../parameters';

export const getMe = defineMethodV2('getMe', {
    meta: {
        description: 'Get host account info',
        action: 'read',
        namespace: 'session',
        license: 'none',
        functionality: 'both',
        httpMethod: 'GET',
    },
    input: z.object({}),
    parameterOrder: [],
    output: z.any(),
});

export const getHostNumber = defineMethodV2('getHostNumber', {
    meta: {
        description: 'Get host phone number',
        action: 'read',
        namespace: 'session',
        license: 'none',
        functionality: 'both',
        httpMethod: 'GET',
    },
    input: z.object({}),
    parameterOrder: [],
    output: z.string(),
});

export const getConnectionState = defineMethodV2('getConnectionState', {
    meta: {
        description: 'Get connection state',
        action: 'read',
        namespace: 'session',
        license: 'none',
        functionality: 'both',
        httpMethod: 'GET',
    },
    input: z.object({}),
    parameterOrder: [],
    output: z.any(),
});

export const getWAVersion = defineMethodV2('getWAVersion', {
    meta: {
        description: 'Get WhatsApp Web version',
        action: 'read',
        namespace: 'session',
        license: 'none',
        functionality: 'both',
        httpMethod: 'GET',
        aliases: {
            explicit: ['getWhatsAppVersion'],
        },
    },
    input: z.object({}),
    parameterOrder: [],
    output: z.string(),
});

export const getBatteryLevel = defineMethodV2('getBatteryLevel', {
    meta: {
        description: 'Get phone battery level',
        action: 'read',
        namespace: 'session',
        license: 'none',
        functionality: 'both',
        httpMethod: 'GET',
    },
    input: z.object({}),
    parameterOrder: [],
    output: z.number(),
});

export const isPlugged = defineMethodV2('isPlugged', {
    meta: {
        description: 'Check if phone is charging',
        action: 'read',
        namespace: 'session',
        license: 'none',
        functionality: 'both',
        httpMethod: 'GET',
        aliases: {
            deprecated: ['getIsPlugged'],
        },
        wapiOverride: 'getIsPlugged',
    },
    input: z.object({}),
    parameterOrder: [],
    output: z.boolean(),
});

export const getFeatures = defineMethodV2('getFeatures', {
    meta: {
        description: 'Get enabled features',
        action: 'read',
        namespace: 'session',
        license: 'none',
        functionality: 'both',
        httpMethod: 'GET',
    },
    input: z.object({}),
    parameterOrder: [],
    output: z.any(),
});

export const getLicenseType = defineMethodV2('getLicenseType', {
    meta: {
        description: 'Get license type',
        action: 'read',
        namespace: 'session',
        license: 'none',
        functionality: 'both',
        httpMethod: 'GET',
    },
    input: z.object({}),
    parameterOrder: [],
    output: z.union([z.any(), z.boolean()]),
});

export const getUserAgent = defineMethodV2('getUserAgent', {
    meta: {
        description: 'Get user agent',
        action: 'read',
        namespace: 'session',
        license: 'none',
        functionality: 'both',
        httpMethod: 'GET',
        aliases: {
            deprecated: ['getGeneratedUserAgent'],
        },
        wapiOverride: 'getGeneratedUserAgent',
    },
    input: z.object({ userAgent: userAgentParam }),
    parameterOrder: ['userAgent'],
    output: z.string(),
});

export const getProcessStats = defineMethodV2('getProcessStats', {
    meta: {
        description: 'Get process statistics',
        action: 'read',
        namespace: 'session',
        license: 'none',
        functionality: 'both',
        httpMethod: 'GET',
    },
    input: z.object({}),
    parameterOrder: [],
    output: z.any(),
});

export const getLoadedMessageCount = defineMethodV2('getLoadedMessageCount', {
    meta: {
        description: 'Get loaded message count',
        action: 'read',
        namespace: 'session',
        license: 'none',
        functionality: 'both',
        httpMethod: 'GET',
        aliases: {
            deprecated: ['getAmountOfLoadedMessages'],
        },
        wapiOverride: 'getAmountOfLoadedMessages',
    },
    input: z.object({}),
    parameterOrder: [],
    output: z.number(),
});

export const getSnapshot = defineMethodV2('getSnapshot', {
    meta: {
        description: 'Take screenshot',
        action: 'read',
        namespace: 'session',
        license: 'none',
        functionality: 'both',
        httpMethod: 'GET',
        aliases: {
            explicit: ['takeScreenshot'],
        },
    },
    input: z.object({
        chatId: chatIdParam.optional(),
        width: z.number().optional(),
        height: z.number().optional(),
    }),
    parameterOrder: ['chatId', 'width', 'height'],
    output: z.string(),
});

export const healthCheck = defineMethodV2('healthCheck', {
    meta: {
        description: 'Health check',
        action: 'read',
        namespace: 'session',
        license: 'none',
        functionality: 'both',
        httpMethod: 'GET',
    },
    input: z.object({}),
    parameterOrder: [],
    output: z.any(),
});

export const setMyName = defineMethodV2('setMyName', {
    meta: {
        description: 'Set host name',
        action: 'update',
        namespace: 'session',
        license: 'none',
        functionality: 'personal-only',
        httpMethod: 'PUT',
        aliases: {
            explicit: ['setDisplayName'],
            namespacedName: 'setName',
        },
    },
    input: z.object({ name: nameParam }),
    parameterOrder: ['name'],
    output: z.boolean(),
});

export const setMyStatus = defineMethodV2('setMyStatus', {
    meta: {
        description: 'Set host status',
        action: 'update',
        namespace: 'session',
        license: 'none',
        functionality: 'both',
        httpMethod: 'PUT',
        aliases: {
            explicit: ['setStatusText'],
            namespacedName: 'setStatus',
        },
    },
    input: z.object({ statusText: statusTextParam }),
    parameterOrder: ['statusText'],
    output: z.boolean(),
});

export const setProfilePicture = defineMethodV2('setProfilePicture', {
    meta: {
        description: 'Set profile picture',
        action: 'update',
        namespace: 'session',
        license: 'insiders',
        functionality: 'both',
        httpMethod: 'PUT',
        aliases: {
            deprecated: ['setProfilePic'],
        },
        wapiOverride: 'setProfilePic',
    },
    input: z.object({ image: imageDataParam }),
    parameterOrder: ['image'],
    output: z.boolean(),
});
