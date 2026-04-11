# v5 Post-QR Readiness Recovery Plan

**Date:** 2026-04-11  
**Scope:** Why v5 fails after QR scan while v4 succeeds, and how to restore v4-grade robustness without regressing the v5 architecture.  
**v4 reference:** `/Users/Mohammed/projects/tools/wa copy/bin` log context, plus legacy implementation in `packages/legacy/src/controllers/{auth.ts,browser.ts,initializer.ts,launch_checks.ts}`  
**v5 reference:** `packages/core/src/{createClient.ts,transport/Transport.ts,transport/InjectionController.ts}`, `packages/wa-automate/src/cli-runtime.ts`, and `logs/v5_fail_after_scan.txt`  
**Cross-check:** Sisyphus analysis + Oracle cross-codebase review

---

## Executive summary

The main defect is **not** that v5 fails to inject, and it is **not primarily that patching is broken**. The main defect is that **v5 blesses a post-QR runtime too early, inside a weaker post-auth stabilization model that lacks a strong enough store-settle gate**.

After QR scan, v5 can reach a state where:

- `WAPI` exists,
- runtime bridge bindings exist,
- but `Store.Msg` is still missing.

At that point, v5 still emits `runtime_activation_ready`, proceeds into patch application, and only later fails at the stricter `post_patch` integrity gate with `store_missing`.

Legacy v4 is more robust because it keeps reinjecting and re-checking session integrity around navigation/auth transitions, treats post-auth stabilization more conservatively, and also has an explicit post-injection `Store.Msg` polling gate before it crosses the effective “client ready” boundary.

So the remediation must prioritize:

1. **Behavior fixes** — tighten post-QR/post-auth stabilization, add a store-settle gate, and strengthen recovery.
2. **Telemetry fixes** — stop reporting optimistic readiness when store integrity is incomplete.

---

## Confirmed evidence

### v5 failing path

From `logs/v5_fail_after_scan.txt`:

- `Requiring unknown module "WAWebCollections"` appears before and around QR launch.
- `wapi_injection_probe` reports `hasRuntime:true, hasStoreMsg:false`.
- `runtime_activation_ready` is emitted with `hasStoreMsg:false`.
- Patch lifecycle runs.
- Bootstrap later dies at `post_patch` with `store_missing`.

Relevant code:

- `packages/core/src/transport/assets/wapi.js` — requires `WAWebCollections` to build store access.
- `packages/core/src/transport/Transport.ts:693-724` — `validateRuntimeUsability()` only treats `store_missing` as fatal for `post_patch` / `post_overlay`, not early enough for fresh-auth recovery.
- `packages/core/src/createClient.ts:600-618` — post-auth `post_injection` validation can still emit `runtime_activation_ready`.
- `packages/core/src/transport/Transport.ts:2237-2248` — `recoverRuntimeForCurrentDocument()` short-circuits if runtime + bridge look healthy enough, even if store integrity is still incomplete.

### v4 successful path

From `logs/v4_success_after_scan.txt`:

- navigation triggers reinjection behavior,
- `WAPI CHECK: false` causes retry,
- `Session integrity check passed`,
- post-scan session validity succeeds,
- then patches/license/finalization proceed.

Relevant code:

- `packages/legacy/src/controllers/browser.ts:64-79` — nav-driven reinjection handling.
- `packages/legacy/src/controllers/browser.ts:367-398` — `injectWapi()` retries until integrity passes.
- `packages/legacy/src/controllers/initializer.ts:326-335` — explicit post-injection `Store.Msg` polling gate before the ready path.
- `packages/legacy/src/controllers/initializer.ts:304-311` — legacy waits for a ripe session on reauth-only paths, but still relies on the `Store.Msg` polling gate for session validity.
- `packages/legacy/src/controllers/auth.ts:242-257` — QR success transitions into session loading before full ready behavior.

---

## Root cause statement

v5 currently uses a **too-weak post-auth readiness and stabilization contract**.

It allows a runtime with `WAPI` and bridge bindings but without `Store.Msg` to advance through the launch pipeline. That creates false-positive readiness, allows patches to run against an incomplete authenticated shell, and then fails at the later strict integrity gate.

The primary missing behaviors are:

1. a weak post-auth stabilization model, especially around ripe/session settlement and branch handling after QR scan, and
2. a missing **fresh-auth store-settle gate** before the runtime is considered ready enough for patching and finalization.

The `post_patch allowRepair:false` setting makes the failure irrecoverable once it is reached, but that is a downstream amplifier, not the first defect.

Legacy v4 avoids this failure mode because it combines reinjection/retry behavior, stricter post-auth stabilization around resumed/reauth flows, and an explicit post-injection `Store.Msg` polling gate before it treats the session as valid.

---

## Behavioral differences that matter

### 1. v4 stabilizes more conservatively; v5 mostly classifies and advances

**v4** operationally retries in `injectWapi()` until the session integrity check passes, and it treats post-auth stabilization more cautiously before the ready path.  
**v5** captures richer capability state, but its post-auth/fresh-auth path does not impose an equivalent stabilization contract before advancing.

### 2. v5 treats runtime/bridge presence as usable too early

**v4** does not effectively advance until the store-backed runtime is there.  
**v5** can emit `runtime_activation_ready` while `hasStoreMsg:false`.

### 3. v5 recovery stops on the wrong condition

`recoverRuntimeForCurrentDocument()` currently treats runtime + bridge presence as enough to stop reinjection. That is too weak after QR/auth transitions, where the runtime shell may exist but the authenticated store is not fully built.

### 4. Ripe-session / post-auth stabilization remains a critical factor

It is too strong to say the ripe-session concern is “debunked.” The legacy named `waitForRipeSession()` helper is indeed concentrated on resumed/reauth flows, but the broader post-auth stabilization concern is still real in v5: branch handling, recovery timing, and runtime settlement after QR scan remain weaker and more ambiguous than the legacy flow.

### 5. `post_patch allowRepair:false` makes the failure terminal

The current `post_patch` stage is stricter than the earlier phases and explicitly disables repair. That is dangerous and probably should change, but it is best understood as the point where the earlier readiness mistake becomes irrecoverable.

### 6. v4’s human-readable logs reflect real control flow

This is secondary to the behavior bug, but still important. Legacy logs show reinjection, integrity checks, ready transitions, and final session stabilization in the same order the code actually executes. v5 telemetry is detailed internally but not narrated clearly enough in the CLI.

---

## Remediation plan

## Phase 1 — Fix the behavior and stabilization contract [CRITICAL]

### Goal
Do not allow fresh-auth/post-QR runtime progression into patching/finalization while post-auth stabilization is incomplete or `Store.Msg` is absent.

### 1. Tighten post-auth readiness gating

**Target files:**

- `packages/core/src/createClient.ts`
- `packages/core/src/transport/Transport.ts`

**Changes:**

1. Rework the post-auth `runValidationStage('post_injection', ...)` path so a post-auth runtime with `hasStoreMsg:false` does **not** produce a satisfied `runtimeUsable` readiness state.
2. Preserve the distinction between:
   - pre-auth incomplete runtime that can be deferred, and
   - post-auth incomplete runtime that must remain repairable/blocking.
3. Prevent `runtime_activation_ready` from being emitted when the post-auth authenticated store is still incomplete.

**Implementation guidance:**

- The change belongs around:
  - `createClient.ts:600-618`
  - `Transport.ts:693-724`
- Post-auth validation should either:
  - remain deferred and explicitly unreconciled, or
  - be considered invalid-but-repairable,
  but not "ready."

**Mechanism decision (resolved):**

Three options were considered:

- **Option A**: Make `validateRuntimeUsability()` check `hasStoreMsg` at ALL stages, not just `post_patch`/`post_overlay`. Rejected: would break pre-auth flows where `hasStoreMsg:false` is expected and legitimately deferred.
- **Option B**: Add a NEW validation stage (e.g. `'post_auth_settle'`) between authentication and patching. Rejected: unnecessary stage architecture churn.
- **Option C (selected)**: Keep `validateRuntimeUsability()` stage semantics as-is. Add an explicit `Store.Msg` polling gate in `createClient.ts` between the current lines 604 and 606 — the poll succeeds or the pipeline blocks with a diagnostic error. This is the smallest blast radius and directly mirrors v4's `waitForFunction(Store.Msg, 9000)`.

Option C means `validateRuntimeUsability()` does not change, `runValidationStage()` does not change, and the store-settle contract is enforced in one explicit location in the launch pipeline.

### 2. Elevate ripe-session / post-auth stabilization handling

**Target files:**

- `packages/core/src/createClient.ts`
- `packages/core/src/transport/Transport.ts`

**Changes:**

1. Treat post-auth stabilization as a first-class contract, not a secondary detail.
2. Revisit fresh-auth vs resumed-session branching so recovery and settlement decisions are explicit and testable.
3. Ensure the runtime cannot be treated as practically ready merely because authenticated-shell signals appear while store/runtime internals are still settling.

**Implementation guidance:**

- Do not collapse this into a simplistic “ripe-session inversion” fix.
- Do treat ripe-session / post-auth stabilization as a critical co-factor in the failure, especially for recovery timing and branch selection after QR scan.

### 3. Add a fresh-auth store-settle window

**Target files:**

- `packages/core/src/createClient.ts`
- `packages/core/src/transport/Transport.ts`

**Changes:**

1. Add an explicit timed post-auth settle/polling gate for fresh-auth paths so `Store.Msg` has time to appear before patching/finalization decisions are made.
2. Mirror the practical effect of legacy `initializer.ts:326-335`, which polls `window.Store && window.Store.Msg` rather than performing a single instant capability snapshot.
3. Do **not** describe this as a ripe-session inversion fix. The legacy ripe-session wait is reauth-only; the real fresh-auth gap is missing store-settle polling.

**Concrete parameters:**

- **Timeout:** 15 seconds (v4 uses 9s, but v5's pipeline has more overhead; 15s gives margin).
- **Polling interval:** 200ms (matches v4).
- **Max attempts:** ~75 (15000 / 200).
- **Script:** `!!window.Store && window.Store.Msg` (same as v4, same as existing `STORE_MSG_CHECK_SCRIPT`).

**Timeout-failure behavior:**

When the store-settle gate times out (Store.Msg never appears after 15s):

1. Log diagnostic context: `Object.keys(window.Store || {})` — shows what IS available, matching v4's diagnostic practice.
2. Emit a fatal bootstrap error with scope `bootstrap.store_settle` and a clear message: `Store.Msg not available after 15s store-settle window`.
3. Do **not** silently continue into patching with a known-broken store — that just moves the crash downstream.
4. Future enhancement: consider a full session retry (v4's `kill → create(config)` pattern) instead of dying. That is out of scope for this fix but should be tracked.

**Implementation guidance:**

- The store-settle gate lives in `createClient.ts`, inserted between post-auth validation (current line 604) and the `runtimeUsable: satisfied` update (current line 606).
- Use `transport.page.waitForFunction(STORE_MSG_CHECK_SCRIPT, { timeoutMs: 15000, polling: 200 })` or equivalent.
- The gate runs for ALL post-auth paths (fresh and resumed), since Store.Msg must be present regardless of auth path before patching can proceed.
- This is the primary behavioral fix. Everything else (tightening readiness, recovery semantics) is defense-in-depth.

### 4. Strengthen recovery after QR/auth transitions

**Target file:**

- `packages/core/src/transport/Transport.ts`

**Changes:**

1. Update `recoverRuntimeForCurrentDocument()` so recovery is not skipped merely because runtime and bridge appear present.
2. Make post-auth recovery depend on authenticated store/session integrity too.
3. Ensure that post-auth navigation/runtime replacement can still trigger a true reinjection/recovery path when `hasStoreMsg:false`.

**Implementation guidance:**

- The key short-circuit to revisit is around `Transport.ts:2237-2248`.
- **Important code-path clarification:** When `reconcilePostAuthRuntime()` is called with `freshAuth: true`, the first call to `recoverRuntimeForCurrentDocument()` at line 1498 sets `forceReinject: true`, which correctly bypasses the short-circuit at 2237. However, the **second** call at line 1529 uses `forceReinject: false` — and THAT is the call that hits the short-circuit and returns `runtime_recovery_completed_without_reinject`. The fix must address the second call's decision criteria, not the first.
- The decision should account for store/session readiness, not only WAPI + bridge presence.

### 5. Re-check patch sequencing assumptions

**Target files:**

- `packages/core/src/createClient.ts`
- `packages/core/src/transport/Transport.ts`

**Changes:**

1. Ensure patch preload/apply does not run against a runtime that has not yet satisfied the post-auth store integrity contract.
2. Keep the existing patch lifecycle, but move the “safe to patch” boundary later if necessary.
3. Re-evaluate whether `allowRepair:false` at `post_patch` should remain strict after the upstream gates are fixed.

**Expected outcome:**

- `store_missing` should be caught while repair is still possible, not only at `post_patch` when `allowRepair:false`.
- If `allowRepair:false` remains, it should be because earlier post-auth/store-settle gates guarantee that `post_patch` is already operating on a healthy runtime.

---

## Phase 2 — Add regression tests for the exact bug [CRITICAL]

### Goal
Prevent reintroduction of the post-QR `store_missing` false-readiness bug.

> Tests come before telemetry. You need the tests to verify the behavior fix works before spending time on log formatting.

### 6. Add bootstrap contract coverage for fresh-auth incomplete store and stabilization ambiguity

**Target files:**

- `packages/core/test/unit/bootstrapContract.test.ts`
- related transport/client unit tests if needed

**Required test cases:**

1. **Post-auth runtime with `hasRuntime=true`, `bridgeReady=true`, `hasStoreMsg=false`**
   - must **not** emit satisfied readiness
   - must **not** proceed as if client activation is complete
2. **Store-settle gate timeout**
   - when `Store.Msg` never appears within 15s, bootstrap must fail with `bootstrap.store_settle` scope
   - diagnostic context (`Object.keys(window.Store || {})`) must be logged
3. **Store-settle gate success**
   - when `Store.Msg` appears after a delay (e.g. 3s), bootstrap must proceed normally into patching
4. **Post-auth stabilization / ripe-session-sensitive path**
   - branch handling for fresh-auth vs resumed-session must be explicit and covered
   - recovery timing must not assume authenticated-shell signals are sufficient proof of readiness
5. **Post-auth recovery path**
   - when store is missing but runtime exists, recovery/reinjection must still be attempted or the session must remain blocked in a recoverable state
6. **Patch lifecycle sequencing**
   - patch application must not become the first point at which store absence is discovered irrecoverably
   - if `post_patch` remains strict, verify that upstream settle/repair gates make that safe
7. **Telemetry assertion**
   - no “ready” style event/message should be emitted when store integrity is incomplete
8. **Diagnostics assertion**
   - when failing for `store_missing`, log enough diagnostic context to see what parts of `window.Store` were present

---

## Phase 3 — Restore operator-grade telemetry [HIGH]

### Goal
Make the v5 CLI clearly explain the runtime state transitions that matter during QR/auth recovery.

### 7. Fix misleading readiness logging

**Target files:**

- `packages/core/src/createClient.ts`
- `packages/wa-automate/src/cli-runtime.ts`

**Changes:**

1. Do not narrate readiness with language equivalent to “ready” if `hasStoreMsg:false`.
2. Log explicit post-auth reconciliation outcomes, including:
   - `hasRuntime`
   - `hasStoreMsg`
   - `sessionLoaded`
   - `ripeSessionLoaded`
   - whether reinjection truly occurred
3. Add a clear terminal summary when bootstrap aborts, e.g.:
   - runtime present,
   - store missing,
   - bridge ready,
   - validation stage that failed,
   - whether repair was attempted.
4. Clarify operator-facing narration around patch source/tag/timing. Core already knows source/tag in the patch preload/apply flow; the CLI should surface enough of that information to be useful.

### 8. Port the most useful v4 launch narration into v5

**Target files:**

- `packages/wa-automate/src/cli-runtime.ts`
- potentially `packages/core/src/createClient.ts` / `Transport.ts` event emissions where gaps exist

**Minimum milestone set to surface:**

1. browser launched / page navigated
2. scripts injected / reinjected
3. QR scanned, loading session
4. post-auth runtime reconciled
5. session validity / store integrity checks (including store-settle gate outcome)
6. patches applied (source, tag, timing)
7. final ready / socket/API ready summary

**Important:**

This is not just about prettier logs. The operator should be able to distinguish:

- “runtime exists but authenticated store is missing”
- from
- “runtime is actually ready.”

Patch source/tag visibility is only partially missing today. The core transport already emits that detail internally; the main gap is that the CLI does not narrate it clearly enough for operators.

---

## Suggested implementation order

1. `Transport.ts` — fix recovery decision semantics and post-auth stabilization/store-settle behavior (Phase 1.4)
2. `createClient.ts` — add store-settle polling gate (Phase 1.3), tighten post-auth readiness (Phase 1.1), patch boundary (Phase 1.5)
3. tests — lock in the corrected behavior (Phase 2)
4. `cli-runtime.ts` — improve operator narration and failure summaries (Phase 3)

This order fixes the containment breach first, proves it with tests, then installs the warning siren.

---

## Definition of done

The issue is fixed when all of the following are true:

1. After QR scan, v5 does **not** emit satisfied readiness while `hasStoreMsg:false`.
2. A runtime with WAPI present but store missing remains recoverable or explicitly blocked before patching.
3. Patch lifecycle no longer becomes the first irrecoverable detection point for missing store.
4. The CLI clearly reports whether the runtime is:
   - injected,
   - authenticated,
   - store-complete,
   - bridge-ready,
   - fully ready.
5. Regression tests cover the fresh-auth `store_missing` scenario.
6. The fix path does not dismiss ripe-session / post-auth stabilization as non-causal.

---

## Appendix: concrete file checklist

### Behavior

- [ ] `packages/core/src/transport/Transport.ts`
  - [ ] revisit `recoverRuntimeForCurrentDocument()` short-circuit (specifically the second call at line 1529 with `forceReinject: false`)
  - [ ] revisit post-auth stabilization / ripe-session-sensitive branch handling
  - [ ] confirm post-auth reconciliation logic remains repairable when store is missing
  - [ ] (do NOT change `validateRuntimeUsability()` stage semantics — Option C keeps them as-is)

- [ ] `packages/core/src/createClient.ts`
  - [ ] add store-settle polling gate between lines 604-606 (`waitForFunction(Store.Msg, 15s, 200ms)`)
  - [ ] add timeout-failure handler: log `Object.keys(window.Store || {})`, emit fatal `bootstrap.store_settle`
  - [ ] tighten post-auth readiness: do not set `runtimeUsable: satisfied` until store-settle passes
  - [ ] prevent premature `runtime_activation_ready` emission when `hasStoreMsg:false`
  - [ ] ensure patch lifecycle starts only after store-settle gate

### Tests

- [ ] `packages/core/test/unit/bootstrapContract.test.ts`
  - [ ] add fresh-auth `store_missing` regression case
  - [ ] add store-settle gate timeout case (15s, must fail with diagnostics)
  - [ ] add store-settle gate delayed-success case (Store.Msg appears after 3s, must proceed)
  - [ ] assert no false-ready emission

### Telemetry

- [ ] `packages/wa-automate/src/cli-runtime.ts`
  - [ ] add post-auth reconciliation narration
  - [ ] add store-settle gate outcome narration (waiting / succeeded / timed out)
  - [ ] add integrity/failure summary output
  - [ ] add clearer patch source/tag/timing narration
  - [ ] port key v4 milestones needed for debugging

---

## Final recommendation

Treat this as a **post-auth stabilization + readiness-contract bug with telemetry debt**, not as a patch-only bug.

If you only improve logs, v5 will still fail.  
If you only relax post-patch validation, v5 may hide a broken authenticated shell.  
If you reduce the issue to a single ripe-session inversion claim, you will oversimplify the fix. But if you dismiss ripe-session / post-auth stabilization concerns entirely, you will also chase the wrong fix.  
The correct fix is to restore v4’s robustness principle inside the v5 architecture:

> **do not call the runtime ready until the authenticated store is really there.**

---

## Appendix: future work (out of scope)

- **Full session retry on store-settle timeout**: v4's `kill → create(config)` pattern. Track separately — requires session lifecycle refactoring.
- **`allowRepair:false` at `post_patch`**: If the store-settle gate is in place, this becomes defensible. Revisit only if the gate proves insufficient.
- **`safeMode` equivalent**: v4's optional extra safety delay + triple injection. Low priority once the core gate is in place.
