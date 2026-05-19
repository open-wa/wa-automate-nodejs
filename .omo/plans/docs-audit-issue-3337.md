# Docs Audit Issue 3337 Cleanup Plan

## TL;DR
> **Summary**: Execute the remaining current-state documentation cleanup from GitHub issue `#3337`, using the latest full audit as source of truth and older persona rounds as regression checks. Keep work docs-only: improve first-success routing, contract consistency, runnable examples, architecture-copy clarity, expected outputs, pricing clarity, and a reusable docs quality gate.
> **Deliverables**:
> - Updated `apps/docs` navigation/content for the latest audit findings, mapped into eleven execution tasks.
> - Read-only contract verification notes for webhook, Docker/env, MCP, plugin tool context, plugin loading, and generated `unknown` reference risks.
> - Persona regression checklist covering junior Node, AI/ML, CRM/helpdesk, dictation plugin, moderation plugin, and copy red-team concerns.
> - Agent-executed evidence in `.sisyphus/evidence/` for each task.
> **Effort**: Large
> **Parallel**: YES - 4 waves
> **Critical Path**: Task 1 → Tasks 2/3/4/6/7 source verification → Tasks 5/8/9/10 copy updates → Task 11 quality gate → Final verification

## Context

### Original Request
User requested: create a Prometheus plan out of **everything from GitHub issue #3337**.

### Interview Summary
- Plan only; no implementation in this planning session.
- Scope is `apps/docs` documentation/content/navigation/config plus read-only source verification required to document exact contracts.
- Keep Fumadocs/TanStack/Vite architecture unchanged.
- No new dependencies.
- Preserve public component props/exports and route behavior.
- Do not touch `TODO.md`.
- Latest issue comment, “Full top-to-bottom docs audit after current rewrite,” is authoritative for current actionable gaps.
- Older issue rounds stay in scope as persona regression checks, not as stale missing-page claims.

### Metis Review (gaps addressed)
- Webhook docs must standardize one envelope or explicitly document legacy/current variants.
- Docker/env docs must verify authoritative env names before prose changes.
- Generated reference `unknown` issues are read-only investigations unless source changes are separately approved.
- Quickstart must be made discoverable from sidebar/homepage/docs root.
- Pricing clarity must defer to an authoritative commercial/licensing source; agents must not invent pricing claims.

### Oracle Gate 1 (GO guardrails incorporated)
- Verification-before-prose ordering is mandatory for contract-sensitive tasks.
- `pnpm --filter docs lint` has a known pre-existing blocker (`apps/docs/source.config` import); lint blocker is not in scope to fix.
- Expected outputs must be captured where feasible or explicitly labeled illustrative/abbreviated.
- No changes to `vite.config.ts`, route loaders, source config, dependencies, or runtime source.
- The latest audit's detailed findings are mapped explicitly: audit items 1-9 map to Tasks 1-8 and 10; audit item 10 maps to Task 9; audit item 11 maps to Task 11; audit item 12 is meta-tracking, out of scope for direct docs/code changes, and is satisfied by Task 11's fixed-vs-current/persona regression checklist.
- Each issue action is represented as an atomic, reviewable task.

## Work Objectives

### Core Objective
Make the current docs tree task-complete, technically consistent, and regression-safe for the issue #3337 personas without expanding architecture or runtime scope.

### Deliverables
- One-click first-success path from homepage/docs root to `quickstart.mdx`.
- Canonical webhook envelope documentation after source verification.
- Docker/env/session persistence examples aligned to actual runtime behavior.
- MCP setup that handles both CLI flag and config fallback, with success/failure expectations.
- AI-agent examples made runnable or clearly marked as pseudocode.
- Plugin AI tool context docs matched to actual source type.
- Plugin getting-started file layout and load verification instructions.
- Pricing page rewritten for buyer decisions and support path clarity.
- Homepage and concepts copy demoted from internal architecture/meta commentary to user job language.
- Expected output blocks for first-run, MCP, plugin, webhook, and Docker flows.
- Reusable docs quality checklist/gate under `apps/docs/`.
- Persona regression checklist evidence.

### Definition of Done (verifiable conditions with commands)
- `pnpm --filter docs check` passes, or any failure is documented with exact command output and traced to pre-existing config/import issues only.
- `pnpm --filter docs build` passes, or any failure is documented with exact command output and traced to pre-existing config/import issues only.
- `pnpm --filter docs lint` is attempted and either passes or is documented as blocked by the known `apps/docs/source.config` import issue.
- All changed MDX pages include prerequisites, exact command/code, expected output, failure mode, and next step where applicable.
- `apps/docs/content/docs/getting-started/meta.json` includes `quickstart` before deeper Easy API pages.
- Homepage/docs root links point first-success users to `quickstart`.
- Webhook, Docker/env, MCP, and plugin AI tool docs include source-verification findings.
- No changes appear outside `apps/docs`, `.sisyphus/evidence`, and normal generated docs artifacts unless explicitly justified as evidence.

### Must Have
- Task-first, human-readable copy.
- Safety constraints before powerful MCP/AI/plugin capabilities.
- No unsafe TypeScript teaching shortcuts (`any`, unchecked non-null assertions, unchecked `error.message`, or casts without narrowing).
- Read-only source verification before changing docs that describe runtime contracts.
- Older issue #3337 persona concerns represented in regression checks.

### Must NOT Have
- No runtime source edits.
- No dependency additions.
- No Fumadocs/TanStack/Vite architecture changes.
- No changes to `TODO.md`.
- No invented pricing, terminal output, API shapes, webhook envelopes, env vars, or plugin context fields.
- No generated-reference workaround that misrepresents a source type.

## Verification Strategy
> ZERO HUMAN INTERVENTION - all verification is agent-executed.
- Test decision: tests-after + existing docs checks (`pnpm --filter docs check`, `pnpm --filter docs build`, `pnpm --filter docs lint` attempted).
- QA policy: Every task has agent-executed scenarios.
- Evidence: `.sisyphus/evidence/task-{N}-{slug}.{ext}`.
- Validation fallback hierarchy:
  1. `pnpm --filter docs check` as primary Fumadocs/TypeScript gate.
  2. `pnpm --filter docs build` as rendered docs gate.
  3. `pnpm --filter docs lint` attempted; if it fails on `apps/docs/source.config` import, record as pre-existing blocker and do not fix in this plan.
  4. Targeted file inspection for changed MDX/nav files.
  5. Persona regression checklist pass.

## Execution Strategy

### Parallel Execution Waves
> Target: 5-8 tasks per wave. <3 per wave (except final) = under-splitting.
> Extract shared dependencies as Wave-1 tasks for max parallelism.

Wave 1: Task 1 quickstart routing; Task 2 webhook contract verification/update; Task 3 Docker/env verification/update; Task 4 MCP quickstart/fallback.

Wave 2: Task 5 AI-agent examples; Task 6 plugin tool context; Task 7 plugin loading verification; Task 8 pricing clarity; Task 9 architecture/meta commentary demotion.

Wave 3: Task 10 expected output pass; Task 11 docs quality gate and persona regression checklist.

Wave 4: Final verification wave F1-F4.

### Dependency Matrix (full, all tasks)
| Task | Depends On | Blocks |
| --- | --- | --- |
| 1 Quickstart discoverability | none | 10, 11 |
| 2 Webhook contract | source verification within task | 10, 11 |
| 3 Docker/env/persistence | source verification within task | 10, 11 |
| 4 MCP fallback | source verification within task | 10, 11 |
| 5 AI examples | source/reference check for method signatures | 10, 11 |
| 6 Plugin AI tool context | source verification within task | 10, 11 |
| 7 Plugin file layout/load | source/build behavior verification within task | 10, 11 |
| 8 Pricing clarity | authoritative source lookup within task | 11 |
| 9 Architecture/meta commentary | none | 11 |
| 10 Expected outputs pass | 1,2,3,4,5,6,7 | 11, Final |
| 11 Quality gate/persona regression | 1-10 | Final |

### Agent Dispatch Summary (wave → task count → categories)
| Wave | Count | Categories |
| --- | ---: | --- |
| 1 | 4 | writing, unspecified-high |
| 2 | 5 | writing, unspecified-high |
| 3 | 2 | writing, deep |
| Final | 4 | oracle, unspecified-high, deep |

## TODOs
> Implementation + Test = ONE task. Never separate.
> EVERY task MUST have: Agent Profile + Parallelization + QA Scenarios.

- [ ] 1. Make `quickstart.mdx` the actual first-success path

  **What to do**:
  - Add `quickstart` to `apps/docs/content/docs/getting-started/meta.json`, before `easy-api`.
  - Add `quickstart` to `DOCS_PATHS` in `apps/docs/src/lib/site.ts` if a central constant is needed for homepage links.
  - Update `apps/docs/src/components/homepage.tsx` so primary CTA and “Fastest path” point to the quickstart page, not the deeper Easy API page.
  - Update `apps/docs/content/docs/index.mdx` so the first-success “Start here / send your first message” link points to quickstart.
  - Keep `easy-api.mdx` positioned as the deeper Easy API operations page.
  - Add expected HTTP status/body to the quickstart `curl` sendText step. Default to labeling the response as illustrative/abbreviated; capture real output only if Easy API is already running and authenticated in the agent environment. Do not start a new WhatsApp authentication flow for this task.

  **Must NOT do**:
  - Do not remove `easy-api.mdx`.
  - Do not change route behavior or TanStack route files.
  - Do not invent runtime response bodies; label examples if not captured.

  **Recommended Agent Profile**:
  - Category: `writing` - Reason: MDX/nav copy and first-success IA work.
  - Skills: [] - No specialized skill required.
  - Omitted: [`frontend-philosophy`] - Visual redesign is not in scope.

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: [10, 11] | Blocked By: []

  **References**:
  - Issue: `/home/mhm/.local/share/opencode/tool-output/tool_e40b5dbe2001gIsoH4VS2Ub2Vx:917-935` - audit evidence and TODOs.
  - Pattern: `apps/docs/content/docs/getting-started/quickstart.mdx` - existing first-success guide.
  - Pattern: `apps/docs/content/docs/getting-started/meta.json` - sidebar ordering.
  - Pattern: `apps/docs/src/components/homepage.tsx` - homepage CTA/card links.
  - Pattern: `apps/docs/src/lib/site.ts` - docs path constants.
  - Pattern: `apps/docs/content/docs/index.mdx` - docs root start-here links.

  **Acceptance Criteria**:
  - [ ] `quickstart` appears before `easy-api` in `apps/docs/content/docs/getting-started/meta.json`.
  - [ ] Homepage primary first-success CTA points to quickstart.
  - [ ] Docs root first-success link points to quickstart.
  - [ ] Quickstart includes expected `curl` response status/body or clearly labeled illustrative output.
  - [ ] `easy-api.mdx` remains available as deeper operations content.
  - [ ] Evidence file records before/after link targets.

  **QA Scenarios**:
  ```
  Scenario: New user reaches first success in one click
    Tool: Bash + file inspection
    Steps: Inspect meta.json, homepage.tsx, site.ts, and index.mdx for quickstart link targets.
    Expected: `quickstart` is in sidebar and homepage/docs root first-success links resolve to `/docs/getting-started/quickstart`.
    Evidence: .sisyphus/evidence/task-1-quickstart-links.md

  Scenario: Easy API page was not incorrectly replaced
    Tool: Bash + file inspection
    Steps: Confirm `apps/docs/content/docs/getting-started/easy-api.mdx` still exists and is linked as deeper Easy API guidance.
    Expected: Easy API page remains reachable and not renamed/deleted.
    Evidence: .sisyphus/evidence/task-1-quickstart-easy-api-preserved.md
  ```

  **Commit**: YES | Message: `docs(getting-started): route first-success users to quickstart` | Files: [`apps/docs/content/docs/getting-started/meta.json`, `apps/docs/src/lib/site.ts`, `apps/docs/src/components/homepage.tsx`, `apps/docs/content/docs/index.mdx`, `apps/docs/content/docs/getting-started/quickstart.mdx`]

- [ ] 2. Verify and unify webhook payload contracts

  **What to do**:
  - First, read runtime/source docs/types for webhook integration to determine the actual emitted envelope and event naming.
  - Record source-verification findings in `.sisyphus/evidence/task-2-webhook-source.md` before editing prose.
  - If one canonical envelope exists, update all webhook pages to use it consistently.
  - If both legacy and current forms exist, document a compatibility matrix: current shape, legacy shape, when each appears, and how receivers can detect each.
  - Update Express/Zapier/Make/n8n examples to parse the canonical fields.
  - Add “copy these three fields first”: sender, text/caption, message id.
  - Add a test receiver snippet that logs raw body before transforming it.

  **Must NOT do**:
  - Do not choose between `data` and `payload` without source verification.
  - Do not change webhook runtime code.
  - Do not hide legacy behavior if source shows both forms exist.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: Requires source verification plus docs changes.
  - Skills: [] - No specialized skill required.
  - Omitted: [`code-philosophy`] - Runtime code changes are forbidden.

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: [10, 11] | Blocked By: []

  **References**:
  - Issue: `/home/mhm/.local/share/opencode/tool-output/tool_e40b5dbe2001gIsoH4VS2Ub2Vx:936-970` - conflicting envelope evidence.
  - Docs: `apps/docs/content/docs/guides/webhooks-for-business.mdx` - currently reported as using `{ event, data }`.
  - Docs: `apps/docs/content/docs/client-and-integrations/webhook-payloads.mdx` - currently reported as using `{ webhookId, sessionId, event, payload, timestamp }`.
  - Likely source references to locate: webhook integration package/types, config schema, generated reference.

  **Acceptance Criteria**:
  - [ ] Source verification evidence names the authoritative envelope fields and event names.
  - [ ] Webhook business guide and payload reference use the same canonical shape or clearly labeled legacy/current variants.
  - [ ] Receiver examples parse sender, text/caption, and message id from documented fields.
  - [ ] A raw-body logging receiver example exists before transformed examples.
  - [ ] Evidence includes a grep/file-inspection pass proving no stale `data`/`payload` contradiction remains in changed webhook docs.

  **QA Scenarios**:
  ```
  Scenario: Receiver can parse canonical webhook fields
    Tool: Bash + file inspection
    Steps: Inspect webhook docs for the canonical envelope and field extraction examples.
    Expected: All examples agree on envelope/event names or explicitly document legacy/current branches.
    Evidence: .sisyphus/evidence/task-2-webhook-canonical.md

  Scenario: Legacy/current ambiguity is not hidden
    Tool: Bash + source inspection
    Steps: Compare source-verification evidence against changed docs.
    Expected: If source supports two shapes, docs include compatibility matrix; if source supports one shape, docs use only that shape.
    Evidence: .sisyphus/evidence/task-2-webhook-compatibility.md
  ```

  **Commit**: YES | Message: `docs(webhooks): standardize payload envelope examples` | Files: [`apps/docs/content/docs/guides/webhooks-for-business.mdx`, `apps/docs/content/docs/client-and-integrations/webhook-payloads.mdx`]

- [ ] 3. Verify and resolve Docker/env-var/session persistence drift

  **What to do**:
  - First, verify which env var names the runtime/container entrypoint actually consumes.
  - Verify browser profile/session persistence path and exact flag/config required for Docker volume persistence.
  - Record findings in `.sisyphus/evidence/task-3-docker-env-source.md` before editing docs.
  - Update Docker, configuration/CLI, and security/deployment pages to use the same env names or explicitly label Docker aliases versus general runtime env vars.
  - Add restart proof: start/authenticate/stop/start again/no QR required. If not runnable in CI, document as a local verification checklist and label runtime output illustrative.

  **Must NOT do**:
  - Do not fix the container entrypoint or runtime config code.
  - Do not document `PORT`, `API_KEY`, `SESSION_ID`, `WA_*`, or `OPENWA_*` as equivalent unless source proves compatibility.
  - Do not claim volume persistence works without naming the flag/config that directs profile storage.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: Needs source/config verification and docs updates.
  - Skills: [] - No specialized skill required.
  - Omitted: [`sigillo`] - Secret manager integration is not requested.

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: [10, 11] | Blocked By: []

  **References**:
  - Issue: `/home/mhm/.local/share/opencode/tool-output/tool_e40b5dbe2001gIsoH4VS2Ub2Vx:971-989` - env-var and persistence drift evidence.
  - Docs: `apps/docs/content/docs/getting-started/docker.mdx` - Docker examples.
  - Docs: `apps/docs/content/docs/guides/configuration-and-cli.mdx` - runtime env var reference.
  - Docs: `apps/docs/content/docs/operations/security-and-deployment.mdx` - deployment/API key examples.
  - Docs: `apps/docs/content/docs/getting-started/easy-api.mdx` - default browser profile notes.

  **Acceptance Criteria**:
  - [ ] Source evidence identifies actual env vars and session persistence path behavior.
  - [ ] Docker, config, and deployment docs use consistent names or documented alias matrix.
  - [ ] Docker volume example includes exact flag/config needed for persistence.
  - [ ] Restart/no-QR proof is included as executable verification or clearly labeled local checklist.
  - [ ] No stale contradictory env-var names remain in changed docs without explanation.

  **QA Scenarios**:
  ```
  Scenario: Docker env docs match source verification
    Tool: Bash + file inspection
    Steps: Compare `.sisyphus/evidence/task-3-docker-env-source.md` to Docker/config/deployment docs.
    Expected: Documented env names are source-backed or listed as aliases with context.
    Evidence: .sisyphus/evidence/task-3-docker-env-consistency.md

  Scenario: Session persistence instructions are falsifiable
    Tool: Bash + file inspection
    Steps: Inspect Docker docs for volume mount plus exact path/flag/config and restart/no-QR verification steps.
    Expected: User can run a concrete restart test and know expected result.
    Evidence: .sisyphus/evidence/task-3-docker-persistence.md
  ```

  **Commit**: YES | Message: `docs(docker): align env vars and persistence guidance` | Files: [`apps/docs/content/docs/getting-started/docker.mdx`, `apps/docs/content/docs/guides/configuration-and-cli.mdx`, `apps/docs/content/docs/operations/security-and-deployment.mdx`, `apps/docs/content/docs/getting-started/easy-api.mdx`]

- [ ] 4. Make MCP quick start match v5 alpha reality

  **What to do**:
  - Verify current MCP flag/config behavior in source/docs before editing prose.
  - Update `apps/docs/content/docs/guides/mcp.mdx` quick start to show both supported paths: CLI `--mcp` and `wa.config.*` fallback.
  - Add expected startup log/dashboard state for MCP enabled.
  - Add a concrete tool-list verification step (`tools/list` or client-specific tools visible) without exposing unsafe public-network guidance.
  - Add troubleshooting for missing API key, session not ready, tools not listed, 401/403, and unsupported `--mcp` flag.
  - Keep security checklist before capability list.

  **Must NOT do**:
  - Do not overpromise natural-language access before safety constraints.
  - Do not claim `--mcp` always works if config fallback is required for some alpha builds.
  - Do not change MCP implementation.

  **Recommended Agent Profile**:
  - Category: `writing` - Reason: Safety-oriented guide rewrite with source-backed details.
  - Skills: [] - No specialized skill required.
  - Omitted: [`context7`] - MCP behavior is project-specific, not external-doc dependent.

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: [10, 11] | Blocked By: []

  **References**:
  - Issue: `/home/mhm/.local/share/opencode/tool-output/tool_e40b5dbe2001gIsoH4VS2Ub2Vx:990-1007` - MCP mismatch evidence and TODOs.
  - Docs: `apps/docs/content/docs/guides/mcp.mdx` - MCP guide.
  - Docs: `apps/docs/content/docs/guides/configuration-and-cli.mdx` - alpha caveat and config fallback.
  - README: `/home/mhm/projects/open-wa/wa-automate-nodejs/README.md` - MCP overview and security boundary.

  **Acceptance Criteria**:
  - [ ] MCP page shows CLI and config fallback paths near the quick start.
  - [ ] Security checklist appears before broad capability claims.
  - [ ] Expected enabled state and tool-list verification are documented.
  - [ ] Troubleshooting covers five listed failure modes.
  - [ ] Source-verification evidence records whether `--mcp` is supported and where config fallback comes from.

  **QA Scenarios**:
  ```
  Scenario: User can recover from unsupported MCP flag
    Tool: Bash + file inspection
    Steps: Inspect MCP quick start and troubleshooting blocks.
    Expected: If `--mcp` fails, docs immediately show `wa.config.*` fallback and expected success state.
    Evidence: .sisyphus/evidence/task-4-mcp-fallback.md

  Scenario: MCP safety appears before capability inventory
    Tool: Bash + file inspection
    Steps: Inspect section ordering in `mcp.mdx`.
    Expected: API key/private network/dedicated session warnings precede expansive tool capability language.
    Evidence: .sisyphus/evidence/task-4-mcp-safety-order.md
  ```

  **Commit**: YES | Message: `docs(mcp): add config fallback and verification steps` | Files: [`apps/docs/content/docs/guides/mcp.mdx`, `apps/docs/content/docs/guides/configuration-and-cli.mdx`]

- [ ] 5. Make AI-agent examples runnable or explicitly pseudocode

  **What to do**:
  - Review `apps/docs/content/docs/guides/ai-agent-patterns.mdx` for claims of “production-ready examples.”
  - Either make examples complete enough to run or re-label them as patterns/pseudocode.
  - Add install/setup commands for `bottleneck`, `p-queue`, and any chosen LLM/STT SDK if examples remain runnable.
  - Add stubs or explicit “application-provided placeholder” labels for `callLLM`, `callVisionLLM`, and `callSTT`.
  - Verify and fix `sendImage` signature against current docs/reference/source.
  - Add expected behavior: message in, response out, logs, rate-limit behavior.

  **Must NOT do**:
  - Do not add project dependencies to implement doc examples.
  - Do not leave undefined helpers in snippets that are labeled runnable.
  - Do not use unsafe TypeScript shortcuts.

  **Recommended Agent Profile**:
  - Category: `writing` - Reason: Technical writing with runnable-example hygiene.
  - Skills: [] - No specialized skill required.
  - Omitted: [`paid-ads`] - Not marketing copy.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: [10, 11] | Blocked By: []

  **References**:
  - Issue: `/home/mhm/.local/share/opencode/tool-output/tool_e40b5dbe2001gIsoH4VS2Ub2Vx:1012-1030` - AI example evidence and TODOs.
  - Docs: `apps/docs/content/docs/guides/ai-agent-patterns.mdx` - target page.
  - Related docs/reference: message send guide/reference for `sendImage` signature.

  **Acceptance Criteria**:
  - [ ] No example labeled runnable uses undefined helpers without stubs or placeholder labels.
  - [ ] Install/setup instructions exist for any external libraries named in runnable snippets.
  - [ ] `sendImage` example matches verified signature.
  - [ ] The page no longer overclaims “production-ready” unless snippets are complete.
  - [ ] Expected behavior/log/rate-limit notes exist.

  **QA Scenarios**:
  ```
  Scenario: Runnable examples have complete setup
    Tool: Bash + file inspection
    Steps: Inspect AI-agent guide for external imports and helper calls.
    Expected: Each import/helper has install command, stub, or explicit placeholder label.
    Evidence: .sisyphus/evidence/task-5-ai-runnable.md

  Scenario: Incorrect media send signature is removed
    Tool: Bash + source/reference inspection
    Steps: Verify `sendImage` signature from source/reference and inspect AI examples.
    Expected: AI guide uses verified arguments or avoids claiming runnable media send code.
    Evidence: .sisyphus/evidence/task-5-ai-sendimage.md
  ```

  **Commit**: YES | Message: `docs(ai): clarify runnable examples and placeholders` | Files: [`apps/docs/content/docs/guides/ai-agent-patterns.mdx`]

- [ ] 6. Verify and fix plugin AI tool context docs

  **What to do**:
  - Verify actual `ToolContext` type in plugin SDK source.
  - Record source-verification findings in `.sisyphus/evidence/task-6-tool-context-source.md`.
  - Update `apps/docs/content/docs/plugins/ai-tools.mdx`, `apps/docs/content/docs/plugins/hooks-reference.mdx`, and any generated/reference prose in docs to use the same context fields.
  - Add one sentence explaining which context fields are guaranteed and which are optional.
  - Add minimal tool verification: call tool, inspect log, confirm expected WhatsApp action; label runtime output illustrative if not captured.

  **Must NOT do**:
  - Do not invent `client`, `abort`, `logger`, or `sessionId` availability.
  - Do not edit plugin SDK source.
  - Do not change generated reference manually if it is generated; instead document follow-up if generation/source is wrong.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: Type/source verification plus docs consistency.
  - Skills: [] - No specialized skill required.
  - Omitted: [`opensrc`] - Source is local, not external package source.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: [10, 11] | Blocked By: []

  **References**:
  - Issue: `/home/mhm/.local/share/opencode/tool-output/tool_e40b5dbe2001gIsoH4VS2Ub2Vx:1031-1046` - ToolContext inconsistency evidence.
  - Docs: `apps/docs/content/docs/plugins/ai-tools.mdx` - AI tool docs.
  - Docs: `apps/docs/content/docs/plugins/hooks-reference.mdx` - hook/tool context docs.
  - Local source: plugin SDK ToolContext type.

  **Acceptance Criteria**:
  - [ ] Evidence identifies actual `ToolContext` fields and optionality.
  - [ ] AI tools and hooks reference agree on context fields.
  - [ ] Docs distinguish guaranteed versus optional fields.
  - [ ] Any generated-reference mismatch is documented as follow-up, not hand-waved.

  **QA Scenarios**:
  ```
  Scenario: ToolContext docs match source
    Tool: Bash + source/file inspection
    Steps: Compare source evidence to `ai-tools.mdx` and `hooks-reference.mdx`.
    Expected: Documented fields and optionality match actual type.
    Evidence: .sisyphus/evidence/task-6-tool-context-match.md

  Scenario: Examples do not rely on absent fields
    Tool: Bash + file inspection
    Steps: Inspect plugin AI examples for `context.client`, `context.logger`, `context.sessionId`, `context.abort`.
    Expected: Every field used is source-backed or guarded as optional.
    Evidence: .sisyphus/evidence/task-6-tool-context-examples.md
  ```

  **Commit**: YES | Message: `docs(plugins): align AI tool context fields` | Files: [`apps/docs/content/docs/plugins/ai-tools.mdx`, `apps/docs/content/docs/plugins/hooks-reference.mdx`]

- [ ] 7. Strengthen plugin getting-started file layout and load verification

  **What to do**:
  - Verify local plugin loading behavior: relative paths, cwd/config location, TypeScript versus compiled JavaScript support, and `--config` needs.
  - Add concrete file tree to `apps/docs/content/docs/plugins/getting-started.mdx`.
  - State exact directory to run from and exact command.
  - State whether `./plugins/greeting-bot.ts` loads directly or must compile to JS.
  - Show expected startup log that proves plugin loaded.
  - Add “if no greeting appears” troubleshooting block.

  **Must NOT do**:
  - Do not claim `.ts` plugins load directly unless source/runtime verification proves it.
  - Do not modify plugin loader code.
  - Do not introduce watch/hot-reload claims without verification.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: Local source behavior verification and precise docs.
  - Skills: [] - No specialized skill required.
  - Omitted: [`npm-package`] - Publishing package structure is not the primary change here.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: [10, 11] | Blocked By: []

  **References**:
  - Issue: `/home/mhm/.local/share/opencode/tool-output/tool_e40b5dbe2001gIsoH4VS2Ub2Vx:1047-1063` - plugin file layout/load evidence.
  - Docs: `apps/docs/content/docs/plugins/getting-started.mdx` - target page.
  - Related docs: plugin input/client/hooks/security pages for cross-links.
  - Local source: plugin loading/config resolution implementation.

  **Acceptance Criteria**:
  - [ ] File tree exists and paths are relative to `wa.config.*` or explicitly stated cwd.
  - [ ] Command includes required `--config`/cwd details if applicable.
  - [ ] TypeScript vs JavaScript plugin loading support is source-backed.
  - [ ] Expected startup log and missing-plugin troubleshooting exist.
  - [ ] Evidence records source findings.

  **QA Scenarios**:
  ```
  Scenario: User places plugin in correct location
    Tool: Bash + file inspection
    Steps: Inspect plugin getting-started for file tree and relative path explanation.
    Expected: A reader can place `greeting-bot` relative to config without guessing.
    Evidence: .sisyphus/evidence/task-7-plugin-file-tree.md

  Scenario: Load failure path is diagnosable
    Tool: Bash + file inspection
    Steps: Inspect troubleshooting section for missing log/no greeting cases.
    Expected: Docs list expected log, no-output symptoms, and concrete checks.
    Evidence: .sisyphus/evidence/task-7-plugin-load-troubleshooting.md
  ```

  **Commit**: YES | Message: `docs(plugins): add local plugin load verification` | Files: [`apps/docs/content/docs/plugins/getting-started.mdx`]

- [ ] 8. Rewrite pricing around buyer decisions

  **What to do**:
  - Locate authoritative commercial/licensing source in repo/docs/official links; record evidence in `.sisyphus/evidence/task-8-pricing-source.md`.
  - Rewrite `apps/docs/content/docs/licensing/pricing.mdx` to open with buyer language: “Use this page to decide whether you need a license key.”
  - If prices cannot be shown, state plainly: “Prices are shown in the purchase flow and may change.”
  - Replace vague tier cells with concrete decision criteria.
  - Add direct answers for integration buyers: webhooks, Chatwoot, Node-RED, MCP, plugin SDK.
  - Add a team/organization licensing CTA or current support path based on authoritative source.

  **Must NOT do**:
  - Do not invent prices, license terms, or tier capabilities.
  - Do not leave vague cells like “Sometimes no,” “Targeted,” or “Highest” where concrete criteria are possible.
  - Do not use internal phrases like “decision surface.”

  **Recommended Agent Profile**:
  - Category: `writing` - Reason: Revenue-adjacent docs rewrite with guardrails.
  - Skills: [] - No specialized skill required.
  - Omitted: [`pricing-strategy`] - This is documentation clarity, not a new pricing strategy.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: [11] | Blocked By: []

  **References**:
  - Issue: `/home/mhm/.local/share/opencode/tool-output/tool_e40b5dbe2001gIsoH4VS2Ub2Vx:1064-1082` - pricing evidence and TODOs.
  - Docs: `apps/docs/content/docs/licensing/pricing.mdx` - target page.
  - README support/licensing links: `/home/mhm/projects/open-wa/wa-automate-nodejs/README.md` - support and license key links.

  **Acceptance Criteria**:
  - [ ] Pricing page opens with buyer decision language.
  - [ ] Any no-price explanation is plain and directs to purchase/support flow.
  - [ ] Integration buyer FAQ covers webhooks, Chatwoot, Node-RED, MCP, and plugin SDK.
  - [ ] Team/org path is explicit or marked as current support path.
  - [ ] All commercial claims cite/link authoritative source or are omitted.

  **QA Scenarios**:
  ```
  Scenario: Buyer can decide next action
    Tool: Bash + file inspection
    Steps: Inspect pricing page intro, tier table, and FAQ.
    Expected: Reader sees whether they need a key, where prices are shown, and support/team path.
    Evidence: .sisyphus/evidence/task-8-pricing-buyer-path.md

  Scenario: Pricing docs do not invent terms
    Tool: Bash + source/link inspection
    Steps: Compare pricing claims against authoritative source evidence.
    Expected: Every concrete claim is source-backed; uncertain claims are removed or directed to support.
    Evidence: .sisyphus/evidence/task-8-pricing-authority.md
  ```

  **Commit**: YES | Message: `docs(licensing): clarify pricing buyer decisions` | Files: [`apps/docs/content/docs/licensing/pricing.mdx`]

- [ ] 9. Demote architecture and meta commentary after task success

  **What to do**:
  - Update `apps/docs/src/components/homepage.tsx` labels such as `Control loop`, `Generated reference`, `Operations baseline`, and `open-wa docs command center` to user-job language.
  - Update `apps/docs/content/docs/concepts/how-it-works.mdx` so it starts with what the reader can do/understand, not why the docs are split.
  - Search docs for legacy/history or maintainer-context paragraphs that appear before the current task path; include terms such as `legacy`, `old`, `why docs`, `control loop`, `command center`, `generated reference`, `operations baseline`, `why we`, `this page exists`, and `rewrite`; move meta/history copy after the current path or remove it if it does not prevent a real copy-paste mistake.
  - Coordinate with Task 1: Task 1 owns homepage link targets; this task owns homepage labels/copy tone.

  **Must NOT do**:
  - Do not redesign homepage layout or component structure.
  - Do not remove legacy/history warnings that prevent real v4/v5 copy-paste mistakes.
  - Do not change routes, loaders, Vite config, or Fumadocs architecture.

  **Recommended Agent Profile**:
  - Category: `writing` - Reason: Cross-page copy clarity and information hierarchy.
  - Skills: [] - No specialized skill required.
  - Omitted: [`frontend-philosophy`] - Visual redesign is out of scope.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: [11] | Blocked By: []

  **References**:
  - Issue: `/home/mhm/.local/share/opencode/tool-output/tool_e40b5dbe2001gIsoH4VS2Ub2Vx:1104-1119` - architecture/meta commentary evidence and TODOs.
  - Copy rules: `/home/mhm/.local/share/opencode/tool-output/tool_e40b5dbe2001gIsoH4VS2Ub2Vx:842-849` - start with jobs, avoid internal nouns, safety before capability.
  - Docs: `apps/docs/src/components/homepage.tsx` - homepage labels and cards.
  - Docs: `apps/docs/content/docs/concepts/how-it-works.mdx` - concepts page meta commentary.
  - Search targets: docs pages containing `legacy`, `old`, `why docs`, `control loop`, `command center`, `generated reference`, `operations baseline`, `why we`, `this page exists`, or `rewrite`.

  **Acceptance Criteria**:
  - [ ] Homepage labels use user jobs/outcomes rather than internal architecture nouns.
  - [ ] Task 1's homepage quickstart link targets remain intact after label/copy demotion.
  - [ ] `how-it-works.mdx` does not lead with “why docs are split” meta commentary.
  - [ ] Legacy/history content appears only after the current path or where it prevents a real copy-paste mistake.
  - [ ] Evidence lists searched terms and every changed page.

  **QA Scenarios**:
  ```
  Scenario: Homepage cards speak in user jobs
    Tool: Bash + file inspection
    Steps: Inspect `apps/docs/src/components/homepage.tsx` after changes.
    Expected: Internal labels are replaced with concrete jobs/outcomes while links remain intact.
    Evidence: .sisyphus/evidence/task-9-homepage-job-language.md

  Scenario: Concepts page starts with current task context
    Tool: Bash + file inspection
    Steps: Inspect the first screen of `apps/docs/content/docs/concepts/how-it-works.mdx`.
    Expected: Page leads with what the reader can understand/do today; meta commentary is moved later or removed.
    Evidence: .sisyphus/evidence/task-9-concepts-meta-demotion.md
  ```

  **Commit**: YES | Message: `docs: demote architecture-first copy` | Files: [`apps/docs/src/components/homepage.tsx`, `apps/docs/content/docs/concepts/how-it-works.mdx`]

- [ ] 10. Add explicit response expectations to first-run and high-risk flows

  **What to do**:
  - After Tasks 1-7, run a targeted expected-output pass over quickstart, MCP, plugin, webhook, and Docker docs.
  - For quickstart: show expected HTTP status and sample response body.
  - For MCP: show expected dashboard state and tool listing behavior.
  - For plugin load: show expected startup log and missing-config/missing-plugin error behavior.
  - For webhooks: show one-request local test and expected raw log output.
  - For Docker persistence: show no-QR-after-restart proof.
  - Capture real output where feasible; otherwise label examples illustrative/abbreviated.

  **Must NOT do**:
  - Do not fabricate logs or responses as if captured.
  - Do not run external WhatsApp/CRM flows requiring human authentication unless environment is already configured.
  - Do not duplicate content if previous tasks already added complete expected outputs; consolidate instead.

  **Recommended Agent Profile**:
  - Category: `writing` - Reason: Cross-page expected-output consistency pass.
  - Skills: [] - No specialized skill required.
  - Omitted: [`agent-browser`] - Browser automation is not required unless final docs build is served.

  **Parallelization**: Can Parallel: NO | Wave 3 | Blocks: [11, Final] | Blocked By: [1,2,3,4,5,6,7]

  **References**:
  - Issue: `/home/mhm/.local/share/opencode/tool-output/tool_e40b5dbe2001gIsoH4VS2Ub2Vx:1083-1101` - expected output gaps.
  - Docs: `apps/docs/content/docs/getting-started/quickstart.mdx` - first-run output.
  - Docs: `apps/docs/content/docs/guides/mcp.mdx` - MCP output.
  - Docs: `apps/docs/content/docs/plugins/getting-started.mdx` - plugin output.
  - Docs: `apps/docs/content/docs/guides/webhooks-for-business.mdx` and `apps/docs/content/docs/client-and-integrations/webhook-payloads.mdx` - webhook output.
  - Docs: `apps/docs/content/docs/getting-started/docker.mdx` - Docker persistence output.

  **Acceptance Criteria**:
  - [ ] Each named flow includes prerequisites, command/code, expected output, failure mode, and next step.
  - [ ] Captured versus illustrative outputs are clearly distinguished.
  - [ ] Evidence includes a table of changed pages and whether each five-part flow requirement is satisfied.

  **QA Scenarios**:
  ```
  Scenario: High-risk flows all include expected outputs
    Tool: Bash + file inspection
    Steps: Inspect quickstart, MCP, plugin getting-started, webhook, and Docker pages.
    Expected: Each page includes expected success output and at least one failure signal.
    Evidence: .sisyphus/evidence/task-10-expected-output-matrix.md

  Scenario: No fabricated output is presented as captured
    Tool: Bash + file inspection
    Steps: Search changed docs for output blocks and labels.
    Expected: Non-captured output is labeled illustrative/abbreviated; captured output references evidence.
    Evidence: .sisyphus/evidence/task-10-output-labels.md
  ```

  **Commit**: YES | Message: `docs: add expected outputs to high-risk flows` | Files: [`apps/docs/content/docs/getting-started/quickstart.mdx`, `apps/docs/content/docs/guides/mcp.mdx`, `apps/docs/content/docs/plugins/getting-started.mdx`, `apps/docs/content/docs/guides/webhooks-for-business.mdx`, `apps/docs/content/docs/client-and-integrations/webhook-payloads.mdx`, `apps/docs/content/docs/getting-started/docker.mdx`]

- [ ] 11. Add docs quality gate and persona regression checklist

  **What to do**:
  - Add a reusable docs quality checklist at exactly `apps/docs/DOCS-QUALITY-CHECKLIST.md`.
  - Include issue #3337 maintenance rules:
    - CLI flag/config schema changes update configuration guide, relevant task guide, Docker/deployment examples.
    - Webhook envelope/plugin config changes update both conceptual guide and reference page.
    - Plugin type changes update hooks-reference, plugin-input, plugin-client, and ai-tools if affected.
    - Generated reference `unknown` output is traced to source types and not patched manually.
    - Each release checks first-run quickstart, Docker quickstart, MCP startup, webhook receiver, and plugin load examples.
  - Add persona regression checklist for older issue rounds:
    - Junior Node dev: can run, authenticate, send first message, understand chat IDs/risk/current API.
    - AI/ML engineer: can configure MCP/HTTP safely and understand AI example boundaries.
    - CRM/helpdesk operator: can choose webhook/Chatwoot/Node-RED/S3 path and understand data flow.
    - Dictation plugin developer: can create/load/test plugin and avoid unsafe TS patterns.
    - Moderation plugin developer: understands post-detection action limits, failure behavior, secrets, and group filtering.
    - Copy red-team: pages start with jobs, avoid internal nouns, safety before capability, expected outputs included.
  - Run final docs validation commands and record known lint blocker if present.

  **Must NOT do**:
  - Do not edit `TODO.md`.
  - Do not create a generic checklist detached from issue #3337 findings.
  - Do not mark generated `unknown` as solved by docs-only edits if source remains ambiguous.

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: Cross-cutting maintenance gate and persona synthesis.
  - Skills: [] - No specialized skill required.
  - Omitted: [`task-management`] - Repo task files are out of scope.

  **Parallelization**: Can Parallel: NO | Wave 3 | Blocks: [Final] | Blocked By: [1,2,3,4,5,6,7,8,9,10]

  **References**:
  - Issue: `/home/mhm/.local/share/opencode/tool-output/tool_e40b5dbe2001gIsoH4VS2Ub2Vx:1104-1173` - quality gate, fixed-vs-current gaps, acceptance criteria.
  - Issue older persona rounds: `/home/mhm/.local/share/opencode/tool-output/tool_e40b5dbe2001gIsoH4VS2Ub2Vx:6-849` - persona regression source.
  - Draft: `.sisyphus/drafts/docs-audit-issue-3337.md` - scope and stale/current decisions.
  - Scripts: `apps/docs/package.json` - `check`, `build`, `lint`.

  **Acceptance Criteria**:
  - [ ] `apps/docs/DOCS-QUALITY-CHECKLIST.md` exists and includes all five issue #3337 gate rules.
  - [ ] Persona regression checklist exists in the quality gate or evidence and covers all six persona/copy groups.
  - [ ] `pnpm --filter docs check` result is recorded.
  - [ ] `pnpm --filter docs build` result is recorded.
  - [ ] `pnpm --filter docs lint` result is recorded; lint failure is acceptable only if it exactly matches the documented pre-existing `apps/docs/source.config` import signature.
  - [ ] Evidence states that `TODO.md`, runtime source, dependencies, route loaders, and Vite/Fumadocs architecture were not changed.

  **QA Scenarios**:
  ```
  Scenario: Docs quality gate is reusable
    Tool: Bash + file inspection
    Steps: Inspect `apps/docs/DOCS-QUALITY-CHECKLIST.md`.
    Expected: Checklist maps future code/API/docs changes to exact docs pages that must be reviewed.
    Evidence: .sisyphus/evidence/task-11-quality-gate.md

  Scenario: Older issue personas remain covered
    Tool: Bash + file inspection
    Steps: Compare older issue persona concerns against final changed docs and checklist.
    Expected: Each persona has a pass/fail regression entry with concrete docs paths.
    Evidence: .sisyphus/evidence/task-11-persona-regression.md
  ```

  **Commit**: YES | Message: `docs: add quality gate for docs drift` | Files: [`apps/docs/DOCS-QUALITY-CHECKLIST.md`]

## Final Verification Wave (MANDATORY — after ALL implementation tasks)
> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.
> **Do NOT auto-proceed after verification. Wait for user's explicit approval before marking work complete.**
> **Never mark F1-F4 as checked before getting user's okay.** Rejection or user feedback -> fix -> re-run -> present again -> wait for okay.

- [ ] F1. Plan Compliance Audit — oracle
  - Verify every issue #3337 current action is represented.
  - Cite each latest-audit item 1-12 with the task ID that covers it, or explicit out-of-scope rationale for item 12.
  - Verify older persona rounds are regression checks.
  - Verify no out-of-scope file edits.
  - Evidence: `.sisyphus/evidence/f1-plan-compliance.md`.

- [ ] F2. Code Quality Review — unspecified-high
  - Review docs changes for unsafe TypeScript examples, broken snippets, bad anchors, and internal jargon.
  - Verify no dependency/runtime/source/config architecture changes.
  - Evidence: `.sisyphus/evidence/f2-code-quality.md`.

- [ ] F3. Real Manual QA — unspecified-high (+ browser if docs build runs)
  - Run `pnpm --filter docs check`, `pnpm --filter docs build`, and attempted `pnpm --filter docs lint`.
  - F3 may pass with lint failure only if the failure exactly matches the documented pre-existing `apps/docs/source.config` import signature; any other lint/build/check failure is a blocker.
  - If docs server can run, inspect rendered homepage/docs root/quickstart/MCP/plugin/webhook/pricing pages.
  - Evidence: `.sisyphus/evidence/f3-real-qa.md`.

- [ ] F4. Scope Fidelity Check — deep
  - Compare final diff to issue #3337, draft scope, Metis guardrails, Oracle guardrails, and no-go constraints.
  - Confirm `TODO.md` and runtime code were not touched.
  - Evidence: `.sisyphus/evidence/f4-scope-fidelity.md`.

## Commit Strategy
- Prefer one commit per task if changes are isolated and reviewable.
- Use conventional commit messages listed per task.
- Do not commit pre-existing `TODO.md` changes.
- Do not include `.sisyphus/evidence` unless the project convention expects evidence artifacts committed; otherwise keep evidence local and summarize in PR/body.
- Do not push unless explicitly requested.

## Success Criteria
- A new user can find and complete “start API, authenticate, send first message” from homepage/docs root in one click.
- Webhook receiver examples use one canonical envelope everywhere or explicitly document legacy/current variants.
- Docker examples use env vars and volume mounts that match real runtime behavior.
- MCP setup works whether CLI flag is parsed or config is required.
- AI and plugin examples either run as written or are explicitly marked as pseudocode/placeholders.
- Plugin tool context docs match source exactly.
- Pricing gives buyers a next action without internal license abstractions or invented commercial claims.
- Every high-risk guide includes prerequisites, command/code, expected output, failure mode, and next step.
- Docs quality gate prevents future drift between CLI flags, config schema, plugin contracts, webhook envelopes, generated methods, MCP schemas, and guides.
