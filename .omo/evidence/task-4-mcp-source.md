# Task 4 MCP source verification

Result: pass.

Source evidence:
- `packages/config/src/schema/config.ts` defines `mcp.enabled`, `mcp.path`, and `mcp.exposeToolsMeta`.
- `packages/api/src/createApiServer.ts` throws `MCP requires Easy API apiKey...` when `mcp.enabled` is true without `apiKey`.
- `packages/api/src/createApiServer.ts` exposes `/health` fields `capabilities.mcpEnabled`, `mcpAvailable`, and `mcpPath`.
- `packages/api/src/createApiServer.ts` mounts the MCP adapter when `config.mcp?.enabled` is true.
- `packages/wa-automate/src/cli-runtime.ts` does not parse `--mcp`.
