# Task 2 webhook source verification

Result: pass.

Source evidence:
- `integrations/webhook/src/config.ts` defines `WebhookPayload` as `{ webhookId, sessionId, event, payload, timestamp }`.
- `integrations/webhook/src/plugin.ts` delivers `{ webhookId, sessionId, event, payload, timestamp: Date.now() }`.
- `integrations/webhook/src/deliverer.ts` posts the payload as JSON with native `fetch`, treats non-2xx as failure, and retries according to `retries`/`retryDelay`.

Docs evidence:
- `webhooks-for-business.mdx` and `webhook-payloads.mdx` both document `payload`, not `data`.
- Receiver examples parse sender, text/caption, and message id from `payload.message`.
