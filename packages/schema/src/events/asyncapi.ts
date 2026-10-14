import { eventContracts, eventJsonSchema } from './contracts';

export interface AsyncApiOptions { origin?: string; basePath?: string; version?: string; mcpPath?: string; mcpEnabled?: boolean }

/** Build the same contract for the metadata endpoint and static documentation. */
export function createAsyncApiDocument(options: AsyncApiOptions = {}) {
  const basePath = (options.basePath ?? '').replace(/\/$/, '');
  const channels: Record<string, unknown> = {};
  const operations: Record<string, unknown> = {};
  const schemas: Record<string, unknown> = {};
  const messages: Record<string, unknown> = {};
  for (const contract of eventContracts) {
    const key = contract.name.replace(/\./g, '_');
    schemas[key] = eventJsonSchema(contract.payloadSchema);
    for (const transport of contract.transports) {
      const id = `${transport}_${key}`;
      const isMcp = transport === 'mcp';
      if (isMcp) schemas[`${key}_mcp`] = eventJsonSchema(contract.mcp!.payloadSchema);
      const payloadRef = { $ref: `#/components/schemas/${key}${isMcp ? '_mcp' : ''}` };
      const properties = transport === 'sse'
        ? { id: { type: 'string' }, event: { const: contract.name }, payload: payloadRef, ts: { type: 'number' }, sessionId: { type: 'string' } }
        : transport === 'webhook'
          ? { webhookId: { type: 'string' }, sessionId: { type: 'string' }, event: { const: contract.name }, payload: payloadRef, timestamp: { type: 'number' }, idempotencyKey: { type: 'string' } }
          : { eventId: { type: 'string' }, name: { const: contract.name }, timestamp: { type: 'string', format: 'date-time' }, data: payloadRef, cursor: { type: 'null' } };
      messages[id] = {
        name: contract.name, title: contract.name, summary: contract.description,
        contentType: 'application/json',
        payload: { type: 'object', properties, required: Object.keys(properties).filter(name => name !== 'idempotencyKey'), additionalProperties: false },
        ...(isMcp ? { headers: { type: 'object', required: ['webhook-id', 'webhook-timestamp', 'webhook-signature', 'X-MCP-Subscription-Id'], properties: {
          'webhook-id': { type: 'string' }, 'webhook-timestamp': { type: 'string' }, 'webhook-signature': { type: 'string' }, 'X-MCP-Subscription-Id': { type: 'string' },
        } } } : {}),
        'x-openwa-listener': contract.listener, 'x-openwa-aliases': contract.aliases,
        'x-openwa-optional-runtime-listener': contract.optionalRuntimeListener,
      };
      channels[id] = {
        address: transport === 'sse' ? `${basePath}/api/events` : null,
        description: transport === 'sse'
          ? 'SSE event frame: id, event and JSON data; optional topics query filters exact runtime names. Keepalive every 20 seconds; reconnect hint 3000 ms. No history replay. API key in X-API-Key or api_key/key query.'
          : transport === 'webhook'
            ? 'Outbound HTTP POST to the configured destination. Public non-sensitive events pass through the plugin gateway. Optional event-name filter; default 3 retries with exponential delay from 1000 ms. Optional durable journal adds Idempotency-Key and retries pending deliveries after restart. No exactly-once guarantee.'
            : `Verified subscriber-provided HTTPS callback. Subscribe through ${basePath}${options.mcpPath ?? '/mcp'} using MCP 2026-07-28. Standard Webhooks signatures, stable event IDs and bounded transient retries. No retry on 410/413; cursor:null means no historical replay.`,
        messages: { event: { $ref: `#/components/messages/${id}` } },
        'x-openwa-transport': transport,
        ...(transport === 'sse' ? { servers: [{ $ref: '#/servers/easyApi' }], 'x-openwa-sse': { event: contract.name, contentType: 'text/event-stream', topics: contract.name } } : {}),
        ...(isMcp ? { 'x-openwa-subscription-schema': eventJsonSchema(contract.mcp!.inputSchema) } : {}),
      };
      operations[id] = { action: 'send', channel: { $ref: `#/channels/${id}` }, summary: `${contract.name} over ${transport}`, messages: [{ $ref: `#/channels/${id}/messages/event` }] };
    }
  }
  const origin = new URL(options.origin ?? 'http://localhost:8080');
  return {
    asyncapi: '3.1.0',
    info: { title: 'OpenWA events', version: options.version ?? '5.5.1', description: 'Initial public wire contracts for six runtime events. This is not an exhaustive list of internal lifecycle events. SSE and webhook policies differ; MCP provides compact summaries for three events.' },
    servers: { easyApi: { host: origin.host, protocol: origin.protocol.slice(0, -1), security: [{ $ref: '#/components/securitySchemes/apiKey' }] } },
    channels, operations,
    components: { schemas, messages, securitySchemes: { apiKey: { type: 'httpApiKey', name: 'X-API-Key', in: 'header', description: 'Easy API instance API key. Callback signing secrets are per subscription and are never included in this document.' } } },
    ...(options.mcpEnabled !== undefined ? { 'x-openwa-mcp-enabled': options.mcpEnabled } : {}),
  };
}
