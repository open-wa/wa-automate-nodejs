export type DriverName = 'puppeteer' | 'playwright' | 'remote' | 'lightpanda' | string;

export interface IDriverContext {
    logger?: {
        debug(msg: string, meta?: Record<string, unknown>): void;
        info(msg: string, meta?: Record<string, unknown>): void;
        warn(msg: string, meta?: Record<string, unknown>): void;
        error(msg: string, meta?: Record<string, unknown>): void;
    };
}

export interface LightpandaOptions {
    executablePath?: string;
    portStart?: number;
    host?: string;
    startupTimeoutMs?: number;
    disableTelemetry?: boolean;
}

export interface BrowserProvisionOptions {
    /** Download the Puppeteer-matched Chrome when missing, or require an existing installation. */
    download?: 'auto' | 'never';
    /** Defaults to Puppeteer's configured cache (including PUPPETEER_CACHE_DIR). */
    cacheDirectory?: string;
    /** Optional Chrome for Testing mirror. HTTP(S)_PROXY and NO_PROXY apply to downloads. */
    downloadBaseUrl?: string;
}

export interface LaunchOptions {
    headless?: boolean;
    executablePath?: string;
    browser?: BrowserProvisionOptions;
    args?: string[];
    proxy?: { server: string; username?: string; password?: string };
    userDataDir?: string;
    timeoutMs?: number;
    defaultViewport?: { width: number; height: number } | null;
    lightpanda?: LightpandaOptions;
}

export interface ConnectOptions {
    wsEndpoint?: string;
    cdpEndpoint?: string;
    headers?: Record<string, string>;
    timeoutMs?: number;
}
