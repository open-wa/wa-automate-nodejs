# EventManager.ts pseudocode trace

Source of truth: `packages/legacy/src/events/EventManager.ts`

## Role

- This is the newer typed event dispatcher used by `Client.events`.
- It is distinct from the legacy wildcard `ev` emitter in `controllers/events.ts`.

## Main flow

- `EventManager.ts:39-53` — construct an `EventManager` with a session id and optional registry.
- `EventManager.ts:55-132` — `on(eventName, handler, options)`:
  - resolve queue defaults from the registry
  - optionally create a per-listener `PQueue`
  - validate payloads against the registry schema when present
  - execute handlers directly or through the queue
  - return a `ListenerHandle` with `off()`.
- `EventManager.ts:134-136` — `emit(eventName, payload)` forwards into the internal `EventEmitter`.
- `EventManager.ts:138-149` — enumerate or remove listeners.
- `EventManager.ts:151-166` — `drain()` and queue stats helpers for operational visibility.

## Why this matters for v5

- This looks much closer to the kind of event substrate that a plugin/integration system would want.
- Compared with the wildcard `ev` bus, it adds typed payload validation and queue-backed listener isolation.

## Behavioral contract / pseudo tests

- The event manager should isolate listener failures so one bad handler does not collapse the whole event pipeline.
- Typed payload validation should fail the offending event, not corrupt unrelated listeners.
- Queue-backed listeners should preserve ordering expectations within a listener while allowing isolation between listeners.
- Removing listeners should reclaim queue resources cleanly.
- A drain operation should provide a reliable “all queued event work completed” signal.

### Observable evidence

- Queue depth, pending work, and handler failures should be inspectable enough to diagnose plugin/event backpressure.

## Parity status

| Dimension | Status | Note |
| --- | --- | --- |
| Typed queued event isolation | Preserve | Core to plugin-oriented design. |
| Exact queue library | Intentionally changed | Backend may change. |

## Inputs / outputs / side effects

- Inputs: event names, payloads, listener handlers, optional registry metadata.
- Outputs: listener handles, emitted events, queue stats.
- Side effects: queue allocation, async listener execution.

## Failure taxonomy

- Handler failure
- Payload validation failure
- Queue drain/backpressure failure

## Dependency contracts

- Requires: listener registry semantics and event emitter substrate.
- Guarantees: listeners are isolated enough for plugin-grade runtime use.

## State transitions

- `NO_LISTENER -> LISTENER_REGISTERED -> HANDLING -> IDLE`
- `LISTENER_REGISTERED -> REMOVED`
