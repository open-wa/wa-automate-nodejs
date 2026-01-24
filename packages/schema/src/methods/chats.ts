import { z } from 'zod';
import { defineMethodV2 } from '../registry';
import { toParam, withNewMessagesOnlyParam } from '../parameters';

// ============================================================================
// Chat Methods
// ============================================================================

/**
 * Retrieves all chats
 */
export const getAllChats = defineMethodV2('getAllChats', {
    meta: {
        description: 'Retrieves all chats',
        action: 'read',
        namespace: 'chats',
        license: 'none',
        functionality: 'both',
        httpMethod: 'GET',
    },
    input: z.object({
        withNewMessagesOnly: withNewMessagesOnlyParam
    }),
    parameterOrder: ['withNewMessagesOnly'],
    output: z.array(z.any())
});

/**
 * Get all chat IDs
 */
export const getAllChatIds = defineMethodV2('getAllChatIds', {
    meta: {
        description: 'Get all chat IDs',
        action: 'read',
        namespace: 'chats',
        license: 'none',
        functionality: 'both',
        httpMethod: 'GET',
    },
    input: z.object({}),
    parameterOrder: [],
    output: z.array(z.string())
});

/**
 * Get all chats with messages
 */
export const getAllChatsWithMessages = defineMethodV2('getAllChatsWithMessages', {
    meta: {
        description: 'Get chats with messages',
        action: 'read',
        namespace: 'chats',
        license: 'none',
        functionality: 'both',
        httpMethod: 'GET',
    },
    input: z.object({
        withNewMessageOnly: z.boolean().optional().default(false)
    }),
    parameterOrder: ['withNewMessageOnly'],
    output: z.array(z.any())
});

/**
 * Get chat by ID
 */
export const getChatById = defineMethodV2('getChatById', {
    meta: {
        description: 'Get specific chat by ID',
        action: 'read',
        namespace: 'chats',
        license: 'none',
        functionality: 'both',
        httpMethod: 'GET',
    },
    input: z.object({
        contactId: toParam
    }),
    parameterOrder: ['contactId'],
    output: z.any()
});

/**
 * Get chat
 */
export const getChat = defineMethodV2('getChat', {
    meta: {
        description: 'Get chat by contact ID',
        action: 'read',
        namespace: 'chats',
        license: 'none',
        functionality: 'both',
        httpMethod: 'GET',
    },
    input: z.object({
        contactId: toParam
    }),
    parameterOrder: ['contactId'],
    output: z.any()
});

/**
 * Get chats with non-contacts
 */
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
    output: z.array(z.any())
});

/**
 * Archive chat
 */
export const archiveChat = defineMethodV2('archiveChat', {
    meta: {
        description: 'Archive a chat',
        action: 'update',
        namespace: 'chats',
        license: 'none',
        functionality: 'both',
        httpMethod: 'PUT',
    },
    input: z.object({
        chatId: toParam
    }),
    parameterOrder: ['chatId'],
    output: z.boolean()
});

/**
 * Unarchive chat
 */
export const unarchiveChat = defineMethodV2('unarchiveChat', {
    meta: {
        description: 'Unarchive a chat',
        action: 'update',
        namespace: 'chats',
        license: 'none',
        functionality: 'both',
        httpMethod: 'PUT',
    },
    input: z.object({
        chatId: toParam
    }),
    parameterOrder: ['chatId'],
    output: z.boolean()
});

/**
 * Clear chat
 */
export const clearChat = defineMethodV2('clearChat', {
    meta: {
        description: 'Clear chat history',
        action: 'delete',
        namespace: 'chats',
        license: 'none',
        functionality: 'both',
        httpMethod: 'DELETE',
    },
    input: z.object({
        chatId: toParam
    }),
    parameterOrder: ['chatId'],
    output: z.boolean()
});

/**
 * Delete chat
 */
export const deleteChat = defineMethodV2('deleteChat', {
    meta: {
        description: 'Delete a chat',
        action: 'delete',
        namespace: 'chats',
        license: 'none',
        functionality: 'both',
        httpMethod: 'DELETE',
    },
    input: z.object({
        chatId: toParam
    }),
    parameterOrder: ['chatId'],
    output: z.boolean()
});

/**
 * Pin chat
 */
export const pinChat = defineMethodV2('pinChat', {
    meta: {
        description: 'Pin a chat',
        action: 'update',
        namespace: 'chats',
        license: 'none',
        functionality: 'both',
        httpMethod: 'PUT',
    },
    input: z.object({
        chatId: toParam
    }),
    parameterOrder: ['chatId'],
    output: z.boolean()
});

/**
 * Unpin chat
 */
export const unpinChat = defineMethodV2('unpinChat', {
    meta: {
        description: 'Unpin a chat',
        action: 'update',
        namespace: 'chats',
        license: 'none',
        functionality: 'both',
        httpMethod: 'PUT',
    },
    input: z.object({
        chatId: toParam
    }),
    parameterOrder: ['chatId'],
    output: z.boolean()
});

/**
 * Mute chat
 */
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
        chatId: toParam,
        muteDuration: z.union([z.number(), z.string()]).describe('Mute duration')
    }),
    parameterOrder: ['chatId', 'muteDuration'],
    output: z.union([z.string(), z.boolean(), z.number()])
});

/**
 * Unmute chat
 */
export const unmuteChat = defineMethodV2('unmuteChat', {
    meta: {
        description: 'Unmute a chat',
        action: 'update',
        namespace: 'chats',
        license: 'none',
        functionality: 'both',
        httpMethod: 'PUT',
    },
    input: z.object({
        chatId: toParam
    }),
    parameterOrder: ['chatId'],
    output: z.union([z.string(), z.boolean(), z.number()])
});

/**
 * Mark as read
 */
export const markAsRead = defineMethodV2('markAsRead', {
    meta: {
        description: 'Mark chat as read',
        action: 'update',
        namespace: 'chats',
        license: 'none',
        functionality: 'both',
        httpMethod: 'PUT',
    },
    input: z.object({
        chatId: toParam
    }),
    parameterOrder: ['chatId'],
    output: z.boolean()
});

/**
 * Mark as unread
 */
export const markAsUnread = defineMethodV2('markAsUnread', {
    meta: {
        description: 'Mark chat as unread',
        action: 'update',
        namespace: 'chats',
        license: 'none',
        functionality: 'both',
        httpMethod: 'PUT',
    },
    input: z.object({
        chatId: toParam
    }),
    parameterOrder: ['chatId'],
    output: z.boolean()
});

/**
 * Set chat ephemeral
 */
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
        chatId: toParam,
        ephemeral: z.union([z.boolean(), z.number()]).describe('Ephemeral setting')
    }),
    parameterOrder: ['chatId', 'ephemeral'],
    output: z.boolean()
});

/**
 * Check if chat is online
 */
export const isChatOnline = defineMethodV2('isChatOnline', {
    meta: {
        description: 'Check if chat is online',
        action: 'read',
        namespace: 'chats',
        license: 'none',
        functionality: 'both',
        httpMethod: 'GET',
    },
    input: z.object({
        id: toParam
    }),
    parameterOrder: ['id'],
    output: z.union([z.boolean(), z.string()])
});
