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
 * WhatsApp state
 * @readonly
 * @enum {string}
 */
export enum WAState {
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

export interface SessionData {
    WABrowserId ?: String,
    WASecretBundle ?: String,
    WAToken1 ?: String,
    WAToken2 ?: String,
}

export interface DevTools {
    /**
     * Username for devtools
     */
    user : String,
    /**
     * Password for devtools
     */
    pass : String
}

export interface ConfigObject {
    /**
     * JSON object that is required to migrate a session from one instance to another or ot just restart an existing instance.
     * This sessionData is provided in a generated JSON file upon QR scan or an event.
     * You can capture the event like so:
     * ```javascript
     * import {create, ev} from 'sulla-hotfix';
     * ev.on('sessionData', async (sessionData, sessionId) =>{
     *          console.log(sessionId, sessionData)
     *      })
     * ```
     * 
     */
    sessionData ?: SessionData,
    /**
     * This allows you to pass any array of custom chrome/chromium argument strings to the puppeteer instance.
     * You can find all possible arguements [here](https://peter.sh/experiments/chromium-command-line-switches/).
     */
    chromiumArgs ?: string[],
    /**
     * This is the name of the session. You have to make sure that this is unique for every session.
     */
    sessionId ?: string,
    /**
     * You may set a custom user agent to prevent detection by WhatsApp. However, due to recent developments, this is not really neccessary any more.
     */
    customUserAgent ?: string,
    /**
     * You can enable remote devtools by setting this to trye. If you set this to true there will be security on the devtools url.
     * If you want, you can also pass a username & password.
     */
    devtools ?: boolean | DevTools,
    /**
     * Setting this to true will block any network calls to WhatsApp's crash log servers. This should keep anything you do under the radar.
     */
    blockCrashLogs ?: boolean,
    /**
     * Setting this to false turn off the cache. This may improve memory usage.
     */
    cacheEnabled ?: boolean,
    /**
     * Setting this to true will throw an error if a session is not able to get a QR code or is unable to restart a session.
     */
    throwErrorOnTosBlock ?: boolean,
    /**
     * By default, all instances of sulla are headless (i.e you don't see a chrome window open), you can set this to false to show the chrome/chromium window.
     */
    headless ?: boolean,
    /**
     * Setting this to true will result in new QR codes being generated if the end user takes too long to scan the QR code.
     */
    autoRefresh ?: boolean,
    /**
     * This determines the interval at which to refresh the QR code.
     */
    qrRefreshS ?: number,
    /**
     * This determines how long the process should wait for a QR code to be scanned before killing the process entirely.
     */
    killTimer ?: number,
    /**
     * Some features, like video upload, do not work without a chrome instance. Puppeteer only provides a chromium instance out of the box. Set this to the path of your chrome instance or you can use `useChrome:true` to automatically detect a chrome instance for you.
     */
    executablePath ?: string,
    /**
     * If true, the program will automatically try to detect the instance of chorme on the machine. Please note this overrides executablePath.
     */
    useChrome ?: boolean,
    // @private
    [x: string]: any 
}