import winston from 'winston';
import type { TransportConfig } from '../config/schema';
import { createConsoleTransport } from './console';
import { createFileTransport } from './file';
import { createElasticsearchTransport } from './elasticsearch';
import { createMQTransport } from './mq';
import { createCloudflareTransport } from './cloudflare';

export function createTransport(config: TransportConfig): winston.transport {
    switch (config.type) {
        case 'console':
            return createConsoleTransport(config);

        case 'file':
            return createFileTransport(config);

        case 'elasticsearch':
            return createElasticsearchTransport(config);

        case 'mq':
            return createMQTransport(config);

        case 'cloudflare':
            return createCloudflareTransport(config);

        default:
            throw new Error(`Unknown transport type: ${(config as any).type}`);
    }
}

// Re-export individual transport factories
export { createConsoleTransport as console } from './console';
export { createFileTransport as file } from './file';
export { createElasticsearchTransport as elasticsearch } from './elasticsearch';
export { createMQTransport as mq } from './mq';
export { createCloudflareTransport as cloudflare } from './cloudflare';
