import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/.well-known/mcp/server-card.json')({
  // @ts-expect-error TanStack types mismatch
  server: {
    handlers: {
      GET({ request }: { request: Request }) {
        const origin = new URL(request.url).origin;

        return new Response(
          JSON.stringify(
            {
              serverInfo: {
                name: 'open-wa documentation',
                version: '5.0.0-alpha',
              },
              transport: {
                type: 'streamable-http',
                endpoint: `${origin}/mcp`,
              },
              capabilities: {
                tools: {
                  listChanged: false,
                },
              },
              authentication: {
                required: false,
              },
              documentation: `${origin}/docs/guides/mcp`,
            },
            null,
            2,
          ),
          {
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Cache-Control': 'public, max-age=3600',
              'Content-Type': 'application/json; charset=utf-8',
            },
          },
        );
      },
    },
  },
});
