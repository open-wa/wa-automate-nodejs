
/**
 * The different types of qr code output.
 */
export enum QRFormat{
    PNG = 'png',
    JPEG = 'jpeg',
    WEBM = 'webm'
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
     * This flag allows you to disable or enable the use of the puppeteer stealth plugin. It is a good idea to use it, however it can cause issues sometimes. Set this to false if you are experiencing `browser.setMaxListeneres` issue. For now the default for this is false.
     */
    useStealth ?: boolean,
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
    restartOnCrash ?: any,
    /**
     * Setting this to true will simplify logs for use within docker containers by disabling spins (will still print raw messages).
     */
    disableSpins ?: boolean,
    /**
     * If true, this will log any console messages from the browser.
     */
    logConsole ?: boolean
    /**
     * If true, this will log any error messages from the browser instance
     */
    logConsoleErrors ?: boolean,
    /**
    *This determines how long the process should wait for the session authentication. If exceeded, checks if phone is out of reach (turned of or without internet connection) and throws an error.
    */
    authTimeout?: number;
    /**
     * Setting this to `true` will kill the whole process when the client is disconnected from the page or if the browser is closed. defaults to `true`
     */
    killProcessOnBrowserClose ?: boolean;
    /**
     * If true, client will check if the page is valid before each command. If page is not valid, it will throw an error.
     */
    safeMode ?: boolean;
    /**
     * If true, the process will not save a data.json file. This means that sessions will not be saved and you will need to pass sessionData as a config param or create the session data.json file yourself
     */
    skipSessionSave ?: boolean;
    /**
     * If true, the process will open a browser window where you will see basic event logs and QR codes to authenticate the session. Usually it will open on port 3000. It can also be set to a preferred port.
     */
    popup ?: boolean | number;
    /**
     * If true, the process will try infer as many config variables as possible from the environment variables. The format of the variables are as below:
     * ```
     * sessionDataPath ==>     WA_SESSION_DATA_PATH
     * sessionId       ==>     WA_SESSION_ID
     * customUserAgent ==>     WA_CUSTOM_USER_AGENT
     * blockCrashLogs  ==>     WA_BLOCK_CRASH_LOGS
     * cacheEnabled    ==>     WA_CACHE_ENABLED
     * headless        ==>     WA_HEADLESS
     * autoRefresh     ==>     WA_AUTO_REFRESH
     * qrRefreshS      ==>     WA_QR_REFRESH_S
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
     */
    inDocker ?: boolean;
    /**
     * The output quality of the qr code during authentication. This can be any increment of 0.1 from 0.1 to 1.0. defaults to 1.0
     */
    qrQuality ?: QRQuality;
    /**
     * The output format of the qr code. `png`, `jpeg` or `webm`. Defaults to `png`
     */
    qrFormat ?:  QRFormat
    // @private
    [x: string]: any 
}