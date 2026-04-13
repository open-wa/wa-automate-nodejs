# Docs Improvement Plan

> Date: 2026-04-13
> Scope: Improve `apps/docs` using the recent migration work, internal audit findings, and external benchmark research.

## 1. Goal

Turn `apps/docs` from a migrated documentation shell into a best-in-class product docs site for open-wa v5.

This plan focuses on five outcomes:

1. **A stronger newcomer experience** on the homepage and in first-run docs
2. **Better docs primitives** so pages are easier to write and easier to use
3. **Schema/type-driven reference improvements** instead of relying on copied reference output alone
4. **A real licensing and pricing decision surface** instead of only technical license notes
5. **Reference and navigation upgrades** so users can find what they need faster

---

## 2. Current State Summary

### What already exists

- Reorganized Fumadocs structure in `apps/docs/content/docs`
- Custom homepage in `apps/docs/src/components/homepage.tsx`
- Shared nav config in `apps/docs/src/lib/layout.shared.tsx`
- Licensing UI primitives:
  - `GetLicenseButton`
  - `LicenseBadge`
  - `LicensedFeatureCallout`
- MDX-aware licensed heading / blockquote behavior in `apps/docs/src/components/docs-mdx.tsx`
- Search dialog already wired into the docs app
- Imported generated reference subtree under `content/docs/reference/**`

### Main weaknesses still visible

- Authored docs are still thin in many areas
- Reference is broad but not very navigable
- Schema/config/client docs are not yet type-driven
- Licensing page explains the model but does not function as a buying/comparison page
- Homepage is much better than before but still lacks a few strong product-doc patterns seen in the benchmark sites
- Docs authoring still lacks richer content primitives like steps, install tabs, and comparison components

---

## 3. Research-Driven Priorities

The external repo teardown showed that the strongest docs sites win through **docs UX systems**, not just more MDX files.

### Highest-value patterns to adopt

1. **Type-driven tables and schema docs**
   - Inspired by Fumadocs `fumadocs-typescript` + `AutoTypeTable`
   - Best fit for open-wa config/schema/client payload docs

2. **Docs primitives**
   - `Steps`
   - package-manager install tabs
   - richer callouts/admonitions
   - comparison tables
   - path chooser cards

3. **Pricing / licensing UX**
   - Inspired especially by Octarine
   - feature matrix, trust bundle, FAQ, conversion-friendly CTA placement

4. **Reference restructuring**
   - Better entrypoints and generated object/type surfaces
   - avoid forcing users into giant monolithic class pages

5. **Homepage and onboarding depth**
   - clearer paths
   - stronger “who is this for?” framing
   - migration guidance
   - more trust and ecosystem signals

---

## 4. Proposed Workstreams

## Workstream A — Docs Primitives and Authoring UX

### Goal

Give the docs app a reusable component layer so future docs are clearer, faster to write, and more consistent.

### Deliverables

- `Steps` and `Step` components
- `InstallTabs` or `PackageManagerTabs`
- generic `Callout` component with variants such as:
  - note
  - tip
  - warning
  - danger
  - info
- `ComparisonTable` component
- `PathChooserCard` or `GuideCardGrid`
- optional `FAQ` accordion component

### Likely file targets

- `apps/docs/src/components/docs-mdx.tsx`
- `apps/docs/src/components/` new files for MDX primitives
- possibly `source.config.ts` if additional MDX component registration is needed

### Why this matters

This unlocks better docs everywhere else: onboarding, migration, integrations, pricing, and reference guides.

---

## Workstream B — Type / Schema / Config Documentation

### Goal

Make important technical surfaces easier to understand using generated type tables instead of prose-only or copied TypeDoc output.

### Deliverables

- install `fumadocs-typescript`
- wire `AutoTypeTable` into MDX components
- identify first-class type surfaces to document:
  - config object(s)
  - schema package outputs
  - webhook payloads
  - event payloads
  - SocketClient request/response shapes
  - selected generated client interfaces/types

### First candidate pages

- `guides/configuration-and-cli`
- `client-and-integrations/socket-client`
- a new `reference/config` or `reference/schema` section
- a new webhook/event payload reference

### Why this matters

This is probably the single best docs quality upgrade for open-wa because the product has a lot of structured runtime/configuration surface area.

---

## Workstream C — Pricing and Licensing Decision Page

### Goal

Turn licensing from a technical note into a decision-ready pricing page.

### Benchmark influence

Primarily inspired by Octarine’s pricing page patterns.

### Deliverables

- new pricing/licensing page or major upgrade of the current licensing section
- categorized feature matrix for:
  - free/community
  - restricted
  - insiders
- “What unlocks when you upgrade?” section with benefit-first descriptions
- trust bundle near CTA:
  - one-time vs subscription
  - support level
  - update policy
  - account/session/license scope
- FAQ covering buyer anxiety:
  - who needs a license
  - what session/account context matters
  - refunds/support
  - team licensing / org licensing path

### Supporting UX additions

- stronger `GetLicenseButton` placement
- optional “Talk to us about team licensing” CTA
- per-feature availability callouts in relevant guides/reference pages

### Why this matters

Right now the docs explain licensing but do not help users confidently decide what they need.

---

## Workstream D — Homepage and Newcomer Journey

### Goal

Make the homepage and first-run path feel like a polished product docs experience rather than a better landing page alone.

### Deliverables

- improve hero copy so it is less meta and more user-centered
- add a “Who is this for?” section
- add a “What changed in v5?” section
- add a “Popular workflows” section with stronger outcomes
- add migration/legacy-user guidance
- add ecosystem/community/trust signals:
  - GitHub
  - integrations
  - maintenance/versioning signal
- add a small runtime architecture diagram or visual explainer if practical

### Why this matters

The homepage should orient three groups quickly:

1. Easy API users
2. custom-code/library users
3. remote/session consumer users

---

## Workstream E — Reference and Navigation Restructure

### Goal

Make the generated/reference side easier to navigate and more useful as a day-to-day tool.

### Deliverables

- better reference landing page(s)
- category entrypoints such as:
  - client methods
  - config
  - events
  - payloads
  - webhook surface
  - integrations
- investigate whether giant monolithic pages should be split or indexed better
- enrich navigation with:
  - breadcrumbs
  - edit links
  - prev/next navigation
  - section dividers in meta.json where useful

### Stretch goals

- stronger search tuning
- per-page metadata / last-updated source links
- feedback widget on docs pages

---

## 5. Concrete Implementation Order

## Phase 1 — Foundation Components

Build first because they unlock better authoring everywhere else.

1. Add `Callout`
2. Add `Steps`
3. Add `InstallTabs`
4. Add `ComparisonTable`
5. Register them in MDX

**Exit criteria:** authored docs can use richer primitives without custom page-level hacks.

## Phase 2 — Type-Driven Docgen

1. Add `fumadocs-typescript`
2. Wire `AutoTypeTable`
3. Pilot on config/schema/client pages
4. Decide which reference areas should become type-table-first instead of raw copied TypeDoc

**Exit criteria:** at least one major technical page uses generated type tables successfully.

## Phase 3 — Pricing / Licensing Page

1. Design feature matrix
2. Add trust bundle
3. Add FAQ
4. Integrate stronger CTA structure
5. Link it from homepage, nav, and licensed callouts

**Exit criteria:** a new visitor can decide what license they need without reading scattered docs.

## Phase 4 — Homepage Refinement

1. Rewrite hero copy
2. Add who-it’s-for and v5 sections
3. Add migration section
4. Add ecosystem/community/trust signals
5. Add optional architecture visual

**Exit criteria:** homepage works as both orientation and conversion surface.

## Phase 5 — Reference / Navigation Improvements

1. Improve reference landing pages
2. Add breadcrumbs / edit links / prev-next
3. Reorganize key reference entrypoints
4. Review Client/reference page sprawl

**Exit criteria:** users can navigate reference without depending on search alone.

---

## 6. Specific Files / Areas Likely to Change

### Docs app infrastructure

- `apps/docs/src/components/docs-mdx.tsx`
- `apps/docs/source.config.ts`
- `apps/docs/src/lib/layout.shared.tsx`
- `apps/docs/src/lib/site.ts`
- `apps/docs/src/styles/app.css`

### Homepage / licensing

- `apps/docs/src/components/homepage.tsx`
- `apps/docs/src/components/licensing.tsx`
- `apps/docs/content/docs/licensing/licensed-features.mdx`
- likely a new `apps/docs/content/docs/licensing/pricing.mdx`

### New content sections likely needed

- migration / upgrade docs
- pricing / licensing comparison
- config/schema reference pages
- event payload docs
- webhook payload docs
- stronger operations pages

---

## 7. Acceptance Criteria

This plan is successful when the docs site reaches all of the following:

### UX

- homepage clearly explains open-wa v5 to first-time visitors
- pricing/licensing no longer feels like an appendix
- docs have stronger reusable content primitives

### Technical docs quality

- at least core config/schema/client surfaces use generated type tables
- reference is easier to navigate than the current copied snapshot

### Authoring / maintenance

- new docs can be written with components instead of custom formatting hacks
- licensing indicators remain consistent across guides and reference

### Conversion / decision clarity

- users can understand free vs paid availability quickly
- users can find the right getting-started path quickly

---

## 8. Recommended Next Action

If implementing immediately, the best next move is:

1. **build docs primitives first** (`Callout`, `Steps`, `InstallTabs`, `ComparisonTable`)
2. then **wire `fumadocs-typescript`** and pilot `AutoTypeTable`
3. then **ship the pricing/licensing comparison page**

That order gives the highest leverage and avoids reworking the same pages multiple times.
