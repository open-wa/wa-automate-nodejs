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
    WABrowserId ?: string,
    WASecretBundle ?: string,
    WAToken1 ?: string,
    WAToken2 ?: string,
}

export interface DevTools {
    /**
     * Username for devtools
     */
    user : string,
    /**
     * Password for devtools
     */
    pass : string
}

export interface ProxyServerCredentials {
    /**
    * Proxy Server address. This can include the port e.g '127.0.0.1:5005'
    */
    address: string,
    /**
    * Username for Proxy Server authentication
    */
    username : string,
    /**
    * Password for Proxy Server authentication
    */
    password : string,        
}
    
export interface ConfigObject {
    /**
     * JSON object that is required to migrate a session from one instance to another or ot just restart an existing instance.
     * This sessionData is provided in a generated JSON file upon QR scan or an event.
     * You can capture the event like so:
     * ```javascript
     * import {create, ev} from '@open-wa/wa-automate';
     * ev.on('sessionData.**', async (sessionData, sessionId) =>{
     *          console.log(sessionId, sessionData)
     *      })
     * ```
     *  NOTE: You can set sessionData as an evironmental variable also! The variable name has to be [sessionId (default = 'session) in all caps]_DATA_JSON. You have to make sure to surround your session data with single quotes to maintain the formatting.
     * 
     * For example:
     * 
     * sessionId = 'session'
     * 
     * To set env var:
     * ```bash
     *    export SESSION_DATA_JSON=`...`
     * ```
     * where ... is copied from session.data.json
     * Again - YOU NEED THE ' as it maintains the formatting from the json file. Otherwise it will not work.
     * Setting the sessionData in the environmental variable will override the sessionData object in the config.
     */
    sessionData ?: SessionData,
    /**
     * ALPHA EXPERIMENTAL FEATURE! DO NOT USE IN PRODUCTION, REQUIRES TESTING.
     * 
     * Learn more:
     * 
     * https://pptr.dev/#?product=Puppeteer&version=v3.1.0&show=api-puppeteerconnectoptions
     * 
     * https://medium.com/@jaredpotter1/connecting-puppeteer-to-existing-chrome-window-8a10828149e0
     */
    browserWSEndpoint ?: string,
    /**
     * The path relative to the current working directory (i.e where you run the command to start your process). This will be used to store and read your `.data.json` files. defualt to ''
     */
    sessionDataPath ?: string,
    /**
     * Disable cors see: https://pptr.dev/#?product=Puppeteer&version=v3.0.4&show=api-pagesetbypasscspenabled If you are having an issue with sending media try to set this to true. Otherwise leave it set to falsedefualt to false
     */
    bypassCSP ?: boolean,
    /**
     * This allows you to pass any array of custom chrome/chromium argument strings to the puppeteer instance.
     * You can find all possible arguements [here](https://peter.sh/experiments/chromium-command-line-switches/).
     */
    chromiumArgs ?: string[],
    /**
     * If set to true, skipBrokenMethodsCheck will bypass the health check before startup. It is highly suggested to not set this to true.
     * Default: false
     */
    skipBrokenMethodsCheck ?: boolean,
    /**
     * This is the name of the session. You have to make sure that this is unique for every session.
     */
    sessionId ?: string,
    /**
     * In order to unlock the functionality to send texts to unknown numbers, you need an License key.
     * One License Key is valid for each number. Each License Key is £10 per month or £100 per year.
     * 
     * Please check README for instructions on how to get a license key.
     * 
     * Notes:
     * 1. You can change the number assigned to that License Key at any time, just message me the new number on the private discord channel.
     * 2. In order to cancel your License Key, simply stop your membership.
     */
    licenseKey ?: string | string[],
    /**
     * You may set a custom user agent. However, due to recent developments, this is not really neccessary any more.
     */
    customUserAgent ?: string,
    /**
     * You can enable remote devtools by setting this to trye. If you set this to true there will be security on the devtools url.
     * If you want, you can also pass a username & password.
     */
    devtools ?: boolean | DevTools,
    /**
     * Setting this to true will block any network calls to crash log servers. This should keep anything you do under the radar. default is true
     */
    blockCrashLogs ?: boolean,
    /**
     * Setting this to false turn off the cache. This may improve memory usage.
     */
    cacheEnabled ?: boolean,
    /**
     * This is the specific browser revision to be downlaoded and used. You can find browser revision strings here: http://omahaproxy.appspot.com/
     * Learn more about it here: https://github.com/puppeteer/puppeteer/blob/master/docs/api.md#class-browserfetcher
     * If you're having trouble with sending images, try '737027'.
     * If you go too far back things will start breaking !!!!!!
     * NOTE: THIS WILL OVERRIDE useChrome and executablePath. ONLY USE THIS IF YOU KNOW WHAT YOU ARE DOING.
     */
    browserRevision ?: string,
    /**
     * Setting this to true will throw an error if a session is not able to get a QR code or is unable to restart a session.
     */
    throwErrorOnTosBlock ?: boolean,
    /**
     * By default, all instances of @open-wa/wa-automate are headless (i.e you don't see a chrome window open), you can set this to false to show the chrome/chromium window.
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
    qrTimeout ?: number,
    /**
     * Some features, like video upload, do not work without a chrome instance. Puppeteer only provides a chromium instance out of the box. Set this to the path of your chrome instance or you can use `useChrome:true` to automatically detect a chrome instance for you.
     */
    executablePath ?: string,
    /**
     * If true, the program will automatically try to detect the instance of chorme on the machine. Please note this overrides executablePath.
     */
    useChrome ?: boolean,
    /**
     * If sent, adds a call to waPage.authenticate with those credentials.
     */
    proxyServerCredentials?: ProxyServerCredentials,
    /**
     * If true, skips logging the QR Code to the console. Default is false.
     */
    qrLogSkip?: boolean;
    /**
     * If set, the program will try to recreate itself when the page crashes. You have to pass the function that you want called upon restart. Please note that when the page crashes you may miss some messages.
     * E.g:
     * ```javascript
     * const start  = async (client: Client) => {...}
     * create({
     * ...
     * restartOnCrash: start,
     * ...
     * })
     * ```
     */
    restartOnCrash ?: (value: Client) => any | Function,
    /**
     * default: false
     * Setting this to true will simplify logs for use within docker containers by disabling spins (will still print raw messages).
     */
    disableSpins ?: boolean,
    /**
     * default: false
     * If true, this will log any console messages from the browser.
     */
    logConsole ?: boolean
    /**
     * default: false
     * If true, this will log any error messages from the browser instance
     */
    logConsoleErrors ?: boolean,
    /**
    *This determines how long the process should wait for the session authentication. If exceeded, checks if phone is out of reach (turned of or without internet connection) and throws an error.
    */
    authTimeout?: number;
    // @private
    [x: string]: any 
}