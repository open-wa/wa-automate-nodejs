import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serve } from '@hono/node-server';
import { Server as SocketIOServer } from 'socket.io';
import { Config } from '@open-wa/schema';
import { getHttpMethodDefinitions, HttpMethodDefinition } from '@open-wa/schema/http-manifest';
import '@open-wa/schema/methods';
import { apiKeyMiddleware } from '../middleware/api-key';
import { rateLimitMiddleware } from '../middleware/rate-limit';
import { SocketManager } from './socket-manager';
import { ElasticEmitter } from '../monitoring/elastic';
import { invokeClientMethod } from './invoke-client-method';

export class WAServer {
    private app: Hono;
    private io?: SocketIOServer;
    private config: Config;
    // @ts-ignore
    private _socketManager?: SocketManager;
    private client: any;
    private elasticEmitter?: ElasticEmitter;

    constructor(config: Config) {
        this.app = new Hono();
        this.config = config;
        this.setupMiddleware();
        this.registerRoutes();
        
        if (config.elasticUrl) {
            this.elasticEmitter = new ElasticEmitter({
                url: config.elasticUrl,
                username: config.elasticUsername,
                password: config.elasticPassword,
                bufferSize: config.elasticBufferSize,
                pipeline: config.elasticPipeline,
                indexPrefix: config.elasticIndexPrefix
            });
        }
    }

    public setClient(client: any) {
        this.client = client;
        if (this._socketManager) {
            this._socketManager.setClient(client);
        }
    }
    
    private isSessionConnected() {
        if (!this.client) return false;
        return this.client.isConnected ? this.client.isConnected() : false;
    }

    private setupMiddleware() {
        const origin = this.parseCorsOrigin(this.config.cors);

        this.app.use('/*', cors({
            origin: origin,
            credentials: true
        }));

        if (this.config.logLevel !== 'silent') {
            this.app.use('*', logger());
        }

        this.app.use('/api/*', rateLimitMiddleware(100, 60000));

        if (this.config.apiKey) {
            this.app.use('/api/*', apiKeyMiddleware(this.config.apiKey));
        }
        
        this.app.use('/api/*', async (c, next) => {
             if (this.config.apiLifecycle === 'post-connection' && !this.isSessionConnected()) {
                 return c.json({ error: 'API not available until connected', status: 503 }, 503);
             }
             
             if (this.config.apiLifecycle === 'hybrid' && !this.isSessionConnected()) {
                  return c.json({ error: 'API not available until connected', status: 503 }, 503);
             }
             
             return await next();
        });
    }

    private parseCorsOrigin(corsConfig: string | string[]): string | string[] | ((origin: string) => string | undefined | null) {
        if (corsConfig === '*') return '*';
        if (Array.isArray(corsConfig)) return corsConfig;
        if (typeof corsConfig === 'string') {
            if (corsConfig.includes(',')) {
                return corsConfig.split(',').map(o => o.trim());
            }
            return corsConfig;
        }
        return '*';
    }

    private latestQR: string | null = null;

    public setQR(qr: string) {
        this.latestQR = qr;
    }

    private registerRoutes() {
        const methodDefinitions = getHttpMethodDefinitions();

        this.app.get('/health', (c) => c.json({
            status: 'ok',
            version: '5.0.0',
            socketMode: this.config.socketMode,
            connected: this.isSessionConnected()
        }));

        this.app.get('/qr', (c) => {
            if (!this.latestQR) {
                return c.json({ error: 'QR code not available', note: 'Session might be connected or generating QR' }, 404);
            }
            return c.json({ qr: this.latestQR, note: 'Scan this QR code in WhatsApp' });
        });

        this.app.get('/api', (c) => {
            const endpoints = methodDefinitions.map((def) => ({
                method: 'POST',
                path: def.path,
                name: def.functionName,
                description: def.description,
                category: def.namespace,
            }));

            return c.json({ endpoints });
        });

        methodDefinitions.forEach((def: HttpMethodDefinition) => {
            const methodName = def.functionName;
            const path = def.path;
            const inputSchema = def.inputSchema;

            this.app.post(path, async (c) => {
                const startTime = Date.now();
                try {
                    const body = await c.req.json();
                    
                    const validated = inputSchema.parse(body);
                    const result = await invokeClientMethod(this.client, def, validated);

                    if (this.elasticEmitter) {
                        this.elasticEmitter.log({
                            level: 'info',
                            component: 'api',
                            method: methodName,
                            sessionId: this.config.sessionId,
                            requestId: c.get('requestId'),
                            duration: Date.now() - startTime,
                            statusCode: 200,
                            message: `Successfully executed ${methodName}`
                        });
                    }

                    return c.json({ success: true, data: result });
                } catch (error: any) {
                    if (this.elasticEmitter) {
                        this.elasticEmitter.log({
                            level: 'error',
                            component: 'api',
                            method: methodName,
                            sessionId: this.config.sessionId,
                            requestId: c.get('requestId'),
                            duration: Date.now() - startTime,
                            statusCode: 500,
                            message: error.message || 'Internal Server Error'
                        });
                    }

                    if (error?.name === 'ZodError') {
                        return c.json({ error: 'Validation Error', details: error.errors }, 400);
                    }
                    return c.json({ error: error.message || 'Internal Server Error' }, 500);
                }
            });
        });
    }

    public async start() {
        const server = serve({
            fetch: this.app.fetch,
            port: this.config.port,
            hostname: this.config.host,
        });

        if (this.config.socketMode) {
            this.io = new SocketIOServer(server, {
                cors: {
                    origin: this.parseCorsOrigin(this.config.cors),
                    methods: ["GET", "POST"],
                    credentials: true
                },
            });
            this._socketManager = new SocketManager(this.io);
            if (this.client) {
                this._socketManager.setClient(this.client);
            }
        }

        if (this.elasticEmitter) {
            await this.elasticEmitter.start();
        }

        console.log(`Server running on http://${this.config.host}:${this.config.port}`);
    }

    public async stop() {
        if (this.elasticEmitter) {
            await this.elasticEmitter.stop();
        }
    }

    public getApp() {
        return this.app;
    }

    public getIO() {
        return this.io;
    }

}
