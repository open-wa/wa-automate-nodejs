import { ProtocolError } from '@modelcontextprotocol/server';
import { z } from 'zod';

/** Extension identifier from SEP-3415, advertised under `capabilities.extensions`. */
export const EVENTS_EXTENSION = 'io.modelcontextprotocol/events';
export const SUBSCRIPTION_META = 'io.modelcontextprotocol/subscriptionId';

const argumentsSchema = z.record(z.string(), z.unknown());
const cursorSchema = z.string().nullable().optional();
const maxAgeSchema = z.number().int().positive().optional();
const complete = { resultType: z.literal('complete') };

export const deliverySchema = z.object({ mode: z.literal('webhook'), url: z.string().url(), secret: z.string() });
export const subscribeSchema = z.object({
  name: z.string(), arguments: argumentsSchema.default({}), delivery: deliverySchema,
  cursor: cursorSchema, maxAgeMs: maxAgeSchema, ttlMs: z.number().int().positive().nullable().optional(),
});
export const unsubscribeSchema = subscribeSchema.pick({ name: true, arguments: true }).extend({
  delivery: z.object({ mode: z.literal('webhook').optional(), url: z.string().url() }),
});
export const pollSchema = z.object({
  name: z.string(), arguments: argumentsSchema.default({}), cursor: cursorSchema, maxAgeMs: maxAgeSchema,
  maxEvents: z.number().int().positive().optional(),
});
export const streamSchema = z.object({
  name: z.string(), arguments: argumentsSchema.default({}), cursor: cursorSchema, maxAgeMs: maxAgeSchema,
  heartbeatMs: z.number().int().positive().optional(),
});

const occurrenceSchema = z.object({
  eventId: z.string(), name: z.string(), timestamp: z.string(), data: argumentsSchema, cursor: z.string().nullable().optional(),
});
export const subscriptionResultSchema = z.object({
  ...complete, id: z.string(), refreshBefore: z.string().datetime().nullable(), cursor: z.string().nullable(), truncated: z.boolean(),
  deliveryStatus: z.object({
    active: z.boolean(), lastDeliveryAt: z.string().datetime().nullable(), lastError: z.string().nullable(),
  }).optional(),
});
export const pollResultSchema = z.object({
  ...complete, events: z.array(occurrenceSchema), cursor: z.string().nullable(), truncated: z.boolean(),
  hasMore: z.boolean(), nextPollMs: z.number().int(),
});
export const streamResultSchema = z.object({ ...complete, _meta: argumentsSchema.optional() });
export const emptyResultSchema = z.object({ ...complete });
export const eventListParamsSchema = z.object({ cursor: z.string().optional() }).default({});
export const eventListResultSchema = z.object({
  ...complete,
  events: z.array(z.object({
    name: z.string(), description: z.string(), delivery: z.array(z.enum(['poll', 'push', 'webhook'])).min(1),
    inputSchema: argumentsSchema, payloadSchema: argumentsSchema,
  })),
});

export type SubscribeParams = z.infer<typeof subscribeSchema>;
export type UnsubscribeParams = z.infer<typeof unsubscribeSchema>;
export type PollParams = z.infer<typeof pollSchema>;
export type StreamParams = z.infer<typeof streamSchema>;
export type EventOccurrence = z.infer<typeof occurrenceSchema>;

/** Webhook failure categories; never raw endpoint output, so callbacks cannot be used as a response oracle. */
export type CallbackFailure = 'connection_refused' | 'timeout' | 'tls_error' | 'http_4xx' | 'http_5xx' | 'challenge_failed';

/** SEP-3415 error codes. */
export const eventErrors = {
  invalidParams: (message: string, data?: Record<string, unknown>) => new ProtocolError(-32602, message, data),
  notFound: (kind: 'event' | 'subscription') => new ProtocolError(-32023, 'NotFound', { kind }),
  forbidden: (reason: string) => new ProtocolError(-32024, 'Forbidden', { reason }),
  exhausted: (limit: string, max: number) => new ProtocolError(-32025, 'ResourceExhausted', { limit, max }),
  callback: (reason: CallbackFailure) => new ProtocolError(-32027, 'CallbackEndpointError', { reason }),
};
export const errorBody = (code: number, message: string, data?: Record<string, unknown>) => ({ code, message, ...(data ? { data } : {}) });

export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`).join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}

/** Every subscription argument is an exact-match filter on the projected payload. */
export function matchesArguments(args: Record<string, unknown>, data: Record<string, unknown>): boolean {
  return Object.entries(args).every(([key, value]) => value === undefined || data[key] === value);
}

/** Decodes an `Mcp-Name` header, including the transport's `=?base64?…?=` sentinel. */
export function decodeHeaderValue(value: string): string | undefined {
  const sentinel = /^=\?base64\?([A-Za-z0-9+/=]*)\?=$/i.exec(value.trim());
  if (!sentinel) return value.trim();
  const decoded = Buffer.from(sentinel[1], 'base64');
  return decoded.toString('base64') === sentinel[1] ? decoded.toString('utf8') : undefined;
}
