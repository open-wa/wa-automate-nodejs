---
name: core-runtime
description: Teaches AI agents about open-wa session lifecycle, readiness expectations, and safe operation patterns.
---

# Core Runtime Skill

This skill teaches AI agents how to interact with an open-wa WhatsApp session correctly and safely.

## Session Lifecycle

An open-wa session goes through the following states:

1. **INITIALIZING** — The browser is launching and loading WhatsApp Web.
2. **QR_READY** — A QR code is available for scanning (first-time auth).
3. **AUTHENTICATED** — The QR was scanned or the session restored from cache.
4. **READY** — The session is fully connected and all tools are available.
5. **DISCONNECTED** — The session lost its connection and may be recovering.

## Readiness Rules

- **Never call tools before the session is READY.** Check `/health` or poll the session state first.
- If the session is in `QR_READY`, the agent should inform the user that a QR code needs to be scanned.
- If the session is `DISCONNECTED`, wait for automatic reconnection before retrying.

## Authentication Flows

### QR Code Auth (first-time)
1. Start the runtime.
2. A QR code appears at `/qr` or in the launch timeline.
3. The user scans it in WhatsApp on their phone.
4. The session transitions to `AUTHENTICATED` → `READY`.

### Session Restore (subsequent starts)
1. If `userDataDir` was configured, the browser reuses cached credentials.
2. The session transitions directly to `READY` without a QR code.
3. If the cache is stale, the runtime falls back to QR auth.

## Message Safety

- **Rate limiting**: WhatsApp enforces anti-spam measures. Do not send messages in rapid bursts. Space sends by at least 1-2 seconds.
- **Content**: Never send unsolicited messages to users who have not opted in. This risks account bans.
- **Groups**: Be cautious with group operations. Adding/removing members affects real users.

## License-Gated Features

Some open-wa methods require a license key. If a tool call returns a license error, inform the user that the feature requires a license upgrade. Do not retry.

## Error Handling

- **Validation errors (400)**: Fix the tool arguments and retry.
- **Session not ready (503)**: Wait and check `/health` before retrying.
- **Internal errors (500)**: Report the error to the user. Do not auto-retry more than once.
