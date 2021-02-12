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
 * The state of the WA Web session. You can listen to session state changes using [[onStateChanged]]. Just to be clear, some of these states aren't understood completely.
 * @readonly
 * @enum {string}
 */
export enum STATE {
    /**
     * Another WA web session has been opened for this account somewhere else.
     */
    CONFLICT = 'CONFLICT',
    /**
     * The session is successfully connected and ready to send and receive messages.
     */
    CONNECTED = 'CONNECTED',
    /**
     * WA web updates every fortnight (or so). This state would be emitted then.
     */
    DEPRECATED_VERSION = 'DEPRECATED_VERSION',
    /**
     * This probably shows up when reloading an already authenticated session.
     */
    OPENING = 'OPENING',
    /**
     * This probably shows up immediately after the QR code is scanned
     */
    PAIRING = 'PAIRING',
    /**
     * This state probably represented a block on the proxy address your app is using.
     */
    PROXYBLOCK = 'PROXYBLOCK',
    /**
     * This usually shows up when the session has been blocked by WA due to some issue with the browser/user agent. This is a different version of a Terms of Service Block from what we know. It may also show up when the host account is banned.
     */
    SMB_TOS_BLOCK = 'SMB_TOS_BLOCK',
    /**
     * The trigger for this state is as of yet unknown
     */
    TIMEOUT = 'TIMEOUT',
    /**
     * This usually shows up when the session has been blocked by WA due to some issue with the browser/user agent. It literally stands for Terms of Service Block. It may also show up when the host account is banned.
     */
    TOS_BLOCK = 'TOS_BLOCK',
    /**
     * The same (probably replacement) for CONFLICT
     */
    UNLAUNCHED = 'UNLAUNCHED',
    /**
     * When `UNPAIRED` the page is waiting for a QR Code scan. If your state becomes `UNPAIRED` then the session is most likely signed out by the host account.
     */
    UNPAIRED = 'UNPAIRED',
    /**
     * This state is fired when the QR code has not been scanned for a long time (about 1 minute). On the page it will show "Click to reload QR code"
     */
    UNPAIRED_IDLE = 'UNPAIRED_IDLE',
    /**
     * This is fired when the QR code is scanned 
     */
    SYNCING = 'SYNCING',
    /**
     * This is fired when the connection between web and the host account primary device is disconnected. This is fired frequently to save battery.
     */
    DISCONNECTED = 'DISCONNECTED',
};


export * from './config'
export * from './media'
export * from './aliases'