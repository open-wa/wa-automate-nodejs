# cli-options.ts pseudocode trace

Source of truth: `packages/legacy/src/cli/cli-options.ts`

## Role

- Defines the CLI option manifest consumed by `cli/setup.ts`.

## Main flow

- `cli-options.ts` exports `optionList`, a meow-compatible option schema for Easy API / CLI mode.
- The file encodes defaults and descriptions for:
  - API exposure and host/port settings
  - webhooks and event webhooks
  - auth/session inputs
  - logging/debug flags
  - docs/stats generation
  - CORS, socket, key, tunnel, integration flags.

## Why this matters for v5

- This file reveals which concerns the CLI considered first-class toggles.
- If socket mode becomes always-on in v5, this manifest will likely shrink because some flags stop being optional policy choices.

## Behavioral contract / pseudo tests

- CLI option metadata should be complete enough to generate help text and parser flags from one source of truth.
- Defaults should match the real runtime behavior rather than drift from it.
- Options that are no longer meaningful in v5 should be removed or clearly deprecated instead of silently ignored.

## Parity status

| Dimension | Status | Note |
| --- | --- | --- |
| Declarative CLI option inventory | Preserve | Needed for docs/help/parser generation. |
| Exact option set | Intentionally changed | Legacy-only flags should shrink. |

## Inputs / outputs / side effects

- Inputs: declarative option definitions.
- Outputs: parser/help metadata consumers can derive from.
- Side effects: none.

## Failure taxonomy

- Drift between option docs and runtime behavior
- Stale deprecated option exposure

## Dependency contracts

- Requires: CLI bootstrap/help generation consumes the same option inventory.
- Guarantees: options can be enumerated/documented centrally.

## State transitions

- `OPTION_DECLARED -> PARSER_AND_HELP_READY`
