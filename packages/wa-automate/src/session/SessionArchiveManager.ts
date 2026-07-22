import { dirname, join } from 'node:path';
import type { Config } from '@open-wa/config';
import { createLogger } from '@open-wa/logger';
import { LocalSessionCompression, S3SyncManager, type S3Config } from '@open-wa/session-sync';

export interface SessionArchiveManagerConfig {
    sessionId: string;
    dataDir: string;
    s3Config: S3Config;
    syncInterval?: number;
    watchLocalChanges?: boolean;
}

export class SessionArchiveManager {
    private readonly logger = createLogger({ component: 'SessionArchiveManager' });
    private localCompression?: LocalSessionCompression;
    private s3Sync?: S3SyncManager;
    private syncTimer?: NodeJS.Timeout;
    private started = false;

    constructor(private readonly config: SessionArchiveManagerConfig) {
        this.logger.info('session_archive_manager_initialized', { sessionId: config.sessionId });
    }

    async start(): Promise<void> {
        if (this.started) return;
        this.started = true;

        this.localCompression = new LocalSessionCompression({
            sessionPath: this.config.dataDir,
            sessionId: this.config.sessionId,
            outputPath: this.archivePath,
            intervalMs: this.config.syncInterval,
        });
        if (this.config.watchLocalChanges !== false) {
            this.localCompression.start();
            this.logger.info('local_session_compression_started');
        }

        this.s3Sync = new S3SyncManager(this.config.s3Config);
        this.startPeriodicSync();
        this.logger.info('s3_session_sync_started');
    }

    async stop(): Promise<void> {
        if (this.syncTimer) {
            clearInterval(this.syncTimer);
            this.syncTimer = undefined;
        }

        this.localCompression?.stop();
        this.localCompression = undefined;
        this.s3Sync = undefined;
        this.started = false;
        this.logger.info('session_archive_manager_stopped');
    }

    async backupSession(): Promise<string | null> {
        if (!this.s3Sync || !this.localCompression) {
            this.logger.warn('session_archive_manager_not_started');
            return null;
        }

        try {
            await this.localCompression.compress();
            const filename = await this.s3Sync.backupSession(this.archivePath);
            this.logger.info('session_backed_up', { filename });
            return filename;
        } catch (error) {
            this.logger.error('session_backup_failed', { error });
            throw error;
        }
    }

    async restoreSession(filename: string): Promise<void> {
        if (!this.s3Sync) {
            throw new Error('Session archive manager is not started');
        }

        const restored = await this.s3Sync.restoreSession(filename, this.config.dataDir);
        if (!restored) {
            throw new Error(`Failed to restore session backup: ${filename}`);
        }
        this.logger.info('session_restored', { filename });
    }

    async getSessionBackupUrl(filename: string, expiresIn = 3600): Promise<string | null> {
        if (!this.s3Sync) {
            return null;
        }

        return this.s3Sync.getDownloadUrl(filename, expiresIn);
    }

    static createFromConfig(config: Config): SessionArchiveManager {
        if (!config.s3Sync) {
            throw new Error('Session archive management requires s3Sync configuration');
        }

        return new SessionArchiveManager({
            sessionId: config.sessionId,
            dataDir: config.userDataDir || config.sessionDataPath || './.wwebjs',
            s3Config: config.s3Sync,
            syncInterval: config.s3Sync.syncInterval,
            watchLocalChanges: config.s3Sync.enableLocalCompression !== false,
        });
    }

    private get archivePath(): string {
        return join(dirname(this.config.dataDir), `${this.config.sessionId}.data.zst`);
    }

    private startPeriodicSync(): void {
        if (!this.s3Sync || this.syncTimer) return;

        this.syncTimer = setInterval(() => {
            void this.backupSession().catch((error) => {
                this.logger.error('periodic_session_sync_failed', { error });
            });
        }, this.config.syncInterval ?? 600_000);
        this.syncTimer.unref();
    }
}
