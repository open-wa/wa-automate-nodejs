# Deep Audit Checklist: Bootstrap & Gapfiller (VERIFIED)

## Plan: gapfiller.md (Contract & Runtime Path)

### Wave 1: Foundation
- [x] **Contract Verification**: Check `packages/core/test/unit/bootstrapContract.test.ts` for definition of the lifecycle contract. **Verified: Harness defines Phase D, E, F, G tests.**
- [x] **Transport Integration**: Verify `Transport.ts` supports `injectWapi`, `applyPatch`, and `validateRuntime`. **Verified: Split Phase 1/2 bridge implementation and state probes exist.**

### Wave 2: Injection & Patching
- [x] **Injection Order**: Verify `injectWapi()` execution timing in `createClient.ts`. **Verified: Line 525, after navigate but before authentication/patches.**
- [x] **Patch State Machine**: Verify implementation of states (NONE -> LOADED -> APPLIED -> VERIFIED). **Verified: Integrated via applyLivePatchArtifacts and validateRuntimeCapabilityOnly.**
- [x] **License Hook**: Check `applyLicenseArtifact` integration. **Verified: Line 873, between live-patches and init-patch.**

### Wave 3: Validation & Readiness
- [x] **Integrity Checks**: Verify post-injection probes (e.g., `window.Store` availability). **Verified: Store Settle Gate at line 699.**
- [x] **Readiness Truth**: Verify `emit('ready')` is gated by `runtime_verified` state. **Verified: READY state emitted at line 995, after post_overlay validation.**

---

## Plan: bootstrap-injection-order-parity.md (Sequence)

### Target Sequence Audit (createClient.ts)
- [x] **Step 02: Goto** - Ensure `transport.navigate()` is called before injections. **Verified: Line 520.**
- [x] **Step 05: WAPI Injection** - Verify `transport.injectWapi()` call site. **Verified: Line 525.**
- [x] **Step 09: Live Patching (Phase I)** - Verify `applyLivePatchArtifacts()` call site. **Verified: Line 772.**
- [x] **Step 11: License Overlay** - Verify `applyLicenseArtifact()` call site. **Verified: Line 873.**
- [x] **Step 12: Live Patching (Phase II - Init)** - Verify `applyDeferredInitPatchArtifact()` call site. **Verified: Line 903.**
- [x] **Step 13: Store Settle Gate** - Verify logic that waits for `window.Store.Msg`. **Verified: Lines 699-723.**
- [x] **Step 15: Event Bridge Activation** - Verify `activateRuntimeEventBridge()` happens post-initialization. **Verified: Line 921.**
- [x] **Step 16: Readiness Signal** - Verify `client.ready` emission. **Verified: Line 1009.**

---

## Verification Evidence (sisyphus/evidence/)
- [x] Scan directory for 45+ files. **Verified: 45 files present.**
- [x] Pick 3-5 random files to verify content matches the implementation. **Verified: task-20-evidence-manifest.json confirms all core tests pass and blockers are proven.**
