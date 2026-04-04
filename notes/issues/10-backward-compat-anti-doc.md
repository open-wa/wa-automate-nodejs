# Issue #10: Backward Compatibility Anti-Doc

**Implementation note:** the main v5 spine now includes a shared `@open-wa/api` package and `packages/schema` no longer depends directly on `@open-wa/legacy`. This document still governs what should remain deferred or intentionally unpreserved beyond that slice.

**Priority**: HIGH  
**Purpose**: A full-codebase audit of what v5 should intentionally leave behind, deprecate, redesign, or refuse to preserve so the library can remain maintainable, modern, and durable for years.

---

## Executive Summary

The repo is no longer in a “blank rewrite” state. It now has a real v5 backbone:

- schema-first generation is real
- listener runtime foundations exist
- complex-method critical subset exists
- `@open-wa/wa-automate` is the real runtime owner
- `packages/cli` and `apps/cli` are wrappers, not alternate runtimes

That means the next risk is no longer “can v5 exist?”

The next risk is:

> **Will v5 become durable, or will it slowly collapse back into a compatibility shell full of wrappers, stale surfaces, weak contracts, and legacy debt?**

This document argues for what should be intentionally left behind.

---

## Core Thesis

v5 should preserve:

- the product value
- the main user workflows
- the strategically important runtime surfaces

v5 should **not** preserve:

- historical package boundaries that made sense in v4
- every old wrapper and alias
- every internal import path users may have depended on informally
- weak typing and build shortcuts used only to keep migration friction low
- duplicate runtime ownership or multiple “real” entrypoints

In short:

> **Preserve user value. Do not preserve architectural debt.**

---

## Current State Snapshot

Based on the current repo state, the codebase is now closer to:

- a real v5 runtime spine,
- plus a ring of migration-era wrappers, leniencies, stale docs, and package-surface debt.

That means the future-forward work is now mostly about:

1. removing ambiguity
2. shrinking surface area
3. tightening contracts
4. making private things truly private
5. making public things deliberate

---

## Full Audit: What v5 Should Intentionally Leave Behind

## 1. Legacy package layering as an architectural default

### What exists now

- `packages/schema/package.json` still depends on `@open-wa/legacy`
- `apps/orchestrator-cli/package.json` still depends on `@open-wa/legacy`
- `packages/legacy` still exists as a large compatibility reservoir

### Why this is future-hostile

If `legacy` remains a foundational dependency instead of an optional compatibility consumer, then:

- internal cleanup gets blocked
- package boundaries remain blurry
- the system keeps paying for two mental models

### Future-forward position

Do **not** preserve `@open-wa/legacy` as a core building block.

Keep it only as:

- a compatibility façade, or
- a temporary migration package, or
- something we can eventually delete

### Evidence

- `packages/schema/package.json:45-48`
- `apps/orchestrator-cli/package.json:17-19`

---

## 2. Wrapper packages as long-term equal citizens

### What exists now

- `@open-wa/wa-automate` is the real runtime owner
- `packages/cli` is now a wrapper
- `apps/cli` is now a wrapper

### Why this is future-hostile

Wrappers are useful during migration, but harmful as permanent equals:

- they multiply test burden
- they create product ambiguity
- they encourage stale docs and stale assumptions

### Future-forward position

Do **not** preserve wrapper packages as permanent equal alternatives.

Likely path:

- keep them temporarily for migration
- document them honestly as wrappers
- plan removal or de-emphasis later

### Evidence

- `packages/wa-automate/package.json:7-9`
- `packages/cli/package.json`
- `apps/cli/package.json`
- completed CLI cleanup slice in `docs/exec-plans/active/v5-easy-api-cutover-plan.md`

---

## 3. Deep internal import paths as public API

### What exists now

The repo has already had internal/generated-path confusion around:

- `src/generated/*`
- `generated/*`
- direct path imports into package internals

The existing notes still contain migration guidance around `src/generated` cleanup and relocation.

### Why this is future-hostile

If users are allowed to treat internal file layout as public API, then:

- every refactor becomes breaking
- generated output strategy becomes frozen
- package maintainers lose freedom to reorganize internals

### Future-forward position

Do **not** preserve deep internal import path habits.

Rule:

- only documented exports are public
- generated outputs should have one public import surface only

### Evidence

- `packages/schema/package.json:7-33`
- `notes/issues/05b-build-cleanup-relocate.md`
- `notes/issues/01-clientregistry-cutover.md`
- `notes/issues/09-backward-compatibility.md:118-130`

---

## 4. Hybrid schema ownership and compatibility pollution

### What exists now

`packages/schema` is both:

- the v5 source-of-truth for method/event metadata
- and still partially shaped by migration-era compatibility concerns

The old notes and audit still describe it as a hybrid registry/API surface.

### Why this is future-hostile

Schema should be authoritative and boring.

If schema remains a dumping ground for:

- generator logic
- compatibility shims
- legacy aliases
- public/private confusion

then it becomes harder to trust as the system’s contract source.

### Future-forward position

Do **not** preserve `packages/schema` as a hybrid compatibility bucket.

Long-term desired shape:

- schema = contracts and generation inputs
- compatibility = separate layer
- runtime serving = separate layer

### Evidence

- `packages/schema/package.json:45-48`
- `ai-notes/v5-runtime-architecture-audit.md`

---

## 5. Runtime/API ownership split across multiple product packages

### What exists now

We already removed the worst duplicate CLI runtime ownership, but the repo still lacks a final reusable API owner.

The current state remains roughly:

- `core` = runtime primitives
- `client` = typed client facade
- `wa-automate` = product runtime owner
- no final dedicated `api` package yet

### Why this is future-hostile

Without a final API ownership layer, the project risks:

- route logic drifting again
- docs/explorer/meta logic spreading again
- another “temporary” package becoming a permanent runtime owner

### Future-forward position

Do **not** preserve informal runtime-serving ownership.

Choose one of these and commit to it:

1. `packages/wa-automate` as the durable server/app owner
2. a dedicated `@open-wa/api` package as shared server transport

But do not remain indefinitely in the current “partly consolidated” state.

### Evidence

- `ai-notes/v5-runtime-architecture-audit.md`
- `docs/exec-plans/active/v5-easy-api-cutover-plan.md`

---

## 6. Weak TypeScript/build discipline as a permanent strategy

### What exists now

Across the repo there are widespread leniencies:

- `skipLibCheck: true` in many packages
- `strict: false` in `packages/legacy` and `packages/wa-automate`
- `noImplicitAny: false` in `apps/cli`, `apps/orchestrator-cli`, `packages/orchestrator`
- multiple `// @ts-nocheck` files, especially in legacy but also in `packages/core/src/controllers/browser.ignore.ts`

### Why this is future-hostile

Relaxed typing may be tolerable during migration, but as a permanent baseline it causes:

- hidden breakage between packages
- stale package surfaces surviving too long
- weaker refactor confidence
- maintainers depending on manual tribal knowledge instead of compiler guarantees

### Future-forward position

Do **not** preserve “migration leniency” as the long-term standard.

This does **not** mean “make everything strict immediately.” It means:

- confine leniency to legacy/transitional zones
- tighten the new v5 spine steadily
- stop treating `skipLibCheck` and `strict: false` as normal

### Evidence

- `tsconfig.base.json:22`
- `packages/wa-automate/tsconfig.json:6`
- `packages/legacy/tsconfig.json:6-8`
- `apps/cli/tsconfig.json:8`
- `apps/orchestrator-cli/tsconfig.json:8`
- multiple `// @ts-nocheck` hits in legacy/core/apps

---

## 7. Package surface drift and broken export discipline

### What exists now

During this work we already found and corrected export/runtime drift in multiple places:

- wrapper package surfaces not resolving correctly without tsconfig path help
- stale package module fields pointing at outputs that did not exist
- runtime warnings caused by package metadata not matching actual output behavior

### Why this is future-hostile

Package metadata drift is one of the fastest ways for a monorepo to rot:

- builds pass locally but fail in consumers
- wrapper packages become misleading
- type resolution and runtime resolution diverge

### Future-forward position

Do **not** preserve casual package-surface discipline.

Every package should have:

- one truthful public surface
- exports matching real built files
- runtime resolution matching type resolution

### Stronger long-term recommendation

Every maintained v5 package should converge on:

- one consistent module strategy
- no tsconfig-only path hacks required for local wrapper builds
- no mismatch between `main`, `module`, `exports`, and actual built files
- no “temporary” package metadata drift that survives past the migration slice that introduced it

### Evidence

- `packages/client/package.json:5-13` still advertises `index.mjs`
- prior fixes were needed in `packages/domain`, `packages/hyperemitter`, `packages/cli`, `packages/wa-automate`

---

## 8. Generated artifacts as a semi-source tree

### What exists now

The repo has already moved generation to `packages/schema/src/generated`, and multiple issue notes reflect the churn around generated file placement.

### Why this is future-hostile

Keeping generated artifacts inside `src/` may be practical in the short term, but long-term it creates tension:

- source vs generated boundaries blur
- contributor expectations blur
- cleanup and publishing become awkward

### Future-forward position

Do **not** preserve ambiguous generated-artifact placement forever.

Either:

- formally treat generated artifacts as part of source and document that, or
- move them to a cleaner package-owned generated surface later

But do not remain in “temporary but public” ambiguity.

### Stronger long-term recommendation

`packages/schema` should eventually become a **pure contract package**.

That means it should not permanently own:

- runtime bridge helpers
- generated runtime client behavior as if it were handwritten source
- compatibility-oriented implementation glue

Long-term, runtime/client implementation helpers should live outside the pure schema/contract layer.

### Evidence

- `packages/schema/package.json:13-17`
- `notes/issues/05a-build-cleanup-gitignore.md`
- `notes/issues/05b-build-cleanup-relocate.md`

---

## 9. Orchestrator and secondary apps bleeding legacy assumptions forward

### What exists now

The main runtime path has improved significantly, but some secondary apps still carry legacy dependencies and mixed server stacks.

Example:

- `apps/orchestrator-cli/package.json` depends on `@open-wa/legacy`, `hono`, and `express` simultaneously

### Why this is future-hostile

If secondary tools keep legacy assumptions alive, then:

- the repo never really leaves migration mode
- internal platform surfaces stay inconsistent
- future contributors copy old patterns forward

### Future-forward position

Do **not** preserve secondary apps as legacy islands indefinitely.

Each app should either:

- migrate to the v5 platform shape,
- be clearly marked transitional, or
- be isolated so it does not influence the main architecture

### Stronger long-term recommendation

Anything outside the main v5 runtime spine should be forced into one of three buckets:

1. actively maintained and aligned with v5 architecture
2. explicitly transitional
3. isolated/archived so it stops shaping core decisions

### Evidence

- `apps/orchestrator-cli/package.json:16-32`

---

## 10. Documentation drift as an architectural problem

### What exists now

The repo now has multiple architecture docs and migration notes, but several are already stale relative to the work completed:

- `ai-notes/v5-runtime-architecture-audit.md` still describes pre-cutover states
- `notes/issues/00-v5-migration-analysis.md` still reports statuses that are now outdated

### Why this is future-hostile

When docs drift from code, maintainers start optimizing for the wrong backlog.

Stale migration docs become a hidden architecture bug because they:

- keep people fixing already-fixed issues
- distort prioritization
- encourage duplicate refactors

### Future-forward position

Do **not** preserve stale migration narratives once the code has moved.

Either:

- keep docs actively updated as living artifacts, or
- explicitly mark them historical

### Stronger long-term recommendation

Architecture and migration docs should be labeled as either:

- **living source of truth**, or
- **historical analysis**

Anything in the second category should stop driving prioritization.

### Evidence

- `notes/issues/00-v5-migration-analysis.md`
- `ai-notes/v5-runtime-architecture-audit.md`
- `docs/exec-plans/active/v5-easy-api-cutover-plan.md`

---

## 11. Dependency hygiene debt

### What exists now

`pnpm install` still reports a large set of deprecated subdependencies and some peer dependency issues across the workspace.

Not all of these are urgent, but the repo clearly still carries a lot of historical dependency drag.

### Why this is future-hostile

Dependency debt compounds:

- it slows upgrades
- it hides real runtime breakage behind noisy warnings
- it increases the chance that migration-era “temporary” packages stay forever

### Future-forward position

Do **not** preserve broad dependency drift as acceptable background noise.

The repo needs a future-facing dependency policy for:

- deprecated transitive cleanup
- peer dependency alignment
- package-level runtime dependency minimization

### Evidence

- repeated deprecated/peer warning output from `pnpm install`

---

## 12. Test strategy gaps as a long-term risk

### What exists now

The repo has improved verification in the slices we completed, but broad strategic gaps still remain:

- no final compatibility matrix tests yet
- no stable package-surface audit tests yet
- wrapper packages still rely on manual verification more than enforced contract checks
- multiple package/build issues were discovered only during manual QA rather than pre-existing automated guards

### Why this is future-hostile

Without stronger contract testing, v5 can keep regressing while still “building.”

### Future-forward position

Do **not** preserve ad hoc testing as the long-term strategy.

The repo needs permanent tests for:

- package exports
- wrapper runtime path correctness
- generated artifact contract
- public route inventory
- migration-critical behaviors

---

## What v5 Should Be Willing To Deprecate

Strong candidates:

1. `Registry` as anything but a transitional alias
2. deep internal imports
3. wrapper packages as long-term product equals
4. fake schema compatibility where runtime does not implement the contract
5. broad backward-compatible argument quirks that obscure validation
6. migration-era leniency as the default TS/build posture
7. secondary apps that still depend on legacy without a clear migration story

---

## What v5 Should Be Willing To Break

Acceptable v5 breaks, if documented well:

- private/internal import paths
- stale package authority assumptions
- old undocumented runtime quirks
- old wrapper-package mental models
- compatibility behavior that materially worsens the architecture
- package surfaces that only work because of monorepo-local tsconfig path tricks
- direct access into generated/internal files

---

## What v5 Should Preserve

This is not a break-everything manifesto.

Preserve:

- the main Easy API product value
- the primary CLI story (`@open-wa/wa-automate`)
- the client workflows users actually depend on
- the listener/core bot loop behaviors that matter operationally
- migration clarity and explicit release policy

---

## Decision Filter

Before preserving any v4 behavior, ask:

1. Is it a real user-facing contract or just a historical implementation detail?
2. Does preserving it reduce migration pain enough to justify its maintenance cost?
3. Does preserving it make the architecture harder to sustain?
4. Would a migration guide be better than a permanent shim?
5. Would a wrapper preserve user value, or just preserve confusion?

---

## Recommended Anti-Compat Program

### Phase A — Clarify what is truly public

- freeze public package exports
- freeze public route surface
- mark internal paths and historical docs as non-contractual

### Phase B — Reduce transitional surfaces

- keep wrappers temporary and honest
- isolate or migrate secondary legacy-dependent apps
- remove foundational legacy dependencies from v5-owned packages
- decide whether `packages/cli` survives beyond the transition at all
- decide whether `apps/cli` survives beyond the transition at all

### Phase C — Tighten the v5 spine

- improve TS/build rigor in non-legacy packages
- add package-surface contract tests
- normalize generated artifact policy
- converge on one module/export discipline across maintained v5 packages

### Phase D — Retire what no longer serves the product

- remove low-value shims
- drop dead/stale wrapper assumptions
- stop documenting historical structure as current truth
- archive or quarantine non-v5-aligned apps/tools so they stop shaping the main architecture

---

## Definition of Done For This Anti-Doc

This document is successful if it helps the project say:

- “we should preserve this because users truly depend on it”
- “we should not preserve that because it only preserves debt”

and if it prevents v5 from becoming a half-modernized compatibility shell around v4.

---

## Practical Interpretation

> **A major version should improve the future of the library, not just keep the past alive forever.**
