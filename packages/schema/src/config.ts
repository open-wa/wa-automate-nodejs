import { z } from 'zod';

export enum QRFormat {
    PNG = 'png',
    JPEG = 'jpeg',
    WEBM = 'webm',
}

export enum CLOUD_PROVIDERS {
    GCP = 'GCP',
    WASABI = 'WASABI',
    AWS = 'AWS',
    CONTABO = 'CONTABO',
    DO = 'DO',
    MINIO = 'MINIO',
}

export enum DIRECTORY_STRATEGY {
    DATE = 'DATE',
    CHAT = 'CHAT',
    CHAT_DATE = 'CHAT_DATE',
    DATE_CHAT = 'DATE_CHAT',
}

export enum NotificationLanguage {
    PTBR = 'pt-br',
    ENGB = 'en-gb',
    DEDE = 'de-de',
    IDID = 'id-id',
    ITIT = 'it-it',
    NLNL = 'nl-nl',
    ES = 'es',
}

export enum OnError {
    AS_STRING = 'AS_STRING',
    RETURN_FALSE = 'RETURN_FALSE',
    THROW = 'THROW',
    LOG_AND_FALSE = 'LOG_AND_FALSE',
    LOG_AND_STRING = 'LOG_AND_STRING',
    RETURN_ERROR = 'RETURN_ERROR',
    NOTHING = 'NOTHING',
}

export enum LicenseType {
    CUSTOM = 'CUSTOM',
    B2B_RESTRICTED_VOLUME_LICENSE = 'B2B_RESTRICTED_VOLUME_LICENSE',
    INSIDER = 'Insiders Program',
    TEXT_STORY = 'Text Story License Key',
    IMAGE_STORY = 'Image Story License Key',
    VIDEO_STORY = 'Video Story License Key',
    PREMIUM = 'Premium License Key',
    NONE = 'NONE',
}

export const SessionDataSchema = z.object({
    WABrowserId: z.string().optional(),
    WASecretBundle: z.string().optional(),
    WAToken1: z.string().optional(),
    WAToken2: z.string().optional(),
}).passthrough();

export const DevToolsSchema = z.object({
    user: z.string().describe('Username for devtools'),
    pass: z.string().describe('Password for devtools'),
});

export const ProxyServerCredentialsSchema = z.object({
    protocol: z.string().optional().describe('The protocol on which the proxy is running. E.g `http`, `https`, `socks4` or `socks5`'),
    address: z.string().describe("Proxy Server address. This can include the port e.g '127.0.0.1:5005'"),
    username: z.string().describe('Username for Proxy Server authentication'),
    password: z.string().describe('Password for Proxy Server authentication'),
});

export const CloudUploadOptionsSchema = z.object({
    provider: z.nativeEnum(CLOUD_PROVIDERS),
    accessKeyId: z.string(),
    secretAccessKey: z.string(),
    bucket: z.string(),
    region: z.string().optional(),
    ignoreHostAccount: z.boolean().optional(),
    directory: z.union([z.nativeEnum(DIRECTORY_STRATEGY), z.string()]).optional(),
    public: z.boolean().optional(),
    headers: z.record(z.string()).optional(),
});

export const ConfigSchema = z.object({
    sessionData: z.union([SessionDataSchema, z.string()]).optional()
        .describe('The authentication object (as a JSON object or a base64 encoded string).'),

    linkCode: z.string().optional()
        .describe('Link code for new login method.'),

    browserWSEndpoint: z.string().optional()
        .describe('Connect to existing chrome window (Experimental).'),

    useStealth: z.boolean().default(false)
        .describe('Enable/disable puppeteer stealth plugin.'),

    sessionDataPath: z.string().default('')
        .describe('Path relative to CWD to store .data.json files.'),

    bypassCSP: z.boolean().default(false)
        .describe('Disable cors (bypass pagesetbypasscspenabled).'),

    chromiumArgs: z.array(z.string()).optional()
        .describe('Custom chrome/chromium argument strings.'),

    skipBrokenMethodsCheck: z.boolean().default(false)
        .describe('Bypass health check before startup.'),

    skipUpdateCheck: z.boolean().default(false)
        .describe('Bypass latest version check.'),

    sessionId: z.string().default('session')
        .describe('Name of the session. Must be unique.'),

    licenseKey: z.union([z.string(), z.record(z.string()), z.function()]).optional()
        .describe('License key for unknown number messaging.'),

    customUserAgent: z.string().optional()
        .describe('Custom user agent.'),

    devtools: z.union([z.boolean(), DevToolsSchema]).optional()
        .describe('Enable remote devtools.'),

    blockCrashLogs: z.boolean().default(true)
        .describe('Block network calls to crash log servers.'),

    cacheEnabled: z.boolean().default(false)
        .describe('Enable/disable cache.'),

    browserRevision: z.string().optional()
        .describe('Specific browser revision to download and use.'),

    throwErrorOnTosBlock: z.boolean().optional()
        .describe('Throw error if session blocked or unable to get QR.'),

    headless: z.boolean().default(true)
        .describe('Run browser in headless mode.'),

    autoRefresh: z.boolean().default(true)
        .describe('Automatically refresh QR codes (Deprecated).'),

    qrRefreshS: z.number().optional()
        .describe('QR refresh interval (Deprecated).'),

    qrTimeout: z.number().default(60)
        .describe('Wait time for QR scan before killing process. 0 to wait forever.'),

    waitForRipeSessionTimeout: z.number().default(5)
        .describe('Wait time for session to load fully. 0 to wait forever.'),

    executablePath: z.string().optional()
        .describe('Path to chrome instance.'),

    useChrome: z.boolean().default(false)
        .describe('Automatically detect chrome instance.'),

    proxyServerCredentials: ProxyServerCredentialsSchema.optional()
        .describe('Proxy server credentials.'),

    qrLogSkip: z.boolean().default(false)
        .describe('Skip logging QR Code to console.'),

    restartOnCrash: z.any().optional()
        .describe('Function to call upon restart if page crashes.'),

    disableSpins: z.boolean().default(false)
        .describe('Disable spins in logs (for docker).'),

    logConsole: z.boolean().default(false)
        .describe('Log console messages from browser.'),

    logConsoleErrors: z.boolean().default(false)
        .describe('Log error messages from browser.'),

    authTimeout: z.number().default(60)
        .describe('Wait time for session authentication.'),

    oorTimeout: z.number().default(60)
        .describe('Phone out of reach check timeout.'),

    killProcessOnBrowserClose: z.boolean().default(false)
        .describe('Kill process when browser closes.'),

    safeMode: z.boolean().default(false)
        .describe('Check if page is valid before each command.'),

    skipSessionSave: z.boolean().default(false)
        .describe('Do not save session data.json file.'),

    popup: z.union([z.boolean(), z.number()]).default(false)
        .describe('Open browser window for status and QR.'),

    qrPopUpOnly: z.boolean().optional()
        .describe('Only serve QR code png via web server.'),

    inDocker: z.boolean().default(false)
        .describe('Try to infer config from environment variables.'),

    qrQuality: z.number().default(1.0)
        .describe('QR code output quality (0.1 - 1.0).'),

    qrFormat: z.nativeEnum(QRFormat).default(QRFormat.PNG)
        .describe('QR code output format.'),

    hostNotificationLang: z.nativeEnum(NotificationLanguage).optional()
        .describe('Language of host notification.'),

    blockAssets: z.boolean().default(false)
        .describe('Block all assets from loading.'),

    keepUpdated: z.boolean().default(false)
        .describe('Always start with latest version (Alpha).'),

    resizable: z.boolean().default(true)
        .describe('Sync viewport size with window size.'),

    viewport: z.object({
        width: z.number().default(1440),
        height: z.number().default(900),
    }).optional(),

    legacy: z.boolean().default(false)
        .describe('Roll back on late beta features.'),

    deleteSessionDataOnLogout: z.boolean().default(false)
        .describe('Delete session data file on logout.'),

    killProcessOnTimeout: z.boolean().default(false)
        .describe('Kill process on auth/qr timeout.'),

    killProcessOnBan: z.boolean().default(true)
        .describe('Kill process when temporary ban detected.'),

    corsFix: z.boolean().default(false)
        .describe('Bypass web security to fix CORS issues.'),

    callTimeout: z.number().default(0)
        .describe('Wait time for client method resolution.'),

    screenshotOnInitializationBrowserError: z.boolean().default(false)
        .describe('Screenshot on unexpected initialization error.'),

    eventMode: z.boolean().default(true)
        .describe('Automatically register SimpleListener events.'),

    logFile: z.boolean().default(false)
        .describe('Create log file for all actions.'),

    idCorrection: z.boolean().default(false)
        .describe('Attempt to correct invalid chatIds.'),

    stickerServerEndpoint: z.union([z.string(), z.boolean()]).default('https://sticker-api.openwa.dev')
        .describe('Sticker server endpoint.'),

    ghPatch: z.boolean().default(false)
        .describe('Use default cached raw github link for patches.'),

    cachedPatch: z.boolean().default(false)
        .describe('Save local copy of patches.json.'),

    logDebugInfoAsObject: z.boolean().default(false)
        .describe('Log debug info as object instead of console.table.'),

    logInternalEvents: z.boolean().optional()
        .describe('Log all internal wa web events.'),

    logLevel: z.string().optional()
        .describe('Logging level (VERBOSE, INFO, ERROR, SILENT).'),

    killClientOnLogout: z.boolean().default(false)
        .describe('Kill client when logout detected.'),

    throwOnExpiredSessionData: z.boolean().default(false)
        .describe('Return false if session data expired.'),

    useNativeProxy: z.boolean().default(false)
        .describe('Use native proxy system.'),

    raspi: z.boolean().default(false)
        .describe('Enable Raspberry Pi OS support.'),

    pQueueDefault: z.any().optional()
        .describe('Default pqueue options.'),

    messagePreprocessor: z.any().optional()
        .describe('Message preprocessor options.'),

    preprocFilter: z.string().optional()
        .describe('Filter for message preprocessor.'),

    cloudUploadOptions: CloudUploadOptionsSchema.optional()
        .describe('Options for cloud upload preprocessor.'),

    onError: z.nativeEnum(OnError).default(OnError.NOTHING)
        .describe('Error handling strategy.'),

    multiDevice: z.boolean().default(true)
        .describe('Enable multi-device support (Beta).'),

    sessionDataBucketAuth: z.string().optional()
        .describe('Base64 encoded S3 Bucket & Authentication object.'),

    autoEmoji: z.union([z.string(), z.literal(false)]).default(':')
        .describe('Automatic emoji detection character.'),

    maxChats: z.number().optional()
        .describe('Maximum amount of chats to be present in a session.'),

    // v5 Specific
    socketMode: z.boolean().default(true)
        .describe('Enable socket.io server.'),

    apiLifecycle: z.enum(['immediate', 'post-connection', 'hybrid']).default('hybrid')
        .describe('When to start the API: immediate, after connection, or hybrid (QR only first).'),

    // Server Configuration
    apiKey: z.string().optional()
        .describe('API key for authentication (minimum 8 characters).'),

    port: z.number().int().min(1).max(65535).default(8080)
        .describe('Port for the API server.'),

    host: z.string().default('localhost')
        .describe('Host address to bind.'),

    cors: z.union([z.string(), z.array(z.string())]).default('*')
        .describe('CORS allowed origins.'),

    webhook: z.string().url().optional()
        .describe('Webhook URL for events.'),

    ezqr: z.boolean().default(true)
        .describe('Enable easy QR code endpoint.'),

    // ElasticSearch Monitoring
    elasticUrl: z.string().url().optional().describe('ElasticSearch URL.'),
    elasticUsername: z.string().optional().describe('ElasticSearch username.'),
    elasticPassword: z.string().optional().describe('ElasticSearch password.'),
    elasticBufferSize: z.number().default(50).describe('ElasticSearch buffer size.'),
    elasticPipeline: z.string().optional().describe('ElasticSearch ingest pipeline.'),
    elasticIndexPrefix: z.string().default('open-wa-').describe('ElasticSearch index prefix.'),

    // Session Sync (S3)
    s3Sync: z.object({
        bucket: z.string(),
        region: z.string(),
        accessKeyId: z.string(),
        secretAccessKey: z.string(),
        endpoint: z.string().optional(),
        host: z.string().optional(), // PicoS3 support
        syncInterval: z.number().default(600000).describe('Sync interval in ms')
    }).optional().describe('S3 Session Synchronization configuration'),
});

export type Config = z.infer<typeof ConfigSchema>;
