# Rolldown and Oxc Assessment for `wa`

**Date:** 2026-03-30  
**Repository:** `/Users/Mohammed/projects/tools/wa`  
**Sources:**

- `https://rolldown.rs/llms-full.txt`
- `https://oxc.rs/llms-full.txt`

---

## Executive Summary

Both Rolldown and Oxc are relevant to this repository, but in **different ways**.

- **Rolldown** is most relevant as a **bundler/build-speed improvement**, especially where the repo already uses Vite or Rollup.
- **Oxc** is most relevant as a **linting and JavaScript/TypeScript tooling improvement**, especially where the repo still uses ESLint broadly.

The highest-value recommendation is:

1. **Use Oxc first** via **Oxlint** in the ESLint-heavy packages.
2. **Use Rolldown second** in the places that are already close to it:
   - the Vite apps, via the Vite upgrade path
   - `integrations/node-red`, which already has a Rollup editor build

This repo should **not** try to force Rolldown or Oxc everywhere at once.

---

## Current Tooling Reality in This Repo

## Frontend / app bundling

### Vite apps

These are already strong candidates for future Rolldown adoption because they are Vite-based today:

- `apps/dashboard/vite.config.ts`
- `apps/orchestrator-dashboard/vite.config.ts`
- `apps/docs/vite.config.ts`

All three are using Vite plugin ecosystems that include:

- `@vitejs/plugin-react`
- `vite-tsconfig-paths`
- `@tailwindcss/vite`
- TanStack Start/Vite integration
- `fumadocs-mdx/vite` in `apps/docs`

### Non-Vite docs surface

- `docs/` is still a Docusaurus app, not a Vite/Rollup app.

That makes it a weak direct Rolldown target unless the docs stack itself changes.

---

## Library/package builds

### `tsup` packages

Only a few packages are using a real bundler abstraction today:

- `packages/config/tsup.config.ts`
- `packages/utils/tsup.config.ts`

These are possible future Rolldown candidates, but not first-wave adoption targets.

### `tsc` packages

Most packages are still plain TypeScript compilation targets, not bundling targets:

- `packages/core`
- `packages/client`
- `packages/domain`
- `packages/wa-automate`
- `packages/cli`
- `packages/orchestrator`
- `packages/legacy`
- driver packages
- most integrations

These are **not** natural Rolldown targets yet, because replacing `tsc` with a bundler would be a workflow redesign, not a drop-in optimization.

---

## Existing Rollup usage

The clearest direct Rolldown pilot in this repo is:

- `integrations/node-red/rollup.config.editor.js`

Why this matters:

- it already uses Rollup
- Rolldown’s docs explicitly position it as Rollup-compatible in many areas
- the migration path here is much clearer than trying to swap out `tsc`-only package builds

---

## Existing linting reality

The repo still uses **ESLint broadly**:

- root `.eslintrc.json`
- package-local ESLint in many packages and integrations

Examples:

- `packages/core/package.json`
- `packages/client/package.json`
- `packages/domain/package.json`
- `packages/cli/package.json`
- `packages/legacy/package.json`
- `integrations/node-red/package.json`

At the same time, `apps/docs` already uses **Biome** for checks/formatting.

That means the repo is already living with **mixed lint/tooling strategies**, which makes Oxc a realistic opportunity for **lint consolidation**, not necessarily for parser/transformer replacement.

---

## What Rolldown Can Be Used For Here

## 1. Vite app acceleration (best medium-term fit)

### Why this is a fit

Rolldown is strongly aligned with the Vite ecosystem.

This repo has three app surfaces already using Vite:

- `apps/dashboard`
- `apps/orchestrator-dashboard`
- `apps/docs`

### Practical recommendation

Do **not** replace Vite directly.

Instead:

- track the Vite upgrade path where Rolldown becomes the underlying bundler story
- test that path first on:
  - `apps/dashboard`
  - `apps/orchestrator-dashboard`
- test `apps/docs` after that, because it has a richer plugin surface (`fumadocs-mdx`, prerender config, TanStack Start)

### Why not first on `apps/docs`

`apps/docs` has the heaviest plugin and content-processing setup of the three Vite apps, so it is the riskiest place to start.

---

## 2. Replace Rollup in the Node-RED editor build (best direct bundler pilot)

### Why this is the cleanest direct Rolldown candidate

`integrations/node-red` already uses Rollup explicitly:

- `build:editor` in `integrations/node-red/package.json`
- `integrations/node-red/rollup.config.editor.js`

This is the most natural “swap one bundler for another” experiment in the repo.

### What to evaluate

- support for the current custom editor bundling behavior
- plugin compatibility, especially around HTML/CSS/editor asset handling
- output parity
- watch-mode behavior

### Recommendation

If Rolldown is piloted anywhere directly first, this should be the first candidate.

---

## 3. Possible later replacement for `tsup` in selected packages

### Candidate packages

- `packages/config`
- `packages/utils`

### Why only later

These already work with `tsup`, and `tsup` is currently doing exactly what these packages need:

- dual output
- d.ts generation
- simple config

Switching them to Rolldown would only make sense if one of these becomes true:

- build performance is a measured pain point
- `tsup` becomes limiting
- the repo wants one more explicit bundler strategy across packages

### Recommendation

Do not prioritize this yet.

---

## What Rolldown Should NOT Be Used For Yet

### 1. Plain `tsc` packages

Most of the core runtime packages are not bundler-driven today. They are compiler-driven.

Do not force Rolldown into:

- `packages/core`
- `packages/client`
- `packages/domain`
- `packages/wa-automate`
- driver packages

unless the project deliberately decides to move those packages from “compiled libraries” to “bundled libraries.”

### 2. Docusaurus docs

`docs/` is not a direct Rolldown target in its current architecture.

### 3. Runtime/process boot surfaces

Rolldown should not be used as a substitute for the repo’s package/runtime ownership cleanup. It is a bundler, not an architecture fix.

---

## What Oxc Can Be Used For Here

## 1. Oxlint as the most immediate adoption path

This is the strongest Oxc opportunity in the repo.

### Why

The repo still has broad ESLint usage, and Oxc’s biggest immediate fit here is **linting speed and simpler lint execution**, especially for TS/JS packages.

### Best first targets

- `packages/core`
- `packages/client`
- `packages/domain`
- `packages/config`
- `packages/cli`
- driver packages
- `packages/session-sync`
- integrations that are still ESLint-based

### Why these first

- they are active v5 packages
- they are TypeScript-heavy
- they have existing lint scripts
- they are easier to standardize than legacy or old mixed-tool surfaces

---

## 2. Replace ESLint in `integrations/node-red` later, not first

`integrations/node-red` is a good Oxc candidate eventually, but it is not the cleanest first migration because it already has more tooling complexity:

- Rollup
- Jest
- TypeScript runtime/editor split
- older ESLint ecosystem usage

Recommendation:

- move modern v5 packages first
- migrate Node-RED after the Oxc approach is stable

---

## 3. Future parser/AST tooling possibilities

Oxc is broader than Oxlint, but this repo does **not** currently show a strong custom parser/AST transformation pipeline that obviously needs replacement.

So today, Oxc’s realistic use here is:

- **Oxlint first**
- parser/transform/minifier usage later only if a new internal tooling need appears

Examples where that might become relevant later:

- import/export contract audits
- codemods for package-surface cleanup
- generated-surface analysis
- monorepo-wide API compatibility analysis

But these are not first-wave adoption cases.

---

## What Oxc Should NOT Be Used For Yet

### 1. Replacing Biome in `apps/docs`

`apps/docs` already uses Biome. Replacing it with Oxc right now would increase inconsistency rather than reduce it.

### 2. Replacing TypeScript compilation

Oxc should not be treated as a direct substitute for the repo’s `tsc` package compilation flow at this stage.

### 3. Forcing a parser/transformer migration where there is no current AST tooling problem

Use Oxc where there is a real need, not because it is available.

---

## Recommended Adoption Order

## Phase 1 — Oxc / Oxlint

Use Oxc first via **Oxlint**, because this is the most immediate and lowest-risk win.

### Suggested order

1. pilot Oxlint on one or two active v5 packages
   - `packages/core`
   - `packages/client`
2. expand to the rest of the active v5 packages
3. document where Biome remains the better fit (`apps/docs`)
4. defer legacy/integration-heavy migrations until the lint policy is stable

### Expected value

- faster linting
- more consistent lint posture across v5 packages
- less ESLint overhead in the core codebase

---

## Phase 2 — Rolldown

Use Rolldown second.

### Suggested order

1. direct pilot in `integrations/node-red` editor bundling
2. indirect Vite-path pilot on `apps/dashboard`
3. `apps/orchestrator-dashboard`
4. `apps/docs` last among the Vite apps

### Expected value

- faster builds
- future alignment with the Vite ecosystem direction
- less bundler overhead where the project already uses bundling

---

## Phase 3 — Revisit library bundling

Only after the above phases succeed should the project consider whether `packages/config` and `packages/utils` should move away from `tsup`.

---

## Recommended “Do / Don’t” Summary

### Do

- use **Oxlint** in active v5 TypeScript packages
- evaluate **Rolldown** where the repo already uses Rollup or Vite
- keep adoption incremental and measurable
- use these tools to simplify the repo, not to add more tooling variation

### Don’t

- don’t replace `tsc` package builds with Rolldown just because you can
- don’t swap out `apps/docs` from Biome/Oxc/Linting without a broader docs-tooling decision
- don’t use Rolldown as a substitute for fixing package/runtime ownership
- don’t treat Oxc parser/transformer features as mandatory if the repo doesn’t yet need them

---

## Best Concrete Targets in This Repo

### Best Oxc target

- active v5 ESLint packages: `core`, `client`, `domain`, `config`, `cli`, drivers, session-sync

### Best Rolldown target

- `integrations/node-red` editor bundling

### Best medium-term Rolldown path

- Vite app adoption via future Vite/Rolldown ecosystem alignment

### Weak targets

- plain `tsc` packages
- Docusaurus docs
- packages with no real bundling pain today

---

## Practical Conclusion

If this repo wants to use these tools well:

- **use Oxc first for linting**
- **use Rolldown second for bundling**
- and only in places that already match their strengths

That means:

> **Oxc is a near-term fit for the code-quality workflow. Rolldown is a near-to-medium-term fit for the app/editor bundling workflow.**
