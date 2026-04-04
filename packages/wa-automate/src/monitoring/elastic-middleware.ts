import { Context, Next } from 'hono';
import { ElasticEmitter, ElasticDoc } from './elastic';

export function elasticMiddleware(
    emitter: ElasticEmitter,
    sanitize?: (record: Partial<ElasticDoc>) => void
) {
    return async (c: Context, next: Next) => {
        const start = Date.now();

        await next();

        const duration = Date.now() - start;

        const record: Partial<ElasticDoc> = {
            message: `Request to ${c.req.path}`,
            method: c.req.method,
            path: c.req.path,
            statusCode: c.res.status,
            duration,
            userAgent: c.req.header('user-agent'),
            ip: c.req.header('x-real-ip') || c.req.header('x-forwarded-for'),
        };

        // Sanitize sensitive data
        if (sanitize) {
            sanitize(record);
        }

        emitter.log(record as any);
    };
}
