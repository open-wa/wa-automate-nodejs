author:	smashah
association:	member
edited:	false
status:	none
--
## Round 2: Junior Node.js Developer Persona Walkthrough

**Persona**: Knows TypeScript, Express, npm. Has never touched WhatsApp automation, browser automation, or reverse proxies. Wants to build a simple message-response bot.

### Critical gaps NOT captured in Round 1

#### 1. `create()` vs `createClient` API confusion (blocking)

The docs use `create()` in every example (`custom-code.mdx`, `configuration-and-cli.mdx`, `error-handling.mdx`, `licensed-features.mdx`). But the README explicitly states:

> "The v5 public contract exposes `createClient` from `@open-wa/core` through `@open-wa/wa-automate`"

And the README's embedded runtime example uses `createClient({ sessionId, driver, headless })` with explicit driver injection.

**What a junior dev experiences**: They copy the `create()` example from docs, it may or may not work depending on what the current package actually exports. They have no way to know which API is correct. The `reference/core.mdx` page shows `createClient` but the guides show `create()`. There is no explanation of the relationship between the two.

#### 2. MCP (Model Context Protocol) docs are completely missing

The README has a full MCP section with:
- Quick start command (`--mcp` flag)
- Claude Desktop config example
- Cursor / Windsurf setup
- Security boundary explanation
- Streamable HTTP transport details
- Dashboard MCP page description

**The Fumadocs docs have zero MCP content.** This is a major feature that AI-agent users will be looking for, and there is no docs page for it at all.

#### 3. Plugin/integration docs are missing

The README explains:
- Plugin SDK (`@open-wa/plugin-sdk`)
- How to load plugins via `plugins` and `pluginConfig`
- Available integrations (webhook, chatwoot, s3, cloudflare, node-red)
- How to build and share plugins
- Example plugin structures

**The docs barely mention plugins.** There is no guide on how to load plugins, no explanation of the plugin lifecycle, no plugin development guide, and no integration walkthrough beyond the thin Chatwoot page.

#### 4. Node.js version requirement is invisible

The README states **Node.js >=22.21.1**. The docs never mention this. A junior dev on Node 18 or 20 will hit confusing native-module compilation failures with no guidance on why.

#### 5. No WhatsApp Web context or risk warnings

The README has ToS agreement, "unofficial software" disclaimer, and cryptography notice. The docs have none of this. A junior dev needs to understand:
- This automates WhatsApp Web, not the mobile app
- There are rate limits and ban risks
- WhatsApp's terms of service may restrict automation
- The legal risk varies by jurisdiction
- Session data contains sensitive authentication material

#### 6. No authentication flow explanation

A junior dev has no idea what happens during the QR/link-code flow:
- What does scanning the QR code actually do?
- Where is session data stored on disk?
- What happens if the browser closes?
- What happens if the process crashes?
- How long does a session stay authenticated?
- What triggers a re-scan vs re-auth?

#### 7. No "what is a chatId" explanation

Every example uses `'1234567890@c.us'` or `'group-id@g.us'` with zero explanation:
- What is the `@c.us` suffix?
- What is `@g.us`?
- What is `@lid`?
- How do I get a chatId from a phone number?
- How do I get a groupId from an invite link?

The glossary doesn't cover ChatId, ContactId, GroupChatId, or LID.

#### 8. No "first success" path

A junior dev cannot go from "I installed the package" to "I sent my first message" without guessing. There is no step-by-step that includes:
1. Install the package
2. Install a browser driver
3. Run the code
4. Authenticate (what they will see)
5. Send a test message
6. Verify it worked

### Gaps that overlap with Round 1 but are worse than captured

| Gap | Round 1 severity | Actual junior-dev impact |
|---|---|---|
| Error handling page | "too generic" | **Blocking** — shows `try/catch` but doesn't explain what errors actually look like, how to distinguish auth failures from network failures from browser crashes |
| Best practices page | "underdeveloped" | **Misleading** — shows `client: any` and `message: any` which teaches bad TypeScript habits to a junior dev |
| Multiple sessions page | "uses `any`" | **Dangerous** — the toy registry pattern would cause real bugs in production with no explanation of why |
| Session events page | "missing event list" | **Confusing** — shows `ev.on('qr.**')` but doesn't explain what `ev` is, where it comes from, or why it's different from `client.onMessage` |
| Docker page | "too sparse" | **Incomplete** — no volume mounts for session persistence, so a junior dev's container loses auth on every restart |

### What the README has that the docs don't

| Content | In README | In Docs |
|---|---|---|
| v5 alpha warning | Yes (CAUTION block) | No |
| v4 stable recommendation | Yes (4.76.0) | No |
| `createClient` API | Yes | No (docs show `create()`) |
| MCP integration | Yes (full section) | No |
| Plugin system | Yes (loading + SDK) | No |
| Node.js version requirement | Yes (>=22.21.1) | No |
| ToS / legal warnings | Yes | No |
| Ban risk / unofficial notice | Yes | No |
| Driver packages list | Yes | Partial (packages.mdx) |
| Migration from v4 to v5 | Yes (section) | No |
| What you can build (use cases) | Yes (6 examples) | No |

### Suggested priority additions for junior devs

1. **Add an MCP docs page** — it's a major feature with zero docs coverage
2. **Add a plugin/integration guide** — loading, building, and available integrations
3. **Clarify `create()` vs `createClient`** — which is the v5 API, how they relate, and update all examples
4. **Add a "What is a chatId?" primer** — phone number to ChatId conversion, group IDs, LIDs
5. **Add a "First bot in 5 minutes" guide** — zero to first message with expected output at each step
6. **Add Node.js version requirement** to getting-started pages
7. **Add risk/ToS context** — what the user is agreeing to, ban risks, legal considerations
8. **Explain the authentication flow** — what happens, where data lives, what breaks it
--
author:	smashah
association:	member
edited:	false
status:	none
--
## Round 3: AI/ML Engineer Persona Walkthrough

**Persona**: Builds LLM-powered apps, knows MCP, LangChain, OpenAI SDK. Wants to connect an AI agent to WhatsApp. Doesn't care about browser internals, just needs the API surface, tool discovery, rate limits, and security model.

### Critical gaps NOT captured in Rounds 1 or 2

#### 1. MCP (Model Context Protocol) docs are COMPLETELY missing

The README has a full MCP section covering:
- Quick start (`--mcp` flag)
- Claude Desktop config
- Cursor / Windsurf setup
- Streamable HTTP transport explanation
- Session readiness enforcement
- Security boundary (API key required, Easy API-only)
- Dashboard MCP page

**The Fumadocs docs have ZERO MCP content.** Not a single page, not a mention in the sidebar, not a link from any guide.

This is especially ironic because the docs site itself has:
- `/.well-known/mcp/server-card.json` route (MCP discovery)
- `/llms.txt` and `/llms-full.txt` routes (LLM-readable docs)
- AI chat interface component
- Page actions for "Open in ChatGPT"

The docs site is built to serve AI agents but doesn't document how to use the product with AI agents.

#### 2. `getMessagesForLLM` method is undocumented

The generated reference shows:
```
## `getMessagesForLLM`
Get messages formatted for LLMs
- HTTP route: `GET /api/messages/getForLLM`
- Aliases: `getGptArray`, `messages.getForLLM`, `messages.getGptArray`
```

This is a method specifically designed for AI agent workflows — it returns messages formatted for LLM consumption. But there is:
- No explanation of what format it returns
- No example of the output structure
- No guidance on how to use it with an LLM pipeline
- No `last` parameter description (it just shows `-`)
- Returns `unknown` instead of the actual response shape

#### 3. No rate limit or ban risk documentation

An AI engineer needs to know:
- How many messages per minute can I send before WhatsApp flags the account?
- What happens if I exceed rate limits?
- Does the library handle retries automatically?
- Are there different limits for different message types (text, media, buttons)?
- What is the ban risk profile for automated messaging?
- Are there safe defaults for AI agent message frequency?

**The docs have zero rate limit content.** The only mention of "limit" is `maxQr` for QR emission count.

#### 4. No AI agent architecture guidance

An AI engineer building a WhatsApp bot needs to understand:
- How to structure the conversation loop (receive → LLM → send)
- How to handle context windows (WhatsApp has no concept of threads)
- How to manage conversation history (how many messages to keep?)
- How to handle concurrent messages (queueing, parallel processing)
- How to handle media in the LLM pipeline (images, voice notes, documents)
- How to handle group chats vs direct messages differently

The `best-practices.mdx` shows a `p-queue` example but doesn't connect it to AI agent patterns.

#### 5. No webhook payload examples for AI processing

The `webhook-payloads.mdx` page is pure type tables. An AI engineer needs:
- Sample webhook JSON for a text message
- Sample webhook JSON for a media message
- Sample webhook JSON for a group message
- How to distinguish incoming from outgoing messages
- How to extract the message body, sender, and chat ID from the payload
- How to handle webhook retries and idempotency

#### 6. No security model for AI agents

The README mentions MCP requires an API key, but the docs don't explain:
- What data the AI agent can access (all messages? only specific chats?)
- Can the AI agent send messages to any contact?
- Are there permission scopes for MCP tools?
- How to restrict the AI agent to specific operations?
- What happens if the MCP endpoint is exposed publicly?
- How to audit AI agent actions?

#### 7. No `llms.txt` / `llms-full.txt` documentation

The docs site generates:
- `/llms.txt` — index of all docs pages in LLM-readable format
- `/llms-full.txt` — full docs content for LLM consumption
- `/llms.mdx/docs/$` — per-page MDX for LLMs

But there is no documentation explaining:
- What these endpoints are for
- How to use them with AI agents
- How to configure the LLM text generation
- Whether they include the API reference or only guides

#### 8. Interactive message types are undocumented for AI use

The reference shows these methods exist but have no practical guidance:
- `sendButtons` — interactive button messages
- `sendListMessage` — list/menu messages
- `sendPoll` — poll messages
- `sendAdvancedButtons` — media + buttons (insiders tier)
- `sendBanner` — banner images

An AI engineer would want to know:
- Which message types support interactivity (user can click/reply)?
- How to handle button clicks and list selections as events?
- What are the limitations (max buttons, max poll options)?
- Which types require specific licenses?

### What the README has that the docs don't (AI-relevant subset)

| Content | In README | In Docs |
|---|---|---|
| MCP quick start | Yes | No |
| MCP Claude Desktop config | Yes | No |
| MCP Cursor/Windsurf setup | Yes | No |
| MCP Streamable HTTP transport | Yes | No |
| MCP session readiness | Yes | No |
| MCP security boundary | Yes | No |
| `getMessagesForLLM` purpose | No (but method exists) | No |
| AI agent architecture | No | No |
| Rate limits | No | No |
| Ban risk | No | No |

### Suggested priority additions for AI engineers

1. **Add an MCP docs page** — this is the highest-impact missing page. Include quick start, config examples for all major clients, security model, and tool discovery explanation.
2. **Add an "AI Agent Integration" guide** — conversation loop pattern, context management, `getMessagesForLLM` usage, media handling in LLM pipelines.
3. **Add rate limit and safety guidance** — message frequency limits, ban risk, safe defaults for AI agents, retry behavior.
4. **Add webhook payload examples** — sample JSON for each message type, how to parse them for AI processing.
5. **Document interactive message types** — buttons, lists, polls, how to handle user responses as events.
6. **Explain `llms.txt` endpoints** — what they are, how AI agents can use them, configuration.
7. **Add security model page** — what data AI agents can access, permission scopes, audit trails, exposure risks.
--
author:	smashah
association:	member
edited:	false
status:	none
--
## Round 4: CRM/Helpdesk Integration Persona Walkthrough

**Persona**: Business user or technical operations person. Uses HubSpot, Salesforce, Zoho, Zendesk, or similar. Wants to connect their WhatsApp account to their CRM so messages appear as tickets/conversations. Does NOT want to write code. Wants to know: which CRMs are supported, how to set it up, and whether they need a developer.

### Critical gaps NOT captured in Rounds 1-3

#### 1. No CRM integration guide at all

The README mentions "webhook bridges for CRMs, helpdesks, automations, and low-code tools" but the docs have **zero CRM-specific content**. There is no page that answers:
- "Can I connect open-wa to HubSpot?"
- "Can I connect open-wa to Salesforce?"
- "Can I connect open-wa to Zoho?"
- "Can I connect open-wa to Zendesk?"
- "Can I connect open-wa to Freshdesk?"
- "Can I connect open-wa to Intercom?"

A CRM user lands on the docs site and finds nothing that speaks to their use case.

#### 2. No Zapier / Make.com / Pipedream / n8n integration guidance

These are the most common no-code/low-code integration platforms for connecting WhatsApp to CRMs. A business user would expect to find:
- "Connect WhatsApp to Zapier" guide
- "Connect WhatsApp to Make.com" guide
- "Connect WhatsApp to n8n" guide
- "Connect WhatsApp to Pipedream" guide

**None of these exist.** The only low-code tool mentioned anywhere is Node-RED, and even that has zero docs coverage (only a README in the integration package).

#### 3. Webhook docs are useless for non-developers

The `webhook-payloads.mdx` page is pure type tables (`WebhookConfig`, `Webhook`, `WebhookPayload`). A CRM user needs:
- **How to enable webhooks** — what flag do I pass? (`--webhook "https://..."`)
- **What URL do I put in my CRM?** — does my CRM need a specific endpoint format?
- **Sample webhook JSON** — what does a real incoming message look like?
- **Sample webhook JSON for media** — what does an image message payload look like?
- **How to distinguish incoming from outgoing** — which field tells me the direction?
- **How to extract sender phone number** — which field is the customer's number?
- **How to extract message body** — which field is the text?
- **How to handle webhook authentication** — can I add headers? (Yes, but not documented clearly)
- **What happens if my CRM is down?** — does open-wa retry? (Yes, 3 retries with exponential backoff, but the docs don't explain this)
- **Can I filter which events go to my CRM?** — yes (`events: ['onMessage']`), but not documented for business users

The webhook config actually has good features:
- `concurrency` (default: 10)
- `retries` (default: 3)
- `retryDelay` (default: 1000ms, exponential backoff)
- `headers` (custom auth headers)
- `timeout` (default: 30000ms)

But none of this is explained in plain language.

#### 4. Chatwoot is the ONLY documented integration

The docs have exactly one integration page: Chatwoot. And even that page is thin:
- No screenshots of what the Chatwoot inbox looks like
- No step-by-step setup guide
- No explanation of what happens to contacts (do they sync?)
- No explanation of what happens to message history
- No explanation of media handling (images, voice notes, documents)
- No troubleshooting section
- No explanation of the difference between the plugin approach and the CLI flag approach

For a user whose CRM is NOT Chatwoot, this page is irrelevant.

#### 5. No "which integration should I use?" decision guide

A CRM user needs a decision tree:
- "I use Chatwoot" → use the Chatwoot integration
- "I use a CRM with webhook support" → use the webhook integration
- "I use Zapier/Make/n8n" → use webhooks + your platform's webhook trigger
- "I use Node-RED" → use the Node-RED integration
- "I want to build a custom integration" → use the plugin SDK or SocketClient
- "I want AI agents to access WhatsApp" → use MCP

**This decision guide does not exist.** The docs assume the user already knows which path to take.

#### 6. No data flow explanation

A CRM user needs to understand:
- When a customer sends a WhatsApp message, how does it reach my CRM?
- When I reply from my CRM, how does it reach the customer on WhatsApp?
- Are messages delivered in real-time or batched?
- What happens to message attachments (images, PDFs, voice notes)?
- Do contacts sync automatically or do I need to create them manually?
- Can I see message history in my CRM?
- Can I send proactive messages from my CRM?

None of this is explained anywhere in the docs.

#### 7. No security/compliance guidance for business users

A CRM user handling customer data needs to know:
- Where is WhatsApp session data stored?
- Is message data encrypted at rest?
- Can I comply with GDPR data deletion requests?
- Can I comply with data retention policies?
- Who has access to the session data?
- What happens to session data if I stop the service?
- Can I export message history?

The docs have zero compliance content.

#### 8. No Node-RED docs despite it being a key integration

Node-RED is:
- Mentioned in the README as a "built-in integration"
- Has its own package (`@open-wa/node-red-contrib-wa-automate`)
- Is a visual low-code tool perfect for CRM integrations
- Has a README in the integration folder

**But has zero docs coverage.** A business user who finds Node-RED through the README has nowhere to go in the docs.

#### 9. No S3 integration docs

The README mentions `@open-wa/integration-s3` for media storage. A CRM user might want to store WhatsApp media attachments in S3 for compliance or archival. **Zero docs coverage.**

#### 10. No pricing guidance for CRM use cases

The pricing page exists but doesn't address:
- "Do I need a license to use webhooks?" (No, but not stated)
- "Do I need a license to use Chatwoot?" (Depends, but not stated)
- "Do I need a license to use Node-RED?" (Not stated)
- "Do I need a license to use the plugin SDK?" (Not stated)
- "What's the cost per session for a CRM deployment?" (Not stated)

### What the README has that the docs don't (CRM-relevant subset)

| Content | In README | In Docs |
|---|---|---|
| "webhook bridges for CRMs" mention | Yes | No |
| Node-RED integration | Yes | No |
| S3 integration | Yes | No |
| Plugin system for custom integrations | Yes | No |
| Available integration packages list | Yes | Partial |
| Low-code tool positioning | Yes | No |

### What a CRM user actually needs (and doesn't find)

| Need | Where they'd look | What they find |
|---|---|---|
| "Can I connect to my CRM?" | Docs homepage | No CRM mention |
| "Which CRMs are supported?" | Integrations section | Only Chatwoot |
| "How do I set up webhooks?" | Easy API page | One `--webhook` flag, no explanation |
| "What does a webhook look like?" | Webhook payloads page | Type tables, no examples |
| "How do I use Zapier?" | Search | Nothing |
| "How do I use Make.com?" | Search | Nothing |
| "How do I use n8n?" | Search | Nothing |
| "How do I use Node-RED?" | README mention | No docs page |
| "Is this GDPR compliant?" | Search | Nothing |
| "Where is data stored?" | Search | Nothing |
| "Do I need a license?" | Pricing page | Vague tier descriptions |

### Suggested priority additions for CRM users

1. **Add a "Connect to your CRM" guide** — the single highest-impact missing page. Decision tree: which CRM → which integration → setup steps.
2. **Add a "Webhooks for non-developers" guide** — plain-language explanation of what webhooks are, how to enable them, sample payloads, and how to connect to common platforms.
3. **Add Zapier/Make/n8n integration guides** — even if they're just "use webhooks + your platform's webhook trigger" with screenshots.
4. **Add Node-RED docs page** — it exists as a package but has zero docs coverage.
5. **Add data flow explanation** — diagram showing how a WhatsApp message reaches the CRM and how a CRM reply reaches WhatsApp.
6. **Add security/compliance page** — data storage, GDPR, retention, export, deletion.
7. **Expand Chatwoot page** — screenshots, step-by-step setup, troubleshooting, media handling.
8. **Add pricing clarity for integrations** — which integrations require which license tier.
--
author:	smashah
association:	member
edited:	false
status:	none
--
## Round 5: Plugin Developer Persona — Voice Note Dictation Plugin

**Persona**: Independent developer building `@myorg/stt-dictation` — a plugin that listens for incoming voice notes, transcribes them via a speech-to-text model, and quote-replies with the transcription. They want to publish it as an npm package for the community to install.

---

### Page-by-Page Walkthrough

#### `/docs/getting-started/easy-api` — No plugin mention
- **Missing**: No mention that Easy API supports loading plugins via `wa.config.js`. A plugin developer needs to know how their plugin gets loaded and tested.
- **Missing**: No `--watch` or hot-reload guidance for plugin development cycles.

#### `/docs/getting-started/custom-code` — No plugin mention
- **Missing**: No section on "Extending with plugins" or "Building your first plugin".
- **Missing**: No explanation of when to choose a plugin vs SocketClient vs embedded runtime.

#### `/docs/getting-started/how-it-works` — No plugin mention
- **Missing**: No diagram showing where plugins sit in the architecture (between the event emitter and the client proxy).
- **Missing**: No explanation of the security-filtered event pipeline that plugins receive.

#### `/docs/guides/configuration-and-cli` — Plugins mentioned but not explained
- **Missing**: The `plugins` and `pluginConfig` fields are listed but there is no schema documentation for what values they accept (npm package name? file path? URL?).
- **Missing**: No example `wa.config.js` showing a plugin loaded alongside other config.
- **Missing**: No explanation of how `pluginConfig` keys map to plugin names.

#### `/docs/concepts/packages` — One-line mention
- **Current**: `plugin-sdk | Tools and types for building custom Open-WA plugins.`
- **Missing**: This is the ONLY mention of the plugin SDK in the entire docs site. It needs its own page.

#### `/docs/client-and-integrations/socket-client` — No plugin mention
- **Missing**: No guidance on whether plugins can use SocketClient or if they are host-only.

#### `/docs/client-and-integrations/cf-proxy` — No plugin mention
- **Missing**: No guidance on whether plugins work through the Cloudflare proxy.

#### `/docs/client-and-integrations/chatwoot` — Reference implementation undocumented
- **Missing**: The Chatwoot plugin is the most complete example in the repo but there is no "Anatomy of a Plugin" walkthrough using it as a case study.

#### `/docs/reference/core` — No plugin types
- **Missing**: No `<AutoTypeTable />` for `Plugin`, `PluginInput`, `Hooks`, `PluginClient`, `PluginMeta`, `PluginLogger`, `PluginEventEmitter`, `DashboardPage`, `ToolDefinition`, `ToolContext`.
- **Missing**: No reference page for `@open-wa/plugin-sdk` exports (`createPlugin`, `defineConfig`, `z`).

---

### Site-Wide Gaps for Plugin Developers

#### 1. Zero "Getting Started with Plugins" page
There is no page that walks through:
- Installing `@open-wa/plugin-sdk`
- Creating your first plugin with `createPlugin()`
- Defining config with `defineConfig()` and Zod
- Loading it in `wa.config.js` via `plugins: ['./my-plugin']`
- Testing it with `npx @open-wa/wa-automate`

The `createPlugin()` source has excellent inline examples (calorie tracker, CRM webhook) but these exist only in JSDoc — not in the docs site.

#### 2. No Hooks reference
The `Hooks` interface is the entire plugin surface area. A developer building a dictation plugin needs to know:
- Which hook fires on incoming messages (`message.received`)
- How to intercept before send (`message.send.before`)
- How to add Hono routes (`routes`)
- How to add dashboard pages (`pages`)
- How to register AI tools (`tool`)
- How to clean up (`dispose`)
- Lifecycle hooks (`core.starting`, `core.started`, `core.stopping`, `client.ready`)
- Auth hooks (`auth.qr`, `auth.authenticated`)

None of this is documented. A developer must read `types.ts` source directly.

#### 3. No `PluginClient` method reference
The `PluginClient` interface exposes:
- `ask(method, args)` — generic method dispatcher
- `listen(listener, callback)` — event listener
- Convenience methods: `sendText`, `sendImage`, `sendFile`, `sendLocation`, `sendLinkWithAutoPreview`, `reply`, `decryptMedia`, `getHostNumber`, `getContact`, `getAllContacts`, `getAllChats`, `sendSeen`
- Proxy fallback: `[method: string]` for any other method

There is no docs page explaining that plugins get a transport-agnostic proxy (not direct browser/CDP access), what methods are available, or that the full Client surface is accessible via `ask()`.

#### 4. No `PluginInput` breakdown
A developer needs to understand what they receive:
- `events` — security-filtered emitter (can only subscribe, cannot emit, blocked from internal/sensitive events)
- `logger` — scoped logger with auto-prefixing
- `config` — already-validated config from `wa.config.js`
- `sessionId` — current session identifier
- `client` — transport proxy for WA methods

#### 5. No security model documentation
The docs do not explain:
- Plugins cannot emit events
- Plugins cannot listen to `launch.*`, `browser.*`, `transport.*`, `license.*` events
- Plugins get a proxy, not direct browser access
- Config is validated before `init()` is called

#### 6. No "Publishing a Plugin" guide
The README says "share a plugin" means "publish a package people can install and load" but there is no guide covering:
- Package structure (`package.json` fields, `main`/`exports`)
- TypeScript compilation for distribution
- Versioning and peer dependencies (`@open-wa/plugin-sdk`)
- How to tell users to load it (`plugins: ['@myorg/stt-dictation']`)
- How to document plugin config options for consumers
- Whether there is a plugin registry or marketplace (answer: no, but docs should say so explicitly)

#### 7. No "Building a Plugin" walkthrough/example
The repo has two reference implementations (webhook, chatwoot) but:
- Neither is documented as a learning resource
- Neither is broken down step-by-step
- A dictation plugin developer needs to see: how to detect voice notes, how to call `decryptMedia`, how to send a quoted reply with `reply()`, how to handle errors gracefully

#### 8. No Dashboard plugin page documentation
Plugins can declare `pages: []` to add sidebar entries to the dashboard. There is no documentation on:
- What the dashboard renders for plugin pages
- How to add custom React components (noted as "coming later" in source)
- How `path`, `title`, `icon`, `order` work

#### 9. No AI Tool registration docs
Plugins can register `tool: {}` with `ToolDefinition` objects (description, Zod args, execute function) for AI agent consumption. This is a powerful feature with zero documentation.

#### 10. No Hono routes documentation for plugins
Plugins can return `routes: () => Hono` to mount endpoints at `/plugins/<name>/`. The JSDoc has an example but there is no docs page explaining:
- How routes are mounted
- How to secure them
- How they interact with the Easy API auth layer

---

### What the Dictation Plugin Developer Actually Needs

To build `@myorg/stt-dictation`, this developer needs to find:

1. **"How to create a plugin"** → Does not exist. Must read `createPlugin.ts` JSDoc.
2. **"How to listen for voice notes"** → Must know `message.received` hook exists, must know voice notes have a specific `type` or `mimetype`, must know how to call `decryptMedia`.
3. **"How to quote-reply with text"** → Must discover `client.reply(to, content, quotedMsgId)` exists in `PluginClient`.
4. **"How to add config for STT API key"** → Must discover `defineConfig()` and Zod schema pattern.
5. **"How to load and test locally"** → Must discover `plugins: ['./packages/stt-dictation']` in `wa.config.js`.
6. **"How to publish for others"** → Must discover npm package pattern, must know there is no marketplace.

**Every single one of these requires reading source code.** The docs site has nothing.

---

### Priority Assessment

| Gap | Priority | Effort | Impact |
|-----|----------|--------|--------|
| "Getting Started with Plugins" page | **P0** | Medium | Blocks all plugin developers |
| Hooks reference (`Hooks` interface) | **P0** | Low | Core API surface undocumented |
| `PluginClient` method reference | **P0** | Low | Developers cannot discover available methods |
| `createPlugin()` + `defineConfig()` walkthrough | **P1** | Medium | JSDoc examples should be docs pages |
| Security model for plugins | **P1** | Low | Developers need to know boundaries |
| "Publishing a Plugin" guide | **P1** | Low | No marketplace = npm package is the only path |
| Reference plugin walkthrough (webhook/chatwoot) | **P2** | Medium | Best learning resource exists but is invisible |
| Dashboard pages documentation | **P2** | Low | Nice-to-have for plugin UX |
| AI Tool registration docs | **P2** | Low | Emerging feature, early docs helps adoption |
| Hono routes for plugins | **P2** | Low | Advanced but important for webhook plugins |
--
author:	smashah
association:	member
edited:	false
status:	none
--
## Round 6: Plugin Developer Persona — OpenAI Moderation Plugin

**Persona**: Developer building `@myorg/moderation-bot` — a plugin that scans every incoming message through OpenAI's Moderation API, flags harmful content (violence, hate, self-harm, sexual, illegal), and takes automated action (delete, warn, log). They want to release it for community group admins.

---

### Page-by-Page Walkthrough

#### `/docs/getting-started/easy-api` — No plugin mention
- **Missing**: No mention that plugins run inside the Easy API process. A moderation plugin developer needs to know their code runs server-side, not client-side.

#### `/docs/getting-started/custom-code` — No plugin mention
- **Missing**: No section on "When to use a plugin vs custom code". For moderation, a plugin is the right choice — but docs don't help the developer decide.

#### `/docs/guides/configuration-and-cli` — No secret management guidance
- **Missing**: The moderation plugin needs an OpenAI API key. There is no documentation on how to store secrets in `wa.config.js` securely (env var interpolation? `.env` file support? `pluginConfig` structure?).
- **Missing**: No guidance on rotating API keys without restarting the runtime.

#### `/docs/concepts/packages` — One-line SDK mention
- **Missing**: `plugin-sdk` listed as "Tools and types for building custom Open-WA plugins" with zero follow-through.

#### `/docs/client-and-integrations/chatwoot` — No moderation pattern
- **Missing**: The Chatwoot plugin shows `message.received` handling but there is no "Moderation pattern" guide showing how to scan + act on messages.

#### `/docs/reference/core` — No plugin types
- **Missing**: No reference for `message.send.before` interceptor — the hook a moderation plugin would use to block outgoing messages before they hit WhatsApp.
- **Missing**: No reference for `message.received` — the hook for scanning incoming messages.

---

### Site-Wide Gaps for the Moderation Plugin Developer

#### 1. No "External API Calls from Plugins" guidance
The moderation plugin must call `openai.moderations.create()` for every message. The docs do not cover:
- How to make HTTP requests from within a plugin (can you use `fetch`? `axios`?)
- How to handle API failures (OpenAI down, rate limited, quota exceeded)
- Whether plugins should queue requests or process synchronously
- How to avoid blocking the message pipeline while waiting for moderation results
- How to set timeouts on external API calls

#### 2. No `message.send.before` interceptor documentation
This is the critical hook for moderation — it can modify or block content before it's sent. The docs have zero coverage of:
- The input/output shape: `input: { to, content }` → `output: { content, metadata }`
- How to modify `output.content` to replace flagged text
- How to abort/cancel the send entirely (throw? return early? set a flag?)
- Whether the interceptor runs for all message types or just text
- Performance implications (adding latency to every send)

#### 3. No `message.received` event payload documentation
The hook receives `{ message: unknown }`. The docs do not explain:
- What the `message` object actually contains
- How to detect message type (text, image, voice, video, document)
- How to extract text content for moderation
- How to handle group messages vs DMs (moderation is usually group-only)
- How to get the sender's ID for logging/banning
- How to access `message.id` for deletion after the fact

#### 4. No message deletion guidance
After flagging a message, the plugin likely wants to delete it. The docs do not cover:
- Which `PluginClient` method deletes a message (`deleteMessage`? `removeMessage`?)
- Whether deletion works for incoming messages or only sent messages
- Whether there are timing constraints (can you delete a message after 5 minutes?)

#### 5. No secret/config management for API keys
The plugin needs `openaiApiKey` in its config. The docs do not explain:
- How to reference environment variables in `wa.config.js` (e.g., `process.env.OPENAI_API_KEY`)
- Whether `pluginConfig` values are logged (security risk)
- How to validate that the API key is present and non-empty in the schema
- How to handle missing config gracefully vs crashing on init

#### 6. No error handling patterns
The moderation plugin will encounter:
- OpenAI API rate limits (429)
- Network timeouts
- Invalid API keys (401)
- Malformed messages
- WhatsApp connection drops

The docs provide zero guidance on how plugins should handle these. Should they:
- Use `logger.error()` and continue?
- Throw and crash the plugin?
- Return from `dispose()` and unregister?
- Queue failed messages for retry?

#### 7. No group vs DM filtering guidance
Moderation plugins typically only scan group chats, not DMs. The docs do not explain:
- How to determine if a message is from a group (`message.isGroupMsg`? `message.chatId`?)
- How to get the group ID for logging
- How to configure which groups to moderate (allowlist? blocklist? all?)
- How to exempt admins from moderation

#### 8. No logging/audit trail guidance
A moderation plugin needs to log every action taken. The docs do not cover:
- How to use `PluginLogger` effectively (`info`, `warn`, `error`, `debug`)
- Whether logs are persisted or ephemeral
- How to export moderation logs for admin review
- Whether plugins can write to files or databases

#### 9. No dashboard page for moderation stats
The plugin could expose a dashboard page showing: messages scanned, flags raised, actions taken, top offenders. The docs do not explain:
- How `pages: []` declaration works
- What data the dashboard can display
- How to fetch real-time stats for the dashboard

#### 10. No performance/scalability guidance
A busy group might receive 100+ messages per minute. The docs do not address:
- How many concurrent moderation calls are safe
- Whether to batch messages or process individually
- How to avoid rate limiting from OpenAI
- Whether plugins have memory/CPU constraints
- How to implement caching (skip re-moderating identical messages)

#### 11. No "Allowed Categories" config pattern
The OpenAI Moderation API returns multiple categories (violence, hate, sexual, self-harm, illegal). Plugin admins may want to enable/disable specific categories. The docs do not show:
- How to define a config schema with boolean toggles for each category
- How to pass category preferences from `wa.config.js` into the plugin
- How to use `defineConfig()` with complex nested objects

#### 12. No action response patterns
After flagging content, the plugin might:
- Delete the message
- Send a warning to the sender
- Notify group admins
- Log to an external service
- Temporarily mute the user

The docs do not show how to chain these actions or which `PluginClient` methods to use for each.

---

### What the Moderation Plugin Developer Actually Needs

To build `@myorg/moderation-bot`, this developer needs to find:

1. **"How to scan incoming messages"** → Must discover `message.received` hook. Must learn `message` object shape. Must learn how to extract text.
2. **"How to call OpenAI from a plugin"** → No guidance on external HTTP calls, error handling, or rate limiting.
3. **"How to block flagged messages"** → Must discover `message.send.before` interceptor. Must learn how to modify or cancel output.
4. **"How to store the OpenAI API key"** → Must discover `defineConfig()` pattern. No docs on env var support.
5. **"How to moderate only groups"** → Must reverse-engineer message object to find group detection.
6. **"How to delete a flagged message"** → Must find the right `PluginClient` method through source code.
7. **"How to log moderation actions"** → Must discover `PluginLogger`. No docs on persistence.
8. **"How to handle OpenAI rate limits"** → Zero guidance. Developer must invent their own retry/backoff strategy.
9. **"How to configure which categories to flag"** → Must design Zod schema for nested config. No examples.
10. **"How to publish for group admins"** → Must discover npm package pattern. No marketplace docs.

**Every single step requires reading source code or guessing.** The docs site has nothing for this use case.

---

### Priority Assessment (Moderation-Specific)

| Gap | Priority | Effort | Impact |
|-----|----------|--------|--------|
| `message.received` payload docs | **P0** | Low | Every message-reacting plugin needs this |
| External API call patterns | **P0** | Medium | Moderation, translation, AI plugins all blocked |
| `message.send.before` interceptor docs | **P0** | Low | Content filtering/moderation plugins blocked |
| Secret/config management for API keys | **P0** | Low | Security-critical, every external-API plugin needs this |
| Error handling patterns | **P1** | Low | Plugins will crash without guidance |
| Group vs DM filtering | **P1** | Low | Moderation is group-only; no way to know how to filter |
| Message deletion method docs | **P1** | Low | Core moderation action undocumented |
| Performance/scalability guidance | **P1** | Medium | Busy groups will overwhelm naive plugins |
| Logging/audit trail docs | **P2** | Low | Important for admin accountability |
| Dashboard stats page docs | **P2** | Low | Nice-to-have for plugin UX |
| Allowed categories config pattern | **P2** | Low | Common pattern, no examples exist |
| Action response patterns | **P2** | Medium | Developer must invent chaining logic |
--
author:	smashah
association:	member
edited:	false
status:	none
--
## Copy red-team pass after current docs rewrite

I reviewed the current Fumadocs copy against the personas already captured in this issue. The main problem is no longer only missing pages. A lot of the new copy now mentions the right concepts, but it still reads like internal architecture notes instead of instructions for a person trying to finish a job.

### Persona 1: Junior Node.js developer

**Trying to do:** run open-wa, authenticate, send a first message, then decide whether to use Easy API or custom code.

**Copy issues:**
- The homepage headline, "WhatsApp automation docs for operators who ship," is vague and persona-hostile. A junior dev does not identify as an "operator" and still does not know whether this helps them send a WhatsApp message.
- The homepage subhead says "sessions, transports, integrations, and recovery paths" before explaining the basic outcome. That is product-internal language, not user language.
- `getting-started/easy-api.mdx` opens with "smallest amount of setup" but does not immediately state the concrete end state: local API running, phone linked, first message sent.
- `custom-code.mdx` still shows `create()` first even though the page says `createClient` is the v5 public contract. That teaches the wrong default before correcting it.
- Phrases like "runtime surface," "direct lifecycle and listener control," and "boundary where configuration, browser launch, authentication state, and runtime listeners all meet" are abstract and do not help the reader choose a path.

**Fix direction:** Lead with concrete jobs: "Run a local WhatsApp API," "Send your first message," "Use `createClient` when your app owns the browser session." Remove or demote architecture nouns until after first success.

### Persona 2: AI/ML engineer

**Trying to do:** connect Claude/Cursor/custom agents to WhatsApp safely.

**Copy issues:**
- The MCP page now exists, but it overpromises with "interact with WhatsApp directly" and "All of this through natural language" before the security model. That sounds like marketing copy, not an integration guide.
- The page says agents can "read all messages" and "manage groups" but does not immediately tell the reader the safe setup: dedicated session, API key, private network, logs.
- "Stateful connections" and "tools are generated from the schema registry" are implementation details. The useful copy is: start Easy API with `--mcp`, add this URL and header to your AI client, test tool listing, then keep it private.
- The `llms.txt` section says AI agents can use the endpoints but does not say when a human should care.

**Fix direction:** Reframe MCP around a safe setup checklist and a first connection test. Put risk before capability hype.

### Persona 3: CRM/helpdesk operator

**Trying to do:** connect WhatsApp to a CRM/helpdesk without becoming an open-wa expert.

**Copy issues:**
- Homepage says "Integrations" but routes the user to Chatwoot only. It mentions S3, Node-RED, and proxy workflows without giving a clear "if you use X, start here" decision path.
- Chatwoot copy opens with "legacy docs" and "modern mental model." That is maintainer context, not operator context. The operator needs: required Chatwoot details, open-wa config, public URL, test inbound, test outbound.
- Webhook copy still feels developer-first. It has good examples, but the page title/description says "Generated type tables," which tells non-developers they are in the wrong place.
- The webhook receiver examples use `payload: any` and internal event names before explaining the three fields a CRM user needs: sender, message text, media/link.

**Fix direction:** Replace maintainer/history framing with setup framing. Add direct labels like "Use this if your CRM accepts webhooks." Make the first 20 lines answer "what do I paste where?"

### Persona 4: dictation plugin developer

**Trying to do:** build and publish a voice-note transcription plugin.

**Copy issues:**
- Plugin getting started says plugins can add "HTTP routes, dashboard pages, and AI tools" before teaching the smallest useful plugin. It is accurate but too broad too early.
- The first plugin example uses `message as { ... }` and `msg.from!`. That is exactly the kind of unsafe copy/code pattern the docs should not teach new plugin authors.
- The dictation example says "speech-to-text API" but then uses OpenAI Whisper fields. It should name the example provider and state what to replace.
- Error handling says failures are "logged, message skipped" but does not tell the user what the sender experiences or whether to reply with a friendly failure.

**Fix direction:** Make plugin docs task-first: listen for one event, inspect one message, call one client method. Avoid broad feature inventories and unsafe non-null assertions in the teaching example.

### Persona 5: moderation plugin developer

**Trying to do:** scan messages, delete/warn/log flagged group messages, handle OpenAI failures safely.

**Copy issues:**
- The moderation page is the clearest example of AI-slop copy. It says "block flagged content" but incoming WhatsApp messages cannot be blocked before delivery. Later it admits you can only delete after detection. The title/description and section headings contradict the actual behavior.
- The section "Blocking Flagged Messages" shows a `message.send.before` stub that is unrelated to incoming group moderation, then jumps back to incoming delete/warn behavior. That mixes two different workflows.
- "Return modified output or cancel the send" is vague and likely wrong without exact cancellation semantics.
- The warning reply says "inappropriate content," which is generic and adversarial. Group admins need configurable, human-safe wording.
- The page repeatedly casts unknown messages and assumes `message.chatId`, `message.id`, and `message.from` without explaining which fields are required before acting.

**Fix direction:** Rename the promise from "blocking" to "review and act after detection." Separate incoming moderation from outgoing-send interception. Make failure behavior explicit: if OpenAI fails, log and do not delete.

## Site-wide copy rules to apply

1. Start every guide with the concrete job the reader can finish.
2. Replace internal nouns like "runtime surface," "transport-agnostic," "schema registry," and "control loop" unless the paragraph defines them in plain English.
3. Do not mention legacy/history unless it changes what the reader should do today.
4. Put safety constraints before powerful capabilities.
5. Do not use unsafe TypeScript shortcuts in teaching examples.
6. Make every page answer: "What do I run? What do I paste? What should I see? What can go wrong? Where next?"

I am going to apply this copy pass now to the high-impact pages rather than adding more surface area.

--
author:	smashah
association:	member
edited:	false
status:	none
--
## Full top-to-bottom docs audit after current rewrite

This pass re-audits the current `apps/docs` tree after the latest rewrite work. It supersedes parts of the older persona comments above: MCP, plugins, Node-RED, S3, rate limits, chat IDs, auth flow, webhook payload examples, and plugin references now exist. The remaining work is less about "missing whole areas" and more about **findability, technical consistency, runnable examples, and task completion**.

Framework sources used for this pass:

- *Docs for Developers: An Engineer's Field Guide to Technical Writing* public book site: https://docsfordevelopers.com/
- Springer overview/table of contents: https://link.springer.com/book/10.1007/978-1-4842-7217-6
- O'Reilly overview: https://www.oreilly.com/library/view/docs-for-developers/9781484272176/
- Google developer docs style guide, philosophy: https://developers.google.com/style/philosophy
- Google developer docs style guide, prescriptive docs: https://developers.google.com/style/prescriptive-documentation

I could not verify direct PDF page quotations in this session, so this framework is based on the book's public description, official chapter structure, and the practical documentation principles it emphasizes: understand users, plan docs around tasks, draft/edit clearly, verify code samples, organize for findability, publish with releases, gather feedback, measure quality, and maintain/deprecate docs over time.

---

## Audit framework

Score each dimension from `0` to `3`:

- `0`: missing or actively harmful
- `1`: present but incomplete/stale/confusing
- `2`: usable with gaps
- `3`: strong, current, and task-focused

| Dimension | Score | Current read |
| --- | ---: | --- |
| Audience and purpose | 2 | Most pages now identify a job, but some entry paths still route to the wrong page or speak in internal terms. |
| Information architecture | 2 | Coverage is broad, but the best first-success page is hidden from sidebar/navigation. |
| Task orientation | 2 | Many pages are task-shaped, but several examples lack expected outputs or final verification. |
| Technical accuracy | 1 | There are still copy-paste contradictions across webhook, Docker/env, MCP, and AI examples. |
| Lifecycle completeness | 2 | Setup, operations, troubleshooting, plugins, AI, integrations, and licensing exist; maintenance/release alignment still needs rules. |
| Clarity and readability | 2 | Copy is much clearer than before, but pricing and some homepage/architecture copy still use abstract nouns. |
| Consistency and style | 1 | Config names, payload envelopes, plugin tool context, and example dependency setup are inconsistent. |
| Findability and cross-linking | 2 | Main sections exist, but some key links point to broad pages instead of the shortest task path. |
| Feedback and maintenance | 1 | There is no visible docs quality gate to prevent drift between code, generated reference, examples, and guides. |

Overall: **15/27: usable but drift-prone**. The docs now cover the right surface area, but a developer can still copy the wrong payload shape, wrong env vars, unsupported flags, or incomplete AI/plugin examples.

---

## Site-wide rules to apply going forward

1. **Every guide must answer five questions in the first screen:** who is this for, what will I finish, what do I need, what do I run/paste, what should I see?
2. **Task docs beat feature inventories.** Start with the smallest successful workflow; move architecture and variants after success.
3. **Safety before capability.** MCP, AI agents, plugins, webhooks, and exposed APIs should show auth/data-access risks before power-user examples.
4. **One canonical shape per contract.** Webhook envelopes, config env vars, plugin tool context, message send signatures, and event names must match across all pages.
5. **Examples must be runnable or explicitly pseudocode.** If a snippet uses `callLLM`, `Bottleneck`, `p-queue`, OpenAI, etc., include install/setup or mark it as a placeholder.
6. **Show expected output after key commands.** A first-time user should know the HTTP status, log line, response body, UI state, or message arrival that proves success.
7. **Do not teach unsafe TypeScript shortcuts.** Avoid `any`, non-null assertions, unchecked `error.message`, and casts unless the example narrows first.
8. **Legacy/history belongs after the current path.** Mention v4/legacy only when it changes what the reader should do today.
9. **Reference is not onboarding.** Generated tables should be used for exact names; guides should teach the path and link to reference for details.
10. **Docs changes need a quality gate.** Any change to CLI flags, config schema, plugin contracts, webhook envelopes, generated methods, or MCP schemas should require corresponding docs updates.

---

## P0 TODOs: blocks first success or teaches the wrong contract

### 1. Make `quickstart.mdx` the actual first-success path

Evidence:

- `apps/docs/content/docs/getting-started/quickstart.mdx` exists and is the best first-success guide: it starts Easy API, authenticates, opens `/api-docs/`, and sends a test message.
- `apps/docs/content/docs/getting-started/meta.json` omits `quickstart` from the sidebar. Current pages are only `easy-api`, `docker`, `custom-code`, and `link-code`.
- `apps/docs/src/components/homepage.tsx` sends the primary CTA and "Fastest path" card to `DOCS_PATHS.easyApi`, not `quickstart`.
- `apps/docs/content/docs/index.mdx` says "Use Getting Started" but links to `/docs/getting-started/easy-api`.

Impact: new users are sent to a general Easy API page instead of the complete "first message" path.

TODO:

- [ ] Add `quickstart` to `getting-started/meta.json`, preferably before `easy-api`.
- [ ] Add `DOCS_PATHS.quickstart` and point the homepage primary CTA there.
- [ ] Update `/docs` Start here to link "send your first message" to quickstart.
- [ ] Keep `easy-api` as the deeper Easy API operations page.
- [ ] Add expected HTTP status/body for the `curl` sendText step, not only "you should receive the message".

### 2. Fix conflicting webhook payload contracts

Evidence:

- `apps/docs/content/docs/guides/webhooks-for-business.mdx` sample payloads use:

```json
{
  "event": "message.received",
  "data": { "body": "Hello!" }
}
```

- `apps/docs/content/docs/client-and-integrations/webhook-payloads.mdx` says the canonical envelope is:

```json
{
  "webhookId": "...",
  "sessionId": "sales",
  "event": "message",
  "payload": { "body": "Hello" },
  "timestamp": 1700000000123
}
```

Impact: a reader building a CRM/Zapier/n8n/webhook receiver cannot know whether to parse `data` or `payload`, or whether event names are `message.received` or `message`.

TODO:

- [ ] Pick the actual runtime webhook envelope and make every webhook page use it.
- [ ] If both forms exist, document which one is legacy, which one is current, and how to detect each.
- [ ] Update all Express/Zapier/Make/n8n examples to parse the canonical fields.
- [ ] Add a short "copy these three fields first" section: sender, text/caption, message id.
- [ ] Add a test receiver that logs the raw body before transforming it.

### 3. Resolve Docker/env-var/config drift

Evidence:

- `apps/docs/content/docs/getting-started/docker.mdx` uses `PORT`, `API_KEY`, and `SESSION_ID` in Docker examples.
- `apps/docs/content/docs/guides/configuration-and-cli.mdx` says runtime env vars are `WA_PORT`, `WA_API_KEY`, `WA_SESSION_ID`, etc.
- `apps/docs/content/docs/operations/security-and-deployment.mdx` uses `OPENWA_API_KEY` in Docker examples.
- `apps/docs/content/docs/getting-started/easy-api.mdx` says default browser profiles are stored as `./_IGNORE_<sessionId>`, while Docker examples mount `./sessions:/app/sessions` without showing the config/flag that makes the runtime use that path.

Impact: Docker users can copy an example that appears to set session/API config but may not map to actual runtime config. Persistence setup is also not falsifiable.

TODO:

- [ ] Verify which env var names the container entrypoint actually consumes.
- [ ] Make Docker, config, and deployment pages use the same names.
- [ ] If Docker-specific aliases exist, document them as Docker aliases, not general runtime env vars.
- [ ] Show the exact flag/config that makes `-v ./sessions:/app/sessions` persist the browser profile.
- [ ] Add a restart test: start, authenticate, stop, start again, confirm no QR is needed.

### 4. Make MCP quick start match the v5 alpha reality

Evidence:

- `apps/docs/content/docs/guides/mcp.mdx` presents `--mcp` as the quick start.
- `apps/docs/content/docs/guides/configuration-and-cli.mdx` says some v5 alpha builds may not parse `--mcp` and may require `mcp: { enabled: true }` in config.
- The MCP page has config later, but the quick start does not immediately show the fallback path or expected success output.

Impact: AI-agent users can fail on the first command and not know whether the docs, CLI, or their setup is wrong.

TODO:

- [ ] In MCP quick start, show both supported paths: CLI flag and `wa.config.*` fallback.
- [ ] Add expected startup log or dashboard state for MCP enabled.
- [ ] Add `tools/list` or client-specific "tools appear" verification.
- [ ] Add troubleshooting for: missing API key, session not ready, tools not listed, 401/403, unsupported `--mcp` flag.
- [ ] Keep the security checklist before the capability list.

---

## P1 TODOs: high-friction, high-impact docs quality issues

### 5. Make AI-agent examples runnable or mark them as pseudocode

Evidence:

- `apps/docs/content/docs/guides/ai-agent-patterns.mdx` promises "production-ready examples".
- Examples call undefined helpers such as `callLLM`, `callVisionLLM`, and `callSTT` without stubs or dependency setup.
- The page imports `Bottleneck` and `p-queue` but does not show install commands.
- The generated media example uses `sendImage(message.from, data, 'caption')`, while the message guide/reference shape expects image data, filename, and caption.

Impact: AI engineers get the shape of an idea, not code they can run, despite the page claiming production readiness.

TODO:

- [ ] Change the claim from "production-ready examples" unless the examples are complete.
- [ ] Add setup/install commands for `bottleneck`, `p-queue`, and any chosen LLM/STT SDK.
- [ ] Provide stub implementations for `callLLM`, `callVisionLLM`, and `callSTT`, or clearly mark them as application-provided placeholders.
- [ ] Fix `sendImage` to include the correct filename/caption arguments.
- [ ] Add an expected behavior section: message in, response out, logs, rate-limit behavior.

### 6. Fix plugin AI tool context inconsistency

Evidence:

- `apps/docs/content/docs/plugins/ai-tools.mdx` says `ToolContext` includes `client`, `logger`, and `sessionId`.
- `apps/docs/content/docs/plugins/hooks-reference.mdx` uses `context.client` in the example, but the `Tool context` bullet list only includes `sessionId`, `logger`, and `abort`.

Impact: plugin authors cannot tell whether `client` is guaranteed in tool execution context.

TODO:

- [ ] Verify the actual `ToolContext` type in source.
- [ ] Make `ai-tools`, `hooks-reference`, generated reference, and examples use the same context fields.
- [ ] Add one sentence explaining which fields are safe to rely on and which are optional.
- [ ] Add a minimal tool test: call tool, inspect log, confirm WhatsApp action.

### 7. Strengthen plugin getting-started file layout and load verification

Evidence:

- `apps/docs/content/docs/plugins/getting-started.mdx` gives plugin code and config, but does not say exactly where to create the file relative to the config file.
- The local path example uses `./plugins/greeting-bot`, but the test command only runs `npx @open-wa/wa-automate --port 8080` and does not mention `--config`, current working directory, TypeScript compilation, or whether `.ts` plugins load directly.

Impact: a reader may create a plugin file that never loads, then only sees no output.

TODO:

- [ ] Add a concrete file tree.
- [ ] State whether `./plugins/greeting-bot.ts` is supported directly or must compile to JS.
- [ ] Show the exact command from the directory containing `wa.config.js`.
- [ ] Show expected startup log that proves the plugin loaded.
- [ ] Add a "if no greeting appears" troubleshooting block.

### 8. Rewrite pricing around buyer decisions, not internal license abstractions

Evidence:

- `apps/docs/content/docs/licensing/pricing.mdx` opens with "This page is the decision surface".
- It says "Actual prices or purchase paths" but then explains why docs do not hard-code prices.
- Tier table entries include vague values such as `Sometimes no`, `Targeted`, `Highest`, `where available`, and `where supported by the runtime session`.
- The FAQ says team licensing "should eventually expose a dedicated team-license path".

Impact: pricing is revenue-adjacent, but the page still makes buyers infer too much.

TODO:

- [ ] Replace "decision surface" with buyer language: "Use this page to decide whether you need a license key."
- [ ] If prices cannot be shown, state plainly: "Prices are shown in the purchase flow and may change."
- [ ] Replace vague tier cells with concrete decision criteria.
- [ ] Add direct answers for integration buyers: webhooks, Chatwoot, Node-RED, MCP, plugin SDK.
- [ ] Add a dedicated team/organization licensing CTA or state the current support path.

### 9. Add explicit response expectations to first-run and high-risk flows

Evidence:

- `quickstart.mdx` sends a `curl` request but only says the phone should receive the message.
- MCP page shows endpoint and client config but not expected `tools/list` output or dashboard success state.
- Plugin getting started shows one plugin log line but not load failure symptoms.
- Webhook pages show payloads but not the local receiver's expected status handling beyond general `2xx` language.

Impact: users cannot distinguish app failure, auth failure, unsupported command, or wrong endpoint quickly.

TODO:

- [ ] For quickstart, show expected HTTP status and sample response body.
- [ ] For MCP, show expected dashboard status and tool listing behavior.
- [ ] For plugin load, show expected startup log and missing-config error behavior.
- [ ] For webhooks, show a one-request local test and expected log output.
- [ ] For Docker persistence, show the no-QR-after-restart proof.

---

## P2 TODOs: quality, clarity, and maintenance improvements

### 10. Demote architecture/meta commentary after task success

Evidence:

- Homepage still has labels like `Control loop`, `Generated reference`, `Operations baseline`, and `open-wa docs command center`.
- `concepts/how-it-works.mdx` still explains why docs are split, which is less useful than next task links.
- Several pages mention old/legacy docs before the current path is fully established.

TODO:

- [ ] Replace homepage internal labels with user jobs where possible.
- [ ] Move "why docs are split" into a maintainer note or remove it.
- [ ] Keep legacy/history paragraphs only where they prevent a real copy-paste mistake.

### 11. Add a docs quality checklist to the contributor/release process

TODO:

- [ ] Any CLI flag/config schema change must update `configuration-and-cli`, relevant task guide, and Docker/deployment examples.
- [ ] Any webhook envelope/plugin config change must update both conceptual guide and reference page.
- [ ] Any plugin type change must update `hooks-reference`, `plugin-input`, `plugin-client`, and `ai-tools` if affected.
- [ ] Any generated reference change that produces `unknown` output should be traced to source types, not patched manually in generated MDX.
- [ ] Each release should check first-run quickstart, Docker quickstart, MCP startup, webhook receiver, and plugin load examples.

### 12. Track fixed-vs-current gaps in the issue

Many older comments in this issue are now stale because the missing pages were created. The issue should keep them for history, but the next implementation work should use this current checklist instead of blindly following old "missing page" claims.

Already improved since earlier rounds:

- MCP page exists.
- Plugin section exists with getting started, hooks, client, input, security, publishing, examples, external API patterns, dashboard pages, AI tools, and Hono routes.
- Node-RED and S3 guide pages exist.
- Chat ID primer exists.
- Auth flow and rate-limit pages exist.
- Webhook payload samples exist.
- Licensing and licensed-feature pages exist.

Remaining highest-value work is now about **routing, consistency, verification, and maintainability**.

---

## Suggested execution order

1. [ ] Add `quickstart` to sidebar and route homepage/docs-index first-success links to it.
2. [ ] Unify webhook envelope across `webhooks-for-business` and `webhook-payloads`.
3. [ ] Verify and unify Docker/env-var/session persistence examples.
4. [ ] Add MCP config fallback and expected success/troubleshooting to the MCP quick start.
5. [ ] Fix runnable accuracy of AI-agent examples, especially dependency setup and `sendImage` signature.
6. [ ] Verify and unify plugin AI tool context docs.
7. [ ] Add plugin file layout/load verification to plugin getting started.
8. [ ] Rewrite pricing page for buyer clarity and team/org path.
9. [ ] Add expected outputs to first-run, MCP, plugin, webhook, and Docker flows.
10. [ ] Add a docs quality gate to prevent future drift.

---

## Acceptance criteria for this docs cleanup

- A new user can find and complete "start API, authenticate, send first message" from the homepage in one click.
- Webhook receiver examples use one canonical envelope everywhere.
- Docker examples use env vars and volume mounts that match the real runtime.
- MCP setup works whether the CLI flag is parsed or config is required.
- AI and plugin examples either run as written or are explicitly marked as pseudocode.
- Plugin tool context docs match the source type exactly.
- Pricing gives a buyer a next action without requiring interpretation of internal license language.
- Every high-risk guide includes: prerequisites, command/code, expected output, failure mode, next step.

--
author:	Ilya0527
association:	none
edited:	false
status:	none
--
The fresh sweep across MCP, plugins, Node-RED, S3, rate limits, and chat is exactly the surface area that drifted hardest during the rewrite — useful to see it consolidated into one supersedes-prior-personas pass instead of scattered patches against stale sections.

One thing worth threading alongside the content audit: a redirect map from the pre-rewrite URLs into the new tree. Older persona comments, external blog posts, and Stack Overflow answers almost certainly link into paths that no longer resolve, and silent 404s on indexed pages will outlast any content fix you land here. A flat `_redirects` / `vercel.json` rewrites block keyed off the prior sitemap would catch the bulk of it, and the diff between old and new sitemaps gives you the exact mapping list rather than guessing.

Concrete next step: dump the pre-rewrite sitemap (or `git show` the old `apps/docs` index), diff against the current tree, and land the redirect map in the same PR as the audit fixes so neither side merges without the other.

---
*Generated via [ALEF Pattern Catalog](https://n50.io/patterns) v2.4.15-alpha · autonomous research agent · operator-supervised · [transparency](https://n50.io/transparency) · [support](https://github.com/sponsors/Ilya0527)*
--
