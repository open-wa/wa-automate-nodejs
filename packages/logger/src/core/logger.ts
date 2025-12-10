import winston from 'winston';
import type { LoggerConfig } from '../config/schema';
import { getDefaultConfig } from '../config/defaults';
import { createWinstonLogger } from './winston';
import { sanitizeLogContext } from '../security/sanitizer';
import type { LogContext } from './context';
import type { LogLevel } from "./levels"
export * from './context';
export * from './levels';

let rootWinstonLogger: winston.Logger | null = null;

export function initializeLogger(config: LoggerConfig): void {
    rootWinstonLogger = createWinstonLogger(config);
}

export const rootLogger = {
    get instance() {
        if (!rootWinstonLogger) {
            // Auto-initialize with defaults if not explicitly initialized
            initializeLogger(getDefaultConfig());
        }
        return rootWinstonLogger!;
    }
};

export interface LoggerInterface {
    debug(message: string, meta?: LogContext): void;
    info(message: string, meta?: LogContext): void;
    warn(message: string, meta?: LogContext): void;
    error(message: string, meta?: LogContext & { error?: unknown }): void;
    fatal(message: string, meta?: LogContext & { error?: unknown }): void;

    // Child logger with bound context
    child(context: LogContext): LoggerInterface;

    // Utilities
    withContext(context: LogContext): LoggerInterface;
    setLevel(level: LogLevel): void;
}

export function createLogger(defaultContext: LogContext & { component: string }): LoggerInterface {
    const { component, ...initialContext } = defaultContext;
    const baseContext = sanitizeLogContext(initialContext);
    const winstonChild = rootLogger.instance.child({ component });

    const mergeContext = (meta?: LogContext) => ({
        context: {
            ...baseContext,
            ...sanitizeLogContext(meta || {}),
        },
    });

    return {
        debug(message: string, meta?: LogContext) {
            winstonChild.debug(message, mergeContext(meta));
        },

        info(message: string, meta?: LogContext) {
            winstonChild.info(message, mergeContext(meta));
        },

        warn(message: string, meta?: LogContext) {
            winstonChild.warn(message, mergeContext(meta));
        },

        error(message: string, meta?: LogContext & { error?: unknown }) {
            const { error: errLike, ...restMeta } = meta || {};
            const basePayload = mergeContext(restMeta);

            if (errLike instanceof Error) {
                winstonChild.error(message, {
                    ...basePayload,
                    error: {
                        name: errLike.name,
                        message: errLike.message,
                        stack: process.env.NODE_ENV === 'development' ? errLike.stack : undefined,
                        code: (errLike as any).code,
                    },
                });
                return;
            }

            winstonChild.error(message, basePayload);
        },

        fatal(message: string, meta?: LogContext & { error?: unknown }) {
            const { error: errLike, ...restMeta } = meta || {};
            const basePayload = mergeContext(restMeta);

            if (errLike instanceof Error) {
                winstonChild.log('fatal', message, {
                    ...basePayload,
                    error: {
                        name: errLike.name,
                        message: errLike.message,
                        stack: process.env.NODE_ENV === 'development' ? errLike.stack : undefined,
                        code: (errLike as any).code,
                    },
                });
                return;
            }

            winstonChild.log('fatal', message, basePayload);
        },

        child(context: LogContext): LoggerInterface {
            return createLogger({
                component,
                ...baseContext,
                ...context,
            });
        },

        withContext(context: LogContext): LoggerInterface {
            return this.child(context);
        },

        setLevel(level: LogLevel): void {
            // Safe casting because winston levels are string-compatible with our LogLevel type
            (winstonChild as any).level = level;
        },
    };
}

// Alias for LoggerInterface to match the exported type in usage
export type Logger = LoggerInterface;
