import { z } from 'zod';
import { defineMethodV2 } from '../registry';
import { contactIdParam, groupIdParam, withNewMessagesOnlyParam } from '../parameters';

export const getGroupMembers = defineMethodV2('getGroupMembers', {
    meta: {
        description: 'Retrieves members of a group',
        action: 'read',
        namespace: 'groups',
        license: 'none',
        functionality: 'both',
        httpMethod: 'GET',
    },
    input: z.object({ groupId: groupIdParam }),
    parameterOrder: ['groupId'],
    output: z.array(z.any()),
});

export const getAllGroups = defineMethodV2('getAllGroups', {
    meta: {
        description: 'Get all groups',
        action: 'read',
        namespace: 'groups',
        license: 'none',
        functionality: 'both',
        httpMethod: 'GET',
    },
    input: z.object({ withNewMessagesOnly: withNewMessagesOnlyParam }),
    parameterOrder: ['withNewMessagesOnly'],
    output: z.array(z.any()),
});

export const getGroupMembersId = defineMethodV2('getGroupMembersId', {
    meta: {
        description: 'Get group member IDs',
        action: 'read',
        namespace: 'groups',
        license: 'none',
        functionality: 'both',
        httpMethod: 'GET',
        aliases: {
            explicit: ['getGroupMemberIds'],
            namespacedName: 'getMemberIds',
        },
    },
    input: z.object({ groupId: groupIdParam }),
    parameterOrder: ['groupId'],
    output: z.array(z.string()),
});

export const getGroupInfo = defineMethodV2('getGroupInfo', {
    meta: {
        description: 'Get group metadata',
        action: 'read',
        namespace: 'groups',
        license: 'none',
        functionality: 'both',
        httpMethod: 'GET',
    },
    input: z.object({ groupId: groupIdParam }),
    parameterOrder: ['groupId'],
    output: z.any(),
});

export const getGroupAdmins = defineMethodV2('getGroupAdmins', {
    meta: {
        description: 'Get group admins',
        action: 'read',
        namespace: 'groups',
        license: 'none',
        functionality: 'both',
        httpMethod: 'GET',
    },
    input: z.object({ groupId: groupIdParam }),
    parameterOrder: ['groupId'],
    output: z.array(z.any()),
});

export const getKickedGroups = defineMethodV2('getKickedGroups', {
    meta: {
        description: 'Get groups where kicked',
        action: 'read',
        namespace: 'groups',
        license: 'none',
        functionality: 'both',
        httpMethod: 'GET',
    },
    input: z.object({}),
    parameterOrder: [],
    output: z.array(z.string()),
});

export const getGroupInviteLink = defineMethodV2('getGroupInviteLink', {
    meta: {
        description: 'Get group invite link',
        action: 'read',
        namespace: 'groups',
        license: 'none',
        functionality: 'both',
        httpMethod: 'GET',
    },
    input: z.object({ groupId: groupIdParam }),
    parameterOrder: ['groupId'],
    output: z.string(),
});

export const createGroup = defineMethodV2('createGroup', {
    meta: {
        description: 'Create new group',
        action: 'send',
        namespace: 'groups',
        license: 'restricted',
        functionality: 'both',
        httpMethod: 'POST',
    },
    input: z.object({
        name: z.string().describe('Group name'),
        contacts: z.array(contactIdParam).describe('Contact IDs to add'),
    }),
    parameterOrder: ['name', 'contacts'],
    output: z.any(),
});

export const leaveGroup = defineMethodV2('leaveGroup', {
    meta: {
        description: 'Leave a group',
        action: 'update',
        namespace: 'groups',
        license: 'none',
        functionality: 'both',
        httpMethod: 'PUT',
    },
    input: z.object({ groupId: groupIdParam }),
    parameterOrder: ['groupId'],
    output: z.any(),
});

export const joinGroupViaLink = defineMethodV2('joinGroupViaLink', {
    meta: {
        description: 'Join group via invite link',
        action: 'send',
        namespace: 'groups',
        license: 'restricted',
        functionality: 'both',
        httpMethod: 'POST',
        aliases: {
            explicit: ['joinGroup'],
            namespacedName: 'join',
        },
    },
    input: z.object({
        link: z.string().url().describe('Group invite link'),
        returnChatObj: z.boolean().optional().describe('Return chat object'),
    }),
    parameterOrder: ['link', 'returnChatObj'],
    output: z.union([z.string(), z.boolean(), z.number(), z.any()]),
});

export const revokeGroupInviteLink = defineMethodV2('revokeGroupInviteLink', {
    meta: {
        description: 'Revoke group invite link',
        action: 'update',
        namespace: 'groups',
        license: 'none',
        functionality: 'both',
        httpMethod: 'PUT',
    },
    input: z.object({ groupId: groupIdParam }),
    parameterOrder: ['groupId'],
    output: z.union([z.string(), z.boolean()]),
});

export const setGroupTitle = defineMethodV2('setGroupTitle', {
    meta: {
        description: 'Set group title',
        action: 'update',
        namespace: 'groups',
        license: 'none',
        functionality: 'both',
        httpMethod: 'PUT',
    },
    input: z.object({
        groupId: groupIdParam,
        title: z.string().describe('New group title'),
    }),
    parameterOrder: ['groupId', 'title'],
    output: z.boolean(),
});

export const setGroupDescription = defineMethodV2('setGroupDescription', {
    meta: {
        description: 'Set group description',
        action: 'update',
        namespace: 'groups',
        license: 'none',
        functionality: 'both',
        httpMethod: 'PUT',
    },
    input: z.object({
        groupId: groupIdParam,
        description: z.string().describe('New group description'),
    }),
    parameterOrder: ['groupId', 'description'],
    output: z.boolean(),
});

export const setGroupIcon = defineMethodV2('setGroupIcon', {
    meta: {
        description: 'Set group icon',
        action: 'update',
        namespace: 'groups',
        license: 'none',
        functionality: 'both',
        httpMethod: 'PUT',
    },
    input: z.object({
        groupId: groupIdParam,
        image: z.string().describe('Image data URL'),
    }),
    parameterOrder: ['groupId', 'image'],
    output: z.boolean(),
});

export const setGroupToAdminsOnly = defineMethodV2('setGroupToAdminsOnly', {
    meta: {
        description: 'Restrict group to admins only',
        action: 'update',
        namespace: 'groups',
        license: 'none',
        functionality: 'both',
        httpMethod: 'PUT',
        aliases: {
            namespacedName: 'setAdminsOnly',
        },
    },
    input: z.object({
        groupId: groupIdParam,
        onlyAdmins: z.boolean().describe('Admins only setting'),
    }),
    parameterOrder: ['groupId', 'onlyAdmins'],
    output: z.boolean(),
});

export const setGroupEditToAdminsOnly = defineMethodV2('setGroupEditToAdminsOnly', {
    meta: {
        description: 'Restrict group editing to admins only',
        action: 'update',
        namespace: 'groups',
        license: 'none',
        functionality: 'both',
        httpMethod: 'PUT',
        aliases: {
            namespacedName: 'setEditAdminsOnly',
        },
    },
    input: z.object({
        groupId: groupIdParam,
        onlyAdmins: z.boolean().describe('Admins only setting'),
    }),
    parameterOrder: ['groupId', 'onlyAdmins'],
    output: z.boolean(),
});

export const addParticipant = defineMethodV2('addParticipant', {
    meta: {
        description: 'Add participant to group',
        action: 'update',
        namespace: 'groups',
        license: 'none',
        functionality: 'both',
        httpMethod: 'PUT',
        aliases: {
            explicit: ['addGroupParticipant'],
        },
    },
    input: z.object({
        groupId: groupIdParam,
        contactId: contactIdParam,
    }),
    parameterOrder: ['groupId', 'contactId'],
    output: z.boolean(),
});

export const removeParticipant = defineMethodV2('removeParticipant', {
    meta: {
        description: 'Remove participant from group',
        action: 'update',
        namespace: 'groups',
        license: 'none',
        functionality: 'both',
        httpMethod: 'PUT',
        aliases: {
            explicit: ['removeGroupParticipant'],
        },
    },
    input: z.object({
        groupId: groupIdParam,
        contactId: contactIdParam,
    }),
    parameterOrder: ['groupId', 'contactId'],
    output: z.boolean(),
});

export const promoteParticipant = defineMethodV2('promoteParticipant', {
    meta: {
        description: 'Promote participant to admin',
        action: 'update',
        namespace: 'groups',
        license: 'none',
        functionality: 'both',
        httpMethod: 'PUT',
        aliases: {
            explicit: ['promoteGroupParticipant'],
        },
    },
    input: z.object({
        groupId: groupIdParam,
        contactId: contactIdParam,
    }),
    parameterOrder: ['groupId', 'contactId'],
    output: z.union([z.boolean(), z.string()]),
});

export const demoteParticipant = defineMethodV2('demoteParticipant', {
    meta: {
        description: 'Demote participant from admin',
        action: 'update',
        namespace: 'groups',
        license: 'none',
        functionality: 'both',
        httpMethod: 'PUT',
        aliases: {
            explicit: ['demoteGroupParticipant'],
        },
    },
    input: z.object({
        groupId: groupIdParam,
        contactId: contactIdParam,
    }),
    parameterOrder: ['groupId', 'contactId'],
    output: z.union([z.boolean(), z.string()]),
});

export const approveGroupJoinRequest = defineMethodV2('approveGroupJoinRequest', {
    meta: {
        description: 'Approve group join request',
        action: 'update',
        namespace: 'groups',
        license: 'none',
        functionality: 'both',
        httpMethod: 'PUT',
    },
    input: z.object({
        groupId: groupIdParam,
        contactId: contactIdParam,
    }),
    parameterOrder: ['groupId', 'contactId'],
    output: z.union([z.string(), z.boolean()]),
});

export const rejectGroupJoinRequest = defineMethodV2('rejectGroupJoinRequest', {
    meta: {
        description: 'Reject group join request',
        action: 'update',
        namespace: 'groups',
        license: 'none',
        functionality: 'both',
        httpMethod: 'PUT',
    },
    input: z.object({
        groupId: groupIdParam,
        contactId: contactIdParam,
    }),
    parameterOrder: ['groupId', 'contactId'],
    output: z.union([z.string(), z.boolean()]),
});
