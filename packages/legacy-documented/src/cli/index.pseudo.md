# cli/index.ts pseudocode trace

Source of truth: `packages/legacy/src/cli/index.ts`

## Role

- Main Easy API / CLI entrypoint.
- This file is the outer shell that turns `create(...)` into a full server process with API, webhooks, docs, socket server, and optional integrations.

## Main flow

- `cli/index.ts:13-28` — `ready(config)` sends a process-ready signal and optionally POSTs a ready webhook.
- `cli/index.ts:30-215` — `start()`:
  1. call `cli()` from `setup.ts` to build `cliConfig`, `createConfig`, `PORT`, `spinner`
  2. mark `OWA_CLI=true`
  3. initialize the Express app and optional CORS
  4. probe the selected port for an existing compatible instance
  5. normalize headful/headless behavior
  6. optionally register launch-event webhooks on `ev`
  7. optionally pre-generate API docs/stats collections
  8. call `create({...createConfig})`
  9. once client exists, wire HTTP server, logout handling, optional integrations, webhooks, keepAlive behavior, docs/stats, media middleware, REST middleware, socket server, tunnel, and ready notifications.

## Key bootstrap dependency

- `cli/index.ts:91` — the CLI ultimately enters the session lifecycle through `create({...createConfig})`, so all server/integration behavior is layered on top of the same core initializer flow.

## Migration note for v5

- This file already looks like a proto “integration host”.
- If socket mode becomes mandatory for plugins/integrations, this outer shell is one of the main places where that default should become structural instead of flag-driven.

## Behavioral contract / pseudo tests

- CLI start should fully resolve config and create the client before claiming API readiness.
- Ready signaling should happen only after the host surfaces actually exist.
- Launch-event webhook fan-out should remain optional and filterable.
- API host mode should be able to run with or without docs/stats/integrations.
- Socket/integration transport should be available by default in v5, even if its exact boot path differs from legacy.
- Logout behavior in CLI mode should be explicit: either exit, remain alive, or hand off to another recovery contract.

### Observable evidence

- Ready state should be externally visible through bound ports, ready hooks, process messaging, and/or startup logs.
- Failure before readiness should not masquerade as a partially running API host.

## Parity status

| Dimension | Status | Note |
| --- | --- | --- |
| CLI as outer integration host | Preserve | Still a useful runtime surface. |
| Exact CLI boot choreography | Intentionally changed | v5 can restructure while keeping outcomes. |
| Socket opt-in behavior | Not carried forward | Socket/integration host should be default. |

## Inputs / outputs / side effects

- Inputs: resolved CLI/config values and environment.
- Outputs: running API/integration host around a ready client.
- Side effects: process messaging, webhook calls, port binding, integration startup, server/tunnel/socket initialization.

## Failure taxonomy

- Pre-client host bootstrap failure
- Client creation failure
- Port conflict
- Integration startup failure
- Post-ready webhook/transport failure

## Dependency contracts

- Requires: CLI setup, client bootstrap, server host helpers.
- Guarantees: server/integration surfaces layer on top of the same core session bootstrap.

## State transitions

- `CLI_READY -> CLIENT_CREATING -> CLIENT_READY -> HOST_SURFACES_BOUND -> READY_SIGNALLED`
- `ANY_HOST_SETUP_FAILURE -> TERMINAL_CLI_FAILURE`
