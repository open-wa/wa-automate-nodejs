# events/index.ts pseudocode trace

Source of truth: `packages/legacy/src/events/index.ts`

## Role

- Tiny barrel file for the newer typed event layer.
- Re-exports `EventManager` and `WapiBridge`.

## Why this matters for v5

- It shows the legacy codebase already contains a more explicit event abstraction alongside the older wildcard `ev` system.
- That makes it a likely migration seam for the always-on socket/plugin model.

## Behavioral contract / pseudo tests

- Event abstractions should be exportable from a single discoverable module.
- The typed event layer should remain separable from any legacy wildcard/broadcast layer.

## Parity status

| Dimension | Status | Note |
| --- | --- | --- |
| Event barrel export | Preserve | Discoverability matters. |
| Exact file names/paths | Intentionally changed | Module layout can evolve. |

## Inputs / outputs / side effects

- Inputs: typed event-layer implementations.
- Outputs: unified event exports.
- Side effects: none.

## Failure taxonomy

- Missing/ambiguous event exports

## Dependency contracts

- Requires: typed event layer remains separable and importable.
- Guarantees: callers can locate event infrastructure through one module.

## State transitions

- `EVENT_LAYER_DEFINED -> BARREL_EXPORTED`
