import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import type { Hono, Context } from 'hono';
import { zodToJsonSchema } from 'zod-to-json-schema';
import type { Config } from '@open-wa/schema';
import { getMcpToolDefinitions } from '../manifest';
import { executeCapability } from '../execution/kernel';

export interface HonoMcpAdapterOptions {
  config: Config;
  /**
   * Getter for the active client instance.
   */
  clientSource: () => Record<string, any> | undefined;
  /**
   * Optional logging emitter.
   */
  elasticEmitter?: {
    log: (data: any) => void;
  };
  /**
   * Base path for tool documentation links.
   */
  basePath?: string;
  /**
   * Getter for session readiness state.
   * Used for lifecycle gating parity with HTTP transport.
   */
  isSessionConnected?: () => boolean;
}

/**
 * Creates an MCP adapter using the Streamable HTTP transport (single-endpoint).
 *
 * open-wa product decision:
 * hosted MCP is Easy API-only and unavailable through createClient()
 *
 * This adapter:
 * - Uses WebStandardStreamableHTTPServerTransport for a single-endpoint /mcp shape
 * - Enforces Easy API API-key auth on every request
 * - Gates tool execution on session readiness (parity with HTTP transport)
 * - Returns protocol errors for malformed protocol requests
 * - Returns tool-level errors for open-wa execution failures
 */
export function createHonoMcpAdapter(options: HonoMcpAdapterOptions) {
  const { config, clientSource, elasticEmitter, basePath = '/api', isSessionConnected } = options;
  const toolDefinitions = getMcpToolDefinitions(basePath);
  const toolMap = new Map(toolDefinitions.map((d) => [d.toolName, d]));

  const server = new Server(
    {
      name: 'open-wa',
      version: '5.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // ── tools/list ──────────────────────────────────────────────────────
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: toolDefinitions.map((def) => ({
        name: def.toolName,
        description: def.description,
        inputSchema: zodToJsonSchema(def.inputSchema) as any,
      })),
    };
  });

  // ── tools/call ──────────────────────────────────────────────────────
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const definition = toolMap.get(name);

    if (!definition) {
      return {
        isError: true,
        content: [
          {
            type: 'text' as const,
            text: `Unknown tool: ${name}. Use tools/list to discover available tools.`,
          },
        ],
      };
    }

    // ── Lifecycle/readiness gate (parity with HTTP transport) ──────
    if (isSessionConnected && !isSessionConnected()) {
      if (config.apiLifecycle !== 'immediate') {
        return {
          isError: true,
          content: [
            {
              type: 'text' as const,
              text: 'Session is not connected or ready. Tool execution is blocked until the session is fully ready.',
            },
          ],
        };
      }
    }

    const result = await executeCapability({
      client: clientSource(),
      definition: definition as any,
      payload: (args as Record<string, unknown>) || {},
      elasticEmitter,
      sessionId: config.sessionId,
    });

    if (result.success) {
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(result.data, null, 2),
          },
        ],
      };
    }

    return {
      isError: true,
      content: [
        {
          type: 'text' as const,
          text: result.error || 'Internal Execution Error',
        },
      ],
    };
  });

  // ── Streamable HTTP transport ───────────────────────────────────────
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: () => crypto.randomUUID(),
    onsessioninitialized: (sessionId: string) => {
      elasticEmitter?.log({
        level: 'info',
        component: 'mcp',
        message: `MCP session initialized: ${sessionId}`,
        sessionId: config.sessionId,
      });
    },
    onsessionclosed: (sessionId: string) => {
      elasticEmitter?.log({
        level: 'info',
        component: 'mcp',
        message: `MCP session closed: ${sessionId}`,
        sessionId: config.sessionId,
      });
    },
  });

  // Connect the server to the transport immediately
  server.connect(transport);

  return {
    /**
     * Mounts the MCP Streamable HTTP endpoint on the provided Hono app.
     *
     * This creates a single endpoint at `path` that handles:
     * - POST: JSON-RPC messages (initialize, tools/list, tools/call)
     * - GET: Server-initiated SSE stream
     * - DELETE: Session termination
     *
     * API-key auth is enforced on every request before delegation to MCP.
     */
    mount: (app: Hono, path: string) => {
      app.all(`${path}`, async (c: Context) => {
        // ── API-key auth enforcement ───────────────────────────────
        // MCP inherits Easy API auth boundary. No key = no access.
        if (config.apiKey) {
          const headerKey =
            c.req.header('X-API-Key') ||
            c.req.header('api_key') ||
            c.req.header('key');
          const resolvedKey = headerKey;

          if (!resolvedKey || resolvedKey !== config.apiKey) {
            return c.json(
              { error: 'Unauthorized', details: 'Invalid or missing API key for MCP endpoint' },
              401,
            );
          }
        }

        // ── Delegate to Streamable HTTP transport ──────────────────
        const response = await transport.handleRequest(c.req.raw);
        return response;
      });
    },

    /**
     * Cleanly shut down the MCP transport.
     */
    close: async () => {
      await transport.close();
      await server.close();
    },
  };
}
