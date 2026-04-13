---
name: easy-api-mcp
description: Teaches AI agents how to connect to the open-wa hosted MCP surface via Easy API.
---

# Easy API MCP Skill

This skill teaches AI agents how to connect to and use the open-wa MCP integration hosted through Easy API.

## What is this?

open-wa exposes a hosted MCP endpoint that wraps every Easy API method as a discoverable MCP tool. This is the recommended surface for AI agent integration.

## Connection

The MCP endpoint uses **Streamable HTTP** transport — a single endpoint handles all operations:

- `POST /mcp` — JSON-RPC messages (initialize, tools/list, tools/call)
- `GET /mcp` — Server-initiated SSE stream when needed
- `DELETE /mcp` — Session termination

### Authentication

**Every request must include your Easy API key.** Without it, you get `401 Unauthorized`.

Methods to provide the key:
- **Header**: `X-API-Key: YOUR_API_KEY`

### Client Configuration

**Claude Desktop** (`claude_desktop_config.json`):
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

**Cursor / Windsurf**: Add MCP server with URL `http://localhost:8080/mcp` and set `X-API-Key` header. Note: Cursor currently calls Streamable HTTP by the name **"SSE"** in its UI dropdown.

## When to use hosted MCP vs alternatives

| Scenario | Use |
| :--- | :--- |
| AI agent interacting with WhatsApp | **Hosted MCP** (this) |
| Local CLI tool or IDE integration | **Hosted MCP** via Streamable HTTP |
| Custom SDK integration in your own app | `createClient()` directly (no MCP) |

## Tool Discovery

Tools are namespaced:

- `messages.sendText` — Send a text message
- `chats.getAll` — Get all chats
- `groups.create` — Create a group

Use `tools/list` (MCP protocol) to discover all available tools.

For debugging, visit `/meta/mcp-tools.json` on the API host.

## Important Boundaries

- MCP is **Easy API-only**. Not available through `createClient()`.
- MCP requires an `apiKey`. No key = server refuses to start.
- Auth is enforced on every request, not just initialization.
- Tool execution blocks until the WhatsApp session is fully connected.
- MCP exposes the same methods as HTTP API — no MCP-exclusive features.

## Troubleshooting

### 401 Unauthorized
Your API key is missing or wrong. Verify:
1. Server has `apiKey` in `config.json`
2. Your client sends `X-API-Key` header with the correct value
3. `mcp.enabled` is `true`

### Server refuses to start
```
MCP requires Easy API apiKey. Refusing to start with MCP enabled and no apiKey configured.
```
Set `apiKey` in your config before enabling MCP.

### Tools list is empty
The schema registry has no methods registered. The open-wa runtime may not have fully initialized.

### Tool execution returns "Session is not connected"
The WhatsApp session isn't ready yet. Wait for the session to be fully connected before calling tools.
