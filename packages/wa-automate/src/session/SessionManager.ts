import { createLogger } from '@open-wa/logger';
import { LocalSessionCompression, S3SyncManager } from '@open-wa/session-sync';
import type { S3Config } from '@open-wa/session-sync';
import type { Config } from '@open-wa/config';

type SessionManagerConfig = {
  sessionId: string;
  dataDir: string;
  s3Config?: S3Config;
  syncInterval?: number;
  enableLocalCompression?: boolean;
  enableS3Backup?: boolean;
};

export class SessionManager {
  private config: SessionManagerConfig;
  private logger = createLogger({ component: 'SessionManager' });
  private localCompression: LocalSessionCompression | null = null;
  private s3Sync: S3SyncManager | null = null;
  private syncTimer: NodeJS.Timeout | null = null;
  private syncInFlight = false;

  constructor(config: SessionManagerConfig) {
    this.config = config;
    this.logger.info('SessionManager initialized', { sessionId: config.sessionId });
  }

  async start(): Promise<void> {
    if (this.config.enableLocalCompression !== false) {
      this.localCompression = new LocalSessionCompression({
        sessionPath: this.config.dataDir,
        sessionId: this.config.sessionId,
        intervalMs: this.config.syncInterval || 600_000,
      });
      await this.localCompression.start();
      this.logger.info('Local session compression started');
    }

    // S3 backups upload the `.data.zst` artifact produced by LocalSessionCompression.
    // If local compression is disabled, periodic S3 sync would target a non-existent file.
    if (this.config.enableLocalCompression !== false && this.config.enableS3Backup && this.config.s3Config) {
      this.s3Sync = new S3SyncManager(this.config.s3Config);
      this.startPeriodicSync();
      this.logger.info('S3 session sync started');
    }
  }

  async stop(): Promise<void> {
    if (this.localCompression) {
      try {
        await this.localCompression.stop();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn('Local session compression stop failed', { error: message });
      }
      this.localCompression = null;
    }

    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
      this.syncTimer = null;
    }
    this.syncInFlight = false;

    if (this.s3Sync) {
      this.s3Sync = null;
    }

    this.logger.info('SessionManager stopped');
  }

  async backupSession(): Promise<string | null> {
    if (!this.s3Sync) {
      this.logger.warn('S3 sync not configured');
      return null;
    }

    const sessionZstPath = `${this.config.dataDir}/${this.config.sessionId}.data.zst`;
    try {
      const filename = await this.s3Sync.backupSession(sessionZstPath);
      this.logger.info('Session backed up to S3', { filename });
      return filename;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to backup session to S3', { error: message });
      throw error;
    }
  }

  async restoreSession(filename: string): Promise<void> {
    if (!this.s3Sync) {
      this.logger.warn('S3 sync not configured');
      throw new Error('S3 sync not configured for session restore');
    }

    try {
      await this.s3Sync.restoreSession(filename, this.config.dataDir);
      this.logger.info('Session restored from S3', { filename });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to restore session from S3', { error: message });
      throw error;
    }
  }

  async getSessionBackupUrl(filename: string, expiresIn = 3600): Promise<string | null> {
    if (!this.s3Sync) {
      this.logger.warn('S3 sync not configured');
      return null;
    }

    try {
      const url = await this.s3Sync.getDownloadUrl(filename, expiresIn);
      this.logger.info('Generated session backup URL', { filename, expiresIn });
      return url;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to generate backup URL', { error: message });
      throw error;
    }
  }

  private startPeriodicSync(): void {
    if (!this.s3Sync) return;

    const syncInterval = this.config.syncInterval || 600_000;

    // Defensive: stop any previous schedule before starting a new one
    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
      this.syncTimer = null;
    }

    const tick = async () => {
      if (!this.s3Sync) return;

      if (!this.syncInFlight) {
        this.syncInFlight = true;
        try {
          await this.backupSession();
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          this.logger.error('Periodic sync failed', { error: message });
        } finally {
          this.syncInFlight = false;
        }
      }

      if (!this.s3Sync) return;
      this.syncTimer = setTimeout(() => void tick(), syncInterval);
    };

    this.syncTimer = setTimeout(() => void tick(), syncInterval);
  }

  private static parseS3Config(input: unknown): S3Config | null {
    if (!input || typeof input !== 'object') return null;

    const obj = input as Record<string, unknown>;
    const bucket = obj.bucket;
    const region = obj.region;
    const accessKeyId = obj.accessKeyId;
    const secretAccessKey = obj.secretAccessKey;

    const hasRequired =
      typeof bucket === 'string' &&
      bucket.length > 0 &&
      typeof region === 'string' &&
      region.length > 0 &&
      typeof accessKeyId === 'string' &&
      accessKeyId.length > 0 &&
      typeof secretAccessKey === 'string' &&
      secretAccessKey.length > 0;

    if (!hasRequired) return null;

    const endpoint = typeof obj.endpoint === 'string' ? obj.endpoint : undefined;
    const host = typeof obj.host === 'string' ? obj.host : undefined;
    const url = typeof obj.url === 'string' ? obj.url : undefined;

    return { bucket, region, accessKeyId, secretAccessKey, endpoint, host, url };
  }

  static createFromConfig(clientConfig: Config): SessionManager {
    const validatedS3Config = SessionManager.parseS3Config(clientConfig.s3Sync);
    return new SessionManager({
      sessionId: clientConfig.sessionId || 'session',
      dataDir: clientConfig.sessionDataPath || './.wwebjs',
      s3Config: validatedS3Config ?? undefined,
      syncInterval: clientConfig.s3Sync?.syncInterval,
      enableLocalCompression: clientConfig.s3Sync?.enableLocalCompression !== false,
      enableS3Backup: validatedS3Config !== null,
    });
  }
}

