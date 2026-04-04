# v5 Easy API CLI Parity Audit

**Date:** 2026-03-31  
**Scope:** Legacy Easy API CLI vs current `@open-wa/wa-automate` v5 CLI  
**Legacy reference:** `packages/legacy/bin/server.js`, `packages/legacy/src/cli/*`  
**v5 reference:** `packages/wa-automate/src/cli-runtime.ts`, `packages/api/*`, `packages/wa-automate/src/server/*`

---

## Executive summary

The current v5 Easy API CLI is **not behaviorally equivalent** to the legacy Easy API CLI.

The main issue is not just “a few missing flags.” The legacy CLI has a complete startup orchestration layer:

1. parse a large CLI surface and aliases,
2. merge config from file/env/CLI,
3. mutate runtime/create config based on legacy semantics,
4. pre-generate docs/collections,
5. create the client,
6. attach API/auth/docs/stats/media/socket/webhook/tunnel/integration middleware,
7. announce runtime URLs and webhooks,
8. send ready hooks and launch-time side effects.

The current v5 CLI mostly does:

1. parse a tiny hardcoded arg subset,
2. validate a small config object,
3. start the shared API server,
4. create/start the client,
5. stop there.

So the user report is correct: the v5 CLI currently boots the core server/client path, but it does **far less** than legacy Easy API during startup.

---

## Dist / executable state

The legacy build artifacts are **not deleted**.

Verified present:

- `packages/legacy/bin/server.js`
- `packages/legacy/dist/index.cjs`
- `packages/legacy/dist/cli/index.cjs`

So the issue is not missing legacy artifacts. The issue is parity between what legacy does and what the v5 CLI currently does.

---

## Startup flow comparison

### Legacy Easy API CLI

Entry chain:

- `packages/legacy/bin/server.js`
- `packages/legacy/src/cli/index.ts`
- `packages/legacy/src/cli/setup.ts`
- `packages/legacy/src/cli/server.ts`

Observed legacy startup responsibilities:

1. parse CLI flags from a large option surface in `cli-options.ts`
2. merge config from:
   - defaults
   - env vars
   - config file / base64 config
   - CLI flags
3. apply legacy config mutations:
   - `headful -> headless = false`
   - `popup -> createConfig.popup = PORT`
   - `license-key -> createConfig.licenseKey`
   - `use-session-id-in-path`
   - generated API key when `-k ''`
   - viewport parsing
4. prepare webhooks and Twilio/Chatwoot config before client creation
5. generate API collections/docs inputs before client creation when requested
6. create client via legacy `create(...)`
7. attach runtime behaviors after client creation:
   - auth layer
   - docs explorer
   - swagger-stats
   - media middleware
   - `client.middleware(...)`
   - socket.io bridge
   - tunnel
   - Twilio-compatible webhook
   - Botpress handler
   - Chatwoot handler
   - ready webhook
   - emit unread messages
   - on-call / auto-reject
   - logout kill semantics
8. print runtime URLs and startup hints

### Current v5 CLI

Entry chain:

- `packages/wa-automate/src/cli.ts`
- `packages/wa-automate/src/cli-runtime.ts`
- `packages/api/*`

Observed current v5 startup responsibilities:

1. parse only:
   - `--session-id`
   - `--port`
   - `--host`
   - `--api-key`
   - `--log-level`
   - `--no-ezqr`
   - `--name`
   - `--pm2`
2. validate with `ConfigSchema.safeParse(...)`
3. start shared API server
4. create core transport/client
5. wire QR event to server
6. start client
7. print ready state

It does **not** currently run a legacy-equivalent startup orchestration layer.

---

## Confirmed missing or broken parity

## 1. CLI flag parity is far behind

### Confirmed missing legacy flags/aliases in current v5 CLI

- `--headful`
- `--use-chrome`
- `-w/--webhook`
- `-v/--verbose`
- `--log-console`
- `--aggressive-garbage-collection`
- `--license-key`
- `--generate-api-docs`
- `--stats`
- `--use-session-id-in-path`
- `--ready-webhook`
- `--emit-unread`
- `--on-call`
- `--auto-reject`
- `--tunnel`
- `--chatwoot-*`
- `--twilio-webhook`
- `--bot-press-url`
- `--config`
- env/file-based CLI config loading

### User-visible effect

Flags like `--headful` literally do nothing because they are never parsed or merged into config.

---

## 2. Config resolution parity is missing

Legacy uses `packages/legacy/src/cli/setup.ts` to merge:

- config file
- env vars
- CLI flags
- defaults

Current v5 CLI bypasses `@open-wa/config.resolveConfig(...)` entirely.

### User-visible effect

- `WA_*` env vars are not reliably part of the CLI contract
- config files are ignored
- legacy aliases and derived mutations never happen

---

## 3. Runtime middleware/integration parity is incomplete

### Legacy runtime features present

- auth layer with key/api_key compatibility
- `client.middleware(...)`
- runtime explorer/docs
- swagger-stats
- media static route
- socket.io message bridge
- Twilio-compatible webhook
- Botpress integration
- Chatwoot integration
- tunnel support
- process exit/restart endpoints
- disengage endpoint

### v5 state

Shared API package now covers:

- API route dispatch
- explorer/meta/docs
- auth key aliases
- selected deprecation shims
- socket manager

But the v5 CLI does **not** yet compose the legacy integration layer equivalents.

### User-visible effect

- webhook-related flags may parse later but still not produce legacy behavior unless the runtime wiring exists
- `swagger-stats` is currently a compatibility redirect/deprecation path, not legacy stats functionality
- media/integration routes are not parity-complete

---

## 4. Logging/startup UX parity is much thinner

Legacy startup emits many setup-stage messages via spinner/logging and surfaces URLs/tunnel/webhook guidance.

Current v5 CLI emits only a minimal server/client lifecycle trace.

### User-visible effect

- “looks like it does nothing” is understandable if the browser is headless and there are no legacy-style setup logs
- startup hints for webhook/docs/stats/socket are mostly absent

---

## 5. `--headful` specifically

Legacy behavior:

- `cliConfig.headful` is translated into `createConfig.headless = false`

Current behavior before fix:

- `--headful` was ignored because it was never parsed

Status at time of audit:

- **confirmed broken in the initially shipped v5 CLI path**
- should be treated as a P0 CLI regression

---

## What the current v5 CLI is doing correctly

- direct built CLI entry now works again (`node packages/wa-automate/dist/cli.cjs ...`)
- shared API runtime boots
- health endpoint works
- command metadata endpoint works
- QR handoff works
- client reaches `READY`
- shared API docs/meta/shim routes work
- orchestrator proxy docs pathing now works with external base prefixing

So this is not a dead runtime — it is a **thin runtime** missing a lot of legacy Easy API product behavior.

---

## Likely root causes

### Root cause 1

The v5 CLI was implemented as a direct runtime bootstrapper, not as a replacement for the legacy Easy API orchestration layer.

### Root cause 2

The repo already has a proper config package, but the v5 CLI does not use it for CLI/file/env resolution.

### Root cause 3

Shared API extraction moved transport concerns into `packages/api`, but the product-layer integrations that legacy Easy API provided were not ported alongside it.

### Root cause 4

The current verification previously proved “server/client starts” but not “legacy Easy API feature contract is reproduced.”

---

## Recommended fix order

### P0

1. route v5 CLI through `@open-wa/config.resolveConfig(...)`
2. restore high-signal legacy flag aliases:
   - `--headful`
   - `--use-chrome`
   - `-w/--webhook`
   - `-v/--verbose`
   - `--license-key`
   - `--aggressive-garbage-collection`
3. print richer startup/runtime hints so behavior is visible

### P1

4. restore ready-webhook and webhook-registration wiring
5. restore `useSessionIdInPath` CLI composition path
6. decide whether to reintroduce real swagger-stats or keep the deprecation route
7. restore media/tunnel/integration surfaces selectively

### P2

8. reintroduce advanced legacy integrations only where still in scope:
   - Twilio
   - Chatwoot
   - Botpress
   - cloudflared/custom tunnel

---

## Bottom line

The user complaint is correct.

The current v5 Easy API runtime is **bootable**, but it is **not yet a full behavioral replacement** for the legacy Easy API CLI. The missing parity is concentrated in:

1. CLI/config resolution,
2. startup UX/logging,
3. webhook/integration wiring,
4. selected runtime middleware/features.

The legacy package artifacts still exist. The real problem is parity, not missing legacy build output.

---

## Follow-up status after P0 CLI recovery slice

After the initial audit, a focused P0 recovery slice was completed.

### Now fixed

- direct built CLI execution works again:
  - `node packages/wa-automate/dist/cli.cjs ...`
- v5 CLI now resolves config through `@open-wa/config.resolveConfig(...)`
- the v5 CLI now parses and surfaces these legacy-style flags/aliases:
  - `--headful`
  - `--use-chrome`
  - `-w/--webhook`
  - `-v/--verbose`
  - `--license-key`
  - `--aggressive-garbage-collection`
  - `--key` / `-k` aliasing to api key
  - `-p` and `-h` host/port aliases
- startup output is richer and now prints runtime URLs plus compatibility warnings

### Still not parity-complete

- parsed does **not** mean fully implemented
- webhook-related flags are still warning-only in the v5 CLI boot path
- `--license-key` is parsed into config but not fully reconnected to legacy runtime semantics
- `--aggressive-garbage-collection` is parsed into config but not fully reconnected to legacy runtime semantics
- `--use-session-id-in-path` remains incomplete and should still be treated as not restored
- Chatwoot/Twilio/BotPress/tunnel/stats/media parity remains incomplete

### Updated interpretation

The current state is:

> **the v5 CLI is now bootable, config-aware, and no longer silently ignores the highest-signal legacy flags, but it is still not a full legacy Easy API feature-parity replacement.**
