# Upcoming: Event contracts and ChatGPT subscriptions

Preview of the upcoming OpenWA minor. The package version and release date are still pending; these changes are not in the published packages yet.

## Event payloads have a generated reference

- ✨ Download an AsyncAPI 3.1 contract from `/meta/asyncapi.json` and browse the generated event reference. It covers six runtime events across SSE and outbound webhooks, plus the three compact MCP subscription payloads.
- 📝 Listener callback names, runtime event names and delivery envelopes are documented separately, so consumers can use the wire shape for their chosen transport.

## ChatGPT can subscribe to WhatsApp updates

- ✨ Subscribe to `message.received`, `ack.changed` and `session.state.changed` through Easy API's authenticated MCP endpoint. Message and acknowledgement subscriptions support an exact conversation filter where the snapshot contains `chatId`.
- 🔒 OpenWA verifies callbacks and uses Standard Webhooks signatures. Delivery is restricted to validated public HTTPS destinations and redirects are rejected.
- 🗃️ Subscriptions and pending deliveries persist in a private SQLite journal. Subscriptions have finite expiration and ChatGPT refreshes them. Pending requests keep their event IDs across bounded retries.

## Upgrade and limits

Hosted MCP now serves protocol `2026-07-28`; use an MCP 2.0 client. ChatGPT's event integration is available in Work web chats, desktop Work chats with Cloud selected, and dots.

Keep `.open-wa/` on persistent storage. Events missed while OpenWA is offline aren't replayed (`cursor: null`), deliveries can repeat or arrive out of order, and message text summaries are capped at 4,000 characters. A callback's successful HTTP response acknowledges receipt rather than completion of ChatGPT's task.

Minor Bumpy intent is included for `@open-wa/schema`, `@open-wa/api`, `@open-wa/config` and `@open-wa/mcp`.

[Event contracts](https://openwa.dev/docs/reference/event-contracts) · [MCP Events setup](https://openwa.dev/docs/client-and-integrations/mcp-events) · [Feature PR](https://github.com/open-wa/wa-automate-nodejs/pull/3539)
