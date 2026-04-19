import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/.well-known/oauth-authorization-server')({
  // @ts-expect-error TanStack types mismatch
  server: {
    handlers: {
      GET({ request }: { request: Request }) {
        const url = new URL(request.url);
        const origin = url.origin;
        
        // Return OAuth/OIDC discovery metadata (RFC 8414)
        const config = {
          "issuer": origin,
          "authorization_endpoint": `${origin}/oauth/authorize`,
          "token_endpoint": `${origin}/oauth/token`,
          "response_types_supported": ["code", "token"],
          "grant_types_supported": ["authorization_code", "client_credentials"],
          "jwks_uri": `${origin}/oauth/jwks`
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
