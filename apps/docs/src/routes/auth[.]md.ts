import { createFileRoute } from '@tanstack/react-router';

function getAuthMarkdown(origin: string) {
  return `# open-wa auth.md

This document describes agent access to the open-wa documentation MCP server and to self-hosted open-wa runtimes.

## Registration

The documentation MCP server at ${origin}/mcp is public and read-only. Agents may connect anonymously without creating an account or obtaining a credential.

## Anonymous documentation access

Connect with the MCP Streamable HTTP transport at ${origin}/mcp. The server exposes documentation search and read tools. No Authorization header, identity assertion, or registration request is needed.

Discover the server metadata at ${origin}/.well-known/mcp/server-card.json.

## Operator-provisioned runtime access

Self-hosted open-wa Easy API instances may expose a separate MCP endpoint. A human operator enables MCP, provisions an Easy API key, and gives the agent the instance-specific HTTPS endpoint.

Send the provisioned key in the X-API-Key header on every request. The docs site cannot issue, recover, inspect, or rotate keys for a self-hosted instance.

See ${origin}/docs/guides/mcp for configuration and security guidance.

## Revoke runtime access

The instance operator revokes access by rotating or removing the Easy API key and restarting the affected runtime. Agents cannot revoke another deployment's credential through the docs site.

## Discovery metadata

- Protected resource metadata: ${origin}/.well-known/oauth-protected-resource
- Agent registration metadata: ${origin}/.well-known/oauth-authorization-server
- MCP Server Card: ${origin}/.well-known/mcp/server-card.json
`;
}

export const Route = createFileRoute('/auth.md')({
  server: {
    handlers: {
      GET({ request }: { request: Request }) {
        const origin = new URL(request.url).origin;

        return new Response(getAuthMarkdown(origin), {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=3600',
            'Content-Type': 'text/markdown; charset=utf-8',
          },
        });
      },
    },
  },
});
