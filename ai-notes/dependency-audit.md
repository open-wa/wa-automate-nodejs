# Dependency Audit for `wa` (pnpm workspace)

**Date:** 2026-03-30  
**Repository:** `/Users/Mohammed/projects/tools/wa`  
**Package manager:** `pnpm`  
**Inputs used:**

- workspace manifests under `packages/*`, `apps/*`, `integrations/*`
- `pnpm outdated -r`
- `pnpm why -r ...`
- `pnpm-lock.yaml` deprecation markers

---

## Executive Summary

This repo’s dependency situation is not primarily a “version bump everything” problem.

It is a mix of four different problems:

1. **Foundational architecture smells**
   - `@open-wa/legacy` still sits under too much of the v5 graph
2. **Actually deprecated dependencies**
   - especially old `@types/*` stubs and older lint/build stacks
3. **Duplicated dependency strategies**
   - ESLint + Biome, Jest + Vitest, Vite + Docusaurus + Rollup + tsup + plain `tsc`
4. **Likely stale / low-value dependencies**
   - wrappers, old integrations, and dependencies inherited from transitional packages

The highest-signal conclusion is:

> **The biggest dependency problem is not outdated patch versions. It is that legacy/transitional packages still pull old ecosystems into the v5 graph.**

---

## How To Read This Audit

This document groups dependencies into:

- **A. Remove / redesign first**
- **B. Deprecated or clearly problematic**
- **C. Old but fine for now**
- **D. Duplicate strategy / consolidation opportunities**
- **E. Needs manual confirmation before removal**

Because this repo uses **pnpm**, the audit also pays attention to:

- `workspace:*` relationships
- which packages are dragging old trees into the graph
- where transitive deprecated packages are really coming from

---

## A. Remove / Redesign First

## 1. `@open-wa/legacy` as a foundational dependency

### Why it matters

`pnpm why -r @open-wa/legacy` shows that a large part of the v5 workspace still reaches `legacy` indirectly through `schema`, `core`, `client`, `domain`, `wa-automate`, wrappers, integrations, and orchestrator apps.

### Evidence

- `packages/schema/package.json:46-48`
- `packages/core` depends on `@open-wa/schema`, which depends on `@open-wa/legacy`
- `packages/client` and `packages/domain` depend on `schema`, so they inherit the same legacy subtree
- integrations and wrappers also inherit that path

### Why this is high priority

This one dependency keeps a large legacy ecosystem alive transitively:

- old axios chains
- old Express-era helper dependencies
- old devtools/tunnel-related packages
- older testing/linting ecosystems in the legacy package

### Recommendation

Treat this as the **#1 dependency-architecture cleanup item**.

Not “upgrade later” — **reduce or remove it from v5-owned packages**.

---

## 2. `apps/orchestrator-cli` dependency stack

### Why it matters

This app still depends on:

- `@open-wa/legacy`
- `express`
- `hono`
- logging/middleware packages around an old server model

### Evidence

- `apps/orchestrator-cli/package.json:16-32`

### Recommendation

This app should be classified as one of:

1. active v5 surface to modernize,
2. transitional surface,
3. archive candidate.

Until that decision is made, its dependency tree will keep dragging old server dependencies into the workspace.

---

## 3. `apps/docker` using published v4 package

### Why it matters

`apps/docker` depends on:

- `@open-wa/wa-automate 4.76.0`

This is not just “old”; it is a direct v4 product dependency living inside the v5 monorepo.

### Evidence

- `apps/docker` from `pnpm why -r`

### Recommendation

Either:

- move it out of the main workspace,
- upgrade it to the v5 path,
- or mark it clearly as historical/testing only.

Otherwise the workspace dependency story stays fundamentally confused.

---

## B. Deprecated or Clearly Problematic Dependencies

These are not just “behind latest.” They are deprecated, obsolete, or structurally suspicious.

## 1. Deprecated type stub packages

### Directly flagged by `pnpm outdated -r`

- `@types/json5` → deprecated
- `@types/socket.io` → deprecated
- `@types/marked` → latest says deprecated
- `@types/mime` → latest says deprecated
- `@types/uuid` → latest says deprecated

### Why this matters

These packages usually indicate one of two things:

- the underlying library ships its own types now
- the code is still tied to older versions/usages

### Recommendation

Audit and remove these first before doing any broad “update all types” pass.

---

## 2. Old ESLint ecosystem in legacy / Node-RED

### Evidence

- `@typescript-eslint/eslint-plugin` 5.x
- `@typescript-eslint/parser` 5.x
- `eslint` 8.x
- `eslint-config-prettier` 8.x
- `eslint-plugin-jest` 24.x
- `eslint-plugin-prettier` 3.x

Main dependents:

- `@open-wa/legacy`
- `@open-wa/node-red`

### Why this matters

This is not just version lag. It is a sign these packages are still tied to an older lint/tooling era.

### Recommendation

Do not prioritize upgrading this stack in place unless those packages are confirmed as long-term maintained surfaces.

If they are transitional, isolate or retire them instead.

---

## 3. Old Rollup/plugin stack in `integrations/node-red`

### Evidence

- `rollup` 2.79.2
- `@rollup/plugin-typescript` 8.5.0

### Why this matters

This is one of the oldest explicitly bundler-driven stacks in the repo.

### Recommendation

Do not do patch-only maintenance here forever. Either:

- modernize this integration intentionally, or
- classify it as lower-priority legacy integration

This package is also the strongest direct Rolldown pilot candidate, so its dependency health is strategically important.

---

## 4. Deprecated / noisy transitive packages in lockfile

`pnpm-lock.yaml` still contains many deprecation markers, including signals around:

- old Babel proposals
- old glob/rimraf/tar lines
- `request`
- old `superagent` / `supertest`
- old `uuid`
- old `multer`
- deprecated polyfill-era packages

These should not be treated as all equally important.

### Recommendation

Prioritize the ones rooted in packages you actually plan to keep.

Do **not** spend time cleaning transitive deprecations under packages you may retire.

---

## C. Old but Fine for Now

These are version-lag items, but they are not urgent architectural problems on their own.

Examples from `pnpm outdated -r`:

- `@hono/node-server`
- `socket.io`
- `socket.io-client`
- `axios`
- `cosmiconfig`
- `zod`
- `zod-to-json-schema`
- `playwright`
- `@elastic/elasticsearch`
- `react`, `react-dom`, `@types/react`
- `tailwindcss`, `@tailwindcss/vite`
- `vite-tsconfig-paths`
- `vite`, `@vitejs/plugin-react`
- `fumadocs-*`
- `figlet`, `chalk`, `dotenv`, `cors`

### Recommendation

Do not confuse these with the main dependency problem.

These should be handled as:

- normal update cadence,
- or app/package-specific modernization,
- after the architecture-level dependency graph is cleaner.

---

## D. Duplicate Strategy / Consolidation Opportunities

## 1. Multiple test ecosystems

Current state:

- **Vitest** in active v5 packages (`core`, `client`, `domain`, `config`, `cli`, `session-sync`)
- **Jest/ts-jest** in `legacy`, `schema`, `socket-client`, `node-red`, `wa-automate`

### Recommendation

The repo should eventually decide:

- which packages are “modern v5 packages” that should converge on the Vitest-like path
- which older packages are intentionally staying on Jest for now

This is more important than upgrading Jest patch versions.

---

## 2. Multiple lint ecosystems

Current state:

- ESLint broadly across packages/integrations
- Biome in `apps/docs`
- Prettier at root and in older packages/integrations

### Recommendation

Pick a future-facing lint strategy by category:

- active v5 packages
- legacy/transitional packages
- apps/docs

Without this, the repo will keep paying duplicated lint dependency cost forever.

---

## 3. Multiple bundling/build strategies

Current state:

- `tsc`
- `tsup`
- `vite`
- `rollup`
- Docusaurus build

This is not automatically bad, but it becomes bad when old strategies survive without a reason.

### Recommendation

For each build strategy, explicitly decide:

- active long-term
- transitional
- replace later

Especially:

- `integrations/node-red` Rollup path
- old docs build surface
- wrapper CLIs that are only `tsc`

---

## E. Probably Removable / Suspicious Dependencies

These require confirmation, but they are high-signal review targets.

## 1. `@types/socket.io`

### Why suspicious

`pnpm outdated -r` reports it as deprecated, and modern `socket.io` typically ships its own types.

### Current dependents

- root
- `@open-wa/wa-automate`

### Recommendation

Audit for actual type usage and remove if redundant.

---

## 2. `@types/json5`

### Why suspicious

Marked deprecated and likely unnecessary if the package provides types directly.

### Current dependent

- `@open-wa/utils`

### Recommendation

Audit/remove.

---

## 3. `@types/mime`, `@types/marked`, `@types/uuid`

### Why suspicious

All flagged deprecated or replaced by library-owned types.

### Recommendation

Remove if no longer needed, but only after checking the exact consuming code paths.

---

## 4. Duplicate `pico-s3` versions/ownership

### Why suspicious

The workspace shows both:

- `pico-s3 2.11.0` in the legacy subtree
- `pico-s3 1.1.4` directly in `@open-wa/integration-s3`

### Recommendation

This deserves explicit cleanup, because it is a classic “same concept, multiple eras” dependency smell.

---

## 5. Multiple Axios lines

### Why suspicious

The workspace graph still contains:

- `axios 1.13.2`
- `axios 0.26.1` via `@open-wa/wa-decrypt 4.4.0`
- `axios 0.21.4` via `localtunnel`
- `axios 0.21.1` via `node-red-admin`

### Recommendation

This is an architectural signal, not just a version signal. The old subtrees that keep these versions alive should be reviewed before any “just update axios” work.

---

## Highest-Signal Findings

If I had to reduce this to the most important dependency actions:

### 1. Reduce or isolate `@open-wa/legacy`

This is the single biggest dependency-graph problem in the repo.

### 2. Decide the fate of legacy/transitional packages before upgrading their ecosystems

Especially:

- `legacy`
- `orchestrator`
- `orchestrator-cli`
- `socket-client`
- `node-red`

### 3. Remove deprecated type stubs

These are easy, high-signal wins and reduce clutter.

### 4. Clean up duplicate/old dependency subgraphs caused by legacy packages

Especially Axios and older tooling families.

### 5. Stop letting wrapper/transitional packages define the repo’s dependency direction

The dependency strategy should be driven by the v5 spine, not by historical edges.

---

## Recommended Next Actions

### Short-term

1. Remove deprecated `@types/*` stubs where safe
2. Make a keep/retire decision for `legacy`, `orchestrator-cli`, `socket-client`, `node-red`
3. Document active vs transitional dependency families

### Medium-term

1. Reduce `legacy` from foundational dependency to edge compatibility dependency
2. Unify test/lint dependency strategy for maintained v5 packages
3. Clean duplicated old subtrees (Axios, old lint stack, old Rollup stack)

### Later

1. Large coordinated upgrades for app ecosystems (TanStack/Vite/Fumadocs/React)
2. Modernization of old integrations only if they remain strategically important

---

## Practical Conclusion

This repo does have outdated packages, but the bigger story is:

> **dependency debt here follows architecture debt.**

If you clean the architecture first — especially legacy reach, transitional packages, and duplicate surfaces — a large amount of dependency noise will disappear with it.
