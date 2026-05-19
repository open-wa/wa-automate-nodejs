# Documentation Writing TODO List

Synthesized from 6 persona walkthroughs (Rounds 1-6) on issue #3337.
Each entry lists: file path, headings, and what content goes under each.

---

## NEW PAGES (do not exist yet)

### `getting-started/quickstart.mdx` — First Success Path
**Sources**: Round 1 (#8), Round 2 (#8), Round 2 (suggested #5)

- Prerequisites (Node.js >= 22.21.1, npm/pnpm, WhatsApp account)
- Step 1: Start the Easy API with expected terminal output
- Step 2: Authenticate (QR + link-code flow)
- Step 3: Verify API at localhost:8080/api-docs/
- Step 4: Send first message (API docs UI + curl)
- What's Next? (links to bot, CRM, AI, plugin, production guides)

### `getting-started/v5-alpha.mdx` — Version Guidance
**Sources**: Round 1 (site-wide #1), Round 2 (table), Round 2 (suggested #6, #7)

- v5 Alpha Status (what works, what might change)
- When to Use v5 vs v4 (v4 = 4.76.0 for production)
- What Changed in v5 (monorepo, drivers, createClient, plugins, MCP)
- Migration from v4 (link to dedicated guide, breaking changes)
- Legal and Risk Context (ToS, ban risk, rate limits, cryptography notice)

### `guides/integrations-overview.mdx` — Decision Guide
**Sources**: Round 4 (#1, #5, #6), Round 2 (suggested #1, #2)

- Decision tree: which integration for which use case
- Data flow diagrams (WhatsApp → open-wa → CRM and back)
- Contact and message sync explanation
- Security and compliance (data storage, GDPR, retention, export)
- Licensing for integrations (which require which tier)

### `guides/mcp.mdx` — Model Context Protocol
**Sources**: Round 2 (#2), Round 3 (#1, #6, #7), Round 3 (suggested #1, #6, #7)

- What is MCP and why use it
- Quick start with --mcp flag
- Streamable HTTP transport explanation
- Configuring AI clients (Claude Desktop, Cursor, Windsurf, custom)
- Security model (API key, data access, permission scopes, audit)
- Tool discovery flow
- Dashboard MCP page
- Configuration reference
- Without MCP: HTTP alternatives
- LLM-readable docs (/llms.txt, /llms-full.txt)

### `guides/ai-agent-patterns.mdx` — AI Agent Architecture
**Sources**: Round 3 (#2, #3, #4, #5, #8), Round 3 (suggested #2, #3, #4, #5)

- Conversation loop pattern (receive → LLM → send)
- Context management (sliding window, getMessagesForLLM usage)
- Rate limits and safety (messages/min, ban risk, safe defaults)
- Media in LLM pipelines (images, voice, documents, decryptMedia)
- Group chats vs direct messages
- Interactive messages (buttons, lists, polls, handling responses)
- Concurrent message handling (p-queue, parallel limits)

### `guides/webhooks-for-business.mdx` — Webhooks Plain Language
**Sources**: Round 4 (#3, #6), Round 3 (#5)

- What are webhooks (plain language)
- Enabling webhooks (--webhook flag, config file)
- Sample payloads (text, media, group messages with field explanations)
- Connecting to platforms (Zapier, Make.com, n8n, generic HTTP)
- Reliability (retries, concurrency, timeout, delivery guarantees)
- Filtering events
- Security (auth headers, signature verification, HTTPS)

### `guides/node-red.mdx` — Node-RED Integration
**Sources**: Round 4 (#8), Round 2 (README table)

- What is Node-RED and why use it
- Installation (@open-wa/node-red-contrib-wa-automate)
- Available nodes (send, receive, session, media)
- Example flows (echo bot, CRM, conditional routing)
- Connecting to Easy API
- Troubleshooting

### `guides/s3-media.mdx` — S3 Media Storage
**Sources**: Round 4 (#9)

- What is the S3 integration (@open-wa/integration-s3)
- Configuration (bucket, credentials, plugin config)
- How it works (auto upload, URL replacement, retrieval)
- Use cases (compliance, CRM access, backup)

### `guides/chatid-primer.mdx` — Understanding Chat IDs
**Sources**: Round 2 (#7), Round 1 (messages TODO)

- What is a Chat ID (format: number@suffix)
- Suffix types (@c.us, @g.us, @lid, @broadcast)
- Converting phone numbers to Chat IDs
- Getting group IDs
- Common mistakes

### `guides/authentication-flow.mdx` — Auth Deep Dive
**Sources**: Round 2 (#6), Round 1 (link-code TODO)

- How authentication works (WhatsApp Web protocol, session tokens)
- Session storage (disk location, files, duration)
- QR code flow (when, maxQr, timeout, after scanning)
- Link-code flow (phone format, where code appears, expiry, troubleshooting)
- Session recovery (browser close, crash, re-scan vs re-auth)
- Security (sensitive auth material, encryption, rotation)

### `operations/security-and-deployment.mdx` — Security & Deployment Guide
**Sources**: Round 1 (site-wide #4), Round 3 (#6), Round 4 (#7)

- API key management (generation, storage, rotation, leaks)
- Port and network security (reverse proxies, Cloudflare Tunnel, firewall)
- Webhook security (signatures, HTTPS, rate limiting)
- MCP security (API key enforcement, endpoint risks, audit)
- Proxy security (token rotation, custom domains)
- Production checklist
- Deployment topologies (single server, Docker, Compose, CF proxy, K8s)

### `plugins/getting-started.mdx` — Plugin Getting Started
**Sources**: Round 5 (#1), Round 6 (#5), Round 2 (suggested #2)

- What are plugins (reusable integrations, architecture diagram)
- Install the SDK (pnpm add @open-wa/plugin-sdk)
- Your first plugin (createPlugin, defineConfig, event handlers, loading, testing)
- Plugin architecture (security-filtered emitter, client proxy, config validation)
- When to use plugins

### `plugins/hooks-reference.mdx` — Hooks API Reference
**Sources**: Round 5 (#2), Round 6 (#2, #3)

- Lifecycle hooks (core.starting, core.started, core.stopping, client.ready)
- Auth hooks (auth.qr, auth.authenticated)
- Message hooks (message.received, message.sent, message.ack)
- Message interceptors (message.send.before, message.send.after)
- API routes (routes with Hono)
- Dashboard pages (pages array)
- AI tools (tool definitions)
- Cleanup (dispose)
- Catch-all (event)

### `plugins/plugin-client.mdx` — PluginClient Reference
**Sources**: Round 5 (#3), Round 6 (#4)

- What is PluginClient (transport-agnostic proxy)
- Generic method dispatcher (ask)
- Event listener (listen)
- Convenience methods (sendText, sendImage, sendFile, sendLocation, sendLinkWithAutoPreview, reply, decryptMedia, getHostNumber, getContact, getAllContacts, getAllChats, sendSeen)
- Proxy fallback
- What you cannot do

### `plugins/plugin-input.mdx` — PluginInput Breakdown
**Sources**: Round 5 (#4)

- What is PluginInput
- events (security-filtered emitter)
- logger (scoped, auto-prefixed)
- config (validated, type inference)
- sessionId
- client (link to PluginClient reference)

### `plugins/security-model.mdx` — Plugin Security
**Sources**: Round 5 (#5), Round 6 (#5, #6)

- What plugins cannot do
- What plugins can do
- Config validation
- Secret management (env vars, .env, .env file, logging risks)
- Error handling patterns (API failures, network, malformed messages, connection drops)

### `plugins/publishing.mdx` — Publishing a Plugin
**Sources**: Round 5 (#6)

- How to share (no marketplace, npm package)
- Package structure (package.json, main/exports, TS compilation, peer deps)
- Versioning
- Telling users how to load it
- Documenting your plugin
- Testing before publishing

### `plugins/example-dictation.mdx` — Example: Voice Note Transcription
**Sources**: Round 5 (#7), Round 5 (dictation checklist)

- Detecting voice notes (message.received, type/mimetype)
- Decrypting media (client.decryptMedia)
- Calling STT API (fetch, error handling, rate limiting)
- Quote-replying (client.reply)
- Configuration (defineConfig with Zod, env vars)
- Full code example
- Loading and testing

### `plugins/example-moderation.mdx` — Example: OpenAI Moderation
**Sources**: Round 6 (all 12 gaps)

- Scanning incoming messages (message.received, message shape, text extraction, group filtering)
- Calling OpenAI (fetch, error handling, rate limiting, non-blocking)
- Blocking flagged messages (message.send.before, input/output, canceling)
- Storing API key (defineConfig, env vars, validation)
- Group-only moderation (detecting groups, config, exemptions)
- Deleting flagged messages (method, timing, incoming vs sent)
- Logging actions (PluginLogger, audit trail)
- Configuration schema (boolean toggles, nested Zod)
- Action response patterns (delete, warn, notify, log, chain)
- Performance (concurrent calls, caching, rate limits)
- Full code example

### `plugins/reference-plugin-walkthrough.mdx` — Anatomy of a Plugin
**Sources**: Round 5 (#7), Round 5 (webhook/chatwoot reference)

- The webhook plugin step-by-step breakdown
- The Chatwoot plugin step-by-step breakdown
- Patterns to reuse

### `plugins/dashboard-pages.mdx` — Dashboard Integration
**Sources**: Round 5 (#8), Round 6 (#9)

- What are dashboard pages
- Declaring pages (path, title, icon, order)
- What the dashboard renders
- Real-time stats
- Custom React components (coming later)

### `plugins/ai-tools.mdx` — Registering AI Tools
**Sources**: Round 5 (#9), Round 6 (#11)

- What are plugin tools
- ToolDefinition structure
- ToolContext
- Example: Lookup Contact Tool
- Example: Send Message Tool
- Best practices

### `plugins/hono-routes.mdx` — HTTP Routes in Plugins
**Sources**: Round 5 (#10), Round 6 (#12)

- How routes work (routes: () => Hono, mounted at /plugins/<name>/)
- Basic route example
- Securing routes
- Interacting with Easy API auth
- Use cases

### `plugins/external-api-patterns.mdx` — External API Calls from Plugins
**Sources**: Round 6 (#1, #6, #10)

- Making HTTP requests (fetch, axios, peer deps)
- Error handling (429, timeouts, 401, retry, circuit breaker)
- Not blocking the pipeline (async, queue, concurrent limits, timeout)
- Performance (concurrent calls, caching, batching, memory/CPU)

### `guides/rate-limits.mdx` — Rate Limits and Ban Risk
**Sources**: Round 3 (#3), Round 1 (best-practices TODO)

- WhatsApp rate limits (messages/min, by type, triggers)
- What happens when you exceed (blocks, warnings, ban risk)
- Library retry behavior
- Safe defaults for automation
- Ban risk profile

### `guides/message-deletion.mdx` — Deleting Messages
**Sources**: Round 6 (#4)

- Which method deletes messages
- Incoming vs sent messages
- Timing constraints
- Use cases
- Limitations

### `guides/group-filtering.mdx` — Group vs DM Handling
**Sources**: Round 6 (#7)

- Detecting group messages
- Getting the group ID
- Configuring which groups to moderate
- Exempting admins

### `guides/logging-and-audit.mdx` — Logging and Audit Trails
**Sources**: Round 6 (#8)

- PluginLogger (info, warn, error, debug, meta)
- Log persistence
- Exporting logs
- Writing to files or databases

### `guides/config-secrets.mdx` — Managing Secrets in Config
**Sources**: Round 6 (#5), Round 4 (#10)

- Environment variables (process.env, .env, Docker)
- pluginConfig structure (key mapping, nested objects, boolean toggles)
- Security (logging risks, safe storage, rotation)
- Validation (Zod, defaults, graceful handling)

---

## EXISTING PAGES TO EXPAND

### `index.mdx` — Homepage
Add: alpha/stability warning, "what you can build" section, audience paths, prerequisites, first success teaser, v4 vs v5 guidance, support/legal links

### `getting-started/easy-api.mdx`
Add: Node.js prerequisite, expected terminal output, API-key examples, session persistence, plugin loading mention, production warning, link to quickstart

### `getting-started/custom-code.mdx`
Add: clarify create() vs createClient, driver install, TS setup, auth behavior, first send/receive, cleanup/shutdown, v5 caveat, plugin vs custom code section, SocketClient vs embedded runtime

### `getting-started/docker.mdx`
Add: image tags, v4/v5 tags, volume mounts, env vars, --init, browser resources, health checks, docker-compose, secrets, production shape

### `getting-started/link-code.mdx`
Add: phone format, where code appears, expiry/failure, QR still appears?, host device steps, screenshots, troubleshooting

### `guides/configuration-and-cli.mdx`
Add: full CLI reference, config file discovery, env vars, JSON/TS examples, deprecated flags, CLI-to-schema mapping, plugins field docs, pluginConfig docs, example with plugin, secret management

### `guides/session-events.mdx`
Add: full event list, payload shapes, timing, QR/sessionData security, multi-session examples, ev vs client listener, wildcard patterns

### `guides/multiple-sessions.mdx`
Add: real orchestration patterns, port/session mapping, persistence isolation, scaling limits, process-per-session, API routing, failure recovery

### `guides/messages.mdx`
Add: chatId primer link, formatting, attachments vs text, quoted replies, mentions, buttons/lists/polls, errors, rate limits, full bot example, message object shape

### `guides/media.mdx`
Add: data URL creation, file size limits, MIME rules, remote URL auth, decryptMedia output, storage example, stale media recovery, runtime limitations

### `guides/groups.mdx`
Add: group ID format, invite links, admin permissions, join requests, settings, common errors, event payloads, safety/rate-limit warnings

### `client-and-integrations/socket-client.mdx`
Add: install command, full runnable consumer, lifecycle/reconnect, SSE failure, API key headers, compatibility, browser security, plugin SocketClient guidance

### `client-and-integrations/proxying-a-session.mdx`
Add: proxy URL formats, SOCKS/HTTP, env-secret, Docker/prod, auth caveats, verification commands

### `client-and-integrations/chatwoot.mdx`
Add: Chatwoot-side setup, inbox/webhook config, exact open-wa config, media mapping, contact sync, troubleshooting, verification, screenshots, plugin vs CLI difference

### `client-and-integrations/cf-proxy.mdx`
Add: package install, Wrangler prerequisites, Durable Object bindings, local CLI accuracy, token rotation, custom domains, troubleshooting, HTTP examples, plugin proxy guidance

### `client-and-integrations/webhook-payloads.mdx`
Add: enablement flow, endpoint handler examples, auth/signature, retries, delivery guarantees, event filtering, sample JSON payloads per type, plain-language field explanations

### `concepts/how-it-works.mdx`
Add: architecture diagram, browser injection, API/Socket/MCP flow, lifecycle states, session-data storage, plugin architecture position, security-filtered event pipeline

### `concepts/packages.mdx`
Add: full package list, "which package to install" guidance, stability notes, plugin SDK link, driver explanations

### `concepts/data-models.mdx`
Add: chat ID narrative, message direction, media fields, group/contact shapes, nullability patterns, sample payloads

### `concepts/glossary.mdx`
Add: WAPI, Easy API, MCP, Webhook, Driver, ChatId, ContactId, GroupChatId, LID, Event namespace, License tiers, Tunnel, Proxy

### `operations-and-troubleshooting/error-handling.mdx`
Add: common error catalogue, auth timeout, browser failures, blocked account risk, API HTTP errors, retries, logging config, recovery playbooks, error type distinction

### `operations-and-troubleshooting/detect-logouts.mdx`
Add: full state enum, state transitions, recovery recipe, QR re-auth, alerting example, what not to auto-retry

### `operations-and-troubleshooting/best-practices.mdx`
Add: production checklist, security checklist, rate limits, queues, observability, backups, deployment topology, scaling, replace any with proper types, AI agent patterns

### `licensing/licensed-features.mdx`
Add: current behavior, exact gated features, license behavior, status inspection, failure messages, purchase link, support escalation

### `licensing/pricing.mdx`
Add: actual prices or purchase paths, tier definitions, renewal/cancellation, team licensing, feature mapping, integration licensing

### `reference/index.mdx`
Add: navigation explanation, HTTP route conventions, auth requirements, request body conventions, generated-reference limitations, examples

### `reference/core.mdx`
Add: create vs createClient vs Easy API vs OpenWAClient relationship, runnable example, lifecycle, plugin type references, plugin SDK exports

### `reference/messaging.mdx`
Add: real examples of Message/Chat/Contact, media message, location message, field caveats

### `reference/events.mdx`
Add: listener examples, full event names, wildcard example, payload samples, lifecycle ordering, mapping to session-events guide

### `reference/client/index.mdx`
Add: usage guide, HTTP auth/body conventions, aliases explanation, route examples

### Generated Client Reference Pages (all under reference/client/)
For each: add request examples, response examples, error cases, permission/license requirements, caveats
- business.mdx: prerequisites, product/order samples
- chatids.mdx: formats, LID vs @c.us vs @g.us, normalization
- chats.mdx: archive/mute/pin/ephemeral examples, destructive warnings
- communities.mdx: prerequisites, samples, runtime caveats
- contacts.mdx: number-status, profile-picture, blocked IDs
- groups.mdx: license notes, invite/join, admin requirements
- labels.mdx: business/personal, label IDs, UI/API mapping
- media.mdx: decryptMedia vs downloadMedia, binary/base64, large files
- messages.mdx: buttons, lists, polls, contacts, thumbnails, payment, YouTube
- mystatus.mdx: what it means, output shape
- session.mdx: health-check, readiness, license status, snapshot schema
- status.mdx: status/stories vs profile, deletion semantics

---

## SIDEBAR TAXONOMY (proposed restructure)

```
docs/
├── index.mdx
├── getting-started/
│   ├── quickstart.mdx
│   ├── v5-alpha.mdx
│   ├── easy-api.mdx
│   ├── custom-code.mdx
│   ├── docker.mdx
│   └── link-code.mdx
├── guides/
│   ├── integrations-overview.mdx
│   ├── mcp.mdx
│   ├── ai-agent-patterns.mdx
│   ├── webhooks-for-business.mdx
│   ├── node-red.mdx
│   ├── s3-media.mdx
│   ├── chatid-primer.mdx
│   ├── authentication-flow.mdx
│   ├── rate-limits.mdx
│   ├── message-deletion.mdx
│   ├── group-filtering.mdx
│   ├── logging-and-audit.mdx
│   ├── config-secrets.mdx
│   ├── configuration-and-cli.mdx
│   ├── config-schema.mdx
│   ├── session-events.mdx
│   ├── multiple-sessions.mdx
│   ├── messages.mdx
│   ├── media.mdx
│   └── groups.mdx
├── plugins/
│   ├── getting-started.mdx
│   ├── hooks-reference.mdx
│   ├── plugin-client.mdx
│   ├── plugin-input.mdx
│   ├── security-model.mdx
│   ├── publishing.mdx
│   ├── example-dictation.mdx
│   ├── example-moderation.mdx
│   ├── reference-plugin-walkthrough.mdx
│   ├── dashboard-pages.mdx
│   ├── ai-tools.mdx
│   ├── hono-routes.mdx
│   └── external-api-patterns.mdx
├── client-and-integrations/
│   ├── socket-client.mdx
│   ├── proxying-a-session.mdx
│   ├── chatwoot.mdx
│   ├── cf-proxy.mdx
│   └── webhook-payloads.mdx
├── concepts/
│   ├── how-it-works.mdx
│   ├── packages.mdx
│   ├── data-models.mdx
│   └── glossary.mdx
├── operations-and-troubleshooting/
│   ├── security-and-deployment.mdx
│   ├── error-handling.mdx
│   ├── detect-logouts.mdx
│   └── best-practices.mdx
├── licensing/
│   ├── licensed-features.mdx
│   └── pricing.mdx
└── reference/
    ├── index.mdx
    ├── core.mdx
    ├── messaging.mdx
    ├── events.mdx
    └── client/
```

---

## PRIORITY ORDER

### Phase 1: Unblock New Users (P0)
1. getting-started/quickstart.mdx
2. getting-started/v5-alpha.mdx
3. guides/chatid-primer.mdx
4. guides/authentication-flow.mdx
5. operations/security-and-deployment.mdx
6. Expand index.mdx
7. Expand getting-started/easy-api.mdx
8. Expand getting-started/custom-code.mdx

### Phase 2: Plugin SDK Documentation (P0)
9. plugins/getting-started.mdx
10. plugins/hooks-reference.mdx
11. plugins/plugin-client.mdx
12. plugins/plugin-input.mdx
13. plugins/security-model.mdx
14. plugins/publishing.mdx
15. plugins/reference-plugin-walkthrough.mdx
16. Expand concepts/packages.mdx
17. Expand guides/configuration-and-cli.mdx

### Phase 3: MCP and AI Integration (P0)
18. guides/mcp.mdx
19. guides/ai-agent-patterns.mdx
20. guides/rate-limits.mdx
21. Expand client-and-integrations/webhook-payloads.mdx

### Phase 4: CRM and Business Integrations (P1)
22. guides/integrations-overview.mdx
23. guides/webhooks-for-business.mdx
24. guides/node-red.mdx
25. guides/s3-media.mdx
26. Expand client-and-integrations/chatwoot.mdx

### Phase 5: Plugin Examples and Advanced (P1)
27. plugins/example-dictation.mdx
28. plugins/example-moderation.mdx
29. plugins/external-api-patterns.mdx
30. plugins/dashboard-pages.mdx
31. plugins/ai-tools.mdx
32. plugins/hono-routes.mdx
33. guides/message-deletion.mdx
34. guides/group-filtering.mdx
35. guides/logging-and-audit.mdx
36. guides/config-secrets.mdx

### Phase 6: Reference and Polish (P2)
37. Expand concepts/how-it-works.mdx
38. Expand concepts/glossary.mdx
39. Expand concepts/data-models.mdx
40. Expand reference/core.mdx
41. Expand reference/messaging.mdx
42. Expand reference/events.mdx
43. Expand all reference/client/*.mdx pages
44. Expand operations-and-troubleshooting/*.mdx pages
45. Expand licensing/*.mdx pages
46. Expand remaining getting-started/*.mdx pages
47. Expand remaining client-and-integrations/*.mdx pages
