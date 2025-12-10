"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigSchema = exports.CloudUploadOptionsSchema = exports.ProxyServerCredentialsSchema = exports.DevToolsSchema = exports.SessionDataSchema = exports.LicenseType = exports.OnError = exports.NotificationLanguage = exports.DIRECTORY_STRATEGY = exports.CLOUD_PROVIDERS = exports.QRFormat = void 0;
const zod_1 = require("zod");
var QRFormat;
(function (QRFormat) {
    QRFormat["PNG"] = "png";
    QRFormat["JPEG"] = "jpeg";
    QRFormat["WEBM"] = "webm";
})(QRFormat || (exports.QRFormat = QRFormat = {}));
var CLOUD_PROVIDERS;
(function (CLOUD_PROVIDERS) {
    CLOUD_PROVIDERS["GCP"] = "GCP";
    CLOUD_PROVIDERS["WASABI"] = "WASABI";
    CLOUD_PROVIDERS["AWS"] = "AWS";
    CLOUD_PROVIDERS["CONTABO"] = "CONTABO";
    CLOUD_PROVIDERS["DO"] = "DO";
    CLOUD_PROVIDERS["MINIO"] = "MINIO";
})(CLOUD_PROVIDERS || (exports.CLOUD_PROVIDERS = CLOUD_PROVIDERS = {}));
var DIRECTORY_STRATEGY;
(function (DIRECTORY_STRATEGY) {
    DIRECTORY_STRATEGY["DATE"] = "DATE";
    DIRECTORY_STRATEGY["CHAT"] = "CHAT";
    DIRECTORY_STRATEGY["CHAT_DATE"] = "CHAT_DATE";
    DIRECTORY_STRATEGY["DATE_CHAT"] = "DATE_CHAT";
})(DIRECTORY_STRATEGY || (exports.DIRECTORY_STRATEGY = DIRECTORY_STRATEGY = {}));
var NotificationLanguage;
(function (NotificationLanguage) {
    NotificationLanguage["PTBR"] = "pt-br";
    NotificationLanguage["ENGB"] = "en-gb";
    NotificationLanguage["DEDE"] = "de-de";
    NotificationLanguage["IDID"] = "id-id";
    NotificationLanguage["ITIT"] = "it-it";
    NotificationLanguage["NLNL"] = "nl-nl";
    NotificationLanguage["ES"] = "es";
})(NotificationLanguage || (exports.NotificationLanguage = NotificationLanguage = {}));
var OnError;
(function (OnError) {
    OnError["AS_STRING"] = "AS_STRING";
    OnError["RETURN_FALSE"] = "RETURN_FALSE";
    OnError["THROW"] = "THROW";
    OnError["LOG_AND_FALSE"] = "LOG_AND_FALSE";
    OnError["LOG_AND_STRING"] = "LOG_AND_STRING";
    OnError["RETURN_ERROR"] = "RETURN_ERROR";
    OnError["NOTHING"] = "NOTHING";
})(OnError || (exports.OnError = OnError = {}));
var LicenseType;
(function (LicenseType) {
    LicenseType["CUSTOM"] = "CUSTOM";
    LicenseType["B2B_RESTRICTED_VOLUME_LICENSE"] = "B2B_RESTRICTED_VOLUME_LICENSE";
    LicenseType["INSIDER"] = "Insiders Program";
    LicenseType["TEXT_STORY"] = "Text Story License Key";
    LicenseType["IMAGE_STORY"] = "Image Story License Key";
    LicenseType["VIDEO_STORY"] = "Video Story License Key";
    LicenseType["PREMIUM"] = "Premium License Key";
    LicenseType["NONE"] = "NONE";
})(LicenseType || (exports.LicenseType = LicenseType = {}));
exports.SessionDataSchema = zod_1.z.object({
    WABrowserId: zod_1.z.string().optional(),
    WASecretBundle: zod_1.z.string().optional(),
    WAToken1: zod_1.z.string().optional(),
    WAToken2: zod_1.z.string().optional(),
}).passthrough();
exports.DevToolsSchema = zod_1.z.object({
    user: zod_1.z.string().describe('Username for devtools'),
    pass: zod_1.z.string().describe('Password for devtools'),
});
exports.ProxyServerCredentialsSchema = zod_1.z.object({
    protocol: zod_1.z.string().optional().describe('The protocol on which the proxy is running. E.g `http`, `https`, `socks4` or `socks5`'),
    address: zod_1.z.string().describe("Proxy Server address. This can include the port e.g '127.0.0.1:5005'"),
    username: zod_1.z.string().describe('Username for Proxy Server authentication'),
    password: zod_1.z.string().describe('Password for Proxy Server authentication'),
});
exports.CloudUploadOptionsSchema = zod_1.z.object({
    provider: zod_1.z.nativeEnum(CLOUD_PROVIDERS),
    accessKeyId: zod_1.z.string(),
    secretAccessKey: zod_1.z.string(),
    bucket: zod_1.z.string(),
    region: zod_1.z.string().optional(),
    ignoreHostAccount: zod_1.z.boolean().optional(),
    directory: zod_1.z.union([zod_1.z.nativeEnum(DIRECTORY_STRATEGY), zod_1.z.string()]).optional(),
    public: zod_1.z.boolean().optional(),
    headers: zod_1.z.record(zod_1.z.string()).optional(),
});
exports.ConfigSchema = zod_1.z.object({
    sessionData: zod_1.z.union([exports.SessionDataSchema, zod_1.z.string()]).optional()
        .describe('The authentication object (as a JSON object or a base64 encoded string).'),
    linkCode: zod_1.z.string().optional()
        .describe('Link code for new login method.'),
    browserWSEndpoint: zod_1.z.string().optional()
        .describe('Connect to existing chrome window (Experimental).'),
    useStealth: zod_1.z.boolean().default(false)
        .describe('Enable/disable puppeteer stealth plugin.'),
    sessionDataPath: zod_1.z.string().default('')
        .describe('Path relative to CWD to store .data.json files.'),
    bypassCSP: zod_1.z.boolean().default(false)
        .describe('Disable cors (bypass pagesetbypasscspenabled).'),
    chromiumArgs: zod_1.z.array(zod_1.z.string()).optional()
        .describe('Custom chrome/chromium argument strings.'),
    skipBrokenMethodsCheck: zod_1.z.boolean().default(false)
        .describe('Bypass health check before startup.'),
    skipUpdateCheck: zod_1.z.boolean().default(false)
        .describe('Bypass latest version check.'),
    sessionId: zod_1.z.string().default('session')
        .describe('Name of the session. Must be unique.'),
    licenseKey: zod_1.z.union([zod_1.z.string(), zod_1.z.record(zod_1.z.string()), zod_1.z.function()]).optional()
        .describe('License key for unknown number messaging.'),
    customUserAgent: zod_1.z.string().optional()
        .describe('Custom user agent.'),
    devtools: zod_1.z.union([zod_1.z.boolean(), exports.DevToolsSchema]).optional()
        .describe('Enable remote devtools.'),
    blockCrashLogs: zod_1.z.boolean().default(true)
        .describe('Block network calls to crash log servers.'),
    cacheEnabled: zod_1.z.boolean().default(false)
        .describe('Enable/disable cache.'),
    browserRevision: zod_1.z.string().optional()
        .describe('Specific browser revision to download and use.'),
    throwErrorOnTosBlock: zod_1.z.boolean().optional()
        .describe('Throw error if session blocked or unable to get QR.'),
    headless: zod_1.z.boolean().default(true)
        .describe('Run browser in headless mode.'),
    autoRefresh: zod_1.z.boolean().default(true)
        .describe('Automatically refresh QR codes (Deprecated).'),
    qrRefreshS: zod_1.z.number().optional()
        .describe('QR refresh interval (Deprecated).'),
    qrTimeout: zod_1.z.number().default(60)
        .describe('Wait time for QR scan before killing process. 0 to wait forever.'),
    waitForRipeSessionTimeout: zod_1.z.number().default(5)
        .describe('Wait time for session to load fully. 0 to wait forever.'),
    executablePath: zod_1.z.string().optional()
        .describe('Path to chrome instance.'),
    useChrome: zod_1.z.boolean().default(false)
        .describe('Automatically detect chrome instance.'),
    proxyServerCredentials: exports.ProxyServerCredentialsSchema.optional()
        .describe('Proxy server credentials.'),
    qrLogSkip: zod_1.z.boolean().default(false)
        .describe('Skip logging QR Code to console.'),
    restartOnCrash: zod_1.z.any().optional()
        .describe('Function to call upon restart if page crashes.'),
    disableSpins: zod_1.z.boolean().default(false)
        .describe('Disable spins in logs (for docker).'),
    logConsole: zod_1.z.boolean().default(false)
        .describe('Log console messages from browser.'),
    logConsoleErrors: zod_1.z.boolean().default(false)
        .describe('Log error messages from browser.'),
    authTimeout: zod_1.z.number().default(60)
        .describe('Wait time for session authentication.'),
    oorTimeout: zod_1.z.number().default(60)
        .describe('Phone out of reach check timeout.'),
    killProcessOnBrowserClose: zod_1.z.boolean().default(false)
        .describe('Kill process when browser closes.'),
    safeMode: zod_1.z.boolean().default(false)
        .describe('Check if page is valid before each command.'),
    skipSessionSave: zod_1.z.boolean().default(false)
        .describe('Do not save session data.json file.'),
    popup: zod_1.z.union([zod_1.z.boolean(), zod_1.z.number()]).default(false)
        .describe('Open browser window for status and QR.'),
    qrPopUpOnly: zod_1.z.boolean().optional()
        .describe('Only serve QR code png via web server.'),
    inDocker: zod_1.z.boolean().default(false)
        .describe('Try to infer config from environment variables.'),
    qrQuality: zod_1.z.number().default(1.0)
        .describe('QR code output quality (0.1 - 1.0).'),
    qrFormat: zod_1.z.nativeEnum(QRFormat).default(QRFormat.PNG)
        .describe('QR code output format.'),
    hostNotificationLang: zod_1.z.nativeEnum(NotificationLanguage).optional()
        .describe('Language of host notification.'),
    blockAssets: zod_1.z.boolean().default(false)
        .describe('Block all assets from loading.'),
    keepUpdated: zod_1.z.boolean().default(false)
        .describe('Always start with latest version (Alpha).'),
    resizable: zod_1.z.boolean().default(true)
        .describe('Sync viewport size with window size.'),
    viewport: zod_1.z.object({
        width: zod_1.z.number().default(1440),
        height: zod_1.z.number().default(900),
    }).optional(),
    legacy: zod_1.z.boolean().default(false)
        .describe('Roll back on late beta features.'),
    deleteSessionDataOnLogout: zod_1.z.boolean().default(false)
        .describe('Delete session data file on logout.'),
    killProcessOnTimeout: zod_1.z.boolean().default(false)
        .describe('Kill process on auth/qr timeout.'),
    killProcessOnBan: zod_1.z.boolean().default(true)
        .describe('Kill process when temporary ban detected.'),
    corsFix: zod_1.z.boolean().default(false)
        .describe('Bypass web security to fix CORS issues.'),
    callTimeout: zod_1.z.number().default(0)
        .describe('Wait time for client method resolution.'),
    screenshotOnInitializationBrowserError: zod_1.z.boolean().default(false)
        .describe('Screenshot on unexpected initialization error.'),
    eventMode: zod_1.z.boolean().default(true)
        .describe('Automatically register SimpleListener events.'),
    logFile: zod_1.z.boolean().default(false)
        .describe('Create log file for all actions.'),
    idCorrection: zod_1.z.boolean().default(false)
        .describe('Attempt to correct invalid chatIds.'),
    stickerServerEndpoint: zod_1.z.union([zod_1.z.string(), zod_1.z.boolean()]).default('https://sticker-api.openwa.dev')
        .describe('Sticker server endpoint.'),
    ghPatch: zod_1.z.boolean().default(false)
        .describe('Use default cached raw github link for patches.'),
    cachedPatch: zod_1.z.boolean().default(false)
        .describe('Save local copy of patches.json.'),
    logDebugInfoAsObject: zod_1.z.boolean().default(false)
        .describe('Log debug info as object instead of console.table.'),
    logInternalEvents: zod_1.z.boolean().optional()
        .describe('Log all internal wa web events.'),
    killClientOnLogout: zod_1.z.boolean().default(false)
        .describe('Kill client when logout detected.'),
    throwOnExpiredSessionData: zod_1.z.boolean().default(false)
        .describe('Return false if session data expired.'),
    useNativeProxy: zod_1.z.boolean().default(false)
        .describe('Use native proxy system.'),
    raspi: zod_1.z.boolean().default(false)
        .describe('Enable Raspberry Pi OS support.'),
    pQueueDefault: zod_1.z.any().optional()
        .describe('Default pqueue options.'),
    messagePreprocessor: zod_1.z.any().optional()
        .describe('Message preprocessor options.'),
    preprocFilter: zod_1.z.string().optional()
        .describe('Filter for message preprocessor.'),
    cloudUploadOptions: exports.CloudUploadOptionsSchema.optional()
        .describe('Options for cloud upload preprocessor.'),
    onError: zod_1.z.nativeEnum(OnError).default(OnError.NOTHING)
        .describe('Error handling strategy.'),
    multiDevice: zod_1.z.boolean().default(true)
        .describe('Enable multi-device support (Beta).'),
    sessionDataBucketAuth: zod_1.z.string().optional()
        .describe('Base64 encoded S3 Bucket & Authentication object.'),
    autoEmoji: zod_1.z.union([zod_1.z.string(), zod_1.z.literal(false)]).default(':')
        .describe('Automatic emoji detection character.'),
    maxChats: zod_1.z.number().optional()
        .describe('Maximum amount of chats to be present in a session.'),
    socketMode: zod_1.z.boolean().default(true)
        .describe('Enable socket.io server.'),
    apiLifecycle: zod_1.z.enum(['immediate', 'post-connection', 'hybrid']).default('hybrid')
        .describe('When to start the API: immediate, after connection, or hybrid (QR only first).'),
    apiKey: zod_1.z.string().optional()
        .describe('API key for authentication (minimum 8 characters).'),
    port: zod_1.z.number().int().min(1).max(65535).default(8080)
        .describe('Port for the API server.'),
    host: zod_1.z.string().default('localhost')
        .describe('Host address to bind.'),
    cors: zod_1.z.union([zod_1.z.string(), zod_1.z.array(zod_1.z.string())]).default('*')
        .describe('CORS allowed origins.'),
    webhook: zod_1.z.string().url().optional()
        .describe('Webhook URL for events.'),
    ezqr: zod_1.z.boolean().default(true)
        .describe('Enable easy QR code endpoint.'),
    elasticUrl: zod_1.z.string().url().optional().describe('ElasticSearch URL.'),
    elasticUsername: zod_1.z.string().optional().describe('ElasticSearch username.'),
    elasticPassword: zod_1.z.string().optional().describe('ElasticSearch password.'),
    elasticBufferSize: zod_1.z.number().default(50).describe('ElasticSearch buffer size.'),
    elasticPipeline: zod_1.z.string().optional().describe('ElasticSearch ingest pipeline.'),
    elasticIndexPrefix: zod_1.z.string().default('open-wa-').describe('ElasticSearch index prefix.'),
    s3Sync: zod_1.z.object({
        bucket: zod_1.z.string(),
        region: zod_1.z.string(),
        accessKeyId: zod_1.z.string(),
        secretAccessKey: zod_1.z.string(),
        endpoint: zod_1.z.string().optional(),
        host: zod_1.z.string().optional(),
        syncInterval: zod_1.z.number().default(600000).describe('Sync interval in ms')
    }).optional().describe('S3 Session Synchronization configuration'),
});
//# sourceMappingURL=config.js.map