import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/.well-known/mcp/server-card.json')({
  // @ts-expect-error TanStack types mismatch
  server: {
    handlers: {
      GET() {
        return new Response(
          JSON.stringify(
            {
              error: 'MCP is not hosted on the docs site.',
              docs: 'https://docs.openwa.dev/docs/guides/mcp',
              runtimeEndpoint: '/mcp',
            },
            null,
            2,
          ),
          {
            status: 404,
            headers: {
              'Content-Type': 'application/json',
            },
          },
        );
      },
    },
  },
});
