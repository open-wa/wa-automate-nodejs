# gapfiller

## TL;DR
> **Summary**: Rebuild the active v5 lower-level bootstrap/runtime path so it satisfies the audited target contract before any broader product-surface cleanup. The implementation must replace ceremonial lifecycle steps with real runtime behavior for WAPI injection, patching, license overlays, validation/repair, and truthful readiness.
> **Deliverables**:
> - contract test harness for bootstrap phases D-G
> - real runtime injection bootstrap
> - real patch lifecycle
> - real license-patch lifecycle
> - session validation / repair / finalization layer
> - corrected readiness emission timing
> - post-runtime reassessment of `wa-automate` export breadth
> **Effort**: XL
> **Parallel**: YES - 4 waves
> **Critical Path**: 1 → 2 → 3 → 4 → 5 → 6 → 7

## Context

### Original Request
Create a repository plan named `gapfiller` from the audit context and make it the concrete next implementation plan.

### Interview Summary
- `v5-pseudo-audit.md` is the source of truth for current findings.
- Local popup QR parity is an intentional non-goal; `ezqr`/API/dashboard QR surfaces are acceptable replacement direction.
- WAPI injection, live patch lifecycle, and license-patch lifecycle are must-preserve core runtime behavior in v5.
- `wa-automate` remains the main composition package; CLI remains the Easy API host atop the SDK; lower-level session/bootstrap fundamentals belong below that layer.
- The new target contract is in Section 27 and the active-vs-target gap map is in Section 28.

### Metis Review (gaps addressed)
- Guardrail: do not let top-level export ergonomics outrun lower-level runtime correctness.
- Guardrail: do not let declared lifecycle events count as parity unless active runtime behavior exists.
- Scope control: exclude popup/local QR parity from required implementation work.
- Acceptance requirement: readiness must only be emitted after runtime injection, overlay lifecycle, and validation/finalization are truly complete.

## Work Objectives

### Core Objective
Bring the active v5 lower-level bootstrap path into compliance with the audited target contract by implementing real runtime behavior for phases D-G and preventing premature readiness.

### Deliverables
- Bootstrap contract tests for phases D-G
- Active WAPI injection implementation in the lower-level runtime path
- Active patch lifecycle implementation in the lower-level runtime path
- Active license-patch lifecycle implementation in the lower-level runtime path
- Session validation / repair / finalization implementation
- Readiness gate recalibration
- Post-runtime review of `wa-automate` export breadth

### Definition of Done
- Lower-level runtime can satisfy the Section 27 readiness questions in `v5-pseudo-audit.md`
- Section 28 phase statuses improve to:
  - Phase D: not absent
  - Phase E: not declared-only
  - Phase F: not absent
  - Phase G: not partial because of premature readiness
- Active startup path proves real injection capability, real overlay lifecycle, and post-overlay validation before `READY`
- Contract tests for phases D-G pass
- No API/CLI layer is used as a compensating workaround for lower-level false readiness

### Must Have
- Real runtime injection bootstrap
- Distinct patch and license overlay lifecycle
- Explicit validation/repair/finalization stage
- Strict readiness gating based on lower-level truth
- Clear event ordering and failure classification

### Must NOT Have
- No local popup QR server parity work
- No broad export-surface redesign before runtime correctness
- No “success = true” style ceremonial lifecycle completions
- No silent skipping of required overlay steps while still advancing to `READY`
- No shallow readiness based only on page presence or QR generation

## Verification Strategy
> ZERO HUMAN INTERVENTION — all verification is agent-executed.
- Test decision: TDD + tests-after hardening
- QA policy: Every task includes agent-executed verification scenarios
- Evidence: `.sisyphus/evidence/task-{N}-{slug}.{ext}`

## Execution Strategy

### Parallel Execution Waves
> Target: 5-8 tasks per wave. <3 per wave (except final) = under-splitting.

Wave 1: contract harness, active-path instrumentation baselines, runtime insertion-point discovery, current readiness assertions  
Wave 2: runtime injection implementation, patch lifecycle implementation, license lifecycle implementation  
Wave 3: session validation/repair/finalization, readiness recalibration, event/failure hardening  
Wave 4: post-runtime export-surface reassessment and cleanup of migration markers/doc alignment

### Dependency Matrix
- 1 blocks 2, 3, 4, 5, 6, 7
- 2 blocks 3, 4, 5, 6
- 3 and 4 block 5 and 6
- 5 blocks 6
- 6 blocks 7
- 7 blocks final verification only

### Agent Dispatch Summary
- Wave 1 → 4 tasks → unspecified-high / qa-agent / writing
- Wave 2 → 3 tasks → backend-agent / unspecified-high / qa-agent
- Wave 3 → 3 tasks → debug-agent / qa-agent / unspecified-high
- Wave 4 → 1 task → unspecified-high / writing

## TODOs

- [x] 1. Build bootstrap contract test harness

  **What to do**: Add a test harness that encodes Section 27 phases D-G and Section 28 gap claims as executable contract tests. Cover event ordering, failure classes, and readiness timing in the active lower-level runtime path.
  **Must NOT do**: Do not write brittle tests tied to legacy file shapes or exact legacy sequencing. Do not let CLI-level behavior substitute for lower-level runtime correctness.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: multi-file runtime test harness with architecture sensitivity
  - Skills: [`qa-agent`] — needed to define contract-level assertions and failure coverage
  - Omitted: [`frontend-agent`] — no UI work required

  **Parallelization**: Can Parallel: NO | Wave 1 | Blocks: [2,3,4,5,6,7] | Blocked By: []

  **References**:
  - Audit target: `v5-pseudo-audit.md:1864-2165` — target lower-level bootstrap contract
  - Gap map: `v5-pseudo-audit.md:2167-2341` — active path vs target contract
  - Active path: `packages/core/src/createClient.ts`
  - Active path: `packages/core/src/transport/Transport.ts`
  - Active path: `packages/core/src/session/index.ts`
  - Legacy benchmark: `packages/legacy-documented/src/controllers/initializer.pseudo.md`
  - Legacy benchmark: `packages/legacy-documented/src/controllers/patch_manager.pseudo.md`
  - Legacy benchmark: `packages/legacy-documented/src/controllers/launch_checks.pseudo.md`
  - Legacy benchmark: `packages/legacy-documented/src/api/Client.pseudo.md`

  **Acceptance Criteria**:
  - [ ] There are explicit tests for phases D, E, F, and G of the target contract
  - [ ] Tests fail on current premature readiness behavior before the implementation changes
  - [ ] Tests assert no `client.ready` before required runtime obligations are satisfied
  - [ ] Tests distinguish at least one fatal bootstrap failure from one repairable/deferred case

  **QA Scenarios**:
  ```
  Scenario: Contract harness fails on current active path
    Tool: Bash
    Steps: Run the targeted bootstrap contract test suite before implementation changes
    Expected: Failing assertions specifically identify injection/overlay/finalization/readiness gaps
    Evidence: .sisyphus/evidence/task-1-bootstrap-contract-tests.txt

  Scenario: Ready ordering is explicitly asserted
    Tool: Bash
    Steps: Run a test focused on event/state ordering for `client.ready`
    Expected: The suite contains an assertion that `client.ready` may not emit before required lower-level obligations finish
    Evidence: .sisyphus/evidence/task-1-ready-ordering.txt
  ```

  **Commit**: YES | Message: `test(core): add bootstrap contract harness` | Files: `packages/core/**`, `packages/client/**`, `packages/api/**`

- [x] 2. Replace ceremonial runtime injection with real activation

  **What to do**: Implement a real runtime injection bootstrap in the active lower-level path so that `Transport.injectWapi()` (or its new owner) establishes actual runtime capability and reports verifiable success/failure.
  **Must NOT do**: Do not preserve the current hardcoded success path. Do not emit successful injection events without corresponding runtime capability.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: bootstrap-critical runtime behavior touching transport/core boundaries
  - Skills: [`debug-agent`] — needed for runtime diagnosis and contract-preserving repair
  - Omitted: [`frontend-agent`] — no UI work required

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: [3,4,5,6] | Blocked By: [1]

  **References**:
  - Active implementation: `packages/core/src/transport/Transport.ts:103-125`
  - Active bootstrap: `packages/core/src/createClient.ts:183-203`
  - Legacy bootstrap phases D/F: `packages/legacy-documented/src/controllers/initializer.pseudo.md:121-171`
  - Legacy browser injection note: `packages/legacy-documented/src/controllers/browser.pseudo.md`
  - Audit classification: `v5-pseudo-audit.md:2209-2212`, `v5-pseudo-audit.md:2242-2249`

  **Acceptance Criteria**:
  - [ ] The active lower-level runtime performs real runtime/WAPI activation rather than returning hardcoded success
  - [ ] Injection success is validated by a stronger capability probe than “no exception thrown”
  - [ ] Injection failure has an explicit failure path and does not silently advance to `READY`
  - [ ] Injection lifecycle events reflect real outcomes

  **QA Scenarios**:
  ```
  Scenario: Runtime injection succeeds and exposes actual capability
    Tool: Bash
    Steps: Run the bootstrap test that verifies the active path can execute a post-injection capability probe
    Expected: The probe passes only after real activation, and the test suite marks Phase D as satisfied
    Evidence: .sisyphus/evidence/task-2-runtime-injection-success.txt

  Scenario: Injection failure blocks readiness
    Tool: Bash
    Steps: Run a failure-mode bootstrap test with injection intentionally prevented or mocked to fail
    Expected: `READY` is not emitted and the failure is classified as a bootstrap blocker
    Evidence: .sisyphus/evidence/task-2-runtime-injection-failure.txt
  ```

  **Commit**: YES | Message: `feat(core): implement runtime injection bootstrap` | Files: `packages/core/**`, `packages/driver-*/**`

- [x] 3. Restore real live patch lifecycle

  **What to do**: Reintroduce an active patch lifecycle with explicit preload/fetch, applicability evaluation, apply/inject, and outcome reporting in the lower-level runtime path.
  **Must NOT do**: Do not merge patching into generic injection with no observable boundary. Do not silently skip required patches while preserving the same readiness behavior.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: runtime lifecycle + fetch/apply behavior + readiness impact
  - Skills: [`qa-agent`] — needed for lifecycle/failure verification
  - Omitted: [`frontend-agent`] — no UI work required

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: [5,6] | Blocked By: [1,2]

  **References**:
  - Legacy patch contract: `packages/legacy-documented/src/controllers/patch_manager.pseudo.md`
  - Legacy initializer overlay phase: `packages/legacy-documented/src/controllers/initializer.pseudo.md:132-145`
  - Target contract phase E: `v5-pseudo-audit.md:1998-2019`
  - Current declared-only status: `v5-pseudo-audit.md:2209-2211`, `v5-pseudo-audit.md:2283-2288`
  - Event surface: `packages/core/src/events/eventMap.ts`

  **Acceptance Criteria**:
  - [ ] Patch lifecycle is implemented as a distinct active phase in the lower-level runtime
  - [ ] Patch fetch/preload and patch apply are separately observable
  - [ ] Patch outcomes are classified in a way the readiness gate can use
  - [ ] Required patch failures do not silently advance to `READY`

  **QA Scenarios**:
  ```
  Scenario: Patch lifecycle succeeds after runtime activation
    Tool: Bash
    Steps: Run the bootstrap contract suite with a valid patch lifecycle path enabled
    Expected: Patch before/after events and readiness gating assertions pass in order after runtime injection
    Evidence: .sisyphus/evidence/task-3-patch-lifecycle-success.txt

  Scenario: Patch failure is observable and readiness-aware
    Tool: Bash
    Steps: Run a bootstrap test with patch fetch/apply forced to fail
    Expected: The failure is surfaced explicitly and readiness behavior matches the configured blocking/degraded policy
    Evidence: .sisyphus/evidence/task-3-patch-lifecycle-failure.txt
  ```

  **Commit**: YES | Message: `feat(core): restore active patch lifecycle` | Files: `packages/core/**`, `packages/config/**`

- [x] 4. Restore real license-patch lifecycle

  **What to do**: Implement license preload/check/apply as a separate lower-level runtime lifecycle with explicit outcomes and readiness impact.
  **Must NOT do**: Do not hide license behavior inside generic patching. Do not accept `licenseKey` in config/CLI without giving it active lower-level meaning.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: contract-sensitive lifecycle with product-surface consequences
  - Skills: [`qa-agent`] — needed for readiness/failure classification verification
  - Omitted: [`frontend-agent`] — no UI work required

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: [5,6] | Blocked By: [1,2]

  **References**:
  - Legacy license lifecycle: `packages/legacy-documented/src/controllers/patch_manager.pseudo.md:29-39`
  - Legacy initializer license overlay: `packages/legacy-documented/src/controllers/initializer.pseudo.md:142-145`
  - Target contract phase E: `v5-pseudo-audit.md:1998-2019`
  - Product direction: `v5-pseudo-audit.md:1842-1859`
  - Current declared-only status: `v5-pseudo-audit.md` sections 19, 25, 28

  **Acceptance Criteria**:
  - [ ] License-patch lifecycle is active and distinct from generic patching
  - [ ] License outcomes are explicit (for example valid / missing / invalid / expired or equivalent)
  - [ ] Readiness behavior reflects license outcome policy explicitly
  - [ ] License lifecycle events reflect real behavior, not declarations only

  **QA Scenarios**:
  ```
  Scenario: License lifecycle succeeds in active bootstrap
    Tool: Bash
    Steps: Run a bootstrap contract test with a valid license path
    Expected: License lifecycle completes before readiness and emits an explicit success outcome
    Evidence: .sisyphus/evidence/task-4-license-lifecycle-success.txt

  Scenario: Invalid or missing license outcome is classified correctly
    Tool: Bash
    Steps: Run bootstrap tests covering at least one failing license outcome
    Expected: The runtime reports the correct outcome class and readiness follows the declared policy
    Evidence: .sisyphus/evidence/task-4-license-lifecycle-failure.txt
  ```

  **Commit**: YES | Message: `feat(core): restore license patch lifecycle` | Files: `packages/core/**`, `packages/config/**`, `packages/wa-automate/**`

- [x] 5. Rebuild session validation, repair, and finalization depth

  **What to do**: Implement the lower-level runtime stage that proves the session is truly usable after injection and overlays, with repair/retry/reinject behavior where appropriate and a finalization layer comparable in meaning to the legacy `loaded()`/final checks contract.
  **Must NOT do**: Do not treat page presence or QR generation as proof of a usable session. Do not emit `READY` before final validation succeeds.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: deepest runtime state-machine work across session/core/client layers
  - Skills: [`debug-agent`] — needed for ambiguous runtime-state diagnosis and regression reduction
  - Omitted: [`frontend-agent`] — no UI work required

  **Parallelization**: Can Parallel: NO | Wave 3 | Blocks: [6] | Blocked By: [1,2,3,4]

  **References**:
  - Legacy validity/finalization: `packages/legacy-documented/src/controllers/initializer.pseudo.md:126-161`
  - Legacy integrity contract: `packages/legacy-documented/src/controllers/launch_checks.pseudo.md`
  - Legacy client finalization: `packages/legacy-documented/src/api/Client.pseudo.md`
  - Target contract phases F/G: `v5-pseudo-audit.md:2021-2052`
  - Current thin session state: `packages/core/src/session/index.ts`
  - Current client start delegation: `packages/client/src/Client.ts`

  **Acceptance Criteria**:
  - [ ] Active path performs a post-injection/post-overlay validation stage before readiness
  - [ ] At least one repair/retry/reinject path exists for qualifying stale or unstable runtime states
  - [ ] Finalization has explicit success/failure outcomes
  - [ ] Lower-level session state becomes richer than the current thin `DISCONNECTED/STARTING/AUTHENTICATING/READY/STOPPED` shape where needed to support truthful readiness

  **QA Scenarios**:
  ```
  Scenario: Valid runtime reaches finalized usable state before ready
    Tool: Bash
    Steps: Run the bootstrap contract suite through a successful post-overlay validation path
    Expected: Finalization completes before `client.ready`, and the runtime is classified as operationally usable
    Evidence: .sisyphus/evidence/task-5-finalization-success.txt

  Scenario: Stale or invalid runtime triggers repair or terminal classification
    Tool: Bash
    Steps: Run a bootstrap test with an intentionally stale/invalid session/runtime condition
    Expected: The runtime does not proceed as healthy; it either enters repair/reinject flow or fails with an explicit terminal classification
    Evidence: .sisyphus/evidence/task-5-finalization-repair.txt
  ```

  **Commit**: YES | Message: `feat(core): add session validation and finalization` | Files: `packages/core/**`, `packages/client/**`

- [x] 6. Recalibrate readiness to lower-level truth

  **What to do**: Move `READY`/`client.ready`/downstream exposure behind the actual completion of the lower-level obligations from tasks 2-5. Preserve the distinction between API host availability and true session-backed readiness.
  **Must NOT do**: Do not let API lifecycle gating compensate for shallow lower-level readiness. Do not leave `READY` semantics ambiguous.

  **Recommended Agent Profile**:
  - Category: `qa-agent` — Reason: this is primarily about truthfulness, ordering, and verification across layers
  - Skills: [`debug-agent`] — needed for event/state ordering debugging
  - Omitted: [`frontend-agent`] — no UI work required

  **Parallelization**: Can Parallel: NO | Wave 3 | Blocks: [7] | Blocked By: [1,2,3,4,5]

  **References**:
  - Target contract readiness gate: `v5-pseudo-audit.md:2037-2052`, `v5-pseudo-audit.md:2294-2316`
  - Current active readiness path: `packages/core/src/createClient.ts:183-203`
  - API lifecycle gating: `packages/api/src/createApiMiddleware.ts:27-37, 51-79`
  - CLI reporting: `packages/wa-automate/src/cli-runtime.ts:173-220`

  **Acceptance Criteria**:
  - [ ] `READY` is not emitted before lower-level phases D/E/F complete or are explicitly classified non-blocking
  - [ ] API host presence and session-backed readiness remain distinct concepts
  - [ ] The runtime can answer the Section 27.7 readiness questions from actual state and event data
  - [ ] Existing tests prove the old premature readiness path no longer occurs

  **QA Scenarios**:
  ```
  Scenario: Ready is emitted only after lower-level obligations complete
    Tool: Bash
    Steps: Run the end-to-end bootstrap contract suite with event-order assertions enabled
    Expected: `client.ready` occurs only after runtime injection, overlay, and finalization checks are complete
    Evidence: .sisyphus/evidence/task-6-readiness-ordering.txt

  Scenario: Server availability does not imply session readiness
    Tool: Bash
    Steps: Start the CLI/Easy API host and query readiness-sensitive routes before and after the client reaches final ready state
    Expected: Host surfaces can exist earlier, but session-backed operations remain correctly gated until lower-level readiness is true
    Evidence: .sisyphus/evidence/task-6-host-vs-session-readiness.txt
  ```

  **Commit**: YES | Message: `fix(core): make readiness reflect finalized runtime state` | Files: `packages/core/**`, `packages/api/**`, `packages/wa-automate/**`

- [x] 7. Reassess top-level `wa-automate` export breadth

  **What to do**: After runtime correctness is restored, reassess whether `@open-wa/wa-automate` should broaden its public re-export surface to align with the clarified product architecture.
  **Must NOT do**: Do not start here. Do not broaden exports before confirming lower-level runtime truthfulness.

  **Recommended Agent Profile**:
  - Category: `writing` — Reason: this is primarily a product-surface/architecture decision memo with possible minimal follow-through
  - Skills: [`pm-agent`] — needed to keep scope and product-surface intent explicit
  - Omitted: [`debug-agent`] — runtime correctness should already be addressed by now

  **Parallelization**: Can Parallel: NO | Wave 4 | Blocks: [] | Blocked By: [6]

  **References**:
  - Architecture clarification: `v5-pseudo-audit.md` sections 3.1, 3.2, 24.3.a, 25, 26
  - Current exports: `packages/wa-automate/src/index.ts`
  - SDK/core exports: `packages/client/src/index.ts`, `packages/core/src/index.ts`

  **Acceptance Criteria**:
  - [ ] A clear decision is made on whether `wa-automate` should re-export more SDK/client/core surface
  - [ ] Any proposed export changes are explicitly justified against the clarified architecture, not legacy nostalgia
  - [ ] No export-surface work regresses the now-correct lower-level runtime contract

  **QA Scenarios**:
  ```
  Scenario: Export-breadth decision is architecture-aligned
    Tool: Bash
    Steps: Run targeted import smoke tests against the decided top-level package surface
    Expected: The package exposes the intended composition surface and the decision is documented/verified without runtime regressions
    Evidence: .sisyphus/evidence/task-7-export-surface.txt

  Scenario: Lower-level runtime remains unaffected by export changes
    Tool: Bash
    Steps: Re-run the bootstrap contract suite after any export-surface adjustment
    Expected: No lower-level runtime contract tests regress
    Evidence: .sisyphus/evidence/task-7-export-regression-check.txt
  ```

  **Commit**: YES | Message: `chore(wa-automate): align top-level export surface` | Files: `packages/wa-automate/**`, `packages/client/**`, `packages/core/**`

## Final Verification Wave (MANDATORY — after ALL implementation tasks)
> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.
> **Do NOT auto-proceed after verification. Wait for user's explicit approval before marking work complete.**
> **Never mark F1-F4 as checked before getting user's okay.** Rejection or user feedback -> fix -> re-run -> present again -> wait for okay.

- [ ] F1. Plan Compliance Audit — oracle
- [ ] F2. Code Quality Review — unspecified-high
- [ ] F3. Real Manual QA — unspecified-high (+ playwright if UI)
- [ ] F4. Scope Fidelity Check — deep

## Commit Strategy
- Contract-first, phase-by-phase increments only
- No commit may claim parity for a declared-only lifecycle
- No readiness-timing commit before tasks 2-5 are real
- No export-surface commit before runtime correctness is verified

## Success Criteria
- The active v5 runtime path no longer maps to “Absent (effective)” for Phase D
- The active v5 runtime path no longer maps to “Declared-only” for Phase E
- The active v5 runtime path no longer maps to “Absent” for Phase F
- The active v5 runtime path no longer maps to “Partial” for Phase G due to premature readiness
- Section 27 readiness questions can be answered from active runtime state/events
- Section 28 implementation priorities are satisfied in order, without using CLI/API host behavior as a substitute for lower-level correctness
