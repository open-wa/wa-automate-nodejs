export type DriverName = 'puppeteer' | 'playwright' | 'remote' | 'lightpanda' | string;

export interface IDriverContext {
    logger?: {
        debug(msg: string, meta?: Record<string, unknown>): void;
        info(msg: string, meta?: Record<string, unknown>): void;
        warn(msg: string, meta?: Record<string, unknown>): void;
        error(msg: string, meta?: Record<string, unknown>): void;
    };
}

export interface LaunchOptions {
    headless?: boolean;
    executablePath?: string;
    args?: string[];
    proxy?: { server: string; username?: string; password?: string };
    userDataDir?: string;
    timeoutMs?: number;
    defaultViewport?: { width: number; height: number } | null;
}

export interface ConnectOptions {
    wsEndpoint?: string;
    cdpEndpoint?: string;
    headers?: Record<string, string>;
    timeoutMs?: number;
}
