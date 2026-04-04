# launch_checks.ts pseudocode trace

Source of truth: `packages/legacy/src/controllers/launch_checks.ts`

## Role in session bootstrap

- `launch_checks.ts:15-18` — `checkWAPIHash()` compares the local `wapi.js` MD5 hash against a known expected hash.
- `initializer.ts` uses this to decide whether broken-method integrity checks should run.

## Integrity check

- `launch_checks.ts:20-64` — `integrityCheck(page, notifier, spinner, debugInfo)`
  - waits for network idle using `catchRequests(...)`
  - reads local `wapi.js`
  - extracts every `Store.*(` method reference used by WAPI
  - evaluates each method expression inside the page to find missing/broken ones
  - if broken methods exist, tries one repair pass by reinjecting an unconditional form of WAPI
  - if repair still fails:
    - tell the user to upgrade if a newer package exists
    - otherwise report broken methods upstream and surface the issue link when possible.

## Idle helper

- `launch_checks.ts:66-86` — `catchRequests(page)` installs request listeners and returns a closure that waits until all tracked requests settle or time out.

## Why this matters for v5

- The library does not assume injection succeeded just because scripts loaded.
- It verifies that the specific internal Store methods required by WAPI are alive, and it attempts repair before giving up.

## Behavioral contract / pseudo tests

- Runtime integrity should be verified after injection, not assumed.
- Integrity checks should target capabilities the client actually depends on.
- A first repair attempt is acceptable when the failure mode is known to be transient/repairable.
- If integrity cannot be restored, the system should produce actionable diagnostics rather than a vague “broken”.
- Integrity checks should not hang indefinitely waiting for network idleness.
- Local runtime modifications should be detectable so strict hash-based checks can adapt accordingly.

## Parity status

| Dimension | Status | Note |
| --- | --- | --- |
| Capability-based integrity validation | Preserve | Verify needed runtime capabilities explicitly. |
| Exact hash/method list implementation | Intentionally changed | Validation internals may evolve. |
| Repair-before-fail behavior | Preserve | One repair pass remains useful. |

## Inputs / outputs / side effects

- Inputs: page handle, notifier/debug info, local runtime artifacts.
- Outputs: pass/fail integrity verdict plus diagnostics.
- Side effects: optional reinjection/repair attempt, issue/update guidance output.

## Failure taxonomy

- Idle-wait failure
- Hash mismatch detection
- Missing runtime capabilities
- Repair attempt failure

## Dependency contracts

- Requires: known set of required runtime capabilities and optional repair path.
- Guarantees: caller gets an integrity verdict, not just silent best effort.

## State transitions

- `UNVERIFIED -> VERIFIED`
- `UNVERIFIED -> BROKEN -> REPAIR_ATTEMPTED -> VERIFIED | TERMINAL_INTEGRITY_FAILURE`
