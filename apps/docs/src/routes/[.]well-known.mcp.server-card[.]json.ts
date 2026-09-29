import { createFileRoute } from '@tanstack/react-router';
import { CURRENT_VERSION } from '@/lib/site';

export const Route = createFileRoute('/.well-known/mcp/server-card.json')({
  server: {
    handlers: {
      GET({ request }: { request: Request }) {
        const origin = new URL(request.url).origin;

        return new Response(
          JSON.stringify(
            {
              serverInfo: {
                name: 'open-wa documentation',
                version: CURRENT_VERSION,
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
