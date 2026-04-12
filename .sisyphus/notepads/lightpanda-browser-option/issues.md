
- Task 8 blocker (pre-existing, not Lightpanda-related): `@open-wa/core` suite has pre-existing failures in `assetTruth`, `injectionController`, `patchLifecycleSemantics`, `runtimeEventBridge` suites. Lightpanda-specific `bootstrapContract` tests pass.
- Task 9 blocker (environment): Workspace lacks optional runtime deps (`@lightpanda/browser`, `puppeteer`) required for real Lightpanda smoke tests. The gated smoke test exists but stays skipped/neutral here.
- Task 10: ✅ COMPLETE - No blockers. Workspace wiring, exports, and runtime diagnostics are finalized.
