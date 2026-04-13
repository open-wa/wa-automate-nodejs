# Open-WA MCP Integration Guide

This document outlines the implementation and usage of the Model Context Protocol (MCP) integration for Open-WA.

## Architecture

The integration follows a **schema-first, hybrid architecture**:

1.  **Centralized Kernel**: All method execution logic (normalization, validation, invocation) is centralized in `@open-wa/mcp/src/execution/kernel.ts`.
2.  **Transport Parity**: Both HTTP (Easy API) and MCP (Streamable HTTP) transports use the same execution kernel, ensuring identical behavior across interfaces.
3.  **Lifecycle Parity**: MCP enforces the same readiness gate as HTTP — tools block until the session is fully connected (unless `apiLifecycle: 'immediate'` is configured).
4.  **Discovery**: MCP tool definitions are dynamically derived from the Open-WA schema registry.
5.  **Security**: Access requires an `apiKey`. MCP refuses to start without one. Auth is enforced on every request, not just at mount time.

## Transport

open-wa uses the **Streamable HTTP** transport from the MCP SDK (`WebStandardStreamableHTTPServerTransport`). This provides a single endpoint:

| Method | Purpose |
| :--- | :--- |
| `POST /mcp` | JSON-RPC messages (initialize, tools/list, tools/call) |
| `GET /mcp` | Server-initiated SSE stream (notifications) |
| `DELETE /mcp` | Session termination |

This replaces the older SSE pattern (`GET /mcp` + `POST /mcp/messages?sessionId=...`) which required two endpoints and manual session ID management.

## Authentication

MCP inherits the Easy API authentication boundary:

- **Header**: `X-API-Key: YOUR_API_KEY`

Auth is checked on every HTTP request before it reaches the MCP transport layer. Without a valid key, the response is `401 Unauthorized`.

## Configuration

MCP is configured via the `mcp` object in `config.json`:

```json
{
  "apiKey": "YOUR_SECRET_KEY",
  "mcp": {
    "enabled": true,
    "path": "/mcp",
    "exposeToolsMeta": true
  }
}
```

| Option | Default | Description |
| :--- | :--- | :--- |
| `enabled` | `false` | Enables the MCP Streamable HTTP transport server. |
| `path` | `"/mcp"` | The base path for the MCP endpoint. |
| `exposeToolsMeta` | `true` | Exposes a debug route at `/meta/mcp-tools.json`. |

### Startup behavior

If `mcp.enabled` is `true` but `apiKey` is not set, the server **refuses to start** with:

```
MCP requires Easy API apiKey. Refusing to start with MCP enabled and no apiKey configured.
```

This is intentional — MCP should never be accidentally public.

## Usage for AI Agents

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "open-wa": {
      "url": "http://localhost:8080/mcp",
      "headers": {
        "X-API-Key": "YOUR_API_KEY"
      }
    }
  }
}
```

### Cursor / Windsurf

Add a new MCP server with type **SSE** (Cursor's term for Streamable HTTP) and URL `http://localhost:8080/mcp`. Include `X-API-Key` in headers.

## Developer Tools

- **Health Checks**: The `/health` endpoint exposes `mcpAvailable` and `mcpEnabled` flags.
- **Tools Meta**: Visit `/meta/mcp-tools.json` to see the exact tool definitions, endpoint path, and auth requirement.
- **Dashboard**: A dedicated MCP setup page at `/dashboard/mcp` shows connection status, copy-paste config snippets, and live links to inspect tool definitions.

## Security Boundary

- **Authentication**: Required on every request via `X-API-Key` header.
- **Startup**: Fails closed without `apiKey`.
- **Scope**: Only schema-registered methods are exposed as tools.
- **Readiness**: Tool execution blocks until the WhatsApp session is fully connected.
- **Boundary**: MCP is Easy API-only. Not available through `createClient()`.

## Package structure

```
packages/mcp/
├── src/
│   ├── index.ts               # Barrel exports
│   ├── manifest.ts            # Schema → MCP tool projection
│   ├── tool-naming.ts         # Canonical tool name generation
│   ├── adapter/
│   │   └── hono-mcp.ts        # Streamable HTTP adapter for Hono
│   └── execution/
│       ├── kernel.ts           # Shared normalize → validate → invoke pipeline
│       ├── args.ts             # Payload normalization (alias resolution)
│       ├── invoke.ts           # Client method invocation
│       └── errors.ts           # MCP-specific error types
├── test/
│   ├── manifest.test.ts        # Manifest projection tests
│   ├── kernel.test.ts          # Execution kernel tests
│   └── adapter.test.ts         # Auth + transport + readiness tests
├── package.json
├── tsconfig.json
└── vitest.config.ts
```
