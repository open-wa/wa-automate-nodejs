import type { Logger, LogContext, LogEvent, LogLevel } from './core/logger';
import { DEFAULT_RULES } from './security/rules';

export type { Logger, LogContext, LogEvent, LogLevel };

const levels: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3, fatal: 4 };

function sanitizeContext(context: LogContext): LogContext {
    return Object.fromEntries(Object.entries(context).flatMap(([key, value]) => {
        const rule = DEFAULT_RULES.find(({ pattern }) => typeof pattern === 'string'
            ? key.toLowerCase() === pattern.toLowerCase()
            : pattern.test(key));
        if (!rule) return [[key, value]];
        if (rule.strategy === 'remove') return [];
        if (typeof value !== 'string') return [[key, value]];
        if (rule.strategy === 'truncate') {
            const keep = rule.options?.keepChars ?? 3;
            return [[key, value.length > keep ? `${value.slice(0, keep)}...` : value]];
        }
        // Browser logs redact identifiers instead of importing Node's crypto.
        return [[key, rule.options?.replacement ?? '[REDACTED]']];
    }));
}

export function createLogger(defaultContext: LogContext & { component: string }): Logger {
    const { component, ...context } = defaultContext;
    const baseContext = sanitizeContext(context);
    let level: LogLevel = 'info';
    const write = (entryLevel: LogLevel, message: string, meta?: LogContext) => {
        if (levels[entryLevel] < levels[level]) return;
        const { error, ...details } = meta ?? {};
        const event: LogEvent = {
            timestamp: new Date().toISOString(),
            level: entryLevel,
            message,
            component,
            context: { ...baseContext, ...sanitizeContext(details) },
        };
        if (error instanceof Error) event.error = { name: error.name, message: error.message };
        console[entryLevel === 'fatal' ? 'error' : entryLevel](message, event);
    };
    const logger: Logger = {
        debug: (message, meta) => write('debug', message, meta),
        info: (message, meta) => write('info', message, meta),
        warn: (message, meta) => write('warn', message, meta),
        error: (message, meta) => write('error', message, meta),
        fatal: (message, meta) => write('fatal', message, meta),
        child(childContext) {
            const child = createLogger({ component, ...baseContext, ...childContext });
            child.setLevel(level);
            return child;
        },
        withContext: childContext => logger.child(childContext),
        setLevel: nextLevel => { level = nextLevel; },
    };
    return logger;
}

export const rootLogger = {
    instance: createLogger({ component: 'open-wa' }),
};
