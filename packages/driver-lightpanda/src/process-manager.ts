import type { ChildProcess } from 'node:child_process';
import { findFreePort } from './port-utils';

const DEFAULT_PORT_START = 9000;
const DEFAULT_STARTUP_TIMEOUT_MS = 30_000;
const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_PORT_ATTEMPTS = 10;
const INITIAL_BACKOFF_MS = 50;
const MAX_BACKOFF_MS = 1_000;
const CHILD_EXIT_TIMEOUT_MS = 5_000;

type LightpandaServe = (options: Record<string, unknown>) => Promise<LightpandaChildProcess> | LightpandaChildProcess;

type LightpandaSdkModule = {
    serve: LightpandaServe;
};

type LightpandaSdkNamespaceModule = {
    lightpanda?: {
        serve?: LightpandaServe;
    };
};

type LightpandaChildProcess = Pick<ChildProcess, 'kill' | 'stderr' | 'once'>;

export interface ProcessManagerConfig {
    executablePath?: string;
    portStart?: number;
    host?: string;
    startupTimeoutMs?: number;
    disableTelemetry?: boolean;
}

export interface LightpandaProcessInfo {
    host: string;
    port: number;
    wsEndpoint: string;
}

function isModuleMissing(error: unknown): boolean {
    const err = error as NodeJS.ErrnoException | undefined;
    const message = err?.message?.toLowerCase() ?? '';
    return err?.code === 'ERR_MODULE_NOT_FOUND'
        || err?.code === 'MODULE_NOT_FOUND'
        || message.includes('could not resolve "@lightpanda/browser"')
        || message.includes('cannot find module') && message.includes('@lightpanda/browser');
}

async function loadLightpandaSdk(): Promise<LightpandaSdkModule> {
    try {
        const module = await import('@lightpanda/browser') as LightpandaSdkModule & LightpandaSdkNamespaceModule;
        const serve = typeof module.serve === 'function'
            ? module.serve.bind(module)
            : typeof module.lightpanda?.serve === 'function'
                ? module.lightpanda.serve.bind(module.lightpanda)
                : undefined;

        if (!serve) {
            throw new Error('@lightpanda/browser does not expose a compatible serve() API');
        }

        return { serve };
    } catch (error) {
        if (isModuleMissing(error)) {
            throw new Error(
                '@lightpanda/browser is not installed. Install it to use the Lightpanda driver.',
            );
        }

        throw error;
    }
}

async function withExecutablePathOverride<T>(executablePath: string | undefined, fn: () => Promise<T>): Promise<T> {
    if (!executablePath) {
        return await fn();
    }

    const previous = process.env.LIGHTPANDA_EXECUTABLE_PATH;
    process.env.LIGHTPANDA_EXECUTABLE_PATH = executablePath;

    try {
        return await fn();
    } finally {
        if (previous === undefined) {
            delete process.env.LIGHTPANDA_EXECUTABLE_PATH;
        } else {
            process.env.LIGHTPANDA_EXECUTABLE_PATH = previous;
        }
    }
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

function createReadinessTimeoutError(endpoint: string, timeoutMs: number): Error {
    return new Error(`Timed out waiting for Lightpanda readiness at ${endpoint} after ${timeoutMs}ms`);
}

function createPortExhaustionError(startFrom: number, maxAttempts: number): Error {
    return new Error(
        `Unable to start Lightpanda on a free port starting at ${startFrom} after ${maxAttempts} attempts`,
    );
}

async function terminateChildProcess(child: LightpandaChildProcess, timeoutMs = CHILD_EXIT_TIMEOUT_MS): Promise<void> {
    if (typeof child.once !== 'function') {
        child.kill();
        return;
    }

    await new Promise<void>((resolve) => {
        let settled = false;
        let escalationTimer: NodeJS.Timeout | undefined;

        const finish = () => {
            if (settled) {
                return;
            }

            settled = true;
            if (escalationTimer) {
                clearTimeout(escalationTimer);
            }
            resolve();
        };

        child.once('exit', finish);
        child.once('close', finish);

        escalationTimer = setTimeout(() => {
            try {
                child.kill('SIGKILL');
            } catch {
                // Ignore kill escalation failures during teardown.
            }
            finish();
        }, timeoutMs);

        try {
            child.kill();
        } catch {
            finish();
        }
    });
}

function isPortCollisionError(error: unknown): boolean {
    const err = error as NodeJS.ErrnoException | undefined;
    const message = err?.message?.toLowerCase() ?? '';
    return err?.code === 'EADDRINUSE' || message.includes('eaddrinuse') || message.includes('address already in use');
}

async function openWebSocket(endpoint: string): Promise<void> {
    const WebSocketCtor = (globalThis as typeof globalThis & {
        WebSocket?: new (url: string) => {
            close(): void;
            onopen: (() => void) | null;
            onerror: ((event: unknown) => void) | null;
        };
    }).WebSocket;

    if (!WebSocketCtor) {
        throw new Error('Global WebSocket support is unavailable in this Node.js runtime');
    }

    await new Promise<void>((resolve, reject) => {
        const socket = new WebSocketCtor(endpoint);
        let settled = false;

        const finish = (fn: () => void): void => {
            if (settled) {
                return;
            }

            settled = true;
            socket.onopen = null;
            socket.onerror = null;
            fn();
        };

        socket.onopen = () => {
            finish(() => {
                socket.close();
                resolve();
            });
        };

        socket.onerror = (event) => {
            finish(() => {
                const message = event instanceof Error ? event.message : `Unable to connect to ${endpoint}`;
                reject(new Error(message));
            });
        };
    });
}

export class LightpandaProcessManager {
    private child?: LightpandaChildProcess;
    private processInfo?: LightpandaProcessInfo;
    private stopPromise?: Promise<void>;
    private killIssued = false;

    constructor(private readonly maxPortAttempts = DEFAULT_PORT_ATTEMPTS) { }

    async start(config: ProcessManagerConfig = {}): Promise<LightpandaProcessInfo> {
        await this.stop();

        const host = config.host ?? DEFAULT_HOST;
        const portStart = config.portStart ?? DEFAULT_PORT_START;
        const startupTimeoutMs = config.startupTimeoutMs ?? DEFAULT_STARTUP_TIMEOUT_MS;

        if (host !== DEFAULT_HOST) {
            throw new Error(`Lightpanda v1 only supports local loopback host ${DEFAULT_HOST}; received ${host}`);
        }

        const sdk = await loadLightpandaSdk();

        for (let attempt = 0; attempt < this.maxPortAttempts; attempt += 1) {
            const candidateStart = portStart + attempt;
            let port: number;

            try {
                port = await findFreePort(candidateStart, 1);
            } catch (error) {
                if (isPortCollisionError(error) || error instanceof Error && error.message.includes('Unable to find a free Lightpanda port')) {
                    continue;
                }

                throw error;
            }

            const wsEndpoint = `ws://${host}:${port}`;

            try {
                const child = await withExecutablePathOverride(config.executablePath, async () => await sdk.serve({
                    host,
                    port,
                    timeout: 0,
                    disableTelemetry: config.disableTelemetry,
                }));

                this.attachChild(child);
                await this.waitForReadiness(wsEndpoint, startupTimeoutMs);

                this.processInfo = { host, port, wsEndpoint };
                return this.processInfo;
            } catch (error) {
                const collisionDetected = isPortCollisionError(error);
                await this.stop();

                if (collisionDetected) {
                    continue;
                }

                throw error;
            }
        }

        throw createPortExhaustionError(portStart, this.maxPortAttempts);
    }

    getEndpoint(): string {
        if (!this.processInfo) {
            throw new Error('Lightpanda process is not started');
        }

        return this.processInfo.wsEndpoint;
    }

    async stop(): Promise<void> {
        if (this.stopPromise) {
            return await this.stopPromise;
        }

        if (!this.child) {
            this.processInfo = undefined;
            return;
        }

        const child = this.child;
        this.child = undefined;
        this.processInfo = undefined;

        this.stopPromise = (async () => {
            if (this.killIssued) {
                return;
            }

            this.killIssued = true;
            await terminateChildProcess(child);
        })();

        try {
            await this.stopPromise;
        } finally {
            this.stopPromise = undefined;
        }
    }

    private attachChild(child: LightpandaChildProcess): void {
        this.child = child;
        this.killIssued = false;
    }

    private async waitForReadiness(endpoint: string, startupTimeoutMs: number): Promise<void> {
        const deadline = Date.now() + startupTimeoutMs;
        let backoffMs = INITIAL_BACKOFF_MS;

        while (Date.now() < deadline) {
            try {
                await openWebSocket(endpoint);
                return;
            } catch (error) {
                if (isPortCollisionError(error)) {
                    throw error;
                }
            }

            await sleep(Math.min(backoffMs, Math.max(deadline - Date.now(), 0)));
            backoffMs = Math.min(backoffMs * 2, MAX_BACKOFF_MS);
        }

        throw createReadinessTimeoutError(endpoint, startupTimeoutMs);
    }
}

export const __internal = {
    DEFAULT_HOST,
    DEFAULT_PORT_ATTEMPTS,
    DEFAULT_PORT_START,
    DEFAULT_STARTUP_TIMEOUT_MS,
    createPortExhaustionError,
    createReadinessTimeoutError,
    isPortCollisionError,
    loadLightpandaSdk,
    terminateChildProcess,
    withExecutablePathOverride,
    openWebSocket,
};
