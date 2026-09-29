import { GroupChatIdSchema } from '../common-types';
import { CommunityAdminIdsSchema, CommunityAdminsSchema, CommunityMetadataSchema, CommunityParticipantIdsSchema, CommunityParticipantsSchema } from '../return-types';
import { z } from 'zod';
import { defineMethodV2 } from '../registry';
import { communityIdParam } from '../parameters';

// ============================================================================
// Community Methods
// ============================================================================

/**
 * Get all communities
 */
export const getAllCommunities = defineMethodV2('getAllCommunities', {
    meta: {
        description: 'Get all communities',
        action: 'read',
        namespace: 'communities',
        license: 'none',
        functionality: 'both',
        httpMethod: 'GET',
    },
    input: z.object({}),
    parameterOrder: [],
    output: z.array(GroupChatIdSchema),
});

/**
 * Get community info
 */
export const getCommunityInfo = defineMethodV2('getCommunityInfo', {
    meta: {
        description: 'Get community metadata',
        action: 'read',
        namespace: 'communities',
        license: 'none',
        functionality: 'both',
        httpMethod: 'GET',
    },
    input: z.object({
        communityId: communityIdParam
    }),
    parameterOrder: ['communityId'],
    output: CommunityMetadataSchema,
});

/**
 * Get community participant IDs
 */
export const getCommunityParticipantIds = defineMethodV2('getCommunityParticipantIds', {
    meta: {
        description: 'Get community participant IDs',
        action: 'read',
        namespace: 'communities',
        license: 'none',
        functionality: 'both',
        httpMethod: 'GET',
    },
    input: z.object({
        communityId: communityIdParam
    }),
    parameterOrder: ['communityId'],
    output: z.array(CommunityParticipantIdsSchema),
});

/**
 * Get community admin IDs
 */
export const getCommunityAdminIds = defineMethodV2('getCommunityAdminIds', {
    meta: {
        description: 'Get community admin IDs',
        action: 'read',
        namespace: 'communities',
        license: 'none',
        functionality: 'both',
        httpMethod: 'GET',
    },
    input: z.object({
        communityId: communityIdParam
    }),
    parameterOrder: ['communityId'],
    output: z.array(CommunityAdminIdsSchema),
});

/**
 * Get community participants
 */
export const getCommunityParticipants = defineMethodV2('getCommunityParticipants', {
    meta: {
        description: 'Get community participants',
        action: 'read',
        namespace: 'communities',
        license: 'none',
        functionality: 'both',
        httpMethod: 'GET',
    },
    input: z.object({
        communityId: communityIdParam
    }),
    parameterOrder: ['communityId'],
    output: z.array(CommunityParticipantsSchema),
});

/**
 * Get community admins
 */
export const getCommunityAdmins = defineMethodV2('getCommunityAdmins', {
    meta: {
        description: 'Get community admins',
        action: 'read',
        namespace: 'communities',
        license: 'none',
        functionality: 'both',
        httpMethod: 'GET',
    },
    input: z.object({
        communityId: communityIdParam
    }),
    parameterOrder: ['communityId'],
    output: z.array(CommunityAdminsSchema),
});
