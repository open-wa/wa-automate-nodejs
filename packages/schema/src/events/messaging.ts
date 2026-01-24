import { z } from 'zod';
import { defineListenerV2 } from './registry';
import { MessageSchema, MessageAck } from '../common-types';

const AckSchema = z.object({
    id: z.string(),
    chatId: z.string(),
    ack: z.nativeEnum(MessageAck),
    timestamp: z.number().optional(),
});

export const messageEvent = defineListenerV2('message', {
    legacyName: 'onMessage',
    meta: {
        description: 'Fired when a new message is received (excluding own messages)',
        namespace: 'messages',
        status: 'stable',
        license: 'none',
    },
    payload: MessageSchema,
    defaultQueueOptions: { concurrency: 1 },
});

export const anyMessageEvent = defineListenerV2('anyMessage', {
    legacyName: 'onAnyMessage',
    meta: {
        description: 'Fired for any message including own messages',
        namespace: 'messages',
        status: 'stable',
        license: 'none',
    },
    payload: MessageSchema,
    defaultQueueOptions: { concurrency: 1 },
});

export const messageDeletedEvent = defineListenerV2('messageDeleted', {
    legacyName: 'onMessageDeleted',
    meta: {
        description: 'Fired when a message is deleted',
        namespace: 'messages',
        status: 'stable',
        license: 'none',
    },
    payload: MessageSchema,
});

export const ackEvent = defineListenerV2('ack', {
    legacyName: 'onAck',
    meta: {
        description: 'Fired when a message acknowledgment is received',
        namespace: 'messages',
        status: 'stable',
        license: 'none',
    },
    payload: AckSchema,
});

export const reactionEvent = defineListenerV2('reaction', {
    legacyName: 'onReaction',
    meta: {
        description: 'Fired when a reaction is added to a message',
        namespace: 'messages',
        status: 'stable',
        license: 'none',
    },
    payload: z.object({
        messageId: z.string(),
        reaction: z.string(),
        senderId: z.string(),
        timestamp: z.number(),
    }),
});
