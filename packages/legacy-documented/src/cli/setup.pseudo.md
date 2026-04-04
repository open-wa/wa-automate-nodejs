# cli/setup.ts pseudocode trace

Source of truth: `packages/legacy/src/cli/setup.ts`

## Role

- Builds the CLI/runtime config object before `cli/index.ts` calls `create(...)`.
- This is where env vars, config files, defaults, CLI flags, logging setup, and a few launch-time derived values are merged.

## Main flow

- `cli/setup.ts:18-27` — re-export newer config helpers from `@open-wa/config`.
- `cli/setup.ts:31-72` — load the config schema and derive CLI/meow flag definitions from it.
- `cli/setup.ts:74-104` — generate CLI help text.
- `cli/setup.ts:106-110` — `envArgs()` reads `WA_*` environment variables and camel-cases them into config keys.
- `cli/setup.ts:112-148` — `configFile(config?)` resolves config from:
  - explicit path
  - `WA_CLI_CONFIG`
  - base64-encoded config
  - local `cli.config.json` / `cli.config.js`.
- `cli/setup.ts:150-334` — `cli()` is the real CLI bootstrap:
  - parse flags with meow
  - derive `CURRENT_SESSION_ID`
  - set up logging early if needed
  - merge config sources in priority order: env → config file → CLI flags
  - compute final `PORT`, spinner, and `createConfig`
  - normalize convenience aliases such as `session`, `licenseKey`, `popup`, `viewport`, `webhook`, `twilioWebhook`
  - optionally enable “session data only” capture mode
  - return `{ createConfig, cliConfig, PORT, spinner }`.

## Migration note for v5

- The file already treats env vars as a top-level config source even outside Docker.
- If v5 makes env absorption unconditional and multi-device implicit, this bootstrap can likely lose several legacy compatibility branches.

## Behavioral contract / pseudo tests

- CLI bootstrap should produce a single resolved config object before server/client startup begins.
- Config resolution should follow a documented precedence order.
- Logging should be initialized early enough to observe config/bootstrap failures.
- Session-id derivation should happen before dynamic config-function execution.
- URL-like config inputs should be validated or explicitly accepted when skipping validation is requested.
- “Session data only” modes should exit after completing their one-shot responsibility.

## Parity status

| Dimension | Status | Note |
| --- | --- | --- |
| Config resolution before startup | Preserve | This contract should remain. |
| Exact meow/config-library usage | Intentionally changed | Tooling can change. |
| Env as top-level source | Preserve | Matches v5 policy direction. |

## Inputs / outputs / side effects

- Inputs: env vars, config file/base64 config, CLI flags, session id.
- Outputs: resolved `createConfig`, `cliConfig`, port, spinner.
- Side effects: early logging setup, generated API key/session-data-only exit hooks.

## Failure taxonomy

- Invalid config file
- Invalid URL/webhook config
- Port resolution ambiguity
- Logging bootstrap failure

## Dependency contracts

- Requires: option inventory, file loader, env mapper, logger setup.
- Guarantees: downstream CLI host starts from one resolved config picture.

## State transitions

- `RAW_ENV_AND_FLAGS -> FILE_RESOLVED -> CONFIG_RESOLVED -> CLI_READY`
