import winston from 'winston';
import type { TransportConfig } from '../config/schema';

export function createFileTransport(config: Extract<TransportConfig, { type: 'file' }>): winston.transport {
    return new winston.transports.File({
        filename: config.path,
        maxsize: config.maxSize,
        maxFiles: config.maxFiles,
    });
}
