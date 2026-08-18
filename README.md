> [!WARNING]
> When you use this project, you explicitly agree to the [Terms of Service](./tos.md).
>
> This project is unofficial and is not affiliated with WhatsApp or Meta. Use it at your own risk.

> [!CAUTION]
> This repository is on **version 5 (Alpha)**.
>
> For production systems, use stable version **4.76.0**:
>
> ```bash
> npx @open-wa/wa-automate@4.76.0
> ```

<div align="center">

<img src="https://raw.githubusercontent.com/open-wa/wa-automate-nodejs/master/resources/hotfix-logo.png" alt="open-wa logo" width="120" height="120" />

# open-wa / wa-automate

**The modern TypeScript automation runtime, HTTP API, and AI tool surface for WhatsApp Web.**

[![npm version](https://img.shields.io/npm/v/@open-wa/wa-automate.svg?style=flat-square&color=22c55e&label=npm)](https://www.npmjs.com/package/@open-wa/wa-automate)
[![node version](https://img.shields.io/node/v/@open-wa/wa-automate?style=flat-square&color=3b82f6)](https://nodejs.org)
[![downloads](https://img.shields.io/npm/dm/@open-wa/wa-automate.svg?style=flat-square&color=6366f1)](https://www.npmjs.com/package/@open-wa/wa-automate)
[![license](https://img.shields.io/badge/license-Hippocratic-amber.svg?style=flat-square)](./LICENSE.md)
[![discord](https://img.shields.io/discord/661438166758195211?style=flat-square&color=8b5cf6&label=discord)](https://discord.gg/dnpp72a)

<br />

[**Documentation**](https://openwa.dev) &nbsp;•&nbsp;
[**Easy API**](#quick-start-easy-api) &nbsp;•&nbsp;
[**SocketClient**](#simple-automation-socketclient) &nbsp;•&nbsp;
[**Embedded Runtime**](#deep-integration-embedded-runtime) &nbsp;•&nbsp;
[**AI Agents (MCP)**](#ai-agent-integration-mcp) &nbsp;•&nbsp;
[**Plugins**](#plugins-and-integrations) &nbsp;•&nbsp;
[**Community**](#support)

<br />

</div>

---

## What is open-wa?

`@open-wa/wa-automate` turns a WhatsApp account into a programmable platform. Run it as a standalone HTTP/SSE daemon, embed it directly into your TypeScript application, connect remote bots over lightweight RPC, or connect AI coding assistants and LLMs using the Model Context Protocol (MCP).

### What you can build

- **Customer Support Inboxes**: Sync WhatsApp conversations in real time with Chatwoot, Zendesk, or custom CRMs.
- **Automated Notifications**: Dispatch order updates, booking alerts, and OTP verification codes from backend jobs.
- **AI Agent Tool Surfaces**: Connect Claude, Cursor, and Windsurf directly to WhatsApp through built-in MCP endpoints.
- **Webhook Bridges**: Transform WhatsApp events into structured HTTP webhooks for serverless workflows.
- **Multi-Tenant Bots**: Manage multiple isolated sessions concurrently with dedicated per-chat execution sandboxes.

---

## Capabilities at a glance

| Capability | Description | Recommended for |
| --- | --- | --- |
| **Easy API** | Standalone HTTP RPC & Server-Sent Events daemon with OpenAPI/Swagger UI | Fast setup, microservices, non-Node.js backends |
| **SocketClient** | Remote client connecting to a running Easy API instance over HTTP/SSE | Bots and workers without local browser overhead |
| **Embedded Runtime** | Direct in-process lifecycle control using `createClient` | Deep custom integrations, custom browser orchestration |
| **Browser Drivers** | Decoupled drivers for Puppeteer, Playwright, and Lightpanda | Flexible execution environments and serverless runtimes |
| **Plugin System** | Modular extensibility via `@open-wa/plugin-sdk` | Chatwoot, Webhooks, S3 storage, custom plugins |
| **Cloudflare Proxy** | Zero-inbound reverse proxy using Cloudflare Workers & Durable Objects | Secure remote access without exposing local ports |
| **Model Context Protocol** | Native MCP server exposing WhatsApp methods as AI tools | Claude Desktop, Cursor, Windsurf, OpenCode |

---

## Pick your integration path

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        Which setup fits your goal?                    │
└────────────────────────────────────────────────────────────────────────┘
                                    │
          ┌─────────────────────────┼─────────────────────────┐
          ▼                         ▼                         ▼
   [ Instant API / CLI ]     [ Remote Node Bot ]      [ Embedded Engine ]
          │                         │                         │
          ▼                         ▼                         ▼
      Easy API                SocketClient               createClient
  npx @open-wa/wa-automate     @open-wa/socket-client     @open-wa/wa-automate
          │                         │                         │
  • Interactive /api-docs/   • Zero browser memory      • Full driver control
  • Built-in MCP server      • Simple reconnect loop    • Direct CDP / lifecycle
```

---

## Quick start: Easy API

Launch a fully documented WhatsApp HTTP API daemon in one command:

```bash
npx @open-wa/wa-automate@alpha --port 8080 --api-key "YOUR_SECURE_KEY"
```

1. **Pairing**: Scan the QR code rendered in your terminal, or supply `--link-code <PHONE_NUMBER>` for numeric pairing.
2. **Interactive Docs**: Open `http://localhost:8080/api-docs/` in your browser to inspect and test all available endpoints.
3. **OpenAPI Specs**: Access machine-readable schemas at `http://localhost:8080/meta/swagger.json` and Postman collections at `http://localhost:8080/meta/postman.json`.

### Useful CLI options

```bash
# Start a named session for multi-account management
npx @open-wa/wa-automate@alpha --session-id sales --port 8081

# Run with a custom configuration file
npx @open-wa/wa-automate@alpha --config ./wa.config.mjs

# Launch with PM2 process manager
npx @open-wa/wa-automate@alpha --pm2
```

### Docker deployment

```bash
docker run -p 8080:8080 --init openwa/wa-automate
```

> [!TIP]
> Always include the `--init` flag in Docker so container init signals properly reap orphaned browser processes. Mount a persistent volume to preserve session tokens across restarts.

---

## Simple automation: SocketClient

When building bots or automation workers, run Easy API as a daemon and connect your application using `@open-wa/socket-client`:

```bash
npm install @open-wa/socket-client
```

```ts
import { SocketClient } from '@open-wa/socket-client';

async function main() {
  const client = await SocketClient.connect(
    'http://localhost:8080',
    'YOUR_SECURE_KEY'
  );

  // Subscribe to incoming messages
  client.onMessage(async (message) => {
    if (message.body === '!ping') {
      await client.sendText(message.from, '🏓 pong');
    }
  });

  console.log('Bot connected and listening for messages');
}

main().catch(console.error);
```

---

## Deep integration: embedded runtime

For full control over the browser lifecycle, launch options, and session initialization, embed open-wa directly into your application:

```bash
npm install @open-wa/wa-automate @open-wa/client @open-wa/driver-puppeteer
```

```ts
import { createClient } from '@open-wa/wa-automate';
import { PuppeteerDriver } from '@open-wa/driver-puppeteer';
import { Client } from '@open-wa/client';

async function main() {
  const openwa = await createClient({
    sessionId: 'sales-bot',
    driver: new PuppeteerDriver(),
    headless: true,
  });

  const client = new Client({
    client: openwa,
    transport: openwa.getTransport(),
  });
  await client.start();

  client.onMessage(async (message) => {
    if (message.body === '!hello') {
      await client.sendText(message.from, 'Hello from embedded open-wa!');
    }
  });
}

main().catch(console.error);
```

### Supported browser drivers

| Driver package | Engine | Best for |
| --- | --- | --- |
| `@open-wa/driver-puppeteer` | Chrome / Chromium | Standard server environments, full feature parity |
| `@open-wa/driver-playwright` | Chromium (Playwright) | Multi-browser setups, cross-platform CI pipelines |
| `@open-wa/driver-lightpanda` | Lightpanda C++ browser | Ultra-low memory usage, edge environments |

---

## AI agent integration (MCP)

Open-WA includes a native **Model Context Protocol (MCP)** server, exposing WhatsApp automation methods as structured tools to AI assistants.

> [!NOTE]
> MCP is an Easy API integration exposed over HTTP/SSE. It is enabled via `wa.config.mjs` or CLI daemon mode.

### 1. Enable MCP in `wa.config.mjs`

```js
export default {
  apiKey: process.env.WA_API_KEY,
  port: 8080,
  mcp: {
    enabled: true,
    path: '/mcp',
    exposeToolsMeta: true,
  },
};
```

### 2. Connect Claude Desktop

Add open-wa to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "open-wa": {
      "url": "http://localhost:8080/mcp",
      "headers": {
        "X-API-Key": "YOUR_SECURE_KEY"
      }
    }
  }
}
```

### 3. Connect Cursor and Windsurf

Add a new remote MCP server endpoint pointing to `http://localhost:8080/mcp` with header `X-API-Key: YOUR_SECURE_KEY`.

---

## Plugins and integrations

Extend open-wa using modular plugins registered in `wa.config.mjs`:

```js
// wa.config.mjs
export default {
  plugins: [
    '@open-wa/integration-chatwoot',
    '@open-wa/integration-webhook',
    '@open-wa/integration-s3',
  ],
  pluginConfig: {
    webhook: {
      url: 'https://api.example.com/webhooks/whatsapp',
    },
    chatwoot: {
      url: 'https://app.chatwoot.com',
      apiToken: process.env.CHATWOOT_TOKEN,
      inboxId: 1234,
    },
  },
};
```

### Official packages

- [`@open-wa/plugin-sdk`](./packages/plugin-sdk): Core SDK for authoring custom plugins
- [`@open-wa/integration-webhook`](./integrations/webhook): Reliable HTTP webhook delivery for WhatsApp events
- [`@open-wa/integration-chatwoot`](./integrations/chatwoot): Two-way synchronization with Chatwoot inboxes
- [`@open-wa/integration-s3`](./integrations/s3): Automatic media archiving to S3/R2 storage
- [`@open-wa/cf-proxy`](./packages/cf-proxy): Cloudflare Workers reverse-tunnel proxy
- [`@open-wa/node-red`](./integrations/node-red): Node-RED workflow nodes for WhatsApp

---

## Cloudflare session proxy

Access a local WhatsApp session remotely over the internet without exposing public ports:

1. Deploy the proxy worker in [`packages/cf-proxy`](./packages/cf-proxy) to Cloudflare Workers.
2. Configure your local session with `UPSTREAM_TOKEN`.
3. Connect remote consumers using `SocketClient`:

```ts
import { SocketClient } from '@open-wa/socket-client';

const client = await SocketClient.connect(
  'cf-proxy://open-wa-proxy.YOUR_ACCOUNT.workers.dev?sessionId=sales&token=CONSUMER_TOKEN'
);
```

---

## Documentation reference

| Guide | Description | URL |
| --- | --- | --- |
| **Documentation Portal** | Official guides, tutorials, and references | [openwa.dev](https://openwa.dev) |
| **Quickstart** | First-time setup and connection tutorial | [openwa.dev/docs/getting-started/quickstart](https://openwa.dev/docs/getting-started/quickstart) |
| **Easy API Guide** | REST endpoints and SSE event streams | [openwa.dev/docs/getting-started/easy-api](https://openwa.dev/docs/getting-started/easy-api) |
| **Messages Guide** | Sending text, media, buttons, and polls | [openwa.dev/docs/guides/messages](https://openwa.dev/docs/guides/messages) |
| **MCP AI Tools** | Exposing WhatsApp methods to LLMs | [openwa.dev/docs/guides/mcp](https://openwa.dev/docs/guides/mcp) |
| **Plugin SDK** | Authoring and publishing plugins | [openwa.dev/docs/plugins/getting-started](https://openwa.dev/docs/plugins/getting-started) |
| **v5 Migration Guide** | Migrating from version 4 to version 5 | [openwa.dev/docs/releases/v5-alpha](https://openwa.dev/docs/releases/v5-alpha) |
| **API Reference** | Complete method catalogue | [openwa.dev/docs/reference/client/index](https://openwa.dev/docs/reference/client/index) |

---

## Development and contribution

### Prerequisites

- **Node.js**: `>=22.21.1`
- **pnpm**: `11.20.0` (managed via [`package.json`](./package.json))

```bash
# Clone the repository
git clone https://github.com/open-wa/wa-automate-nodejs.git
cd wa-automate-nodejs

# Install dependencies and build all packages
pnpm install
pnpm build

# Run unit and integration tests
pnpm test

# Run type checker and linter
pnpm typecheck
pnpm lint
```

For detailed contribution workflows, see [`CONTRIBUTING.md`](./CONTRIBUTING.md).

---

## Support and commercial inquiries

- **Community Discord**: [Join the open-wa Discord server](https://discord.gg/dnpp72a)
- **Commercial Licenses**: [Purchase an open-wa commercial key](https://openwa.page.link/key)
- **Enterprise Consulting**: Contact [shah@openwa.dev](mailto:shah@openwa.dev?subject=WhatsApp%20Consulting)

---

## License and legal notice

- **License**: [Hippocratic + Do Not Harm Version 1.0](./LICENSE.md)
- **Legal Notice**: This project is independent and unofficial software. It is not affiliated with, authorized, maintained, sponsored, or endorsed by WhatsApp or Meta.
- **Cryptography Notice**: This software contains cryptographic algorithms and is classified under U.S. Export Administration Regulations ECCN 5D002.C.1 (License Exception ENC / TSU).
