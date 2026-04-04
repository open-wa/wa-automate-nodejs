# index.ts pseudocode trace

Source of truth: `packages/legacy/src/index.ts`

## Role

- `src/index.ts` is the package export barrel.
- It does **not** launch a session itself; it exposes the real launcher through `export { create } from './controllers/initializer'`.

## Main flow

- `index.ts:1-6` — emit a deprecation warning whenever the legacy package entry is loaded.
- `index.ts:8-20` — re-export the legacy public surface:
  - `Client`
  - model types
  - `create`
  - event helpers (`ev`, `Spin`)
  - utility/logging exports
  - preprocessors
  - socket-client package exports.

## Why this matters for v5

- This file defines the compatibility surface that older consumers import from.
- For migration, it shows that `create()` is intentionally the main public entry while socket/event utilities are also part of the public contract.

## Behavioral contract / pseudo tests

- The package entry should expose a coherent public surface without forcing callers to know internal file layout.
- The package entry should keep the real session bootstrap discoverable via a single primary export.
- Deprecation messaging may change in style, but migration guidance should remain obvious when legacy entrypoints are used.

## Parity status

| Dimension | Status | Note |
| --- | --- | --- |
| Public export barrel | Preserve | A clear public entry surface remains important. |
| Exact export shape | Intentionally changed | v5 may reorganize exports while keeping discoverability. |

## Inputs / outputs / side effects

- Inputs: module consumers importing public API.
- Outputs: stable exported runtime/model/helper surface.
- Side effects: deprecation warning when legacy entry is loaded.

## Failure taxonomy

- Missing/reorganized exports
- Misleading migration/deprecation messaging

## Dependency contracts

- Requires: downstream modules remain re-exportable from a coherent package root.
- Guarantees: callers can find the main bootstrap and main support surfaces from one place.

## State transitions

- `PACKAGE_IMPORTED -> PUBLIC_SURFACE_AVAILABLE`
