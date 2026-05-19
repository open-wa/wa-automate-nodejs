# Issue #3337 Docs Quality Checklist

Use this checklist to prevent the documentation drift called out by issue #3337. It is not a generic docs checklist: every item below maps future source, schema, example, and release changes to the exact docs pages that must be reviewed before the change ships.

## Scope Guard

Docs-only audits for issue #3337 must stay inside documentation and evidence files unless a later plan explicitly scopes broader work.

- Do not edit `TODO.md`.
- Do not edit runtime source, SDK source, integration source, dependencies, package files, route loaders, Vite config, Fumadocs config, or TanStack/Fumadocs architecture.
- Do not add packages or change build tooling to make a docs example pass.
- Do not manually patch generated reference pages as if the source type is fixed. Trace the source type or schema first, then update the source-backed generator path in a separately scoped task if needed.
- Do not claim live output was captured unless a real command was run and the evidence records the command and result.

## Issue #3337 Maintenance Rules

1. CLI flag/config schema changes update the configuration guide, the relevant task guide, and Docker/deployment examples.
   - Always review `apps/docs/content/docs/guides/configuration-and-cli.mdx`.
   - For first-run or hosted API flags, review `apps/docs/content/docs/getting-started/quickstart.mdx` and `apps/docs/content/docs/getting-started/easy-api.mdx`.
   - For Docker/env/session flags, review `apps/docs/content/docs/getting-started/docker.mdx` and `apps/docs/content/docs/operations/security-and-deployment.mdx`.
   - For MCP flags or config, review `apps/docs/content/docs/guides/mcp.mdx`.
   - For plugin loading config, review `apps/docs/content/docs/plugins/getting-started.mdx`, `apps/docs/content/docs/plugins/plugin-input.mdx`, and `apps/docs/content/docs/plugins/plugin-client.mdx` when the user-facing config affects plugin authors.

2. Webhook envelope/plugin config changes update both the conceptual guide and the reference page.
   - Review `apps/docs/content/docs/guides/webhooks-for-business.mdx` for the conceptual receiver flow, low-code mappings, raw-body logging, and failure behavior.
   - Review `apps/docs/content/docs/client-and-integrations/webhook-payloads.mdx` for the exact envelope, event names, field paths, retry behavior, and receiver snippets.
   - If webhook setup depends on CLI/config/env names, also review `apps/docs/content/docs/guides/configuration-and-cli.mdx`, `apps/docs/content/docs/getting-started/docker.mdx`, and `apps/docs/content/docs/operations/security-and-deployment.mdx`.

3. Plugin type changes update hooks-reference, plugin-input, plugin-client, and ai-tools if affected.
   - Review `apps/docs/content/docs/plugins/hooks-reference.mdx` for hook signatures, `ToolContext`, return contracts, and execution examples.
   - Review `apps/docs/content/docs/plugins/plugin-input.mdx` for `PluginInput`, lifecycle inputs, config shape, and guaranteed versus optional fields.
   - Review `apps/docs/content/docs/plugins/plugin-client.mdx` for client access patterns and safe runtime calls.
   - Review `apps/docs/content/docs/plugins/ai-tools.mdx` when the type change affects tool definitions, AI tool context, or examples exposed to agents.
   - Review `apps/docs/content/docs/plugins/getting-started.mdx` when the type change alters local plugin file layout, load behavior, or startup verification.
   - Review `apps/docs/content/docs/plugins/example-dictation.mdx` and `apps/docs/content/docs/plugins/example-moderation.mdx` when the changed type appears in persona-facing examples.

4. Generated reference `unknown` output is traced to source types and not patched manually.
   - First inspect the source type or schema that feeds the generated reference.
   - Record whether the source type is intentionally `unknown`, insufficiently typed, or lost during generation.
   - If docs-only scope applies, document the unresolved generated-reference risk in evidence instead of editing generated output as if the source is fixed.
   - Review generated reference pages under `apps/docs/content/docs/reference/` only to confirm the symptom and affected user path.
   - Review source-backed explanatory pages such as `apps/docs/content/docs/reference/index.mdx`, `apps/docs/content/docs/reference/client/index.mdx`, `apps/docs/content/docs/plugins/hooks-reference.mdx`, and `apps/docs/content/docs/plugins/ai-tools.mdx` for safe clarification that does not misrepresent the generated contract.

5. Each release checks first-run quickstart, Docker quickstart, MCP startup, webhook receiver, and plugin load examples.
   - First-run quickstart: review `apps/docs/content/docs/getting-started/quickstart.mdx`, `apps/docs/content/docs/index.mdx`, `apps/docs/src/components/homepage.tsx`, and `apps/docs/content/docs/getting-started/meta.json` for discoverability, prerequisites, command, expected output, failure mode, and next step.
   - Docker quickstart and persistence: review `apps/docs/content/docs/getting-started/docker.mdx`, `apps/docs/content/docs/guides/configuration-and-cli.mdx`, and `apps/docs/content/docs/operations/security-and-deployment.mdx` for `WA_*` env names, volume/session persistence, restart/no-QR proof, and deployment warnings.
   - MCP startup: review `apps/docs/content/docs/guides/mcp.mdx` and `apps/docs/content/docs/guides/configuration-and-cli.mdx` for CLI/config fallback, API key requirement, health/tool-list checks, and safe-client boundaries.
   - Webhook receiver: review `apps/docs/content/docs/guides/webhooks-for-business.mdx` and `apps/docs/content/docs/client-and-integrations/webhook-payloads.mdx` for canonical envelope, raw-body logging, field extraction, local receiver test, and retry/failure behavior.
   - Plugin load examples: review `apps/docs/content/docs/plugins/getting-started.mdx`, `apps/docs/content/docs/plugins/hooks-reference.mdx`, `apps/docs/content/docs/plugins/plugin-input.mdx`, `apps/docs/content/docs/plugins/plugin-client.mdx`, and `apps/docs/content/docs/plugins/ai-tools.mdx` for runtime-loadable file paths, config location, expected startup logs, missing-plugin troubleshooting, and source-backed type usage.

## Change-Type Review Matrix

| Change type | Required docs to review | Evidence to record |
| --- | --- | --- |
| CLI flag or `wa.config.*` schema change | `apps/docs/content/docs/guides/configuration-and-cli.mdx`; affected task guide such as `quickstart.mdx`, `easy-api.mdx`, `mcp.mdx`, or `plugins/getting-started.mdx`; Docker/deployment pages when env or startup changes | Source/schema location, old docs wording, updated docs paths, and validation command status |
| Docker image, env var, profile, or persistence change | `apps/docs/content/docs/getting-started/docker.mdx`; `apps/docs/content/docs/guides/configuration-and-cli.mdx`; `apps/docs/content/docs/operations/security-and-deployment.mdx` | Source-backed env names, volume/path behavior, restart/no-QR verification status, and whether output is captured or illustrative |
| Webhook envelope, event, retry, or plugin config change | `apps/docs/content/docs/guides/webhooks-for-business.mdx`; `apps/docs/content/docs/client-and-integrations/webhook-payloads.mdx`; config/Docker/deployment pages if startup config changed | Source envelope fields, event names, receiver field paths, local receiver expected output, and stale-shape search result |
| MCP startup, auth, transport, tool metadata, or dashboard change | `apps/docs/content/docs/guides/mcp.mdx`; `apps/docs/content/docs/guides/configuration-and-cli.mdx`; `apps/docs/content/docs/getting-started/quickstart.mdx` if first-run setup changes | CLI/config source, health/tool-list expected state, auth failure behavior, and safety-boundary check |
| Plugin SDK hook, tool, input, or client type change | `apps/docs/content/docs/plugins/hooks-reference.mdx`; `apps/docs/content/docs/plugins/plugin-input.mdx`; `apps/docs/content/docs/plugins/plugin-client.mdx`; `apps/docs/content/docs/plugins/ai-tools.mdx`; examples if affected | Source type path, guaranteed/optional fields, unsafe example search, and generated-reference mismatch if any |
| Plugin local loading or packaging behavior change | `apps/docs/content/docs/plugins/getting-started.mdx`; `apps/docs/content/docs/plugins/publishing.mdx`; `apps/docs/content/docs/plugins/security-model.mdx` if trust/install boundaries change | Loader source path, file tree, cwd/config assumptions, TypeScript vs JavaScript support, expected log and failure log |
| AI example dependency or method signature change | `apps/docs/content/docs/guides/ai-agent-patterns.mdx`; `apps/docs/content/docs/guides/mcp.mdx`; affected reference page under `apps/docs/content/docs/reference/` | Signature source, install commands or placeholder labels, runnable versus pattern label, and expected behavior |
| Pricing/licensing behavior change | `apps/docs/content/docs/licensing/pricing.mdx`; `apps/docs/content/docs/licensing/licensed-features.mdx`; README support/license links if cited | Authoritative source link/path, buyer decision wording, no invented price/term claims, and support path |
| Architecture or concept copy change | `apps/docs/src/components/homepage.tsx`; `apps/docs/content/docs/index.mdx`; `apps/docs/content/docs/concepts/how-it-works.mdx`; `apps/docs/content/docs/concepts/packages.mdx` if package boundaries change | Before/after user-job language, preserved quickstart links, and search terms left unchanged with rationale |
| Expected output or release example change | `quickstart.mdx`; `docker.mdx`; `mcp.mdx`; `plugins/getting-started.mdx`; `webhooks-for-business.mdx`; `webhook-payloads.mdx` | Prerequisite, command/code, expected output, failure mode, next step, and captured-versus-illustrative label |

## Persona Regression Checklist

The six regression groups come from the active issue #3337 plan's persona list. If exact historical issue comments are unavailable in the workspace, use this list as the source of persona coverage and say so in evidence.

| Persona group | Regression question | Exact docs to review |
| --- | --- | --- |
| Junior Node dev | Can a new user run the first server, authenticate, send a first message, understand chat IDs, understand risky actions, and stay on the current API path? | `apps/docs/content/docs/getting-started/quickstart.mdx`; `apps/docs/content/docs/getting-started/easy-api.mdx`; `apps/docs/content/docs/getting-started/custom-code.mdx`; `apps/docs/content/docs/guides/chatid-primer.mdx`; `apps/docs/content/docs/reference/client/chatids.mdx`; `apps/docs/content/docs/operations-and-troubleshooting/best-practices.mdx` |
| AI/ML engineer | Can an AI integrator configure MCP or HTTP safely, see the auth boundary, and understand which AI examples are runnable versus patterns? | `apps/docs/content/docs/guides/mcp.mdx`; `apps/docs/content/docs/guides/ai-agent-patterns.mdx`; `apps/docs/content/docs/plugins/ai-tools.mdx`; `apps/docs/content/docs/getting-started/quickstart.mdx` |
| CRM/helpdesk operator | Can an operator choose webhook, Chatwoot, Node-RED, or S3 paths and understand the data flow before wiring a helpdesk? | `apps/docs/content/docs/guides/webhooks-for-business.mdx`; `apps/docs/content/docs/client-and-integrations/webhook-payloads.mdx`; `apps/docs/content/docs/client-and-integrations/chatwoot.mdx`; `apps/docs/content/docs/guides/node-red.mdx`; `apps/docs/content/docs/guides/s3-media.mdx`; `apps/docs/content/docs/guides/integrations-overview.mdx` |
| Dictation plugin developer | Can a plugin author create, load, and test a dictation-style plugin without unsafe TypeScript patterns? | `apps/docs/content/docs/plugins/getting-started.mdx`; `apps/docs/content/docs/plugins/example-dictation.mdx`; `apps/docs/content/docs/plugins/plugin-input.mdx`; `apps/docs/content/docs/plugins/plugin-client.mdx`; `apps/docs/content/docs/plugins/hooks-reference.mdx`; `apps/docs/content/docs/plugins/security-model.mdx` |
| Moderation plugin developer | Can a moderation author understand post-detection action limits, failure behavior, secrets, and group filtering before shipping? | `apps/docs/content/docs/plugins/example-moderation.mdx`; `apps/docs/content/docs/guides/group-filtering.mdx`; `apps/docs/content/docs/guides/message-deletion.mdx`; `apps/docs/content/docs/guides/config-secrets.mdx`; `apps/docs/content/docs/plugins/security-model.mdx`; `apps/docs/content/docs/operations/security-and-deployment.mdx` |
| Copy red-team | Do changed pages start with user jobs, avoid internal nouns, put safety before capability, and include expected outputs where users copy commands? | `apps/docs/src/components/homepage.tsx`; `apps/docs/content/docs/index.mdx`; `apps/docs/content/docs/concepts/how-it-works.mdx`; `apps/docs/content/docs/getting-started/quickstart.mdx`; `apps/docs/content/docs/guides/mcp.mdx`; `apps/docs/content/docs/plugins/getting-started.mdx`; `apps/docs/content/docs/guides/webhooks-for-business.mdx`; `apps/docs/content/docs/getting-started/docker.mdx` |

## Release Gate

Before a release or docs audit is marked complete for issue #3337 drift prevention, record evidence for these checks:

- First-run quickstart: prerequisites, `npx` command, authentication expectation, API docs proof of life, `sendText` expected output, auth failure, and next guide.
- Docker persistence: `WA_*` env names, mounted session/profile directory, restart/no-QR checklist, and deployment warning.
- MCP startup: config and CLI fallback, mandatory API key, `/health` MCP capability state, tool listing check, dashboard state, and 401/403/session-not-ready troubleshooting.
- Webhook receiver: canonical `{ webhookId, sessionId, event, payload, timestamp }` envelope, raw-body log before transformation, sender/text/message-id extraction, local `curl` receiver proof, and retry/failure behavior.
- Plugin load examples: runtime-loadable `.mjs` or compiled `.js`, config-relative path, expected `plugin_loaded` and `plugin_registered` logs, missing-plugin/config troubleshooting, and source-backed `ToolContext` usage.

## Validation Record Template

Copy this into the task evidence for every future issue #3337 docs drift check.

| Gate | Result | Evidence |
| --- | --- | --- |
| `pnpm --filter docs check` | Pending or pass/fail | Command output path or orchestrator note |
| `pnpm --filter docs build` | Pending or pass/fail | Command output path or orchestrator note |
| `pnpm --filter docs lint` | Pending or pass/fail | Command output path or known `apps/docs/source.config` import blocker note |
| Scope guard | Pass/fail | Confirm no `TODO.md`, runtime source, dependencies, route loaders, Vite config, or Fumadocs config edits |
| Generated `unknown` source trace | Pass/fail/not applicable | Source type/schema path and decision |
| Persona regression | Pass/fail | Persona table with docs paths reviewed |
