import { z } from 'zod';
export declare enum QRFormat {
    PNG = "png",
    JPEG = "jpeg",
    WEBM = "webm"
}
export declare enum CLOUD_PROVIDERS {
    GCP = "GCP",
    WASABI = "WASABI",
    AWS = "AWS",
    CONTABO = "CONTABO",
    DO = "DO",
    MINIO = "MINIO"
}
export declare enum DIRECTORY_STRATEGY {
    DATE = "DATE",
    CHAT = "CHAT",
    CHAT_DATE = "CHAT_DATE",
    DATE_CHAT = "DATE_CHAT"
}
export declare enum NotificationLanguage {
    PTBR = "pt-br",
    ENGB = "en-gb",
    DEDE = "de-de",
    IDID = "id-id",
    ITIT = "it-it",
    NLNL = "nl-nl",
    ES = "es"
}
export declare enum OnError {
    AS_STRING = "AS_STRING",
    RETURN_FALSE = "RETURN_FALSE",
    THROW = "THROW",
    LOG_AND_FALSE = "LOG_AND_FALSE",
    LOG_AND_STRING = "LOG_AND_STRING",
    RETURN_ERROR = "RETURN_ERROR",
    NOTHING = "NOTHING"
}
export declare enum LicenseType {
    CUSTOM = "CUSTOM",
    B2B_RESTRICTED_VOLUME_LICENSE = "B2B_RESTRICTED_VOLUME_LICENSE",
    INSIDER = "Insiders Program",
    TEXT_STORY = "Text Story License Key",
    IMAGE_STORY = "Image Story License Key",
    VIDEO_STORY = "Video Story License Key",
    PREMIUM = "Premium License Key",
    NONE = "NONE"
}
export declare const SessionDataSchema: z.ZodObject<{
    WABrowserId: z.ZodOptional<z.ZodString>;
    WASecretBundle: z.ZodOptional<z.ZodString>;
    WAToken1: z.ZodOptional<z.ZodString>;
    WAToken2: z.ZodOptional<z.ZodString>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    WABrowserId: z.ZodOptional<z.ZodString>;
    WASecretBundle: z.ZodOptional<z.ZodString>;
    WAToken1: z.ZodOptional<z.ZodString>;
    WAToken2: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    WABrowserId: z.ZodOptional<z.ZodString>;
    WASecretBundle: z.ZodOptional<z.ZodString>;
    WAToken1: z.ZodOptional<z.ZodString>;
    WAToken2: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">>;
export declare const DevToolsSchema: z.ZodObject<{
    user: z.ZodString;
    pass: z.ZodString;
}, "strip", z.ZodTypeAny, {
    user?: string;
    pass?: string;
}, {
    user?: string;
    pass?: string;
}>;
export declare const ProxyServerCredentialsSchema: z.ZodObject<{
    protocol: z.ZodOptional<z.ZodString>;
    address: z.ZodString;
    username: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    password?: string;
    protocol?: string;
    address?: string;
    username?: string;
}, {
    password?: string;
    protocol?: string;
    address?: string;
    username?: string;
}>;
export declare const CloudUploadOptionsSchema: z.ZodObject<{
    provider: z.ZodNativeEnum<typeof CLOUD_PROVIDERS>;
    accessKeyId: z.ZodString;
    secretAccessKey: z.ZodString;
    bucket: z.ZodString;
    region: z.ZodOptional<z.ZodString>;
    ignoreHostAccount: z.ZodOptional<z.ZodBoolean>;
    directory: z.ZodOptional<z.ZodUnion<[z.ZodNativeEnum<typeof DIRECTORY_STRATEGY>, z.ZodString]>>;
    public: z.ZodOptional<z.ZodBoolean>;
    headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    provider?: CLOUD_PROVIDERS;
    accessKeyId?: string;
    secretAccessKey?: string;
    bucket?: string;
    region?: string;
    ignoreHostAccount?: boolean;
    directory?: string;
    public?: boolean;
    headers?: Record<string, string>;
}, {
    provider?: CLOUD_PROVIDERS;
    accessKeyId?: string;
    secretAccessKey?: string;
    bucket?: string;
    region?: string;
    ignoreHostAccount?: boolean;
    directory?: string;
    public?: boolean;
    headers?: Record<string, string>;
}>;
export declare const ConfigSchema: z.ZodObject<{
    sessionData: z.ZodOptional<z.ZodUnion<[z.ZodObject<{
        WABrowserId: z.ZodOptional<z.ZodString>;
        WASecretBundle: z.ZodOptional<z.ZodString>;
        WAToken1: z.ZodOptional<z.ZodString>;
        WAToken2: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        WABrowserId: z.ZodOptional<z.ZodString>;
        WASecretBundle: z.ZodOptional<z.ZodString>;
        WAToken1: z.ZodOptional<z.ZodString>;
        WAToken2: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        WABrowserId: z.ZodOptional<z.ZodString>;
        WASecretBundle: z.ZodOptional<z.ZodString>;
        WAToken1: z.ZodOptional<z.ZodString>;
        WAToken2: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>, z.ZodString]>>;
    linkCode: z.ZodOptional<z.ZodString>;
    browserWSEndpoint: z.ZodOptional<z.ZodString>;
    useStealth: z.ZodDefault<z.ZodBoolean>;
    sessionDataPath: z.ZodDefault<z.ZodString>;
    bypassCSP: z.ZodDefault<z.ZodBoolean>;
    chromiumArgs: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    skipBrokenMethodsCheck: z.ZodDefault<z.ZodBoolean>;
    skipUpdateCheck: z.ZodDefault<z.ZodBoolean>;
    sessionId: z.ZodDefault<z.ZodString>;
    licenseKey: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodString>, z.ZodFunction<z.ZodTuple<[], z.ZodUnknown>, z.ZodUnknown>]>>;
    customUserAgent: z.ZodOptional<z.ZodString>;
    devtools: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodObject<{
        user: z.ZodString;
        pass: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        user?: string;
        pass?: string;
    }, {
        user?: string;
        pass?: string;
    }>]>>;
    blockCrashLogs: z.ZodDefault<z.ZodBoolean>;
    cacheEnabled: z.ZodDefault<z.ZodBoolean>;
    browserRevision: z.ZodOptional<z.ZodString>;
    throwErrorOnTosBlock: z.ZodOptional<z.ZodBoolean>;
    headless: z.ZodDefault<z.ZodBoolean>;
    autoRefresh: z.ZodDefault<z.ZodBoolean>;
    qrRefreshS: z.ZodOptional<z.ZodNumber>;
    qrTimeout: z.ZodDefault<z.ZodNumber>;
    waitForRipeSessionTimeout: z.ZodDefault<z.ZodNumber>;
    executablePath: z.ZodOptional<z.ZodString>;
    useChrome: z.ZodDefault<z.ZodBoolean>;
    proxyServerCredentials: z.ZodOptional<z.ZodObject<{
        protocol: z.ZodOptional<z.ZodString>;
        address: z.ZodString;
        username: z.ZodString;
        password: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        password?: string;
        protocol?: string;
        address?: string;
        username?: string;
    }, {
        password?: string;
        protocol?: string;
        address?: string;
        username?: string;
    }>>;
    qrLogSkip: z.ZodDefault<z.ZodBoolean>;
    restartOnCrash: z.ZodOptional<z.ZodAny>;
    disableSpins: z.ZodDefault<z.ZodBoolean>;
    logConsole: z.ZodDefault<z.ZodBoolean>;
    logConsoleErrors: z.ZodDefault<z.ZodBoolean>;
    authTimeout: z.ZodDefault<z.ZodNumber>;
    oorTimeout: z.ZodDefault<z.ZodNumber>;
    killProcessOnBrowserClose: z.ZodDefault<z.ZodBoolean>;
    safeMode: z.ZodDefault<z.ZodBoolean>;
    skipSessionSave: z.ZodDefault<z.ZodBoolean>;
    popup: z.ZodDefault<z.ZodUnion<[z.ZodBoolean, z.ZodNumber]>>;
    qrPopUpOnly: z.ZodOptional<z.ZodBoolean>;
    inDocker: z.ZodDefault<z.ZodBoolean>;
    qrQuality: z.ZodDefault<z.ZodNumber>;
    qrFormat: z.ZodDefault<z.ZodNativeEnum<typeof QRFormat>>;
    hostNotificationLang: z.ZodOptional<z.ZodNativeEnum<typeof NotificationLanguage>>;
    blockAssets: z.ZodDefault<z.ZodBoolean>;
    keepUpdated: z.ZodDefault<z.ZodBoolean>;
    resizable: z.ZodDefault<z.ZodBoolean>;
    viewport: z.ZodOptional<z.ZodObject<{
        width: z.ZodDefault<z.ZodNumber>;
        height: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        width?: number;
        height?: number;
    }, {
        width?: number;
        height?: number;
    }>>;
    legacy: z.ZodDefault<z.ZodBoolean>;
    deleteSessionDataOnLogout: z.ZodDefault<z.ZodBoolean>;
    killProcessOnTimeout: z.ZodDefault<z.ZodBoolean>;
    killProcessOnBan: z.ZodDefault<z.ZodBoolean>;
    corsFix: z.ZodDefault<z.ZodBoolean>;
    callTimeout: z.ZodDefault<z.ZodNumber>;
    screenshotOnInitializationBrowserError: z.ZodDefault<z.ZodBoolean>;
    eventMode: z.ZodDefault<z.ZodBoolean>;
    logFile: z.ZodDefault<z.ZodBoolean>;
    idCorrection: z.ZodDefault<z.ZodBoolean>;
    stickerServerEndpoint: z.ZodDefault<z.ZodUnion<[z.ZodString, z.ZodBoolean]>>;
    ghPatch: z.ZodDefault<z.ZodBoolean>;
    cachedPatch: z.ZodDefault<z.ZodBoolean>;
    logDebugInfoAsObject: z.ZodDefault<z.ZodBoolean>;
    logInternalEvents: z.ZodOptional<z.ZodBoolean>;
    killClientOnLogout: z.ZodDefault<z.ZodBoolean>;
    throwOnExpiredSessionData: z.ZodDefault<z.ZodBoolean>;
    useNativeProxy: z.ZodDefault<z.ZodBoolean>;
    raspi: z.ZodDefault<z.ZodBoolean>;
    pQueueDefault: z.ZodOptional<z.ZodAny>;
    messagePreprocessor: z.ZodOptional<z.ZodAny>;
    preprocFilter: z.ZodOptional<z.ZodString>;
    cloudUploadOptions: z.ZodOptional<z.ZodObject<{
        provider: z.ZodNativeEnum<typeof CLOUD_PROVIDERS>;
        accessKeyId: z.ZodString;
        secretAccessKey: z.ZodString;
        bucket: z.ZodString;
        region: z.ZodOptional<z.ZodString>;
        ignoreHostAccount: z.ZodOptional<z.ZodBoolean>;
        directory: z.ZodOptional<z.ZodUnion<[z.ZodNativeEnum<typeof DIRECTORY_STRATEGY>, z.ZodString]>>;
        public: z.ZodOptional<z.ZodBoolean>;
        headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        provider?: CLOUD_PROVIDERS;
        accessKeyId?: string;
        secretAccessKey?: string;
        bucket?: string;
        region?: string;
        ignoreHostAccount?: boolean;
        directory?: string;
        public?: boolean;
        headers?: Record<string, string>;
    }, {
        provider?: CLOUD_PROVIDERS;
        accessKeyId?: string;
        secretAccessKey?: string;
        bucket?: string;
        region?: string;
        ignoreHostAccount?: boolean;
        directory?: string;
        public?: boolean;
        headers?: Record<string, string>;
    }>>;
    onError: z.ZodDefault<z.ZodNativeEnum<typeof OnError>>;
    multiDevice: z.ZodDefault<z.ZodBoolean>;
    sessionDataBucketAuth: z.ZodOptional<z.ZodString>;
    autoEmoji: z.ZodDefault<z.ZodUnion<[z.ZodString, z.ZodLiteral<false>]>>;
    maxChats: z.ZodOptional<z.ZodNumber>;
    socketMode: z.ZodDefault<z.ZodBoolean>;
    apiLifecycle: z.ZodDefault<z.ZodEnum<["immediate", "post-connection", "hybrid"]>>;
    apiKey: z.ZodOptional<z.ZodString>;
    port: z.ZodDefault<z.ZodNumber>;
    host: z.ZodDefault<z.ZodString>;
    cors: z.ZodDefault<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    webhook: z.ZodOptional<z.ZodString>;
    ezqr: z.ZodDefault<z.ZodBoolean>;
    elasticUrl: z.ZodOptional<z.ZodString>;
    elasticUsername: z.ZodOptional<z.ZodString>;
    elasticPassword: z.ZodOptional<z.ZodString>;
    elasticBufferSize: z.ZodDefault<z.ZodNumber>;
    elasticPipeline: z.ZodOptional<z.ZodString>;
    elasticIndexPrefix: z.ZodDefault<z.ZodString>;
    s3Sync: z.ZodOptional<z.ZodObject<{
        bucket: z.ZodString;
        region: z.ZodString;
        accessKeyId: z.ZodString;
        secretAccessKey: z.ZodString;
        endpoint: z.ZodOptional<z.ZodString>;
        host: z.ZodOptional<z.ZodString>;
        syncInterval: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        accessKeyId?: string;
        secretAccessKey?: string;
        bucket?: string;
        region?: string;
        host?: string;
        endpoint?: string;
        syncInterval?: number;
    }, {
        accessKeyId?: string;
        secretAccessKey?: string;
        bucket?: string;
        region?: string;
        host?: string;
        endpoint?: string;
        syncInterval?: number;
    }>>;
}, "strip", z.ZodTypeAny, {
    sessionData?: string | z.objectOutputType<{
        WABrowserId: z.ZodOptional<z.ZodString>;
        WASecretBundle: z.ZodOptional<z.ZodString>;
        WAToken1: z.ZodOptional<z.ZodString>;
        WAToken2: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">;
    sessionId?: string;
    linkCode?: string;
    browserWSEndpoint?: string;
    useStealth?: boolean;
    sessionDataPath?: string;
    bypassCSP?: boolean;
    chromiumArgs?: string[];
    skipBrokenMethodsCheck?: boolean;
    skipUpdateCheck?: boolean;
    licenseKey?: string | Record<string, string> | ((...args: unknown[]) => unknown);
    customUserAgent?: string;
    devtools?: boolean | {
        user?: string;
        pass?: string;
    };
    blockCrashLogs?: boolean;
    cacheEnabled?: boolean;
    browserRevision?: string;
    throwErrorOnTosBlock?: boolean;
    headless?: boolean;
    autoRefresh?: boolean;
    qrRefreshS?: number;
    qrTimeout?: number;
    waitForRipeSessionTimeout?: number;
    executablePath?: string;
    useChrome?: boolean;
    proxyServerCredentials?: {
        password?: string;
        protocol?: string;
        address?: string;
        username?: string;
    };
    qrLogSkip?: boolean;
    restartOnCrash?: any;
    disableSpins?: boolean;
    logConsole?: boolean;
    logConsoleErrors?: boolean;
    authTimeout?: number;
    oorTimeout?: number;
    killProcessOnBrowserClose?: boolean;
    safeMode?: boolean;
    skipSessionSave?: boolean;
    popup?: number | boolean;
    qrPopUpOnly?: boolean;
    inDocker?: boolean;
    qrQuality?: number;
    qrFormat?: QRFormat;
    hostNotificationLang?: NotificationLanguage;
    blockAssets?: boolean;
    keepUpdated?: boolean;
    resizable?: boolean;
    viewport?: {
        width?: number;
        height?: number;
    };
    legacy?: boolean;
    deleteSessionDataOnLogout?: boolean;
    killProcessOnTimeout?: boolean;
    killProcessOnBan?: boolean;
    corsFix?: boolean;
    callTimeout?: number;
    screenshotOnInitializationBrowserError?: boolean;
    eventMode?: boolean;
    logFile?: boolean;
    idCorrection?: boolean;
    stickerServerEndpoint?: string | boolean;
    ghPatch?: boolean;
    cachedPatch?: boolean;
    logDebugInfoAsObject?: boolean;
    logInternalEvents?: boolean;
    killClientOnLogout?: boolean;
    throwOnExpiredSessionData?: boolean;
    useNativeProxy?: boolean;
    raspi?: boolean;
    pQueueDefault?: any;
    messagePreprocessor?: any;
    preprocFilter?: string;
    cloudUploadOptions?: {
        provider?: CLOUD_PROVIDERS;
        accessKeyId?: string;
        secretAccessKey?: string;
        bucket?: string;
        region?: string;
        ignoreHostAccount?: boolean;
        directory?: string;
        public?: boolean;
        headers?: Record<string, string>;
    };
    onError?: OnError;
    multiDevice?: boolean;
    sessionDataBucketAuth?: string;
    autoEmoji?: string | false;
    maxChats?: number;
    ezqr?: boolean;
    socketMode?: boolean;
    apiLifecycle?: "immediate" | "post-connection" | "hybrid";
    apiKey?: string;
    port?: number;
    host?: string;
    cors?: string | string[];
    webhook?: string;
    elasticUrl?: string;
    elasticUsername?: string;
    elasticPassword?: string;
    elasticBufferSize?: number;
    elasticPipeline?: string;
    elasticIndexPrefix?: string;
    s3Sync?: {
        accessKeyId?: string;
        secretAccessKey?: string;
        bucket?: string;
        region?: string;
        host?: string;
        endpoint?: string;
        syncInterval?: number;
    };
}, {
    sessionData?: string | z.objectInputType<{
        WABrowserId: z.ZodOptional<z.ZodString>;
        WASecretBundle: z.ZodOptional<z.ZodString>;
        WAToken1: z.ZodOptional<z.ZodString>;
        WAToken2: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">;
    sessionId?: string;
    linkCode?: string;
    browserWSEndpoint?: string;
    useStealth?: boolean;
    sessionDataPath?: string;
    bypassCSP?: boolean;
    chromiumArgs?: string[];
    skipBrokenMethodsCheck?: boolean;
    skipUpdateCheck?: boolean;
    licenseKey?: string | Record<string, string> | ((...args: unknown[]) => unknown);
    customUserAgent?: string;
    devtools?: boolean | {
        user?: string;
        pass?: string;
    };
    blockCrashLogs?: boolean;
    cacheEnabled?: boolean;
    browserRevision?: string;
    throwErrorOnTosBlock?: boolean;
    headless?: boolean;
    autoRefresh?: boolean;
    qrRefreshS?: number;
    qrTimeout?: number;
    waitForRipeSessionTimeout?: number;
    executablePath?: string;
    useChrome?: boolean;
    proxyServerCredentials?: {
        password?: string;
        protocol?: string;
        address?: string;
        username?: string;
    };
    qrLogSkip?: boolean;
    restartOnCrash?: any;
    disableSpins?: boolean;
    logConsole?: boolean;
    logConsoleErrors?: boolean;
    authTimeout?: number;
    oorTimeout?: number;
    killProcessOnBrowserClose?: boolean;
    safeMode?: boolean;
    skipSessionSave?: boolean;
    popup?: number | boolean;
    qrPopUpOnly?: boolean;
    inDocker?: boolean;
    qrQuality?: number;
    qrFormat?: QRFormat;
    hostNotificationLang?: NotificationLanguage;
    blockAssets?: boolean;
    keepUpdated?: boolean;
    resizable?: boolean;
    viewport?: {
        width?: number;
        height?: number;
    };
    legacy?: boolean;
    deleteSessionDataOnLogout?: boolean;
    killProcessOnTimeout?: boolean;
    killProcessOnBan?: boolean;
    corsFix?: boolean;
    callTimeout?: number;
    screenshotOnInitializationBrowserError?: boolean;
    eventMode?: boolean;
    logFile?: boolean;
    idCorrection?: boolean;
    stickerServerEndpoint?: string | boolean;
    ghPatch?: boolean;
    cachedPatch?: boolean;
    logDebugInfoAsObject?: boolean;
    logInternalEvents?: boolean;
    killClientOnLogout?: boolean;
    throwOnExpiredSessionData?: boolean;
    useNativeProxy?: boolean;
    raspi?: boolean;
    pQueueDefault?: any;
    messagePreprocessor?: any;
    preprocFilter?: string;
    cloudUploadOptions?: {
        provider?: CLOUD_PROVIDERS;
        accessKeyId?: string;
        secretAccessKey?: string;
        bucket?: string;
        region?: string;
        ignoreHostAccount?: boolean;
        directory?: string;
        public?: boolean;
        headers?: Record<string, string>;
    };
    onError?: OnError;
    multiDevice?: boolean;
    sessionDataBucketAuth?: string;
    autoEmoji?: string | false;
    maxChats?: number;
    ezqr?: boolean;
    socketMode?: boolean;
    apiLifecycle?: "immediate" | "post-connection" | "hybrid";
    apiKey?: string;
    port?: number;
    host?: string;
    cors?: string | string[];
    webhook?: string;
    elasticUrl?: string;
    elasticUsername?: string;
    elasticPassword?: string;
    elasticBufferSize?: number;
    elasticPipeline?: string;
    elasticIndexPrefix?: string;
    s3Sync?: {
        accessKeyId?: string;
        secretAccessKey?: string;
        bucket?: string;
        region?: string;
        host?: string;
        endpoint?: string;
        syncInterval?: number;
    };
}>;
export type Config = z.infer<typeof ConfigSchema>;
//# sourceMappingURL=config.d.ts.map