import { z } from 'zod';
import { defineListenerV2 } from './registry';
import { ContactIdSchema, GroupIdSchema } from '../common-types';

const participantChatIdSchema = z.union([
    GroupIdSchema,
    z.object({ _serialized: GroupIdSchema }).passthrough(),
]);

export const ParticipantChangeSchema = z.object({
    groupId: GroupIdSchema,
    action: z.enum(['add', 'remove', 'promote', 'demote', 'invite', 'leave']),
    participantIds: z.array(ContactIdSchema),
    by: z.string().optional(),
    who: ContactIdSchema.optional(),
    chat: participantChatIdSchema.optional(),
}).passthrough();
export type ParticipantChange = z.infer<typeof ParticipantChangeSchema>;

/** Adapt the existing patch callback without replacing its native listener. */
export const ParticipantChangePatchSchema = z.object({
    action: ParticipantChangeSchema.shape.action,
    who: ContactIdSchema,
    chat: participantChatIdSchema,
    by: z.string().optional(),
}).passthrough().transform(change => ({
    ...change,
    groupId: typeof change.chat === 'string' ? change.chat : change.chat._serialized,
    participantIds: [change.who],
})).pipe(ParticipantChangeSchema);

export const participantsChangedEvent = defineListenerV2('participantsChanged', {
    legacyName: 'onParticipantsChanged',
    meta: {
        description: 'Fired when group participants change',
        namespace: 'groups',
        status: 'stable',
        license: 'none',
        aliases: ['onGlobalParticipantsChanged'],
    },
    payload: ParticipantChangeSchema,
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
