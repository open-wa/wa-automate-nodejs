import type Transport from 'winston-transport';

/**
 * Cloudflare Workers transport
 *
 * In Cloudflare Workers, we can't use traditional Winston transports.
 * Instead, we use console.log/error which Cloudflare captures automatically.
 *
 * This transport ensures logs are JSON-formatted for Cloudflare's log aggregation.
 */
export function createCloudflareTransport(config: any): Transport {
    const TransportStream = require('winston-transport');

    return new TransportStream({
        log(info: any, callback: () => void) {
            const output = JSON.stringify({
                timestamp: info.timestamp,
                level: info.level,
                message: info.message,
                component: info.component,
                context: info.context,
                ...info,
            });

            // Cloudflare captures console.log/error automatically
            if (info.level === 'error' || info.level === 'fatal') {
                console.error(output);
            } else {
                console.log(output);
            }

            callback();
        },
    });
}
