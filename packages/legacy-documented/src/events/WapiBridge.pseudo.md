# WapiBridge.ts pseudocode trace

Source of truth: `packages/legacy/src/events/WapiBridge.ts`

## Role

- Bridges page-exposed WAPI callbacks into the typed `EventManager`.

## Main flow

- `WapiBridge.ts:4-18` — constructor stores the Puppeteer page and `EventManager`.
- `WapiBridge.ts:20-30` — `registerEvent(eventName, wapiCallbackName)`:
  - refuse duplicate registrations
  - expose a Node callback into the page with `page.exposeFunction(...)`
  - re-emit incoming payloads through `events.emit(...)`.
- `WapiBridge.ts:32-43` — `registerCoreEvents()` installs the core WAPI → event bridge for messages, acks, reactions, logout, participant changes, and related session events.
- `WapiBridge.ts:45-51` — inspection helpers for registered events.

## Why this matters for v5

- This is an early version of a formal integration boundary between page internals and the host runtime.
- It is especially relevant if socket/plugin mode becomes the default architecture.

## Behavioral contract / pseudo tests

- Bridge registration should reject duplicate registrations for the same event contract.
- Page callbacks should be forwarded into the host event layer without requiring downstream code to know page-global callback names.
- Registering “core events” should provide a single high-level setup path for the baseline message/session event surface.

## Parity status

| Dimension | Status | Note |
| --- | --- | --- |
| Page-to-host event bridge | Preserve | Core for integrations/plugins. |
| Exact exposeFunction strategy | Intentionally changed | Bridge mechanics may change. |

## Inputs / outputs / side effects

- Inputs: page handle, event manager, event/callback names.
- Outputs: bridged typed events.
- Side effects: page callback registration.

## Failure taxonomy

- Duplicate bridge registration
- Page exposure failure
- Event forwarding failure

## Dependency contracts

- Requires: page runtime with callable bridge hooks and typed event manager.
- Guarantees: host integrations do not need direct access to page callback naming internals.

## State transitions

- `UNREGISTERED -> REGISTERED -> FORWARDING_EVENTS`
