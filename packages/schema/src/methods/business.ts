import { z } from 'zod';
import { defineMethodV2 } from '../registry';
import { contactIdParam, messageIdParam } from '../parameters';

// ============================================================================
// Business Methods
// ============================================================================

/**
 * Get business profile
 */
export const getBusinessProfile = defineMethodV2('getBusinessProfile', {
    meta: {
        description: 'Get business profile',
        action: 'read',
        namespace: 'business',
        license: 'none',
        functionality: 'both',
        httpMethod: 'GET',
    },
    input: z.object({
        id: contactIdParam
    }),
    parameterOrder: ['id'],
    output: z.any()
});

/**
 * Get business products
 */
export const getBusinessProfilesProducts = defineMethodV2('getBusinessProfilesProducts', {
    meta: {
        description: 'Get business products',
        action: 'read',
        namespace: 'business',
        license: 'none',
        functionality: 'both',
        httpMethod: 'GET',
    },
    input: z.object({
        id: contactIdParam
    }),
    parameterOrder: ['id'],
    output: z.any()
});

/**
 * Get order
 */
export const getOrder = defineMethodV2('getOrder', {
    meta: {
        description: 'Get order details',
        action: 'read',
        namespace: 'business',
        license: 'insiders',
        functionality: 'both',
        httpMethod: 'GET',
    },
    input: z.object({
        id: z.union([messageIdParam, z.string()]).describe('Order or message ID')
    }),
    parameterOrder: ['id'],
    output: z.any()
});
