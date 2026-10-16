# @open-wa/mcp














## 5.6.6
<sub>2026-10-16</sub>

- *(patch)* Version bump from group with `@open-wa/hyperemitter` v5.6.6

## 5.6.5
<sub>2026-10-16</sub>

- *(patch)* Version bump from group with `@open-wa/core` v5.6.5

## 5.6.4
<sub>2026-10-16</sub>

- *(patch)* Version bump from group with `@open-wa/api` v5.6.4, `@open-wa/stickers` v5.6.4

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

- [#3539](https://github.com/open-wa/wa-automate-nodejs/pull/3539)  *(minor)*
  - ✨ Discover OpenWA event payloads through AsyncAPI 3.1 at `/meta/asyncapi.json` and the generated event reference in the docs.
  - ✨ Let ChatGPT Work subscribe to incoming messages, acknowledgements and session state changes through signed, durable webhook MCP Events. Hosted MCP now serves protocol `2026-07-28`; use a client that supports MCP 2.0. Subscriptions have a finite lifetime and events missed while OpenWA is offline aren't replayed.

## 5.5.1
<sub>2026-10-12</sub>

- *(patch)* Version bump from group with `@open-wa/core` v5.5.1

## 5.5.0
<sub>2026-10-12</sub>

- [#3520](https://github.com/open-wa/wa-automate-nodejs/pull/3520)  *(minor)*
  - Add live session patch refresh and dashboard license activation through a shared page replacement coordinator, retaining the browser process and host session.
  - Preserve portable persistence ownership and report refresh progress; WhatsApp reloads without pausing or draining application operations.
  - Evaluate the existing license response during refresh and report rejected keys without blocking public functionality.

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

- Updated dependencies [[`6a55aef`](https://github.com/open-wa/wa-automate-nodejs/commit/6a55aef602b347bfffc8550e448585e7776baf18)]:
  - @open-wa/config@5.0.0
  - @open-wa/schema@5.0.0
  - @open-wa/utils@5.0.0

## 5.0.0-alpha.7

### Patch Changes

- Updated dependencies []:
  - @open-wa/config@5.0.0-alpha.7
  - @open-wa/schema@5.0.0-alpha.7
  - @open-wa/utils@5.0.0-alpha.7

## 5.0.0-alpha.6

### Patch Changes

- Updated dependencies []:
  - @open-wa/config@5.0.0-alpha.6
  - @open-wa/schema@5.0.0-alpha.6
  - @open-wa/utils@5.0.0-alpha.6

## 5.0.0-alpha.5

### Patch Changes

- Updated dependencies []:
  - @open-wa/config@5.0.0-alpha.5
  - @open-wa/schema@5.0.0-alpha.5
  - @open-wa/utils@5.0.0-alpha.5

## 5.0.0-alpha.4

### Patch Changes

- Updated dependencies []:
  - @open-wa/config@5.0.0-alpha.4
  - @open-wa/schema@5.0.0-alpha.4
  - @open-wa/utils@5.0.0-alpha.4

## 5.0.0-alpha.3

### Patch Changes

- Updated dependencies []:
  - @open-wa/schema@5.0.0-alpha.3
  - @open-wa/config@5.0.0-alpha.3
  - @open-wa/utils@5.0.0-alpha.3

## 5.0.0-alpha.2

### Patch Changes

- Updated dependencies []:
  - @open-wa/config@5.0.0-alpha.2
  - @open-wa/schema@5.0.0-alpha.2
  - @open-wa/utils@5.0.0-alpha.2

## 5.0.0-alpha.2

### Minor Changes

- Dry run minor bump

### Patch Changes

- Updated dependencies []:
  - @open-wa/config@6.0.0-alpha.2
  - @open-wa/schema@6.0.0-alpha.2
  - @open-wa/utils@6.0.0-alpha.2

## 5.0.1-alpha.2

### Patch Changes

- Dry run patch bump

- Updated dependencies []:
  - @open-wa/config@5.0.1-alpha.2
  - @open-wa/schema@5.0.1-alpha.2
  - @open-wa/utils@5.0.1-alpha.2
