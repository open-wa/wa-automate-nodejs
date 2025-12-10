// Core logging API (default export)
export { createLogger, rootLogger } from './core/logger';
export type { Logger, LogContext, LogEvent, LogLevel } from './core/logger';

// Configuration
export { LoggerConfigSchema } from './config/schema';
export type { LoggerConfig } from './config/schema';

// Security
export { sanitizeLogContext, createSanitizer } from './security/sanitizer';
export * from './security/censors';

// Middleware
export { honoLogger } from './middleware/hono';
export { socketLogger } from './middleware/socket';

// Sub-export: Terminal UI
export * as terminal from './terminal';

// Sub-export: Transports
export * as transports from './transports';
