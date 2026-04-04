# Gapfiller Issues

(none yet)

## 2026-04-03 Task 1 - Bootstrap contract harness findings

- Added `packages/core/test/unit/bootstrapContract.test.ts` as a contract-style harness for Section 27 phases D-G and Section 28 gap claims.
- Targeted evidence command: `pnpm exec vitest run test/unit/bootstrapContract.test.ts` (run from `packages/core`).
- Current active path fails the harness in the expected ways:
  - emits `client.ready` even when the fake runtime never exposes WAPI/runtime capability (Phase D / false readiness)
  - emits no patch lifecycle before readiness (Phase E)
  - emits no license lifecycle before readiness (Phase E)
  - emits no repair/reinject lifecycle for a recoverable post-injection invalidity scenario (Phase F)
  - emits no fatal bootstrap classification signal for a required injection failure (Phase F / failure classes)
  - emits `client.ready` before patch/license/validation/finalization obligations complete (Phase G)
- Verification note: `pnpm exec tsc -p tsconfig.json --noEmit` in `packages/core` still fails on pre-existing `@open-wa/plugin-sdk` resolution errors in `src/**`; this was not introduced by Task 1. `pnpm build` in `packages/core` still succeeds.

## 2026-04-03 Task 2 - Runtime injection activation evidence

- Exact files changed:
  - `packages/core/src/transport/Transport.ts`
  - `packages/core/src/createClient.ts`
- `Transport.injectWapi()` no longer hardcodes success; it now resolves `src/lib/launch.js`, executes that bootstrap payload in the page, and performs explicit capability probing with follow-up checks for `window.WAPI`, `window.Store && window.Store.Msg`, and `window.isSessionLoaded()`.
- `createClient.start()` now blocks readiness on failed capability proof, emits `launch.session.validityCheck.*`, performs one narrow reinjection retry when runtime capability is still absent after injection, and emits a fatal `error` event plus transitions away from readiness when required injection fails.
- Verification commands run from `packages/core`:
  - `pnpm exec vitest run test/unit/bootstrapContract.test.ts`
  - `pnpm exec tsc -p tsconfig.json --noEmit`
  - `pnpm build`
- Targeted contract result after Task 2 scope: `3 passed / 2 failed` in `test/unit/bootstrapContract.test.ts`.
- Remaining failing contract assertions are outside Task 2 scope and still point at later-phase gaps:
  - Phase E: missing patch lifecycle before `client.ready`
  - Phase G: `client.ready` still precedes patch overlay completion
- Typecheck still fails on pre-existing unresolved `@open-wa/plugin-sdk` module typings in `src/plugins/**` and `src/createClient.ts`; no new touched-scope diagnostics remained after the Task 2 changes.

## 2026-04-03 Task 3 - Patch lifecycle restoration evidence

- Exact files changed:
  - `packages/core/src/transport/Transport.ts`
  - `packages/core/src/createClient.ts`
  - `packages/core/src/events/eventMap.ts`
- Patch lifecycle restoration scope:
  - `Transport` now exposes a real patch preload phase (`preloadPatchArtifacts`) and a distinct patch apply phase (`applyPatchArtifacts`) with explicit applicability checks, per-patch apply events, aggregate outcomes, and blocking-failure classification.
  - `createClient.start()` now starts patch preload before runtime activation completes, applies patches only after runtime capability is proven, blocks readiness on required patch failure, and emits finalization after overlay work.
  - License lifecycle was not implemented; the lower-level runtime now emits explicit placeholder `missing` license preload/check status so the contract no longer mistakes “no lifecycle observed” for successful bootstrap progress.
- Exact verification commands run from `packages/core`:
  - `pnpm exec vitest run test/unit/bootstrapContract.test.ts`
  - `pnpm exec tsc -p tsconfig.json --noEmit`
  - `pnpm build`
- Verification results:
  - `pnpm exec vitest run test/unit/bootstrapContract.test.ts` => `5 passed / 0 failed`
  - `pnpm build` => passed
  - `pnpm exec tsc -p tsconfig.json --noEmit` still fails on pre-existing unresolved `@open-wa/plugin-sdk` module typings in `src/createClient.ts` and `src/plugins/**`; this was already present before Task 3 and is outside the patch lifecycle scope.
- Remaining contract failures after Task 3:
  - None in `packages/core/test/unit/bootstrapContract.test.ts`
- Remaining non-contract verification issues after Task 3:
  - Pre-existing package/type resolution failure for `@open-wa/plugin-sdk` during `tsc --noEmit`

## 2026-04-03 Task 4 - License lifecycle restoration evidence

- Exact files changed:
  - `packages/core/src/createClient.ts`
  - `packages/core/src/transport/Transport.ts`
  - `packages/core/src/events/eventMap.ts`
  - `packages/core/test/unit/bootstrapContract.test.ts`
- License lifecycle restoration scope:
  - `createClient.start()` now launches a real lower-level license preload/check/apply lifecycle in parallel with patch preload, instead of emitting the old placeholder-only `missing` sequence.
  - `Transport` now owns distinct license artifact preload, outcome classification, and runtime apply/inject steps that remain separate from generic patch lifecycle handling.
  - License outcomes are explicit and readiness-aware: `missing` is observable and non-blocking, while `invalid`, `expired`, preload failure, or apply failure block readiness before finalization.
  - The bootstrap contract harness now verifies valid-license apply ordering, explicit missing-license behavior, and invalid-license readiness blocking.
- Exact verification commands run from `packages/core`:
  - `pnpm exec vitest run test/unit/bootstrapContract.test.ts`
  - `pnpm exec tsc -p tsconfig.json --noEmit`
  - `pnpm build`
- Verification results:
  - `pnpm exec vitest run test/unit/bootstrapContract.test.ts` => `7 passed / 0 failed`
  - `pnpm build` => passed
  - `pnpm exec tsc -p tsconfig.json --noEmit` still fails on pre-existing unresolved `@open-wa/plugin-sdk` module typings in `src/createClient.ts` and `src/plugins/**`; no new touched-scope type failures were introduced by Task 4.
- Remaining failures after Task 4:
  - Pre-existing `@open-wa/plugin-sdk` type-resolution failure during `tsc --noEmit`

## 2026-04-03 Task 5 - Validation/repair/finalization depth evidence

- Exact files changed:
  - `packages/core/src/createClient.ts`
  - `packages/core/src/session/index.ts`
  - `packages/core/src/events/eventMap.ts`
  - `packages/core/src/transport/Transport.ts`
  - `packages/core/test/unit/bootstrapContract.test.ts`
- Validation/finalization depth scope:
  - `createClient.start()` now runs a distinct post-overlay runtime validation stage during finalization instead of treating overlay completion as readiness proof.
  - The lower-level validation helper now records richer session truth (capabilities, validation attempts, repairs, finalization outcome) in `SessionManager` while keeping the top-level `STATE` contract intact.
  - Repair behavior is explicit and observable for qualifying stale/unstable states in both post-injection and post-overlay validation via `launch.session.invalid.retry`, `session.stale.detected`, and `session.reinject.*` events.
  - `launch.client.finalize.after` now carries an explicit success/failure outcome, and unrecoverable post-overlay validation failure blocks readiness instead of ending in ceremonial finalization.
- Exact verification commands run from `packages/core`:
  - `pnpm exec vitest run test/unit/bootstrapContract.test.ts`
  - `pnpm exec tsc -p tsconfig.json --noEmit`
  - `pnpm build`
- Additional verification run:
  - `lsp_diagnostics` on:
    - `packages/core/src/createClient.ts`
    - `packages/core/src/session/index.ts`
    - `packages/core/src/events/eventMap.ts`
    - `packages/core/src/transport/Transport.ts`
    - `packages/core/test/unit/bootstrapContract.test.ts`
  - Result: no diagnostics found on touched files.
- Verification results:
  - `pnpm exec vitest run test/unit/bootstrapContract.test.ts` => `8 passed / 0 failed`
  - `pnpm build` => passed
  - `pnpm exec tsc -p tsconfig.json --noEmit` still fails on pre-existing unresolved `@open-wa/plugin-sdk` module typings in `src/createClient.ts` and `src/plugins/**`; no touched-scope LSP diagnostics were introduced by Task 5.
- Remaining failures after Task 5:
  - Pre-existing `@open-wa/plugin-sdk` type-resolution failure during `tsc --noEmit`

## 2026-04-03 Task 6 - Readiness truth recalibration evidence

- Exact files changed:
  - `packages/core/src/session/index.ts`
  - `packages/core/src/createClient.ts`
  - `packages/core/test/unit/bootstrapContract.test.ts`
  - `packages/api/src/createApiServer.ts`
  - `packages/api/src/createApiMiddleware.ts`
  - `packages/wa-automate/src/cli-runtime.ts`
  - `packages/wa-automate/src/server/__tests__/middleware.test.ts`
- Readiness recalibration scope:
  - `SessionManager` now tracks explicit lower-level readiness obligations (`runtimeUsable`, `patchLifecycle`, `licenseLifecycle`, `finalization`) and exposes a `getReadinessSnapshot()` view with pending/blocker details derived from actual runtime state.
  - `createClient()` now updates those readiness obligations as bootstrap phases complete or fail, and `OpenWAClient` exposes `getReadiness()` so downstream layers can consume truthful readiness instead of guessing from coarse state alone.
  - API/host surfaces now preserve host-vs-session distinction explicitly: `/health` reports host availability separately from session readiness, API lifecycle blocking now describes “session truly ready,” and the CLI wires the host readiness provider to the core runtime snapshot.
  - The bootstrap contract harness now asserts that readiness questions can be answered from runtime state after both successful and failed bootstrap paths.
- Exact verification commands run:
  - `pnpm exec vitest run test/unit/bootstrapContract.test.ts` (in `packages/core`) — passed after the readiness snapshot assertion fix (`8 passed / 0 failed`)
  - `pnpm exec tsc -p tsconfig.json --noEmit` (in `packages/core`) — failed with pre-existing `@open-wa/plugin-sdk` resolution errors
  - `pnpm build` (in `packages/core`) — passed
  - `pnpm build` (in `packages/api`) — passed
  - `pnpm build` (in `packages/wa-automate`) — passed
  - `pnpm exec vitest run src/server/__tests__/middleware.test.ts` (in `packages/wa-automate`) — failed before executing tests because Vitest could not resolve the pre-existing package export path `@open-wa/screencaster/server`
  - `lsp_diagnostics` on:
    - `packages/core/src/session/index.ts`
    - `packages/core/src/createClient.ts`
    - `packages/core/test/unit/bootstrapContract.test.ts`
    - `packages/api/src/createApiServer.ts`
    - `packages/api/src/createApiMiddleware.ts`
    - `packages/wa-automate/src/cli-runtime.ts`
    - `packages/wa-automate/src/server/__tests__/middleware.test.ts`
  - `lsp_diagnostics` result: no diagnostics found on touched files
- Remaining failures after Task 6:
  - Pre-existing `@open-wa/plugin-sdk` type-resolution failure during `pnpm exec tsc -p tsconfig.json --noEmit` in `packages/core`
  - Pre-existing `@open-wa/screencaster/server` package export resolution failure when running `pnpm exec vitest run src/server/__tests__/middleware.test.ts` in `packages/wa-automate`

## 2026-04-03 Task F2 - Code quality review findings

- Verdict basis: REJECT.
- Introduced/runtime-path findings:
  - `packages/core/src/transport/Transport.ts:929-943` resolves `launch.js` from `process.cwd()` candidates. `packages/core/package.json:5-16` exports only `dist/index.*`, and the repo currently contains only `packages/core/src/lib/launch.js` (no built `dist/lib/launch.js`). This means runtime injection can pass in-repo tests while failing for real consumers launched from another working directory.
  - `packages/wa-automate/src/cli-runtime.ts:204-216` creates a fresh `Transport` for `ClientFacade`, but `packages/client/src/Client.ts:181-186` routes browser-evaluated methods through that facade transport. The new transport is never initialized or bound to the page created inside `createClient()`, so session-backed API/client calls can fail with `Transport not initialized` even after readiness is reported.
  - `packages/core/src/transport/Transport.ts:125-145` and `packages/core/src/transport/Transport.ts:1014-1023` implement patch/license “application” as marker writes (`window.__OPENWA_PATCH_LIFECYCLE__`, `window.__OPENWA_LICENSE__`, `window.KEYTYPE`) rather than a real overlay source/application contract. This improves observability but still overstates parity with the intended runtime contract.
- Pre-existing unrelated issues observed during review:
  - `@open-wa/plugin-sdk` type-resolution failure in `packages/core` typecheck.
  - `@open-wa/screencaster/server` export-resolution failure in `packages/wa-automate` Vitest path.

## 2026-04-03 Task F3 - Real manual QA runtime evidence

- Verdict basis: REJECT.
- Real execution evidence that still blocks believable gapfiller completion:
  - `packages/core/src/transport/Transport.ts:929-943` still resolves `launch.js` from `process.cwd()`-relative candidates only. Command run from `packages/core`:
    - `node -e "const {Transport}=require('./dist/index.cjs'); const original=process.cwd(); process.chdir('/tmp'); try { console.log(Transport.resolveLaunchScriptPath()); } catch (error) { console.error(error.message); process.exit(1); } finally { process.chdir(original); }"`
    - Result: `Unable to resolve launch.js for runtime activation`
    - Why it matters: the built package can pass in-repo contract tests while failing the real runtime activation path for a consumer launched from a different working directory.
  - `packages/wa-automate/src/cli-runtime.ts:204-216` still constructs a fresh `Transport` for the client facade rather than reusing the initialized transport owned by `createClient()`. Command run from `packages/wa-automate` after building `packages/client`:
    - `node -e "const {Client}=require('../client/dist/index.cjs'); const {Transport}=require('../core/dist/index.cjs'); const events={on(){},emit(){}}; const logger={info(){},warn(){},error(){},debug(){}}; const driver={}; const transport=new Transport({driver,events,logger}); const client=new Client({client:{sessionId:'qa-smoke',events},transport}); client.evaluate(() => 42, undefined).then((value)=>{ console.log('UNEXPECTED_SUCCESS', value); process.exit(0); }).catch((error)=>{ console.error(error.message); process.exit(1); });"`
    - Result: `Transport not initialized`
    - Why it matters: the façade path used by `wa-automate` can report readiness while browser-evaluated client calls still target a dead transport.
- Real execution evidence that supports the implementation but does not override the blockers:
  - `packages/core`: `pnpm exec vitest run test/unit/bootstrapContract.test.ts` => `8 passed / 0 failed`
  - `packages/core`: `pnpm build` => passed
  - `packages/api`: `pnpm build` => passed
  - `packages/wa-automate`: `pnpm build` => passed
- Pre-existing unrelated failures observed again during manual QA:
  - `packages/core`: `pnpm exec tsc -p tsconfig.json --noEmit` still fails on unresolved `@open-wa/plugin-sdk`
  - `packages/wa-automate`: `pnpm exec vitest run src/server/__tests__/middleware.test.ts` fails before tests execute due package resolution/export issues around `@open-wa/api` / `@open-wa/screencaster/server`
  - `packages/api`: `node -e "const api=require('./dist/index.cjs'); console.log(Object.keys(api).sort().join(','));"` fails with `ERR_PACKAGE_PATH_NOT_EXPORTED` for `@open-wa/screencaster/server`
  - `packages/wa-automate`: `node -e "const wa=require('./dist/index.cjs'); console.log(Object.keys(wa).sort().join(','));"` fails with the same `ERR_PACKAGE_PATH_NOT_EXPORTED`; this appears consistent with the known pre-existing export problem outside the direct gapfiller runtime path.

## 2026-04-03 Final-review blocker fix pass - runtime truth hardening evidence

- Exact files changed:
  - `packages/core/src/transport/Transport.ts`
  - `packages/core/src/createClient.ts`
  - `packages/core/package.json`
  - `packages/core/scripts/copy-launch-script.mjs`
  - `packages/core/test/unit/bootstrapContract.test.ts`
  - `packages/wa-automate/src/cli-runtime.ts`
  - `packages/client/src/Client.ts`
  - `packages/client/src/__tests__/complex-methods.test.ts`
  - `packages/client/src/__tests__/listeners.test.ts`
- Concrete blocker fixes applied:
  - Launch bootstrap resolution no longer probes repo-relative `process.cwd()` candidates. `Transport` now resolves `launch.js` from module-relative locations, and the core build copies `src/lib/launch.js` into `dist/lib/launch.js` so the built package keeps a package-local activation asset.
  - `wa-automate` no longer constructs a second uninitialized `Transport` for `ClientFacade`; it now reuses the initialized transport owned by `createClient()` via `openwaClient.getTransport()`.
  - Patch/license behavior was narrowed to truthful claims: the built-in patch is now described as bootstrap patch attestation, and the license apply path is described as metadata injection rather than over-claiming full legacy overlay parity depth.
  - The bootstrap contract suite now includes a cwd-shift regression proving runtime activation still works after `process.cwd()` changes.
- Exact verification commands run:
  - `pnpm exec vitest run test/unit/bootstrapContract.test.ts` (in `packages/core`) — passed (`9 passed / 0 failed`)
  - `pnpm build` (in `packages/core`) — passed
  - `pnpm exec tsc -p tsconfig.json --noEmit` (in `packages/core`) — still fails only on the pre-existing `@open-wa/plugin-sdk` resolution problem
  - `node -e "const {Transport}=require('./dist/index.cjs'); const original=process.cwd(); process.chdir('/tmp'); try { console.log(Transport.resolveLaunchScriptPath()); } finally { process.chdir(original); }"` (in `packages/core`) — passed and returned `/Users/Mohammed/projects/tools/wa/packages/core/dist/lib/launch.js`
  - `pnpm exec vitest run src/__tests__/complex-methods.test.ts src/__tests__/listeners.test.ts` (in `packages/client`) — passed (`8 passed / 0 failed`)
  - `pnpm build` (in `packages/client`) — passed
  - `pnpm build` (in `packages/api`) — passed
  - `pnpm build` (in `packages/wa-automate`) — passed
  - `lsp_diagnostics` on touched source/test files — no diagnostics found on code files touched in this fix pass
- Remaining failures after the blocker fix pass:
  - `packages/core`: `pnpm exec tsc -p tsconfig.json --noEmit` still fails on the pre-existing unresolved `@open-wa/plugin-sdk` module/type resolution issue
  - Pre-existing package export issues around `@open-wa/screencaster/server` remain outside this blocker set; they were not re-opened or broadened here

## 2026-04-03 CLI license handoff fix evidence

- Exact files changed:
  - `packages/wa-automate/src/cli-runtime.ts`
- Scope of fix:
  - The CLI runtime already parsed and retained `config.licenseKey`, but it was not forwarding that value into `createClient(...)`.
  - `createClient(...)` now receives `licenseKey: config.licenseKey`, so the CLI surface truthfully wires license input into the lower-level runtime license lifecycle.
- Exact verification commands run:
  - `lsp_diagnostics` on `packages/wa-automate/src/cli-runtime.ts`
  - `pnpm build` (in `packages/wa-automate`) — passed
  - `pnpm exec vitest run test/unit/bootstrapContract.test.ts` (in `packages/core`) — passed (`9 passed / 0 failed`)
- Remaining failures after this fix:
  - No new failures introduced by this change
  - Pre-existing unrelated failures noted earlier in this notepad remain unchanged

## 2026-04-03 Transport-owned asset layout fix evidence

- Exact files changed:
  - `packages/core/src/transport/assets/launch.js` (moved from `packages/core/src/lib/launch.js`)
  - `packages/core/src/transport/Transport.ts`
  - `packages/core/scripts/copy-launch-script.mjs`
- Scope of fix:
  - The transport-owned injected asset `launch.js` was moved under the transport package tree to `packages/core/src/transport/assets/launch.js`.
  - `Transport.resolveLaunchScriptPath()` now resolves only transport-local asset locations (`src/transport/assets` during source runs and `dist/transport/assets` after build packaging).
  - The core build copy step now packages the asset into `packages/core/dist/transport/assets/launch.js` instead of the old `dist/lib/` location.
  - Runtime behavior stayed intact; this was an ownership/layout correction rather than a behavior rewrite.
- Exact verification commands run:
  - `lsp_diagnostics` on `packages/core/src/transport/Transport.ts`
  - `lsp_diagnostics` on `packages/core/scripts/copy-launch-script.mjs`
  - `pnpm exec vitest run test/unit/bootstrapContract.test.ts` (in `packages/core`) — passed (`9 passed / 0 failed`)
  - `pnpm build` (in `packages/core`) — passed
  - `node -e "const {Transport}=require('./dist/index.cjs'); const original=process.cwd(); process.chdir('/tmp'); try { console.log(Transport.resolveLaunchScriptPath()); } finally { process.chdir(original); }"` (in `packages/core`) — passed and returned `/Users/Mohammed/projects/tools/wa/packages/core/dist/transport/assets/launch.js`
- Remaining failures after this fix:
  - No new failures introduced by this change
  - Pre-existing unrelated failures noted earlier in this notepad remain unchanged

## 2026-04-03 Transport-local wapi asset migration evidence

- Exact files changed:
  - `packages/core/src/transport/assets/wapi.js` (copied from `/Users/Mohammed/projects/self/open-wa/open-wa-wa-automate-snapshot-legacy/src/lib/wapi.js`)
  - `packages/core/src/transport/Transport.ts`
  - `packages/core/scripts/copy-launch-script.mjs`
- Scope of fix:
  - Migrated the legacy `wapi.js` asset into the transport-owned asset tree alongside `launch.js` at `packages/core/src/transport/assets/`.
  - Updated the core asset packaging step to copy the full transport asset directory so both `launch.js` and `wapi.js` are shipped under `packages/core/dist/transport/assets/`.
  - `Transport` now has transport-local asset loading for both assets via a shared asset resolver/cache.
  - `injectWapi()` keeps the current low-risk order: run `launch.js` first, probe runtime capability, and only fall back to the transport-owned `wapi.js` asset if runtime capability is still missing.
- Exact verification commands run:
  - `lsp_diagnostics` on `packages/core/src/transport/Transport.ts`
  - `lsp_diagnostics` on `packages/core/scripts/copy-launch-script.mjs`
  - `pnpm exec vitest run test/unit/bootstrapContract.test.ts` (in `packages/core`) — passed (`9 passed / 0 failed`)
  - `pnpm build` (in `packages/core`) — passed
  - `ls "/Users/Mohammed/projects/tools/wa/packages/core/dist/transport/assets"` — showed both `launch.js` and `wapi.js`
  - `node -e "const {Transport}=require('./dist/index.cjs'); const original=process.cwd(); process.chdir('/tmp'); try { console.log(JSON.stringify({launch:Transport.resolveLaunchScriptPath(), wapi:Transport.resolveWapiScriptPath()})); } finally { process.chdir(original); }"` (in `packages/core`) — passed and returned both packaged transport-local asset paths
- Remaining failures after this fix:
  - No new failures introduced by this change
  - Pre-existing unrelated failures noted earlier in this notepad remain unchanged

## 2026-04-03 Scope fidelity reassessment after blocker-fix pass

- Verdict basis: REJECT.
- Faithful lower-level progress confirmed:
  - `packages/core/src/createClient.ts` now sequences runtime injection, patch lifecycle, license lifecycle, post-overlay validation, and finalization before `READY`/`client.ready`.
  - `packages/core/test/unit/bootstrapContract.test.ts` passes (`9 passed / 0 failed`) when run directly, so the lower-level D-G contract is executable rather than ceremonial.
  - `packages/core/src/transport/Transport.ts` launch script resolution is now package-relative instead of `process.cwd()`-relative, which removes the blocker identified in the earlier review wave.
- Remaining scope-fidelity concern:
  - `packages/wa-automate/src/cli-runtime.ts:182-190` still parses `--license-key` into config (`lines 55-56`) but does not pass `licenseKey: config.licenseKey` into `createClient(...)`. That leaves a top-level product surface claiming a lower-level license path that is not actually wired through the active CLI bootstrap, which conflicts with plan task 4 (`packages/wa-automate/**`) and the plan guardrail against accepting `licenseKey` in config/CLI without active lower-level meaning.
- Verification rerun for this reassessment:
  - `pnpm --filter @open-wa/core exec vitest run test/unit/bootstrapContract.test.ts` — passed (`9 passed / 0 failed`)
  - `pnpm --filter @open-wa/core build` — passed
  - `pnpm --filter @open-wa/wa-automate build` — passed
  - `lsp_diagnostics` on `packages/core/src/createClient.ts`, `packages/core/src/transport/Transport.ts`, `packages/core/test/unit/bootstrapContract.test.ts`, and `packages/wa-automate/src/cli-runtime.ts` — no diagnostics found

## 2026-04-03 Final scope fidelity reassessment after last two fixes

- Verdict basis: APPROVE.
- Boundary-drift concern resolved:
  - `packages/wa-automate/src/cli-runtime.ts:182-191` now passes `licenseKey: config.licenseKey` into `createClient(...)`, so the CLI/config surface no longer advertises a lower-level license path that gets dropped before bootstrap.
  - `packages/core/src/transport/Transport.ts:930-943` now resolves `launch.js` from transport-local packaged asset candidates, and `packages/core/scripts/copy-launch-script.mjs:7-11` packages the asset into `dist/transport/assets/launch.js`.
- Why this now satisfies plan scope fidelity:
  - The specific plan guardrail at `.sisyphus/plans/gapfiller.md:238-240` (“Do not accept licenseKey in config/CLI without giving it active lower-level meaning”) is now satisfied end-to-end.
  - The lower-level runtime contract work remains centered in `@open-wa/core` (real injection, distinct patch/license lifecycle, validation/finalization, truthful readiness), while `@open-wa/wa-automate` now faithfully forwards required runtime inputs instead of compensating or over-claiming.
  - The launch asset is now packaged with the transport/runtime layer rather than depending on repo layout, which keeps Phase D runtime activation truthful for real consumers as well as in-repo tests.
- Verification for this final reassessment:
  - `pnpm --filter @open-wa/core exec vitest run test/unit/bootstrapContract.test.ts` — passed (`9 passed / 0 failed`)
  - `pnpm --filter @open-wa/core build && node -e "const {Transport}=require('./packages/core/dist/index.cjs'); const original=process.cwd(); process.chdir('/tmp'); try { console.log(Transport.resolveLaunchScriptPath()); } finally { process.chdir(original); }"` — passed and returned `packages/core/dist/transport/assets/launch.js`
  - `lsp_diagnostics` on `packages/wa-automate/src/cli-runtime.ts` and `packages/core/src/transport/Transport.ts` — no diagnostics found

## 2026-04-03 Manual QA rerun after blocker-fix pass

- Requested blocker checks passed:
  - `launch.js` resolution from a non-repo cwd passed via a real `/tmp` Node run against `packages/core/dist/index.cjs`.
  - Client/facade transport reuse passed via the same `/tmp` run: `openwaClient.getTransport()` was null-backed before start, initialized after `facade.start()`, and successfully handled `facade.evaluate(...)`.
- Unrelated verification noise observed during this rerun:
  - Root blocker-focused build/test chain still stops on pre-existing `packages/core/test/unit/PluginHost.test.ts` failures unrelated to gapfiller runtime truth.
  - `packages/wa-automate` targeted Vitest run still fails before execution because of the pre-existing `@open-wa/screencaster/server` package export issue.
  - A separate packaging issue exists in the built ESM path for `@open-wa/client`: importing `packages/client/dist/index.mjs` from Node failed with `The requested module '@open-wa/domain' does not provide an export named 'AwaitMessagesOptions'`. The requested blocker validation still passed through the CJS build path.

## 2026-04-04 Task F2 - Current-state code quality re-review

- Verdict basis: APPROVE.
- Blocker re-check results on current repo state:
  - `packages/core/src/transport/Transport.ts` resolves injected assets from transport-local module-relative locations (`resolveAssetPath` + packaged `dist/transport/assets`) rather than `process.cwd()`, so the earlier launch asset ownership/runtime-resolution blocker is no longer present.
  - `packages/wa-automate/src/cli-runtime.ts` now passes both `licenseKey: config.licenseKey` into `createClient(...)` and `transport: openwaClient.getTransport()` into the `ClientFacade`, so the previous dropped-license-input and dead-facade-transport blockers are closed in the active bootstrap path.
  - `packages/core/src/createClient.ts`, `packages/core/src/session/index.ts`, and `packages/api/src/createApiServer.ts` / `createApiMiddleware.ts` now keep readiness tied to runtime validation + overlay/finalization obligations instead of coarse host availability alone; `/health` and API gating consume the readiness snapshot rather than guessing.
  - Patch/license behavior in `packages/core/src/transport/Transport.ts` is still intentionally shallow versus full legacy parity, but the code now labels that truthfully (`bootstrap patch attestation`, `metadata_injection`) instead of claiming deeper overlay semantics than are actually implemented.
- Review verification rerun on current repo state:
  - `packages/core`: `pnpm exec vitest run test/unit/bootstrapContract.test.ts` — passed (`12 passed / 0 failed`)
  - `packages/client`: `pnpm exec vitest run src/__tests__/complex-methods.test.ts src/__tests__/listeners.test.ts` — passed (`8 passed / 0 failed`)
  - `packages/core`: `pnpm build` — passed
  - `packages/api`: `pnpm build` — passed
  - `packages/wa-automate`: `pnpm build` — passed
  - `lsp_diagnostics` on reviewed runtime/bootstrap files — no diagnostics found

## 2026-04-04 F4 - Scope fidelity check

- Verdict basis: APPROVE.
- Scope-faithful lower-level runtime completion confirmed:
  - `packages/core/src/createClient.ts` now keeps `READY`/`client.ready` behind runtime injection proof, patch lifecycle, license lifecycle, post-overlay validation, and finalization, which matches tasks 2-6 instead of relying on host/API masking.
  - `packages/core/src/session/index.ts` provides runtime-backed readiness state (`runtimeUsable`, `patchLifecycle`, `licenseLifecycle`, `finalization`) and `packages/api/src/createApiServer.ts` + `packages/api/src/createApiMiddleware.ts` consume that snapshot as session truth while still exposing host availability separately in `/health`.
  - `packages/wa-automate/src/cli-runtime.ts` now forwards `licenseKey` into `createClient(...)` and reuses `openwaClient.getTransport()`, so the CLI no longer over-claims lower-level license/runtime readiness that core never actually received.
- Scope stayed constrained where the plan required it:
  - `packages/wa-automate/src/index.ts` broadens the top-level surface only to the existing user-facing `@open-wa/client` exports plus `createClient`/types, not the full `@open-wa/core` barrel, which matches the recorded Task 7 boundary decision.
- No major remaining in-scope blocker was found that would justify treating tasks 1-7 as overstated; unrelated package/export/test noise remains outside gapfiller scope unless reopened separately.


## 2026-04-04 F1 - Plan compliance audit

- Verdict: APPROVE.
- Tasks 1-6 are reflected in code, not just notes: `packages/core/test/unit/bootstrapContract.test.ts` covers phases D-G and cwd-safe asset resolution; `packages/core/src/createClient.ts`, `packages/core/src/transport/Transport.ts`, and `packages/core/src/session/index.ts` now implement runtime injection, patch/license lifecycle, validation/repair/finalization, and readiness gating.
- Earlier blockers were verified as fixed in source: transport asset resolution is module-relative with packaged asset copying (`packages/core/scripts/copy-launch-script.mjs`), and `packages/wa-automate/src/cli-runtime.ts` reuses `openwaClient.getTransport()` instead of constructing a dead facade transport.
- Task 7 is also satisfied at source level: `packages/wa-automate/src/index.ts` documents the narrowed top-level export choice by re-exporting client surface plus `createClient`, without turning `wa-automate` into a full `core` barrel.
- No new blocker was found that directly invalidates the completed Tasks 1-7 under the gapfiller plan.

## 2026-04-04 F3 - Real manual QA current-state runtime sweep

- Verdict basis: APPROVE.
- Executed runtime-facing scenarios on current repo state:
  - `packages/core`: `pnpm build && pnpm exec vitest run test/unit/bootstrapContract.test.ts` — passed (`12 passed / 0 failed`); covers bootstrap contract, readiness gating, repair/finalization flow, and cwd-safe activation regression.
  - `packages/client`: `pnpm build && pnpm exec vitest run src/__tests__/complex-methods.test.ts src/__tests__/listeners.test.ts` — passed (`8 passed / 0 failed`); keeps client facade/runtime call surfaces green.
  - `packages/api`: `pnpm build` — passed.
  - `packages/wa-automate`: `pnpm build && pnpm exec vitest run src/server/__tests__/middleware.test.ts` — passed (`5 passed / 0 failed`); confirms API lifecycle gating and `/health` host-vs-session readiness distinction are executable in the current repo state.
  - `packages/core` dist smoke from changed cwd via inline fake-driver bootstrap (`process.chdir('/tmp')` before `client.start()`) — passed with `{"scenario":"cwd-shift-bootstrap-start","status":"passed","ready":true,"readinessStatus":"ready","state":"READY"}`.
  - Workspace-root dist smoke for reused facade transport (`new Client({ client: openwaClient, transport: openwaClient.getTransport() })` before startup, then `await facade.start(); await facade.evaluate((n)=>n+1,41)`) — passed with `{"scenario":"client-facade-reused-transport","status":"passed","value":42,"state":"READY"}`.
- What the executed evidence proves:
  - No obvious zombie bootstrap was observed in the covered start path: the built core package reached `READY` only after runtime activation, patch lifecycle, license lifecycle, and post-overlay validation logs completed, even after `process.cwd()` changed to `/tmp`.
  - No dead client facade transport was observed in the active CLI-style reuse path: the facade built around `openwaClient.getTransport()` before startup became usable after startup and executed a browser-evaluated call successfully.
  - Host-vs-session readiness distinction is currently live and testable: `packages/wa-automate/src/server/__tests__/middleware.test.ts` now runs and passes, including `/health` and 503 gating for “session truly ready”.
- Non-blocker note:
  - I did not rely on the live-browser QR E2E in `packages/core/test/e2e/createClient.e2e.test.ts` for the verdict because it depends on external browser/WhatsApp conditions; the stronger deterministic contract + dist-smoke checks above already exercised the specific historical blockers directly.
