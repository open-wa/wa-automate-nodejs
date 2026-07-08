# @open-wa/plugin-sdk

## 5.0.0-alpha.8

### Patch Changes

- [#3373](https://github.com/open-wa/wa-automate-nodejs/pull/3373) [`6a55aef`](https://github.com/open-wa/wa-automate-nodejs/commit/6a55aef602b347bfffc8550e448585e7776baf18) Thanks [@smashah](https://github.com/smashah)! - v5 RC plan (phase 0): hardening, v4-compat harness, Effect v4 foundation, and generated-docs overhaul.
  - **core**: strip crash-inducing browser args (`--single-process` / `--no-zygote`) by default with an `allowDangerousBrowserArgs` escape hatch; Effect v4 foundation — `OpenWAError` boundary (`toPublicError`/`runToPromise`, "Effect never leaks") and `httpClient` retry on Effect.
  - **config**: new `allowDangerousBrowserArgs` option; generated config-reference manifest for the docs config explorer.
  - **wa-automate**: thread `allowDangerousBrowserArgs`; document the Effect-never-leaks boundary in the public contract; reserve `skills/` in published files.
  - **plugin-sdk**: full README (was a stub); reserve `skills/` in published files.
  - **schema**: richer generated client reference — typed outputs (no more `unknown`), per-method request/response examples, registry-derived internals pages, generated events and licensed-methods pages, and interface-aware usage examples (Embedded / SocketClient / Easy API).

  Also (non-published): Docker image now builds on Node 22, the legacy v4 package was removed, a v4-compat parity harness and docs quality gate were added, and the docs site gained a config explorer and a site-wide preferred-interface selector.

## 5.0.0-alpha.7

## 5.0.0-alpha.6

## 5.0.0-alpha.5

## 5.0.0-alpha.4

## 5.0.0-alpha.3

## 5.0.0-alpha.2

## 5.0.0-alpha.2

### Minor Changes

- Dry run minor bump

## 5.0.1-alpha.2

### Patch Changes

- Dry run patch bump
