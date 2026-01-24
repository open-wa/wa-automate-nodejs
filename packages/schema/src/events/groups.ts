import { z } from 'zod';
import { defineListenerV2 } from './registry';

export const participantsChangedEvent = defineListenerV2('participantsChanged', {
    legacyName: 'onParticipantsChanged',
    meta: {
        description: 'Fired when group participants change',
        namespace: 'groups',
        status: 'stable',
        license: 'none',
    },
    payload: z.object({
        groupId: z.string(),
        action: z.enum(['add', 'remove', 'promote', 'demote']),
        participantIds: z.array(z.string()),
        by: z.string().optional(),
    }),
});

export const addedToGroupEvent = defineListenerV2('addedToGroup', {
    legacyName: 'onAddedToGroup',
    meta: {
        description: 'Fired when you are added to a group',
        namespace: 'groups',
        status: 'stable',
        license: 'none',
    },
    payload: z.object({
        groupId: z.string(),
        groupName: z.string(),
        addedBy: z.string().optional(),
    }),
});
