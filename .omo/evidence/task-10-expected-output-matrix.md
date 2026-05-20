# Task 10 expected output matrix

Result: pass.

| Flow | Page | Evidence |
| --- | --- | --- |
| Quickstart sendText | `quickstart.mdx` | Prereqs, command, illustrative success body, auth failure, next guide links. |
| MCP startup | `mcp.mdx` | Config command, `/health` expected state, tool metadata check, missing API key/401/tools/session troubleshooting. |
| Plugin load | `plugins/getting-started.mdx` | File tree, command, illustrative load/failure logs, no-greeting troubleshooting, next publishing link. |
| Webhook receiver | `webhooks-for-business.mdx`, `webhook-payloads.mdx` | Local `curl`, raw log output, 204/401/400 behavior, retry/failure notes, next production step. |
| Docker persistence | `docker.mdx` | Volume/env command, restart checklist, illustrative no-QR output, failure checks, deployment next step. |

Additional stale-claim sweep:
- `guides/multiple-sessions.mdx` no longer presents CLI `--webhook` commands as the per-session delivery setup.
- `apps/docs/public/llms-install.md` no longer uses `/root/.open-wa` for persistence and no longer calls `client.kill()` in the embedded shutdown snippet.
