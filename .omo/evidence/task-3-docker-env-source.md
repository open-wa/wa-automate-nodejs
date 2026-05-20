# Task 3 Docker/env source verification

Result: pass.

Source evidence:
- `packages/config/src/env.ts` loads `WA_*` variables and maps snake case names to config keys from `ConfigSchema`.
- `packages/config/src/schema/config.ts` defines `sessionId`, `port`, `host`, `apiKey`, `userDataDir`, `licenseKey`, `linkCode`, `plugins`, and `pluginConfig` config keys.
- `packages/core/src/createClient.ts` resolves `userDataDir` as explicit `options.userDataDir`, otherwise `${sessionDataPath || '.'}/_IGNORE_${sessionId}`, unless `ephemeral` is true.
- `packages/wa-automate/src/cli-runtime.ts` passes `config.userDataDir`, `config.sessionDataPath`, and `config.ephemeral` into `createClient()`.

Docs evidence:
- Docker/config/deployment docs use `WA_PORT`, `WA_API_KEY`, `WA_SESSION_ID`, and `WA_USER_DATA_DIR` for v5 runtime examples.
