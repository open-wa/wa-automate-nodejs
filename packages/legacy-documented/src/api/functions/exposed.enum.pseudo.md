# api/functions/exposed.enum.ts pseudocode trace

Source of truth: `packages/legacy/src/api/functions/exposed.enum.ts`

## Role

- Small enum describing function names intended to be exposed/bridged around the page/client boundary.

## Main contents

- Enumerates a minimal callback set:
  - `onMessage`
  - `onAnyMessage`
  - `onAck`
  - `onParticipantsChanged`
  - `onStateChanged`

## Why this matters for v5

- Tiny file, but useful as a compact snapshot of which callback names were considered special enough to centralize.

## Behavioral contract / pseudo tests

- Core exposed callback names should be centralized somewhere authoritative.
- Callback naming should stay consistent between bridge code, client registration, and page exposure logic.

## Parity status

| Dimension | Status | Note |
| --- | --- | --- |
| Central callback-name inventory | Preserve | Useful consistency anchor. |
| Exact enum footprint | Intentionally changed | Could be merged/replaced by richer registry. |

## Inputs / outputs / side effects

- Inputs: callback-name definitions.
- Outputs: canonical exposed callback-name list.
- Side effects: none.

## Failure taxonomy

- Callback naming drift
- Duplicate/ambiguous callback definitions

## Dependency contracts

- Requires: bridge and client layers align on callback naming.
- Guarantees: callback names remain centrally referenced rather than duplicated ad hoc.

## State transitions

- `CALLBACK_NAME_DEFINED -> BRIDGEABLE_CALLBACK_SURFACE`
