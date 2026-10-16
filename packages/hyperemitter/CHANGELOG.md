# @open-wa/hyperemitter











## 5.6.3
<sub>2026-10-16</sub>

- *(patch)* Version bump from group with `@open-wa/stickers` v5.6.3

## 5.6.2
<sub>2026-10-15</sub>

- *(patch)* Version bump from group with `@open-wa/api` v5.6.2, `@open-wa/client` v5.6.2, `@open-wa/core` v5.6.2, `@open-wa/logger` v5.6.2, `@open-wa/session-sync` v5.6.2, `@open-wa/wa-automate` v5.6.2

## 5.6.1
<sub>2026-10-14</sub>

- *(patch)* Version bump from group with `@open-wa/core` v5.6.1

## 5.6.0
<sub>2026-10-14</sub>

- [#3540](https://github.com/open-wa/wa-automate-nodejs/pull/3540)  *(minor)*
  - ♻️ Replace runtime EventEmitter2 imports with the tuned Effect-backed HyperEmitter hybrid, removing the CommonJS named import behind [#3534](https://github.com/open-wa/wa-automate-nodejs/issues/3534). Ordinary callbacks remain synchronous; Promise and Effect listener work has scoped ownership.
  - 🏷️ Preserve the shared `ev` API: `*` and `**` wildcards, variadic arguments, listener context, `emitAsync()` results, QR and session-data alias payloads, and session metadata. Add `onScoped`, `onAnyScoped`, and `emitEffect` for Effect applications.
  - ✨ Expose optional native PubSub observations and scoped Stream/subscription helpers through HyperEmitter and shared `ev`, with lazy creation, explicit buffer policies, and emitter-owned shutdown.

## 5.5.1
<sub>2026-10-12</sub>

- *(patch)* Version bump from group with `@open-wa/core` v5.5.1

## 5.5.0
<sub>2026-10-12</sub>

- *(minor)* Version bump from group with `@open-wa/api` v5.5.0, `@open-wa/cli` v5.5.0, `@open-wa/client` v5.5.0, `@open-wa/config` v5.5.0, `@open-wa/core` v5.5.0, `@open-wa/driver-interface` v5.5.0, `@open-wa/driver-lightpanda` v5.5.0, `@open-wa/driver-puppeteer` v5.5.0, `@open-wa/mcp` v5.5.0, `@open-wa/plugin-sdk` v5.5.0, `@open-wa/schema` v5.5.0, `@open-wa/socket-client` v5.5.0, `@open-wa/stickers` v5.4.0, `@open-wa/wa-automate` v5.5.0, `@open-wa/wa-automate-types-only` v5.5.0

## 5.4.0
<sub>2026-09-30</sub>

- *(minor)* Version bump from group with `@open-wa/client` v5.4.0, `@open-wa/config` v5.4.0, `@open-wa/core` v5.4.0, `@open-wa/wa-automate` v5.4.0

## 5.3.0

- 🔖 Version alignment with OpenWA 5.3.0; no separate feature changes.

## 5.2.0
<sub>2026-09-29</sub>

- *(minor)* Version bump from group with `@open-wa/client` v5.2.0, `@open-wa/config` v5.2.0, `@open-wa/core` v5.2.0, `@open-wa/driver-interface` v5.2.0, `@open-wa/driver-puppeteer` v5.2.0, `@open-wa/schema` v5.2.0, `@open-wa/wa-automate` v5.2.0

## 5.1.0
<sub>2026-09-29</sub>

- [#3453](https://github.com/open-wa/wa-automate-nodejs/pull/3453)  *(patch)* Thanks [@smashah](https://github.com/smashah)!
  Keep local Bun development on TypeScript source while publishing entry points that resolve the distributed files. npm packages no longer inherit workspace-only source conditions.
- *(minor)* Version bump from group with `@open-wa/api` v5.1.0, `@open-wa/client` v5.1.0, `@open-wa/core` v5.1.0, `@open-wa/schema` v5.1.0, `@open-wa/wa-automate` v5.1.0

## 5.0.0

### Patch Changes

- Updated dependencies []:
  - @open-wa/logger@5.0.0

## 5.0.0-alpha.7

### Patch Changes

- Updated dependencies []:
  - @open-wa/logger@5.0.0-alpha.7

## 5.0.0-alpha.6

### Patch Changes

- Updated dependencies []:
  - @open-wa/logger@5.0.0-alpha.6

## 5.0.0-alpha.5

### Patch Changes

- Updated dependencies []:
  - @open-wa/logger@5.0.0-alpha.5

## 5.0.0-alpha.4

### Patch Changes

- Updated dependencies []:
  - @open-wa/logger@5.0.0-alpha.4

## 5.0.0-alpha.3

### Patch Changes

- Updated dependencies []:
  - @open-wa/logger@5.0.0-alpha.3

## 5.0.0-alpha.2

### Patch Changes

- Publish HyperEmitter with the v5 alpha package group.

- Updated dependencies []:
  - @open-wa/logger@5.0.0-alpha.2

## 6.0.0-alpha.2

### Patch Changes

- Updated dependencies []:
  - @open-wa/logger@6.0.0-alpha.2

## 5.0.1-alpha.2

### Patch Changes

- Dry run patch bump

- Updated dependencies []:
  - @open-wa/logger@5.0.1-alpha.2
