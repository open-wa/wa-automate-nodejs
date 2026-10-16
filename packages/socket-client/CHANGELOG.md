# @open-wa/socket-client














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

- [#3540](https://github.com/open-wa/wa-automate-nodejs/pull/3540)  *(minor)*
  - ♻️ Replace runtime EventEmitter2 imports with the tuned Effect-backed HyperEmitter hybrid, removing the CommonJS named import behind [#3534](https://github.com/open-wa/wa-automate-nodejs/issues/3534). Ordinary callbacks remain synchronous; Promise and Effect listener work has scoped ownership.
  - 🏷️ Preserve the shared `ev` API: `*` and `**` wildcards, variadic arguments, listener context, `emitAsync()` results, QR and session-data alias payloads, and session metadata. Add `onScoped`, `onAnyScoped`, and `emitEffect` for Effect applications.
  - ✨ Expose optional native PubSub observations and scoped Stream/subscription helpers through HyperEmitter and shared `ev`, with lazy creation, explicit buffer policies, and emitter-owned shutdown.

## 5.5.1
<sub>2026-10-12</sub>

- *(patch)* Version bump from group with `@open-wa/core` v5.5.1

## 5.5.0
<sub>2026-10-12</sub>

- [#3503](https://github.com/open-wa/wa-automate-nodejs/pull/3503)  *(minor)*
  - ✨ Add the public licensed-calling audio preview: bound Call controls, file and stream audio, recordings, remote media helpers and the Calls dashboard.
  - 🔒️ Calling uses the existing licensed patch delivery; expected availability failures log an actionable reason without stopping messaging.
  - ♻️ Own call media in scoped resources and finalize recordings on observed call end, media failure, disconnect and browser recovery.
- [#3520](https://github.com/open-wa/wa-automate-nodejs/pull/3520)  *(minor)*
  - Add live session patch refresh and dashboard license activation through a shared page replacement coordinator, retaining the browser process and host session.
  - Preserve portable persistence ownership and report refresh progress; WhatsApp reloads without pausing or draining application operations.
  - Evaluate the existing license response during refresh and report rejected keys without blocking public functionality.
- [#3521](https://github.com/open-wa/wa-automate-nodejs/pull/3521)  *(patch)*
  - ✨ Add experimental WhatsApp startup through Easy API `--lightpanda`, with a separately prepared cached Lightpanda 1.0.0 executable, worker/crypto bridges and compression streams. Custom native CryptoKey and IndexedDB request-lifetime source patches are retained separately; the stock downloaded executable has not been replaced.
  - 🐛 Refresh and clear QR state through native pairing state, expose compact-session checkpoint phases, reactivate checkpointing after document replacement, and preserve startup failures when cleanup also fails.
  - 💄 Explain Lightpanda's unavailable Live Portal in dashboard health and the portal itself, because this browser has no graphical rendering pipeline.
  - 📝 Include controlled stock-browser benchmark evidence and an editable launch film with OpenWA identity, the upcoming command and local onboarding steps.

  Lightpanda support remains experimental. Custom native Debug runs reached authenticated library READY and loaded chat/contact data, but subsequent reload recovery failed with session takeover and initialization errors. Automatic recovery, outbound delivery, long-session durability and full Chrome parity remain unconfirmed. The controlled 1,000-record DOM benchmark does not measure authenticated WhatsApp performance or sync speed. This bump prepares the next minor release; it does not publish it.

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
  - @open-wa/wa-automate-types-only@5.0.0

## 5.0.0-alpha.7

### Patch Changes

- Updated dependencies []:
  - @open-wa/wa-automate-types-only@5.0.0-alpha.7

## 5.0.0-alpha.6

### Patch Changes

- Updated dependencies []:
  - @open-wa/wa-automate-types-only@5.0.0-alpha.6

## 5.0.0-alpha.5

### Patch Changes

- Updated dependencies []:
  - @open-wa/wa-automate-types-only@5.0.0-alpha.5

## 5.0.0-alpha.4

### Patch Changes

- Updated dependencies []:
  - @open-wa/wa-automate-types-only@5.0.0-alpha.4

## 5.0.0-alpha.3

### Patch Changes

- Updated dependencies []:
  - @open-wa/wa-automate-types-only@5.0.0-alpha.3

## 5.0.0-alpha.2

### Patch Changes

- Updated dependencies []:
  - @open-wa/wa-automate-types-only@5.0.0-alpha.2

## 6.0.0-alpha.2

### Minor Changes

- Dry run minor bump

### Patch Changes

- Updated dependencies []:
  - @open-wa/wa-automate-types-only@5.0.0-alpha.2

## 5.0.1-alpha.2

### Patch Changes

- Dry run patch bump

- Updated dependencies []:
  - @open-wa/wa-automate-types-only@5.0.1-alpha.2
