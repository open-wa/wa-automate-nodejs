import { z } from 'zod';
import { defineMethodV2 } from '../registry';
import { chatIdParam, contactIdParam } from '../parameters';

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
    output: z.array(z.any()),
});

export const getContact = defineMethodV2('getContact', {
    meta: {
        description: 'Get specific contact',
        action: 'read',
        namespace: 'contacts',
        license: 'none',
        functionality: 'both',
        httpMethod: 'GET',
    },
    input: z.object({ contactId: contactIdParam }),
    parameterOrder: ['contactId'],
    output: z.any(),
});

export const getCommonGroups = defineMethodV2('getCommonGroups', {
    meta: {
        description: 'Get common groups with contact',
        action: 'read',
        namespace: 'contacts',
        license: 'none',
        functionality: 'both',
        httpMethod: 'GET',
    },
    input: z.object({ contactId: contactIdParam }),
    parameterOrder: ['contactId'],
    output: z.any(),
});

export const getNumberProfile = defineMethodV2('getNumberProfile', {
    meta: {
        description: 'Get profile of number',
        action: 'read',
        namespace: 'contacts',
        license: 'insiders',
        functionality: 'both',
        httpMethod: 'GET',
    },
    input: z.object({ contactId: contactIdParam }),
    parameterOrder: ['contactId'],
    output: z.any(),
});

export const getBlockedIds = defineMethodV2('getBlockedIds', {
    meta: {
        description: 'Get blocked contact IDs',
        action: 'read',
        namespace: 'contacts',
        license: 'none',
        functionality: 'both',
        httpMethod: 'GET',
    },
    input: z.object({}),
    parameterOrder: [],
    output: z.array(z.string()),
});

export const blockContact = defineMethodV2('blockContact', {
    meta: {
        description: 'Block a contact',
        action: 'update',
        namespace: 'contacts',
        license: 'none',
        functionality: 'both',
        httpMethod: 'PUT',
        aliases: {
            deprecated: ['contactBlock'],
        },
        wapiOverride: 'contactBlock',
    },
    input: z.object({ contactId: contactIdParam }),
    parameterOrder: ['contactId'],
    output: z.boolean(),
});

export const unblockContact = defineMethodV2('unblockContact', {
    meta: {
        description: 'Unblock a contact',
        action: 'update',
        namespace: 'contacts',
        license: 'none',
        functionality: 'both',
        httpMethod: 'PUT',
        aliases: {
            deprecated: ['contactUnblock'],
        },
        wapiOverride: 'contactUnblock',
    },
    input: z.object({ contactId: contactIdParam }),
    parameterOrder: ['contactId'],
    output: z.boolean(),
});

export const checkReadReceipts = defineMethodV2('checkReadReceipts', {
    meta: {
        description: 'Check read receipts setting',
        action: 'read',
        namespace: 'contacts',
        license: 'none',
        functionality: 'both',
        httpMethod: 'GET',
        aliases: {
            explicit: ['getReadReceipts'],
        },
    },
    input: z.object({ contactId: contactIdParam }),
    parameterOrder: ['contactId'],
    output: z.union([z.boolean(), z.string()]),
});

export const checkNumberStatus = defineMethodV2('checkNumberStatus', {
    meta: {
        description: 'Check if number is on WhatsApp',
        action: 'read',
        namespace: 'contacts',
        license: 'insiders',
        functionality: 'both',
        httpMethod: 'GET',
    },
    input: z.object({ contactId: contactIdParam }),
    parameterOrder: ['contactId'],
    output: z.any(),
});

export const getProfilePicture = defineMethodV2('getProfilePicture', {
    meta: {
        description: 'Get profile picture from server',
        action: 'read',
        namespace: 'contacts',
        license: 'none',
        functionality: 'both',
        httpMethod: 'GET',
        aliases: {
            deprecated: ['getProfilePicFromServer'],
        },
        wapiOverride: 'getProfilePicFromServer',
    },
    input: z.object({ chatId: chatIdParam }),
    parameterOrder: ['chatId'],
    output: z.string(),
});
