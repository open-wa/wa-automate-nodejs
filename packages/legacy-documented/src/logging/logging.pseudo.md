# logging.ts pseudocode trace

Source of truth: `packages/legacy/src/logging/logging.ts`

## Role in launch/runtime

- This file creates the shared Winston logger used across the legacy package.
- `initializer.ts` and `cli/setup.ts` both depend on `setupLogging(...)` to convert config-driven transport declarations into an active logger.

## Main flow

- `logging.ts:15-24` — define sensitive-key patterns used for redaction.
- `logging.ts:26-76` — deep-copy, circular-safe, redaction, and truncation helpers.
- `logging.ts:78-108` — build the logger format pipeline and create a placeholder transport so Winston never errors on “no transports”.
- `logging.ts:134` — export the shared logger singleton as `log`.
- `logging.ts:139-162` — helper functions to add rotate-file and syslog transports.
- `logging.ts:164-185` — enable console logging or event-bus logging exactly once.
- `logging.ts:187-239` — `ConfigLogTransport` type and `setupLogging(logging, sessionId)` which walks configured transports and enables the requested ones.

## Why this matters for v5

- Logging here is both operator-facing and integration-facing because one transport can mirror logs onto the internal event bus.
- The important behavior to preserve is: safe redaction + pluggable transports + singleton logger setup.

## Behavioral contract / pseudo tests

- Logging should redact obvious secrets before they leave the process.
- Logging setup should be idempotent enough that repeated configuration does not duplicate transports uncontrollably.
- A missing custom transport should not crash the runtime.
- Console/event/file/syslog style outputs may differ in v5, but transport pluggability should remain.
- Long string payloads should be bounded or summarized so logs stay operationally useful.

### Observable evidence

- It should be possible to verify transport activation and redaction behavior from emitted log output without reading implementation internals.

## Parity status

| Dimension | Status | Note |
| --- | --- | --- |
| Redacting pluggable logger | Preserve | Core logging guarantees remain important. |
| Winston-specific implementation | Intentionally changed | Logging backend can change. |

## Inputs / outputs / side effects

- Inputs: logging config, session id, runtime log payloads.
- Outputs: configured logger singleton and emitted log records.
- Side effects: transport registration, log redaction/truncation.

## Failure taxonomy

- Transport setup failure
- Redaction/truncation failure
- Duplicate transport activation

## Dependency contracts

- Requires: config-driven transport definitions and a singleton logger lifecycle.
- Guarantees: runtime code can log without knowing active transport details.

## State transitions

- `UNCONFIGURED_LOGGER -> CONFIGURED_LOGGER -> EMITTING`
