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
            ...config
        };
        
        this.client = new ElasticClient({
            node: this.config.url,
            auth: this.config.username && this.config.password ? {
                username: this.config.username,
                password: this.config.password
            } : undefined,
            maxRetries: 3,
            requestTimeout: 5000,
            sniffOnStart: true
        });
    }

    public async start(): Promise<void> {
        try {
            await this.client.ping();
            console.log('ElasticSearch connected');
            
            // Setup periodic flush
            const flushIntervalMs = 10000; // 10 seconds
            this.flushInterval = setInterval(() => {
                this.flush();
            }, flushIntervalMs);

        } catch (error) {
            console.error('Failed to connect to ElasticSearch:', error);
            throw error;
        }
    }

    public log(logEntry: Omit<ElasticDoc, 'timestamp'>): void {
        const fullDoc: ElasticDoc = {
            timestamp: new Date().toISOString(),
            level: logEntry.level || 'info',
            message: logEntry.message,
            component: logEntry.component,
            sessionId: logEntry.sessionId,
            schemaId: logEntry.schemaId,
            requestId: logEntry.requestId,
            driver: logEntry.driver,
            method: logEntry.method,
            event: logEntry.event,
            duration: logEntry.duration,
            statusCode: logEntry.statusCode,
            userAgent: logEntry.userAgent,
            ip: logEntry.ip,
            ...logEntry
        };

        this.buffer.push(fullDoc);

        if (this.buffer.length >= (this.config.bufferSize || 50)) {
            this.flush();
        }
    }

    public async flush(): Promise<void> {
        if (this.buffer.length === 0) return;

        const docs = [...this.buffer];
        this.buffer = [];

        try {
            const indexName = `${this.config.indexPrefix}${new Date().toISOString().split('T')[0]}`;
            
            const body = docs.flatMap(_document => [
                { 
                    index: { 
                        _index: indexName 
                    }, 
                    create: {} 
                }
            ]);

            const response = await this.client.bulk({ body });

            if (response.errors) {
                console.error('ElasticSearch bulk index errors:', response.items.filter((item: any) => item.index?.error));
            } else {
                console.log(`Indexed ${docs.length} documents to ElasticSearch`);
            }

            // Add pipeline if specified
            if (this.config.pipeline) {
                const pipelineResponse = await this.client.bulk({
                    body: docs.flatMap(_document => [
                        { index: { _index: indexName, pipeline: this.config.pipeline } },
                        { create: {} }
                    ])
                });

                if (pipelineResponse.errors) {
                    console.error('ElasticSearch pipeline errors:', pipelineResponse.items.filter((item: any) => item.index?.error));
                }
            }

        } catch (error) {
            console.error('Failed to flush to ElasticSearch:', error);
            // Put documents back in buffer to retry later
            this.buffer.unshift(...docs);
        }
    }

    public async stop(): Promise<void> {
        if (this.flushInterval) {
            clearInterval(this.flushInterval);
        }
        
        await this.flush();
        
        try {
            await this.client.close();
        } catch (error) {
            console.error('Error closing ElasticSearch client:', error);
        }
    }

    public sanitizeHeaders(doc: Partial<ElasticDoc>): ElasticDoc {
        const sanitized = { ...doc };
        
        // Remove sensitive headers
        const sensitiveKeys = ['authorization', 'cookie', 'password', 'token'];
        if (sanitized.userAgent) {
            sanitized.userAgent = '[REDACTED]';
        }
        if (sanitized.ip) {
            sanitized.ip = '[REDACTED]';
        }
        
        Object.keys(sanitized).forEach(key => {
            if (sensitiveKeys.includes(key.toLowerCase())) {
                delete (sanitized as any)[key];
            }
        });

        return sanitized as ElasticDoc;
    }
}
