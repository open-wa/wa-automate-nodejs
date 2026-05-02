> [!WARNING]
> By using this project you explicitly agree to the [Terms of Service](./tos.md).
>
> This project is unofficial and is not affiliated with WhatsApp or Meta. Use it at your own risk.

> [!CAUTION]
> This repository is currently on version 5, which is still in alpha and may have issues.
>
> For now, use version 4 instead unless you are explicitly testing or contributing to v5.
> The last stable version is 4.76.0
> `npx @open-wa/wa-automate4.76.0`

<div align="center">
<img src="https://raw.githubusercontent.com/open-wa/wa-automate-nodejs/master/resources/hotfix-logo.png" width="128" height="128"/>

# open-wa / wa-automate

**Connect a WhatsApp account, turn it into an API, automate it, and extend it.**

[![npm version](https://img.shields.io/npm/v/@open-wa/wa-automate.svg?color=green)](https://www.npmjs.com/package/@open-wa/wa-automate)
![node](https://img.shields.io/node/v/@open-wa/wa-automate)
[![Downloads](https://img.shields.io/npm/dm/@open-wa/wa-automate.svg)](https://www.npmjs.com/package/@open-wa/wa-automate)
<a href="https://discord.gg/dnpp72a"><img src="https://img.shields.io/discord/661438166758195211?color=blueviolet&label=discord&style=flat" /></a>

</div>

## What this is

`@open-wa/wa-automate` gives you a few practical ways to automate WhatsApp:

- run a ready-made API with the CLI
- connect another app to that runtime
- embed the runtime directly in your own Node.js code
- add integrations and plugins

This repository is currently a **v5 monorepo** and the package version in this repo is **`5.0.0-alpha.1`**. If you are migrating a mature v4 production system, test v5 in a separate environment first.

If you only want the fastest, least-confusing first run, start with **Easy API** below.

## Start with the path that matches you

| If you want to... | Start here |
| --- | --- |
| get WhatsApp connected fast and use it from another service | [Quick start: Easy API](#quick-start-easy-api) |
| build a simple Node automation quickly | [Simple automation: SocketClient](#simple-automation-socketclient) |
| own the runtime inside your own app | [Deep integration: embedded runtime](#deep-integration-embedded-runtime) |
| upgrade existing v4 code carefully | [Migrating from v4 to v5](#migrating-from-v4-to-v5) |
| publish or share a reusable extension | [Plugins and integrations](#plugins-and-integrations) |

## Quick start: Easy API

If you just want to connect a WhatsApp account and get a working API, this is the fastest path:

```bash
npx @open-wa/wa-automate --port 8080
```

That starts an Easy API instance and gives you the first-run authentication flow plus interactive docs for the running session.

**v5 is alpha right now**, so prefer explicit commands like the one above instead of relying on undocumented defaults.

For first login, either:

- scan the QR code the runtime prints, or
- use link-code login if that fits your setup better

Then open:

```text
http://localhost:8080/api-docs/
```

That is the clearest first proof that your session is up and the API is live.

Other useful generated artifacts:

```text
http://localhost:8080/meta/swagger.json
http://localhost:8080/meta/postman.json
```

Useful first commands:

```bash
# choose a port
npx @open-wa/wa-automate --port 8080

# provide your own API key
npx @open-wa/wa-automate --port 8080 --api-key "your-secure-key"

# run a named session
npx @open-wa/wa-automate --session-id sales --port 8081

# send events to your service
npx @open-wa/wa-automate --webhook "https://your-app.example/webhooks/open-wa"
```

Good defaults for a first session:

- set a `sessionId` early if you might run more than one account
- protect the API with an `--api-key` before exposing it outside your machine
- keep business logic in your own app and let open-wa own the WhatsApp runtime

If your goal is simply “connect WhatsApp to another service”, add `--webhook` first and write no custom runtime code until you know you need it.

If you prefer Docker:

```bash
docker run -p 8080:8080 --init openwa/wa-automate
```

Docker notes:

- this is best for local testing or a disposable first run unless you also plan session persistence properly
- `--init` is recommended so zombie processes are cleaned up properly
- you can pin the library version with `W_A_V`, for example `-e W_A_V=4.42.1`

## Simple automation: SocketClient

If you want to build a bot or workflow quickly without embedding the full browser runtime in your app, run Easy API in one place and connect to it from your code.

Start the runtime:

```bash
npx @open-wa/wa-automate --port 8080 --api-key "your-secure-key"
```

Install the remote consumer in your app:

```bash
npm install @open-wa/socket-client
```

Keep the Easy API process running. Your app is a remote consumer, not the runtime host.

Then connect from your app:

```ts
import { SocketClient } from '@open-wa/socket-client';

async function start() {
  const client = await SocketClient.connect('http://localhost:8080', 'your-secure-key');

  client.onMessage(async (message) => {
    if (message.body === 'Hi') {
      await client.sendText(message.from, '👋 Hello!');
    }
  });
}

start().catch(console.error);
```

Why this path is good for most builders:

- open-wa owns the browser automation runtime
- your app stays small and focused on automation logic
- the current v5 runtime uses **HTTP RPC for commands** and **Server-Sent Events for runtime events** behind the compatibility client

This is usually the best choice if you are technical but just want to build a simple automation fast.

## Deep integration: embedded runtime

If you want the most control and are comfortable owning browser/runtime setup directly, use the embedded runtime path.

The v5 public contract exposes `createClient` from `@open-wa/core` through `@open-wa/wa-automate`.

This path is lower-level than Easy API + SocketClient. Use it when you want runtime ownership, not when you just want the quickest working bot.

```bash
npm install @open-wa/wa-automate @open-wa/driver-puppeteer
```

```ts
import { createClient } from '@open-wa/wa-automate';
import { PuppeteerDriver } from '@open-wa/driver-puppeteer';

async function start() {
  const client = await createClient({
    sessionId: 'sales',
    driver: new PuppeteerDriver(),
    headless: true,
  });

  client.onMessage(async (message) => {
    if (message.body === 'Hi') {
      await client.sendText(message.from, '👋 Hello!');
    }
  });
}

start().catch(console.error);
```

Important v5 reality:

- the repo’s current **public contract** centers on `createClient`
- some docs are still being reorganized from the older v4-era shape
- pluggable browser drivers are now part of the architecture

Available runtime driver packages in this repo:

- `@open-wa/driver-puppeteer`
- `@open-wa/driver-playwright`
- `@open-wa/driver-lightpanda`

Use the embedded path when you need deeper control over browser selection, runtime lifecycle, or infrastructure behavior.

## Configuration and CLI

Common config fields documented in the repo’s current config schema and docs include:

- `sessionId`
- `headless`
- `useChrome` / `executablePath`
- `qrTimeout` / `authTimeout`
- `licenseKey`
- `linkCode`
- `plugins`
- `pluginConfig`

Common high-value CLI flags include:

```bash
--port 8080
--api-key "your-secure-key"
--webhook "https://your-app.example/webhooks/open-wa"
--session-id sales
--pm2
--license-key "YOUR-LICENSE-KEY"
```

Some older docs and examples still mention additional legacy or transitional flags. For v5 alpha onboarding, prefer the smaller set above unless you have verified the exact flag against the version you are running.

For contributors to this monorepo, the repo currently declares:

- **Node.js** `>=22.21.1`
- **pnpm** `>=10.25.0`

```bash
pnpm install
pnpm build
```

## Plugins and integrations

This repo is no longer just a single package. It includes a plugin/integration surface for extending the runtime.

Relevant packages in this repo:

- `@open-wa/plugin-sdk`
- `@open-wa/integration-webhook`
- `@open-wa/integration-chatwoot`
- `@open-wa/integration-s3`
- `@open-wa/integration-cloudflare`
- `@open-wa/node-red`

### Loading plugins

The current config schema supports plugin references as npm package names or file paths:

```ts
plugins: [
  '@open-wa/integration-chatwoot',
  '@open-wa/integration-webhook',
  './my-local-plugin'
],
pluginConfig: {
  webhook: {
    // plugin-specific config
  }
}
```

### If you want to share a bot or plugin

The safest documented path today is:

1. build it as an npm package or local package
2. expose it through the plugin SDK
3. tell users which `plugins` and `pluginConfig` entries they need

Good examples to copy from in this repo:

- [`./integrations/webhook`](./integrations/webhook)
- [`./integrations/chatwoot`](./integrations/chatwoot)
- [`./integrations/cloudflare`](./integrations/cloudflare)

What is **not** clearly documented yet as a stable public workflow:

- a public plugin marketplace
- a formal plugin discovery registry for community downloads

So today, “share a plugin” realistically means “publish a package people can install and load”.

### Built-in integration examples

- **Webhook**: push events into your own service
- **Chatwoot**: connect open-wa to Chatwoot for bidirectional message handling
- **Cloudflare Session Proxy**: remote session access without opening public ports
- **Node-RED**: low-code visual automation on top of Easy API

## Cloudflare Session Proxy

If you want remote access without exposing local ports, this repo ships `@open-wa/cf-proxy`.

High-level flow:

1. deploy the Worker to your Cloudflare account
2. attach your session to that proxy as the upstream
3. connect consumers through the proxy URL

Example consumer connection:

```ts
import { SocketClient } from '@open-wa/socket-client';

const client = await SocketClient.connect(
  'cf-proxy://open-wa-proxy.account.workers.dev?sessionId=my-session&token=CONSUMER_TOKEN'
);
```

This is the cleanest path if you want remote access but do not want to invent your own transport bridge.

## AI-agent integration (MCP)

If your goal is to let an AI agent interact with WhatsApp, the cleanest surface is the built-in **Model Context Protocol** server.

MCP exposes every Easy API method as a discoverable tool that AI agents (Claude, Cursor, Windsurf, custom agents) can call directly — no manual HTTP wiring needed.

### Quick start

```bash
npx @open-wa/wa-automate --port 8080 --api-key "your-secure-key" --mcp
```

Then point your MCP client at:

```text
http://localhost:8080/mcp
```

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "open-wa": {
      "url": "http://localhost:8080/mcp",
      "headers": {
        "X-API-Key": "your-secure-key"
      }
    }
  }
}
```

### Cursor / Windsurf

Add a new MCP server with the URL `http://localhost:8080/mcp` and include `X-API-Key` in headers.

### How it works

- Uses the **Streamable HTTP** transport (single endpoint, no separate SSE/messages paths)
- Tools are generated from the schema registry — same methods as the HTTP API
- **API key required** on every request (same key as Easy API)
- Session readiness is enforced — tools block until the session is fully connected
- Dashboard: shows connection status, configuration copy-paste snippets (Claude/Cursor), and live tool details at `http://localhost:8080/dashboard/mcp`

### Configuration

```json
{
  "apiKey": "your-secure-key",
  "mcp": {
    "enabled": true,
    "path": "/mcp",
    "exposeToolsMeta": true
  }
}
```

### Security boundary

MCP is an **Easy API-only** feature. It is not available through `createClient()`. The API key is mandatory — MCP refuses to start without one. Discovery (tool listing) and execution both require authentication.

### Without MCP

If you prefer HTTP, give your agent the Easy API docs surface instead:

- `http://localhost:8080/api-docs/`
- `http://localhost:8080/meta/swagger.json`
- `http://localhost:8080/meta/postman.json`

## Documentation map

The current docs in this repo are organized around real usage modes. Start with:

- **Easy API quick start**: https://docs.openwa.dev/docs/getting-started/easy-api
- **Custom code**: https://docs.openwa.dev/docs/getting-started/custom-code
- **Socket Client**: https://docs.openwa.dev/docs/client-and-integrations/socket-client
- **Cloudflare Session Proxy**: https://docs.openwa.dev/docs/client-and-integrations/cf-proxy
- **Configuration and CLI**: https://docs.openwa.dev/docs/guides/configuration-and-cli
- **Chatwoot**: https://docs.openwa.dev/docs/client-and-integrations/chatwoot
- **Core reference**: https://docs.openwa.dev/docs/reference/core

## Running this repo locally

If you want to work on the monorepo itself:

```bash
git clone https://github.com/open-wa/wa-automate-nodejs.git
cd wa-automate-nodejs
pnpm install
pnpm build
```

Useful root scripts:

```bash
pnpm dev
pnpm test
pnpm lint
pnpm typecheck
```

## Support

If you need help, paid support, or consulting:

| Description | Link |
| --- | --- |
| Documentation | https://docs.openwa.dev |
| Discord | https://discord.gg/dnpp72a |
| Get a license key | https://openwa.page.link/key |
| Donate or book 1 hour consult | [![Buy me a coffee][buymeacoffee-shield]][buymeacoffee] |
| Per-minute consulting | <a href="http://otechie.com/smashah"><img src="https://api.otechie.com/consultancy/smashah/badge.svg" alt="Consulting"/></a> |
| Hire me | [![Consulting Request][consult-shield]][consult] |

## License

[Hippocratic + Do Not Harm Version 1.0](./LICENSE.md)

## Legal

This code is in no way affiliated with, authorized, maintained, sponsored, or endorsed by WhatsApp or any of its affiliates or subsidiaries. This is independent and unofficial software.

## Cryptography notice

This distribution includes cryptographic software. Depending on where you live, there may be restrictions on the import, possession, use, or re-export of encryption software. Check your local laws before using it. See [http://www.wassenaar.org/](http://www.wassenaar.org/) for more information.

The U.S. Government Department of Commerce, Bureau of Industry and Security (BIS), has classified this software as Export Commodity Control Number (ECCN) 5D002.C.1, which includes information security software using or performing cryptographic functions with asymmetric algorithms. The form and manner of this distribution makes it eligible for export under the License Exception ENC Technology Software Unrestricted (TSU) exception (see the BIS Export Administration Regulations, Section 740.13) for both object code and source code.

[buymeacoffee-shield]: https://www.buymeacoffee.com/assets/img/guidelines/download-assets-sm-2.svg
[buymeacoffee]: https://www.buymeacoffee.com/smashah
[consult-shield]: https://img.shields.io/badge/Require%20Paid%20Support%20or%20Consulting%3F-Click%20Here-blue?style=for-the-badge&logo=paypal
[consult]: mailto:shah@openwa.dev?subject=WhatsApp%20Consulting
