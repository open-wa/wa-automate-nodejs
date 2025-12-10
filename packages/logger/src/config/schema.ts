import { z } from 'zod';

export const TransportConfigSchema = z.discriminatedUnion('type', [
    z.object({
        type: z.literal('console'),
        format: z.enum(['json', 'pretty', 'simple']).optional(),
    }),
    z.object({
        type: z.literal('file'),
        path: z.string(),
        maxSize: z.number().optional(), // bytes
        maxFiles: z.number().optional(),
    }),
    z.object({
        type: z.literal('elasticsearch'),
        url: z.string(),
        username: z.string().optional(),
        password: z.string().optional(),
        indexPrefix: z.string().optional(),
        bufferSize: z.number().optional(),
        flushInterval: z.number().optional(),
    }),
    z.object({
        type: z.literal('mq'),
        brokerUrl: z.string(),
        queue: z.string(),
    }),
    z.object({
        type: z.literal('cloudflare'),
    }),
]);

export const LoggerConfigSchema = z.object({
    level: z.enum(['debug', 'info', 'warn', 'error', 'fatal']),
    format: z.enum(['json', 'pretty']),
    transports: z.array(TransportConfigSchema),
    includeStack: z.boolean().default(true),
});

export type TransportConfig = z.infer<typeof TransportConfigSchema>;
export type LoggerConfig = z.infer<typeof LoggerConfigSchema>;
