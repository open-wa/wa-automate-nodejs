# file-utils.ts pseudocode trace

Source of truth: `packages/legacy/src/cli/file-utils.ts`

## Role

- Helper for opening config/webhook files during CLI bootstrap.

## Main flow

- `file-utils.ts:6-32` — `tryOpenFileAsObject(fileLocation, needArray = false)`:
  - resolve file path relative to cwd when needed
  - support `.js` config modules and JSON5 files
  - optionally execute function exports with the current session id
  - validate array-vs-object expectation
  - return parsed contents plus `confPath` metadata.

## Why this matters for v5

- This is one of the CLI’s main dynamic config-loading seams.
- It matters if v5 continues to support executable config files or hook files.

## Behavioral contract / pseudo tests

- Config-file loading should support the declared file formats and reject malformed configs clearly.
- Relative-path lookup should behave predictably from process cwd.
- Function-based config exports should be allowed only if the runtime intentionally supports executable config.
- The loader should preserve provenance metadata so callers know which config file actually won.

## Parity status

| Dimension | Status | Note |
| --- | --- | --- |
| Flexible config-file parsing | Preserve | Still useful for ops/deployment workflows. |
| Exact parser/JSON5/require strategy | Intentionally changed | Loader internals can evolve. |

## Inputs / outputs / side effects

- Inputs: file path, expected array/object shape, current session id.
- Outputs: parsed config object plus provenance metadata.
- Side effects: file reads and optional execution of config-exported function.

## Failure taxonomy

- File not found
- Parse failure
- Wrong shape returned
- Executable config failure

## Dependency contracts

- Requires: CLI setup knows whether array or object shape is expected.
- Guarantees: callers receive provenance-aware parsed config or a clear failure.

## State transitions

- `PATH_GIVEN -> FILE_FOUND -> PARSED | CONFIG_ERROR`
