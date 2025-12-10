import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serve } from '@hono/node-server';
import { Server as SocketIOServer } from 'socket.io';
import { Registry, Config } from '@open-wa/schema';
import { apiKeyMiddleware } from '../middleware/api-key';
import { rateLimitMiddleware } from '../middleware/rate-limit';
import { SocketManager } from './socket-manager';

export class WAServer {
    private app: Hono;
    private io?: SocketIOServer;
    private config: Config;
    // @ts-ignore
    private _socketManager?: SocketManager;

    constructor(config: Config) {
        this.app = new Hono();
        this.config = config;
        this.setupMiddleware();
        this.registerRoutes();
    }

    private setupMiddleware() {
        // CORS
        const origin = this.parseCorsOrigin(this.config.cors);

        this.app.use('/*', cors({
            origin: origin,
            credentials: true
        }));

        // Logger
        if (this.config.logLevel !== 'silent') {
            this.app.use('*', logger());
        }

        // Rate limiting
        this.app.use('/api/*', rateLimitMiddleware(100, 60000));

        // API Key auth
        if (this.config.apiKey) {
            this.app.use('/api/*', apiKeyMiddleware(this.config.apiKey));
        }
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
        // Health check
        this.app.get('/health', (c) => c.json({
            status: 'ok',
            version: '5.0.0',
            socketMode: this.config.socketMode
        }));

        // QR endpoint (EZQR)
        this.app.get('/qr', (c) => {
            if (!this.latestQR) {
                return c.json({ error: 'QR code not available', note: 'Session might be connected or generating QR' }, 404);
            }
            return c.json({ qr: this.latestQR, note: 'Scan this QR code in WhatsApp' });
        });

        // List all endpoints
        this.app.get('/api', (c) => {
            const capabilities = Registry.getAllMethods();
            const endpoints = capabilities.map(cap => ({
                method: 'POST',
                path: `/ api / ${cap.name} `,
                name: cap.name,
                description: cap.metadata.description,
                category: cap.metadata.category,
            }));

            return c.json({ endpoints });
        });

        // Dynamic capability routes
        const capabilities = Registry.getAllMethods();
        capabilities.forEach((capability) => {
            const path = `/ api / ${capability.name} `;

            this.app.post(path, async (c) => {
                try {
                    const body = await c.req.json();
                    // Validate input using the schema
                    const validated = capability.inputSchema.parse(body);

                    // TODO: Execute actual WAPI method using the driver/client. 
                    // This will be hooked up to the actual client instance.
                    const result = { success: true, data: validated, method: capability.name };

                    return c.json(result);
                } catch (error: any) {
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

        // Socket.io setup
        if (this.config.socketMode) {
            // @ts-ignore
            this.io = new SocketIOServer(server as any, {
                cors: {
                    origin: this.parseCorsOrigin(this.config.cors),
                    methods: ["GET", "POST"],
                    credentials: true
                },
            });
            // Initialize Socket Manager
            this._socketManager = new SocketManager(this.io);

        }

        console.log(`Server running on http://${this.config.host}:${this.config.port}`);
    }

    public getApp() {
        return this.app;
    }

    public getIO() {
        return this.io;
    }
}
