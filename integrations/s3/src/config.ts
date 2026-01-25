export type CloudProvider = 'aws' | 'gcp' | 'do' | 'wasabi' | 'backblaze';

export enum DirectoryStrategy {
  DATE = 'DATE',
  CHAT = 'CHAT',
  DATE_CHAT = 'DATE_CHAT',
  CHAT_DATE = 'CHAT_DATE',
}

export interface S3Config {
  provider: CloudProvider;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  region?: string;
  public?: boolean;
  directory?: DirectoryStrategy | string;
  ignoreHostAccount?: boolean;
  headers?: Record<string, string>;
}
