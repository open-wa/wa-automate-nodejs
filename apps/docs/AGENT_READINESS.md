# Agent readiness deployment

The docs Worker serves Markdown negotiation, Auth.md discovery, OAuth resource metadata, an MCP Server Card, and a public read-only documentation MCP endpoint.

## HTTP deployment

Deploy the current `apps/docs` Worker to `docs.openwa.dev`, then verify:

```sh
curl -i -H 'Accept: text/markdown' https://docs.openwa.dev/docs
curl -i https://docs.openwa.dev/auth.md
curl -i https://docs.openwa.dev/.well-known/oauth-protected-resource
curl -i https://docs.openwa.dev/.well-known/oauth-authorization-server
curl -i https://docs.openwa.dev/.well-known/mcp/server-card.json
```

The Markdown response must include `Content-Type: text/markdown`, `Vary: Accept`, and `X-Markdown-Tokens`.

## Cloudflare zone publication

Review `dns-aid.zone`, create a scoped API token with DNS, DNSSEC, and Zone Settings edit access, then run:

```sh
CLOUDFLARE_API_TOKEN=... pnpm --dir apps/docs publish:agent-readiness
```

The publisher upserts DNS-AID records, attempts to enable Cloudflare Markdown for Agents, and enables DNSSEC. Application-level Markdown negotiation remains the fallback when the zone plan does not include Cloudflare's converter.

DNSSEC is complete only after the returned DS record exists at the registrar. Verify the authenticated chain and DNS-AID records:

```sh
dig +dnssec DS openwa.dev
dig +dnssec SVCB _index._agents.openwa.dev
dig +dnssec SVCB _index._agents.docs.openwa.dev
```

Finally, scan `https://docs.openwa.dev` through the agent-readiness scanner.
