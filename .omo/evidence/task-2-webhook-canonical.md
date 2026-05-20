# Task 2 webhook canonical docs

Result: pass.

The changed webhook docs use the canonical v5 envelope `{ webhookId, sessionId, event, payload, timestamp }` and explicitly warn that older `{ event, data }` snippets are stale for v5 receivers. `guides/multiple-sessions.mdx` no longer shows CLI `--webhook` as the delivery path; it directs per-session webhook delivery to config/plugin setup and labels the CLI flag as not parity-restored in current v5 alpha.
