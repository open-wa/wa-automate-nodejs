# Let ChatGPT watch a WhatsApp conversation

The upcoming OpenWA event integration lets ChatGPT Work react when a WhatsApp message arrives. You can ask it to watch a customer conversation and draft answers using a price list, or watch delivery acknowledgements for a message you're waiting on.

This guide covers the implementation prepared in PR #3539. It isn't available in the published packages yet. Use the release version that includes MCP Events when it ships.

## Start Easy API and pair WhatsApp

Use Node.js 22.21.1 or later. Create `wa.config.mjs` in the directory where you'll keep the linked session:

```js
export default {
  sessionId: 'sales',
  host: '127.0.0.1',
  port: 8080,
  apiKey: process.env.WA_API_KEY,
  mcp: { enabled: true },
};
```

Set a private API key, replace the version placeholder with the release that includes this feature, then start Easy API:

```bash
export WA_API_KEY='REPLACE_WITH_YOUR_PRIVATE_API_KEY'
export OPENWA_VERSION='REPLACE_WITH_RELEASE_VERSION'
export OPENWA_API_URL='http://127.0.0.1:8080'

npx "@open-wa/wa-automate@$OPENWA_VERSION" --config ./wa.config.mjs
```

On your phone, open **WhatsApp → Linked devices → Link a device** and scan the QR code. The dashboard is at `/dashboard/` on the printed server address. Keep the session file private and keep the same working directory when restarting.

You can read the linked session's current state with:

```bash
curl --fail-with-body "$OPENWA_API_URL/health"
```

Expose the MCP endpoint through your existing HTTPS deployment or tunnel. ChatGPT Cloud needs to reach that endpoint; a URL on your laptop's loopback address won't be reachable from its servers. Use the [Easy API remote-access guide](https://openwa.dev/docs/getting-started/easy-api) for the hosting setup.

## Connect the endpoint to ChatGPT

In ChatGPT's plugin setup, connect your HTTPS `/mcp` endpoint using the Easy API key. OpenWA accepts the key through the `X-API-Key` header. This endpoint serves MCP 2.0, protocol revision `2026-07-28`.

Use a Work chat on ChatGPT web, a desktop Work chat with Cloud selected, or a dot. OpenWA exposes three subscription events:

- `message.received` reports incoming messages and excludes this account's own sends.
- `ack.changed` reports changes to a message's acknowledgement value.
- `session.state.changed` reports the linked session's state changes.

Message and acknowledgement subscriptions accept an optional exact `chatId`. Use the conversation ID returned by OpenWA; the session ID `sales` identifies your linked account, not the customer conversation. An acknowledgement snapshot without `chatId` won't match a conversation filter.

## Tell ChatGPT what to watch

Start with a narrow instruction:

> Watch the incoming messages for conversation CHAT_ID. When someone asks for a quote, draft a reply using the attached price list. Keep the reply in this chat for review.

Replace `CHAT_ID` with the exact conversation identifier. ChatGPT creates the subscription and supplies its callback URL and signing secret. OpenWA verifies that callback before delivering WhatsApp data.

Incoming message summaries include `sessionId`, `messageId`, available conversation and sender IDs, up to 4,000 characters of message text, and a `truncated` flag. ChatGPT can call `messages.get` with `messageId` to read the full available message when needed.

## Keep subscriptions across restarts

OpenWA stores subscriptions and pending delivery jobs in a private SQLite file under `.open-wa/`. If you run it in a container, keep that directory on persistent storage alongside the linked session's saved data.

The default subscription lifetime is one day. OpenWA returns `refreshBefore`, and ChatGPT renews the subscription before it expires. You can choose a journal path and maximum lifetime:

```js
mcp: {
  enabled: true,
  events: {
    enabled: true,
    storePath: '.open-wa/mcp-events.sqlite',
    lifetimeMs: 86400000,
  },
}
```

OpenWA signs callbacks using Standard Webhooks. Pending requests can retry after a restart, keeping the same event ID. Events can repeat or arrive out of order, and events missed while OpenWA is offline aren't replayed. Ask ChatGPT to stop watching when you're finished; it calls `events/unsubscribe` and OpenWA cancels delivery for that subscription.

[Read the setup reference](https://openwa.dev/docs/client-and-integrations/mcp-events), [browse event contracts](https://openwa.dev/docs/reference/event-contracts), or read [OpenAI's MCP Events requirements](https://developers.openai.com/plugins/build/mcp-events).
