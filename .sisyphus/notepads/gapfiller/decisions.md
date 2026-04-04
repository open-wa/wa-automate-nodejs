# Gapfiller Decisions

## 2026-04-02 Architecture Decisions

### Bootstrap Phases (from Section 27)
- Phase A: Config normalization (partially satisfied)
- Phase B: Browser/page bootstrap (PASS)
- Phase C: Auth/session determination (PARTIAL)
- Phase D: Runtime injection (ABSENT - stub only)
- Phase E: Patch/license overlay (DECLARED-ONLY)
- Phase F: Session validation/repair (ABSENT)
- Phase G: Readiness gate (PARTIAL - premature)

### Implementation Strategy
1. Contract tests first (TDD) - tests should FAIL before implementation
2. Real injection replacing stub
3. Patch lifecycle + license lifecycle (can parallel after injection)
4. Validation/repair/finalization layer
5. Readiness gate moved behind all obligations
6. Export surface review last

### State Machine Enhancement
Current STATE: 'STARTING' | 'AUTHENTICATING' | 'READY' | 'DISCONNECTED' | 'STOPPED'
Need richer substates for phases D-G, but keep top-level STATE for backward compat.

### Failure Classification
- Fatal: browser failure, injection failure, terminal integrity failure
- Repairable: stale session, reinjection candidate, transient instability
- Degraded: optional overlays skipped (must be explicit)

## 2026-04-03 Task 7 - wa-automate export breadth decision

### Decision
- Broaden `@open-wa/wa-automate` only enough to expose the user-facing SDK surface already owned by `@open-wa/client`, plus the primary lower-level factory entrypoint `createClient` and its top-level types from `@open-wa/core`.
- Do not mirror the full `@open-wa/core` barrel from `wa-automate`.

### Rationale
- The clarified architecture says `@open-wa/wa-automate` remains the main npm entrypoint and should expose the important user-facing layers, including CLI runtime and SDK/client-facing surface.
- The same audit also keeps lower-level session/bootstrap fundamentals below the Easy API host layer, so re-exporting all of `core` would blur the boundary that Tasks 1-6 just restored.
- Re-exporting `@open-wa/client` gives `wa-automate` the intended main-package SDK ergonomics without speculatively promoting internal transport/session/plugin primitives into the top-level public contract.
- Re-exporting `createClient` keeps the main package aligned with the current split architecture by exposing the primary bootstrap factory without turning `wa-automate` into a full `core` alias.

### Exact files changed
- `packages/wa-automate/src/index.ts`
- `.sisyphus/notepads/gapfiller/decisions.md`

### Exact verification commands
- `pnpm build`
- `node -e "const wa = require('./dist/index.cjs'); const required = ['WAServer', 'APILifecycleManager', 'SessionManager', 'runCli', 'startCli', 'parseCliArgs', 'createApiServer', 'createApiMiddleware', 'Client', 'createClient']; const missing = required.filter((key) => !(key in wa)); if (missing.length) { throw new Error('Missing exports: ' + missing.join(', ')); } console.log('verified exports:', required.join(', '));"`
- `pnpm exec vitest run test/unit/bootstrapContract.test.ts`

### Verification result summary
- `wa-automate` build passed after the export adjustment.
- Targeted CJS export smoke check confirmed both the pre-existing host exports and the new SDK-facing exports are present.
- The bootstrap contract suite still passes after the export-surface adjustment, so the lower-level runtime contract was not regressed.

### Command history detail
- Direct barrel smoke attempt run first:
  - `node -e "const wa = require('./dist/index.cjs'); const required = ['WAServer', 'APILifecycleManager', 'SessionManager', 'runCli', 'startCli', 'parseCliArgs', 'createApiServer', 'createApiMiddleware', 'Client', 'createClient']; const missing = required.filter((key) => !(key in wa)); if (missing.length) { throw new Error('Missing exports: ' + missing.join(', ')); } console.log('verified exports:', required.join(', '));"`
  - Result: failed due to a pre-existing unrelated package export issue while loading `@open-wa/api` through `@open-wa/screencaster/server`.
- Isolated barrel-wiring smoke actually used for Task 7 verification:
  - `node -e "const Module = require('module'); const originalLoad = Module._load; class ApiServerStub {} const stubs = { '@open-wa/api': { ApiServer: ApiServerStub, createApiServer: Symbol.for('createApiServer'), createApiMiddleware: Symbol.for('createApiMiddleware') }, '@open-wa/client': { Client: Symbol.for('Client'), Collection: Symbol.for('Collection') }, '@open-wa/core': { createClient: Symbol.for('createClient') }, '@open-wa/schema': { Config: Symbol.for('Config'), ConfigSchema: Symbol.for('ConfigSchema') } }; Module._load = function(request, parent, isMain) { if (request in stubs) return stubs[request]; return originalLoad.apply(this, arguments); }; const wa = require('./dist/index.cjs'); const expected = { createApiServer: stubs['@open-wa/api'].createApiServer, createApiMiddleware: stubs['@open-wa/api'].createApiMiddleware, Client: stubs['@open-wa/client'].Client, createClient: stubs['@open-wa/core'].createClient, Config: stubs['@open-wa/schema'].Config, ConfigSchema: stubs['@open-wa/schema'].ConfigSchema }; const missing = Object.entries(expected).filter(([key, value]) => wa[key] !== value).map(([key]) => key); if (missing.length) throw new Error('Export wiring mismatch: ' + missing.join(', ')); const host = ['WAServer', 'APILifecycleManager', 'SessionManager', 'runCli', 'startCli', 'parseCliArgs'].filter((key) => !(key in wa)); if (host.length) throw new Error('Missing host exports: ' + host.join(', ')); console.log('verified exports:', [...Object.keys(expected), 'WAServer', 'APILifecycleManager', 'SessionManager', 'runCli', 'startCli', 'parseCliArgs'].join(', '));"`
  - Result: passed.
