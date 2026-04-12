# Remove Socket.IO From V5 And Repo

## TL;DR
> **Summary**: Remove Socket.IO from the active V5 runtime by replacing its two real responsibilities—RPC and event streaming—with HTTP and SSE, while leaving `/screencast` as the only raw WebSocket transport. After active-runtime stabilization, remove the remaining Socket.IO dependency, config, tests, docs, and legacy/integration surfaces from the wider repository.
> **Deliverables**:
> - HTTP+SSE replacement for active V5 runtime
> - Dashboards migrated off Socket.IO semantics
> - `@open-wa/socket-client` reimplemented without `socket.io-client`
> - Socket.IO removed from `@open-wa/api` / `@open-wa/wa-automate`
> - repo-wide cleanup of docs, tests, dependencies, and secondary consumers
> **Effort**: XL
> **Parallel**: YES - 4 waves
> **Critical Path**: Contract freeze → SSE server → client transport rewrite → dashboard migration → built-runtime validation → active runtime deletion → repo cleanup

## Context
### Original Request
Create a full Prometheus execution plan for removing Socket.IO completely from the codebase so it can be executed later.

### Interview Summary
- Hono itself was exonerated via a lab server.
- The screencast regression reproduces when Socket.IO shares the same server with the Hono/WebSocket stack.
- The active V5 runtime is not source-only; `wa-automate` starts in `src`, but `@open-wa/api` and `@open-wa/screencaster` resolve through built `dist` package exports.
- Socket.IO currently owns two real responsibilities in active V5:
  1. command RPC transport
  2. runtime event fanout / live updates
- The desired target architecture is fixed:
  - HTTP/REST for command RPC
  - SSE for events/live status
  - raw WebSocket only for `/screencast`
  - no Socket.IO in active V5 runtime

### Technical Decisions
- **Decision**: Use a dual-stack migration, not a big-bang deletion.
  - **Rationale**: Active V5 runtime, dashboards, and external consumers are currently coupled to Socket.IO semantics.
- **Decision**: Preserve the exported `SocketClient` surface initially while replacing internals with HTTP+SSE.
  - **Rationale**: Minimizes migration blast radius for dashboard, Node-RED, and other consumers.
- **Decision**: Separate “active V5 runtime removal” from “repo-wide cleanup.”
  - **Rationale**: The mixed source/dist runtime and secondary consumers make these different milestones.
- **Decision**: Treat Node-RED and legacy packages as secondary cleanup, not milestone-1 blockers.
  - **Rationale**: The immediate stability goal is active V5 runtime and screencast coexistence.

### Metis Review (gaps addressed)
- Required milestone separation between active runtime migration and repo cleanup
- Required explicit transport contract replacement for `register_ev`, RPC callbacks, and reconnect semantics
- Required runtime-resolution verification because CLI crosses into package `dist` exports
- Required exact acceptance criteria for HTTP RPC, SSE delivery, and `/screencast` non-regression
- Required explicit classification of external consumers like Node-RED and legacy packages

## Work Objectives
### Core Objective
Eliminate Socket.IO from the active V5 runtime without regressing command RPC, dashboard live updates, or `/screencast`, then remove the remaining Socket.IO footprint from the wider repository.

### Deliverables
- SSE event stream in `@open-wa/api`
- HTTP-backed remote client replacing Socket.IO internals in `@open-wa/socket-client`
- Dashboard apps migrated to HTTP+SSE
- Active V5 runtime with no `SocketIOServer` and no `/socket.io/` shared upgrade path
- Config/CLI cleanup removing `socketMode` / `--socket`
- Secondary cleanup across tests, docs, legacy code, Node-RED, and manifests

### Definition of Done
- Active V5 runtime contains no `socket.io` or `socket.io-client` usage
- `/screencast` remains the only raw WebSocket endpoint
- Runtime RPC works via HTTP only
- Runtime event streaming works via SSE only
- `socketMode` config and `--socket` CLI path are removed
- `apps/dashboard-neo` and `apps/dashboard` function without Socket.IO
- `@open-wa/socket-client` no longer depends on Socket.IO internally
- Screencast instability no longer reproduces in V5 shared-server runtime
- Repo manifests/docs/tests no longer require Socket.IO unless explicitly quarantined as legacy-only

### Must Have
- Mixed source/dist runtime validation in milestone 1
- A temporary compatibility layer for `SocketClient`
- Hard regression checks for `/screencast`
- Exact stop/go gates before active runtime deletion

### Must NOT Have
- No big-bang deletion of Socket.IO before replacement transport is proven
- No reliance on manual browser-only validation as the primary test gate
- No assumption that SSE is a perfect drop-in replacement without feature mapping
- No repo-wide dependency deletion before active runtime acceptance criteria pass

## Verification Strategy
> ZERO HUMAN INTERVENTION - all verification is agent-executed.
- Test decision: tests-after + targeted runtime validation
- QA policy: Every task includes executable happy-path and failure-path checks
- Evidence directory: `.sisyphus/evidence/task-{N}-{slug}.{ext}`

## Execution Strategy
### Parallel Execution Waves
Wave 1: contract freeze + server groundwork + dependency inventory
Wave 2: client transport rewrite + dashboard migration slices
Wave 3: built-runtime validation + active runtime Socket.IO removal
Wave 4: repo-wide cleanup (legacy/docs/tests/integrations)

### Dependency Matrix
- Task 1 blocks all downstream tasks
- Tasks 2 and 3 can run in parallel after Task 1
- Tasks 4 and 5 depend on Tasks 2-3
- Tasks 6-8 depend on Tasks 4-5
- Tasks 9-11 depend on Task 8
- Task 12 depends on Tasks 9-11

### Agent Dispatch Summary
- Wave 1: unspecified-high, backend-impl, pm-planner
- Wave 2: backend-impl, frontend-impl, db-impl (if event persistence added), unspecified-high
- Wave 3: qa-reviewer, debug-investigator, unspecified-high
- Wave 4: writing, quick, unspecified-high

## TODOs

- [x] 1. Freeze the replacement transport contract

  **What to do**: Produce an implementation-facing contract document that defines the post-Socket.IO behavior for command RPC, event streaming, reconnect/re-subscribe semantics, dashboard connection state, and `/screencast` isolation. Classify every active consumer as `runtime-blocker`, `compatibility-surface`, or `cleanup-only`.
  **Must NOT do**: Do not implement transport code. Do not delete any socket code in this task.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: cross-package dependency analysis and contract definition
  - Skills: `[]`

  **Parallelization**: Can Parallel: NO | Wave 1 | Blocks: 2,3,4,5,6,7,8,9,10,11,12 | Blocked By: none

  **References**:
  - `packages/api/src/socket/SocketManager.ts` - current server-side RPC and event fanout
  - `packages/socket-client/src/SocketClient.ts` - current client transport contract
  - `apps/dashboard-neo/src/lib/hooks/use-events.ts` - wildcard event expectations
  - `apps/dashboard-neo/src/lib/hooks/use-health.ts` - event-driven health/session update expectations
  - `packages/wa-automate/src/cli-runtime.ts` - event bridge registration and runtime defaults

  **Acceptance Criteria**:
  - [ ] A contract artifact exists listing current and target semantics for RPC, events, health, reconnect, and screencast
  - [ ] The artifact explicitly classifies Node-RED, dashboard apps, tests, and legacy packages
  - [ ] The artifact defines milestone 1 vs milestone 2 scope boundaries

  **QA Scenarios**:
  ```
  Scenario: Contract completeness audit
    Tool: Bash
    Steps: verify referenced files exist and contract artifact mentions each required surface
    Expected: every required active runtime file is represented in the artifact
    Evidence: .sisyphus/evidence/task-1-contract-audit.txt

  Scenario: Missing-surface failure check
    Tool: Bash
    Steps: grep the artifact for `SocketManager`, `SocketClient`, `use-health`, `cli-runtime`, `Node-RED`
    Expected: all terms present; absence is a failure
    Evidence: .sisyphus/evidence/task-1-contract-grep.txt
  ```

  **Commit**: NO

- [x] 2. Add SSE event infrastructure to `@open-wa/api`

  **What to do**: Introduce server-side SSE support for runtime events and health/status fanout while keeping the current Socket.IO path alive temporarily. Add a dedicated event hub or broadcaster in `packages/api/src/*`, wire it from `ApiServer`, and expose a stable SSE endpoint.
  **Must NOT do**: Do not remove Socket.IO yet. Do not touch `/screencast` transport.

  **Recommended Agent Profile**:
  - Category: `backend-impl` - Reason: API transport work in server package
  - Skills: `[]`

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 4,5,6,7,8 | Blocked By: 1

  **References**:
  - `packages/api/src/createApiServer.ts` - route registration and shared server wiring
  - `packages/api/src/health/HealthStore.ts` - existing event-to-health accumulator
  - `packages/wa-automate/src/cli-runtime.ts:527-536` - current event bridge hookup

  **Acceptance Criteria**:
  - [ ] A public SSE endpoint exists and streams runtime events without using Socket.IO
  - [ ] Existing `/health` endpoint remains functional
  - [ ] Socket.IO still coexists temporarily for backward compatibility

  **QA Scenarios**:
  ```
  Scenario: SSE happy path
    Tool: Bash
    Steps: start V5 runtime; curl -N the SSE endpoint; trigger one known event; capture stream output
    Expected: event arrives with stable name and JSON payload
    Evidence: .sisyphus/evidence/task-2-sse-happy.txt

  Scenario: SSE disconnect cleanup
    Tool: Bash
    Steps: connect to SSE; terminate client; inspect server logs or counters
    Expected: subscriber cleans up without crashing or leaking listeners
    Evidence: .sisyphus/evidence/task-2-sse-disconnect.txt
  ```

  **Commit**: YES | Message: `feat(api): add SSE event stream for runtime updates`

- [x] 3. Add transport-neutral runtime event publisher wiring

  **What to do**: Refactor the runtime event bridge so `cli-runtime.ts` publishes into an abstraction that can feed both SSE and, temporarily, Socket.IO. Ensure this abstraction is transport-neutral and not coupled to Socket.IO event names beyond temporary compatibility.
  **Must NOT do**: Do not delete `register_ev` or Socket.IO wiring yet.

  **Recommended Agent Profile**:
  - Category: `backend-impl`
  - Skills: `[]`

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 4,5,6,7,8 | Blocked By: 1

  **References**:
  - `packages/wa-automate/src/cli-runtime.ts`
  - `packages/api/src/socket/SocketManager.ts`
  - `packages/hyperemitter/src/core/HyperEmitter.ts`

  **Acceptance Criteria**:
  - [ ] Event bridge publishes to the new SSE path without regressing current behavior
  - [ ] Existing Socket.IO event delivery still works during coexistence

  **QA Scenarios**:
  ```
  Scenario: Dual-publish compatibility
    Tool: Bash
    Steps: start runtime; subscribe via SSE and existing socket client simultaneously; trigger events
    Expected: both consumers receive events during coexistence phase
    Evidence: .sisyphus/evidence/task-3-dual-publish.txt

  Scenario: No-session failure path
    Tool: Bash
    Steps: start runtime before client is ready; subscribe to SSE; inspect early lifecycle events
    Expected: no crash; stream remains valid while session initializes
    Evidence: .sisyphus/evidence/task-3-prebind.txt
  ```

  **Commit**: YES | Message: `refactor(runtime): publish events through transport-neutral bridge`

- [x] 4. Rewrite `@open-wa/socket-client` internals to HTTP+SSE

  **What to do**: Replace `socket.io-client` internals in `packages/socket-client/src/SocketClient.ts` with `fetch` for `ask()` and `EventSource` for event delivery while preserving the current exported `SocketClient` shape, proxy behavior, `ev`, and listener registration contract where feasible.
  **Must NOT do**: Do not rename the package in this milestone. Do not remove compatibility affordances unless explicitly documented.

  **Recommended Agent Profile**:
  - Category: `backend-impl`
  - Skills: `[]`

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: 5,6,7,8 | Blocked By: 1,2,3

  **References**:
  - `packages/socket-client/src/SocketClient.ts`
  - `packages/socket-client/src/TunnelSocketClient.ts` - existing non-Socket.IO transport patterns
  - `packages/api/src/createApiMiddleware.ts` - existing HTTP RPC surface

  **Acceptance Criteria**:
  - [ ] `packages/socket-client` no longer imports `socket.io-client`
  - [ ] `ask()` works over HTTP
  - [ ] `listen()` and `ev` work over SSE-backed events
  - [ ] reconnect/resubscribe behavior is explicit and tested

  **QA Scenarios**:
  ```
  Scenario: Remote client RPC happy path
    Tool: Bash
    Steps: build package; connect with replacement client; call one known method such as health/status retrieval
    Expected: HTTP-backed client returns expected data without socket transport
    Evidence: .sisyphus/evidence/task-4-rpc-happy.txt

  Scenario: Event resubscribe failure path
    Tool: Bash
    Steps: connect client; subscribe to events; restart server; observe reconnection and rehydration
    Expected: no duplicate listener delivery and no permanent event loss after reconnect
    Evidence: .sisyphus/evidence/task-4-reconnect.txt
  ```

  **Commit**: YES | Message: `refactor(socket-client): replace socket.io-client with HTTP and SSE`

- [x] 5. Migrate `apps/dashboard-neo` off Socket.IO semantics

  **What to do**: Replace all active uses of `client.socket`, raw socket lifecycle assumptions, and raw socket event subscriptions in `dashboard-neo` with the new HTTP+SSE client semantics. Preserve existing UX and `/health` fallback behavior.
  **Must NOT do**: Do not regress portal/screencast; it stays on raw WebSocket.

  **Recommended Agent Profile**:
  - Category: `frontend-impl`
  - Skills: `[]`

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: 8 | Blocked By: 1,2,3,4

  **References**:
  - `apps/dashboard-neo/src/lib/api-client.ts`
  - `apps/dashboard-neo/src/lib/hooks/use-socket.ts`
  - `apps/dashboard-neo/src/lib/hooks/use-health.ts`
  - `apps/dashboard-neo/src/lib/hooks/use-events.ts`
  - `apps/dashboard-neo/src/lib/hooks/use-message-toasts.ts`
  - `apps/dashboard-neo/src/lib/hooks/use-session.ts`

  **Acceptance Criteria**:
  - [ ] Dashboard-neo no longer depends on `client.socket` or raw Socket.IO events
  - [ ] Health/session/events/toasts continue to function
  - [ ] Portal remains isolated from the migration except for using the same base API URL

  **QA Scenarios**:
  ```
  Scenario: Dashboard happy path
    Tool: Playwright
    Steps: start dashboard-neo; verify health, session summary, events page, and toasts update under live runtime
    Expected: all views update without Socket.IO transport
    Evidence: .sisyphus/evidence/task-5-dashboard-neo.txt

  Scenario: Dashboard reconnect failure path
    Tool: Playwright
    Steps: open dashboard; restart runtime; observe recovery
    Expected: dashboard reconnects and resumes updates without duplicate events or permanent error state
    Evidence: .sisyphus/evidence/task-5-dashboard-neo-reconnect.txt
  ```

  **Commit**: YES | Message: `refactor(dashboard-neo): migrate live state to HTTP and SSE`

- [x] 6. Migrate `apps/dashboard` off direct `socket.io-client`

  **What to do**: Replace the old dashboard’s direct `io(...)` usage with the same transport-neutral client approach used for the main dashboard. If the old dashboard is no longer first-class, minimize scope but ensure it no longer blocks active runtime Socket.IO removal.
  **Must NOT do**: Do not leave an active runtime consumer secretly depending on `/socket.io/`.

  **Recommended Agent Profile**:
  - Category: `frontend-impl`
  - Skills: `[]`

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: 8 | Blocked By: 1,2,3,4

  **References**:
  - `apps/dashboard/src/lib/api-client.ts`

  **Acceptance Criteria**:
  - [ ] Legacy dashboard no longer imports or instantiates `socket.io-client`
  - [ ] Core command/event features still operate or the dashboard is explicitly downgraded and documented

  **QA Scenarios**:
  ```
  Scenario: Legacy dashboard compatibility
    Tool: Playwright
    Steps: launch legacy dashboard; execute one command and observe one live event update
    Expected: legacy dashboard no longer requires Socket.IO
    Evidence: .sisyphus/evidence/task-6-dashboard.txt

  Scenario: Unsupported-surface classification
    Tool: Bash
    Steps: if any feature is intentionally dropped, verify docs and UI messaging reflect that
    Expected: no silent breakage; unsupported surfaces are explicit
    Evidence: .sisyphus/evidence/task-6-dashboard-classification.txt
  ```

  **Commit**: YES | Message: `refactor(dashboard): remove direct socket.io-client transport`

- [x] 7. Add built-runtime verification for mixed source/dist V5

  **What to do**: Add verification steps and tests that exercise the actual CLI/runtime path (`wa-automate src` calling into package `dist`) so transport migration is proven in the real execution environment, not just in source-level unit tests.
  **Must NOT do**: Do not assume source edits are live until package build boundaries are respected.

  **Recommended Agent Profile**:
  - Category: `qa-reviewer`
  - Skills: `[]`

  **Parallelization**: Can Parallel: NO | Wave 3 | Blocks: 8,9 | Blocked By: 2,3,4,5,6

  **References**:
  - `packages/wa-automate/src/cli.ts`
  - `packages/wa-automate/src/cli-runtime.ts`
  - `packages/api/package.json`
  - `packages/socket-client/package.json`

  **Acceptance Criteria**:
  - [ ] Verification explicitly rebuilds and exercises `@open-wa/api` and `@open-wa/socket-client`
  - [ ] HTTP RPC, SSE events, and `/screencast` are validated in the real V5 runtime
  - [ ] There is no dependency on `/socket.io/` in the active runtime path

  **QA Scenarios**:
  ```
  Scenario: Real V5 runtime happy path
    Tool: Bash
    Steps: build affected packages; start CLI runtime in the same mode users run it; call one HTTP RPC endpoint; subscribe to SSE; open `/screencast`
    Expected: all three transports behave as designed with no Socket.IO involvement
    Evidence: .sisyphus/evidence/task-7-v5-runtime.txt

  Scenario: Dist-staleness failure check
    Tool: Bash
    Steps: verify active runtime resolves updated dist artifacts and not stale exports
    Expected: package resolution matches rebuilt artifacts; stale dist is treated as failure
    Evidence: .sisyphus/evidence/task-7-dist-audit.txt
  ```

  **Commit**: YES | Message: `test(runtime): validate HTTP and SSE transport in built V5 runtime`

- [x] 8. Remove Socket.IO from active V5 runtime

  **What to do**: Delete `SocketIOServer` server composition, `SocketManager`, `/socket.io/` upgrade exclusion logic, and any active runtime dependency on Socket.IO after the replacement stack is proven.
  **Must NOT do**: Do not perform this step before Task 7 passes.

  **Recommended Agent Profile**:
  - Category: `backend-impl`
  - Skills: `[]`

  **Parallelization**: Can Parallel: NO | Wave 3 | Blocks: 9,10,11,12 | Blocked By: 7

  **References**:
  - `packages/api/src/createApiServer.ts`
  - `packages/api/src/socket/SocketManager.ts`
  - `packages/api/src/types.ts`
  - `packages/wa-automate/src/server/hono-server.ts`

  **Acceptance Criteria**:
  - [ ] Active V5 runtime has zero `SocketIOServer` usage
  - [ ] `/socket.io/` is no longer special-cased in server upgrade handling
  - [ ] `/screencast` remains stable under live traffic

  **QA Scenarios**:
  ```
  Scenario: Active-runtime deletion happy path
    Tool: Bash
    Steps: run V5 runtime after Socket.IO deletion; verify `/health`, SSE, and `/screencast` all work
    Expected: active runtime operates normally with no Socket.IO transport present
    Evidence: .sisyphus/evidence/task-8-runtime-no-socketio.txt

  Scenario: Screencast coexistence regression check
    Tool: Playwright
    Steps: open portal against V5 runtime; verify frames, input, and sustained session behavior
    Expected: previous shared-server screencast failure no longer reproduces
    Evidence: .sisyphus/evidence/task-8-screencast.txt
  ```

  **Commit**: YES | Message: `refactor(api): remove Socket.IO from active V5 runtime`

- [x] 9. Remove config/schema/CLI Socket.IO surfaces

  **What to do**: Remove `socketMode`, `--socket`, related health metadata, and any startup reporting or migration logic that assumes Socket.IO is part of V5.
  **Must NOT do**: Do not leave dead config fields behind in schema or migration helpers.

  **Recommended Agent Profile**:
  - Category: `backend-impl`
  - Skills: `[]`

  **Parallelization**: Can Parallel: YES | Wave 4 | Blocks: 12 | Blocked By: 8

  **References**:
  - `packages/config/src/schema/config.ts`
  - `packages/schema/src/client-config.ts`
  - `packages/wa-automate/src/cli-runtime.ts`

  **Acceptance Criteria**:
  - [ ] `socketMode` no longer exists in active config schema
  - [ ] `--socket` no longer affects runtime behavior
  - [ ] Health/status payloads no longer expose socket-mode assumptions

  **QA Scenarios**:
  ```
  Scenario: Config happy path
    Tool: Bash
    Steps: start runtime with modern config lacking socket fields
    Expected: startup succeeds with no socket-specific warnings or defaults
    Evidence: .sisyphus/evidence/task-9-config.txt

  Scenario: Deprecated-flag failure path
    Tool: Bash
    Steps: start runtime with old socket-related flags/options
    Expected: either explicit deprecation handling or validation failure; never silent no-op ambiguity
    Evidence: .sisyphus/evidence/task-9-deprecations.txt
  ```

  **Commit**: YES | Message: `refactor(config): remove socket mode from V5 configuration`

- [x] 10. Migrate Node-RED and other integration consumers

  **What to do**: Replace remaining integration use of `@open-wa/socket-client` internals with the new transport stack or explicitly classify those integrations as phase-2 follow-up if the repo chooses to quarantine them.
  **Must NOT do**: Do not leave active integrations implicitly broken.

  **Recommended Agent Profile**:
  - Category: `unspecified-high`
  - Skills: `[]`

  **Parallelization**: Can Parallel: YES | Wave 4 | Blocks: 12 | Blocked By: 4,8

  **References**:
  - `integrations/node-red/src/nodes/owa-server/owa-server.ts`
  - `integrations/node-red/src/nodes/shared/types.ts`
  - `packages/plugin-sdk/src/types.ts`

  **Acceptance Criteria**:
  - [ ] Node-RED either works on the new transport or is explicitly marked unsupported in this milestone
  - [ ] Integration type surfaces no longer assume Socket.IO semantics

  **QA Scenarios**:
  ```
  Scenario: Integration happy path
    Tool: Bash
    Steps: run one Node-RED integration smoke path against the new transport
    Expected: command invocation and event handling still function or are intentionally disabled with explicit messaging
    Evidence: .sisyphus/evidence/task-10-node-red.txt

  Scenario: Integration classification failure path
    Tool: Bash
    Steps: verify unsupported integrations are documented and fail predictably
    Expected: no silent runtime breakage
    Evidence: .sisyphus/evidence/task-10-integration-classification.txt
  ```

  **Commit**: YES | Message: `refactor(integrations): migrate remaining socket-based consumers`

- [x] 11. Clean docs, tests, manifests, and legacy Socket.IO surfaces

  **What to do**: Remove or rewrite docs, package dependencies, tests, logger helpers, legacy code, and legacy-documented mirrors that still describe or require Socket.IO after the active runtime no longer depends on it.
  **Must NOT do**: Do not treat docs cleanup as proof of runtime cleanup; this is post-runtime removal.

  **Recommended Agent Profile**:
  - Category: `writing`
  - Skills: `[]`

  **Parallelization**: Can Parallel: YES | Wave 4 | Blocks: 12 | Blocked By: 8,9

  **References**:
  - `docs/docs/get-started/socketmode.md`
  - `docs/docs/get-started/docker.md`
  - `packages/socket-client/README.md`
  - `packages/logger/src/middleware/socket.ts`
  - `packages/legacy/src/cli/server.ts`
  - `packages/legacy/src/controllers/popup/index.ts`
  - `packages/legacy-documented/*`
  - package manifests in `packages/api`, `packages/wa-automate`, `packages/socket-client`, `apps/dashboard`, `apps/dashboard-neo`, `packages/legacy`

  **Acceptance Criteria**:
  - [ ] Docs no longer instruct users to run `--socket` or use Socket.IO clients
  - [ ] Active manifests no longer depend on `socket.io` or `socket.io-client`
  - [ ] Legacy surfaces are either migrated, removed, or explicitly quarantined

  **QA Scenarios**:
  ```
  Scenario: Dependency graph happy path
    Tool: Bash
    Steps: grep manifests for `socket.io` and `socket.io-client`; inspect active packages
    Expected: no active V5 manifest retains the dependency
    Evidence: .sisyphus/evidence/task-11-deps.txt

  Scenario: Docs stale-reference failure path
    Tool: Bash
    Steps: grep docs and READMEs for `--socket`, `socketMode`, `SocketClient.connect(`, `/socket.io/`
    Expected: only intentional historical references remain; stale active guidance is failure
    Evidence: .sisyphus/evidence/task-11-docs.txt
  ```

  **Commit**: YES | Message: `chore(repo): remove Socket.IO references from docs and dependencies`

- [x] 12. Final active-runtime and repo-wide decommission verification

  **What to do**: Run the final full verification sweep over the built V5 runtime, dashboards, integrations, docs, and dependency graph. Produce a decommission report proving Socket.IO is gone from the active runtime and any remaining repo references are intentional legacy artifacts only.
  **Must NOT do**: Do not mark removal complete if active runtime still has hidden Socket.IO package or route coupling.

  **Recommended Agent Profile**:
  - Category: `qa-reviewer`
  - Skills: `[]`

  **Parallelization**: Can Parallel: NO | Wave 4 | Blocks: none | Blocked By: 9,10,11

  **References**:
  - all files touched above
  - `packages/api/package.json`
  - `packages/socket-client/package.json`
  - `packages/wa-automate/package.json`

  **Acceptance Criteria**:
  - [ ] V5 runtime starts and operates without Socket.IO
  - [ ] `/screencast` remains stable in the shared-server runtime
  - [ ] Dashboards function with HTTP+SSE only
  - [ ] Package manifests and docs reflect the new transport architecture
  - [ ] Final decommission report exists under `.sisyphus/evidence/`

  **QA Scenarios**:
  ```
  Scenario: End-to-end happy path
    Tool: Bash + Playwright
    Steps: build affected packages; run V5 CLI runtime; verify HTTP RPC, SSE events, dashboard flows, and portal screencast
    Expected: full user-facing stack works with no Socket.IO dependency
    Evidence: .sisyphus/evidence/task-12-e2e.txt

  Scenario: Residual-socket audit failure path
    Tool: Bash
    Steps: grep active runtime packages and built artifacts for `socket.io`, `socket.io-client`, `/socket.io/`, `register_ev`, `SocketIOServer`
    Expected: no active runtime references remain; any leftover matches must be classified legacy-only
    Evidence: .sisyphus/evidence/task-12-residual-audit.txt
  ```

  **Commit**: YES | Message: `test(repo): verify full Socket.IO decommission`

## Final Verification Wave (MANDATORY — after ALL implementation tasks)
- [x] F1. Plan Compliance Audit — oracle
- [x] F2. Code Quality Review — unspecified-high
- [ ] F3. Real Manual QA — unspecified-high (+ playwright if UI)
- [x] F4. Scope Fidelity Check — deep

## Commit Strategy
- One commit per task or tightly-coupled task pair
- Never combine “introduce replacement transport” and “delete Socket.IO” in the same commit
- Rebuild `@open-wa/api` and `@open-wa/socket-client` after every package-level transport change before runtime verification

## Success Criteria
- Shared-server screencast instability no longer reproduces
- Active V5 runtime transport topology is simplified to HTTP + SSE + raw `/screencast` WS
- No active V5 package requires Socket.IO
- Wider repository cleanup is complete or explicitly quarantined
