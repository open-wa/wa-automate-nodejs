import { z } from 'zod';

const argumentsSchema = z.record(z.string(), z.unknown());
export const deliverySchema = z.object({ mode: z.literal('webhook'), url: z.string().url(), secret: z.string() });
export const subscribeSchema = z.object({
  name: z.string(), arguments: argumentsSchema.default({}), delivery: deliverySchema,
  cursor: z.string().nullable().optional(), ttlMs: z.number().int().positive().nullable().optional(),
});
export const unsubscribeSchema = subscribeSchema.pick({ name: true, arguments: true }).extend({
  delivery: deliverySchema.omit({ secret: true }),
});
export const subscriptionResultSchema = z.object({
  id: z.string(), refreshBefore: z.string().datetime().nullable(), cursor: z.null(), truncated: z.boolean(),
});
export const eventListParamsSchema = z.object({ cursor: z.string().optional() }).default({});
export const eventListResultSchema = z.object({ events: z.array(z.object({
  name: z.string(), description: z.string(), delivery: z.array(z.literal('webhook')),
  inputSchema: argumentsSchema, payloadSchema: argumentsSchema,
})) });
export type SubscribeParams = z.infer<typeof subscribeSchema>;
export type UnsubscribeParams = z.infer<typeof unsubscribeSchema>;

export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`).join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}
