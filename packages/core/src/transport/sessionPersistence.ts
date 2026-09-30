import type { S3Config } from '@open-wa/session-sync';
import { acquirePortableSessionStorage, type PortableSessionStorageOptions } from './portableSessionStorage';

export interface SessionPersistenceConfig extends Omit<PortableSessionStorageOptions, 'acquireRemote'> {
  s3Sync?: S3Config;
  /** Compatibility with v4's base64-encoded PicoS3 configuration. */
  sessionDataBucketAuth?: string;
}

/** The public runtime persists opaque envelopes; native restore and cryptography belong to pre-init. */
export const acquireSessionPersistence = (config: SessionPersistenceConfig) => acquirePortableSessionStorage({
  sessionId: config.sessionId,
  sessionDataPath: config.sessionDataPath,
  sessionData: config.sessionData,
  skipSessionSave: config.skipSessionSave,
  ...((config.s3Sync || config.sessionDataBucketAuth) ? {
    acquireRemote: async (filename: string) => {
      const encoded = config.sessionDataBucketAuth;
      if (encoded && encoded.length > 64 * 1024) throw new Error('SESSION_S3_CONFIG_INVALID');
      const legacy: unknown = encoded ? JSON.parse(Buffer.from(encoded, 'base64').toString('utf8')) : {};
      if (!legacy || typeof legacy !== 'object' || Array.isArray(legacy)) throw new Error('SESSION_S3_CONFIG_INVALID');
      const { S3SyncManager } = await import('@open-wa/session-sync');
      return new S3SyncManager({ ...legacy, ...config.s3Sync } as S3Config).acquireSessionFile(filename);
    },
  } : {}),
});
