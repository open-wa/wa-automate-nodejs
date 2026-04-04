# api/model/events.ts pseudocode trace

Source of truth: `packages/legacy/src/api/model/events.ts`

## Role

- Defines `SimpleListener`, the canonical list of one-callback event hooks supported by the legacy client.

## Main contents

- `events.ts:5-124` — `SimpleListener` enum maps friendly event categories to the actual client method names such as:
  - `onMessage`
  - `onAnyMessage`
  - `onAck`
  - `onChatState`
  - `onLogout`
  - `onStateChanged`
  - plus license-gated or group/product/story-related listeners.

## Why this matters for v5

- This enum is central to how the legacy system auto-registers listeners, builds event signatures, exposes webhook registration, and powers collectors.
- It is one of the most important event-surface inventories in the package.

## Behavioral contract / pseudo tests

- The simple-listener surface should remain enumerable and machine-discoverable.
- Event registration systems should be able to build derived behavior (webhooks, collectors, bridges) from a single event-name inventory.
- License-gated or optional listeners should still be distinguishable from baseline listeners.

## Parity status

| Dimension | Status | Note |
| --- | --- | --- |
| Canonical simple-listener inventory | Preserve | Central to event parity. |
| Exact enum members | Intentionally changed | Surface can evolve if mapping is explicit. |

## Inputs / outputs / side effects

- Inputs: event/listener definitions.
- Outputs: canonical simple-listener names.
- Side effects: none.

## Failure taxonomy

- Missing listener inventory entry
- Event semantic ambiguity

## Dependency contracts

- Requires: event registration/webhook/collector layers reference a shared event-name source.
- Guarantees: baseline and optional listeners stay distinguishable.

## State transitions

- `LISTENER_DEFINED -> ENUMERABLE_EVENT_SURFACE`
