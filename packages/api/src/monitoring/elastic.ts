import { Client as ElasticClient } from '@elastic/elasticsearch';

export interface ElasticConfig {
  url: string;
  username?: string;
  password?: string;
  bufferSize?: number;
  pipeline?: string;
  indexPrefix?: string;
}

export interface ElasticDoc {
  timestamp: string;
  level?: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  component?: string;
  sessionId?: string;
  schemaId?: string;
  requestId?: string;
  driver?: string;
  method?: string;
  event?: string;
  duration?: number;
  statusCode?: number;
  userAgent?: string;
  ip?: string;
  [key: string]: any;
}

export class ElasticEmitter {
  private client: ElasticClient;
  private config: ElasticConfig;
  private buffer: ElasticDoc[] = [];
  private flushInterval?: NodeJS.Timeout;

  constructor(config: ElasticConfig) {
    this.config = {
      bufferSize: 50,
      indexPrefix: 'open-wa-',
      ...config,
    };

    this.client = new ElasticClient({
      node: this.config.url,
      auth:
        this.config.username && this.config.password
          ? {
              username: this.config.username,
              password: this.config.password,
            }
          : undefined,
      maxRetries: 3,
      requestTimeout: 5000,
      sniffOnStart: true,
    });
  }

  public async start(): Promise<void> {
    await this.client.ping();
    this.flushInterval = setInterval(() => {
      void this.flush();
    }, 10000);
  }

  public log(logEntry: Omit<ElasticDoc, 'timestamp'>): void {
    this.buffer.push({
      timestamp: new Date().toISOString(),
      level: logEntry.level || 'info',
      ...logEntry,
    });

    if (this.buffer.length >= (this.config.bufferSize || 50)) {
      void this.flush();
    }
  }

  public async flush(): Promise<void> {
    if (this.buffer.length === 0) {
      return;
    }

    const docs = [...this.buffer];
    this.buffer = [];
    const indexName = `${this.config.indexPrefix}${new Date().toISOString().split('T')[0]}`;

    try {
      await this.client.bulk({
        body: docs.flatMap((document) => [{ index: { _index: indexName } }, document]),
      });
    } catch (error) {
      console.error('Failed to flush to ElasticSearch:', error);
      this.buffer.unshift(...docs);
    }
  }

  public async stop(): Promise<void> {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }

    await this.flush();
    await this.client.close();
  }
}
