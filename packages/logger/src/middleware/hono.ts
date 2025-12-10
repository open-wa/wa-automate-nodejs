import type { MiddlewareHandler } from 'hono';
import { rootLogger } from '../core/logger';

export const honoLogger = (): MiddlewareHandler => {
    return async (c, next) => {
        const start = Date.now();
        const { method, path } = c.req;

        // Log request start (optional, maybe debug only)
        rootLogger.instance.debug('Incoming Request', {
            component: 'http',
            'http.method': method,
            'http.path': path,
        });

        try {
            await next();
        } catch (err: unknown) {
            const error = err instanceof Error ? err : new Error(String(err));
            const latency = Date.now() - start;

            rootLogger.instance.error('Request Error', {
                component: 'http',
                'http.method': method,
                'http.path': path,
                'http.statusCode': 500,
                'http.latencyMs': latency,
                error: error,
            });
            throw err;
        }

        const latency = Date.now() - start;
        const status = c.res.status;

        const level = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';

        rootLogger.instance[level]('Request Completed', {
            component: 'http',
            'http.method': method,
            'http.path': path,
            'http.statusCode': status,
            'http.latencyMs': latency,
        });
    };
};
