---
"@open-wa/mcp": minor
"@open-wa/schema": minor
"@open-wa/config": minor
---

✨ MCP Events now follows the Events extension (`io.modelcontextprotocol/events`): any MCP client can follow `message.received`, `ack.changed` and `session.state.changed` with `events/poll` or `events/stream`, alongside webhook subscriptions.
✨ Cursors replay recent events after a reconnect, restart or lapsed subscription, for `mcp.events.retentionMs` (15 minutes by default).
🐛 Webhook retries now span about 15 minutes, each delivery has its own `webhook-id`, rotated secrets are dual-signed, and revoked subscriptions receive a `terminated` envelope. The events journal is recreated on upgrade, so existing webhook subscriptions renew on their next refresh.
