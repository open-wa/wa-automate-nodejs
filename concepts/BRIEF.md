# Shared brief: open-wa landing concepts

Every concept agent reads this first. Your own direction comes in your prompt.

## The bar

A first round of landing mockups was rejected outright as generic: static,
single-pass, templated SaaS layouts in different colourways. Do not make
another one of those. Each concept must be a different world, with its own
metaphor, palette, type and motion language, plus its own logo idea.

Bar to clear:

- The hero is the most characteristic thing in your world and it moves with
  intent. Someone should remember it after one visit.
- A real logo: a wordmark or mark designed for this concept that does
  something on hover or focus (draws on, flips, morphs, ticks over). The
  favicon is derived from it.
- Motion is choreographed with a clear language (easing, timing, what
  triggers what), not scattered fade-ins.
- Typography is chosen for the world. No Inter, Roboto, Arial, Space Grotesk
  or default system stacks as the display face.
- Phone layouts are designed on purpose, not a squeezed desktop.
- The quality of studios on Awwwards or godly.website, and product pages such
  as linear.app, vercel.com, resend.com, raycast.com, stripe.com/sessions,
  paper.design, rauno.me and basement.studio.

## Product facts (use only these)

**What it is.** open-wa (`@open-wa/wa-automate`) is a Node.js toolkit that
turns a WhatsApp account into an API you run on your own machine or server.

**Positioning, in the maintainer's own words** (quote or adapt freely):

- "Turn a WhatsApp account into an API, bot runtime, webhook bridge, and AI
  tool surface."
- "Connect WhatsApp to your application."
- "WhatsApp automation on your own infrastructure."
- "The most reliable WhatsApp automation library." (package description)

**Who it is for.** Developers and small teams who send order, booking and
delivery updates, run support inboxes, build bots and community tools, bridge
WhatsApp into CRMs and helpdesks, or give an AI agent a WhatsApp number.

**Real numbers** (as of 8 Oct 2026; say "3.6k stars" or exact):

- 3,666 GitHub stars, 723 forks
- Open source since August 2019 (seven years)
- v5.0.0 is the current stable release line
- Requires Node.js 22.21.1 or newer
- 3 browser drivers: Puppeteer, Playwright, Lightpanda
- 5 integrations: Webhook, Chatwoot, S3, Cloudflare session proxy, Node-RED
- Built-in Model Context Protocol (MCP) server at `/mcp`

**Surfaces.**

| Surface | What it gives you |
| --- | --- |
| Easy API (CLI) | A local HTTP API with live docs at `/api-docs/`, OpenAPI at `/meta/swagger.json`, Postman at `/meta/postman.json` |
| SocketClient | Connect another Node.js app to a running Easy API (HTTP RPC for commands, Server-Sent Events for events) |
| Embedded runtime | `createClient` inside your own Node.js app, with a pluggable browser driver |
| Webhooks and plugins | `plugins` and `pluginConfig` in `wa.config.*`; `@open-wa/plugin-sdk` to write your own |
| MCP | Every Easy API method becomes a tool for Claude, Cursor or Windsurf |
| Cloudflare proxy | Remote access to a local session without opening public ports |

Login is by QR code or link code, once per named session.

**Real snippets.**

```bash
npx @open-wa/wa-automate@latest --port 8080
npx @open-wa/wa-automate@latest --port 8080 --api-key "your-secure-key"
npx @open-wa/wa-automate@latest --session-id sales --port 8081
docker run -p 8080:8080 --init openwa/wa-automate
```

```bash
curl -X POST http://localhost:8080/api/messages/sendText \
  -H "Content-Type: application/json" \
  -d '{"to": "447123456789@c.us", "content": "Your order is ready to collect!"}'
```

```ts
import { SocketClient } from '@open-wa/socket-client';

const client = await SocketClient.connect('http://localhost:8080', 'your-secure-key');
client.onMessage(async (message) => {
  if (message.body === 'Hi') await client.sendText(message.from, 'Hello!');
});
```

```ts
import { createClient } from '@open-wa/wa-automate';
import { PuppeteerDriver } from '@open-wa/driver-puppeteer';

const client = await createClient({ sessionId: 'sales', driver: new PuppeteerDriver(), headless: true });
```

```js
// wa.config.mjs: MCP
export default { apiKey: process.env.WA_API_KEY, port: 8080, mcp: { enabled: true, path: '/mcp' } };
```

**CTAs and links.**

- Primary: "Send your first message" → https://openwa.dev/docs/getting-started/quickstart
- Docs → https://openwa.dev/docs
- Client API reference → https://openwa.dev/docs/reference/client/client
- GitHub → https://github.com/open-wa/wa-automate-nodejs
- Discord → https://discord.gg/dpan7EYE3t
- Licensed features → https://openwa.dev/docs/licensing/licensed-features
  (some methods need a Restricted or Insiders license)

**Mascot (optional).** Wally the walrus: round spectacles, warm brown fur,
a purple kawaii coffee mug. Art in `apps/docs/public/mascots/` (1024×1024
PNGs, pixel-art style). Use it only if it fits your world.

## Never claim

- Download counts (if you want the slot, write `[monthly npm downloads]`)
- Customers, logos, testimonials, case studies, uptime, SLAs, throughput,
  certifications or prices
- That it is official, endorsed, or affiliated with WhatsApp or Meta
- That accounts are safe from bans or that automation is risk-free
- Do not use the WhatsApp logo, Meta marks, or WhatsApp green (#25D366) as
  the brand colour

Every page carries the line: "open-wa is unofficial and not affiliated with
WhatsApp or Meta." Placeholders are written in `[square brackets]`.

## Tooling you may choose from

GSAP 3.13+ (fully free, SplitText, ScrollTrigger, DrawSVG, MorphSVG and the
other plugins all included), Motion, Lenis, three.js, OGL, Paper Shaders
(`@paper-design/shaders`), Theatre.js, Rive or Lottie. Pick deliberately
and say why in your report. Fewer, better tools beat many.

The network in this environment reaches the npm registry and Google Fonts.
General web browsing is limited: `WebSearch` works, `WebFetch` and CDNs do
not, so bundle every library through npm.
