import type { LoggerConfig } from './schema';

export function getDefaultConfig(): LoggerConfig {
    const isDev = process.env.NODE_ENV !== 'production';

    return {
        level: isDev ? 'debug' : 'info',
        format: isDev ? 'pretty' : 'json',
        transports: [
            {
                type: 'console',
                format: isDev ? 'pretty' : 'json',
            },
        ],
        includeStack: true,
    };
}
