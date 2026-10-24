# @open-wa/driver-lightpanda






















## 5.9.4
<sub>2026-10-24</sub>

- *(patch)* Version bump from group with `@open-wa/api` v5.9.4, `@open-wa/core` v5.9.4, `@open-wa/driver-puppeteer` v5.9.4, `@open-wa/integration-voxtral` v5.9.4

## 5.9.3
<sub>2026-10-24</sub>

- *(patch)* Version bump from group with `@open-wa/core` v5.9.3

## 5.9.2
<sub>2026-10-24</sub>

- *(patch)* Version bump from group with `@open-wa/core` v5.9.2, `@open-wa/decrypt` v5.9.2, `@open-wa/integration-voxtral` v5.9.2

## 5.9.1
<sub>2026-10-24</sub>

- *(patch)* Version bump from group with `@open-wa/integration-voxtral` v5.9.1

## 5.9.0
<sub>2026-10-24</sub>

- *(minor)* Version bump from group with `@open-wa/config` v5.9.0, `@open-wa/create` v5.9.0, `@open-wa/wa-automate` v5.9.0

## 5.8.0
<sub>2026-10-23</sub>

- *(minor)* Version bump from group with `@open-wa/core` v5.8.0

## 5.7.0
<sub>2026-10-23</sub>

- *(minor)* Version bump from group with `@open-wa/api` v5.7.0, `@open-wa/client` v5.7.0, `@open-wa/core` v5.7.0, `@open-wa/integration-voxtral` v5.7.0, `@open-wa/plugin-sdk` v5.7.0, `@open-wa/schema` v5.7.0, `@open-wa/socket-client` v5.7.0, `@open-wa/wa-automate` v5.7.0

## 5.6.7
<sub>2026-10-22</sub>

- *(patch)* Version bump from group with `@open-wa/core` v5.6.7

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

- *(minor)* Version bump from group with `@open-wa/api` v5.6.0, `@open-wa/config` v5.6.0, `@open-wa/core` v5.6.0, `@open-wa/hyperemitter` v5.6.0, `@open-wa/mcp` v5.6.0, `@open-wa/schema` v5.6.0, `@open-wa/socket-client` v5.6.0

## 5.5.1
<sub>2026-10-12</sub>

- *(patch)* Version bump from group with `@open-wa/core` v5.5.1

## 5.5.0
<sub>2026-10-12</sub>

- [#3521](https://github.com/open-wa/wa-automate-nodejs/pull/3521)  *(minor)*
  - ✨ Add experimental WhatsApp startup through Easy API `--lightpanda`, with a separately prepared cached Lightpanda 1.0.0 executable, worker/crypto bridges and compression streams. Custom native CryptoKey and IndexedDB request-lifetime source patches are retained separately; the stock downloaded executable has not been replaced.
  - 🐛 Refresh and clear QR state through native pairing state, expose compact-session checkpoint phases, reactivate checkpointing after document replacement, and preserve startup failures when cleanup also fails.
  - 💄 Explain Lightpanda's unavailable Live Portal in dashboard health and the portal itself, because this browser has no graphical rendering pipeline.
  - 📝 Include controlled stock-browser benchmark evidence and an editable launch film with OpenWA identity, the upcoming command and local onboarding steps.

  Lightpanda support remains experimental. Custom native Debug runs reached authenticated library READY and loaded chat/contact data, but subsequent reload recovery failed with session takeover and initialization errors. Automatic recovery, outbound delivery, long-session durability and full Chrome parity remain unconfirmed. The controlled 1,000-record DOM benchmark does not measure authenticated WhatsApp performance or sync speed. This bump prepares the next minor release; it does not publish it.
- [#3521](https://github.com/open-wa/wa-automate-nodejs/pull/3521)  *(patch)*
  Remove browser downloads during CLI installation, prefer installed Chrome, and prompt for Chrome, Chromium or Lightpanda when a browser is missing. Explicit browser flags provision on demand and reuse persistent per-user caches on subsequent runs.

  Use stable Effect v4 for provisioning locks, temporary files, download retries and browser preference validation, and update the Effect package family together.

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
  - @open-wa/driver-interface@5.0.0

## 5.0.0-alpha.7

### Patch Changes

- Updated dependencies []:
  - @open-wa/driver-interface@5.0.0-alpha.7

## 5.0.0-alpha.6

### Patch Changes

- Updated dependencies []:
  - @open-wa/driver-interface@5.0.0-alpha.6

## 5.0.0-alpha.5

### Patch Changes

- Updated dependencies []:
  - @open-wa/driver-interface@5.0.0-alpha.5

## 5.0.0-alpha.4

### Patch Changes

- Updated dependencies []:
  - @open-wa/driver-interface@5.0.0-alpha.4

## 5.0.0-alpha.3

### Patch Changes

- Updated dependencies []:
  - @open-wa/driver-interface@5.0.0-alpha.3

## 5.0.0-alpha.2

### Patch Changes

- Updated dependencies []:
  - @open-wa/driver-interface@5.0.0-alpha.2

## 6.0.0-alpha.2

### Minor Changes

- Dry run minor bump

### Patch Changes

- Updated dependencies []:
  - @open-wa/driver-interface@6.0.0-alpha.2

## 5.0.1-alpha.2

### Patch Changes

- Dry run patch bump

- Updated dependencies []:
  - @open-wa/driver-interface@5.0.1-alpha.2
