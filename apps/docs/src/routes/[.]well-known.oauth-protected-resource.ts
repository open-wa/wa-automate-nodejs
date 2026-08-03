import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/.well-known/oauth-protected-resource')({
  server: {
    handlers: {
      GET({ request }: { request: Request }) {
        const url = new URL(request.url);
        const origin = url.origin;

        const config = {
          resource: `${origin}/mcp`,
          authorization_servers: [origin],
          scopes_supported: ['mcp:docs:read'],
          bearer_methods_supported: ['header'],
        };

        return new Response(JSON.stringify(config, null, 2), {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=3600',
            'Content-Type': 'application/json; charset=utf-8',
          },
        });
      },
    },
  },
});
