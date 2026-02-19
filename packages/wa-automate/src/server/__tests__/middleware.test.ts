import { describe, it, expect } from 'vitest';
import { WAServer } from '../hono-server';
import { ConfigSchema } from '@open-wa/schema';

describe('Hono Middleware', () => {
    describe('API Lifecycle', () => {
        it('should start full API in immediate mode', async () => {
            const config = ConfigSchema.parse({
                sessionId: 'test',
                apiLifecycle: 'immediate',
                port: 8001,
                socketMode: false
            });

            const server = new WAServer(config);
            await server.start();

            const res = await server.getApp().request('/api/sendText', {
                method: 'POST',
                body: JSON.stringify({ to: 'test@c.us', content: 'test' }),
                headers: { 'Content-Type': 'application/json' }
            });

            expect(res.status).not.toBe(503);
        });

        it('should block API until connected in post-connection mode', async () => {
            const config = ConfigSchema.parse({
                sessionId: 'test',
                apiLifecycle: 'post-connection',
                port: 8002,
                socketMode: false
            });

            const server = new WAServer(config);
            await server.start();

            const res = await server.getApp().request('/api/sendText', {
                method: 'POST',
                body: JSON.stringify({ to: 'test@c.us', content: 'test' }),
                headers: { 'Content-Type': 'application/json' }
            });

            expect(res.status).toBe(503);
        });
    });

    describe('Health Check', () => {
        it('should return server status', async () => {
            const config = ConfigSchema.parse({ sessionId: 'test', port: 8006 });
            const server = new WAServer(config);
            await server.start();

            const res = await server.getApp().request('/health');

            expect(res.status).toBe(200);
            const body = await res.json();
            expect(body).toMatchObject({
                status: 'ok',
                version: '5.0.0',
            });
        });
    });
});
