# Implementation Plan: V5 Bootstrap Gapfiller

- **ID**: `gapfiller`
- **Objective**: Rebuild the lower-level v5 bootstrap/runtime path to satisfy the audited target contract (real runtime activation, patch lifecycle management, and truthful readiness gating). Ensure the "ceremonial" v5 lifecycle is replaced with actual operational obligations before `client.ready` is emitted.
- **Owner**: sisyphus
- **Status**: completed
- **Priority**: critical
- **Prerequisites**: [x] transport refactor, [x] state machine v1

## 📋 Objectives
- [x] **Contract Gating**: Readiness must stay blocked until runtime injection proved usable capability.
- [x] **Stateful Patching**: Live patches must be preloaded, applied, and verified as distinct lifecycle phases.
- [x] **License Overlay Integration**: License injection must be a non-blocking but required stage of finalized bootstrap.
- [x] **Validation & Repair**: Implement a dedicated `validateRuntime` stage that can trigger repair attempts (re-injection) before readiness.

## 🛠️ Implementation Tasks

### 1. Bootstrap Contract Harness [x]
- [x] Create `packages/core/test/unit/bootstrapContract.test.ts`.
- [x] Define the "Target Contract" as a series of assertions (e.g., `injectWapi` must happen before `appliedPatch`).
- [x] Implement a `FakeDriver` / `FakePage` to simulate slow/broken injection scenarios.

### 2. Runtime Injection Refactor [x]
- [x] Move `injectWapi` into `Transport.ts` as a primary lifecycle method.
- [x] Implement in-page capability probes (checking for `window.WAPI` methods directly).
- [x] **Evidence**: `task-1-verification.txt`

### 3. Patch Lifecycle Engine [x]
- [x] Implement `preloadLivePatchArtifacts` and `applyLivePatchArtifacts` in `Transport.ts`.
- [x] Add distinct `patch.apply.before` and `patch.apply.after` events.
- [x] Integrate with `PatchController` to handle fallback logic for missing artifacts.

### 4. License Overlay Integration [x]
- [x] Implement `applyLicenseArtifact` in the bootstrap flow.
- [x] Ensure license injection happens *after* patches but *before* finalization.
- [x] Handle "metadata-only" vs "full-unlock" license states without blocking readiness unnecessarily.

### 5. Integrity Validation Stage [x]
- [x] Implement `validateRuntimeUsability` with multi-stage probes:
  - Phase 1: Browser Globals (`window.WAPI` etc.)
  - Phase 2: Store Availability (`window.Store.Msg`)
  - Phase 3: Method Integrity (Detecting overwritten methods)
- [x] **Evidence**: `task-12-integrity-repair.txt`

### 6. Repair & Recovery Logic [x]
- [x] Implement `repairRuntimeIntegrity` which performs a targeted re-injection of the loader.
- [x] Integrated into `createClient.ts` as a catch-block repair pass before giving up on bootstrap.

### 7. Readiness Recalibration [x]
- [x] Update `SessionController` to gate `READY` state on a list of satisfied obligations.
- [x] Ensure `client.ready` is only emitted when `operational_readiness` is true (proven by browser probe).
- [x] **Evidence**: `task-17-ready-ordering.txt`

## 🌊 Final Verification Wave
- [x] **F1: Sequential order proof across three start scenarios (cold, resumed, recovery).**
- [x] **F2: Validation repair proof (simulating broken WAPI and verifying auto-repair).**
- [x] **F3: Bridge activation vs WAPI patch proof (confirming listeners are not wired to unpatched methods).**
- [x] **F4: Readiness gate against false-positive page loading.**

## 🏁 Phase Gates
- [x] **Build Pass**: `pnpm build` across all packages.
- [x] **Contract Pass**: `pnpm --filter @open-wa/core test/unit/bootstrapContract.test.ts` passes 100%.
- [x] **Parity Pass**: Verification manifest (`task-20-evidence-manifest.json`) reports `Status: go`.
