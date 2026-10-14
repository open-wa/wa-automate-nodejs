# OpenWA event contracts and ChatGPT subscriptions

The next OpenWA minor release is being prepared with two useful additions: a generated reference for event payloads, and subscriptions that let ChatGPT Work react to WhatsApp updates.

You can read exactly what your SSE consumer or webhook receiver gets, or ask ChatGPT to watch a customer conversation and draft a reply when a quote request arrives. The implementation is in PR #3539; these features aren't in the published packages yet.

## Know what arrives

The new AsyncAPI 3.1 contract documents six runtime events and their delivery envelopes. You can download it from `/meta/asyncapi.json` on Easy API and browse a generated Fumadocs reference.

That makes a practical difference when you're building a receiver. `onMessage` is a listener callback name, while `message.received` is a wire event whose payload contains `{ ctx, message }`. SSE wraps that in `{ id, event, payload, ts, sessionId }`; the webhook integration uses a different outer envelope. The reference shows the shape for the surface you're using.

OpenWA's schema system supplies the contract and reference, so the event names and payload definitions have one owner. HTTP methods still have their OpenAPI contract.

[Read the AsyncAPI guide](https://openwa.dev/blog/read-openwa-events-with-asyncapi).

## Give ChatGPT a conversation to watch

MCP Events adds three subscription choices to Easy API's MCP endpoint: incoming messages, acknowledgement changes and session state changes. Incoming message subscriptions exclude the linked account's own sends and can filter an exact conversation ID.

For example, you could ask:

> Watch this customer conversation. When someone asks for a quote, draft a reply using our price list and leave it here for review.

ChatGPT supplies a callback URL and signing secret. OpenWA verifies the callback, stores the subscription and sends matching compact summaries over signed HTTPS requests. When it needs the full available message, ChatGPT can use the message lookup tool.

You'll need a publicly reachable HTTPS MCP endpoint, your Easy API key and a client that supports MCP 2.0 protocol `2026-07-28`. ChatGPT supports this event flow in Work web chats, desktop Work chats with Cloud selected, and dots.

[Follow the ChatGPT setup guide](https://openwa.dev/blog/watch-whatsapp-from-chatgpt).

## Keep the delivery limits clear

Subscriptions have a finite lifetime and are renewed by ChatGPT. OpenWA keeps subscriptions and pending deliveries in a private SQLite journal, which needs persistent storage in a container.

Pending requests retain the same event ID across retries. They can repeat or arrive out of order. Events missed while OpenWA is offline aren't replayed, and an HTTP acknowledgement means ChatGPT received the callback rather than finished the requested work.

Message summaries contain up to 4,000 characters and report truncation. This gives a subscription useful context without sending the full runtime snapshot on every update.

## What ships together

The feature PR includes the event catalog, AsyncAPI endpoint and download, generated reference pages, MCP subscriptions, configuration, and minor Bumpy intent for the affected packages. It also updates the setup documentation.

The OpenAI MCP Extensions SDK was considered. Its sidebar views, mentions, files and forms are useful for a future plugin interface; this event workflow uses the native MCP protocol and doesn't require those UI resources.

For implementation details, [browse the event contracts](https://openwa.dev/docs/reference/event-contracts) and [read the MCP Events reference](https://openwa.dev/docs/client-and-integrations/mcp-events).
