import { Client } from '@elastic/elasticsearch';

export interface ElasticConfig {
    url: string;
    username?: string;
    password?: string;
    maxBufferSize?: number;
    pipeline?: string;
    indexPrefix?: string;
}

export interface RequestRecord {
    '@timestamp': string;
    method: string;
    path: string;
    status: number;
    duration: number;
    requestHeaders?: Record<string, string>;
    responseHeaders?: Record<string, string>;
    ip?: string;
    userAgent?: string;
    [key: string]: any;
}

export class ElasticEmitter {
    private client: Client;
    private buffer: RequestRecord[] = [];
    private maxBufferSize: number;
    private pipeline?: string;
    private indexPrefix: string;
    private flushInterval: NodeJS.Timeout;

    constructor(config: ElasticConfig) {
        this.client = new Client({
            node: config.url,
            auth: config.username && config.password
                ? { username: config.username, password: config.password }
                : undefined,
        });

        this.maxBufferSize = config.maxBufferSize || 50;
        this.pipeline = config.pipeline;
        this.indexPrefix = config.indexPrefix || 'open-wa-';

        // Auto-flush every 30 seconds
        this.flushInterval = setInterval(() => {
            void this.flush();
        }, 30000);
    }

    async processRecord(record: RequestRecord): Promise<void> {
        this.buffer.push(record);

        if (this.buffer.length >= this.maxBufferSize) {
            await this.flush();
        }
    }

    async flush(): Promise<void> {
        if (this.buffer.length === 0) return;

        const records = [...this.buffer];
        this.buffer = [];

        try {
            const body = records.flatMap((doc) => [
                { index: { _index: `${this.indexPrefix}${new Date().toISOString().slice(0, 7)}` } },
                doc,
            ]);

            await this.client.bulk({
                body,
                pipeline: this.pipeline,
            });

            console.log(`Flushed ${records.length} records to ElasticSearch`);
        } catch (error) {
            console.error('ElasticSearch flush failed:', error);
            // Put records back in buffer
            this.buffer.unshift(...records);
        }
    }

    async close(): Promise<void> {
        clearInterval(this.flushInterval);
        await this.flush();
        await this.client.close();
    }
}
