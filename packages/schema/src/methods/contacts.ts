import { z } from 'zod';
import { defineMethodV2 } from '../registry';
import { contactIdParam, toParam } from '../parameters';

// ============================================================================
// Contact Methods
// ============================================================================

/**
 * Retrieves all contacts
 */
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
    output: z.array(z.any())
});

/**
 * Get specific contact
 */
export const getContact = defineMethodV2('getContact', {
    meta: {
        description: 'Get specific contact',
        action: 'read',
        namespace: 'contacts',
        license: 'none',
        functionality: 'both',
        httpMethod: 'GET',
    },
    input: z.object({
        contactId: contactIdParam
    }),
    parameterOrder: ['contactId'],
    output: z.any()
});

/**
 * Get common groups
 */
export const getCommonGroups = defineMethodV2('getCommonGroups', {
    meta: {
        description: 'Get common groups with contact',
        action: 'read',
        namespace: 'contacts',
        license: 'none',
        functionality: 'both',
        httpMethod: 'GET',
    },
    input: z.object({
        contactId: contactIdParam
    }),
    parameterOrder: ['contactId'],
    output: z.any()
});

/**
 * Get number profile
 */
export const getNumberProfile = defineMethodV2('getNumberProfile', {
    meta: {
        description: 'Get profile of number',
        action: 'read',
        namespace: 'contacts',
        license: 'insiders',
        functionality: 'both',
        httpMethod: 'GET',
    },
    input: z.object({
        contactId: contactIdParam
    }),
    parameterOrder: ['contactId'],
    output: z.any()
});

/**
 * Get blocked IDs
 */
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
    output: z.array(z.string())
});

/**
 * Block contact
 */
export const contactBlock = defineMethodV2('contactBlock', {
    meta: {
        description: 'Block a contact',
        action: 'update',
        namespace: 'contacts',
        license: 'none',
        functionality: 'both',
        httpMethod: 'PUT',
    },
    input: z.object({
        id: contactIdParam
    }),
    parameterOrder: ['id'],
    output: z.boolean()
});

/**
 * Unblock contact
 */
export const contactUnblock = defineMethodV2('contactUnblock', {
    meta: {
        description: 'Unblock a contact',
        action: 'update',
        namespace: 'contacts',
        license: 'none',
        functionality: 'both',
        httpMethod: 'PUT',
    },
    input: z.object({
        id: contactIdParam
    }),
    parameterOrder: ['id'],
    output: z.boolean()
});

/**
 * Check read receipts
 */
export const checkReadReceipts = defineMethodV2('checkReadReceipts', {
    meta: {
        description: 'Check read receipts setting',
        action: 'read',
        namespace: 'contacts',
        license: 'none',
        functionality: 'both',
        httpMethod: 'GET',
    },
    input: z.object({
        contactId: contactIdParam
    }),
    parameterOrder: ['contactId'],
    output: z.union([z.boolean(), z.string()])
});

/**
 * Check number status
 */
export const checkNumberStatus = defineMethodV2('checkNumberStatus', {
    meta: {
        description: 'Check if number is on WhatsApp',
        action: 'read',
        namespace: 'contacts',
        license: 'insiders',
        functionality: 'both',
        httpMethod: 'GET',
    },
    input: z.object({
        contactId: contactIdParam
    }),
    parameterOrder: ['contactId'],
    output: z.any()
});

/**
 * Get profile picture from server
 */
export const getProfilePicFromServer = defineMethodV2('getProfilePicFromServer', {
    meta: {
        description: 'Get profile picture from server',
        action: 'read',
        namespace: 'contacts',
        license: 'none',
        functionality: 'both',
        httpMethod: 'GET',
    },
    input: z.object({
        chatId: toParam
    }),
    parameterOrder: ['chatId'],
    output: z.string()
});
