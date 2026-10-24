# @open-wa/config























## 5.9.5
<sub>2026-10-24</sub>

- *(patch)* Version bump from group with `@open-wa/core` v5.9.5

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

-  *(minor)*
  Create Easy API and SDK projects through npm init @open-wa with shared JS/TS,
  browser, plugin and Voxtral options. Add the matching docs-site project builder
  with copyable commands, file previews and shareable settings.

## 5.8.0
<sub>2026-10-23</sub>

-  *(patch)*
  Install missing configured npm plugins on demand and reuse their local cache.
  Load JavaScript and TypeScript config files with the same module handling, and
  simplify Voxtral setup to a config entry without a separate plugin installation.
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

- [#3539](https://github.com/open-wa/wa-automate-nodejs/pull/3539)  *(minor)*
  - ✨ Discover OpenWA event payloads through AsyncAPI 3.1 at `/meta/asyncapi.json` and the generated event reference in the docs.
  - ✨ Let ChatGPT Work subscribe to incoming messages, acknowledgements and session state changes through signed, durable webhook MCP Events. Hosted MCP now serves protocol `2026-07-28`; use a client that supports MCP 2.0. Subscriptions have a finite lifetime and events missed while OpenWA is offline aren't replayed.

## 5.5.1
<sub>2026-10-12</sub>

- *(patch)* Version bump from group with `@open-wa/core` v5.5.1

## 5.5.0
<sub>2026-10-12</sub>

- [#3503](https://github.com/open-wa/wa-automate-nodejs/pull/3503)  *(minor)*
  - ✨ Add the public licensed-calling audio preview: bound Call controls, file and stream audio, recordings, remote media helpers and the Calls dashboard.
  - 🔒️ Calling uses the existing licensed patch delivery; expected availability failures log an actionable reason without stopping messaging.
  - ♻️ Own call media in scoped resources and finalize recordings on observed call end, media failure, disconnect and browser recovery.
- [#3521](https://github.com/open-wa/wa-automate-nodejs/pull/3521)  *(patch)*
  Remove browser downloads during CLI installation, prefer installed Chrome, and prompt for Chrome, Chromium or Lightpanda when a browser is missing. Explicit browser flags provision on demand and reuse persistent per-user caches on subsequent runs.

  Use stable Effect v4 for provisioning locks, temporary files, download retries and browser preference validation, and update the Effect package family together.
- [#3521](https://github.com/open-wa/wa-automate-nodejs/pull/3521)  *(patch)*
  - ✨ Add experimental WhatsApp startup through Easy API `--lightpanda`, with a separately prepared cached Lightpanda 1.0.0 executable, worker/crypto bridges and compression streams. Custom native CryptoKey and IndexedDB request-lifetime source patches are retained separately; the stock downloaded executable has not been replaced.
  - 🐛 Refresh and clear QR state through native pairing state, expose compact-session checkpoint phases, reactivate checkpointing after document replacement, and preserve startup failures when cleanup also fails.
  - 💄 Explain Lightpanda's unavailable Live Portal in dashboard health and the portal itself, because this browser has no graphical rendering pipeline.
  - 📝 Include controlled stock-browser benchmark evidence and an editable launch film with OpenWA identity, the upcoming command and local onboarding steps.

  Lightpanda support remains experimental. Custom native Debug runs reached authenticated library READY and loaded chat/contact data, but subsequent reload recovery failed with session takeover and initialization errors. Automatic recovery, outbound delivery, long-session durability and full Chrome parity remain unconfirmed. The controlled 1,000-record DOM benchmark does not measure authenticated WhatsApp performance or sync speed. This bump prepares the next minor release; it does not publish it.

## 5.4.0
<sub>2026-09-30</sub>

- [#3477](https://github.com/open-wa/wa-automate-nodejs/pull/3477)  *(minor)*
  - 🔒️ Bring your own session encryption key through config, environment variables or a mounted Docker secret. Omit it to use the baked default.
  - 🚚 Compact auth is the only path: `legacyDataDirAuth` is removed. Moving from a browser profile or changing keys requires a fresh QR scan.

## 5.3.0

- 🚚 Pair once for the new format, or set `legacyDataDirAuth: true` to keep an existing profile. No `portableSession` option or key-provider setup.

## 5.2.0
<sub>2026-09-29</sub>

- [#3465](https://github.com/open-wa/wa-automate-nodejs/pull/3465)  *(minor)* Thanks [@smashah](https://github.com/smashah)!
  Create a Bun and TypeScript messaging application with `bunx --bun @open-wa/wa-automate init my-bot`. The public `create()` now prepares a matched browser, presents QR login, and returns a ready messaging client with private persistent session storage.

  Provision missing browsers at startup with shared cache coordination, configurable cache and download policy, and explicit-path errors. Preserve explicit drivers and low-level lifecycle control.

  Return a validated message ID from `sendText`, or throw `SendTextError` with a known-not-sent or uncertain outcome. Never retry an uncertain send automatically.

## 5.1.0
<sub>2026-09-29</sub>

- [#3453](https://github.com/open-wa/wa-automate-nodejs/pull/3453)  *(patch)* Thanks [@smashah](https://github.com/smashah)!
  Keep local Bun development on TypeScript source while publishing entry points that resolve the distributed files. npm packages no longer inherit workspace-only source conditions.
- *(minor)* Version bump from group with `@open-wa/api` v5.1.0, `@open-wa/client` v5.1.0, `@open-wa/core` v5.1.0, `@open-wa/schema` v5.1.0, `@open-wa/wa-automate` v5.1.0

## 5.0.0

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

## 6.0.0-alpha.2

### Minor Changes

- Dry run minor bump

## 5.0.1-alpha.2

### Patch Changes

- Dry run patch bump
