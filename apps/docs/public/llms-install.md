# open-wa installation reference for AI agents

This page is a short, accurate path for an AI coding agent or a setup script to
install open-wa, link a WhatsApp account and send a first message. Each step
links to the full guide. Every documentation page is also available as Markdown
at `https://openwa.dev/llms.mdx/docs/<path>`, and the index is at
[`/llms.txt`](https://openwa.dev/llms.txt).

## 1. Requirements

- **Node.js 22.21.1 or newer** and npm. Check with `node --version`.
- A phone with WhatsApp, to link the account once.
- A browser. The command below downloads Chrome for Testing on the first start; pass `--browser system-chrome` to use the Chrome already installed.

## 2. Create a project

The project generator writes a project that is ready to start. Pass flags so it
asks no questions:

```bash
npm init @open-wa@latest my-api -- --mode easy-api --language js --browser chrome --plugins none --yes
cd my-api
cp .env.example .env
```

Put a long random value in `.env` as `WA_API_KEY` (at least 8 characters).

- `--mode easy-api` runs an HTTP server that any language can call. `--mode sdk`
  writes a Node.js bot that calls open-wa directly.
- `--language` is `js` or `ts`.
- `--plugins` takes a comma-separated list of `jev`, `voxtral`, `webhook` and
  `chatwoot`, or `none`.

All flags: <https://openwa.dev/docs/getting-started/quickstart/generator-options>

Without a generated project, this command starts the same server:

```bash
npx @open-wa/wa-automate@latest --session-id my-api --api-key "<key>"
```

## 3. Start and link WhatsApp

```bash
npm start
```

A QR code appears in the terminal. A person must scan it from **WhatsApp →
Linked devices → Link a device**. Later starts from the same folder reuse the
saved login, which is kept in `<sessionId>.data.json`. To link without a
camera, see <https://openwa.dev/docs/sessions/link-code>.

## 4. Wait until the session is ready

The HTTP server answers before WhatsApp has finished linking. Poll `/health`,
which needs no API key, until `connected` and `session.ready` are both `true`:

```bash
curl http://127.0.0.1:8080/health
```

```json
{
  "status": "ok",
  "connected": true,
  "session": { "state": "READY", "status": "ready", "ready": true, "pending": [], "blockers": [] }
}
```

`status: "ok"` only means the HTTP server is up. Until the session is ready,
method calls return `503`.

## 5. Send a message

Every method has a `POST` route at `/api/<namespace>/<method>` that takes the
method's parameters as a JSON object. Send the key in the `X-API-Key` header.

```bash
curl --fail-with-body http://127.0.0.1:8080/api/messages/sendText \
  -H "X-API-Key: $WA_API_KEY" \
  -H 'Content-Type: application/json' \
  --data '{"to": "447700900123@c.us", "content": "Hello from open-wa"}'
```

A successful call returns the new message ID:

```json
{ "success": true, "data": "true_447700900123@c.us_3EB0C767D1D7E8A2F1C4" }
```

A failure returns an HTTP error with `{ "error": "..." }`. A chat ID is the
full international number without `+`, followed by `@c.us`. Use a chat the
linked account already has; starting a chat with a new number needs a
[license](https://openwa.dev/docs/licensing/pricing).

Full guide: <https://openwa.dev/docs/getting-started/easy-api>

## 6. Receive messages

Open the Server-Sent Events stream and filter it by topic:

```bash
curl --no-buffer 'http://127.0.0.1:8080/api/events?topics=message.received' \
  -H "X-API-Key: $WA_API_KEY"
```

Each `data:` line is a JSON envelope with `id`, `event`, `payload`, `ts` and
`sessionId`. An incoming message is at `payload.message`. For a server that
should receive messages without holding a connection open, use a webhook:
<https://openwa.dev/docs/guides/receive-webhooks>

## 7. The Node.js SDK instead of HTTP

```bash
npm install @open-wa/wa-automate
```

```js
import { create } from '@open-wa/wa-automate';

const client = await create({ sessionId: 'my-bot' });

client.onMessage(async message => {
  if (!message.fromMe && message.body === '!ping') {
    await client.sendText(message.from, 'pong');
  }
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => {
    void client.stop(signal).catch(console.error);
  });
}
```

`create()` starts the browser, prints the QR code when the account isn't
linked yet, and resolves once the session is ready to send.

Full guide: <https://openwa.dev/docs/getting-started/custom-code>

## 8. Docker

```bash
mkdir -p sessions
docker run --name openwa-sales --init \
  -p 127.0.0.1:8080:8080 \
  -v "$PWD/sessions:/sessions" \
  -e WA_SESSION_ID=sales \
  -e WA_SESSION_DATA_PATH=/sessions \
  -e WA_API_KEY="replace-with-a-long-random-key" \
  openwa/wa-automate:latest
```

`WA_SESSION_DATA_PATH` saves the login file in the mounted folder, so it
survives the container being replaced. Read the QR code from
`docker logs -f openwa-sales`. Any configuration option can be set as `WA_`
followed by the option name in upper snake case.

Full guide: <https://openwa.dev/docs/getting-started/docker>

## 9. Connect an AI agent to WhatsApp

Easy API includes a Model Context Protocol server that exposes each method as a
tool. Enable it in the config file with `mcp: { enabled: true }` and point the
MCP client at `http://127.0.0.1:8080/mcp` with the `X-API-Key` header.

- MCP setup: <https://openwa.dev/docs/guides/mcp>
- Watching a chat for new messages: <https://openwa.dev/docs/guides/mcp-events>
- ChatGPT with a WhatsApp number: <https://openwa.dev/docs/guides/chatgpt-always-on>

## 10. Keep it private and safe

- `/health` is public and can include the pairing QR code. Keep the server on
  `127.0.0.1` or a private network.
- Send `X-API-Key` on every other request, and use HTTPS for anything that
  leaves the machine.
- open-wa is unofficial and automation can get an account banned. Message
  people who expect to hear from you, and read
  <https://openwa.dev/docs/operations/rate-limits> before sending in volume.
- Before customers depend on it, work through
  <https://openwa.dev/docs/operations/go-to-production>.

## Reference

- API reference: <https://openwa.dev/docs/reference/client>
- OpenAPI schema: <https://openwa.dev/openapi.json>, or `/meta/swagger.json` on a
  running server
- Configuration and CLI flags: <https://openwa.dev/docs/guides/configuration-and-cli>
