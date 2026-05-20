# Gapfiller Learnings

## 2026-04-02 Session Start - Codebase Map

### Key Source Files
- `packages/core/src/createClient.ts` - Main bootstrap entry (start/stop lifecycle)
- `packages/core/src/transport/Transport.ts` - Browser/page/injection transport
- `packages/core/src/session/index.ts` - Thin SessionManager (DISCONNECTED/STARTING/AUTHENTICATING/READY/STOPPED)
- `packages/core/src/events/eventMap.ts` - Rich event vocabulary (declared-only for many lifecycle events)
- `packages/client/src/Client.ts` - High-level facade wrapping OpenWAClient

### Critical Gaps Identified
1. `Transport.injectWapi()` is a stub: hardcoded `const success = true`, no real injection
2. `createClient.start()` goes STARTING -> initialize -> navigate -> AUTHENTICATING -> waitForQr -> injectWapi -> READY with zero depth
3. SessionManager is thin: only tracks state string, no validation/repair
4. No patch lifecycle, no license lifecycle, no validation/finalization
5. READY is premature: emitted right after stub injection

### Event Map Already Has Vocabulary For
- `launch.wapi.inject.before/after` - exists but backed by stub
- `launch.patch.init.before/after` - declared only
- `launch.license.preload.before/after` - declared only
- `launch.license.check.before/after` - declared only
- `launch.session.validityCheck.before/after` - declared only
- `launch.client.finalize.before/after` - declared only
- `session.reinject.*` events - declared only

### Legacy Contract (from pseudo.md files)
- initializer.ts has 16 phases with retries, recursion, auth races
- patch_manager.ts has preload-then-inject pattern for patches AND licenses
- launch_checks.ts has integrity verification
- Key pattern: preload artifacts early, inject only after session validity

### Test Infrastructure
- vitest configured in packages/core/vitest.config.ts
- Tests in `packages/core/test/` directory (unit/ and e2e/ subdirs)
- Existing tests: PluginHost.test.ts, createClient.e2e.test.ts

### Architecture Pattern
- `@open-wa/core` owns: createClient, Transport, SessionManager, Events, Plugins
- `@open-wa/client` wraps core with domain methods (messaging, groups, etc.)
- `@open-wa/wa-automate` is CLI/Easy API host
- Driver interface (`@open-wa/driver-interface`) abstracts browser ops

## 2026-04-03 Task 2 - Injection path learnings

- The contract harness fake page only reports capability through string-based `evaluateScript` probes, so explicit post-injection probe calls are the safest way to prove runtime activation without weakening the runtime contract.
- A minimal Phase D repair seam can stay scoped by retrying injection only when runtime capability remains absent after the first pass; explicit injection exceptions should still classify as fatal blockers immediately.
- Reading `launch.js` dynamically from a resolved candidate path avoids keeping the active path ceremonial while staying compatible with the current repo/package layout during targeted contract runs.

## 2026-04-03 Manual QA rerun after blocker-fix pass

- A real Node process launched from `/tmp` and importing `packages/core/dist/index.cjs` was able to run `createClient().start()` through runtime injection, patch attestation, license lifecycle, and finalization without any `launch.js` resolution failure, which confirms the module-relative `dist/lib/launch.js` path is no longer tied to repo cwd.
- The `Client` facade can be constructed with `openwaClient.getTransport()` before startup and still succeeds after `facade.start()` because the same transport object becomes initialized in place; a post-start `facade.evaluate((value) => value + 1, 41)` returning `42` is a strong end-to-end proof of the intended CLI transport reuse path.
