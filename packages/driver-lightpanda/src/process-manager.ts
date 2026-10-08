import { spawn, type ChildProcess } from 'node:child_process';
import { findFreePort } from './port-utils';

const DEFAULT_PORT_START = 9000;
const DEFAULT_STARTUP_TIMEOUT_MS = 30_000;
const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_PORT_ATTEMPTS = 10;
const INITIAL_BACKOFF_MS = 50;
const MAX_BACKOFF_MS = 1_000;

type LightpandaChildProcess = Pick<ChildProcess, 'kill' | 'stderr' | 'once' | 'pid'>;

export interface ProcessManagerConfig {
    executablePath?: string;
    portStart?: number;
    host?: string;
    startupTimeoutMs?: number;
    disableTelemetry?: boolean;
    experimentalWhatsApp?: boolean;
    onStderr?: (message: string) => void;
}

export interface LightpandaProcessInfo {
    host: string;
    port: number;
    wsEndpoint: string;
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

        const executablePath = config.executablePath ?? process.env.LIGHTPANDA_EXECUTABLE_PATH ?? 'lightpanda';

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
                const child = spawn(executablePath, [
                    'serve', '--host', host, '--port', String(port),
                    '--load-resources', 'worker',
                    '--load-resources', 'iframe',
                    '--load-resources', 'stylesheet',
                    ...(config.experimentalWhatsApp ? [
                        '--experimental-features', 'serviceworker',
                        // v1 applies its HTTP transfer deadline to WebSockets too.
                        // WhatsApp's pairing and messaging socket must stay open.
                        '--http-timeout', '0',
                    ] : []),
                ], {
                    stdio: ['ignore', 'ignore', 'pipe'],
                    env: { ...process.env, ...(config.disableTelemetry ? { LIGHTPANDA_DISABLE_TELEMETRY: 'true' } : {}) },
                });
                this.attachChild(child);
                let processError: Error | undefined;
                let stderr = '';
                child.once('error', error => { processError = error; });
                child.stderr?.on('data', data => {
                    const message = String(data);
                    stderr = (stderr + message).slice(-4096);
                    config.onStderr?.(message);
                });
                await this.waitForReadiness(wsEndpoint, startupTimeoutMs, () => {
                    if (processError) throw new Error(`Unable to start Lightpanda executable ${executablePath}: ${processError.message}`);
                    if (child.exitCode !== null || child.signalCode !== null) {
                        throw new Error(`Lightpanda exited before readiness: ${stderr.trim()}`);
                    }
                });

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

    getProcessId(): number | undefined {
        return this.child?.pid;
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
            child.kill();
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

    private async waitForReadiness(endpoint: string, startupTimeoutMs: number, checkProcess: () => void): Promise<void> {
        const deadline = Date.now() + startupTimeoutMs;
        let backoffMs = INITIAL_BACKOFF_MS;

        while (Date.now() < deadline) {
            checkProcess();
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

export const processManagerInternal = {
    DEFAULT_HOST,
    DEFAULT_PORT_ATTEMPTS,
    DEFAULT_PORT_START,
    DEFAULT_STARTUP_TIMEOUT_MS,
    createPortExhaustionError,
    createReadinessTimeoutError,
    isPortCollisionError,
    openWebSocket,
};
