# Issue #09: Backward Compatibility Release Contract

**Implementation note:** the reusable API layer now exists in `packages/api`, and the active preserve/defer decisions for this slice are recorded in `docs/decisions/2026-03-30-v5-cutover-decisions.md`. This issue remains the policy source for broader release-contract work that was intentionally deferred.

**Priority**: HIGH  
**Effort**: 1-2 days planning + 2-4 days implementation later  
**Risk**: HIGH  
**Depends on**: listener migration, complex-method critical subset, CLI surface cleanup  
**Blocks**: v5.0 stable release

---

## Purpose

This document is intentionally **planning-only**.

It describes what still needs to be done for backward compatibility, but it does **not** require us to implement shims, warnings, or migration helpers yet. The goal is to avoid destabilizing the new v5 runtime path before the final compatibility policy is explicitly chosen.

In short:

> **Do not add compatibility code blindly. First freeze the contract, then decide what to preserve, what to wrap, and what to break on purpose.**

---

## Current State

The repo has already completed several migration slices:

- schema-first generator/runtime path is real
- listener runtime foundation exists in `packages/client`
- complex-method critical subset foundation exists in `packages/client`
- `@open-wa/wa-automate` is the real CLI/runtime owner
- `packages/cli` and `apps/cli` are now thin wrappers

That means backward compatibility is no longer about protecting a hypothetical future v5. It is now about protecting a **real** v5 runtime from accidental regressions while deciding how much of v4 behavior to carry forward.

---

## What Backward Compatibility Means Here

For this repo, backward compatibility has four separate scopes:

1. **Runtime Easy API behavior**
2. **Client API behavior**
3. **CLI and startup behavior**
4. **Imports, generated artifacts, and migration documentation**

These scopes should be handled independently. Not every old internal shape deserves a shim.

---

## Guiding Rule

Preserve the **external behavior contract** where it matters.

Do **not** preserve:

- legacy package layering
- legacy Express ownership
- stale internal registry design
- legacy file layout that conflicts with the v5 architecture

---

## What Needs To Be Decided Before Any Compatibility Code

### 1. Runtime/API contract freeze

We need one explicit table for:

- runtime paths that must stay compatible
- runtime paths that may move but need redirects/docs
- runtime paths that may be removed in v5

This includes at minimum:

- `/api-docs/`
- `/meta/swagger.json`
- `/meta/postman.json`
- `/meta/basic/commands`
- `/meta/basic/listeners`
- `/media/*`
- auth/header behavior (`key`, `api_key`, etc.)
- session-path behavior (`useSessionIdInPath`)
- socket behavior if still considered public surface

### 2. Client contract freeze

We need one explicit table for:

- listener methods preserved as wrappers
- methods preserved with identical signatures
- methods preserved with compatibility adaptation only
- methods intentionally changed in v5

Examples already needing explicit decisions:

- `client.onMessage`, `onAck`, `onStateChanged`
- `decryptMedia` return contract (DataURL vs plain base64)
- `loadEarlierMessages(chatId, count?, includeMe?)` schema/runtime mismatch

### 3. CLI contract freeze

We need one explicit statement for:

- which package users should run
- which package names remain installable
- which bin names remain valid
- which old flags remain accepted
- which flags are deprecated or removed

Current likely answer:

- `@open-wa/wa-automate` is the real product package
- `@open-wa/cli` remains a wrapper for now
- `@open-wa/cli-app` remains a wrapper for now

But this should be declared, not inferred.

### 4. Import / generated artifact contract freeze

We need one explicit statement for:

- allowed import paths in v5
- generated artifact locations that are public vs internal
- whether any v4 import paths get temporary shims

This matters especially for:

- `@open-wa/schema/generated`
- `Registry` vs `clientRegistry`
- direct path imports into old generated files

---

## Backward Compatibility Work Still To Do

### A. Produce the compatibility matrix

Create a single matrix with these columns:

| Surface | v4 behavior | current v5 behavior | target v5 behavior | preserve / shim / break | notes |
|---|---|---|---|---|---|

Required rows:

- runtime HTTP paths
- client methods/listeners
- CLI flags and bins
- package imports/exports
- generated artifact paths

This is the most important missing artifact.

### B. Decide shim policy

For each compatibility item, choose exactly one:

1. **Preserve natively**
2. **Preserve via wrapper/shim**
3. **Deprecate with warning**
4. **Break intentionally with migration docs**

No implementation should happen until each important item has one of those labels.

### C. Decide warning policy

If deprecation warnings are added later, define:

- where warnings are emitted
- how often they are emitted
- whether they can be disabled
- whether tests need to assert warning behavior

This must be deliberate, otherwise warnings become noisy and unusable.

### D. Write the migration guide

After the matrix and shim policy are frozen, write:

- “what changed”
- “what still works”
- “what breaks”
- “what to replace it with”

The migration guide should be written against the **actual final v5 surface**, not the interim migration state.

### E. Write the release contract

Before stable release, write one concise release-contract section that answers:

- what is guaranteed in v5.0
- what is transitional in v5.x
- what is planned for removal in v6

---

## What Should NOT Be Done Yet

To avoid destabilizing the current migration progress, do **not** do the following yet:

- do not add broad deprecation warnings across the codebase
- do not add compatibility wrappers for every old method “just in case”
- do not revive old Express-only structures for the sake of v4 parity
- do not expose old internal package paths that conflict with the v5 structure
- do not add shims before the compatibility matrix is frozen

---

## Likely Compatibility Hotspots

These are the areas most likely to need explicit compatibility handling later.

### Runtime/API

- Easy API explorer/meta endpoints
- auth header aliases
- session-in-path behavior
- socket mode exposure

### Client

- listener convenience wrappers
- `decryptMedia`
- `loadEarlierMessages`
- any legacy positional/object arg quirks still relied on by API callers

### CLI

- `wa`
- `wa-automate`
- `openwa`
- old Easy API startup expectations

### Schema / imports

- `Registry`
- generated-path imports
- any direct `src/generated/*` imports from external consumers

---

## Recommended Execution Order (Later)

When we choose to actually do backward compatibility work, the order should be:

1. Freeze compatibility matrix
2. Freeze shim policy per item
3. Implement only critical shims/wrappers
4. Add deprecation warnings only where approved
5. Write migration guide
6. Write release notes/changelog

---

## Definition of Done For This Issue

This issue is complete when all of the following exist:

- [ ] one compatibility matrix covering runtime, client, CLI, and imports
- [ ] one preserve/shim/break decision for each critical item
- [ ] migration guide draft for v4 → v5
- [ ] release-contract section for v5.0 / v5.x / v6
- [ ] no compatibility implementation added outside that approved scope

---

## Practical Interpretation

This issue should be read as:

> **Plan the compatibility policy now. Implement compatibility later, selectively, and only where the matrix says it is necessary.**
