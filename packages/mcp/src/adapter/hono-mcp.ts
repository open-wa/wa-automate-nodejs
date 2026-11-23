import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { Server, createMcpHandler, type ServerCapabilities } from '@modelcontextprotocol/server';
import type { Hono, Context } from 'hono';
import { eventJsonSchema, getHttpMethodDefinitions, type Config } from '@open-wa/schema';
import { getMcpToolDefinitions } from '../manifest';
import { executeCapability } from '../execution/kernel';
import { McpEventsService } from '../events/service';
import { McpOAuth } from '../oauth/oauth';
import { createApprovalDelivery } from '../oauth/approval-delivery';
import { callChatTool, chatToolDefinitions, mediaContent } from './chat-tools';
import packageMetadata from '../../package.json' with { type: 'json' };
import {
  EVENTS_EXTENSION, decodeHeaderValue, emptyResultSchema, eventListParamsSchema, eventListResultSchema,
  pollResultSchema, pollSchema, streamResultSchema, streamSchema, subscribeSchema,
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
    retentionMs: eventConfig?.retentionMs ?? 15 * 60_000,
    operatorPauseMs: eventConfig?.operatorPauseMs ?? 30 * 60_000,
    log: data => elasticEmitter?.log(data),
  });
  const mcpPath = config.mcp?.path || '/mcp';
  const invoke = (functionName: string, payload: Record<string, unknown>) => executeCapability({
    client: clientSource(), definition: executionDefinitions.get(functionName)!, payload, elasticEmitter, sessionId: config.sessionId,
  });
  const oauthConfig = config.mcp?.oauth;
  const approval = oauthConfig?.approvalCode;
  const oauth = oauthConfig?.enabled === false ? undefined : new McpOAuth({
    storePath: oauthConfig?.storePath ?? join('.open-wa', `mcp-oauth-${owner()!.slice(0, 24)}.sqlite`),
    mcpPath, apiKey: () => config.apiKey, owner, publicUrl: oauthConfig?.publicUrl,
    onApprovalCode: createApprovalDelivery({
      sessionId: config.sessionId ?? '',
      log: approval?.log ?? true,
      webhookUrl: (approval?.webhook ?? true) ? approval?.webhookUrl ?? config.webhook : undefined,
      webhookSecret: approval?.webhookSecret,
      sendToSelf: approval?.sendToSelf ?? false,
      invoke, noteOwnSend: id => events?.noteOwnSend(id),
    }),
  });
  // Subscription state belongs to the adapter, outside the per-request SDK server.
  const handler = createMcpHandler(() => {
    // SEP-3415 negotiates through `extensions`; ChatGPT still reads the top-level `events` key.
    const capabilities: ServerCapabilities & { events?: Record<string, never> } = {
      tools: {}, ...(events ? { events: {}, extensions: { [EVENTS_EXTENSION]: {} } } : {}),
    };
    const server = new Server({ name: 'open-wa', version: packageMetadata.version }, { capabilities });
    server.setRequestHandler('tools/list', async () => ({
      tools: toolDefinitions.map(def => ({
        name: def.toolName, description: def.description,
        inputSchema: eventJsonSchema(def.inputSchema) as { type: 'object'; [key: string]: unknown },
        annotations: def.annotations,
      })).concat(chatToolDefinitions.map(def => ({ ...def, inputSchema: def.inputSchema as unknown as { type: 'object'; [key: string]: unknown } })) as never),
    }));
    server.setRequestHandler('tools/call', async request => {
      const { name, arguments: args } = request.params;
      const definition = toolMap.get(name);
      const failure = (text: string) => ({ isError: true, content: [{ type: 'text' as const, text }] });
      const isChatTool = chatToolDefinitions.some(def => def.name === name);
      if (!definition && !isChatTool) return failure(`Unknown tool: ${name}. Use tools/list to discover available tools.`);
      if (isSessionConnected && !isSessionConnected() && config.apiLifecycle !== 'immediate') {
        return failure('Session is not connected or ready. Tool execution is blocked until the session is fully ready.');
      }
      if (isChatTool) return (await callChatTool(name, (args as Record<string, unknown>) || {}, invoke, events)) as never;
      const result = await invoke(definition!.functionName, (args as Record<string, unknown>) || {});
      if (!result.success) return failure(result.error || 'Internal Execution Error');
      // Remember messages open-wa sent, so they aren't mistaken for a person replying from the app.
      if (definition!.functionName.startsWith('send') && typeof result.data === 'string') events?.noteOwnSend(result.data);
      return { content: mediaContent(result.data, definition!.toolName) ?? [{ type: 'text' as const, text: JSON.stringify(result.data ?? null, null, 2) }] } as never;
    });
    if (events) {
      server.setRequestHandler('events/list', { params: eventListParamsSchema, result: eventListResultSchema }, async () => events.list());
      server.setRequestHandler('events/poll', { params: pollSchema, result: pollResultSchema }, async params => events.poll(params));
      server.setRequestHandler('events/stream', { params: streamSchema, result: streamResultSchema }, (params, ctx) => events.stream(params, {
        requestId: ctx.mcpReq.id, signal: ctx.mcpReq.signal,
        notify: (method, notificationParams) => ctx.mcpReq.notify({ method, params: notificationParams } as Parameters<typeof ctx.mcpReq.notify>[0]),
      }));
      server.setRequestHandler('events/subscribe', { params: subscribeSchema, result: subscriptionResultSchema }, params => events.subscribe(params));
      server.setRequestHandler('events/unsubscribe', { params: unsubscribeSchema, result: emptyResultSchema }, async params => events.unsubscribe(params));
    }
    return server;
  }, { legacy: 'reject' });

  return {
    mount(app: Hono, path: string) {
      oauth?.routes(app);
      app.all(path, async (c: Context) => {
        const key = c.req.header('X-API-Key') || c.req.header('api_key') || c.req.header('key');
        if (!config.apiKey || (key !== config.apiKey && !oauth?.verify(c))) {
          // ChatGPT and other OAuth clients follow this challenge to the protected-resource metadata.
          if (oauth) c.header('WWW-Authenticate', oauth.challenge(c));
          return c.json({ error: 'Unauthorized', details: 'Sign in with OAuth or send the Easy API key in X-API-Key' }, 401);
        }
        const mismatch = await eventNameMismatch(c.req.raw);
        if (mismatch) return c.json({ jsonrpc: '2.0', id: mismatch.id, error: { code: -32020, message: 'HeaderMismatch', data: { header: 'Mcp-Name' } } }, 400);
        return handler.fetch(c.req.raw);
      });
    },
    publishEvent(name: string, payload: unknown) {
      try { events?.publish(name, payload); }
      catch { elasticEmitter?.log({ level: 'error', component: 'mcp.events', message: 'mcp_event_journal_write_failed' }); }
    },
    async close() {
      try { await handler.close(); }
      finally { await events?.close(); oauth?.close(); }
    },
  };
}

/**
 * The SDK checks `Mcp-Name` only for core methods. For `events/*` requests that carry the header, it must
 * match `params.name`. A missing header is tolerated because ChatGPT's webhook client does not send it.
 */
async function eventNameMismatch(request: Request): Promise<{ id: unknown } | undefined> {
  const method = request.headers.get('mcp-method');
  const header = request.headers.get('mcp-name');
  if (request.method !== 'POST' || header === null || !method?.startsWith('events/') || method === 'events/list') return;
  let body: { id?: unknown; params?: { name?: unknown } };
  try { body = await request.clone().json() as typeof body; } catch { return; }
  return decodeHeaderValue(header) === body?.params?.name ? undefined : { id: body?.id ?? null };
}
