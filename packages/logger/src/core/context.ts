export interface LogContext {
    // Core context
    sessionId?: string;
    driver?: 'puppeteer' | 'playwright' | 'remote';
    requestId?: string;
    schemaId?: string;

    // HTTP context
    'http.method'?: string;
    'http.path'?: string;
    'http.statusCode'?: number;
    'http.latencyMs'?: number;

    // Distributed tracing
    traceId?: string;
    spanId?: string;

    // Cloudflare-specific
    isolateId?: string;
    colo?: string;
    doId?: string;

    // Extensible
    [key: string]: unknown;
}

export interface LogEvent {
    timestamp: string;
    level: string;
    message: string;
    component: string;
    error?: {
        name: string;
        message: string;
        stack?: string;
        code?: string | number;
    };
    context: LogContext;
}
