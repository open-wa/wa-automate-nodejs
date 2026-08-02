import { createFileRoute } from '@tanstack/react-router';
import { getLLMText } from '@/lib/get-llm-text';
import { source } from '@/lib/source';

const DEFAULT_PROTOCOL_VERSION = '2025-11-25';

type JsonRpcRequest = Readonly<{
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: Record<string, unknown>;
}>;

function responseHeaders(protocolVersion = DEFAULT_PROTOCOL_VERSION) {
  return {
    'Access-Control-Allow-Headers':
      'Accept, Content-Type, MCP-Protocol-Version',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Expose-Headers': 'MCP-Protocol-Version',
    'Content-Type': 'application/json; charset=utf-8',
    'MCP-Protocol-Version': protocolVersion,
  };
}

function success(id: JsonRpcRequest['id'], result: unknown) {
  return { jsonrpc: '2.0', id: id ?? null, result };
}

function failure(id: JsonRpcRequest['id'], code: number, message: string) {
  return { jsonrpc: '2.0', id: id ?? null, error: { code, message } };
}

function normalizeDocsPath(path: string) {
  try {
    const parsed = new URL(path);
    path = parsed.pathname;
  } catch {
    // A relative documentation path is already in the expected form.
  }

  return path
    .replace(/^\/docs\/?/, '')
    .replace(/^\/+|\/+$/g, '')
    .split('/')
    .filter(Boolean);
}

async function callTool(name: unknown, args: unknown) {
  const input = (args && typeof args === 'object' ? args : {}) as Record<
    string,
    unknown
  >;

  if (name === 'search_docs') {
    const query =
      typeof input.query === 'string' ? input.query.trim().toLowerCase() : '';
    if (!query) throw new Error('search_docs requires a non-empty query');

    const matches = source
      .getPages()
      .map((page) => ({
        title: String(page.data.title),
        description: String(page.data.description ?? ''),
        url: page.url,
      }))
      .filter((page) =>
        `${page.title} ${page.description} ${page.url}`
          .toLowerCase()
          .includes(query),
      )
      .slice(0, 12);

    return matches.length > 0
      ? JSON.stringify(matches, null, 2)
      : `No documentation matched "${query}".`;
  }

  if (name === 'read_doc') {
    const path = typeof input.path === 'string' ? input.path : '';
    if (!path) throw new Error('read_doc requires a documentation path');

    const page = source.getPage(normalizeDocsPath(path));
    if (!page) throw new Error(`Documentation page not found: ${path}`);

    return getLLMText(page);
  }

  throw new Error(`Unknown tool: ${String(name)}`);
}

async function handleRequest(message: JsonRpcRequest) {
  const id = message.id;

  if (message.jsonrpc !== '2.0' || typeof message.method !== 'string') {
    return failure(id, -32600, 'Invalid JSON-RPC request');
  }

  if (message.method.startsWith('notifications/')) return null;

  if (message.method === 'initialize') {
    const requestedVersion = message.params?.protocolVersion;
    const protocolVersion =
      typeof requestedVersion === 'string'
        ? requestedVersion
        : DEFAULT_PROTOCOL_VERSION;

    return success(id, {
      protocolVersion,
      capabilities: { tools: { listChanged: false } },
      serverInfo: { name: 'open-wa documentation', version: '5.0.0-alpha' },
      instructions:
        'Use search_docs to find open-wa documentation and read_doc to retrieve a page as Markdown.',
    });
  }

  if (message.method === 'ping') return success(id, {});

  if (message.method === 'tools/list') {
    return success(id, {
      tools: [
        {
          name: 'search_docs',
          description:
            'Search open-wa documentation by title, description, or path.',
          inputSchema: {
            type: 'object',
            properties: { query: { type: 'string', minLength: 1 } },
            required: ['query'],
            additionalProperties: false,
          },
        },
        {
          name: 'read_doc',
          description: 'Read one open-wa documentation page as Markdown.',
          inputSchema: {
            type: 'object',
            properties: { path: { type: 'string', minLength: 1 } },
            required: ['path'],
            additionalProperties: false,
          },
        },
      ],
    });
  }

  if (message.method === 'tools/call') {
    try {
      const text = await callTool(
        message.params?.name,
        message.params?.arguments,
      );
      return success(id, { content: [{ type: 'text', text }] });
    } catch (error) {
      return success(id, {
        isError: true,
        content: [
          {
            type: 'text',
            text: error instanceof Error ? error.message : String(error),
          },
        ],
      });
    }
  }

  return failure(id, -32601, `Method not found: ${message.method}`);
}

export const Route = createFileRoute('/mcp')({
  // @ts-expect-error TanStack types mismatch
  server: {
    handlers: {
      async POST({ request }: { request: Request }) {
        let payload: JsonRpcRequest | JsonRpcRequest[];

        try {
          payload = (await request.json()) as JsonRpcRequest | JsonRpcRequest[];
        } catch {
          return Response.json(failure(null, -32700, 'Parse error'), {
            status: 400,
            headers: responseHeaders(
              request.headers.get('MCP-Protocol-Version') ?? undefined,
            ),
          });
        }

        const messages = Array.isArray(payload) ? payload : [payload];
        const results = (await Promise.all(messages.map(handleRequest))).filter(
          (result) => result !== null,
        );

        if (results.length === 0) {
          return new Response(null, {
            status: 202,
            headers: responseHeaders(
              request.headers.get('MCP-Protocol-Version') ?? undefined,
            ),
          });
        }

        return Response.json(Array.isArray(payload) ? results : results[0], {
          headers: responseHeaders(
            request.headers.get('MCP-Protocol-Version') ?? undefined,
          ),
        });
      },
      OPTIONS() {
        return new Response(null, { status: 204, headers: responseHeaders() });
      },
      GET() {
        return Response.json(
          {
            error:
              'This stateless MCP endpoint accepts Streamable HTTP POST requests.',
          },
          {
            status: 405,
            headers: { ...responseHeaders(), Allow: 'POST, OPTIONS' },
          },
        );
      },
      DELETE() {
        return new Response(null, { status: 204, headers: responseHeaders() });
      },
    },
  },
});
