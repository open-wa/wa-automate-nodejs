import { Context, Next } from 'hono';
import { ElasticEmitter, RequestRecord } from './elastic';

export function elasticMiddleware(
    emitter: ElasticEmitter,
    sanitize?: (record: RequestRecord) => void
) {
    return async (c: Context, next: Next) => {
        const start = Date.now();

        await next();

        const duration = Date.now() - start;

        const record: RequestRecord = {
            '@timestamp': new Date().toISOString(),
            method: c.req.method,
            path: c.req.path,
            status: c.res.status,
            duration,
            requestHeaders: Object.fromEntries((c.req.raw.headers as any).entries()),
            responseHeaders: Object.fromEntries((c.res.headers as any).entries()),
            ip: c.req.header('x-real-ip') || c.req.header('x-forwarded-for'),
            userAgent: c.req.header('user-agent'),
        };

        // Sanitize sensitive data
        if (sanitize) {
            sanitize(record);
        } else {
            // Default sanitization
            if (record.requestHeaders) {
                delete record.requestHeaders.authorization;
                delete record.requestHeaders['x-api-key'];
            }
        }

        await emitter.processRecord(record);
    };
}
