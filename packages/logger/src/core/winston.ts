import winston from 'winston';
import type { LogContext } from './context';
import type { LoggerConfig } from '../config/schema';
import { sanitizeLogContext } from '../security/sanitizer';
import { createTransport } from '../transports/index';

export function createWinstonLogger(config: LoggerConfig): winston.Logger {
    const transports = config.transports.map(t => createTransport(t));

    return winston.createLogger({
        level: config.level,
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.errors({ stack: config.includeStack }),
            sanitizingFormat(), // Custom format for scrubbing
            config.format === 'json'
                ? winston.format.json()
                : winston.format.prettyPrint()
        ),
        transports,
        exitOnError: false,
    });
}

// Custom format for sanitization
function sanitizingFormat() {
    return winston.format((info) => {
        // Sanitize the log context before output
        return {
            ...info,
            context: sanitizeLogContext((info.context ?? {}) as LogContext),
        };
    })();
}
