import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/.well-known/oauth-authorization-server')(
  {
    server: {
      handlers: {
        GET({ request }: { request: Request }) {
          const url = new URL(request.url);
          const origin = url.origin;

          const config = {
            issuer: origin,
            agent_auth: {
              skill: `${origin}/auth.md`,
              register_uri: `${origin}/auth.md#registration`,
              identity_types_supported: ['anonymous', 'service_auth'],
              credential_types_supported: ['none', 'api_key'],
              anonymous: {
                credential_types_supported: ['none'],
                claim_uri: `${origin}/auth.md#anonymous-documentation-access`,
              },
              service_auth: {
                credential_types_supported: ['api_key'],
                claim_uri: `${origin}/auth.md#operator-provisioned-runtime-access`,
                revocation_uri: `${origin}/auth.md#revoke-runtime-access`,
              },
            },
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
  },
);
