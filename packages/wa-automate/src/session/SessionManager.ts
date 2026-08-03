import { LocalSessionCompression, S3SyncManager } from '@open-wa/session-sync';
import type { ClientConfig } from '@open-wa/schema';
import { createLogger } from '@open-wa/logger';

export interface SessionManagerConfig {
  sessionId: string;
  dataDir: string;
  s3Config?: {
    bucket: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    endpoint?: string;
    host?: string;
  };
  syncInterval?: number;
  compressionOptions?: string;
  enableLocalCompression?: boolean;
  enableS3Backup?: boolean;
}

export class SessionManager {
  private logger = createLogger({ component: 'SessionManager' });
  private localCompression: LocalSessionCompression | null = null;
  private s3Sync: S3SyncManager | null = null;

  constructor(private config: SessionManagerConfig) {
    this.logger.info('SessionManager initialized', { sessionId: config.sessionId });
  }

  async start(): Promise<void> {
    // Start local compression if enabled
    if (this.config.enableLocalCompression !== false) {
      this.localCompression = new LocalSessionCompression({
        sessionPath: this.config.dataDir,
        sessionId: this.config.sessionId,
        intervalMs: this.config.syncInterval || 600000
      });

      await this.localCompression.start();
      this.logger.info('Local session compression started');
    }

    // Start S3 sync if configured
    if (this.config.enableS3Backup && this.config.s3Config) {
      this.s3Sync = new S3SyncManager(this.config.s3Config);

      // Start periodic S3 sync
      this.startPeriodicSync();
      this.logger.info('S3 session sync started');
    }
  }

  async stop(): Promise<void> {
    // Stop local compression
    if (this.localCompression) {
      await this.localCompression.stop();
      this.localCompression = null;
    }

    // Stop S3 sync
    if (this.s3Sync) {
      // Note: S3SyncManager doesn't have stop method in current implementation
      // This would need to be added to session-sync package
      this.s3Sync = null;
    }

    this.logger.info('SessionManager stopped');
  }

  async backupSession(): Promise<string | null> {
    if (!this.s3Sync) {
      this.logger.warn('S3 sync not configured');
      return null;
    }

    try {
      // Find the latest compressed session file
      const sessionZstPath = `${this.config.dataDir}/${this.config.sessionId}.data.zst`;

      const filename = await this.s3Sync.backupSession(sessionZstPath);
      this.logger.info('Session backed up to S3', { filename });
      return filename;
    } catch (error) {
      this.logger.error('Failed to backup session to S3', { error: error.message });
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
      this.logger.error('Failed to restore session from S3', { error: error.message });
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
      this.logger.error('Failed to generate backup URL', { error: error.message });
      throw error;
    }
  }

  private startPeriodicSync(): void {
    if (!this.s3Sync) return;

    const syncInterval = this.config.syncInterval || 600000; // Default 10 minutes

    setInterval(async () => {
      try {
        await this.backupSession();
      } catch (error) {
        this.logger.error('Periodic sync failed', { error: error.message });
      }
    }, syncInterval);
  }

  static createFromConfig(clientConfig: ClientConfig): SessionManager {
    const s3Config = clientConfig.s3Sync;

    return new SessionManager({
      sessionId: clientConfig.sessionId || 'session',
      dataDir: clientConfig.sessionDataPath || './.wwebjs',
      s3Config: s3Config,
      syncInterval: clientConfig.s3Sync?.syncInterval,
      compressionOptions: '-1 -T0', // Default compression options
      enableLocalCompression: clientConfig.s3Sync?.enableLocalCompression !== false,
      enableS3Backup: !!s3Config
    });
  }
}
