import { Client } from '../..';

export { Chat } from './chat';
export { Contact } from './contact';
export { Message } from './message';


/**
 * Client status
 * @readonly
 * @enum {number}
 */
export enum Status {
    INITIALIZING = 0,
    AUTHENTICATING = 1,
    READY = 3
};

/**
 * Events that can be emitted by the client
 * @readonly
 * @enum {string}
 */
export enum Events {
    AUTHENTICATED = 'authenticated',
    AUTHENTICATION_FAILURE = 'auth_failure',
    READY = 'ready',
    MESSAGE_RECEIVED = 'message',
    MESSAGE_CREATE = 'message_create',
    MESSAGE_REVOKED_EVERYONE = 'message_revoke_everyone',
    MESSAGE_REVOKED_ME = 'message_revoke_me',
    MESSAGE_ACK = 'message_ack',
    GROUP_JOIN = 'group_join',
    GROUP_LEAVE = 'group_leave',
    GROUP_UPDATE = 'group_update',
    QR_RECEIVED = 'qr',
    DISCONNECTED = 'disconnected',
    STATE_CHANGED = 'change_state',
};

/**
 * Session state
 * @readonly
 * @enum {string}
 */
export enum STATE {
    CONFLICT = 'CONFLICT',
    CONNECTED = 'CONNECTED',
    DEPRECATED_VERSION = 'DEPRECATED_VERSION',
    OPENING = 'OPENING',
    PAIRING = 'PAIRING',
    PROXYBLOCK = 'PROXYBLOCK',
    SMB_TOS_BLOCK = 'SMB_TOS_BLOCK',
    TIMEOUT = 'TIMEOUT',
    TOS_BLOCK = 'TOS_BLOCK',
    UNLAUNCHED = 'UNLAUNCHED',
    UNPAIRED = 'UNPAIRED',
    UNPAIRED_IDLE = 'UNPAIRED_IDLE'
};


export * from './config'