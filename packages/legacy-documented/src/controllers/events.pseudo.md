# events.ts pseudocode trace

Source of truth: `packages/legacy/src/controllers/events.ts`

## Global event bus

- `events.ts:65-67` — `ev` is an `EventEmitter2` wildcard bus.
- Event names are namespaced as `<namespace>.<sessionId>`.

## EvEmitter

- `events.ts:80-125` — `EvEmitter` is the thin session-aware wrapper used throughout launch/runtime code.
- `emit(...)` and `emitAsync(...)`:
  - build the event name from namespace + session id
  - emit on the wildcard bus
  - log the event unless the namespace contains sensitive transport payloads like QR/session data.

## Spin

- `events.ts:130-177` — `Spin` extends `EvEmitter` and fronts `spinnies` so one call updates both:
  1. terminal spinner state
  2. event bus state

Methods map directly to launch UX semantics:

- `start(...)`
- `info(...)`
- `fail(...)`
- `succeed(...)`
- `remove()`

## Why this matters for v5

- Progress reporting is not merely cosmetic. It doubles as an internal event transport that popup mode and other integrations consume.
- Any migration should preserve the dual role: terminal UX + machine-readable launch events.

## Behavioral contract / pseudo tests

- Event emission should remain namespaced enough to support multi-session or multi-instance operation.
- Sensitive payloads like session data or QR payloads should not be blindly mirrored to every transport.
- Progress/spinner updates should be consumable by humans and by automation.
- A failed spinner or logging sink should not break the core runtime event flow.
- Removing a spinner should not imply loss of the underlying machine-readable event trail.

## Parity status

| Dimension | Status | Note |
| --- | --- | --- |
| Session-aware event namespacing | Preserve | Critical for multi-instance behavior. |
| Exact spinner library/UI | Intentionally changed | Presentation can change freely. |
| Dual human+machine progress signaling | Preserve | Required for automation and operator visibility. |

## Inputs / outputs / side effects

- Inputs: event payloads, session id, namespace, spinner state changes.
- Outputs: wildcard bus emissions, spinner/progress updates.
- Side effects: terminal UI updates, event fan-out.

## Failure taxonomy

- Spinner backend unavailable
- Event sink listener failure
- Sensitive payload overexposure risk

## Dependency contracts

- Requires: global event emitter and optional spinner backend.
- Guarantees: emitting progress does not require direct knowledge of consumers.

## State transitions

- `IDLE -> STARTED -> INFO | SUCCEEDED | FAILED -> REMOVED`
- `EVENT_PREPARED -> NAMESPACED -> EMITTED`
