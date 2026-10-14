# @open-wa/mcp

MCP server integration for open-wa

Part of the [@open-wa v5 monorepo](https://github.com/open-wa/wa-automate-nodejs).

## Install

```bash
pnpm add @open-wa/mcp
```

## Documentation

See the [docs site](https://openwa.dev).

Hosted MCP runs on Easy API with an API key and `mcp.enabled: true`. It serves
MCP 2.0 (`2026-07-28`), with tools and webhook event subscriptions on the same
endpoint. Clients must support that protocol revision.

ChatGPT Work can subscribe to `message.received`, `ack.changed` and
`session.state.changed`. Subscriptions and pending deliveries persist under
`.open-wa/`; keep this directory on persistent storage. Callbacks are verified,
signed using Standard Webhooks and restricted to public HTTPS destinations.
There is no historical event replay (`cursor: null`).

See [MCP Events](https://openwa.dev/docs/client-and-integrations/mcp-events) and
the [event contracts](https://openwa.dev/docs/reference/event-contracts).

## License

[H-DNH 1.1](https://github.com/open-wa/wa-automate-nodejs/blob/master/LICENSE.md) — Hippocratic + Do Not Harm
