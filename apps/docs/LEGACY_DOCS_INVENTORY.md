# Legacy Docs Migration Inventory

This file is the working ledger for migrating `docs-legacy` into `apps/docs`.

## Canonical migration rules

- **Migrate and rewrite** all authored docs under `docs-legacy/docs/**` that still describe supported product behavior.
- **Regenerate and re-home** the active API reference from `docs-legacy/docs/reference/**` instead of hand-porting those files one-by-one.
- **Do not migrate** `docs-legacy/docs/api/**`; it is stale duplicate output from an older TypeDoc run.
- **Include** important orphan content outside `docs-legacy/docs/**` when it is product documentation, especially `SOCKET_CLIENT_CONNECTION_GUIDE.md`.
- **Exclude from docs migration** repo-internal content such as `README.md`, `decisions/**`, `exec-plans/**`, template pages, and the Docusaurus blog unless explicitly requested later.

## Corrected target IA

- `content/docs/index.mdx` — overview / product entry
- `content/docs/getting-started/*`
- `content/docs/guides/*`
- `content/docs/client-and-integrations/*`
- `content/docs/concepts/*`
- `content/docs/reference/*`
- `content/docs/operations-and-troubleshooting/*`
- `content/docs/licensing/*`

## Authored legacy docs

| Source | Target | Action | Rationale |
|---|---|---|---|
| `docs/intro.md` | `index.mdx` | **merge + rewrite** | Current page is only a thin entry stub. It should become the new docs landing page and route users to the main modes: Easy API, custom code, Docker, SocketClient. |
| `docs/get-started/quick-run.md` | `getting-started/easy-api.mdx` | **keep + rewrite** | Important entry path, but it is CLI-heavy, dated in tone, and should be rewritten around current Easy API flows and current flags. |
| `docs/get-started/docker.md` | `getting-started/docker.mdx` | **keep + rewrite** | Still useful, but the Apple Silicon warning is likely outdated and must be revalidated against current images. |
| `docs/get-started/installation.md` | `getting-started/custom-code.mdx` | **keep + rewrite** | Core path for library users. Needs updated install guidance, modern imports, and current browser/runtime notes. |
| `docs/get-started/link-code.md` | `getting-started/link-code.mdx` | **keep + rewrite** | Feature still exists (`linkCode` is present in current code), but the doc needs Fumadocs formatting and better placement as an auth option. |
| `docs/configuration/config-object.md` | `guides/configuration-and-cli.mdx` | **merge + rewrite** | Still conceptually correct, but stronger as part of one current configuration/CLI guide with fresh links into the reference surface. |
| `docs/configuration/the-client.md` | `getting-started/custom-code.mdx` | **merge + rewrite** | Useful concept, but overlaps with installation/custom code. Better folded into the custom-code starting path. |
| `docs/configuration/command-line-options.md` | `guides/configuration-and-cli.mdx` | **merge + regenerate** | Current page is only a placeholder populated by a Docusaurus plugin. The new guide documents the important flags and notes the deeper schema/reference dependency. |
| `docs/configuration/capture-qr.md` | `guides/session-events.mdx` | **merge + rewrite** | Real behavior, but contains broken `/TODO` links and belongs in one session-events guide. |
| `docs/configuration/capture-sd.md` | `guides/session-events.mdx` | **merge + rewrite** | Still useful; now folded into the consolidated lifecycle/session-events guide. |
| `docs/configuration/launch-events.md` | `guides/session-events.mdx` | **merge + rewrite** | Still useful and clearly related to `ev`; now part of the same session-events guide. |
| `docs/configuration/multiple-sessions.md` | `guides/multiple-sessions.mdx` | **keep + rewrite** | Still valuable. Needs stronger guidance on orchestration and current session architecture. |
| `docs/configuration/licensed-features.mdx` | `licensing/licensed-features.mdx` | **keep + major rewrite** | User-facing and important, but contains Docusaurus Tabs/imports, old sales language, and needs structural cleanup plus current license behavior review. |
| `docs/how-to/send-messages.md` | `guides/messages.mdx` | **merge + rewrite** | Important how-to, but now grouped with receiving, location, typing, and ack guidance in one coherent messaging guide. |
| `docs/how-to/receive-messages.md` | `guides/messages.mdx` | **merge + rewrite** | Still valid conceptually; merged into the consolidated messaging guide. |
| `docs/how-to/send-files.md` | `guides/media.mdx` | **merge + rewrite** | Valuable, but now serves as the base of the unified media guide. |
| `docs/how-to/receive-files.md` | — | **drop** | Empty file. No recoverable authored content to migrate. |
| `docs/how-to/send-videos.md` | `guides/media.mdx` | **merge** | Narrow subset of media sending. Folded into the unified media guide. |
| `docs/how-to/sendfile.md` | `guides/media.mdx` | **drop / merge placeholder** | Placeholder-only file with no content. Covered by the unified media guide. |
| `docs/how-to/decrypt-media.md` | `guides/media.mdx` | **merge + rewrite** | Important feature doc, now folded into the media guide with explicit caveats. |
| `docs/how-to/groups.md` | `guides/groups.mdx` | **merge + rewrite** | Good content but overlaps heavily with participant management and group-event handling. |
| `docs/how-to/manage-participants.md` | `guides/groups.mdx` | **merge** | Too narrow and redundant once group management is consolidated. |
| `docs/how-to/react-to-group-events.md` | `guides/groups.mdx` | **merge + rewrite** | Worth keeping, but now part of one coherent groups guide. |
| `docs/how-to/read-state.md` | — | **drop** | Empty file. No authored content to preserve. |
| `docs/how-to/location.md` | `guides/messages.mdx` | **merge + rewrite** | Still useful, but grouped into the main messaging guide. |
| `docs/how-to/create-api.md` | `getting-started/easy-api.mdx` | **merge** | Incomplete page; concept belongs inside Easy API getting-started instead of standalone. |
| `docs/how-to/use-a-proxy.md` | `client-and-integrations/proxying-a-session.mdx` | **keep + rewrite** | Still relevant and distinct from Cloudflare session proxy; should become a general outbound proxy guide. |
| `docs/how-to/handle-errors.md` | `operations-and-troubleshooting/error-handling.mdx` | **keep + rewrite** | Strong conceptual doc; belongs in troubleshooting/operations rather than how-to. |
| `docs/how-to/incoming-calls.md` | `guides/messages.mdx` | **merge + rewrite** | Small but still useful; folded into the main messaging/event guide. |
| `docs/how-to/detect-logout.md` | `operations-and-troubleshooting/detect-logouts.mdx` | **keep + rewrite** | Operational guidance, not a basic how-to. |
| `docs/how-to/misc.md` | `guides/messages.mdx` | **merge + rewrite** | Mixed bag of typing, profile pics, and read receipts. Folded into the consolidated messaging guide. |
| `docs/concepts/how-it-works.md` | `concepts/how-it-works.mdx` | **keep + rewrite** | Core orientation content, but currently far too thin for the new docs. |
| `docs/concepts/glossary.md` | `concepts/glossary.mdx` | **keep + major rewrite** | Useful, but partially outdated around legacy/MD portability and ends in an unfinished table. |
| `docs/advanced/best-practices.md` | `operations-and-troubleshooting/best-practices.mdx` | **keep + rewrite** | Valuable operational guidance, but wording is dated and some advice needs modern validation. |
| `docs/Integrations/chatwoot.md` | `client-and-integrations/chatwoot.mdx` | **keep + rewrite** | Chatwoot support still exists in the repo, but the doc is rough, CLI-focused, and needs a clean integration walkthrough. |
| `SOCKET_CLIENT_CONNECTION_GUIDE.md` | `client-and-integrations/socket-client.mdx` | **keep + major rewrite** | Important orphan guide. SocketClient is clearly current, but the page needs code cleanup, corrected async examples, and integration into the main nav. |

## Generated and non-authored content

| Source | Target | Action | Rationale |
|---|---|---|---|
| `docs/reference/**/*.md` | `reference/**` | **keep + regenerate** | This is the authoritative generated API reference set. It should be rebuilt and re-homed under Fumadocs, not manually rewritten page-by-page. |
| `docs/reference/index.md` | `reference/index.mdx` | **keep + regenerate** | Current reference index is generated and should be recreated from the active TypeDoc output. |
| `docs/api/index.md` | — | **drop** | Stale duplicate TypeDoc root from an older generation (`v4.71.15`) and not the current reference source. |

## Excluded legacy markdown content (not part of public docs migration)

| Source | Action | Rationale |
|---|---|---|
| `README.md` | **exclude** | Repository README, not part of the docs site migration. |
| `decisions/2026-03-30-v5-cutover-decisions.md` | **exclude** | Internal decision record, not public product documentation. |
| `exec-plans/active/v5-easy-api-cutover-plan.md` | **exclude** | Internal execution plan, not user documentation. |
| `src/pages/markdown-page.md` | **exclude** | Docusaurus template/sample page, not real project docs. |

## Content debt discovered during inventory

- Legacy Docusaurus-only syntax appears throughout authored docs: `[[symbol]]`, admonitions, Docusaurus Tabs, and plugin-generated placeholders.
- Several pages are incomplete or empty: `receive-files`, `read-state`, `sendfile`, `create-api`.
- Some docs have clearly broken links or placeholders (`/TODO`, `|@|cliOptionsTable|@|`).
- The old how-to section is too flat and should be redistributed into message/media/groups/events/operations.
- The docs corpus contains important product guidance outside the Docusaurus `docs/` tree (`SOCKET_CLIENT_CONNECTION_GUIDE.md`).
