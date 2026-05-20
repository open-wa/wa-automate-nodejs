# Implementation Plan: Bootstrap Injection Order Parity

- **ID**: `bootstrap-injection-order-parity`
- **Objective**: Restore legacy bootstrap page-mutation order (`goto -> launch bindings -> helper slot -> wapi.js -> launch.js`) to ensure maximum compatibility with the legacy WAPI environment and avoid "Identifier already declared" errors during reload/start loops.
- **Owner**: sisyphus
- **Status**: completed
- **Priority**: high
- **Verification**: `packages/core/test/unit/bootstrapContract.test.ts`

## 🎯 Target Sequence
The following sequence has been audited and enforced in `createClient.ts`:

1.  **[x] 01: Auth Logic Selection** (Initial probe for session data/QR requirement)
2.  **[x] 02: Goto (WA Web URL)** (`transport.navigate()`)
3.  **[x] 03: Register Local Bindings** (Expose Node-side functions pre-injection)
4.  **[x] 04: Helper Slot Occupation** (Init scripts in-page)
5.  **[x] 05: WAPI Injection** (`transport.injectWapi()`)
6.  **[x] 06: Pre-auth Launch/Settle Gating** (Post-injection capability validation)
7.  **[x] 07: Authentication Trigger** (`waitForAuthentication()`)
8.  **[x] 08: Post-Auth Runtime Reconciliation** (`reconcilePostAuthRuntime()`)
9.  **[x] 09: Live Patching (Phase I - Core)** (`applyLivePatchArtifacts()`)
10. **[x] 10: Post-patch Integrity Gate** (Integrity validation stage)
11. **[x] 11: License Overlay Injection** (`applyLicenseArtifact()`)
12. **[x] 12: Live Patching (Phase II - Init)** (`applyDeferredInitPatchArtifact()`)
13. **[x] 13: Store Settle Gate** (Wait for `window.Store.Msg` availability)
14. **[x] 14: Client Finalization** (`runFinalizationHooks()`)
15. **[x] 15: Event Bridge Activation** (`activateRuntimeEventBridge()` - Wire WAPI listeners)
16. **[x] 16: Readiness Signal** (`client.ready` emission)

## 🛠️ Execution Phases

### Phase 1: Test Instrumentation [COMPLETED]
- [x] Create `bootstrapContract.test.ts` as a sequence-sensitive harness.
- [x] Mock `Transport` methods to record execution timestamps.
- [x] Assert that `injectWapi` occurs after `navigate`.
- [x] Assert that `applyLivePatchArtifacts` occurs after `auth`.

### Phase 2: CreateClient State Machine Refactor [COMPLETED]
- [x] Flatten `createClient.ts` start logic into a linear async block.
- [x] Implement `runValidationStage` helper for phase-gating.
- [x] Enforce `post_injection` vs `post_patch` vs `post_overlay` validation separation.

### Phase 3: Bridge Activation Timing Fix [COMPLETED]
- [x] Split `registerRuntimeEventBridgeBindings` (Phase 1: Node-side) from `activateRuntimeEventBridge` (Phase 2: Browser-side).
- [x] Move Activation to Step 15 (post-init-patch).
- [x] Verify that `onStateChanged` is not wired until patches are verified.

### Phase 4: Store Settle Gate Implementation [COMPLETED]
- [x] Add 15s timeout wait for `window.Store.Msg`.
- [x] Integrate gate between License and Finalization.
- [x] Add repair attempt logic for missing store.

### Phase 5: Verification Wave [COMPLETED]
- [x] Run `pnpm --filter @open-wa/core test`.
- [x] Verify `task-17-ready-ordering.txt` evidence.
- [x] Manual check of `createClient.ts` audit comments.

### Phase 6: Release Cleanup [COMPLETED]
- [x] Remove old `InjectionController` legacy hooks.
- [x] Update documentation with new lifecycle diagram.
- [x] Checkpoint into `.sisyphus/evidence/`.
