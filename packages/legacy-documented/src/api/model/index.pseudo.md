# api/model/index.ts pseudocode trace

Source of truth: `packages/legacy/src/api/model/index.ts`

## Role

- This is the main model barrel for the legacy package.
- It re-exports all major domain types and defines shared enums that describe session/runtime state.

## Main contents

- `api/model/index.ts:1-8` — re-export primary entity models such as chat, call, contact, message, errors, events, product, reactions.
- `api/model/index.ts:16-20` — `Status` enum for client lifecycle.
- `api/model/index.ts:27-42` — `Events` enum for high-level client events.
- `api/model/index.ts:49-106` — `STATE` enum describing WA session states such as `CONNECTED`, `UNPAIRED`, `TIMEOUT`, `TOS_BLOCK`, `SYNCING`, `DISCONNECTED`.
- `api/model/index.ts:108-117` — additional exports including `EasyApiResponse`, config/media/alias/label types.

## Why this matters for v5

- This file captures the semantic vocabulary the rest of the legacy system speaks.
- Migration work should preserve meaning even if the exact enum names or transport shapes evolve.

## Behavioral contract / pseudo tests

- Shared session/event enums should remain stable enough that runtime state is interpretable across layers.
- If enum names change in v5, there should still be an unambiguous mapping from old state meaning to new state meaning.
- Public model barrels should group the major runtime vocabulary in one discoverable place.

## Parity status

| Dimension | Status | Note |
| --- | --- | --- |
| Central domain vocabulary | Preserve | Important for migration and runtime clarity. |
| Exact enum/module layout | Intentionally changed | Layout can evolve if meaning stays mappable. |

## Inputs / outputs / side effects

- Inputs: model/type definitions from leaf files.
- Outputs: central model exports and shared lifecycle/state enums.
- Side effects: none.

## Failure taxonomy

- Enum semantic drift
- Missing model re-exports

## Dependency contracts

- Requires: leaf model definitions remain coherent.
- Guarantees: consumers can import core session/event vocabulary from one barrel.

## State transitions

- `LEAF_MODELS_DEFINED -> BARREL_EXPORTED`
