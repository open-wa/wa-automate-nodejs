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
    /** Enable ephemeral worker/crypto bridges for WhatsApp QR exploration. */
    experimentalWhatsApp?: boolean;
}

export interface BrowserProvisionOptions {
    /** Managed browser to provision when no executablePath is supplied. */
    kind?: 'chrome' | 'chromium';
    /** Download the selected browser when missing, or require an existing installation. */
    download?: 'auto' | 'never';
    /** Defaults to a per-user cache; Chrome/Chromium also honor PUPPETEER_CACHE_DIR. */
    cacheDirectory?: string;
    /** Optional Chrome for Testing or Chromium mirror. HTTP(S)_PROXY and NO_PROXY apply. */
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
