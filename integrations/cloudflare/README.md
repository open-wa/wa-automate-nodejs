# @open-wa/cf-proxy

`@open-wa/cf-proxy` is the Cloudflare Worker reverse tunnel for open-wa Easy API sessions. The local runtime opens an outbound WebSocket to the Worker, so the local machine does not need an inbound port. The Worker remains a remotely reachable authenticated entry point.

The package is private to the open-wa monorepo. It is not an npm consumer package, so deployment starts from this repository's `packages/cf-proxy` entrypoint.

## Topology and authentication

```text
Remote consumer --HTTPS/WebSocket--> Cloudflare Worker --Durable Object--> local TunnelClient --HTTP--> Easy API
```

The Worker uses two independent secrets:

- `UPSTREAM_TOKEN` authenticates the local runtime at `/sessions/:sessionId/upstream`.
- `CONSUMER_TOKEN` authenticates `@open-wa/socket-client` callers on `/sessions/:sessionId/connect`.

Other HTTP requests pass through to the session unchanged, so the session's Easy API key or MCP OAuth sign-in decides access. The session does not connect to the proxy without an Easy API key.

The Worker routes each session ID to a Durable Object. Requests and responses stream through the tunnel. An absent upstream returns `503 Session offline` with the time it disconnected. A response that does not start within 30 seconds returns `504`, and a started response can stream for as long as needed. Hibernation can reduce active Durable Object compute while the connection is idle, but it does not make Worker requests, storage, egress, domains, or account-plan charges free. Check [Cloudflare Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/) for the account and plan in use.

## Deploy the Worker

From a clean checkout:

```bash
git clone https://github.com/open-wa/wa-automate-nodejs.git
cd wa-automate-nodejs
corepack enable
pnpm install
cd packages/cf-proxy
pnpm exec wrangler login
pnpm exec wrangler whoami
```

`wrangler.jsonc` binds the `SESSION_TUNNEL` Durable Object to `SessionTunnel`. Set the secret values through Wrangler without committing them:

```bash
export OPENWA_PROXY_UPSTREAM_TOKEN="$(openssl rand -hex 32)"
export OPENWA_PROXY_CONSUMER_TOKEN="$(openssl rand -hex 32)"
printf '%s' "$OPENWA_PROXY_UPSTREAM_TOKEN" | pnpm exec wrangler secret put UPSTREAM_TOKEN
printf '%s' "$OPENWA_PROXY_CONSUMER_TOKEN" | pnpm exec wrangler secret put CONSUMER_TOKEN
pnpm exec wrangler deploy
```

Record the deployed hostname as `OPENWA_PROXY_HOST`, for example `https://open-wa-proxy.<account>.workers.dev`. The local runtime needs the upstream value; remote callers need the consumer value.

Contributors with an existing checkout can run `pnpm install` from the repository root and use `pnpm --filter @open-wa/cf-proxy exec wrangler whoami` followed by `pnpm --filter @open-wa/cf-proxy exec wrangler deploy`. Run `secret put` again only when rotating a value.

## Attach a local session

Run the CLI on the machine that owns the WhatsApp browser session:

```bash
export OPENWA_PROXY_HOST='https://open-wa-proxy.<account>.workers.dev'
npx @open-wa/wa-automate \
  --session-id sales \
  --port 8080 \
  --api-key "$OPENWA_API_KEY" \
  --proxy-host "$OPENWA_PROXY_HOST" \
  --proxy-token "$OPENWA_PROXY_UPSTREAM_TOKEN"
```

The CLI connects to `/sessions/sales/upstream` and sends the upstream token in the `Authorization` header. WhatsApp Web and Easy API stay on the local machine; the Worker does not run the browser or change session readiness.

## Consume a session

Call the Easy API through the Worker with the Easy API key:

```bash
curl -i -X POST \
  "$OPENWA_PROXY_HOST/sessions/sales/api/sendText" \
  -H "X-API-Key: $OPENWA_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"args":["1234567890@c.us","Hello through Cloudflare"]}'
```

Node clients can use the compatibility URL. The client converts it to the tunnel WebSocket and sends the consumer token to `/sessions/<sessionId>/connect`:

```ts
import { SocketClient } from '@open-wa/socket-client';

const client = await SocketClient.connect(
  `cf-proxy://open-wa-proxy.<account>.workers.dev?sessionId=sales&token=${encodeURIComponent(process.env.OPENWA_PROXY_CONSUMER_TOKEN)}`,
);
console.log(await client.getHostNumber());
```

The consumer token only opens the RPC socket. The local Easy API still checks its own authentication.

## Troubleshooting

| Symptom | Command or observation | Expected result | Next action |
| --- | --- | --- | --- |
| Worker deploy fails | `pnpm exec wrangler whoami` and inspect `wrangler.jsonc` | The intended account is authenticated and `SESSION_TUNNEL` binds `SessionTunnel`. | Log in to the intended account and deploy from `packages/cf-proxy`; fix binding or migration data before retrying. |
| Local runtime gets `401 Unauthorized upstream` | Compare `--proxy-token` with `pnpm exec wrangler secret list`. | The local runtime connects to the upstream WebSocket for the same session ID. | Rotate `UPSTREAM_TOKEN`, pass the exact value to the CLI, and restart it. |
| Socket client gets `401 Unauthorized consumer` | Check the `token` in the `cf-proxy://` URL. | A matching consumer token reaches the Worker. | Rotate `CONSUMER_TOKEN` if necessary and reconnect callers. |
| Consumer gets `503 Session offline` | Inspect the local runtime log for the upstream connection and match the session ID in the URL. | The upstream WebSocket is open for that session. | Start the local runtime or correct `--session-id`; then check local Easy API readiness. |
| Consumer gets `504` | Call the same API path against `http://127.0.0.1:8080`. | The local API starts its response within 30 seconds. | Fix the local API, browser, or Easy API key before investigating Worker routing. |

## Development

```bash
pnpm --filter @open-wa/cf-proxy dev
```

The Worker entrypoint is `packages/cf-proxy/src/index.ts`; the Durable Object is `src/tunnel-do.ts`.

## Documentation

See the [Cloudflare Session Proxy guide](https://openwa.dev/docs/guides/cf-proxy).

## License

[H-DNH 1.1](https://github.com/open-wa/wa-automate-nodejs/blob/master/LICENSE.md) - Hippocratic + Do Not Harm
