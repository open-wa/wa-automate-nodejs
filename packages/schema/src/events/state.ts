import { z } from 'zod';
import { defineListenerV2 } from './registry';

export const StateEnum = z.enum([
    'STARTING',
    'AUTHENTICATING',
    'READY',
    'STOPPED',
    'CONNECTED',
    'DISCONNECTED', 
    'SYNCING',
    'CONFLICT',
    'UNLAUNCHED',
    'PAIRING',
    'TIMEOUT',
]);

export const stateChangedEvent = defineListenerV2('stateChanged', {
    legacyName: 'onStateChanged',
    meta: {
        description: 'Fired when connection state changes',
        namespace: 'state',
        status: 'stable',
        license: 'none',
    },
    payload: z.object({
        state: StateEnum,
        previousState: StateEnum.optional(),
    }),
});

export const chatStateEvent = defineListenerV2('chatState', {
    legacyName: 'onChatState',
    meta: {
        description: 'Fired when someone is typing or recording',
        namespace: 'state',
        status: 'stable',
        license: 'none',
    },
    payload: z.object({
        chatId: z.string(),
        state: z.enum(['typing', 'recording', 'paused']),
        senderId: z.string(),
    }),
});

export const logoutEvent = defineListenerV2('logout', {
    legacyName: 'onLogout',
    meta: {
        description: 'Fired when the session is logged out',
        namespace: 'state',
        status: 'stable',
        license: 'none',
    },
    payload: z.object({
        reason: z.string().optional(),
        timestamp: z.number(),
    }),
});
