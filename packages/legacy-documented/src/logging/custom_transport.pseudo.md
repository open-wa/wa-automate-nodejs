# custom_transport.ts pseudocode trace

Source of truth: `packages/legacy/src/logging/custom_transport.ts`

## Role

- Defines Winston transports that bridge logger output into the legacy event system or absorb logs as a no-op.

## Main flow

- `custom_transport.ts:4-19` — `LogToEvTransport`
  - emits the standard Winston `logged` event
  - forwards the log payload onto `ev` under a `DEBUG.<level>` namespace.
- `custom_transport.ts:21-32` — `NoOpTransport`
  - satisfies Winston’s transport requirement without producing external output.

## Why this matters for v5

- This is one of the places where logging and event streaming intentionally overlap.
- That overlap is relevant if socket/event mode becomes the default integration channel.

## Behavioral contract / pseudo tests

- Event-mirroring log transports should preserve useful log structure without leaking raw secrets by default.
- A no-op placeholder transport should remain available so logger construction is safe before real transports are attached.
- Mirrored debug logs should not become the only source of truth for critical runtime state.

## Parity status

| Dimension | Status | Note |
| --- | --- | --- |
| Event-mirroring transport concept | Preserve | Still useful for integrations. |
| Exact transport classes | Intentionally changed | Implementation can be replaced. |

## Inputs / outputs / side effects

- Inputs: structured log events.
- Outputs: mirrored debug events or no-op completion.
- Side effects: event-bus emission.

## Failure taxonomy

- Event-bus mirror failure
- Misrouted debug namespace

## Dependency contracts

- Requires: logger backend and event bus integration point.
- Guarantees: logger can attach event or no-op transports without changing caller behavior.

## State transitions

- `TRANSPORT_ATTACHED -> LOG_RECEIVED -> EVENT_MIRRORED | NO_OP`
