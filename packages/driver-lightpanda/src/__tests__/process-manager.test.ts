import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type MockProcess = {
    kill: ReturnType<typeof vi.fn>;
};

const serve = vi.fn();

describe('LightpandaProcessManager', () => {
    const originalWebSocket = globalThis.WebSocket;

    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
    });

    afterEach(() => {
        globalThis.WebSocket = originalWebSocket;
        vi.doUnmock('../port-utils');
        vi.doUnmock('@lightpanda/browser');
    });

    it('starts Lightpanda, probes readiness, and exposes the endpoint', async () => {
        vi.doMock('../port-utils', () => ({
            findFreePort: vi.fn(async () => 9400),
        }));
        vi.doMock('@lightpanda/browser', () => ({
            serve,
        }), { virtual: true });

        const process: MockProcess = {
            kill: vi.fn(() => true),
        };
        serve.mockReturnValue(process);

        class SuccessfulWebSocket {
            onopen: (() => void) | null = null;
            onerror: ((event: unknown) => void) | null = null;

            constructor(url: string) {
                expect(url).toBe('ws://127.0.0.1:9400');
                queueMicrotask(() => this.onopen?.());
            }

            close(): void {
                return;
            }
        }

        globalThis.WebSocket = SuccessfulWebSocket as typeof WebSocket;

        const { LightpandaProcessManager } = await import('../process-manager');
        const manager = new LightpandaProcessManager();

        const info = await manager.start({ startupTimeoutMs: 1000 });

        expect(info).toEqual({
            host: '127.0.0.1',
            port: 9400,
            wsEndpoint: 'ws://127.0.0.1:9400',
        });
        expect(manager.getEndpoint()).toBe('ws://127.0.0.1:9400');
        expect(serve).toHaveBeenCalledWith(expect.objectContaining({
            host: '127.0.0.1',
            port: 9400,
            args: ['--timeout', '0'],
        }));
    });

    it('kills the child process exactly once when stop is called repeatedly', async () => {
        vi.doMock('../port-utils', () => ({
            findFreePort: vi.fn(async () => 9401),
        }));
        vi.doMock('@lightpanda/browser', () => ({
            serve,
        }), { virtual: true });

        const process: MockProcess = {
            kill: vi.fn(() => true),
        };
        serve.mockReturnValue(process);

        class SuccessfulWebSocket {
            onopen: (() => void) | null = null;
            onerror: ((event: unknown) => void) | null = null;

            constructor() {
                queueMicrotask(() => this.onopen?.());
            }

            close(): void {
                return;
            }
        }

        globalThis.WebSocket = SuccessfulWebSocket as typeof WebSocket;

        const { LightpandaProcessManager } = await import('../process-manager');
        const manager = new LightpandaProcessManager();

        await manager.start();
        await manager.stop();
        await manager.stop();

        expect(process.kill).toHaveBeenCalledTimes(1);
    });

    it('cleans up the child process when readiness times out', async () => {
        vi.doMock('../port-utils', () => ({
            findFreePort: vi.fn(async () => 9402),
        }));
        vi.doMock('@lightpanda/browser', () => ({
            serve,
        }), { virtual: true });

        const process: MockProcess = {
            kill: vi.fn(() => true),
        };
        serve.mockReturnValue(process);

        class FailingWebSocket {
            onopen: (() => void) | null = null;
            onerror: ((event: unknown) => void) | null = null;

            constructor() {
                queueMicrotask(() => this.onerror?.(new Error('not ready')));
            }

            close(): void {
                return;
            }
        }

        globalThis.WebSocket = FailingWebSocket as typeof WebSocket;

        const { LightpandaProcessManager } = await import('../process-manager');
        const manager = new LightpandaProcessManager();

        await expect(manager.start({ startupTimeoutMs: 25 })).rejects.toThrow(
            'Timed out waiting for Lightpanda readiness at ws://127.0.0.1:9402 after 25ms',
        );
        expect(process.kill).toHaveBeenCalledTimes(1);
    });

    it('retries on collision-style startup failure, advances the port, and kills the failed child before succeeding', async () => {
        const findFreePort = vi.fn()
            .mockResolvedValueOnce(9403)
            .mockResolvedValueOnce(9404);
        vi.doMock('../port-utils', () => ({
            findFreePort,
        }));
        vi.doMock('@lightpanda/browser', () => ({
            serve,
        }), { virtual: true });

        const firstProcess: MockProcess = {
            kill: vi.fn(() => true),
        };
        const secondProcess: MockProcess = {
            kill: vi.fn(() => true),
        };
        serve.mockReturnValueOnce(firstProcess).mockReturnValueOnce(secondProcess);

        class RetryWebSocket {
            static attempts = 0;

            onopen: (() => void) | null = null;
            onerror: ((event: unknown) => void) | null = null;

            constructor(url: string) {
                RetryWebSocket.attempts += 1;
                if (RetryWebSocket.attempts === 1) {
                    expect(url).toBe('ws://127.0.0.1:9403');
                    queueMicrotask(() => this.onerror?.(new Error('EADDRINUSE: address already in use')));
                    return;
                }

                expect(url).toBe('ws://127.0.0.1:9404');
                queueMicrotask(() => this.onopen?.());
            }

            close(): void {
                return;
            }
        }

        globalThis.WebSocket = RetryWebSocket as typeof WebSocket;

        const { LightpandaProcessManager } = await import('../process-manager');
        const manager = new LightpandaProcessManager();

        const info = await manager.start({ portStart: 9403, startupTimeoutMs: 1000 });

        expect(info).toEqual({
            host: '127.0.0.1',
            port: 9404,
            wsEndpoint: 'ws://127.0.0.1:9404',
        });
        expect(findFreePort).toHaveBeenNthCalledWith(1, 9403, 1);
        expect(findFreePort).toHaveBeenNthCalledWith(2, 9404, 1);
        expect(serve).toHaveBeenNthCalledWith(1, expect.objectContaining({ host: '127.0.0.1', port: 9403 }));
        expect(serve).toHaveBeenNthCalledWith(2, expect.objectContaining({ host: '127.0.0.1', port: 9404 }));
        expect(firstProcess.kill).toHaveBeenCalledTimes(1);
        expect(secondProcess.kill).not.toHaveBeenCalled();
    });

    it('rejects non-loopback hosts in v1', async () => {
        const { LightpandaProcessManager } = await import('../process-manager');
        const manager = new LightpandaProcessManager();

        await expect(manager.start({ host: '0.0.0.0' })).rejects.toThrow(
            'Lightpanda v1 only supports local loopback host 127.0.0.1; received 0.0.0.0',
        );
    });

    it('returns a clear error when the optional Lightpanda SDK is unavailable', async () => {
        const { LightpandaProcessManager } = await import('../process-manager');
        const manager = new LightpandaProcessManager();

        await expect(manager.start()).rejects.toThrow(
            '@lightpanda/browser is not installed. Install it to use the Lightpanda driver.',
        );
    });
});
