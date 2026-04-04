# unfuckupgaps

## TL;DR
> **Summary**: Recover v5 from “contractually improved but behaviorally incomplete” into a releaseable runtime by fixing the remaining parity blockers in the driver layer, injection/runtime layer, and client finalization/readiness layer. This plan assumes `.sisyphus/plans/gapfiller.md` is **not complete in spirit or code** and replaces it as the execution source of truth.
> **Deliverables**:
> - release-blocker parity baseline and failing regression matrix against legacy
> - repaired driver lifecycle contract and active `userDataDir` threading
> - generation-based injection controller with real browser→node event bridge
> - frame-navigation + post-auth reinjection and ripe-session gating
> - `Client.loaded()`-equivalent finalization, logout cleanup, and truthful readiness
> - broken-method integrity gate, patch/license semantic alignment, and auth recovery classification
> - facade/runtime inventory smoke coverage, config deprecation matrix, and release evidence pack
> **Effort**: XL
> **Parallel**: YES - 4 waves
> **Critical Path**: 1 → 2 → 3 → 5 → 6 → 8 → 9 → 10 → 17 → 20

## Context

### Original Request
Create a massive recovery plan named `unfuckupgaps` that starts from the reality that `gapfiller.md` was not actually finished, works through `.sisyphus/audits/v5-parity-audit.md`, `.sisyphus/audits/v5-parity-audit-corrections.md`, `.sisyphus/audits/injection-architecture.md`, and finally `.sisyphus/audits/injection-architecture-v2.md`, and leaves v5 releaseable without being a ball of regressions relative to v4.

### Interview Summary
- `gapfiller.md` is treated as **attempted but not accepted**. Its checked boxes are not evidence of parity.
- Audit precedence for implementation planning is:
  1. `.sisyphus/audits/v5-parity-audit.md`
  2. `.sisyphus/audits/v5-parity-audit-corrections.md`
  3. `.sisyphus/audits/injection-architecture.md`
  4. `.sisyphus/audits/injection-architecture-v2.md` (wins on injection-architecture conflicts)
- Legacy behavior must be validated against the real legacy tree at `/Users/Mohammed/projects/tools/wa copy/src`, with `packages/legacy/` and `packages/legacy-documented/` used only as proxies/supporting references.
- Popup/local QR parity is not required for release; MD-obsolete JSON session restore is not a release blocker.
- The plan must be thorough, prioritized, and safe against another half-implementation cycle.

### Metis Review (gaps addressed)
- Guardrail: do not treat `gapfiller` contract tests as proof of real v4 behavioral parity.
- Guardrail: keep the plan focused on **release blockers** first: driver lifecycle truth, injection/runtime truth, and client finalization/readiness truth.
- Guardrail: do not let export surface, docs polish, or nice-to-have legacy conveniences outrun runtime correctness.
- Required additions: parity matrix, decision log for intentional divergences, generation safety invariants, listener ownership invariants, and executable stop/go criteria per stream.

### Oracle Review (architecture constraints incorporated)
- Sequence driver work **before** controller migration; otherwise injection work will thrash against missing lifecycle primitives.
- Treat reinjection/finalization readiness as generation-scoped and drop stale completions cleanly.
- Split work into three converging blocker tracks: driver contract, injection controller/runtime, and client/session semantics.
- Preserve v2 injection architecture over v1 where they conflict: phased controller, structured health, listener ownership, no free-form DAG yet.

### Authority / Decision Log
- **Accepted authority override**: `injection-architecture-v2.md` supersedes `injection-architecture.md` for controller design, health modeling, patch contract shape, and listener ownership.
- **Accepted downgrade**: MD-era JSON `sessionData` restore and popup QR parity are not release blockers.
- **Accepted blocker status**: browser→node event bridge, `IPage` lifecycle gaps, frame-navigation reinjection, post-auth reinjection, `Client.loaded()` equivalence, `userDataDir` threading, and broken-method integrity are release blockers.
- **Accepted divergence rule**: legacy behaviors that produce false readiness, duplicate events, or stale bridge state are intentionally not preserved; v2 generation-based correctness wins.

## Work Objectives

### Core Objective
Make the active v5 runtime path truthfully releaseable by restoring the missing behavioral parity required for correctness and recovery, while explicitly documenting and containing non-blocking legacy divergences.

### Deliverables
- Legacy-vs-v5 release-blocker parity matrix with executable regression coverage
- Expanded `@open-wa/driver-interface` and `@open-wa/driver-puppeteer` lifecycle contract
- `userDataDir` launch-path fix plus driver-level logging/interception primitives
- Generation-based `InjectionController` integrated into core transport
- Real browser→node runtime event bridge and page-side rebinding/disposal semantics
- Frame-navigation and post-auth reinjection with ripe-session gating
- `Client.loaded()`-equivalent finalization and logout cleanup semantics
- Broken-method integrity/repair gate or equivalent capability assertion gate
- Patch/license readiness-truth alignment
- Auth recovery/classification parity for remaining P2 paths
- Release-candidate verification suite, config deprecation matrix, and export-surface reassessment

### Definition of Done
- `pnpm --filter @open-wa/core test` passes with release-blocker parity tests enabled.
- `pnpm --filter @open-wa/client test` passes with finalization/listener/logout coverage enabled.
- `pnpm --filter @open-wa/wa-automate test` passes with host-vs-session readiness assertions enabled.
- `pnpm --filter @open-wa/core build && pnpm --filter @open-wa/client build && pnpm --filter @open-wa/driver-puppeteer build && pnpm --filter @open-wa/wa-automate build` succeeds.
- P0/P1 gaps from `.sisyphus/audits/v5-parity-audit.md` and `.sisyphus/audits/v5-parity-audit-corrections.md` are either:
  - implemented and proven by automated scenarios, or
  - explicitly downgraded/deprecated with regression-proof justification.
- `READY` / `client.ready` only emit after the active generation satisfies runtime injection, bridge readiness, required overlays, and finalization truth.
- A fresh QR-auth session, resumed MD session, and navigation/reload scenario all preserve a usable runtime without zombie state.

### Must Have
- Real browser→node event bridge
- Real frame-navigation and post-auth reinjection
- Real `Client.loaded()`-equivalent finalization
- Real `userDataDir` launch-path persistence threading
- Real broken-method integrity/capability gate
- Generation-scoped injection and readiness truth
- Explicit release-blocker vs non-blocker classification

### Must NOT Have
- No reliance on `gapfiller` checkbox state as proof of parity
- No false `READY` / `client.ready` before final runtime truth is established
- No generic plugin/DAG expansion beyond what v2 requires
- No popup QR/local popup parity work
- No MD-obsolete JSON session restore work treated as a release blocker
- No export-surface broadening before release-blocker runtime work is complete

## Verification Strategy
> ZERO HUMAN INTERVENTION — all verification is agent-executed.
- Test decision: TDD for release blockers + tests-after hardening for downgraded/non-blocking parity.
- QA policy: every task must prove a concrete behavioral delta against current v5 or preserve a no-regression invariant.
- Evidence: `.sisyphus/evidence/task-{N}-{slug}.{ext}`

## Execution Strategy

### Parallel Execution Waves
> Target: 5-8 tasks per wave. Shared prerequisites are isolated early; release blockers are completed before downgrade/deprecation/documentation work.

Wave 1: parity baseline, driver contract, driver implementation, launch-path/config threading  
Wave 2: injection controller foundation, browser→node bridge, listener ownership, navigation reinjection, post-auth reinjection  
Wave 3: finalization parity, logout cleanup, integrity gate, asset/internal-handler truth, patch/license semantics, auth recovery, readiness truth  
Wave 4: runtime method inventory, config deprecation/migration, export-surface reassessment, release-candidate verification

### Dependency Matrix (full)
- 1 blocks 2-20
- 2 blocks 3-9, 17-20
- 3 blocks 4-9, 17-20
- 4 blocks 5-9, 17-20
- 5 blocks 6-9, 17-20
- 6 blocks 7, 10, 17-20
- 7 blocks 10, 11, 17-20
- 8 blocks 9, 17, 20
- 9 blocks 10, 14-17, 20
- 10 blocks 11, 17-20
- 11 blocks 17, 20
- 12 blocks 17, 18, 20
- 13 blocks 14, 18-20
- 14 blocks 15, 17-20
- 15 blocks 17-20
- 16 blocks 17, 20
- 17 blocks 18-20
- 18 blocks 19-20
- 19 blocks 20

### Agent Dispatch Summary
- Wave 1 → 4 tasks → unspecified-high / qa-agent / debug-agent
- Wave 2 → 5 tasks → unspecified-high / debug-agent / backend-agent
- Wave 3 → 8 tasks → debug-agent / qa-agent / unspecified-high
- Wave 4 → 4 tasks → writing / qa-agent / deep

## TODOs
> Implementation + Test = ONE task. Never separate.
> EVERY task MUST have: Agent Profile + Parallelization + QA Scenarios.

- [x] 1. Re-baseline release-blocker parity against real legacy behavior

  **What to do**: Build a single release-blocker parity matrix and executable regression harness that compares active v5 behavior against the real legacy tree at `/Users/Mohammed/projects/tools/wa copy/src`. Convert the audit findings into failing tests or executable probes for: event bridge delivery, frame-navigation reinjection, post-auth reinjection, `Client.loaded()` side effects, `userDataDir` persistence threading, broken-method integrity, and readiness truth.
  **Must NOT do**: Do not rely on existing `gapfiller` contract tests alone. Do not treat pseudo docs as higher authority than the real legacy source. Do not write tests that merely restate the new architecture without proving legacy-equivalent behavior.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: cross-package parity baseline with audit reconciliation
  - Skills: [`qa-agent`, `debug-agent`] — need executable regression design plus failure-path classification
  - Omitted: [`frontend-agent`] — no UI implementation work required

  **Parallelization**: Can Parallel: NO | Wave 1 | Blocks: [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20] | Blocked By: []

  **References**:
  - Plan to supersede: `.sisyphus/plans/gapfiller.md:104-399`
  - Primary audit: `.sisyphus/audits/v5-parity-audit.md:935-957`, `.sisyphus/audits/v5-parity-audit.md:1147-1188`, `.sisyphus/audits/v5-parity-audit.md:1191-1301`
  - Corrections audit: `.sisyphus/audits/v5-parity-audit-corrections.md:246-380`
  - Injection architecture authority: `.sisyphus/audits/injection-architecture-v2.md:27-93`, `.sisyphus/audits/injection-architecture-v2.md:470-510`
  - Real legacy source: `/Users/Mohammed/projects/tools/wa copy/src/api/Client.ts`, `/Users/Mohammed/projects/tools/wa copy/src/controllers/browser.ts`, `/Users/Mohammed/projects/tools/wa copy/src/controllers/initializer.ts`, `/Users/Mohammed/projects/tools/wa copy/src/controllers/launch_checks.ts`, `/Users/Mohammed/projects/tools/wa copy/src/controllers/auth.ts`

  **Acceptance Criteria**:
  - [ ] Every P0/P1 gap has a corresponding failing or red-state automated check before implementation begins
  - [ ] The parity matrix explicitly labels each item as restore / downgrade / deprecate
  - [ ] The release-blocker matrix is traceable from audit finding → code file → proof artifact
  - [ ] Existing `gapfiller` tests are reclassified as insufficient where they do not prove behavioral parity

  **QA Scenarios**:
  ```
  Scenario: Release-blocker regression suite starts red on current v5
    Tool: Bash
    Steps: Run pnpm --filter @open-wa/core test and pnpm --filter @open-wa/client test with the new parity specs enabled
    Expected: At least the event bridge, frame-nav reinject, loaded-equivalence, and userDataDir checks fail on current code
    Evidence: .sisyphus/evidence/task-1-release-blocker-red.txt

  Scenario: Parity matrix documents accepted non-blockers separately
    Tool: Bash
    Steps: Read the generated parity manifest/test snapshot and verify obsolete/downgraded items are excluded from release-blocker assertions
    Expected: JSON session restore, popup QR, and other downgraded items are classified correctly and do not block the suite
    Evidence: .sisyphus/evidence/task-1-parity-matrix.txt
  ```

  **Commit**: YES | Message: `test(core): codify release-blocker parity matrix` | Files: `packages/core/**`, `packages/client/**`, `packages/wa-automate/**`, `.sisyphus/**`

- [x] 2. Expand the driver interface for lifecycle-safe runtime control

  **What to do**: Extend `@open-wa/driver-interface` so the active runtime can model page lifecycle, init scripts, frame/navigation events, and request interception through the abstraction instead of raw Puppeteer leakage. Add `DisposableHandle`, `IPage.on/off`, `addInitScript`, frame abstractions, and request interception/request object interfaces required by the audited parity blockers.
  **Must NOT do**: Do not redesign the entire driver layer. Do not add methods not directly justified by parity blockers. Do not use anonymous wrapper functions in adapter implementations without retaining the wrapper reference.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: foundational cross-driver API change with downstream impact
  - Skills: [`debug-agent`] — needed to preserve compatibility while expanding contract surface
  - Omitted: [`frontend-agent`] — no UI work required

  **Parallelization**: Can Parallel: NO | Wave 1 | Blocks: [3,4,5,6,7,8,9,17,18,19,20] | Blocked By: [1]

  **References**:
  - Current `IPage`: `packages/driver-interface/src/driver.ts:26-55`
  - Corrections driver-gap table: `.sisyphus/audits/v5-parity-audit-corrections.md:309-331`
  - v2 driver contract: `.sisyphus/audits/injection-architecture-v2.md:186-213`
  - External docs: https://pptr.dev/api/puppeteer.page.exposefunction, https://pptr.dev/api/puppeteer.page.evaluateonnewdocument, https://pptr.dev/api/puppeteer.pageevents, https://pptr.dev/guides/network-interception

  **Acceptance Criteria**:
  - [ ] `IPage` exposes lifecycle-safe listener APIs with removable/disposable semantics
  - [ ] `IPage` exposes init-script registration suitable for generation-based injection
  - [ ] Request interception abstractions cover the legacy parity needs (`blockCrashLogs`, proxy/auth, request abort/continue/respond)
  - [ ] The interface changes are minimal and traceable to audited blockers only

  **QA Scenarios**:
  ```
  Scenario: Driver contract compiles across active packages
    Tool: Bash
    Steps: Run pnpm --filter @open-wa/driver-interface build and pnpm --filter @open-wa/core build after interface expansion
    Expected: Type-check/build succeeds with no missing interface members in active consumers
    Evidence: .sisyphus/evidence/task-2-driver-interface-build.txt

  Scenario: Listener cleanup contract is enforceable
    Tool: Bash
    Steps: Run targeted unit tests for DisposableHandle/on-off behavior using a mocked page adapter
    Expected: Registered handlers can be removed deterministically and no silent wrapper-leak path remains
    Evidence: .sisyphus/evidence/task-2-disposable-listeners.txt
  ```

  **Commit**: YES | Message: `feat(driver-interface): add lifecycle-safe page contract` | Files: `packages/driver-interface/**`, `packages/core/**`, `packages/client/**`

- [x] 3. Implement the expanded lifecycle contract in the Puppeteer driver

  **What to do**: Implement the newly required lifecycle APIs in `@open-wa/driver-puppeteer`, including page/frame events, init-script registration/removal, request interception support, frame abstractions, and any necessary bridge-safe wrappers. Add lower-priority no-op/throw placeholders in Playwright only where required to keep workspace builds coherent.
  **Must NOT do**: Do not block the plan on full Playwright parity. Do not leave untested partial implementations in Puppeteer for required P0/P1 APIs.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: runtime-critical adapter work against Puppeteer semantics
  - Skills: [`debug-agent`] — needed for page/frame/request event correctness and listener disposal
  - Omitted: [`frontend-agent`] — no UI work required

  **Parallelization**: Can Parallel: NO | Wave 1 | Blocks: [4,5,6,7,8,9,17,18,19,20] | Blocked By: [1,2]

  **References**:
  - Puppeteer driver: `packages/driver-puppeteer/src/PuppeteerPage.ts`, `packages/driver-puppeteer/src/PuppeteerDriver.ts:39-49`
  - Playwright driver: `packages/driver-playwright/src/PlaywrightPage.ts`
  - External docs: https://pptr.dev/api/puppeteer.pageevents, https://pptr.dev/guides/network-interception
  - v2 listener ownership note: `.sisyphus/audits/injection-architecture-v2.md:208-247`

  **Acceptance Criteria**:
  - [ ] Puppeteer page adapter supports the parity-critical `IPage` lifecycle APIs introduced in task 2
  - [ ] Frame/main-frame filtering and request interception semantics are test-covered
  - [ ] Driver behavior around `exposeFunction` vs init scripts matches the documented survival semantics used by the plan
  - [ ] Playwright adapter does not silently pretend to support missing parity-critical primitives

  **QA Scenarios**:
  ```
  Scenario: Puppeteer lifecycle adapter passes targeted unit tests
    Tool: Bash
    Steps: Run package-level tests or adapter-specific tests for frame events, init scripts, and request interception
    Expected: Main-frame navigation, init-script registration, and request interception behavior all pass
    Evidence: .sisyphus/evidence/task-3-puppeteer-lifecycle.txt

  Scenario: Unsupported driver methods fail loudly where not implemented
    Tool: Bash
    Steps: Run targeted tests against the Playwright adapter for any parity-critical unimplemented methods
    Expected: Tests confirm explicit throw/no-support behavior instead of silent success
    Evidence: .sisyphus/evidence/task-3-playwright-contract.txt
  ```

  **Commit**: YES | Message: `feat(driver-puppeteer): implement lifecycle parity primitives` | Files: `packages/driver-puppeteer/**`, `packages/driver-playwright/**`

- [x] 4. Thread launch-path and browser diagnostics config through active core boot

  **What to do**: Fix the active boot path so `userDataDir` is actually passed to the driver and wire parity-critical browser diagnostics/interception settings (`logConsole`, `logConsoleErrors`, `blockCrashLogs`, related request interception toggles) through the active core transport path.
  **Must NOT do**: Do not reintroduce MD-obsolete JSON session restore as a blocker. Do not wire broad config surface area unless justified by the release-blocker matrix.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: config-to-runtime plumbing across core/wa-automate boundaries
  - Skills: [`debug-agent`] — needed for launch-path verification and request interception behavior
  - Omitted: [`frontend-agent`] — no UI work required

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: [5,6,7,8,9,17,18,19,20] | Blocked By: [1,2,3]

  **References**:
  - Current launch wiring: `packages/core/src/transport/Transport.ts:254-339`
  - Current driver launch support: `packages/driver-puppeteer/src/PuppeteerDriver.ts:39-49`
  - Corrections `userDataDir` regression: `.sisyphus/audits/v5-parity-audit-corrections.md:302-308`
  - Config schema: `packages/config/src/schema/config.ts:221-304`
  - Legacy browser config behavior: `/Users/Mohammed/projects/tools/wa copy/src/controllers/browser.ts`, `/Users/Mohammed/projects/tools/wa copy/src/controllers/initializer.ts:62-68,378-390`

  **Acceptance Criteria**:
  - [ ] `userDataDir` is forwarded end-to-end from active config to Puppeteer launch
  - [ ] Browser console/pageerror forwarding honors current config flags
  - [ ] Crash-log/request interception flags are either wired or explicitly downgraded with tests
  - [ ] The launch-path regression harness proves profile reuse across restarts

  **QA Scenarios**:
  ```
  Scenario: userDataDir survives process restart without forced QR
    Tool: Bash
    Steps: Run a restart-focused integration test with a fixed userDataDir and assert the second boot resumes the session path instead of re-entering fresh-auth flow
    Expected: The resumed boot does not require a clean-slate path and the profile directory is actively used
    Evidence: .sisyphus/evidence/task-4-userdatadir.txt

  Scenario: Browser diagnostics respect config flags
    Tool: Bash
    Steps: Run targeted tests or mocked transport tests that emit console/pageerror and request-interception events under enabled/disabled config states
    Expected: Forwarding/interception occurs only when configured and no silent dead config remains
    Evidence: .sisyphus/evidence/task-4-browser-diagnostics.txt
  ```

  **Commit**: YES | Message: `fix(core): wire launch-path parity settings` | Files: `packages/core/**`, `packages/config/**`, `packages/wa-automate/**`

- [x] 5. Introduce a generation-based InjectionController shell and migrate boot bindings ahead of navigation

  **What to do**: Implement the v2 `InjectionController` foundation with generation refs, listener registries, phase buckets, and pre-navigation registration of persistent bindings/init scripts. Migrate the scattered Transport boot-time injection calls behind the controller without yet changing all bridge logic.
  **Must NOT do**: Do not implement the old v1 free-form PatchPayload event-DAG. Do not mark runtime healthy based on a single boolean. Do not intermingle page-level infrastructure with runtime-level readiness state.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: architecture-critical refactor with tight sequencing constraints
  - Skills: [`debug-agent`] — needed for generation safety and lifecycle migration
  - Omitted: [`frontend-agent`] — no UI work required

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: [6,7,8,9,17,18,19,20] | Blocked By: [1,2,3,4]

  **References**:
  - Current transport boot order: `packages/core/src/transport/Transport.ts:284-339`, `packages/core/src/transport/Transport.ts:341-387`
  - v1 controller proposal: `.sisyphus/audits/injection-architecture.md:95-295`
  - v2 controller authority: `.sisyphus/audits/injection-architecture-v2.md:27-183`, `.sisyphus/audits/injection-architecture-v2.md:351-402`, `.sisyphus/audits/injection-architecture-v2.md:509-560`
  - External docs for survival semantics: https://pptr.dev/api/puppeteer.page.exposefunction, https://pptr.dev/api/puppeteer.page.evaluateonnewdocument

  **Acceptance Criteria**:
  - [ ] Bindings/init scripts are registered before the navigation window they must survive
  - [ ] Document/runtime generations are explicit and stale completions can be discarded
  - [ ] Transport no longer owns scattered binding/order logic directly
  - [ ] No free-form DAG/event-trigger patch engine is introduced at this stage

  **QA Scenarios**:
  ```
  Scenario: Boot-time bindings register before initial page script window
    Tool: Bash
    Steps: Run controller/transport tests that assert binding and init-script registration occur before WA navigation and before runtime-sensitive observers execute
    Expected: The test proves the first document can see the required bindings/init scripts
    Evidence: .sisyphus/evidence/task-5-pre-nav-bindings.txt

  Scenario: Stale generation completions are ignored
    Tool: Bash
    Steps: Run a reinjection race test that triggers two sequential generation changes and resolves the earlier async path late
    Expected: Late completion from the older generation does not mutate current state or emit ready-like events
    Evidence: .sisyphus/evidence/task-5-generation-fencing.txt
  ```

  **Commit**: YES | Message: `feat(core): add generation-based injection controller shell` | Files: `packages/core/**`, `packages/driver-interface/**`

- [x] 6. Implement the real browser-to-node runtime event bridge in core

  **What to do**: Build the active v5 bridge that exposes browser callbacks into Node and maps them into the v5 event surface (`message.received`, `ack.changed`, `session.logout`, etc.). Follow the real legacy listener-registration behavior rather than the simplified proxy-only reference.
  **Must NOT do**: Do not leave the bridge in `packages/legacy/` as a reference only. Do not rely on EventManager’s transform layer without a real browser-side producer. Do not bind listeners before runtime/store/session preconditions are met.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: P0 behavioral restoration spanning browser/runtime/core/client layers
  - Skills: [`debug-agent`, `qa-agent`] — need parity-safe binding plus real delivery verification
  - Omitted: [`frontend-agent`] — no UI work required

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: [7,10,17,18,19,20] | Blocked By: [1,2,3,4,5]

  **References**:
  - Current event manager assumptions: `packages/client/src/events/EventManager.ts:42-190`
  - Current missing bridge in active transport: `packages/core/src/transport/Transport.ts:302-319`, `packages/core/src/transport/initPatchScripts.ts:54-56`
  - Legacy bridge references: `packages/legacy/src/events/WapiBridge.ts:20-43`
  - Real legacy listener registration path: `/Users/Mohammed/projects/tools/wa copy/src/api/Client.ts:695-738`, `/Users/Mohammed/projects/tools/wa copy/src/api/Client.ts:432-488`
  - External patterns: whatsapp-web.js reinjection/bridge findings from PR #201653 and `exposeFunctionIfAbsent`-style utilities
  - v2 bridge phase: `.sisyphus/audits/injection-architecture-v2.md:172-183`, `.sisyphus/audits/injection-architecture-v2.md:321-353`

  **Acceptance Criteria**:
  - [ ] `client.onMessage`, `client.onAck`, `client.onAnyMessage`, and logout/state listeners receive real runtime events
  - [ ] Browser callback names and bridge mapping are reconciled intentionally between legacy naming and v5 event map naming
  - [ ] Bridge setup is generation-scoped and can be safely re-run
  - [ ] Event delivery is proven from browser callback → core event → client listener

  **QA Scenarios**:
  ```
  Scenario: Message bridge delivers a real event through the full stack
    Tool: Bash
    Steps: Run an integration test that simulates or captures a browser-side message event and asserts client.onMessage receives exactly one transformed payload
    Expected: message callback fires once and maps into the expected v5 event payload
    Evidence: .sisyphus/evidence/task-6-message-bridge.txt

  Scenario: Bridge does not duplicate listeners on rebind
    Tool: Bash
    Steps: Trigger bridge binding twice for the same runtime generation and emit one browser-side event
    Expected: Exactly one client callback fires and no duplicate HyperEmitter events are observed
    Evidence: .sisyphus/evidence/task-6-bridge-idempotency.txt
  ```

  **Commit**: YES | Message: `feat(core): implement runtime event bridge` | Files: `packages/core/**`, `packages/client/**`, `packages/driver-interface/**`

- [x] 7. Add page-side bridge singleton ownership and automatic listener disposal

  **What to do**: Implement the page-side singleton registry/disposal rules from injection v2 so bridge/listener binding is idempotent, runtime-scoped, and safe across reinjection. This includes storing active runtime listeners in the page context and disposing them on runtime rollover.
  **Must NOT do**: Do not keep add-only browser-side listener registration. Do not rely on garbage collection or page reload to clean up stale listener state.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: page-runtime lifecycle correctness and duplicate event prevention
  - Skills: [`debug-agent`] — needed for runtime-scoped ownership/disposal logic
  - Omitted: [`frontend-agent`] — no UI work required

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: [10,11,17,18,19,20] | Blocked By: [1,2,3,4,5,6]

  **References**:
  - v2 singleton bridge rules: `.sisyphus/audits/injection-architecture-v2.md:321-353`
  - v2 listener ownership: `.sisyphus/audits/injection-architecture-v2.md:216-247`
  - External bridge patterns: whatsapp-web.js listener storage/cleanup (`window._wwjsListeners` pattern) and `exposeFunctionIfAbsent`
  - Current WAPI event helpers: `packages/core/src/transport/assets/wapi.js`

  **Acceptance Criteria**:
  - [ ] Rebinding the same runtime generation does not create duplicate page-side listeners
  - [ ] Runtime replacement disposes old listeners before new ones are attached
  - [ ] The page-side singleton state is not predictably named in a way that conflicts with v2 stealth guidance if stealth storage is used
  - [ ] Listener ownership is explicit and test-covered

  **QA Scenarios**:
  ```
  Scenario: Runtime replacement disposes stale page-side listeners
    Tool: Bash
    Steps: Simulate runtime fingerprint change, trigger rebind, then emit one event from the new runtime
    Expected: Only the new listener path fires and the old runtime does not produce duplicate callbacks
    Evidence: .sisyphus/evidence/task-7-runtime-disposal.txt

  Scenario: Soft rebind on same runtime is a no-op
    Tool: Bash
    Steps: Call bridge bind twice without changing runtime fingerprint and observe page-side listener count
    Expected: Listener count remains stable and no duplicate bridge state is created
    Evidence: .sisyphus/evidence/task-7-soft-rebind.txt
  ```

  **Commit**: YES | Message: `feat(core): make bridge rebinding runtime-safe` | Files: `packages/core/**`

- [x] 8. Restore main-frame navigation reinjection and runtime replacement recovery

  **What to do**: Add the main-frame-only navigation handler and reinjection queue that detect runtime loss, drop stale generations, and re-run the required injection phases after page reload or runtime replacement. Use `waitForFunction`-style probes where necessary instead of brittle `evaluate()` polling.
  **Must NOT do**: Do not trigger on every iframe navigation. Do not allow overlapping reinjection runs. Do not assume `framenavigated` covers all runtime replacement cases.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: hostile lifecycle recovery logic with race sensitivity
  - Skills: [`debug-agent`] — needed for navigation/race hardening
  - Omitted: [`frontend-agent`] — no UI work required

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: [9,17,20] | Blocked By: [1,2,3,4,5]

  **References**:
  - Legacy frame-navigation reinject: `/Users/Mohammed/projects/tools/wa copy/src/controllers/browser.ts:64-84`
  - Current missing path: `packages/core/src/transport/Transport.ts` (no page event listeners)
  - v2 generation fencing and navigation handling: `.sisyphus/audits/injection-architecture-v2.md:351-402`
  - External patterns: Puppeteer `PageEvents`, `waitForFunction`, whatsapp-web.js main-frame-only reinjection patterns

  **Acceptance Criteria**:
  - [ ] Main-frame navigation causes runtime health reassessment and reinjection when required
  - [ ] Iframe-only navigations do not trigger duplicate reinjection work
  - [ ] Concurrent reinjection triggers serialize or abort safely
  - [ ] Runtime replacement without full navigation is detectable and recoverable

  **QA Scenarios**:
  ```
  Scenario: Main-frame navigation triggers one reinjection path
    Tool: Bash
    Steps: Simulate main-frame navigation after runtime loss and observe controller events/state
    Expected: Exactly one reinjection sequence runs and bridge/runtime state recovers for the active generation
    Evidence: .sisyphus/evidence/task-8-main-frame-reinject.txt

  Scenario: Iframe navigation does not create duplicate reinjection work
    Tool: Bash
    Steps: Simulate iframe navigation with an otherwise healthy runtime
    Expected: No reinjection occurs and readiness state remains stable
    Evidence: .sisyphus/evidence/task-8-iframe-ignore.txt
  ```

  **Commit**: YES | Message: `feat(core): restore navigation-safe reinjection` | Files: `packages/core/**`, `packages/driver-puppeteer/**`

- [x] 9. Restore post-auth reinjection and ripe-session gating

  **What to do**: After authentication settles, re-run the required runtime activation path and gate finalization on a ripe/session-loaded condition appropriate for the authenticated runtime. This must cover the “auth completes then page/runtime changes” path explicitly.
  **Must NOT do**: Do not rely on pre-auth injection alone. Do not treat QR generation or auth completion as proof of final runtime usability.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: auth-to-runtime boundary restoration with correctness impact
  - Skills: [`debug-agent`] — needed for auth/ripeness sequencing
  - Omitted: [`frontend-agent`] — no UI work required

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: [10,14,15,16,17,20] | Blocked By: [1,2,3,4,5,8]

  **References**:
  - Current auth path: `packages/core/src/createClient.ts:411-451`
  - Legacy post-auth reinjection + ripe-session: `/Users/Mohammed/projects/tools/wa copy/src/controllers/initializer.ts:304-315`, `/Users/Mohammed/projects/tools/wa copy/src/controllers/auth.ts:71-78`
  - Corrections priority: `.sisyphus/audits/v5-parity-audit-corrections.md:127-140`, `.sisyphus/audits/v5-parity-audit-corrections.md:204-205`
  - v2 session phase: `.sisyphus/audits/injection-architecture-v2.md:147-158`

  **Acceptance Criteria**:
  - [ ] Auth completion triggers the required post-auth runtime reconciliation before finalization
  - [ ] A ripe/session-loaded gate exists and is test-covered
  - [ ] Fresh-auth and resumed-session paths are distinguished where their runtime behavior differs
  - [ ] Post-auth page/runtime churn does not produce false READY

  **QA Scenarios**:
  ```
  Scenario: Fresh auth path performs post-auth reinjection before finalization
    Tool: Bash
    Steps: Run an integration test for a fresh-auth flow and inspect event/state ordering after auth success
    Expected: Post-auth reinjection/ripeness steps occur before any finalized ready state
    Evidence: .sisyphus/evidence/task-9-post-auth-reinject.txt

  Scenario: Resumed session path does not redundantly regress readiness
    Tool: Bash
    Steps: Run a resumed-session integration test using persisted userDataDir and observe auth/reinjection behavior
    Expected: The runtime reaches finalization truthfully without redundant false-failure paths
    Evidence: .sisyphus/evidence/task-9-resume-ripeness.txt
  ```

  **Commit**: YES | Message: `feat(core): add post-auth reinjection and ripeness gate` | Files: `packages/core/**`

- [x] 10. Implement `Client.loaded()`-equivalent finalization in spirit, not just in state bookkeeping

  **What to do**: Add the missing client-level finalization semantics after core runtime truth is established: sync/session-loaded wait, listener autobinding, phone version capture, and any retained final client-side enablement hooks. This should be a distinct phase before `client.ready` is emitted.
  **Must NOT do**: Do not merely add a method name or extra session flags. Do not reintroduce behaviors that the corrections audit already downgraded unless they remain release blockers.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: client/session semantics restoration with readiness implications
  - Skills: [`debug-agent`, `qa-agent`] — need semantic parity and ordering verification
  - Omitted: [`frontend-agent`] — no UI work required

  **Parallelization**: Can Parallel: NO | Wave 3 | Blocks: [11,17,18,19,20] | Blocked By: [1,6,7,9]

  **References**:
  - Legacy loaded/finalization: `/Users/Mohammed/projects/tools/wa copy/src/api/Client.ts:388-430`
  - Current v5 client facade: `packages/client/src/Client.ts:151-186`, `packages/client/src/Client.ts` (no loaded phase)
  - Audit gap: `.sisyphus/audits/v5-parity-audit.md:945`, `.sisyphus/audits/v5-parity-audit-corrections.md:235-242`

  **Acceptance Criteria**:
  - [ ] Finalization is a real behavioral phase, not bookkeeping only
  - [ ] Session-loaded/client-finalized state is proven before `client.ready`
  - [ ] Listener autobinding is restored intentionally via the new bridge path when event mode is active
  - [ ] Finalization side effects are limited to accepted parity behaviors

  **QA Scenarios**:
  ```
  Scenario: Finalization occurs before client.ready
    Tool: Bash
    Steps: Run a successful bootstrap integration test with event-order assertions enabled
    Expected: loaded-equivalent/finalization markers occur before client.ready and only once
    Evidence: .sisyphus/evidence/task-10-finalization-order.txt

  Scenario: Finalization is not bookkeeping-only
    Tool: Bash
    Steps: Run tests that assert listener autobind and phone-version capture only occur after the finalization phase executes
    Expected: The client facade gains actual operational behavior, not just state transitions
    Evidence: .sisyphus/evidence/task-10-finalization-semantics.txt
  ```

  **Commit**: YES | Message: `feat(client): add loaded-equivalent finalization` | Files: `packages/client/**`, `packages/core/**`

- [x] 11. Restore logout cleanup, queue drain, and terminal session handling semantics

  **What to do**: Reintroduce the behavior behind `deleteSessionDataOnLogout` and `killClientOnLogout`, including queue drain, session invalidation, optional session deletion, and optional process/client termination once logout is confirmed.
  **Must NOT do**: Do not make logout cleanup depend on manual consumer action. Do not trigger deletion/kill before queues are drained and logout is confirmed.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: destructive cleanup path with session correctness implications
  - Skills: [`debug-agent`] — needed for queue drain / destructive lifecycle ordering
  - Omitted: [`frontend-agent`] — no UI work required

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: [17,20] | Blocked By: [1,7,10]

  **References**:
  - Legacy logout cleanup: `/Users/Mohammed/projects/tools/wa copy/src/api/Client.ts:399-430`
  - Legacy config defaults: `/Users/Mohammed/projects/tools/wa copy/src/controllers/initializer.ts:62-68,417`
  - Current schema presence: `packages/config/src/schema/config.ts:260-304`
  - Corrections downgrade/keep rationale: `.sisyphus/audits/v5-parity-audit-corrections.md:31-35,203-209`

  **Acceptance Criteria**:
  - [ ] Logout cleanup waits for queue drain before destructive actions
  - [ ] Session invalidation/deletion occurs only when configured
  - [ ] Client/process termination occurs only when configured and after cleanup ordering is satisfied
  - [ ] Logout path does not leave stale readiness state behind

  **QA Scenarios**:
  ```
  Scenario: Configured logout cleanup drains queues before deletion
    Tool: Bash
    Steps: Run a logout integration test with queued work and deletion enabled
    Expected: Queue drain completes before session invalidation/deletion and the client reaches a terminal logged-out state cleanly
    Evidence: .sisyphus/evidence/task-11-logout-cleanup.txt

  Scenario: killClientOnLogout remains gated and explicit
    Tool: Bash
    Steps: Run a logout test with killClientOnLogout disabled, then enabled, and compare outcomes
    Expected: Client termination only happens in the enabled case and never before cleanup steps finish
    Evidence: .sisyphus/evidence/task-11-kill-on-logout.txt
  ```

  **Commit**: YES | Message: `feat(client): restore logout cleanup semantics` | Files: `packages/client/**`, `packages/core/**`, `packages/config/**`

- [x] 12. Reinstate a broken-method integrity gate or equivalent runtime method repair gate

  **What to do**: Port the legacy integrity-check intent or replace it with an equivalent required-capability gate that validates WAPI/Store method health after runtime activation and overlays. It must attempt repair or classify failure explicitly instead of allowing `READY` to proceed blindly.
  **Must NOT do**: Do not stop at `hasRuntime`/`hasStoreMsg` booleans if required runtime methods can still be broken. Do not silently downgrade required method failures.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: runtime drift repair logic with failure classification
  - Skills: [`qa-agent`] — need concrete method-level acceptance coverage
  - Omitted: [`frontend-agent`] — no UI work required

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: [17,18,20] | Blocked By: [1,6]

  **References**:
  - Legacy integrity gate: `/Users/Mohammed/projects/tools/wa copy/src/controllers/launch_checks.ts:19-63`
  - Legacy upstream integration: `/Users/Mohammed/projects/tools/wa copy/src/controllers/initializer.ts:391-407`
  - Current capability probe: `packages/core/src/transport/Transport.ts:389-427`
  - Audit blocker: `.sisyphus/audits/v5-parity-audit.md:1261-1273`

  **Acceptance Criteria**:
  - [ ] Required runtime methods are validated after activation and overlays
  - [ ] At least one repair or reinject path exists for qualifying broken-method states
  - [ ] Non-repairable required failures block readiness explicitly
  - [ ] The gate is tied to current-generation runtime state only

  **QA Scenarios**:
  ```
  Scenario: Broken method triggers repair path
    Tool: Bash
    Steps: Run a targeted test that simulates a missing required Store/WAPI method after injection
    Expected: The system attempts repair/reinject and only proceeds if verification passes
    Evidence: .sisyphus/evidence/task-12-integrity-repair.txt

  Scenario: Non-repairable method failure blocks readiness
    Tool: Bash
    Steps: Run a bootstrap failure-path test where a required method cannot be restored
    Expected: READY is not emitted and failure is classified as terminal for the active generation
    Evidence: .sisyphus/evidence/task-12-integrity-terminal.txt
  ```

  **Commit**: YES | Message: `feat(core): add runtime integrity gate` | Files: `packages/core/**`

- [x] 13. Resolve helper asset truth and replace the internal event handler stub honestly

  **What to do**: Determine which helper assets remain required by the shipped `wapi.js` and either restore them in the active asset strategy or remove dead code paths that still reference them. At the same time, replace the `injectInternalEventHandler()` stub with a real implementation if the contract is still required, or explicitly deprecate/remove it if superseded by the new bridge/controller.
  **Must NOT do**: Do not carry ambiguous helper/stub behavior into release. Do not leave dead config or comments to imply parity where none exists.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: runtime asset truth and contract cleanup across browser/core layers
  - Skills: [`debug-agent`] — need hard verification of actual `wapi.js` dependencies and stub consequences
  - Omitted: [`frontend-agent`] — no UI work required

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: [14,18,19,20] | Blocked By: [1]

  **References**:
  - Current loader: `packages/core/src/transport/ScriptLoader.ts:27-33`
  - Current stub: `packages/core/src/transport/initPatchScripts.ts:49-56`
  - Current `wapi.js` helper usage: `packages/core/src/transport/assets/wapi.js:1573`, `packages/core/src/transport/assets/wapi.js:1986`, `packages/core/src/transport/assets/wapi.js:2031`
  - Legacy helper loading notes: `/Users/Mohammed/projects/tools/wa copy/src/controllers/browser.ts:354-366`
  - Audit uncertainty: `.sisyphus/audits/v5-parity-audit-corrections.md:222-230`

  **Acceptance Criteria**:
  - [ ] The helper-asset requirement set for shipped `wapi.js` is explicitly verified and tested
  - [ ] No required helper remains absent from the active asset strategy
  - [ ] `injectInternalEventHandler()` is either real and tested or removed/deprecated with no false parity claim
  - [ ] The parity matrix is updated to reflect the verified truth

  **QA Scenarios**:
  ```
  Scenario: Helper-asset dependency audit is executable
    Tool: Bash
    Steps: Run asset/runtime tests that exercise the `wapi.js` paths depending on helper globals and confirm whether each helper is required or obsolete
    Expected: The result is binary for each helper and no ambiguous “maybe required” state remains
    Evidence: .sisyphus/evidence/task-13-helper-assets.txt

  Scenario: Internal event handler is no longer a fake success marker
    Tool: Bash
    Steps: Run targeted tests covering the internal handler path after implementation or deprecation
    Expected: Either real behavior is observed or the path is removed from readiness-critical flow and documented as deprecated
    Evidence: .sisyphus/evidence/task-13-internal-handler.txt
  ```

  **Commit**: YES | Message: `fix(core): make asset and internal-handler contracts truthful` | Files: `packages/core/**`

- [x] 14. Align live patch semantics with accepted parity expectations

  **What to do**: Reconcile v5 patch behavior with the corrected parity target: cache semantics, GitHub source selection semantics, init patch criticality/order, and readiness impact of required patch failures. Convert active patching toward the v2 patch-contract model where needed.
  **Must NOT do**: Do not keep semantic drift hidden behind a “patch lifecycle exists” checkbox. Do not make required patch failures non-observable.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: lifecycle semantics and readiness coupling
  - Skills: [`qa-agent`] — need explicit behavioral parity assertions and blocking/degraded classifications
  - Omitted: [`frontend-agent`] — no UI work required

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: [15,17,18,20] | Blocked By: [1,9,13]

  **References**:
  - Legacy patch manager: `/Users/Mohammed/projects/tools/wa copy/src/controllers/patch_manager.ts`
  - Current patch path: `packages/core/src/transport/Transport.ts:429-717`, `packages/core/src/transport/Transport.ts:1457-1530`
  - Audit semantic differences: `.sisyphus/audits/v5-parity-audit.md:947-951`, `.sisyphus/audits/v5-parity-audit.md:1161-1165`
  - v2 patch contract: `.sisyphus/audits/injection-architecture-v2.md:250-299`, `.sisyphus/audits/injection-architecture-v2.md:430-449`

  **Acceptance Criteria**:
  - [ ] Patch preload/apply semantics are intentionally aligned or explicitly diverged with tests
  - [ ] Required patch failures affect readiness according to explicit policy
  - [ ] Init patch ordering/criticality is no longer ambiguous
  - [ ] Cache/source-selection behavior is documented and tested

  **QA Scenarios**:
  ```
  Scenario: Required patch failure prevents false ready
    Tool: Bash
    Steps: Run a patch-failure integration test with a required patch forced to fail
    Expected: The system classifies the failure correctly and does not reach READY
    Evidence: .sisyphus/evidence/task-14-required-patch-failure.txt

  Scenario: Patch cache/source semantics are deterministic
    Tool: Bash
    Steps: Run targeted tests for cache enabled/disabled and GitHub-source configuration cases
    Expected: The observed source/cache behavior matches the documented accepted semantics
    Evidence: .sisyphus/evidence/task-14-patch-semantics.txt
  ```

  **Commit**: YES | Message: `fix(core): align patch lifecycle semantics` | Files: `packages/core/**`, `packages/config/**`

- [x] 15. Align license lifecycle truthfulness with readiness policy

  **What to do**: Separate “license metadata available” from “licensed capability actually unlocked” and ensure readiness semantics reflect the accepted policy. If metadata fallback remains, classify it explicitly and prevent it from masquerading as full parity with the legacy server-payload path.
  **Must NOT do**: Do not let license fallback produce the same ready semantics as confirmed unlock if parity requires stronger proof.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: mostly readiness-truth and failure-classification work
  - Skills: [`debug-agent`] — needed for capability assertions and classification wiring
  - Omitted: [`frontend-agent`] — no UI work required

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: [17,18,20] | Blocked By: [1,9,14]

  **References**:
  - Current license path: `packages/core/src/transport/Transport.ts:720-1055`
  - Audit truthfulness gap: `.sisyphus/audits/v5-parity-audit.md:1274-1282`, `.sisyphus/audits/v5-parity-audit.md:1166-1170`
  - v2 failure policy: `.sisyphus/audits/injection-architecture-v2.md:435-449`

  **Acceptance Criteria**:
  - [ ] License lifecycle distinguishes valid/missing/invalid/expired/metadata-only states explicitly
  - [ ] Readiness policy for each license state is documented and test-enforced
  - [ ] Metadata fallback can no longer masquerade as confirmed license unlock if parity requires more
  - [ ] License lifecycle remains distinct from generic patch lifecycle

  **QA Scenarios**:
  ```
  Scenario: Metadata-only fallback is classified distinctly
    Tool: Bash
    Steps: Run a license-server failure scenario and inspect resulting status/readiness classification
    Expected: The runtime enters a distinct classified state instead of claiming full license success
    Evidence: .sisyphus/evidence/task-15-license-fallback.txt

  Scenario: Invalid or expired license blocks as configured
    Tool: Bash
    Steps: Run targeted license failure tests for invalid and expired responses
    Expected: Readiness follows the documented blocking policy and no false success event is emitted
    Evidence: .sisyphus/evidence/task-15-license-blocking.txt
  ```

  **Commit**: YES | Message: `fix(core): make license readiness truthful` | Files: `packages/core/**`, `packages/config/**`, `packages/wa-automate/**`

- [x] 16. Restore remaining auth/error-classification parity that still matters operationally

  **What to do**: Implement the still-relevant non-blocking but important auth/error behaviors: invalid-session/NUKE recovery, phone-out-of-reach classification, link-code auth path, and QR max enforcement. These are lower than the release blockers above but must either work or be explicitly deprecated with proof.
  **Must NOT do**: Do not let these items reopen obsolete JSON-session design. Do not leave them in ambiguous “config exists but behavior does not” state.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: auth classification and recovery edge cases
  - Skills: [`qa-agent`] — need failure-mode verification
  - Omitted: [`frontend-agent`] — no UI work required

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: [17,20] | Blocked By: [1,9]

  **References**:
  - Legacy auth helpers: `/Users/Mohammed/projects/tools/wa copy/src/controllers/auth.ts:19-107,200-295`
  - Audit ranking and downgrades: `.sisyphus/audits/v5-parity-audit.md:1235-1247`, `.sisyphus/audits/v5-parity-audit-corrections.md:136-146,203-209,372-379`
  - Current auth path: `packages/core/src/createClient.ts:436-451`, `packages/core/src/transport/Transport.ts:1057-1269`

  **Acceptance Criteria**:
  - [ ] Each retained auth/error path has an explicit classification and automated scenario
  - [ ] Deprecated auth/config paths are documented as deprecated, not silently ignored
  - [ ] Invalid-session and phone-offline style failures no longer collapse into undifferentiated timeout paths
  - [ ] Link-code auth path is either implemented or explicitly removed from active promises/config surface

  **QA Scenarios**:
  ```
  Scenario: Invalid session is classified separately from ordinary auth timeout
    Tool: Bash
    Steps: Run a stale-session bootstrap scenario and compare its outcome against a generic timeout scenario
    Expected: The two outcomes are distinct and the stale-session path triggers the documented recovery or terminal branch
    Evidence: .sisyphus/evidence/task-16-invalid-session.txt

  Scenario: Link-code / QR / phone-out-of-reach paths are explicitly classified
    Tool: Bash
    Steps: Run targeted auth-flow tests covering link-code enabled, QR enabled, and phone-offline detection scenarios
    Expected: Each path emits the expected classification without collapsing into generic auth failure
    Evidence: .sisyphus/evidence/task-16-auth-classification.txt
  ```

  **Commit**: YES | Message: `fix(core): restore auth recovery classifications` | Files: `packages/core/**`, `packages/config/**`, `packages/wa-automate/**`

- [x] 17. Make readiness and host/session exposure reflect finalized lower-level truth

  **What to do**: Recalibrate `READY`, `client.ready`, and host-facing readiness so they are derived from the actual satisfied lower-level obligations: driver active generation, runtime/bridge readiness, required overlays, finalization, and no stale reinjection in flight. Preserve the distinction between host availability and session-backed operational readiness.
  **Must NOT do**: Do not let API host startup or QR generation count as client readiness. Do not let metadata-only license or stale bridge state satisfy final readiness.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: truthfulness/order verification across layers
  - Skills: [`debug-agent`] — needed for readiness edge-order debugging
  - Omitted: [`frontend-agent`] — no UI work required

  **Parallelization**: Can Parallel: NO | Wave 4 | Blocks: [18,19,20] | Blocked By: [1,2,3,4,6,8,9,10,11,12,14,15,16]

  **References**:
  - Current readiness path: `packages/core/src/createClient.ts:554-598`, `packages/core/src/session/index.ts:202-230`
  - Gapfiller readiness task: `.sisyphus/plans/gapfiller.md:321-360`
  - Host readiness surfaces: `packages/wa-automate/src/cli-runtime.ts:191-236`
  - v2 readiness/health authority: `.sisyphus/audits/injection-architecture-v2.md:43-83`, `.sisyphus/audits/injection-architecture-v2.md:406-449`

  **Acceptance Criteria**:
  - [ ] `READY` and `client.ready` only emit after finalized lower-level truth is established
  - [ ] Host/API availability remains distinct from session-backed readiness
  - [ ] Readiness cannot be satisfied by stale generations or partial bridge state
  - [ ] The readiness model can answer the release-blocker matrix from actual state and event data

  **QA Scenarios**:
  ```
  Scenario: Host starts before session-ready but does not lie
    Tool: Bash
    Steps: Start the wa-automate/API host and query readiness-sensitive paths before and after finalized client readiness
    Expected: Host availability appears earlier, but session-backed readiness remains false until lower-level truth is satisfied
    Evidence: .sisyphus/evidence/task-17-host-vs-session.txt

  Scenario: Ready emits once and only after final lower-level obligations complete
    Tool: Bash
    Steps: Run an end-to-end bootstrap test with event-order assertions for runtime, bridge, patch/license, finalization, and ready
    Expected: `client.ready` emits exactly once and only after all required lower-level stages finish
    Evidence: .sisyphus/evidence/task-17-ready-ordering.txt
  ```

  **Commit**: YES | Message: `fix(core): make readiness reflect finalized truth` | Files: `packages/core/**`, `packages/client/**`, `packages/wa-automate/**`, `packages/api/**`

- [x] 18. Audit the runtime method and listener surface against the actual shipped browser runtime

  **What to do**: Build a smoke-audit of the `Client` facade and listener surface against the actual shipped `wapi.js` and bridge support so the package cannot compile a method/listener surface that silently lacks runtime backing.
  **Must NOT do**: Do not assume facade completeness because methods are bound in TypeScript. Do not leave partial runtime backing undocumented.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: inventory/smoke-validation work with release impact
  - Skills: [`debug-agent`] — needed for mapping facade methods to WAPI/runtime capability
  - Omitted: [`frontend-agent`] — no UI work required

  **Parallelization**: Can Parallel: YES | Wave 4 | Blocks: [19,20] | Blocked By: [1,12,13,14,15,17]

  **References**:
  - Client facade: `packages/client/src/Client.ts:86-386`
  - Event manager: `packages/client/src/events/EventManager.ts:42-190`
  - Current runtime asset: `packages/core/src/transport/assets/wapi.js`
  - Audit warning: `.sisyphus/audits/v5-parity-audit.md:1298-1301`

  **Acceptance Criteria**:
  - [ ] Each exposed listener path is either backed by the runtime bridge or explicitly marked unsupported/deprecated
  - [ ] Each high-level client method included in release claims has a backing runtime implementation/smoke test
  - [ ] No facade method silently relies on missing helper assets or dead runtime hooks
  - [ ] The resulting inventory is machine-readable and used in release verification

  **QA Scenarios**:
  ```
  Scenario: Listener inventory matches bridge/runtime support
    Tool: Bash
    Steps: Run a generated inventory test that cross-checks client listener registration points against active bridge/runtime producers
    Expected: Unsupported listener paths fail the test until removed or implemented
    Evidence: .sisyphus/evidence/task-18-listener-inventory.txt

  Scenario: Method surface smoke tests prevent silent no-op APIs
    Tool: Bash
    Steps: Run targeted smoke tests against the declared releaseable client methods
    Expected: Every claimed method either executes successfully in the test harness or is explicitly excluded/deprecated
    Evidence: .sisyphus/evidence/task-18-method-surface.txt
  ```

  **Commit**: YES | Message: `test(client): audit facade against runtime support` | Files: `packages/client/**`, `packages/core/**`, `packages/schema/**`

- [x] 19. Publish the config deprecation matrix and reassess top-level `wa-automate` exposure only after runtime truth is fixed

  **What to do**: Document and encode the accepted deprecations/downgrades (popup QR, JSON session restore, other MD-obsolete knobs), align config semantics with the corrected audit, and only then reassess whether `@open-wa/wa-automate` should broaden, narrow, or keep its public re-export/config surface.
  **Must NOT do**: Do not broaden exports before task 17 passes. Do not leave obsolete config flags silently accepted with misleading semantics.

  **Recommended Agent Profile**:
  - Category: `writing` — Reason: architecture/product-surface decision plus explicit migration guidance
  - Skills: [`pm-agent`] — needed to keep deprecation/release messaging crisp and bounded
  - Omitted: [`debug-agent`] — runtime correctness should already be settled before this task

  **Parallelization**: Can Parallel: YES | Wave 4 | Blocks: [20] | Blocked By: [1,13,17,18]

  **References**:
  - Gapfiller export task: `.sisyphus/plans/gapfiller.md:362-399`
  - Corrections obsolete/downgraded config list: `.sisyphus/audits/v5-parity-audit-corrections.md:191-213`, `.sisyphus/audits/v5-parity-audit-corrections.md:246-264`
  - Current `wa-automate` package: `packages/wa-automate/src/index.ts`, `packages/wa-automate/src/cli-runtime.ts`
  - Current exports: `packages/client/src/index.ts`, `packages/core/src/index.ts`

  **Acceptance Criteria**:
  - [ ] A deprecation matrix exists for obsolete, downgraded, and retained config/feature semantics
  - [ ] Top-level export/config surface decisions are explicitly justified against the corrected architecture and parity state
  - [ ] No deprecated config continues to imply guaranteed behavior that is not implemented
  - [ ] Export-surface changes do not regress the now-correct runtime contract

  **QA Scenarios**:
  ```
  Scenario: Deprecated config semantics are explicit and testable
    Tool: Bash
    Steps: Run config-schema and CLI/runtime smoke tests for deprecated, retained, and downgraded config keys
    Expected: Deprecated keys are documented/handled intentionally and do not silently pretend to work
    Evidence: .sisyphus/evidence/task-19-config-deprecations.txt

  Scenario: Top-level export changes preserve runtime correctness
    Tool: Bash
    Steps: Run import smoke tests and then re-run the release-blocker parity suite after any export/config surface adjustment
    Expected: Public surface behaves as documented and no runtime parity test regresses
    Evidence: .sisyphus/evidence/task-19-export-surface.txt
  ```

  **Commit**: YES | Message: `chore(wa-automate): align config and export surface` | Files: `packages/wa-automate/**`, `packages/client/**`, `packages/core/**`, `packages/config/**`

- [x] 20. Produce the release-candidate parity evidence pack and go/no-go suite

  **What to do**: Run the final integrated parity suite across core, client, driver-puppeteer, and wa-automate; collect evidence for each release blocker; and produce a single go/no-go artifact that proves v5 is releaseable under the accepted parity/deprecation model.
  **Must NOT do**: Do not hand-wave missing evidence. Do not let “most tests pass” substitute for blocker sign-off.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: final proof and release gating
  - Skills: [`debug-agent`] — needed if final blockers fail and require classification
  - Omitted: [`frontend-agent`] — no UI work required

  **Parallelization**: Can Parallel: NO | Wave 4 | Blocks: [] | Blocked By: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19]

  **References**:
  - Release-blocker matrix from task 1
  - Current package scripts: `packages/core/package.json:15-21`, `packages/client/package.json:15-20`, `packages/wa-automate/package.json:10-15`
  - Final verification requirements from this plan

  **Acceptance Criteria**:
  - [ ] A single evidence pack exists covering every P0/P1 blocker with pass/fail proof
  - [ ] Core, client, wa-automate, and required build/test commands all pass in the release candidate
  - [ ] No blocker remains in ambiguous or “manually verify later” state
  - [ ] The evidence pack identifies every accepted divergence/deprecation explicitly

  **QA Scenarios**:
  ```
  Scenario: Full release-candidate suite passes
    Tool: Bash
    Steps: Run pnpm --filter @open-wa/core test && pnpm --filter @open-wa/client test && pnpm --filter @open-wa/wa-automate test && pnpm --filter @open-wa/core build && pnpm --filter @open-wa/client build && pnpm --filter @open-wa/driver-puppeteer build && pnpm --filter @open-wa/wa-automate build
    Expected: All commands succeed for the candidate branch and the parity suite remains green
    Evidence: .sisyphus/evidence/task-20-release-suite.txt

  Scenario: Evidence pack is complete for every release blocker
    Tool: Bash
    Steps: Run a manifest verification script that checks for all required task evidence files and blocker statuses
    Expected: The manifest shows no missing proof for any P0/P1 item and lists accepted divergences separately
    Evidence: .sisyphus/evidence/task-20-evidence-manifest.txt
  ```

  **Commit**: YES | Message: `test(release): add parity evidence pack` | Files: `packages/core/**`, `packages/client/**`, `packages/wa-automate/**`, `.sisyphus/evidence/**`

## Final Verification Wave (MANDATORY — after ALL implementation tasks)
> 4 review agents run in PARALLEL. ALL must APPROVE. The implementation work may conclude only after these checks pass and a release handoff report is presented to the user.
> **Do NOT auto-promote the branch/release after verification. Pause at a release handoff checkpoint for explicit user approval.**
> **Never mark F1-F4 as checked before their agent-executed evidence exists.** Rejection or user feedback -> fix -> re-run -> present again -> pause at the handoff checkpoint.

- [x] F1. Plan Compliance Audit — oracle

  **What to do**: Run an oracle review that checks the completed implementation against this plan’s task list, wave ordering, and authority stack. The audit must verify that no task was skipped, reordered unsafely, or declared complete without the evidence required by its acceptance criteria.
  **Must NOT do**: Do not treat “close enough” as compliant. Do not ignore accepted downgrades/deprecations when scoring scope fidelity.

  **Recommended Agent Profile**:
  - Category: `deep` — Reason: whole-plan conformance audit with dependency/order reasoning
  - Skills: [`plan-review`] — needed to compare completed work against the execution plan line-by-line
  - Omitted: [`frontend-agent`] — no UI implementation work required

  **Parallelization**: Can Parallel: YES | Final Verification Wave | Blocks: [] | Blocked By: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]

  **Acceptance Criteria**:
  - [ ] The review reports explicit pass/fail status for all 20 implementation tasks
  - [ ] Any accepted divergence is matched back to the Decision Log instead of being treated as a silent miss
  - [ ] No task lacking its required evidence artifact is marked compliant

  **QA Scenarios**:
  ```
  Scenario: Plan compliance review checks every task and dependency gate
    Tool: task (oracle)
    Steps: Review completed work against .sisyphus/plans/unfuckupgaps.md and its evidence artifacts
    Expected: Oracle returns a pass/fail report covering all tasks, dependency ordering, and accepted divergences
    Evidence: .sisyphus/evidence/f1-plan-compliance.md

  Scenario: Missing evidence is treated as failure
    Tool: task (oracle)
    Steps: Validate that each task's acceptance criteria and QA evidence files exist in the completed branch/worktree
    Expected: Any missing artifact is flagged as non-compliant rather than assumed complete
    Evidence: .sisyphus/evidence/f1-missing-evidence-check.md
  ```

- [x] F2. Code Quality Review — unspecified-high

  **What to do**: Run a code quality review over the changed packages focusing on correctness, maintainability, unnecessary duplication, dead compatibility shims, and unsafe lifecycle coupling introduced during parity recovery.
  **Must NOT do**: Do not limit review to lint-level issues. Do not re-open accepted architectural decisions unless they created regressions.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: cross-package code review over runtime-critical changes
  - Skills: [`code-review`] — needed for structured severity-ranked review
  - Omitted: [`frontend-agent`] — no UI implementation work required

  **Parallelization**: Can Parallel: YES | Final Verification Wave | Blocks: [] | Blocked By: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]

  **Acceptance Criteria**:
  - [ ] Review covers core, client, driver, and wa-automate changes touched by the plan
  - [ ] No unresolved critical/major issues remain in lifecycle, readiness, or bridge code
  - [ ] New compatibility/deprecation paths are readable and intentionally bounded

  **QA Scenarios**:
  ```
  Scenario: Code review produces severity-ranked findings or approval
    Tool: task (unspecified-high)
    Steps: Review the changed files for lifecycle correctness, duplication, and maintainability issues
    Expected: The review either approves or returns severity-ranked issues with concrete file references
    Evidence: .sisyphus/evidence/f2-code-review.md

  Scenario: Compatibility shims are bounded and intentional
    Tool: task (unspecified-high)
    Steps: Inspect deprecation/config-compatibility code paths added by the recovery work
    Expected: Any shim/deprecation code is explicitly justified, scoped, and free of hidden behavioral drift
    Evidence: .sisyphus/evidence/f2-compatibility-review.md
  ```

- [x] F3. Real Agent-Executed QA — unspecified-high (+ playwright if UI)

  **What to do**: Run an end-to-end agent-executed QA pass across the release-blocker scenarios using the completed branch/worktree: fresh-auth path, resumed-session path, main-frame navigation reload, bridge delivery, readiness ordering, and logout cleanup. If any UI route or dashboard behavior was touched, include Playwright; otherwise use the available test/integration harnesses.
  **Must NOT do**: Do not rely on manual clicking or visual-only confirmation. Do not skip the resumed-session or navigation-reinject scenarios.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: integrated runtime QA over multiple boot/recovery flows
  - Skills: [`qa-agent`, `agent-browser`] — needed for scenario execution and browser automation where applicable
  - Omitted: [`frontend-agent`] — QA only

  **Parallelization**: Can Parallel: YES | Final Verification Wave | Blocks: [] | Blocked By: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]

  **Acceptance Criteria**:
  - [ ] Fresh-auth, resumed-session, and navigation/reinject flows all pass under agent execution
  - [ ] Event bridge delivery and readiness ordering are validated in integrated scenarios
  - [ ] Logout cleanup and terminal-state handling are validated when configured

  **QA Scenarios**:
  ```
  Scenario: Fresh auth + ready ordering pass end-to-end
    Tool: Bash / agent-browser
    Steps: Execute the completed bootstrap/integration suite for a fresh-auth path and collect event-order evidence
    Expected: The run reaches finalized readiness once, with bridge, finalization, and readiness steps in the documented order
    Evidence: .sisyphus/evidence/f3-fresh-auth-e2e.txt

  Scenario: Resumed session + navigation reinjection remain healthy
    Tool: Bash / agent-browser
    Steps: Execute resumed-session and forced main-frame navigation scenarios on the completed branch
    Expected: Session resumes without QR, navigation reinjection recovers correctly, and no zombie/duplicate listener state appears
    Evidence: .sisyphus/evidence/f3-resume-nav-e2e.txt
  ```

- [x] F4. Scope Fidelity Check — deep

  **What to do**: Run a deep scope audit that verifies the recovery work fixed the intended parity blockers without ballooning into unauthorized redesign, speculative feature creep, or regressions in non-target packages.
  **Must NOT do**: Do not accept hidden architecture drift just because tests are green. Do not penalize accepted deprecations that are explicitly documented in task 19.

  **Recommended Agent Profile**:
  - Category: `deep` — Reason: high-context scope and architecture drift check
  - Skills: [`plan-review`] — needed to compare delivered work against the bounded plan scope
  - Omitted: [`frontend-agent`] — no UI implementation work required

  **Parallelization**: Can Parallel: YES | Final Verification Wave | Blocks: [] | Blocked By: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]

  **Acceptance Criteria**:
  - [ ] Delivered work stays inside the plan’s declared blocker/non-blocker boundaries
  - [ ] No unauthorized platform-wide redesign or opportunistic feature work is bundled in
  - [ ] Accepted deprecations/downgrades are honored instead of silently reintroduced

  **QA Scenarios**:
  ```
  Scenario: Scope audit flags any unauthorized expansion
    Tool: task (deep)
    Steps: Review changed packages and compare them against the allowed scope in this plan
    Expected: The audit reports either clean scope fidelity or explicit overreach findings with file references
    Evidence: .sisyphus/evidence/f4-scope-fidelity.md

  Scenario: Non-blocking parity items did not overtake release blockers
    Tool: task (deep)
    Steps: Verify task ordering and changed code paths to ensure downgraded/P3 work did not outrun P0/P1 completion
    Expected: The audit confirms release-blocker work remained dominant and nice-to-have parity did not distort sequencing
    Evidence: .sisyphus/evidence/f4-priority-fidelity.md
  ```

## Commit Strategy
- Follow the atomic commit sequence validated by Metis:
  1. `test(core): codify release-blocker parity matrix`
  2. `feat(driver-interface): add lifecycle-safe page contract`
  3. `feat(driver-puppeteer): implement lifecycle parity primitives`
  4. `fix(core): wire launch-path parity settings`
  5. `feat(core): add generation-based injection controller shell`
  6. `feat(core): implement runtime event bridge`
  7. `feat(core): make bridge rebinding runtime-safe`
  8. `feat(core): restore navigation-safe reinjection`
  9. `feat(core): add post-auth reinjection and ripeness gate`
  10. `feat(client): add loaded-equivalent finalization`
  11. `feat(client): restore logout cleanup semantics`
  12. `feat(core): add runtime integrity gate`
  13. `fix(core): make asset and internal-handler contracts truthful`
  14. `fix(core): align patch lifecycle semantics`
  15. `fix(core): make license readiness truthful`
  16. `fix(core): restore auth recovery classifications`
  17. `fix(core): make readiness reflect finalized truth`
  18. `test(client): audit facade against runtime support`
  19. `chore(wa-automate): align config and export surface`
  20. `test(release): add parity evidence pack`
- No commit may claim parity for a behavior that lacks runtime proof against the release-blocker matrix.
- No architecture migration commit may outrun the driver contract it depends on.
- No export/config cleanup commit may precede task 17’s successful readiness-truth verification.

## Success Criteria
- Browser→node runtime events are actively bridged and observable through the v5 client/event surface.
- Main-frame navigation, post-auth churn, and runtime replacement no longer produce zombie sessions or duplicate bridge/listener state.
- `userDataDir` persistence works through the active core path and survives restart scenarios.
- `Client.loaded()`-equivalent finalization exists as real behavior, not bookkeeping only.
- Required runtime method integrity is checked or repaired before final readiness.
- Patch and license semantics are truthful and readiness-aware.
- Host/API availability and session-backed readiness are distinct and correct.
- Every accepted divergence/deprecation from legacy is documented and proven non-blocking.
- The release evidence pack proves all P0/P1 blockers are closed.
