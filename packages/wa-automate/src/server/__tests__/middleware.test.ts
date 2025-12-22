import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { WAServer } from '../server/hono-server';
import { Config, ConfigSchema } from '@open-wa/schema';

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Hono } from 'hono';
import { WAServer } from '../hono-server';
import type { Config, ConfigSchema } from '@open-wa/schema';

describe('Hono Middleware', () => {
    let app: Hono;

    beforeEach(() => {
        app = new Hono();
    });

    afterEach(() => {
        // Clean up
    });

    describe('CORS Middleware', () => {
        it('should allow configured origins', async () => {
            app.use('/*', cors({
                origin: ['https://example.com', 'http://localhost:3000'],
                credentials: true
            }));

            const res = await app.request('/test', {
                method: 'GET',
                headers: {
                    'Origin': 'https://example.com'
                }
            });

            expect(res.status).toBe(200);
        });

        it('should block unauthorized origins', async () => {
            app.use('/*', cors({
                origin: ['https://allowed.com'],
                credentials: true
            }));

            const res = await app.request('/test', {
                method: 'GET',
                headers: {
                    'Origin': 'https://blocked.com'
                }
            });

            expect(res.status).toBe(403);
        });
    });

    describe('API Key Authentication', () => {
        it('should allow requests with valid API key', async () => {
            app.use('/api/*', async (c, next) => {
                const apiKey = c.req.header('x-api-key');
                if (apiKey !== 'valid-key') {
                    return c.json({ error: 'Invalid API key' }, 401);
                }
                await next();
            });

            const res = await app.request('/api/test', {
                method: 'POST',
                headers: {
                    'x-api-key': 'valid-key'
                }
            });

            expect(res.status).toBe(200);
        });

        it('should reject requests without API key', async () => {
            app.use('/api/*', async (c, next) => {
                const apiKey = c.req.header('x-api-key');
                if (!apiKey) {
                    return c.json({ error: 'API key required' }, 401);
                }
                await next();
            });

            const res = await app.request('/api/test', {
                method: 'POST'
            });

            expect(res.status).toBe(401);
        });
    });

    describe('Rate Limiting', () => {
        it('should allow requests within rate limit', async () => {
            let requestCount = 0;
            
            app.use('/api/*', async (c, next) => {
                requestCount++;
                
                if (requestCount > 5) {
                    return c.json({ error: 'Too many requests' }, 429);
                }
                await next();
            });

            for (let i = 0; i < 5; i++) {
                const res = await app.request('/api/test', { method: 'POST' });
                expect(res.status).toBe(200);
            }

            const res = await app.request('/api/test', { method: 'POST' });
            expect(res.status).toBe(429);
        });

        it('should reset rate limit after time window', async () => {
            let requestCount = 0;
            let lastReset = Date.now();
            
            app.use('/api/*', async (c, next) => {
                const now = Date.now();
                
                if (now - lastReset > 10000) {
                    requestCount = 0;
                    lastReset = now;
                }
                
                requestCount++;
                
                if (requestCount > 5) {
                    return c.json({ error: 'Too many requests' }, 429);
                }
                await next();
            });

            for (let i = 0; i < 5; i++) {
                const res = await app.request('/api/test', { method: 'POST' });
                expect(res.status).toBe(200);
            }

            await new Promise(resolve => setTimeout(resolve, 11000));

            const res = await app.request('/api/test', { method: 'POST' });
            expect(res.status).toBe(200);
        });
    });

    describe('Request Logging', () => {
        it('should log requests when configured', async () => {
            const logs: any[] = [];
            
            app.use('*', async (c, next) => {
                logs.push({
                    method: c.req.method,
                    path: c.req.path,
                    headers: c.req.header()
                });
                await next();
            });

            await app.request('/api/test', { method: 'POST' });

            expect(logs.length).toBeGreaterThan(0);
            expect(logs.some(log => log.path === '/api/test')).toBe(true);
        });
    });

    describe('API Lifecycle', () => {
        it('should start full API in immediate mode', async () => {
            const config = ConfigSchema.parse({
                apiLifecycle: 'immediate',
                port: 8001,
                socketMode: false
            });

            const server = new WAServer(config);
            await server.start();

            const res = await server.getApp().request('/api/sendText', {
                method: 'POST',
                body: { to: 'test@c.us', content: 'test' }
            });

            expect(res.status).not.toBe(503);
        });

        it('should block API until connected in post-connection mode', async () => {
            const config = ConfigSchema.parse({
                apiLifecycle: 'post-connection',
                port: 8002,
                socketMode: false
            });

            const server = new WAServer(config);
            await server.start();

            const res = await server.getApp().request('/api/sendText', {
                method: 'POST',
                body: { to: 'test@c.us', content: 'test' }
            });

            expect(res.status).toBe(503);
        });

        it('should allow only QR endpoint in hybrid mode before connection', async () => {
            const config = ConfigSchema.parse({
                apiLifecycle: 'hybrid',
                port: 8003,
                socketMode: false
            });

            const server = new WAServer(config);
            await server.start();

            const qrRes = await server.getApp().request('/qr');
            expect(qrRes.status).toBe(200);

            const apiRes = await server.getApp().request('/api/sendText', {
                method: 'POST',
                body: { to: 'test@c.us', content: 'test' }
            });

            expect(apiRes.status).toBe(503);
        });
    });

    describe('Error Handling', () => {
        it('should handle validation errors properly', async () => {
            const config = ConfigSchema.parse({ port: 8004 });
            const server = new WAServer(config);
            
            server.setClient({
                sendText: async () => {
                    throw new Error('Internal server error');
                }
            } as any);

            await server.start();

            const res = await server.getApp().request('/api/sendText', {
                method: 'POST',
                body: { invalidField: 'test' }
            });

            expect(res.status).toBe(400);
            const body = await res.json();
            expect(body.error).toBe('Validation Error');
        });

        it('should handle internal server errors', async () => {
            const config = ConfigSchema.parse({ port: 8005 });
            const server = new WAServer(config);
            
            server.setClient({
                sendText: async () => {
                    throw new Error('Internal server error');
                }
            } as any);

            await server.start();

            const res = await server.getApp().request('/api/sendText', {
                method: 'POST',
                body: { to: 'test@c.us', content: 'test' }
            });

            expect(res.status).toBe(500);
        });
    });

    describe('Health Check', () => {
        it('should return server status', async () => {
            const config = ConfigSchema.parse({ port: 8006 });
            const server = new WAServer(config);
            await server.start();

            const res = await server.getApp().request('/health');

            expect(res.status).toBe(200);
            const body = await res.json();
            expect(body).toEqual({
                status: 'ok',
                version: '5.0.0',
                socketMode: false,
                connected: false
            });
        });
    });

    describe('QR Endpoint', () => {
        it('should return 404 when no QR available', async () => {
            const config = ConfigSchema.parse({ port: 8007 });
            const server = new WAServer(config);
            await server.start();

            const res = await server.getApp().request('/qr');

            expect(res.status).toBe(404);
            const body = await res.json();
            expect(body.error).toBe('QR code not available');
        });

        it('should return QR when available', async () => {
            const config = ConfigSchema.parse({ port: 8008 });
            const server = new WAServer(config);
            await server.start();

            server.setQR('sample-qr-code');
            const res = await server.getApp().request('/qr');

            expect(res.status).toBe(200);
            const body = await res.json();
            expect(body).toEqual({
                qr: 'sample-qr-code',
                note: 'Scan this QR code in WhatsApp'
            });
        });
    });
});

    afterEach(() => {
        // Clean up
    });

    describe('CORS Middleware', () => {
        it('should allow configured origins', async () => {
            app.use('/*', cors({
                origin: ['https://example.com', 'http://localhost:3000'],
                credentials: true
            }));

            const res = await app.request('/test', {
                method: 'GET',
                headers: {
                    'Origin': 'https://example.com'
                }
            });

            expect(res.status).toBe(200);
        });

        it('should block unauthorized origins', async () => {
            app.use('/*', cors({
                origin: ['https://allowed.com'],
                credentials: true
            }));

            const res = await app.request('/test', {
                method: 'GET',
                headers: {
                    'Origin': 'https://blocked.com'
                }
            });

            expect(res.status).toBe(403);
        });
    });

    describe('API Key Authentication', () => {
        it('should allow requests with valid API key', async () => {
            app.use('/api/*', async (c, next) => {
                const apiKey = c.req.header('x-api-key');
                if (apiKey !== 'valid-key') {
                    return c.json({ error: 'Invalid API key' }, 401);
                }
                await next();
            });

            const res = await app.request('/api/test', {
                method: 'POST',
                headers: {
                    'x-api-key': 'valid-key'
                }
            });

            expect(res.status).toBe(200);
        });

        it('should reject requests without API key', async () => {
            app.use('/api/*', async (c, next) => {
                const apiKey = c.req.header('x-api-key');
                if (!apiKey) {
                    return c.json({ error: 'API key required' }, 401);
                }
                await next();
            });

            const res = await app.request('/api/test', {
                method: 'POST'
            });

            expect(res.status).toBe(401);
        });
    });

    describe('Rate Limiting', () => {
        it('should allow requests within rate limit', async () => {
            let requestCount = 0;
            
            app.use('/api/*', async (c, next) => {
                requestCount++;
                
                // Simple rate limit: 5 requests per minute
                if (requestCount > 5) {
                    return c.json({ error: 'Too many requests' }, 429);
                }
                await next();
            });

            // Make 5 requests within limit
            for (let i = 0; i < 5; i++) {
                const res = await app.request('/api/test', { method: 'POST' });
                expect(res.status).toBe(200);
            }

            // Next request should be rate limited
            const res = await app.request('/api/test', { method: 'POST' });
            expect(res.status).toBe(429);
        });

        it('should reset rate limit after time window', async () => {
            let requestCount = 0;
            let lastReset = Date.now();
            
            app.use('/api/*', async (c, next) => {
                const now = Date.now();
                
                // Reset every 10 seconds for testing
                if (now - lastReset > 10000) {
                    requestCount = 0;
                    lastReset = now;
                }
                
                requestCount++;
                
                if (requestCount > 5) {
                    return c.json({ error: 'Too many requests' }, 429);
                }
                await next();
            });

            // Make 5 requests, wait for reset
            for (let i = 0; i < 5; i++) {
                const res = await app.request('/api/test', { method: 'POST' });
                expect(res.status).toBe(200);
            }

            // Wait for reset
            await new Promise(resolve => setTimeout(resolve, 11000));

            // Should be allowed again
            const res = await app.request('/api/test', { method: 'POST' });
            expect(res.status).toBe(200);
        });
    });

    describe('Request Logging', () => {
        it('should log requests when configured', async () => {
            const logs: any[] = [];
            
            app.use('*', async (c, next) => {
                logs.push({
                    method: c.req.method,
                    path: c.req.path,
                    headers: c.req.header()
                });
                await next();
            });

            // Make a request to generate logs
            await app.request('/api/test', { method: 'POST' });

            expect(logs.length).toBeGreaterThan(0);
            expect(logs.some(log => log.path === '/api/test')).toBe(true);
        });
    });

    describe('API Lifecycle', () => {
        it('should start full API in immediate mode', async () => {
            const config = ConfigSchema.parse({
                apiLifecycle: 'immediate',
                port: 8001,
                socketMode: false
            });

            const server = new WAServer(config);
            await server.start();

            // API should be available immediately
            const res = await server.getApp().request('/api/sendText', {
                method: 'POST',
                body: { to: 'test@c.us', content: 'test' }
            });

            expect(res.status).not.toBe(503);
        });

        it('should block API until connected in post-connection mode', async () => {
            const config = ConfigSchema.parse({
                apiLifecycle: 'post-connection',
                port: 8002,
                socketMode: false
            });

            const server = new WAServer(config);
            await server.start();

            // API should not be available until connected
            const res = await server.getApp().request('/api/sendText', {
                method: 'POST',
                body: { to: 'test@c.us', content: 'test' }
            });

            expect(res.status).toBe(503);
        });

        it('should allow only QR endpoint in hybrid mode before connection', async () => {
            const config = ConfigSchema.parse({
                apiLifecycle: 'hybrid',
                port: 8003,
                socketMode: false
            });

            const server = new WAServer(config);
            await server.start();

            // QR should be available
            const qrRes = await server.getApp().request('/qr');
            expect(qrRes.status).toBe(200);

            // API should not be available until connected
            const apiRes = await server.getApp().request('/api/sendText', {
                method: 'POST',
                body: { to: 'test@c.us', content: 'test' }
            });

            expect(apiRes.status).toBe(503);
        });
    });

    describe('Error Handling', () => {
        it('should handle validation errors properly', async () => {
            const config = ConfigSchema.parse({ port: 8004 });
            const server = new WAServer(config);
            await server.start();

            const res = await server.getApp().request('/api/sendText', {
                method: 'POST',
                body: { invalidField: 'test' } // Missing required fields
            });

            expect(res.status).toBe(400);
            const body = await res.json();
            expect(body.error).toBe('Validation Error');
        });

        it('should handle internal server errors', async () => {
            const config = ConfigSchema.parse({ port: 8005 });
            const server = new WAServer(config);
            
            // Mock server to throw error
            server.setClient({
                sendText: async () => {
                    throw new Error('Internal server error');
                }
            } as any);

            await server.start();

            const res = await server.getApp().request('/api/sendText', {
                method: 'POST',
                body: { to: 'test@c.us', content: 'test' }
            });

            expect(res.status).toBe(500);
        });
    });

    describe('Health Check', () => {
        it('should return server status', async () => {
            const config = ConfigSchema.parse({ port: 8006 });
            const server = new WAServer(config);
            await server.start();

            const res = await server.getApp().request('/health');

            expect(res.status).toBe(200);
            const body = await res.json();
            expect(body).toEqual({
                status: 'ok',
                version: '5.0.0',
                socketMode: false,
                connected: false
            });
        });
    });

    describe('QR Endpoint', () => {
        it('should return 404 when no QR available', async () => {
            const config = ConfigSchema.parse({ port: 8007 });
            const server = new WAServer(config);
            await server.start();

            const res = await server.getApp().request('/qr');

            expect(res.status).toBe(404);
            const body = await res.json();
            expect(body.error).toBe('QR code not available');
        });

        it('should return QR when available', async () => {
            const config = ConfigSchema.parse({ port: 8008 });
            const server = new WAServer(config);
            await server.start();

            server.setQR('sample-qr-code');
            const res = await server.getApp().request('/qr');

            expect(res.status).toBe(200);
            const body = await res.json();
            expect(body).toEqual({
                qr: 'sample-qr-code',
                note: 'Scan this QR code in WhatsApp'
            });
        });
    });
});