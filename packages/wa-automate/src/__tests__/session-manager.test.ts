import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const compressionStart = vi.fn();
const compressionStop = vi.fn();
const compressionCompress = vi.fn(async () => undefined);
const backupSession = vi.fn(async () => 'session.data.zst');

vi.mock('@open-wa/logger', () => ({
    createLogger: () => ({
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    }),
}));

vi.mock('@open-wa/session-sync', () => ({
    LocalSessionCompression: class {
        start = compressionStart;
        stop = compressionStop;
        compress = compressionCompress;
    },
    S3SyncManager: class {
        backupSession = backupSession;
        restoreSession = vi.fn(async () => true);
        getDownloadUrl = vi.fn(async () => 'https://example.test/session');
    },
}));

import { SessionArchiveManager } from '../session/SessionArchiveManager';

describe('SessionArchiveManager lifecycle', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('owns compression and periodic backup resources idempotently', async () => {
        const manager = new SessionArchiveManager({
            sessionId: 'alpha',
            dataDir: '/tmp/openwa/alpha-profile',
            s3Config: {
                bucket: 'sessions',
                region: 'test',
                accessKeyId: 'test',
                secretAccessKey: 'test',
            },
            syncInterval: 1_000,
        });

        await manager.start();
        await manager.start();
        expect(compressionStart).toHaveBeenCalledTimes(1);

        await vi.advanceTimersByTimeAsync(1_000);
        expect(compressionCompress).toHaveBeenCalledTimes(1);
        expect(backupSession).toHaveBeenCalledWith('/tmp/openwa/alpha.data.zst');

        await manager.stop();
        expect(compressionStop).toHaveBeenCalledTimes(1);

        await vi.advanceTimersByTimeAsync(2_000);
        expect(backupSession).toHaveBeenCalledTimes(1);
    });
});
