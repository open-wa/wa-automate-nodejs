# ✨ OpenWA 5.6 — Events you can build on

OpenWA 5.6 brings generated event contracts, signed MCP subscriptions, and an Effect-backed emitter that keeps familiar callbacks while adding optional queued consumers. It also fixes the Node import failure reported in [#3534](https://github.com/open-wa/wa-automate-nodejs/issues/3534).

## Familiar callbacks, optional Effect streams

The shared `ev` and socket clients now use HyperEmitter instead of a direct EventEmitter2 dependency. Ordinary callbacks still run synchronously, with variadic arguments, namespace wildcards, listener context, and the existing subscription helpers.

```ts
import { ev } from '@open-wa/wa-automate';

ev.on('app.job.finished', ({ jobId }) => console.log(jobId));
ev.emit('app.job.finished', { jobId: 'daily-summary' });
```

Use `onScoped()` for listeners whose lifetime belongs to an Effect scope, `emitEffect()` to await direct listener work inside Effect, or `subscribe()` and `stream()` for independent queued consumers. `pubsub()` exposes the native Effect PubSub on the same emitter. Callback-only use creates no hub.

Queued observation defaults to no replay and unbounded pending retention for active subscribers. Dropping and sliding policies accept an explicit capacity and can lose observations. `emitAsync()` awaits direct callbacks; queued consumers own their completion and retry policy. Closing a consumer scope releases its subscription, and closing an owned emitter interrupts its work without promising to drain its backlog.

[Effect event guide](https://openwa.dev/docs/guides/effect-event-streams) · [Emitter reference](https://openwa.dev/docs/reference/hyperemitter) · [Session events](https://openwa.dev/docs/guides/session-events)

## Know the payload before building your receiver

Download the generated AsyncAPI 3.1 contract from Easy API's `/meta/asyncapi.json`, or browse the event reference. The schema-owned catalog documents six runtime events across SSE and outbound webhooks, plus the three compact MCP subscription payloads. Callback names and transport envelopes are described separately, so your receiver can use the wire shape for its delivery surface.

[Event contract reference](https://openwa.dev/docs/reference/event-contracts) · [AsyncAPI guide](https://openwa.dev/blog/read-openwa-events-with-asyncapi)

## Give ChatGPT a WhatsApp conversation to watch

Easy API's authenticated MCP endpoint supports subscriptions to incoming messages, acknowledgements, and session state changes. Clients can filter a conversation where the snapshot contains its chat ID. OpenWA verifies callbacks, signs deliveries with Standard Webhooks, validates public HTTPS destinations, and rejects redirects.

Subscriptions and pending deliveries persist in a private SQLite journal. They have finite expiration; pending requests retain their event IDs across bounded retries. Keep `.open-wa/` on persistent storage. Deliveries may repeat or arrive out of order, and events missed while OpenWA is offline aren't replayed. Message summaries contain up to 4,000 characters and identify truncation.

Hosted MCP serves protocol `2026-07-28`; use a compatible MCP 2.0 client and a publicly reachable HTTPS endpoint. HTTP acknowledgement confirms receipt of a callback, rather than completion of the client's task. Live ChatGPT delivery isn't established by the package and contract checks in this release.

[MCP Events setup](https://openwa.dev/docs/client-and-integrations/mcp-events) · [ChatGPT conversation guide](https://openwa.dev/blog/watch-whatsapp-from-chatgpt)

## Upgrade

```sh
npm install @open-wa/wa-automate@5.6.0 @open-wa/driver-puppeteer@5.6.0
# For remote Easy API clients:
npm install @open-wa/socket-client@5.6.0
```

All 28 packages in the fixed OpenWA group move to 5.6.0. `@open-wa/runtime-node` moves to 5.1.2 for its updated internal dependencies.

[Full diff](https://github.com/open-wa/wa-automate-nodejs/compare/v5.5.1...v5.6.0)
