import { z } from 'zod';
import { MessageSchema } from '../common-types';
import { eventRegistry } from './registry';
import './messaging';
import './state';
import './groups';

const context = z.object({ correlationId: z.string(), ts: z.number(), attempt: z.number().optional() });
// Runtime snapshots can be partial; the complete listener schema is not a wire guarantee.
const message = MessageSchema.partial().extend({ id: MessageSchema.shape.id }).passthrough();
const ack = MessageSchema.pick({ id: true, ack: true }).passthrough();
const step = (details: z.ZodType) => context.extend({
  step: z.string(), details: details.optional(),
  error: z.object({ name: z.string(), message: z.string(), stack: z.string().optional() }).optional(),
  durationMs: z.number().optional(),
});
const conversationFilter = z.object({ chatId: z.string().min(1).optional() }).strict();
const noFilter = z.object({}).strict();
const messageSummary = z.object({
  sessionId: z.string(), messageId: z.string(), chatId: z.string().optional(),
  from: z.string().optional(), body: z.string().max(4000).optional(), truncated: z.boolean(),
});
const ackSummary = z.object({
  sessionId: z.string(), messageId: z.string(), ack: z.number(), chatId: z.string().optional(),
});
const stateSummary = z.object({
  sessionId: z.string(), previousState: z.string().optional(), state: z.string(),
});

export interface EventContract {
  name: string;
  listener: string;
  aliases: string[];
  description: string;
  optionalRuntimeListener: boolean;
  payloadSchema: z.ZodType;
  transports: readonly ('sse' | 'webhook' | 'mcp')[];
  mcp?: { inputSchema: z.ZodType; payloadSchema: z.ZodType; project(payload: unknown, sessionId: string): unknown };
}

const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? value as Record<string, unknown> : {};
const text = (value: unknown) => typeof value === 'string' ? value : undefined;

function defineContract(
  listener: string,
  definition: Omit<EventContract, 'listener' | 'aliases' | 'description'>,
): EventContract {
  const meta = eventRegistry.get(listener)!.meta;
  return { ...definition, listener, aliases: [meta.legacyName, ...(meta.aliases ?? [])], description: meta.description ?? definition.name };
}

/** Canonical public wire contracts, shared by AsyncAPI, documentation and MCP. */
export const eventContracts: readonly EventContract[] = [
  defineContract('message', {
    name: 'message.received', optionalRuntimeListener: false, transports: ['sse', 'webhook', 'mcp'],
    payloadSchema: z.object({ ctx: context, message }),
    mcp: {
      inputSchema: conversationFilter, payloadSchema: messageSummary,
      project(payload, sessionId) {
        const m = record(record(payload).message);
        const body = text(m.body);
        return { sessionId, messageId: m.id, chatId: text(m.chatId), from: text(m.from), body: body?.slice(0, 4000), truncated: (body?.length ?? 0) > 4000 };
      },
    },
  }),
  defineContract('anyMessage', {
    name: 'message.any', optionalRuntimeListener: true, transports: ['sse', 'webhook'],
    payloadSchema: z.object({ ctx: context, message }),
  }),
  defineContract('ack', {
    name: 'ack.changed', optionalRuntimeListener: false, transports: ['sse', 'webhook', 'mcp'],
    payloadSchema: z.object({ ctx: context, ack }),
    mcp: {
      inputSchema: conversationFilter, payloadSchema: ackSummary,
      project(payload, sessionId) {
        const a = record(record(payload).ack);
        return { sessionId, messageId: a.id, ack: a.ack, chatId: text(a.chatId) };
      },
    },
  }),
  defineContract('stateChanged', {
    name: 'session.state.changed', optionalRuntimeListener: false, transports: ['sse', 'webhook', 'mcp'],
    payloadSchema: step(z.object({ prev: z.string(), next: z.string(), reason: z.string().optional() })),
    mcp: {
      inputSchema: noFilter, payloadSchema: stateSummary,
      project(payload, sessionId) {
        const details = record(record(payload).details);
        return { sessionId, previousState: text(details.prev), state: details.next };
      },
    },
  }),
  defineContract('addedToGroup', {
    name: 'group.addedToGroup', optionalRuntimeListener: true, transports: ['sse', 'webhook'],
    payloadSchema: z.object({ ctx: context, groupId: z.string(), by: z.string().optional() }),
  }),
  defineContract('logout', {
    name: 'session.logout', optionalRuntimeListener: false, transports: ['sse', 'webhook'],
    payloadSchema: step(z.object({ reason: z.string().optional() })),
  }),
].sort((a, b) => a.name.localeCompare(b.name));

export function getEventContract(name: string): EventContract | undefined {
  return eventContracts.find(contract => contract.name === name);
}

export function eventJsonSchema(schema: z.ZodType): Record<string, unknown> {
  return z.toJSONSchema(schema, { target: 'draft-7', unrepresentable: 'any' });
}

export function getMcpEventDefinitions() {
  return eventContracts.filter(contract => contract.mcp).map(contract => ({
    name: contract.name,
    description: `${contract.description}. Compact summary${contract.name === 'session.state.changed' ? '' : '; use messages.get with messageId to read a full message'}. No history replay.`,
    delivery: ['webhook'] as 'webhook'[],
    inputSchema: eventJsonSchema(contract.mcp!.inputSchema),
    payloadSchema: eventJsonSchema(contract.mcp!.payloadSchema),
  }));
}
