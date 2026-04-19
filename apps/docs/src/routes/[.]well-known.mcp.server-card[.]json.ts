import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/.well-known/mcp/server-card.json')({
  // @ts-expect-error TanStack types mismatch
  server: {
    handlers: {
      GET() {
        // Return an MCP Server Card (SEP-1649)
        const mcpCard = {
          "serverInfo": {
            "name": "openwa-docs",
            "version": "1.0.0"
          },
          "transport": {
            "type": "sse",
            "endpoint": "https://openwa.dev/mcp/sse"
          },
          "capabilities": {
            "prompts": {},
            "resources": {},
            "tools": {}
          }
        };
        
        return new Response(JSON.stringify(mcpCard, null, 2), {
          headers: {
            'Content-Type': 'application/json',
          },
        });
      },
    },
  },
});
