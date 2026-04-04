---
status: not-started
phase: 1
updated: 2026-04-04
---

# Implementation Plan

## Goal
Restore legacy bootstrap page-mutation order in v5 so startup mutates the WhatsApp page in the same semantic sequence as legacy while preserving v5 generation-aware runtime recovery.

## Context & Decisions
| Decision | Rationale | Source |
|----------|-----------|--------|
| Keep controller setup after `goto()` | Legacy binds progress hooks after navigation, not before. | `packages/core/src/transport/Transport.ts:467-492`, `/Users/Mohammed/projects/tools/wa copy/src/controllers/browser.ts:249-260` |
| Treat the pre-auth bootstrap envelope as immutable | Legacy-sensitive ordering is `goto -> launch-only bindings/observer -> helper slot -> wapi.js -> launch.js`. | `/Users/Mohammed/projects/tools/wa copy/src/controllers/browser.ts:249-260,354-408` |
| Keep helper scripts as an explicit phase boundary | Legacy had helper/pre-api injection before WAPI launch. v5 currently has no equivalent phase, which is a parity gap. | `/Users/Mohammed/projects/tools/wa copy/src/controllers/browser.ts:354-408`, `packages/core/src/transport/Transport.ts:2140-2188` |
| Separate early launch bindings from full runtime bridge readiness | v5 can still register bindings early, but runtime bridge readiness must remain post-runtime and post-auth aware. | `packages/core/src/transport/Transport.ts:1722-1845,2140-2188`, `oracle:ses_2a61788c7ffe13Kb4SrWfoEIQp` |
| Make pre-auth validation intentionally shallow | Legacy did not block auth on full runtime capability; v5 should not require final bridge integrity before QR/auth settles. | `packages/core/src/createClient.ts:479-527`, `oracle:ses_2a61788c7ffe13Kb4SrWfoEIQp` |
| Restore post-auth order to patch -> integrity -> license -> init patch -> finalize | This is the biggest remaining sequencing mismatch versus legacy. | `packages/core/src/createClient.ts:568-749`, `/Users/Mohammed/projects/tools/wa copy/src/controllers/initializer.ts:399-431`, `oracle:ses_2a61788c7ffe13Kb4SrWfoEIQp` |
| Keep deferred init patch as the last page mutation before loaded/finalize | Legacy finalized the session only after init patch ran; v5 should preserve that semantic. | `/Users/Mohammed/projects/tools/wa copy/src/controllers/initializer.ts:425-431`, `packages/core/src/createClient.ts:701-749` |

## Phase 1: Freeze Bootstrap Order Contract [PENDING]
- [ ] **1.1 Instrument bootstrap-order tests for exact page mutation sequence** ← CURRENT
- [ ] 1.2 Extend operation/event recorder to distinguish: `goto`, launch bindings, observer install, helper phase, `wapi.js`, `launch.js`, patch apply, integrity check, license apply, deferred init patch, finalize
- [ ] 1.3 Update stale test wording that still encodes pre-navigation injection assumptions beyond the already-fixed local transport test

### Acceptance
- A failing contract test can prove the exact ordering mismatch without relying on live browser runs.
- Tests describe both fresh-auth and resumed-session bootstrap order at a high level.

### QA Scenario
- Tool: `vitest`
- Command: `pnpm --filter @open-wa/core exec vitest run test/unit/bootstrapContract.test.ts test/unit/injectionController.test.ts`
- Expected initial result before implementation: at least one new order-contract assertion fails specifically on current non-legacy ordering.
- Expected result after Phase 1: the failing-first assertions are present, stable, and clearly identify which stage is out of order.

## Phase 2: Restore Legacy Pre-Auth Bootstrap Envelope [PENDING]
- [ ] 2.1 Split transport bootstrap into explicit stages: navigation, launch bindings/observer install, helper/pre-api phase, runtime asset injection
- [ ] 2.2 Keep `goto()` complete before bootstrap launch bindings are attached
- [ ] 2.3 Ensure launch-only bindings/observer install before any `wapi.js` or `launch.js` page evaluation
- [ ] 2.4 Add an explicit helper/pre-api phase in v5 (real helper injection or documented no-op parity slot)
- [ ] 2.5 Keep `wapi.js` before `launch.js`

### Files
- `packages/core/src/transport/Transport.ts`
- `packages/core/src/transport/InjectionController.ts`
- `packages/core/src/transport/initPatchScripts.ts` (only if helper/prog observer staging needs adjustment)
- `packages/core/test/unit/injectionController.test.ts`
- `packages/core/test/unit/bootstrapContract.test.ts`

### Acceptance
- Effective pre-auth order becomes: `goto -> launch bindings -> prog observer -> helper slot -> wapi.js -> launch.js`.
- Runtime replacement observer and navigation recovery remain generation-safe.

### QA Scenario
- Tool: `vitest`
- Command: `pnpm --filter @open-wa/core exec vitest run test/unit/injectionController.test.ts test/unit/bootstrapContract.test.ts -t "bootstrap"`
- Expected result: recorded operation order shows `goto` before launch bindings/observer, and launch bindings/observer/helper slot before `wapi.js` / `launch.js`.
- Expected result: no duplicate binding/init-script registrations are recorded for the same bootstrap generation.

## Phase 3: Re-scope Pre-Auth vs Post-Auth Validation [PENDING]
- [ ] 3.1 Keep pre-auth validation shallow: bootstrap success, not full runtime truth
- [ ] 3.2 Preserve QR/auth flow even if post-runtime required methods are incomplete before auth settles
- [ ] 3.3 Keep authoritative runtime recovery in the post-auth reconciliation path

### Files
- `packages/core/src/createClient.ts`
- `packages/core/src/transport/Transport.ts`

### Acceptance
- Pre-auth validation no longer encodes assumptions that belong to post-auth runtime truth.
- Post-auth reconciliation remains the only authoritative recovery stage for fresh auth and resumed sessions.

### QA Scenario
- Tool: `vitest`
- Command: `pnpm --filter @open-wa/core exec vitest run test/unit/bootstrapContract.test.ts -t "pre-auth|post-auth|runtime validation"`
- Expected result: pre-auth bootstrap does not fail solely on post-auth-only runtime capability gaps.
- Expected result: post-auth reconciliation remains the stage that settles runtime truth and repair ownership.

## Phase 4: Restore Legacy Post-Auth Mutation Order [PENDING]
- [ ] 4.1 Preserve session debug extraction after auth settles
- [ ] 4.2 Keep live patch preload/check available in parallel, but apply patch first
- [ ] 4.3 Insert a distinct post-patch runtime integrity gate before license application
- [ ] 4.4 Apply license only after patch and integrity pass
- [ ] 4.5 Keep deferred init patch after license and before loaded/finalization

### Files
- `packages/core/src/createClient.ts`
- `packages/core/src/transport/Transport.ts`
- `packages/core/test/unit/bootstrapContract.test.ts`
- `packages/core/test/unit/patchLifecycleSemantics.test.ts`

### Acceptance
- Post-auth sequence becomes: `reconcile -> patch -> integrity -> license -> init patch -> finalize`.
- License failures cannot mask patch/integrity failures.

### QA Scenario
- Tool: `vitest`
- Command: `pnpm --filter @open-wa/core exec vitest run test/unit/bootstrapContract.test.ts test/unit/patchLifecycleSemantics.test.ts`
- Expected result: the recorded post-auth order is `patch < integrity < license < deferred init patch < finalize`.
- Expected result: failure fixtures prove patch/integrity failures surface before any license-application failure path.

## Phase 5: Preserve Loaded-Equivalent Finalization Semantics [PENDING]
- [ ] 5.1 Keep deferred init patch as the last runtime mutation
- [ ] 5.2 Make loaded-equivalent completion happen after deferred init patch and before final ready emission
- [ ] 5.3 Preserve v5 readiness truth and operational gating after the legacy-equivalent loaded point

### Files
- `packages/core/src/createClient.ts`
- `packages/core/test/unit/bootstrapContract.test.ts`
- `packages/core/test/unit/releaseBlockerParity.test.ts`

### Acceptance
- `client.ready` remains last, but only after legacy-equivalent loaded sequencing is satisfied.

### QA Scenario
- Tool: `vitest`
- Command: `pnpm --filter @open-wa/core exec vitest run test/unit/bootstrapContract.test.ts test/unit/releaseBlockerParity.test.ts`
- Expected result: deferred init patch completes before loaded-equivalent/finalize completion.
- Expected result: ready/readiness emission remains last in the bootstrap contract.

## Phase 6: Tight Cleanup [PENDING]
- [ ] 6.1 Rename any remaining stale bootstrap naming that still implies the old sequence
- [ ] 6.2 Remove or update any fixtures/artifacts that contradict the final order contract
- [ ] 6.3 Keep scope surgical: bootstrap transport/createClient/tests only

### Acceptance
- Remaining bootstrap names, fixture wording, and artifacts describe the final sequence truthfully.
- No cleanup edit broadens scope outside transport/createClient/bootstrap tests and directly associated artifacts.

### QA Scenario
- Tool: `grep` + `vitest`
- Commands:
  - `grep -R "pre_navigation\|runtime.reinject\|injection_controller_preload_registered" packages/core/src packages/core/test`
  - `pnpm --filter @open-wa/core exec vitest run test/unit/bootstrapContract.test.ts test/unit/injectionController.test.ts`
- Expected result: stale bootstrap-order names are either gone or intentionally retained with updated semantics.
- Expected result: cleanup does not change the verified bootstrap order contract.

## Ordered Target Sequence
1. `transport.initialize()` — browser/page runtime only
2. `transport.navigate()` — `goto()`
3. launch-only bootstrap bindings installed (`ProgressBarEvent`, `CriticalInternalMessage`, prog observer)
4. helper/pre-api phase
5. `wapi.js`
6. `launch.js`
7. shallow pre-auth bootstrap validation
8. auth / QR / link-code settlement
9. post-auth runtime reconciliation + ripe-session gate
10. live patch apply
11. post-patch integrity gate
12. license apply
13. deferred init patch
14. loaded-equivalent finalization
15. final post-overlay/readiness truth gate
16. ready emission

## Notes
- 2026-04-04: Current v5 already matches legacy better on the narrow `goto -> progress bindings/observer` segment, but not yet on the full bootstrap mutation order.
- 2026-04-04: The biggest semantic gap is not `wapi.js` vs `launch.js`; it is the missing helper slot pre-WAPI and the current post-auth order `patch -> license -> init patch` without a distinct post-patch integrity gate.
- 2026-04-04: Keep implementation surgical; do not rewrite InjectionController or broaden into unrelated runtime/event domains.
