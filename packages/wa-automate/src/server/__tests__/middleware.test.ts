import { describe, it, expect, vi as jest } from 'vitest';
import { WAServer } from '../hono-server';
import { ConfigSchema } from '@open-wa/config';

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

            const res = await server.getApp().request('/api/sendText', {
                method: 'POST',
                body: JSON.stringify({ to: 'test@c.us', content: 'test' }),
                headers: { 'Content-Type': 'application/json' }
            });

            expect(res.status).toBe(503);
            await expect(res.json()).resolves.toMatchObject({
                error: 'API not available until the session is truly ready',
                status: 503,
            });
        });
    });

    describe('Health Check', () => {
        it('should return server status', async () => {
            const config = ConfigSchema.parse({ sessionId: 'test', port: 8006 });
            const server = new WAServer(config);

            const res = await server.getApp().request('/health');

            expect(res.status).toBe(200);
            const body = (await res.json()) as Record<string, any>;
            expect(body).toMatchObject({
                status: 'ok',
                version: '5.0.0',
                host: {
                    available: true,
                    api: true,
                },
            });
            expect(body.session).toMatchObject({
                ready: false,
            });
        });

        it('should report host availability separately from session readiness', async () => {
            const config = ConfigSchema.parse({ sessionId: 'test', port: 8008, apiLifecycle: 'post-connection' });
            const server = new WAServer(config);

            server.setReadinessProvider(() => ({
                ready: false,
                status: 'not_ready',
                state: 'AUTHENTICATING',
                exposureSafe: false,
                pending: ['runtimeUsable', 'finalization'],
                blockers: [],
            }));

            const res = await server.getApp().request('/health');

            expect(res.status).toBe(200);
            await expect(res.json()).resolves.toMatchObject({
                status: 'ok',
                connected: false,
                host: {
                    available: true,
                    api: true,
                },
                session: {
                    ready: false,
                    status: 'not_ready',
                    state: 'AUTHENTICATING',
                    pending: ['runtimeUsable', 'finalization'],
                },
            });
        });
    });

    describe('Client method invocation', () => {
        it('should invoke client methods using positional argument order', async () => {
            const config = ConfigSchema.parse({ sessionId: 'test', port: 8007, apiLifecycle: 'immediate' });
            const server = new WAServer(config);
            const sendText = jest.fn().mockResolvedValue('mock-message-id');

            server.setClient({
                isConnected: () => true,
                sendText,
            });

            const res = await server.getApp().request('/api/sendText', {
                method: 'POST',
                body: JSON.stringify({ to: '123@c.us', content: 'hello' }),
                headers: { 'Content-Type': 'application/json' },
            });

            expect(res.status).toBe(200);
            expect(sendText).toHaveBeenCalledWith('123@c.us', 'hello', undefined);
            await expect(res.json()).resolves.toMatchObject({ success: true, data: 'mock-message-id' });
        });
    });
});
