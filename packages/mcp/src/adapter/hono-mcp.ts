import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { Server, createMcpHandler, type ServerCapabilities } from '@modelcontextprotocol/server';
import { z } from 'zod';
import type { Hono, Context } from 'hono';
import { eventJsonSchema, getHttpMethodDefinitions, type Config } from '@open-wa/schema';
import { getMcpToolDefinitions } from '../manifest';
import { executeCapability } from '../execution/kernel';
import { McpEventsService } from '../events/service';
import packageMetadata from '../../package.json' with { type: 'json' };
import {
  eventListParamsSchema, eventListResultSchema, subscribeSchema,
  subscriptionResultSchema, unsubscribeSchema,
} from '../events/protocol';

export interface HonoMcpAdapterOptions {
  config: Config;
  clientSource: () => Record<string, any> | undefined;
  elasticEmitter?: { log: (data: any) => void };
  basePath?: string;
  isSessionConnected?: () => boolean;
}

/** Easy API's authenticated MCP 2.0 tools and webhook event endpoint. */
export function createHonoMcpAdapter(options: HonoMcpAdapterOptions) {
  const { config, clientSource, elasticEmitter, basePath = '/api', isSessionConnected } = options;
  if (!config.apiKey) throw new Error('MCP requires an Easy API apiKey');
  const toolDefinitions = getMcpToolDefinitions(basePath);
  const toolMap = new Map(toolDefinitions.map(def => [def.toolName, def]));
  const executionDefinitions = new Map(getHttpMethodDefinitions(basePath).map(def => [def.functionName, def]));
  const owner = () => config.apiKey
    ? createHash('sha256').update(`${config.sessionId ?? ''}\0${config.apiKey}`).digest('hex')
    : undefined;
  const eventConfig = config.mcp?.events;
  const events = eventConfig?.enabled === false ? undefined : new McpEventsService({
    sessionId: config.sessionId ?? '', owner,
    storePath: eventConfig?.storePath ?? join('.open-wa', `mcp-events-${owner()!.slice(0, 24)}.sqlite`),
    lifetimeMs: eventConfig?.lifetimeMs ?? 24 * 60 * 60_000,
    log: data => elasticEmitter?.log(data),
  });
  // Subscription state belongs to the adapter, outside the per-request SDK server.
  const handler = createMcpHandler(() => {
    const capabilities: ServerCapabilities & { events?: Record<string, never> } = {
      tools: {}, ...(events ? { events: {} } : {}),
    };
    const server = new Server({ name: 'open-wa', version: packageMetadata.version }, { capabilities });
    server.setRequestHandler('tools/list', async () => ({
      tools: toolDefinitions.map(def => ({
        name: def.toolName, description: def.description,
        inputSchema: eventJsonSchema(def.inputSchema) as { type: 'object'; [key: string]: unknown },
        annotations: def.annotations,
      })),
    }));
    server.setRequestHandler('tools/call', async request => {
      const { name, arguments: args } = request.params;
      const definition = toolMap.get(name);
      const failure = (text: string) => ({ isError: true, content: [{ type: 'text' as const, text }] });
      if (!definition) return failure(`Unknown tool: ${name}. Use tools/list to discover available tools.`);
      if (isSessionConnected && !isSessionConnected() && config.apiLifecycle !== 'immediate') {
        return failure('Session is not connected or ready. Tool execution is blocked until the session is fully ready.');
      }
      const result = await executeCapability({
        client: clientSource(), definition: executionDefinitions.get(definition.functionName)!, payload: (args as Record<string, unknown>) || {},
        elasticEmitter, sessionId: config.sessionId,
      });
      return result.success
        ? { content: [{ type: 'text' as const, text: JSON.stringify(result.data ?? null, null, 2) }] }
        : failure(result.error || 'Internal Execution Error');
    });
    if (events) {
      server.setRequestHandler('events/list', { params: eventListParamsSchema, result: eventListResultSchema }, async params => events.list(params.cursor));
      server.setRequestHandler('events/subscribe', { params: subscribeSchema, result: subscriptionResultSchema }, params => events.subscribe(params));
      server.setRequestHandler('events/unsubscribe', { params: unsubscribeSchema, result: z.object({}) }, async params => events.unsubscribe(params));
    }
    return server;
  }, { legacy: 'reject' });

  return {
    mount(app: Hono, path: string) {
      app.all(path, async (c: Context) => {
        const key = c.req.header('X-API-Key') || c.req.header('api_key') || c.req.header('key');
        if (!config.apiKey || key !== config.apiKey) {
          return c.json({ error: 'Unauthorized', details: 'Invalid or missing API key for MCP endpoint' }, 401);
        }
        return handler.fetch(c.req.raw);
      });
    },
    publishEvent(name: string, payload: unknown) {
      try { events?.publish(name, payload); }
      catch { elasticEmitter?.log({ level: 'error', component: 'mcp.events', message: 'mcp_event_journal_write_failed' }); }
    },
    async close() {
      try { await handler.close(); }
      finally { await events?.close(); }
    },
  };
}
