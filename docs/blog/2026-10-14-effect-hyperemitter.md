---
title: "OpenWA events: familiar callbacks, optional Effect streams"
description: "Why we're replacing EventEmitter2, keeping the shared ev API, and adding scoped event work and native PubSub access."
slug: effect-hyperemitter
author: open-wa
status: published
release: 5.6.0
audience: SDK and SocketClient developers
---

OpenWA 5.6 replaces EventEmitter2 with an Effect-backed
HyperEmitter. Your existing `ev.on()` and `ev.emit()` calls keep their callback
behavior, and applications that need a queued consumer can opt into a native
Effect PubSub on the same emitter.

Upgrade with `npm install @open-wa/wa-automate@5.6.0` and the matching browser
driver, or install `@open-wa/hyperemitter@5.6.0` to use the standalone emitter.

## Fix the package boundary first

[Issue #3534](https://github.com/open-wa/wa-automate-nodejs/issues/3534) exposed
an import failure under Node: our ESM core entry imported a named export from
EventEmitter2's CommonJS package. The SDK could fail before an application had
the chance to register its first listener.

Checking the Easy API alone wouldn't establish that a developer could import
the SDK through its published Node package entry. We've removed OpenWA's direct EventEmitter2
dependencies in core and the socket client, and checked the callback contract
through both the immediate and optional queued interfaces. Package import
checks cover a separate boundary from live WhatsApp behavior.

## Keep the callback behavior people depend on

The shared `ev` still supports synchronous, variadic dispatch, namespace
wildcards, listener removal, `this.event`, and the existing subscription helpers.
Ordinary listeners run during `emit()`, and `emitAsync()` waits for direct
listener work and returns its results.

```ts
import { ev } from '@open-wa/wa-automate';

ev.on('app.job.finished', ({ jobId }, sessionId) => {
  console.log('Finished:', jobId, sessionId);
});

ev.emit('app.job.finished', { jobId: 'daily-summary' }, 'support');
```

Underneath that interface, Effect owns asynchronous listener work and scoped
registrations. Closing a scope removes its listeners and interrupts their
owned fibers, so a stopped integration doesn't leave subscriptions behind.
External Promise operations still need their own cancellation support.

Ordinary callback dispatch stays direct. A callback-only emitter doesn't create
a PubSub or persistent consumer fibers. Effect is entered when listener work
needs it, or when an application explicitly uses `emitEffect()`.

## Add a queued reader when it helps your application

A dashboard, audit consumer, or integration may need its own processing pace.
`ev.subscribe()` gives that consumer a scoped subscription, while `ev.stream()`
exposes the feed for Stream filtering, batching, and sequential work.
`ev.pubsub()` returns the native Effect PubSub for applications that want direct
access.

```ts
import { ev } from '@open-wa/wa-automate';
import { Effect, PubSub } from 'effect';

await Effect.runPromise(Effect.scoped(Effect.gen(function* () {
  const subscription = yield* ev.subscribe();
  ev.emit('app.job.finished', { jobId: 'daily-summary' }, 'support');

  const { event, args } = yield* PubSub.take(subscription);
  console.log(event, args[0].jobId, args[1]);
})));
```

Queued frames preserve every argument. On a client's typed `client.events`
emitter, the corresponding frame is `{ event, payload }`. Each subscriber
receives its own feed; its scope controls how long that subscription lives.

The default hub has no replay and no capacity limit for pending observations.
A slow active reader can accumulate a backlog. You can instead select dropping
or sliding with an explicit capacity before the hub is first used. Those
policies trade retention for bounded pending observation capacity. Replay is a
separate, explicit option for late subscribers.

`emitAsync()` waits for direct listeners, not queued consumers. Publishing to the
raw PubSub reaches queued readers only. These distinctions let a consumer choose
its own completion and retry policy without changing existing callback timing.
The feed is in memory; durable delivery belongs in your integration's storage.

## Why we chose composition

We compared a tuned callback/Effect hybrid, a dispatcher that enters Effect for
every emission, and PubSub dispatch with single-event and batched consumers.
The benchmark waited for completed work and checked delivery counts, payloads,
and order, rather than measuring queue submission alone.

The results varied with listener type and batching. For a WhatsApp session,
peak dispatch throughput is usually less useful than predictable listener
timing, cleanup, and a clear policy for a slow consumer. Keeping direct callbacks
and exposing PubSub together gives applications those choices without forcing
all listeners through a queue.

PubSub fits independent broadcast consumers. Queue fits a pool of workers
sharing jobs. SubscriptionRef fits consumers that need current state, while a
scoped Stream fits consumers that need transformations and controlled work.
They solve different application problems, so the emitter shouldn't force one
delivery model onto all of them. The
[architecture review](https://github.com/open-wa/wa-automate-nodejs/blob/master/docs/research/2026-10-14-effect-event-system-designs.md)
records those tradeoffs against the pinned Effect source and official docs.

Start with the [Effect event guide](https://openwa.dev/docs/guides/effect-event-streams)
for a runnable example, use the
[HyperEmitter reference](https://openwa.dev/docs/reference/hyperemitter) for
method and buffer semantics, or keep the
[session event guide](https://openwa.dev/docs/guides/session-events) handy for
native payloads and global aliases. The
[benchmark methodology and reports](https://github.com/open-wa/wa-automate-nodejs/blob/master/packages/hyperemitter/benchmarks/README.md)
are available alongside the implementation.
