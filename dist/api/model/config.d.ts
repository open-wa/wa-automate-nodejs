import { Base64 } from "./aliases";
export declare enum QRFormat {
    PNG = "png",
    JPEG = "jpeg",
    WEBM = "webm"
}
export declare enum NotificationLanguage {
    PTBR = "pt-br",
    ENGB = "en-gb",
    DEDE = "de-de",
    ES = "es"
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
export interface ProxyServerCredentials {
    protocol?: string;
    address: string;
    username: string;
    password: string;
}
export interface ConfigObject {
    sessionData?: SessionData | Base64;
    browserWSEndpoint?: string;
    useStealth?: boolean;
    sessionDataPath?: string;
    bypassCSP?: boolean;
    chromiumArgs?: string[];
    skipBrokenMethodsCheck?: boolean;
    sessionId?: string;
    licenseKey?: string | string[];
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
    executablePath?: string;
    useChrome?: boolean;
    proxyServerCredentials?: ProxyServerCredentials;
    qrLogSkip?: boolean;
    restartOnCrash?: any;
    disableSpins?: boolean;
    logConsole?: boolean;
    logConsoleErrors?: boolean;
    authTimeout?: number;
    killProcessOnBrowserClose?: boolean;
    safeMode?: boolean;
    skipSessionSave?: boolean;
    popup?: boolean | number;
    inDocker?: boolean;
    qrQuality?: QRQuality;
    qrFormat?: QRFormat;
    hostNotificationLang?: NotificationLanguage;
    blockAssets?: boolean;
    [x: string]: any;
}
