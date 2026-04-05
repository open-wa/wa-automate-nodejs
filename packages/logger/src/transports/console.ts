import winston from 'winston';
import type { TransportConfig } from '../config/schema';

export function createConsoleTransport(config: Extract<TransportConfig, { type: 'console' }>): winston.transport {
    return new winston.transports.Console({
        forceConsole: true,
        format: config.format === 'json'
            ? winston.format.json()
            : winston.format.simple(), // 'pretty' handled by main logger format if needed, or simple here
    });
}
