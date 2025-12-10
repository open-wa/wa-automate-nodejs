import { Context, Next } from 'hono';

export function apiKeyMiddleware(apiKey: string) {
    return async (c: Context, next: Next) => {
        const key = c.req.query('api_key') || c.req.header('X-API-Key');

        if (!key || key !== apiKey) {
            // Return structured JSON error
            return c.json({ error: 'Unauthorized', details: 'Invalid or missing API key' }, 401);
        }

        return await next();
    };
}
