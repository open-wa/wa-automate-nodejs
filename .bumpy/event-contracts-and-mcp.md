---
"@open-wa/schema": minor
"@open-wa/api": minor
"@open-wa/config": minor
"@open-wa/mcp": minor
---

- ✨ Discover OpenWA event payloads through AsyncAPI 3.1 at `/meta/asyncapi.json` and the generated event reference in the docs.
- ✨ Let ChatGPT Work subscribe to incoming messages, acknowledgements and session state changes through signed, durable webhook MCP Events. Hosted MCP now serves protocol `2026-07-28`; use a client that supports MCP 2.0. Subscriptions have a finite lifetime and events missed while OpenWA is offline aren't replayed.
