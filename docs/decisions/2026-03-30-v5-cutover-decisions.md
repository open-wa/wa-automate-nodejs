# v5 Cutover Decisions — 2026-03-30

**Status:** active decision record  
**Scope:** Easy API cutover, backward-compatibility boundaries, dependency cleanup  
**Related inputs:**

- `docs/exec-plans/active/v5-easy-api-cutover-plan.md`
- `ai-notes/v5-runtime-architecture-audit.md`
- `ai-notes/dependency-audit.md`
- `notes/issues/09-backward-compatibility.md`
- `notes/issues/10-backward-compat-anti-doc.md`

---

## Decisions made

### 1. Shared API ownership now lives in `@open-wa/api`

**Decision:** create `packages/api` and move reusable Easy API transport concerns there.

**Why:** the remaining architectural gap was not the CLI anymore; it was that `wa-automate` still owned the reusable HTTP layer directly. That conflicted with the cutover plan’s target package graph and kept embeddable API behavior coupled to the product package.

**Implemented result:**

- `packages/api` now owns:
  - `createApiServer`
  - `createApiMiddleware`
  - auth and rate-limit middleware
  - socket manager
  - runtime explorer/meta routes
  - OpenAPI/Postman generation helpers
  - client invocation helper
- `packages/wa-automate` now composes and re-exports this layer instead of owning it.

### 2. Compatibility infrastructure was added selectively, not blindly

**Decision:** implement only the compatibility behaviors that were already clearly required by the cutover docs, and do not add speculative broad shims.

**Why:** `notes/issues/09-backward-compatibility.md` explicitly warns against spraying wrappers across the repo before the contract is frozen.

**Implemented result:**

- added runtime support for:
  - `POST /api/<method>`
  - `POST /api` with `{ method, args }`
  - positional array args
  - named object args
  - optional session-in-path handling inside the reusable middleware layer
- preserved runtime explorer surfaces that were clearly in-scope:
  - `/api-docs/`
  - `/meta/swagger.json`
  - `/meta/postman.json`
  - `/meta/basic/commands`
  - `/meta/basic/listeners`
- did **not** add speculative global warnings or legacy-only wrapper surfaces.

### 3. `packages/schema` no longer depends on `@open-wa/legacy`

**Decision:** remove the direct `@open-wa/legacy` dependency from `packages/schema`.

**Why:** this was the highest-signal architecture/dependency conflict in the v5 spine. The source package no longer imports legacy code, so keeping the dependency would only preserve transitive debt.

**Implemented result:** the main `schema -> core/client/domain/wa-automate` chain is no longer forced to pull legacy as a foundational package dependency.

### 4. Deprecated catalog type stubs removed where the repo itself no longer needs them

**Decision:** remove deprecated catalog entries for `@types/socket.io` and `@types/uuid`.

**Why:** both libraries ship their own types in the versions this workspace targets, and these catalog entries were pure dependency-noise.

**Implemented result:** removed them from `pnpm-workspace.yaml`.

### 5. Orchestrator and legacy-package cleanup is documented, not forced in this slice

**Decision:** do not mutate `packages/orchestrator`, `apps/orchestrator-cli`, or `packages/legacy` in this slice.

**Why:** those surfaces are still transitional and were not part of the active v5 Easy API runtime owner. Changing them blindly would mix platform cleanup with product cutover.

**Implemented result:** they remain explicitly classified as transitional/historical debt rather than being silently treated as part of the v5 spine.

---

## Conflict resolutions

### Conflict: extract shared API package vs avoid compatibility-code sprawl

**Resolution:** extract reusable transport infrastructure, but keep compatibility policy narrow and deliberate.

This slice implemented the shared package and the clearly required invocation/runtime explorer surfaces, while deferring broad warning/shim behavior until the release contract is finalized.

### Conflict: dependency audit wanted cleanup, anti-doc warned against preserving debt

**Resolution:** clean the dependency graph only where the v5 spine already no longer needs the old dependency.

That is why `packages/schema` lost `@open-wa/legacy`, but orchestrator and legacy packages were left alone and documented as transitional.

### Conflict: runtime explorer parity vs exact legacy implementation

**Resolution:** preserve the runtime-facing surfaces, not the legacy Express implementation.

The new explorer/meta routes are generated from the v5 schema manifest and event registry rather than from legacy server code.

---

## Explicitly deferred

These remain intentionally deferred after this slice:

- `/meta/codegen/:language`
- `swagger-stats`
- media-serving parity routes
- Chatwoot/Twilio/BotPress/tunnel surface migration
- wrapper-package retirement (`packages/cli`, `apps/cli`)
- orchestrator modernization or archival
- broad deprecation-warning policy

Reason: each depends on product-scope or release-contract decisions that were not safe to guess in this code pass.

---

## Resulting package boundary

### `@open-wa/core`

- runtime primitives only

### `@open-wa/client`

- typed client capabilities and listener/runtime surface

### `@open-wa/schema`

- schema and manifest ownership
- no direct legacy dependency

### `@open-wa/api`

- reusable Easy API transport/runtime explorer layer

### `@open-wa/wa-automate`

- product package and CLI composition layer

---

## Practical release interpretation

After this slice, the remaining v5 work is no longer “make the main runtime real.”

It is now:

1. finish the deliberately deferred compatibility items,
2. decide the fate of transitional packages,
3. tighten verification and release-contract coverage around the now-shared API layer.

---

## Follow-up slice: compatibility warnings and orchestrator modernization

After the initial shared-API extraction, two previously deferred items were explicitly requested and implemented.

### 6. Compatibility shims and warnings were added deliberately

**Decision:** implement warning-first compatibility shims for the most recognizable legacy runtime surfaces.

**Implemented result:**

- deprecated auth alias usage (`key`, `api_key`) now emits runtime deprecation headers while still working
- legacy route shims now exist for:
  - `/swagger-stats`
  - `/swagger-stats/`
  - `/meta/codegen/:language`
  - `/meta/process/exit`
  - `/meta/process/restart`
  - `/disengage`
- those routes do not silently disappear; they now return redirect or structured deprecation guidance from the shared API layer

### 7. Orchestrator server ownership moved into `packages/orchestrator`

**Decision:** make `packages/orchestrator` the actual owner of orchestrator server assembly and reduce `apps/orchestrator-cli` to a dotenv/bootstrap wrapper.

**Why:** the app package had become another migration-era ownership split. The package already owned the core orchestration logic, so the Express server setup belonged there.

**Implemented result:**

- added `packages/orchestrator/src/server.ts`
- `apps/orchestrator-cli/src/index.ts` now only loads env and calls `startOrchestratorCli()`
- removed direct legacy/Hono/Express/runtime dependencies from `apps/orchestrator-cli/package.json`
- removed `@open-wa/legacy` from `packages/orchestrator/package.json`
- replaced the stale orchestrator PM2 session boot target of `@open-wa/wa-automate/bin/server.js` with resolved v5 CLI entry discovery in `resolveEasyApiEntryPath()`
- moved shared orchestrator runtime constants into `packages/orchestrator/src/runtime.ts` to avoid barrel/server cycles

### 8. Orchestrator hardcoded secret fallbacks were removed

**Decision:** stop auto-injecting baked-in fallback values for `API_KEY` and `SUPER_ADMIN_KEY`.

**Implemented result:**

- orchestrator server startup now warns when those env vars are missing instead of silently injecting fixed secrets
- Firebase bucket syncing no longer falls back to a hardcoded API key string
