import { z } from 'zod';
import { defineMethodV2 } from '../registry';
import { chatIdParam, withNewMessagesOnlyParam } from '../parameters';

export const getAllChats = defineMethodV2('getAllChats', {
    meta: {
        description: 'Retrieves all chats',
        action: 'read',
        namespace: 'chats',
        license: 'none',
        functionality: 'both',
        httpMethod: 'GET',
    },
    input: z.object({ withNewMessagesOnly: withNewMessagesOnlyParam }),
    parameterOrder: ['withNewMessagesOnly'],
    output: z.array(z.any()),
});

export const getAllChatIds = defineMethodV2('getAllChatIds', {
    meta: {
        description: 'Get all chat IDs',
        action: 'read',
        namespace: 'chatIds',
        license: 'none',
        functionality: 'both',
        httpMethod: 'GET',
        aliases: {
            explicit: ['chats.ids'],
        },
    },
    input: z.object({}),
    parameterOrder: [],
    output: z.array(z.string()),
});

// export const getAllChatsWithMessages = defineMethodV2('getAllChatsWithMessages', {
//     meta: {
//         description: 'Get chats with messages',
//         action: 'read',
//         namespace: 'chats',
//         license: 'none',
//         functionality: 'both',
//         httpMethod: 'GET',
//     },
//     input: z.object({
//         withNewMessagesOnly: withNewMessagesOnlyParam,
//     }),
//     parameterOrder: ['withNewMessagesOnly'],
//     output: z.array(z.any()),
// });

export const getChat = defineMethodV2('getChat', {
    meta: {
        description: 'Get specific chat by ID',
        action: 'read',
        namespace: 'chats',
        license: 'none',
        functionality: 'both',
        httpMethod: 'GET',
        aliases: {
            explicit: ['getChatById'],
        },
    },
    input: z.object({
        chatId: chatIdParam,
    }),
    parameterOrder: ['chatId'],
    output: z.any(),
});

export const getChatWithNonContacts = defineMethodV2('getChatWithNonContacts', {
    meta: {
        description: 'Get chats with non-contacts',
        action: 'read',
        namespace: 'chats',
        license: 'none',
        functionality: 'both',
        httpMethod: 'GET',
    },
    input: z.object({}),
    parameterOrder: [],
    output: z.array(z.any()),
});

export const archiveChat = defineMethodV2('archiveChat', {
    meta: {
        description: 'Archive a chat',
        action: 'update',
        namespace: 'chats',
        license: 'none',
        functionality: 'both',
        httpMethod: 'PUT',
    },
    input: z.object({ chatId: chatIdParam }),
    parameterOrder: ['chatId'],
    output: z.boolean(),
});

export const unarchiveChat = defineMethodV2('unarchiveChat', {
    meta: {
        description: 'Unarchive a chat',
        action: 'update',
        namespace: 'chats',
        license: 'none',
        functionality: 'both',
        httpMethod: 'PUT',
    },
    input: z.object({ chatId: chatIdParam }),
    parameterOrder: ['chatId'],
    output: z.boolean(),
});

export const clearChat = defineMethodV2('clearChat', {
    meta: {
        description: 'Clear chat history',
        action: 'delete',
        namespace: 'chats',
        license: 'none',
        functionality: 'both',
        httpMethod: 'DELETE',
    },
    input: z.object({ chatId: chatIdParam }),
    parameterOrder: ['chatId'],
    output: z.boolean(),
});

export const deleteChat = defineMethodV2('deleteChat', {
    meta: {
        description: 'Delete a chat',
        action: 'delete',
        namespace: 'chats',
        license: 'none',
        functionality: 'both',
        httpMethod: 'DELETE',
    },
    input: z.object({ chatId: chatIdParam }),
    parameterOrder: ['chatId'],
    output: z.boolean(),
});

export const pinChat = defineMethodV2('pinChat', {
    meta: {
        description: 'Pin a chat',
        action: 'update',
        namespace: 'chats',
        license: 'none',
        functionality: 'both',
        httpMethod: 'PUT',
    },
    input: z.object({ chatId: chatIdParam }),
    parameterOrder: ['chatId'],
    output: z.boolean(),
});

export const unpinChat = defineMethodV2('unpinChat', {
    meta: {
        description: 'Unpin a chat',
        action: 'update',
        namespace: 'chats',
        license: 'none',
        functionality: 'both',
        httpMethod: 'PUT',
    },
    input: z.object({ chatId: chatIdParam }),
    parameterOrder: ['chatId'],
    output: z.boolean(),
});

export const muteChat = defineMethodV2('muteChat', {
    meta: {
        description: 'Mute a chat',
        action: 'update',
        namespace: 'chats',
        license: 'none',
        functionality: 'both',
        httpMethod: 'PUT',
    },
    input: z.object({
        chatId: chatIdParam,
        muteDuration: z.union([z.number(), z.string()]).describe('Mute duration'),
    }),
    parameterOrder: ['chatId', 'muteDuration'],
    output: z.union([z.string(), z.boolean(), z.number()]),
});

export const unmuteChat = defineMethodV2('unmuteChat', {
    meta: {
        description: 'Unmute a chat',
        action: 'update',
        namespace: 'chats',
        license: 'none',
        functionality: 'both',
        httpMethod: 'PUT',
    },
    input: z.object({ chatId: chatIdParam }),
    parameterOrder: ['chatId'],
    output: z.union([z.string(), z.boolean(), z.number()]),
});

export const markAsRead = defineMethodV2('markAsRead', {
    meta: {
        description: 'Mark chat as read',
        action: 'update',
        namespace: 'chats',
        license: 'none',
        functionality: 'both',
        httpMethod: 'PUT',
        aliases: {
            namespacedName: 'markAsRead',
        },
    },
    input: z.object({ chatId: chatIdParam }),
    parameterOrder: ['chatId'],
    output: z.boolean(),
});

export const markAsUnread = defineMethodV2('markAsUnread', {
    meta: {
        description: 'Mark chat as unread',
        action: 'update',
        namespace: 'chats',
        license: 'none',
        functionality: 'both',
        httpMethod: 'PUT',
        aliases: {
            namespacedName: 'markAsUnread',
        },
    },
    input: z.object({ chatId: chatIdParam }),
    parameterOrder: ['chatId'],
    output: z.boolean(),
});

export const setChatEphemeral = defineMethodV2('setChatEphemeral', {
    meta: {
        description: 'Set ephemeral messages for chat',
        action: 'update',
        namespace: 'chats',
        license: 'none',
        functionality: 'both',
        httpMethod: 'PUT',
    },
    input: z.object({
        chatId: chatIdParam,
        ephemeral: z.union([z.boolean(), z.number()]).describe('Ephemeral setting'),
    }),
    parameterOrder: ['chatId', 'ephemeral'],
    output: z.boolean(),
});

export const isChatOnline = defineMethodV2('isChatOnline', {
    meta: {
        description: 'Check if chat is online',
        action: 'read',
        namespace: 'chats',
        license: 'none',
        functionality: 'both',
        httpMethod: 'GET',
    },
    input: z.object({ chatId: chatIdParam }),
    parameterOrder: ['chatId'],
    output: z.union([z.boolean(), z.string()]),
});
