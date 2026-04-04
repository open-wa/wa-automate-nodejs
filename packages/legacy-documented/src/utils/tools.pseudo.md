# tools.ts bootstrap-relevant pseudocode trace

Source of truth: `packages/legacy/src/utils/tools.ts`

This file is a large utility bundle. This note covers the exports that materially affect launch, CLI config, transport, and file handling.

## Launch/config helpers

- `tools.ts:46` — `timeout(ms)` resolves to the string `'timeout'`; this exact return shape is relied on by launch races.
- `tools.ts:52-74` — `smartUserAgent(...)` rewrites user agents so they remain WA-compatible.
- `tools.ts:76-84` — `getConfigFromProcessEnv(schema)` maps env vars into config keys using the config-schema file.
- `tools.ts:101-110` — `camelize(...)` supports CLI flag → config-key translation.
- `tools.ts:222-229` — `processSend(...)` aggressively sends a process message three times.
- `tools.ts:239-249` — `now()` and `timePromise(...)` provide the lightweight timing helpers used throughout launch diagnostics.
- `tools.ts:257-267` — `processSendData(...)` wraps structured parent-process messaging.
- `tools.ts:279-297` — `generateGHIssueLink(config, sessionInfo, extras)` builds the prefilled GitHub bug-report URL surfaced during launch.

## File/media helpers used by runtime APIs

- `tools.ts:118-137` — data-shape helpers (`isBase64`, `isDataURL`).
- `tools.ts:146-195` — remote file download helpers (`getBufferFromUrl`, `getDUrl`).
- `tools.ts:307-332` — `ensureDUrl(...)` normalizes file inputs to a DataURL.
- `tools.ts:372-431` — `assertFile(...)` converts among file path / URL / DataURL / base64 / buffer / stream / temp-file representations.
- `tools.ts:443-476` — path and filename sanitation helpers (`pathExists`, `fixPath`, `sanitizeAccentedChars`).

## Why this matters for v5

- A surprising amount of launcher behavior depends on tiny utility conventions here, especially the string-based timeout races and env-to-config absorption.
- If env absorption becomes unconditional in v5, this file is one of the core places where that policy should be centralized.

## Behavioral contract / pseudo tests

- Timeout helpers should return values that callers can distinguish from successful results without ambiguity.
- Env-to-config mapping should be deterministic and centralized.
- Parent-process messaging helpers should fail as gracefully as possible when no parent process exists.
- Issue-link generation should omit or redact sensitive fields while preserving useful debug context.
- File-normalization helpers should accept the documented input shapes and reject invalid file references clearly.
- Path helpers should work across relative paths, absolute paths, and home-directory shortcuts.

## Parity status

| Dimension | Status | Note |
| --- | --- | --- |
| Shared utility conventions | Preserve | Callers depend on these helper contracts. |
| Internal helper implementation details | Intentionally changed | Algorithms/backends may differ. |

## Inputs / outputs / side effects

- Inputs: env values, file references, URLs, session/debug metadata, process messages.
- Outputs: normalized config/file/value artifacts.
- Side effects: parent-process messages, temp-file writes, network fetches for remote files.

## Failure taxonomy

- Invalid env/config mapping
- Invalid file reference
- Remote file fetch failure
- Parent-process messaging unavailable

## Dependency contracts

- Requires: callers treat utility return shapes as canonical (for example timeout sentinel and normalized file outputs).
- Guarantees: higher layers can use these helpers without duplicating normalization logic.

## State transitions

- `RAW_INPUT -> NORMALIZED_VALUE`
- `FILE_REFERENCE -> RESOLVED_FILE | FILE_ERROR`
