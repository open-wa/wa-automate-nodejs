import { Base64 } from "./aliases";

/**
 * The different types of qr code output.
 */
export enum QRFormat{
    PNG = 'png',
    JPEG = 'jpeg',
    WEBM = 'webm'
  }

  /**
   * The available languages for the host security notification
   */
  export enum NotificationLanguage {
      PTBR = 'pt-br',
      ENGB = 'en-gb',
      DEDE = 'de-de',
      IDID = 'id-id',
      ITIT = 'it-it',
      ES = 'es',
  }
  
  /**
   * The set values of quality you can set for the qquality of the qr code output. Ten being the highest quality.
   */
  export enum QRQuality {
    ONE = 0.1,
    TWO = 0.2,
    THREE = 0.3,
    FOUR = 0.4,
    FIVE = 0.5,
    SIX = 0.6,
    SEVEN = 0.7,
    EIGHT = 0.8,
    NINE = 0.9,
    TEN = 1.0,
  }

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
     * The protocol on which the proxy is running. E.g http, https, socks4 or socks5. This is optional and can be automatically determined from the address.
     */
    protocol?: string;
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
     * The authentication object (as a JSON object or a base64 encoded string) that is required to migrate a session from one instance to another or to just restart an existing instance.
     * This sessionData is provided in a generated JSON file (it's a json file but contains the JSON data as a base64 encoded string) upon QR scan or an event.
     * 
     * You can capture the event like so:
     * ```javascript
     * import {create, ev} from '@open-wa/wa-automate';
     * 
     *      ev.on('sessionData.**', async (sessionData, sessionId) =>{
     *          console.log(sessionId, sessionData)
     *      })
     * 
     * //or as base64 encoded string
     * 
     *      ev.on('sessionDataBase64.**', async (sessionDatastring, sessionId) =>{
     *          console.log(sessionId, sessionDatastring)
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
     * where ... is copied from session.data.json this will be a string most likley starting in `ey...` and ending with `==`
     * 
     * Setting the sessionData in the environmental variable will override the sessionData object in the config.
     */
    sessionData ?: SessionData | Base64,
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
     * This flag allows you to disable or enable the use of the puppeteer stealth plugin. It is a good idea to use it, however it can cause issues sometimes. Set this to false if you are experiencing `browser.setMaxListeneres` issue. For now the default for this is false.
     * @default `false`
     */
    useStealth ?: boolean,
    /**
     * The path relative to the current working directory (i.e where you run the command to start your process). This will be used to store and read your `.data.json` files. defualt to ''
     */
    sessionDataPath ?: string,
    /**
     * Disable cors see: https://pptr.dev/#?product=Puppeteer&version=v3.0.4&show=api-pagesetbypasscspenabled If you are having an issue with sending media try to set this to true. Otherwise leave it set to false.
     * @default `false`
     */
    bypassCSP ?: boolean,
    /**
     * This allows you to pass any array of custom chrome/chromium argument strings to the puppeteer instance.
     * You can find all possible arguements [here](https://peter.sh/experiments/chromium-command-line-switches/).
     */
    chromiumArgs ?: string[],
    /**
     * If set to true, skipBrokenMethodsCheck will bypass the health check before startup. It is highly suggested to not set this to true.
     * @default `false`
     */
    skipBrokenMethodsCheck ?: boolean,
    /**
     * If set to true, `skipUpdateCheck` will bypass the latest version check. This saves some time on boot (around 150 ms).
     * @default `false`
     */
    skipUpdateCheck ?: boolean,
    /**
     * This is the name of the session. You have to make sure that this is unique for every session.
     * @default `session`
     */
    sessionId ?: string,
    /**
     * In order to unlock the functionality to send texts to unknown numbers, you need a License key.
     * One License Key is valid for each number. Each License Key starts from £5 per month.
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
     * Setting this to true will block any network calls to crash log servers. This should keep anything you do under the radar. 
     * @default `true`
     */
    blockCrashLogs ?: boolean,
    /**
     * Setting this to false turn off the cache. This may improve memory usage.
     * @default `false`
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
     * @default `true`
     */
    headless ?: boolean,
    /**
     * @deprecated
     * 
     * THIS IS LOCKED TO `true` AND CANNOT BE TURNED OFF. PLEASE SEE [[authTimeout]]
     * 
     * Setting this to true will result in new QR codes being generated if the end user takes too long to scan the QR code.
     * @default `true`
     */
    autoRefresh ?: boolean,
    /**
     * @deprecated
     * 
     * This now has no effect
     * 
     * This determines the interval at which to refresh the QR code. By default, WA updates the qr code every 18-19 seconds so make sure this value is set to UNDER 18 seconds!!
     */
    qrRefreshS ?: number,
    /**
     * This determines how long the process should wait for a QR code to be scanned before killing the process entirely. To have the system wait continuously, set this to `0`.
     * @default 60
     */
    qrTimeout ?: number,
    /**
     * Some features, like video upload, do not work without a chrome instance. Set this to the path of your chrome instance or you can use `useChrome:true` to automatically detect a chrome instance for you. Please note, this overrides `useChrome`.
     */
    executablePath ?: string,
    /**
     * If true, the program will automatically try to detect the instance of chorme on the machine. Please note this DOES NOT override executablePath.
     * @default `false`
     */
    useChrome ?: boolean,
    /**
     * If sent, adds a call to waPage.authenticate with those credentials. Set `corsFix` to true if using a proxy results in CORS errors.
     */
    proxyServerCredentials?: ProxyServerCredentials,
    /**
     * If true, skips logging the QR Code to the console. 
     * @default `false`
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
    restartOnCrash ?: any,
    /**
     * Setting this to true will simplify logs for use within docker containers by disabling spins (will still print raw messages).
     * @default `false`
     */
    disableSpins ?: boolean,
    /**
     * If true, this will log any console messages from the browser.
     * @default `false`
     */
    logConsole ?: boolean
    /**
     * If true, this will log any error messages from the browser instance
     * @default `false`
     */
    logConsoleErrors ?: boolean,
    /**
    * This determines how long the process should wait for the session authentication. If exceeded, checks if phone is out of reach (turned of or without internet connection) and throws an error. It does not relate to the amount of time spent waiting for a qr code scan (see [[qrTimeout]]). To have the system wait continuously, set this to `0`.
    * @default `60`
    */
    authTimeout?: number;
    /**
     * Setting this to `true` will kill the whole process when the client is disconnected from the page or if the browser is closed. 
     * @default `false`
     */
    killProcessOnBrowserClose ?: boolean;
    /**
     * If true, client will check if the page is valid before each command. If page is not valid, it will throw an error.
     * @default `false`
     */
    safeMode ?: boolean;
    /**
     * If true, the process will not save a data.json file. This means that sessions will not be saved and you will need to pass sessionData as a config param or create the session data.json file yourself
     * @default `false`
     */
    skipSessionSave ?: boolean;
    /**
     * If true, the process will open a browser window where you will see basic event logs and QR codes to authenticate the session. Usually it will open on port 3000. It can also be set to a preferred port.
     * 
     * You can also get the QR code png at (if localhost and port 3000):
     * 
     * `http://localhost:3000/qr`
     * 
     * or if you have multiple session:
     * 
     *  `http://localhost:3000/qr?sessionId=[sessionId]`
     * 
     * @default `false | 3000`
     */
    popup ?: boolean | number;
    /**
     * If true, the process will try infer as many config variables as possible from the environment variables. The format of the variables are as below:
     * ```
     * sessionData     ==>     WA_SESSION_DATA
     * sessionDataPath ==>     WA_SESSION_DATA_PATH
     * sessionId       ==>     WA_SESSION_ID
     * customUserAgent ==>     WA_CUSTOM_USER_AGENT
     * blockCrashLogs  ==>     WA_BLOCK_CRASH_LOGS
     * blockAssets     ==>     WA_BLOCK_ASSETS
     * corsFix         ==>     WA_CORS_FIX
     * cacheEnabled    ==>     WA_CACHE_ENABLED
     * headless        ==>     WA_HEADLESS
     * qrTimeout       ==>     WA_QR_TIMEOUT
     * useChrome       ==>     WA_USE_CHROME
     * qrLogSkip       ==>     WA_QR_LOG_SKIP
     * disableSpins    ==>     WA_DISABLE_SPINS
     * logConsole      ==>     WA_LOG_CONSOLE
     * logConsoleErrors==>     WA_LOG_CONSOLE_ERRORS
     * authTimeout     ==>     WA_AUTH_TIMEOUT
     * safeMode        ==>     WA_SAFE_MODE
     * skipSessionSave ==>     WA_SKIP_SESSION_SAVE
     * popup           ==>     WA_POPUP 
     * ```
     * @default `false`
     */
    inDocker ?: boolean;
    /**
     * The output quality of the qr code during authentication. This can be any increment of 0.1 from 0.1 to 1.0.
     * @default `1.0`
     */
    qrQuality ?: QRQuality;
    /**
     * The output format of the qr code. `png`, `jpeg` or `webm`.
     *  
     * @default `png`
     */
    qrFormat ?:  QRFormat;
    /**
     * The language of the host notification. See: https://github.com/open-wa/wa-automate-nodejs/issues/709#issuecomment-673419088
     */
    hostNotificationLang ?: NotificationLanguage;
    /**
     * Setting this to true will block all assets from loading onto the page. This may result in some load time impreovements but also increases instability. 
     * @default `false`
     */
    blockAssets ?: boolean;
    /**
     * [ALPHA FEATURE - ONLY IMPLEMENTED FOR TESTING - DO NOT USE IN PRODUCTION YET]
     * Setting this to true will result in the library making sure it is always starting with the latest version of itself. This overrides `skipUpdateCheck`.
     * @default `false`
     */
    keepUpdated ?: boolean;
    /**
     * Set the desired viewport height and width
     */
    viewport ?: {
        /**
         * Page width in pixels
         * @default `1440`
         */
        width ?: number;
        /**
         * Page height in pixels
         * @default `900`
         */
        height ?: number;
    };
    /**
     * As the library is constantly evolving, some parts will be replaced with more efficient and improved code. In some of the infinite edge cases these new changes may not work for you. Set this to true to roll back on 'late beta' features. The reason why legacy is false by default is that in order for features to be tested they have to be released and used by everyone to find the edge cases and fix them. 
     * @default `false`
     */
    legacy ?: boolean;
    /**
     * Deletes the session data file (if found) on logout event. This results in a quickler login when you restart the process.
     * @default `true`
     */
    deleteSessionDataOnLogout ?: boolean;
    /**
     * If set to true, the system will kill the whole node process when either an [[authTimeout]] or a [[qrTimmeout]] has been reached. This is useful to prevent hanging processes.
     * @default `false`
     */
    killProcessOnTimeout ?: boolean;
    /**
     * Setting this to true will bypass web security. DO NOT DO THIS IF YOU DO NOT HAVE TO. CORS issue may arise when using a proxy.
     * @default `false`
     */
    corsFix ?: boolean
    /**@internal */
    [x: string]: any 
}