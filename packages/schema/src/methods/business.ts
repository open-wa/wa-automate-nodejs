import { z } from 'zod';
import { defineMethodV2 } from '../registry';
import { contactIdParam, messageIdParam } from '../parameters';

export const getBusinessProfile = defineMethodV2('getBusinessProfile', {
    meta: {
        description: 'Get business profile',
        action: 'read',
        namespace: 'business',
        license: 'none',
        functionality: 'both',
        httpMethod: 'GET',
    },
    input: z.object({ contactId: contactIdParam }),
    parameterOrder: ['contactId'],
    output: z.any(),
});

export const getBusinessProducts = defineMethodV2('getBusinessProducts', {
    meta: {
        description: 'Get business products',
        action: 'read',
        namespace: 'business',
        license: 'none',
        functionality: 'both',
        httpMethod: 'GET',
        aliases: {
            deprecated: ['getBusinessProfilesProducts'],
        },
        wapiOverride: 'getBusinessProfilesProducts',
    },
    input: z.object({ contactId: contactIdParam }),
    parameterOrder: ['contactId'],
    output: z.any(),
});

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
        id: z.union([messageIdParam, z.string()]).describe('Order or message ID'),
    }),
    parameterOrder: ['id'],
    output: z.any(),
});
