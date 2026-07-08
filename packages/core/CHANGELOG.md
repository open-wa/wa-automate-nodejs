# @open-wa/core

## 5.0.0-alpha.8

### Patch Changes

- [#3373](https://github.com/open-wa/wa-automate-nodejs/pull/3373) [`6a55aef`](https://github.com/open-wa/wa-automate-nodejs/commit/6a55aef602b347bfffc8550e448585e7776baf18) Thanks [@smashah](https://github.com/smashah)! - v5 RC plan (phase 0): hardening, v4-compat harness, Effect v4 foundation, and generated-docs overhaul.
  - **core**: strip crash-inducing browser args (`--single-process` / `--no-zygote`) by default with an `allowDangerousBrowserArgs` escape hatch; Effect v4 foundation — `OpenWAError` boundary (`toPublicError`/`runToPromise`, "Effect never leaks") and `httpClient` retry on Effect.
  - **config**: new `allowDangerousBrowserArgs` option; generated config-reference manifest for the docs config explorer.
  - **wa-automate**: thread `allowDangerousBrowserArgs`; document the Effect-never-leaks boundary in the public contract; reserve `skills/` in published files.
  - **plugin-sdk**: full README (was a stub); reserve `skills/` in published files.
  - **schema**: richer generated client reference — typed outputs (no more `unknown`), per-method request/response examples, registry-derived internals pages, generated events and licensed-methods pages, and interface-aware usage examples (Embedded / SocketClient / Easy API).

  Also (non-published): Docker image now builds on Node 22, the legacy v4 package was removed, a v4-compat parity harness and docs quality gate were added, and the docs site gained a config explorer and a site-wide preferred-interface selector.

- Updated dependencies [[`6a55aef`](https://github.com/open-wa/wa-automate-nodejs/commit/6a55aef602b347bfffc8550e448585e7776baf18)]:
  - @open-wa/config@5.0.0-alpha.8
  - @open-wa/schema@5.0.0-alpha.8
  - @open-wa/plugin-sdk@5.0.0-alpha.8
  - @open-wa/driver-interface@5.0.0-alpha.8
  - @open-wa/driver-playwright@5.0.0-alpha.8
  - @open-wa/driver-puppeteer@5.0.0-alpha.8
  - @open-wa/hyperemitter@5.0.0-alpha.8
  - @open-wa/logger@5.0.0-alpha.8

## 5.0.0-alpha.7

### Patch Changes

- Allow pre-auth QR bootstrap to continue when WhatsApp Web exposes the QR surface before `WAWebCollections` is injectable, gate dashboard runtime API calls until the session is ready, and return an empty plugin manifest when no plugins are mounted.

- Updated dependencies []:
  - @open-wa/config@5.0.0-alpha.7
  - @open-wa/driver-interface@5.0.0-alpha.7
  - @open-wa/driver-playwright@5.0.0-alpha.7
  - @open-wa/driver-puppeteer@5.0.0-alpha.7
  - @open-wa/hyperemitter@5.0.0-alpha.7
  - @open-wa/logger@5.0.0-alpha.7
  - @open-wa/plugin-sdk@5.0.0-alpha.7
  - @open-wa/schema@5.0.0-alpha.7

## 5.0.0-alpha.6

### Patch Changes

- Updated dependencies []:
  - @open-wa/config@5.0.0-alpha.6
  - @open-wa/driver-interface@5.0.0-alpha.6
  - @open-wa/driver-playwright@5.0.0-alpha.6
  - @open-wa/driver-puppeteer@5.0.0-alpha.6
  - @open-wa/hyperemitter@5.0.0-alpha.6
  - @open-wa/logger@5.0.0-alpha.6
  - @open-wa/plugin-sdk@5.0.0-alpha.6
  - @open-wa/schema@5.0.0-alpha.6

## 5.0.0-alpha.5

### Patch Changes

- Updated dependencies []:
  - @open-wa/config@5.0.0-alpha.5
  - @open-wa/driver-interface@5.0.0-alpha.5
  - @open-wa/driver-playwright@5.0.0-alpha.5
  - @open-wa/driver-puppeteer@5.0.0-alpha.5
  - @open-wa/hyperemitter@5.0.0-alpha.5
  - @open-wa/logger@5.0.0-alpha.5
  - @open-wa/plugin-sdk@5.0.0-alpha.5
  - @open-wa/schema@5.0.0-alpha.5

## 5.0.0-alpha.4

### Patch Changes

- Updated dependencies []:
  - @open-wa/config@5.0.0-alpha.4
  - @open-wa/driver-interface@5.0.0-alpha.4
  - @open-wa/driver-playwright@5.0.0-alpha.4
  - @open-wa/driver-puppeteer@5.0.0-alpha.4
  - @open-wa/hyperemitter@5.0.0-alpha.4
  - @open-wa/logger@5.0.0-alpha.4
  - @open-wa/plugin-sdk@5.0.0-alpha.4
  - @open-wa/schema@5.0.0-alpha.4

## 5.0.0-alpha.3

### Patch Changes

- Updated dependencies []:
  - @open-wa/schema@5.0.0-alpha.3
  - @open-wa/config@5.0.0-alpha.3
  - @open-wa/driver-interface@5.0.0-alpha.3
  - @open-wa/driver-playwright@5.0.0-alpha.3
  - @open-wa/driver-puppeteer@5.0.0-alpha.3
  - @open-wa/hyperemitter@5.0.0-alpha.3
  - @open-wa/logger@5.0.0-alpha.3
  - @open-wa/plugin-sdk@5.0.0-alpha.3

## 5.0.0-alpha.2

### Patch Changes

- Updated dependencies []:
  - @open-wa/hyperemitter@5.0.0-alpha.2
  - @open-wa/config@5.0.0-alpha.2
  - @open-wa/driver-interface@5.0.0-alpha.2
  - @open-wa/driver-playwright@5.0.0-alpha.2
  - @open-wa/driver-puppeteer@5.0.0-alpha.2
  - @open-wa/logger@5.0.0-alpha.2
  - @open-wa/plugin-sdk@5.0.0-alpha.2
  - @open-wa/schema@5.0.0-alpha.2

## 6.0.0-alpha.2

### Minor Changes

- Dry run minor bump

### Patch Changes

- Updated dependencies []:
  - @open-wa/config@6.0.0-alpha.2
  - @open-wa/driver-interface@6.0.0-alpha.2
  - @open-wa/driver-playwright@6.0.0-alpha.2
  - @open-wa/driver-puppeteer@6.0.0-alpha.2
  - @open-wa/logger@6.0.0-alpha.2
  - @open-wa/plugin-sdk@5.0.0-alpha.2
  - @open-wa/schema@6.0.0-alpha.2
  - @open-wa/hyperemitter@6.0.0-alpha.2

## 5.0.1-alpha.2

### Patch Changes

- Dry run patch bump

- Updated dependencies []:
  - @open-wa/config@5.0.1-alpha.2
  - @open-wa/driver-interface@5.0.1-alpha.2
  - @open-wa/driver-playwright@5.0.1-alpha.2
  - @open-wa/driver-puppeteer@5.0.1-alpha.2
  - @open-wa/hyperemitter@5.0.1-alpha.2
  - @open-wa/logger@5.0.1-alpha.2
  - @open-wa/plugin-sdk@5.0.1-alpha.2
  - @open-wa/schema@5.0.1-alpha.2
