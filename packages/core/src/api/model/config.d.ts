import { AxiosRequestConfig } from 'axios';
import { ConfigLogTransport } from '../../logging/logging';
import { Base64 } from "./aliases";
import { SimpleListener } from './events';
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
type SessionId = string;
type LicenseKey = string;
type HostAccountNumber = `${number}`;
type HostAccountNumberOrSessionID = HostAccountNumber | SessionId;
type LicenseKeyConfigObject = {
    [key: HostAccountNumberOrSessionID]: LicenseKey;
};
type LicenseKeyConfigFunctionReturn = LicenseKeyConfigObject | LicenseKey;
type LicenseKeyConfigFunction = (sessionId?: SessionId, number?: HostAccountNumber) => LicenseKeyConfigFunctionReturn | Promise<LicenseKeyConfigFunctionReturn>;
type LicenseKeyConfig = LicenseKeyConfigFunction | LicenseKeyConfigObject | LicenseKey;
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
export declare enum QRQuality {
    ONE = 0.1,
    TWO = 0.2,
    THREE = 0.3,
    FOUR = 0.4,
    FIVE = 0.5,
    SIX = 0.6,
    SEVEN = 0.7,
    EIGHT = 0.8,
    NINE = 0.9,
    TEN = 1
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
export interface SessionData {
    WABrowserId?: string;
    WASecretBundle?: string;
    WAToken1?: string;
    WAToken2?: string;
}
export interface DevTools {
    user: string;
    pass: string;
}
export interface EventPayload {
    ts: number;
    sessionId: string;
    id: string;
    event: SimpleListener;
    data: any;
    [k: string]: any;
}
export interface Webhook {
    url: string;
    requestConfig?: AxiosRequestConfig;
    id: string;
    events: SimpleListener[];
    ts: number;
}
export interface ProxyServerCredentials {
    protocol?: string;
    address: string;
    username: string;
    password: string;
}
export interface ConfigObject {
    sessionData?: SessionData | Base64;
    linkCode?: string;
    browserWSEndpoint?: string;
    useStealth?: boolean;
    sessionDataPath?: string;
    bypassCSP?: boolean;
    chromiumArgs?: string[];
    skipBrokenMethodsCheck?: boolean;
    skipUpdateCheck?: boolean;
    sessionId?: string;
    licenseKey?: LicenseKey;
    customUserAgent?: string;
    devtools?: boolean | DevTools;
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
    proxyServerCredentials?: ProxyServerCredentials;
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
    popup?: boolean | number;
    qrPopUpOnly?: boolean;
    inDocker?: boolean;
    qrQuality?: QRQuality;
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
        provider: CLOUD_PROVIDERS;
        accessKeyId: string;
        secretAccessKey: string;
        bucket: string;
        region?: string;
        ignoreHostAccount?: boolean;
        directory?: DIRECTORY_STRATEGY | string;
        public?: boolean;
        headers?: {
            [k: string]: string;
        };
    };
    onError?: OnError;
    multiDevice?: boolean;
    sessionDataBucketAuth?: string;
    autoEmoji?: string | false;
    maxChats?: number;
    maxMessages?: number;
    discord?: string;
    ignoreNuke?: boolean;
    ensureHeadfulIntegrity?: boolean;
    waitForRipeSession?: boolean;
    qrMax?: number;
    ezqr?: boolean;
    logging?: ConfigLogTransport[];
    linkParser?: string;
    aggressiveGarbageCollection?: boolean;
    [x: string]: any;
}
export type AdvancedConfig = ConfigObject & {
    licenseKey: LicenseKeyConfig;
};
export {};
//# sourceMappingURL=config.d.ts.map