# api/model/sessionInfo.ts pseudocode trace

Source of truth: `packages/legacy/src/api/model/sessionInfo.ts`

## Role

- Defines the structured diagnostic/session metadata object accumulated during launch and then attached to the client.

## Main contents

- `sessionInfo.ts:3-22` — `SessionInfo` captures:
  - WA/browser/runtime versions
  - launch timing
  - masked account details
  - patch/license/debug markers
  - CLI/account-type context.
- `sessionInfo.ts:24-79` — `HealthCheck` describes runtime health probes such as queue depth, session state, phone reachability, injection status, online status, retry countdown, and battery warnings.

## Why this matters for v5

- This is the shape of the metadata the launcher thinks is important enough to preserve and expose.
- It is a good reference for designing launch telemetry and health reporting in v5.

## Behavioral contract / pseudo tests

- Launch/session metadata should capture enough detail to explain versioning, launch timing, account type, and runtime state.
- Health probes should be expressible in terms of observable session conditions rather than hidden implementation details.
- Session diagnostics should support both human debugging and machine health checks.

## Parity status

| Dimension | Status | Note |
| --- | --- | --- |
| Structured launch/session diagnostics | Preserve | Important for migration observability. |
| Exact fields | Intentionally changed | Fields may evolve if semantic coverage remains. |

## Inputs / outputs / side effects

- Inputs: launch/runtime facts collected from browser, launcher, and client.
- Outputs: structured `SessionInfo` and `HealthCheck` contracts.
- Side effects: none.

## Failure taxonomy

- Missing diagnostic fields
- Misclassified health state

## Dependency contracts

- Requires: launch/runtime layers populate this structure consistently.
- Guarantees: downstream observability/issue-reporting code can rely on structured metadata.

## State transitions

- `LAUNCHING -> DIAGNOSTICS_ACCUMULATING -> SESSION_INFO_AVAILABLE`
- `HEALTH_UNKNOWN -> HEALTHY | DEGRADED | UNHEALTHY`
