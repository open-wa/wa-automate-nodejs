# api/model/config.ts pseudocode trace

Source of truth: `packages/legacy/src/api/model/config.ts`

This file is the legacy configuration contract. It is large, so this note focuses on the parts that shape launcher behavior and migration assumptions.

## Role

- Defines `ConfigObject` and related enums/types used by `create()`, CLI setup, browser launch, media processing, logging, and integrations.

## Key structural sections

- `config.ts:9-124` — enums and supporting types for QR output, cloud providers, directory strategies, notification language, error policy, QR quality, and license types.
- `config.ts:127-212` — structural interfaces for persisted session data, devtools, event payloads, webhooks, and proxy credentials.
- `config.ts:213+` — `ConfigObject`, the central legacy config surface consumed by `initializer.ts`, `browser.ts`, `Client.ts`, CLI, and middleware.

## Bootstrap-relevant responsibilities inside ConfigObject

- session restoration (`sessionData`, `sessionDataPath`)
- auth mode (`linkCode`, historical QR/session knobs)
- browser behavior (`multiDevice`, `useChrome`, `userDataDir`, `chromiumArgs`, viewport, devtools)
- launcher UX (`popup`, `disableSpins`, logging)
- runtime/integration behavior (webhooks, event mode, cloud upload, preprocessors, API/server flags)

## Migration note for v5

- A lot of legacy complexity exists because several modes were optional. Based on current 2026 assumptions:
  - multi-device should be treated as baseline, not an option
  - env absorption should not be gated behind Docker-specific behavior
  - socket/integration transport should be treated as default infrastructure rather than an opt-in side channel

- That means this file is a strong candidate for config-contract simplification during migration.

## Behavioral contract / pseudo tests

- The config contract should express launch/runtime policy clearly enough that callers do not need source dives to understand defaults.
- Mutually obsolete or contradictory flags should be removed or normalized before launch.
- v5 should treat env/config/CLI sources with a predictable precedence model.
- Session/runtime configuration should separate core launch concerns from optional integration concerns.
- Multi-device should be modeled as baseline behavior, not an optional compatibility path.
- Socket/integration mode should be representable as default infrastructure rather than bolt-on behavior.

## Parity status

| Dimension | Status | Note |
| --- | --- | --- |
| Central config contract | Preserve | Still needed for runtime clarity. |
| Legacy compatibility flags | Not carried forward | Some toggles should disappear in v5. |
| Policy simplification | Intentionally changed | v5 should reduce contradictory options. |

## Inputs / outputs / side effects

- Inputs: type definitions, enums, interface contracts.
- Outputs: canonical runtime/config surface.
- Side effects: none.

## Failure taxonomy

- Contradictory config semantics
- Ambiguous default policy
- Obsolete flag drift

## Dependency contracts

- Requires: launcher, CLI, client, and integrations share this contract or a mapped successor.
- Guarantees: a single typed place exists to understand configuration meaning.

## State transitions

- `OPTIONS_DECLARED -> OPTIONS_RESOLVED_BY_CALLERS`
