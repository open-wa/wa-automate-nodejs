# Lightpanda Local Browser Option for open-wa

## TL;DR
> **Summary**: Add a Puppeteer-first local Lightpanda runtime to open-wa that uses a shared SDK-managed binary cache, starts one Lightpanda process per session on a unique local port, connects over CDP, and fails fast for rendering-dependent operations.
> **Deliverables**:
> - New Lightpanda driver package with process lifecycle ownership
> - Config + CLI support for `useLightpanda` and Lightpanda-specific options
> - Unique port allocation and readiness/connect flow
> - Centralized fail-fast capability gating for non-rendering browser limitations
> - Minimal automated tests plus gated smoke verification
> **Effort**: Large
> **Parallel**: YES - 2 waves
> **Critical Path**: 1 → 2 → 3 → 4 → 6 → 8 → 9

## Context
### Original Request
Plan a new browser option for both drivers based on `--use-lightpanda`, but only implement the local/manual mode in this plan. The browser should be lazily downloaded into a shared machine-level location, avoid repeated downloads across projects, run as a separate process on a unique free port starting at 9000, and then be connected to over CDP. Keep future docker/server modes in mind, but do not plan them as deliverables now. Screenshots/screencasts must be treated as unsupported because Lightpanda has no rendering engine.

### Interview Summary
- Shared binary default should use the Lightpanda SDK cache (`~/.cache/lightpanda-node`) with override support.
- Rendering-dependent features must fail fast with clear Lightpanda-specific errors.
- First delivery target is Puppeteer-first, not Playwright parity.
- Scope includes CLI and programmatic config-object support in one plan.
- Test strategy is minimal tests, not TDD-heavy coverage.

### Metis Review (gaps addressed)
- Converted Lightpanda from a vague CLI feature into a driver-owned lifecycle plan.
- Added guardrails for zombie child processes, port-race retries, and stable error taxonomy.
- Explicitly narrowed v1 away from Playwright parity and away from docker/server remote semantics.
- Required centralized capability gating rather than scattered `if (lightpanda)` checks.
- Added acceptance criteria for config normalization, cleanup on failure, port uniqueness, and unsupported rendering APIs.

## Work Objectives
### Core Objective
Introduce a local Lightpanda engine path for open-wa that behaves like a first-class runtime choice for CLI and config consumers while preserving the existing core architecture: the selected driver owns Lightpanda spawn/connect/cleanup, the CLI only selects the driver, and unsupported rendering operations are rejected before they leak into deep CDP failures.

### Deliverables
- `@open-wa/driver-lightpanda` package with Lightpanda binary/process/port/connect lifecycle
- Config schema/env/normalization support for `useLightpanda` and minimal Lightpanda-specific knobs
- Runtime driver-selection wiring for CLI and shared normalized config flow
- Centralized capability guard for rendering-dependent operations
- Minimal automated regression tests and a gated Lightpanda smoke path

### Definition of Done (verifiable conditions with commands)
- `pnpm --filter @open-wa/driver-lightpanda test` passes after package creation
- `pnpm --filter @open-wa/wa-automate test` passes with new CLI/config coverage
- `pnpm --filter @open-wa/core test` passes with Lightpanda capability-guard coverage
- A gated smoke test can start Lightpanda, connect, and reach QR-generation/bootstrap stages when Lightpanda is available in the environment
- Two simultaneous Lightpanda-backed session startups select different ports at or above 9000 and clean up their child processes on shutdown
- Rendering-dependent API calls under Lightpanda fail with deterministic error text mentioning Lightpanda and unsupported rendering

### Must Have
- One Lightpanda process per open-wa session in v1
- SDK-managed shared binary cache by default
- Explicit executable override path support
- Bounded free-port search starting at 9000 with retry on collision
- Driver-owned child-process cleanup for success and failure paths
- Puppeteer-first implementation with no false Playwright parity claims
- Centralized capability/error handling for rendering limitations

### Must NOT Have (guardrails, AI slop patterns, scope boundaries)
- No Lightpanda process spawning in CLI code
- No shared Lightpanda daemon across sessions in v1
- No docker/server execution mode deliverables in this plan
- No generic browser-engine rewrite beyond what is strictly necessary for `useLightpanda`
- No best-effort screenshot/PDF/render behavior
- No per-project binary install location
- No scattered `if (config.useLightpanda)` checks across unrelated modules

## Verification Strategy
> ZERO HUMAN INTERVENTION - all verification is agent-executed.
- Test decision: minimal tests (tests-after) using existing Vitest infrastructure plus gated smoke coverage
- QA policy: Every task includes agent-executed scenarios
- Evidence: `.sisyphus/evidence/task-{N}-{slug}.{ext}`

## Execution Strategy
### Parallel Execution Waves
> Target: 5-8 tasks per wave. <3 per wave (except final) = under-splitting.
> Extract shared dependencies as Wave-1 tasks for max parallelism.

Wave 1: config surface, driver package scaffold, Lightpanda lifecycle utilities, driver implementation, capability model foundation

Wave 2: runtime selection wiring, render-fail-fast integration, minimal tests, gated smoke verification, packaging/build/export polish

### Dependency Matrix (full, all tasks)
| Task | Depends On | Blocks |
|---|---|---|
| 1 | - | 4, 6, 9 |
| 2 | - | 3, 4, 10 |
| 3 | 2 | 4, 9 |
| 4 | 1, 2, 3 | 6, 8, 9 |
| 5 | 1 | 7, 8, 9 |
| 6 | 1, 4 | 8, 9 |
| 7 | 5 | 8, 9 |
| 8 | 4, 5, 6, 7 | 9 |
| 9 | 1, 3, 4, 6, 7, 8 | 10 |
| 10 | 2, 4, 8, 9 | Final verification |

### Agent Dispatch Summary (wave → task count → categories)
- Wave 1 → 5 tasks → backend-impl / unspecified-high / quick
- Wave 2 → 5 tasks → backend-impl / qa-reviewer / unspecified-high / quick

## TODOs
> Implementation + Test = ONE task. Never separate.
> EVERY task MUST have: Agent Profile + Parallelization + QA Scenarios.

- [x] 1. Add normalized Lightpanda config surface

  **What to do**: Add a narrow v1 config surface centered on `useLightpanda` plus a minimal nested options object reserved for local mode only. Normalize CLI, env, file, and programmatic config into one runtime shape. Include: `useLightpanda`, `lightpanda.executablePath?`, `lightpanda.portStart?` (default `9000`), `lightpanda.host?` (default `127.0.0.1`), `lightpanda.startupTimeoutMs?`, and `lightpanda.disableTelemetry?` if needed for deterministic startup. Ensure precedence follows existing config merge rules and that incompatible or future-only fields are rejected or ignored with explicit warnings.
  **Must NOT do**: Do not introduce docker/server mode config now. Do not replace `useChrome` with a generalized engine enum in v1. Do not place Lightpanda-specific normalization logic in CLI-only code.

  **Recommended Agent Profile**:
  - Category: `backend-impl` - Reason: config schema, validation, env mapping, and normalized runtime objects are backend-style implementation work.
  - Skills: `[]` - No special skill needed beyond careful schema/config work.
  - Omitted: `context7` - Official Lightpanda research is already settled for planning.

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 4, 6, 9 | Blocked By: none

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `packages/config/src/schema/config.ts:182-203` - Existing browser config fields and naming style.
  - Pattern: `packages/config/src/env.ts` - Existing env alias registration point for new config inputs.
  - Pattern: `packages/config/src/merge.ts` - Existing precedence flow for defaults/file/env/CLI/programmatic config.
  - Pattern: `packages/wa-automate/src/cli-runtime.ts:254-345` - Current CLI override mapping that must feed the same normalized shape.
  - Reference: `## Context` and `## Work Objectives` in this plan - Locked decisions already recorded here: SDK cache default, fail-fast rendering policy, Puppeteer-first scope, CLI + programmatic support.
  - External: `https://lightpanda.io/docs/quickstart/installation-and-setup` - SDK cache/install expectations.

  **Acceptance Criteria** (agent-executable only):
  - [ ] Config schema accepts `useLightpanda` and the approved local-only Lightpanda options.
  - [ ] Env + CLI + programmatic inputs normalize into one equivalent runtime representation.
  - [ ] Default Lightpanda `portStart` is `9000` and default `host` is `127.0.0.1`.
  - [ ] No docker/server fields are added to the v1 schema.

  **QA Scenarios** (MANDATORY - task incomplete without these):
  ```
  Scenario: Config normalization happy path
    Tool: Bash
    Steps: Run the package test command covering schema/env/merge normalization for CLI + programmatic inputs.
    Expected: Tests prove identical normalized Lightpanda config regardless of input source.
    Evidence: .sisyphus/evidence/task-1-config-normalization.txt

  Scenario: Invalid future-mode field rejected
    Tool: Bash
    Steps: Run a targeted test that injects unsupported docker/server-oriented Lightpanda fields into config.
    Expected: Validation fails or emits the planned explicit warning path, with no silent acceptance.
    Evidence: .sisyphus/evidence/task-1-config-normalization-error.txt
  ```

  **Commit**: YES | Message: `feat(config): add lightpanda local runtime options` | Files: `packages/config/**`, `packages/wa-automate/src/cli-runtime.ts`

- [x] 2. Create the `@open-wa/driver-lightpanda` package boundary

  **What to do**: Add a new sibling package for Lightpanda rather than patching CLI/core directly. The package must own Lightpanda-specific runtime concerns: SDK import, binary resolution, child-process lifecycle, port allocation helpers, readiness probing, CDP endpoint construction, and capability declaration. Wire build/test/package metadata and workspace dependencies so the package participates cleanly in the monorepo.
  **Must NOT do**: Do not implement Lightpanda inside `packages/wa-automate` or `packages/core`. Do not make `driver-puppeteer` a thin wrapper around Lightpanda. Do not add per-project cache logic.

  **Recommended Agent Profile**:
  - Category: `backend-impl` - Reason: package architecture and monorepo integration.
  - Skills: `[]` - Standard package scaffolding is sufficient.
  - Omitted: `dev-workflow` - Not needed for the first implementation pass.

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 3, 4, 10 | Blocked By: none

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `packages/driver-puppeteer/package.json` - Package structure and dependency layout.
  - Pattern: `packages/driver-playwright/package.json` - Alternate driver package structure.
  - Pattern: `packages/driver-puppeteer/src/PuppeteerDriver.ts:1-91` - Driver class shape and capability declaration style.
  - Pattern: `packages/driver-interface/src/driver.ts:72-146` - Required `IDriver`, `IBrowser`, and `IPage` contract.
  - Pattern: `packages/driver-interface/src/capabilities.ts:1-95` - Capability registration and error model.
  - Pattern: `packages/wa-automate/package.json:17-32` - Workspace dependency style for runtime packages.
  - External: `https://github.com/lightpanda-io/browser/blob/main/README.md` - Supported deployment shape and runtime expectations.

  **Acceptance Criteria** (agent-executable only):
  - [ ] New package builds in the workspace and exports a Lightpanda driver entrypoint.
  - [ ] Package declares `@lightpanda/browser` and any required peer/runtime dependencies explicitly.
  - [ ] Package exposes a clear internal separation between driver contract, process utilities, and capability declarations.

  **QA Scenarios** (MANDATORY - task incomplete without these):
  ```
  Scenario: Package build and export wiring
    Tool: Bash
    Steps: Run the package build/test commands for the new driver package.
    Expected: The package resolves, builds, and its exported driver entrypoint is importable by workspace consumers.
    Evidence: .sisyphus/evidence/task-2-package-build.txt

  Scenario: Missing dependency or bad export path
    Tool: Bash
    Steps: Run workspace type/build validation after package creation.
    Expected: Validation catches unresolved exports or dependency gaps; final state has no such failures.
    Evidence: .sisyphus/evidence/task-2-package-build-error.txt
  ```

  **Commit**: YES | Message: `feat(driver-lightpanda): scaffold driver package` | Files: `packages/driver-lightpanda/**`, workspace manifests as needed

- [x] 3. Implement Lightpanda port allocation, readiness, and child-process cleanup utilities

  **What to do**: Inside the new driver package, implement a bounded local-only lifecycle utility that: selects a free port starting at `9000`, retries on `EADDRINUSE` or bind races, starts Lightpanda via `lightpanda.serve()`, probes readiness before CDP connect, and guarantees cleanup on startup failure, connect failure, normal shutdown, and session teardown. Default to `127.0.0.1` only. Prefer one process per session. Disable or explicitly configure the Lightpanda inactivity timeout so agent pauses do not drop sessions.
  **Must NOT do**: Do not share one Lightpanda process across multiple open-wa sessions. Do not rely on naive scan-without-retry logic. Do not defer cleanup ownership to CLI or `Transport`.

  **Recommended Agent Profile**:
  - Category: `backend-impl` - Reason: process control, port allocation, and failure-handling utilities.
  - Skills: `[]` - No external skill required.
  - Omitted: `git-master` - No git work needed during implementation.

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 4, 9 | Blocked By: 2

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `packages/wa-automate/src/cli-runtime.ts:348-399` - Current cached browser resolution flow and warning style.
  - Pattern: `packages/legacy/src/controllers/browser.ts` - Legacy browser lifecycle and hard cleanup precedent.
  - External: `https://lightpanda.io/docs/quickstart/installation-and-setup` - `lightpanda.serve()` usage and explicit kill semantics.
  - External: `https://lightpanda.io/docs/open-source/installation` - Local binary/install expectations.
  - Reference: `## Context` and `## Work Objectives` in this plan - Officially researched constraints already captured here: one-process-per-session model, no rendering support, bounded port search from 9000, and startup timeout/cleanup guardrails.

  **Acceptance Criteria** (agent-executable only):
  - [ ] Port search starts at configured `portStart` and returns a free port at or above `9000` by default.
  - [ ] Startup retries are bounded and produce deterministic failure text on port exhaustion or readiness timeout.
  - [ ] Child processes are terminated on startup failure and normal teardown.
  - [ ] Host binding is restricted to local loopback in v1.

  **QA Scenarios** (MANDATORY - task incomplete without these):
  ```
  Scenario: Concurrent startup picks unique ports
    Tool: Bash
    Steps: Run a targeted test that starts two Lightpanda lifecycle helpers concurrently with the first preferred port already occupied or racing.
    Expected: Each helper resolves a unique port >= 9000 and both complete or retry deterministically without orphaned processes.
    Evidence: .sisyphus/evidence/task-3-port-allocation.txt

  Scenario: Startup failure cleans up child process
    Tool: Bash
    Steps: Run a test that forces Lightpanda readiness/connect failure after spawn.
    Expected: The helper surfaces the planned error and confirms the child process was killed.
    Evidence: .sisyphus/evidence/task-3-port-allocation-error.txt
  ```

  **Commit**: YES | Message: `feat(driver-lightpanda): add process and port lifecycle utilities` | Files: `packages/driver-lightpanda/src/**`

- [x] 4. Implement the Lightpanda driver as a driver-owned spawn-then-connect runtime

  **What to do**: Implement `LightpandaDriver` so its public `launch()` method performs the full Lightpanda v1 lifecycle internally: ensure binary resolution, start the local Lightpanda process, wait for readiness, connect over CDP using Puppeteer-compatible flow, return an `IBrowser` implementation, and retain teardown state so `browser.close()` and/or driver-owned cleanup shuts the child down exactly once. Model the package as a Puppeteer-shaped driver variant; do not require `Transport` to learn Lightpanda-specific connect semantics in v1.
  **Must NOT do**: Do not push spawn/connect logic into CLI or core transport. Do not claim Playwright support in this task. Do not expose raw Lightpanda process handles outside the package.

  **Recommended Agent Profile**:
  - Category: `backend-impl` - Reason: driver implementation against existing runtime contracts.
  - Skills: `[]` - Existing driver packages are sufficient references.
  - Omitted: `context7` - Docs already researched.

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 6, 8, 9 | Blocked By: 1, 2, 3

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `packages/driver-puppeteer/src/PuppeteerDriver.ts:4-91` - Existing `IDriver` implementation and `connect()` usage.
  - Pattern: `packages/driver-interface/src/driver.ts:72-146` - Driver/browser/page contract.
  - Pattern: `packages/core/src/transport/Transport.ts:457-490` - Current runtime assumes `driver.launch()` returns a ready browser.
  - Pattern: `packages/core/src/createClient.ts:220-243` - Transport construction path that must remain compatible.
  - External: `https://lightpanda.io/docs/quickstart/installation-and-setup` - Node SDK spawn + connect examples.
  - External: user-provided examples for Puppeteer/Playwright CDP connect flow in the planning conversation.

  **Acceptance Criteria** (agent-executable only):
  - [ ] `LightpandaDriver.launch()` returns a usable browser instance without requiring core transport changes to call `connect()` directly.
  - [ ] Driver reports Lightpanda-specific capabilities accurately, including unsupported rendering/PDF-related claims.
  - [ ] Driver teardown is idempotent and does not leave a child process behind.

  **QA Scenarios** (MANDATORY - task incomplete without these):
  ```
  Scenario: Driver launch returns connected browser
    Tool: Bash
    Steps: Run a targeted driver-package test that launches Lightpanda through the new driver and performs a minimal CDP-backed page creation flow.
    Expected: The returned browser is connected, exposes a page, and closes cleanly.
    Evidence: .sisyphus/evidence/task-4-driver-launch.txt

  Scenario: Repeated close is safe
    Tool: Bash
    Steps: Run a targeted test that closes the browser/driver twice after startup.
    Expected: Cleanup is idempotent and does not throw or leave a running process.
    Evidence: .sisyphus/evidence/task-4-driver-launch-error.txt
  ```

  **Commit**: YES | Message: `feat(driver-lightpanda): implement spawn and connect driver` | Files: `packages/driver-lightpanda/src/**`

- [x] 5. Introduce a centralized Lightpanda capability and error model

  **What to do**: Extend the driver capability model so Lightpanda limitations are declared centrally and can be checked consistently. Add any missing capability keys needed for rendering-sensitive behavior (for example screenshot/rendering support if the current capability set is insufficient). Introduce stable error classes/messages for: unsupported rendering, startup failure, connect failure, invalid executable path, and port exhaustion. Make the capability model the only source of truth for Lightpanda-specific restrictions.
  **Must NOT do**: Do not scatter hard-coded Lightpanda checks across unrelated features. Do not leave raw SDK/CDP exceptions as the only user-facing behavior for known unsupported cases.

  **Recommended Agent Profile**:
  - Category: `backend-impl` - Reason: cross-package capability contract and error taxonomy work.
  - Skills: `[]` - No special skill needed.
  - Omitted: `code-review` - This is implementation work, not review.

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 7, 8, 9 | Blocked By: 1

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `packages/driver-interface/src/capabilities.ts:1-95` - Existing capability key/error pattern.
  - Pattern: `packages/driver-puppeteer/src/PuppeteerDriver.ts:12-24` - Capability declaration style.
  - Pattern: `packages/driver-interface/src/driver.ts:125-125` - Screenshot is currently part of the page contract and must be accounted for.
  - Pattern: `packages/core/src/createClient.ts:1041-1044` - Current top-level screenshot entrypoint.
  - External: Lightpanda docs/research showing no rendering engine and no visual output support.

  **Acceptance Criteria** (agent-executable only):
  - [ ] Capability declarations can express Lightpanda’s unsupported rendering constraints explicitly.
  - [ ] Stable errors exist for unsupported rendering, startup failure, connect failure, invalid executable path, and port exhaustion.
  - [ ] No new Lightpanda-specific checks are required outside the centralized capability/error model without a documented reason.

  **QA Scenarios** (MANDATORY - task incomplete without these):
  ```
  Scenario: Capability declaration exposes unsupported rendering
    Tool: Bash
    Steps: Run a unit test that inspects the Lightpanda driver capability map and requires the unsupported capability.
    Expected: The capability map marks rendering-dependent support as unsupported with a deterministic reason.
    Evidence: .sisyphus/evidence/task-5-capabilities.txt

  Scenario: Unsupported capability error is stable
    Tool: Bash
    Steps: Run a unit test that triggers the unsupported capability path.
    Expected: The thrown error matches the planned stable error text/code instead of surfacing a raw CDP failure.
    Evidence: .sisyphus/evidence/task-5-capabilities-error.txt
  ```

  **Commit**: YES | Message: `feat(driver-interface): add lightpanda capability guards` | Files: `packages/driver-interface/**`, `packages/driver-lightpanda/**`, any shared error modules

- [x] 6. Wire runtime driver selection for CLI and normalized config consumers

  **What to do**: Replace the current hard-coded Puppeteer-only runtime selection with a normalized driver factory path that chooses Lightpanda when `useLightpanda` is enabled and otherwise preserves existing Puppeteer behavior. Keep selection logic thin in `wa-automate`: it should consume normalized config and instantiate the correct driver package, not own Lightpanda lifecycle. Ensure startup summaries/logs clearly identify the chosen engine, binary source, host, and selected port once available.
  **Must NOT do**: Do not move process logic into CLI runtime. Do not break existing Puppeteer default behavior. Do not make Playwright selectable in this task.

  **Recommended Agent Profile**:
  - Category: `backend-impl` - Reason: runtime orchestration and dependency wiring.
  - Skills: `[]` - Existing runtime patterns are enough.
  - Omitted: `frontend-impl` - No UI work.

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: 8, 9 | Blocked By: 1, 4

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `packages/wa-automate/src/cli-runtime.ts:432-490` - Current startup path and hard-coded `new PuppeteerDriver()`.
  - Pattern: `packages/wa-automate/src/__tests__/cli-runtime.test.ts:177-260` - Existing CLI runtime test harness style.
  - Pattern: `packages/core/src/createClient.ts:220-243` - Driver is injected into `Transport` from caller.
  - Pattern: `packages/wa-automate/package.json:17-32` - Runtime dependency registration for new driver package.

  **Acceptance Criteria** (agent-executable only):
  - [ ] `useLightpanda` selects the Lightpanda driver from normalized config.
  - [ ] Existing default startup still selects Puppeteer when `useLightpanda` is absent.
  - [ ] Startup logs/summaries identify the Lightpanda engine and resolved executable source accurately.

  **QA Scenarios** (MANDATORY - task incomplete without these):
  ```
  Scenario: CLI selects Lightpanda driver
    Tool: Bash
    Steps: Run targeted CLI runtime tests with `--use-lightpanda` and mocked driver constructors.
    Expected: Runtime instantiates the Lightpanda driver and does not instantiate the Puppeteer driver.
    Evidence: .sisyphus/evidence/task-6-driver-selection.txt

  Scenario: Default path remains Puppeteer
    Tool: Bash
    Steps: Run the same test harness without `--use-lightpanda`.
    Expected: Runtime continues to instantiate Puppeteer by default with no regression.
    Evidence: .sisyphus/evidence/task-6-driver-selection-error.txt
  ```

  **Commit**: YES | Message: `feat(wa-automate): select lightpanda driver from config` | Files: `packages/wa-automate/**`

- [x] 7. Gate rendering-dependent entrypoints through the centralized capability model

  **What to do**: Audit render-sensitive entrypoints and route them through the centralized Lightpanda capability guard. At minimum, cover the top-level `createClient().screenshot()` path and any other currently shipped runtime behavior that would implicitly require rendering, PDF generation, or visual capture. Fail before attempting the underlying operation, and emit deterministic errors that mention Lightpanda and unsupported rendering. Keep the gating centralized and reusable.
  **Must NOT do**: Do not let unsupported rendering calls reach raw page/CDP methods first. Do not implement silent Chrome fallback. Do not add best-effort screenshot attempts.

  **Recommended Agent Profile**:
  - Category: `backend-impl` - Reason: API/runtime guarding and error flow.
  - Skills: `[]` - Standard code search and implementation are sufficient.
  - Omitted: `oracle` - Architecture is already decided.

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: 8, 9 | Blocked By: 5

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `packages/core/src/createClient.ts:1041-1044` - Current screenshot entrypoint.
  - Pattern: `packages/driver-interface/src/driver.ts:125-125` - Screenshot contract that needs guarding.
  - Pattern: `packages/legacy/src/controllers/browser.ts:47-53` - Legacy screenshot behavior demonstrates an existing visual affordance that must not survive under Lightpanda without gating.
  - Pattern: `packages/driver-interface/src/capabilities.ts:61-68` - Existing PDF/tracing capability style.
  - External: Lightpanda docs/research confirming no rendering engine.

  **Acceptance Criteria** (agent-executable only):
  - [ ] Render-dependent operations fail before calling unsupported page/browser methods under Lightpanda.
  - [ ] Error text clearly mentions Lightpanda and unsupported rendering.
  - [ ] Supported non-rendering flows remain untouched.

  **QA Scenarios** (MANDATORY - task incomplete without these):
  ```
  Scenario: Screenshot fails fast under Lightpanda
    Tool: Bash
    Steps: Run a targeted unit/integration test that invokes `createClient().screenshot()` under a Lightpanda-backed runtime.
    Expected: The call fails immediately with the planned Lightpanda unsupported-rendering error.
    Evidence: .sisyphus/evidence/task-7-render-guard.txt

  Scenario: Non-rendering flow still works
    Tool: Bash
    Steps: Run a targeted test that calls a supported non-rendering path after Lightpanda startup.
    Expected: The supported path succeeds and is not blocked by the new capability guard.
    Evidence: .sisyphus/evidence/task-7-render-guard-error.txt
  ```

  **Commit**: YES | Message: `feat(core): fail fast on lightpanda rendering calls` | Files: `packages/core/**`, `packages/driver-interface/**`, any affected runtime entrypoints

- [ ] 8. Integrate minimal automated coverage for config, lifecycle, and fail-fast behavior

  **What to do**: Add only the minimum automated tests needed to freeze the Lightpanda v1 contract: config normalization, CLI/runtime driver selection, bounded port retry behavior, child cleanup on failure/shutdown, and rendering fail-fast behavior. Reuse existing Vitest patterns and mocking style; prefer deterministic unit/integration tests over flaky browser-parity tests.
  **Must NOT do**: Do not add broad browser-parity suites. Do not require live internet navigation for the default test path. Do not write screenshot assertions that assume real rendering exists.

  **Recommended Agent Profile**:
  - Category: `qa-reviewer` - Reason: test design plus implementation against established harnesses.
  - Skills: `[]` - Existing Vitest patterns are sufficient.
  - Omitted: `playwright` - Not needed for the default automated test layer.

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: 9, 10 | Blocked By: 4, 5, 6, 7

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `packages/wa-automate/src/__tests__/cli-runtime.test.ts:55-260` - CLI/config/runtime mocking style.
  - Pattern: `packages/core/test/e2e/createClient.e2e.test.ts:17-64` - Existing gated browser smoke pattern.
  - Pattern: `packages/driver-puppeteer/src/__tests__/**` - Driver-level wrapper test style.
  - Pattern: `packages/driver-playwright/src/__tests__/**` - Alternate driver test structure.
  - Pattern: `packages/core/vitest.config.ts`, `packages/wa-automate/vitest.config.ts` - Existing Vitest package setup.

  **Acceptance Criteria** (agent-executable only):
  - [ ] Automated coverage exists for normalized config, driver selection, port-collision retry, cleanup-on-failure, and render fail-fast behavior.
  - [ ] Existing package tests still pass after adding Lightpanda coverage.
  - [ ] Added tests remain deterministic without requiring rendering output.

  **QA Scenarios** (MANDATORY - task incomplete without these):
  ```
  Scenario: Automated regression suite passes
    Tool: Bash
    Steps: Run targeted package test commands for config/core/wa-automate/driver-lightpanda after adding Lightpanda coverage.
    Expected: All targeted tests pass with no flaky visual dependencies.
    Evidence: .sisyphus/evidence/task-8-automated-coverage.txt

  Scenario: Regression suite catches removed guard
    Tool: Bash
    Steps: Execute or maintain a focused test that would fail if driver selection, cleanup, or fail-fast behavior regresses.
    Expected: The targeted test suite would fail on contract regressions and passes in final state.
    Evidence: .sisyphus/evidence/task-8-automated-coverage-error.txt
  ```

  **Commit**: YES | Message: `test(lightpanda): cover config lifecycle and fail-fast paths` | Files: package test files across `packages/config`, `packages/wa-automate`, `packages/core`, `packages/driver-lightpanda`

- [ ] 9. Add a gated Lightpanda smoke path for real process startup

  **What to do**: Add one real-but-gated smoke verification path that only runs when Lightpanda is available or an explicit env toggle enables it. The smoke should validate the actual v1 contract: spawn local Lightpanda, allocate a unique free port, connect over CDP, create a page/session, and reach a minimal supported open-wa bootstrap milestone without using rendering-dependent assertions. Keep it opt-in and environment-aware.
  **Must NOT do**: Do not make the monorepo default test suite depend on Lightpanda being installed. Do not require screenshots or PDFs for smoke success.

  **Recommended Agent Profile**:
  - Category: `qa-reviewer` - Reason: smoke validation design with real runtime constraints.
  - Skills: `[]` - Standard test tooling is sufficient.
  - Omitted: `agent-browser` - Not needed; this is local process smoke testing.

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: 10 | Blocked By: 1, 3, 4, 6, 7, 8

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `packages/core/test/e2e/createClient.e2e.test.ts:6-64` - Existing gated E2E style using env toggles.
  - Pattern: `packages/core/src/createClient.ts:304-344` - Fatal bootstrap error behavior to preserve during smoke coverage.
  - External: `https://lightpanda.io/docs/quickstart/installation-and-setup` - Real process startup/connect expectations.
  - External: `https://lightpanda.io/docs/open-source/installation` - Binary availability expectations for smoke environments.

  **Acceptance Criteria** (agent-executable only):
  - [ ] Smoke test is opt-in/gated by explicit environment control.
  - [ ] Smoke validates real Lightpanda spawn + connect + minimal supported session progression.
  - [ ] Smoke does not assert on rendering output.

  **QA Scenarios** (MANDATORY - task incomplete without these):
  ```
  Scenario: Real Lightpanda smoke passes when enabled
    Tool: Bash
    Steps: Run the gated smoke command with the required env toggle and Lightpanda available.
    Expected: The process starts, connects, reaches the planned bootstrap milestone, and shuts down cleanly.
    Evidence: .sisyphus/evidence/task-9-lightpanda-smoke.txt

  Scenario: Smoke remains skipped/neutral when unavailable
    Tool: Bash
    Steps: Run the same test path without the enabling env toggle or without Lightpanda present.
    Expected: The smoke path is skipped cleanly and does not fail the default suite.
    Evidence: .sisyphus/evidence/task-9-lightpanda-smoke-error.txt
  ```

  **Commit**: YES | Message: `test(e2e): add gated lightpanda smoke path` | Files: gated smoke test files and any supporting test utilities

- [x] 10. Finalize packaging, exports, and operator-facing runtime diagnostics

  **What to do**: Finish the v1 integration by wiring monorepo exports, package dependencies, and runtime diagnostics. Ensure the selected engine, executable source, port, and major failure mode are visible in logs. Ensure no binary/cache artifacts are committed. Keep package boundaries clean so future docker/server modes can reuse names or option-group structure without changing the v1 local semantics.
  **Must NOT do**: Do not add future docker/server execution logic. Do not expose unstable internal helper APIs as public package contracts unless required.

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: final packaging and polish once implementation is complete.
  - Skills: `[]` - No special skill needed.
  - Omitted: `writing` - Docs are not the main deliverable of this task.

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: Final verification | Blocked By: 2, 8, 9

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `packages/wa-automate/package.json:17-32` - Runtime dependency wiring.
  - Pattern: `package.json:12-31` - Workspace/build/test scripts that must remain green.
  - Pattern: `packages/wa-automate/src/cli-runtime.ts:401-430` - Startup summary logging style.
  - Pattern: `packages/wa-automate/src/cli-runtime.ts:462-479` - Executable resolution and client-start logging flow.

  **Acceptance Criteria** (agent-executable only):
  - [ ] Workspace builds/tests resolve the new driver package and any new dependencies correctly.
  - [ ] Runtime logs identify Lightpanda engine selection, executable source, and chosen port.
  - [ ] No cache/binary outputs are added to tracked files.

  **QA Scenarios** (MANDATORY - task incomplete without these):
  ```
  Scenario: Workspace integration is clean
    Tool: Bash
    Steps: Run the relevant workspace build/test commands after final package/export wiring.
    Expected: The monorepo resolves the new package and no tracked binary/cache artifacts appear.
    Evidence: .sisyphus/evidence/task-10-packaging.txt

  Scenario: Runtime diagnostics are actionable
    Tool: Bash
    Steps: Run a targeted startup test or mocked CLI runtime path under Lightpanda.
    Expected: Logs include engine selection, executable source, and selected port; failures produce stable actionable output.
    Evidence: .sisyphus/evidence/task-10-packaging-error.txt
  ```

  **Commit**: YES | Message: `chore(lightpanda): finalize workspace wiring and diagnostics` | Files: manifests, exports, runtime logging, supporting utilities

## Final Verification Wave (MANDATORY — after ALL implementation tasks)
> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.
> **Do NOT auto-proceed after verification. Wait for user's explicit approval before marking work complete.**
> **Never mark F1-F4 as checked before getting user's okay.** Rejection or user feedback -> fix -> re-run -> present again -> wait for okay.
- [ ] F1. Plan Compliance Audit — oracle
- [ ] F2. Code Quality Review — unspecified-high
- [ ] F3. Real Manual QA — unspecified-high (+ playwright if UI)
- [ ] F4. Scope Fidelity Check — deep

## Commit Strategy
- Use small commits grouped by architectural boundary rather than one monolithic commit.
- Expected grouping:
  1. config + schema + normalization
  2. new driver-lightpanda package + lifecycle utilities
  3. runtime selection + capability gating
  4. tests + smoke coverage + packaging exports
- Do not commit generated binaries or cache artifacts.

## Success Criteria
- open-wa can be configured with `useLightpanda` from CLI and config-object flows using one normalized config model.
- The selected runtime starts exactly one Lightpanda child process per session and tears it down reliably.
- Port allocation is unique, bounded, and resilient to collisions.
- Lightpanda-backed sessions can reach supported automation flows without pretending rendering support exists.
- Unsupported rendering features fail early, clearly, and consistently.
- The implementation leaves room for future docker/server modes without shipping them now.
