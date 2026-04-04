# MessageCollector.ts pseudocode trace

Source of truth: `packages/legacy/src/structures/MessageCollector.ts`

## Role

- Specializes `Collector` for chat-scoped message collection using the legacy event bus.

## Main flow

- `MessageCollector.ts:17-75` — constructor:
  - store chat/session/instance identifiers
  - wrap collector handlers
  - subscribe to event-bus signatures for message, message delete, chat delete, and group removal
  - unregister everything on `end`.
- `MessageCollector.ts:83-92` — `collect(message)` accepts only messages for the target chat and increments `received`.
- `MessageCollector.ts:99-106` — `dispose(message)` removes only messages for the target chat.
- `MessageCollector.ts:113-117` — `endReason()` stops on `max` or `maxProcessed`.
- `MessageCollector.ts:125-140` — stop the collector if the target chat is deleted or the host account is removed from the group.
- `MessageCollector.ts:156-162` — build the namespaced event signature and unwrap `{data}` payloads from the legacy event bus.

## Why this matters for v5

- This file shows how higher-level user workflows are composed from the underlying event signatures.
- Helpful if v5 wants plugin-friendly conversational collectors built on top of a new event substrate.

## Behavioral contract / pseudo tests

- Message collectors should only collect messages from their target chat.
- Chat deletion or removal-from-group should stop the collector automatically.
- Disposal should remove collected messages only when the disposed message belongs to the same chat.
- Message collection should work over namespaced session/instance event signatures, not global ambiguous events.

## Parity status

| Dimension | Status | Note |
| --- | --- | --- |
| Chat-scoped message collection | Preserve | Important convenience/runtime primitive. |
| Exact emitter/listener wiring | Intentionally changed | Implementation can move to new event substrate. |

## Inputs / outputs / side effects

- Inputs: session id, instance id, target chat id, filter, collector options, event emitter.
- Outputs: collected messages and end reason.
- Side effects: listener registration/removal on the shared event bus.

## Failure taxonomy

- Event signature mismatch
- Listener cleanup failure
- Incorrect cross-chat collection

## Dependency contracts

- Requires: a session+instance-scoped event bus and message/chat delete events.
- Guarantees: callers can await chat-local message streams without manual event wiring.

## State transitions

- `UNBOUND -> LISTENING -> COLLECTING -> ENDED`
- `LISTENING -> CHAT_DELETED | GROUP_REMOVAL | LIMIT_REACHED`
