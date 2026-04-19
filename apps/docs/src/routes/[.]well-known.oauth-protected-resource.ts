import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/.well-known/oauth-protected-resource')({
  // @ts-expect-error TanStack types mismatch
  server: {
    handlers: {
      GET({ request }: { request: Request }) {
        const url = new URL(request.url);
        const origin = url.origin;
        
        // Return OAuth Protected Resource Metadata (RFC 9728)
        const config = {
          "resource": origin,
          "authorization_servers": [`${origin}/oauth`],
          "scopes_supported": ["read", "write"]
        };
        
        return new Response(JSON.stringify(config, null, 2), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      },
    },
  },
});
