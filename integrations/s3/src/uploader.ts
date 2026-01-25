import PQueue from 'p-queue';
import { upload, getCloudUrl } from 'pico-s3';
import mime from 'mime';
import type { Logger } from '@open-wa/logger';
import { type S3Config, DirectoryStrategy } from './config.js';

interface MediaMessage {
  mId?: string;
  mimetype: string;
  from: string;
  fromMe?: boolean;
  deprecatedMms3Url?: string;
}

interface WAClient {
  decryptMedia: (message: unknown) => Promise<string>;
}

interface S3UploadOpts {
  file: string;
  filename: string;
  provider: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  region?: string;
  public?: boolean;
  headers?: Record<string, string>;
  directory?: string;
}

export class S3Uploader {
  private readonly config: S3Config;
  private readonly logger: Logger;
  private readonly uploadQueue: PQueue;
  private readonly processedFiles: Set<string> = new Set();

  constructor(config: S3Config, logger: Logger) {
    this.config = config;
    this.logger = logger;
    this.uploadQueue = new PQueue({
      concurrency: 2,
      interval: 1000,
      intervalCap: 2,
    });
  }

  async uploadMedia(message: MediaMessage, client: WAClient): Promise<string | null> {
    if (!message.deprecatedMms3Url || !message.mimetype) {
      return null;
    }

    if (message.fromMe && this.config.ignoreHostAccount) {
      return null;
    }

    const extension = mime.getExtension(message.mimetype) ?? 'bin';
    const filename = `${message.mId ?? Date.now()}.${extension}`;

    if (this.processedFiles.has(filename)) {
      return this.getCloudUrlForFile(filename);
    }

    try {
      const mediaData = await client.decryptMedia(message);
      const opts = this.buildUploadOptions(filename, mediaData, message.from);

      this.processedFiles.add(filename);
      await this.uploadQueue.add(() => upload(opts as never).catch(() => undefined));

      return this.getCloudUrlForFile(filename);
    } catch (error) {
      this.logger.error(`Upload error: ${(error as Error).message}`);
      return null;
    }
  }

  getCloudUrlForFile(filename: string): string {
    const opts: S3UploadOpts = {
      file: '',
      filename,
      provider: this.config.provider,
      accessKeyId: this.config.accessKeyId,
      secretAccessKey: this.config.secretAccessKey,
      bucket: this.config.bucket,
      region: this.config.region,
      public: this.config.public,
    };
    return getCloudUrl(opts as never);
  }

  private buildUploadOptions(filename: string, mediaData: string, from: string): S3UploadOpts {
    const opts: S3UploadOpts = {
      file: mediaData,
      filename,
      provider: this.config.provider,
      accessKeyId: this.config.accessKeyId,
      secretAccessKey: this.config.secretAccessKey,
      bucket: this.config.bucket,
      region: this.config.region,
      public: this.config.public,
      headers: this.config.headers,
    };

    const directory = this.resolveDirectory(from);
    if (directory) {
      opts.directory = directory;
    }

    return opts;
  }

  private resolveDirectory(from: string): string | undefined {
    const dirStrat = this.config.directory;
    if (!dirStrat) return undefined;

    const cleanFrom = from.replace('@c.us', '').replace('@g.us', '');
    const dateStr = new Date().toISOString().slice(0, 10);

    switch (dirStrat) {
      case DirectoryStrategy.DATE:
        return dateStr;
      case DirectoryStrategy.CHAT:
        return cleanFrom;
      case DirectoryStrategy.DATE_CHAT:
        return `${dateStr}/${cleanFrom}`;
      case DirectoryStrategy.CHAT_DATE:
        return `${cleanFrom}/${dateStr}`;
      default:
        return typeof dirStrat === 'string' ? dirStrat : undefined;
    }
  }

  async waitForQueue(): Promise<void> {
    await this.uploadQueue.onIdle();
  }
}
