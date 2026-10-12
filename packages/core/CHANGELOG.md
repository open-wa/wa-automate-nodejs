# @open-wa/core






## 5.5.0
<sub>2026-10-12</sub>

- [#3521](https://github.com/open-wa/wa-automate-nodejs/pull/3521)  *(minor)*
  - ✨ Add native album sending for images, videos and MP4 GIFs, with one caption, PN-to-LID resolution and explicit partial-send errors.
  - 🐛 Accept album message events, expose declared media counts and parent associations, and add `getAlbumMessages` to retrieve loaded child media.
- [#3503](https://github.com/open-wa/wa-automate-nodejs/pull/3503)  *(minor)*
  - ✨ Add the public licensed-calling audio preview: bound Call controls, file and stream audio, recordings, remote media helpers and the Calls dashboard.
  - 🔒️ Calling uses the existing licensed patch delivery; expected availability failures log an actionable reason without stopping messaging.
  - ♻️ Own call media in scoped resources and finalize recordings on observed call end, media failure, disconnect and browser recovery.
- [#3520](https://github.com/open-wa/wa-automate-nodejs/pull/3520)  *(minor)*
  - Add live session patch refresh and dashboard license activation through a shared page replacement coordinator, retaining the browser process and host session.
  - Preserve portable persistence ownership and report refresh progress; WhatsApp reloads without pausing or draining application operations.
  - Evaluate the existing license response during refresh and report rejected keys without blocking public functionality.
- [#3518](https://github.com/open-wa/wa-automate-nodejs/pull/3518)  *(minor)*
  Add typed media options for view-once attachments, circular video notes, GIFs and documents. Media captions and quoted message IDs now belong in the options object. Add poll closing times, hidden voter names, voting, synced results and vote listeners, plus message pinning and unpinning.

  Add voluntary phone-number request and share-own-number methods, plus native call-link generation and scheduled-call options on events. Fix native attachment construction, prepared video dimensions, submitted IDs and native media failure reporting discovered during live phone demos.
- [#3518](https://github.com/open-wa/wa-automate-nodejs/pull/3518)  *(minor)*
  - ✨ Add native WhatsApp event creation, history, editing, cancellation and RSVPs.
  - ✨ Expose event and decrypted RSVP listeners with Effect schemas and JSON serializers.
  - ✨ Deliver event support through the common live patch without a licence requirement.
  - 📝 Add event and RSVP usage, Easy API routes, generated types and serializer documentation. Event times use Unix seconds; RSVP timestamps use milliseconds.
- [#3521](https://github.com/open-wa/wa-automate-nodejs/pull/3521)  *(patch)*
  Remove browser downloads during CLI installation, prefer installed Chrome, and prompt for Chrome, Chromium or Lightpanda when a browser is missing. Explicit browser flags provision on demand and reuse persistent per-user caches on subsequent runs.

  Use stable Effect v4 for provisioning locks, temporary files, download retries and browser preference validation, and update the Effect package family together.
- [#3521](https://github.com/open-wa/wa-automate-nodejs/pull/3521)  *(patch)*
  - ✨ Add experimental WhatsApp startup through Easy API `--lightpanda`, with a separately prepared cached Lightpanda 1.0.0 executable, worker/crypto bridges and compression streams. Custom native CryptoKey and IndexedDB request-lifetime source patches are retained separately; the stock downloaded executable has not been replaced.
  - 🐛 Refresh and clear QR state through native pairing state, expose compact-session checkpoint phases, reactivate checkpointing after document replacement, and preserve startup failures when cleanup also fails.
  - 💄 Explain Lightpanda's unavailable Live Portal in dashboard health and the portal itself, because this browser has no graphical rendering pipeline.
  - 📝 Include controlled stock-browser benchmark evidence and an editable launch film with OpenWA identity, the upcoming command and local onboarding steps.

  Lightpanda support remains experimental. Custom native Debug runs reached authenticated library READY and loaded chat/contact data, but subsequent reload recovery failed with session takeover and initialization errors. Automatic recovery, outbound delivery, long-session durability and full Chrome parity remain unconfirmed. The controlled 1,000-record DOM benchmark does not measure authenticated WhatsApp performance or sync speed. This bump prepares the next minor release; it does not publish it.
- [#3521](https://github.com/open-wa/wa-automate-nodejs/pull/3521)  *(patch)*
  - 🐛 Restore complete available message snapshots in `onAck` instead of reducing acknowledgements to an ID and status.
  - 🐛 Restore the shared `ev` helper, v4 wildcard subscriptions, and supported session/listener event aliases, with Effect-owned session cleanup and optional scoped subscriptions.
  - 🐛 Return contacts from `getGroupMembers` and restore `getGroupMembersId` for ID-only lookups, resolving contacts in one browser round trip.
- [#3519](https://github.com/open-wa/wa-automate-nodejs/pull/3519)  *(patch)*
  Restore schema-bound client methods for file sending, editing, reactions, group
  information, titles and descriptions through the existing private patch pipeline.
  Restore per-group and global participant listeners through the schema event bridge,
  including shared ev aliases, and correct the migration guide's unsupported claims.

## 5.4.0
<sub>2026-09-30</sub>

- [#3477](https://github.com/open-wa/wa-automate-nodejs/pull/3477)  *(minor)*
  - 🔒️ Bring your own session encryption key through config, environment variables or a mounted Docker secret. Omit it to use the baked default.
  - 🚚 Compact auth is the only path: `legacyDataDirAuth` is removed. Moving from a browser profile or changing keys requires a fresh QR scan.

## 5.3.0

- ✨ Compact auth is now the default: restore `{sessionId}.data.json` into a disposable browser profile.
- 🚚 Pair once for the new format, or set `legacyDataDirAuth: true` to keep an existing profile. No `portableSession` option or key-provider setup.
- 📝 The adapter is WhatsApp-build-gated. Live browser/S3 acceptance and full crash recovery remain unverified.

## 5.2.0
<sub>2026-09-29</sub>

- [#3465](https://github.com/open-wa/wa-automate-nodejs/pull/3465)  *(minor)* Thanks [@smashah](https://github.com/smashah)!
  Create a Bun and TypeScript messaging application with `bunx --bun @open-wa/wa-automate init my-bot`. The public `create()` now prepares a matched browser, presents QR login, and returns a ready messaging client with private persistent session storage.

  Provision missing browsers at startup with shared cache coordination, configurable cache and download policy, and explicit-path errors. Preserve explicit drivers and low-level lifecycle control.

  Return a validated message ID from `sendText`, or throw `SendTextError` with a known-not-sent or uncertain outcome. Never retry an uncertain send automatically.

## 5.1.0
<sub>2026-09-29</sub>

- [#3453](https://github.com/open-wa/wa-automate-nodejs/pull/3453)  *(minor)* Thanks [@smashah](https://github.com/smashah)!
  ## Buttons are back

  Build conversations people can tap through with the new `sendInteractive(to, content)` API: reply buttons, website/call/copy actions, sectioned lists, forms, image carousels and booking cards. Available to **Insiders and above**.

  Forms now have their own `onFormResponse` listener. Receive answers keyed by your question IDs, including arrays for multiple selections, instead of parsing the displayed reply text. `onInteractiveResponse` handles replies, list selections and form submissions with message references for your integration.

  One typed JSON document works across the SDK and HTTP API. `defineInteractiveMessage` provides validation, autocomplete and useful defaults; response events are also available through the HTTP event stream. For advanced integrations, `sendRawMessage` accepts constructed WhatsApp protobuf Message payloads, and native actions expose an extension format.

  See the [interactive messages guide](https://openwa.dev/docs/guides/interactive-messages) for examples and recipient support limits. Update and restart your licensed session to load the new capabilities.

  This release also preserves event bindings during repeated registration, reports confirmed license state correctly in health responses, and improves license bootstrap recovery.
- [#3453](https://github.com/open-wa/wa-automate-nodejs/pull/3453)  *(patch)* Thanks [@smashah](https://github.com/smashah)!
  Keep local Bun development on TypeScript source while publishing entry points that resolve the distributed files. npm packages no longer inherit workspace-only source conditions.

## 5.0.0

### Patch Changes

- [#3373](https://github.com/open-wa/wa-automate-nodejs/pull/3373) [`6a55aef`](https://github.com/open-wa/wa-automate-nodejs/commit/6a55aef602b347bfffc8550e448585e7776baf18) Thanks [@smashah](https://github.com/smashah)! - v5 RC plan (phase 0): hardening, v4-compat harness, Effect v4 foundation, and generated-docs overhaul.

  - **core**: strip crash-inducing browser args (`--single-process` / `--no-zygote`) by default with an `allowDangerousBrowserArgs` escape hatch; Effect v4 foundation — `OpenWAError` boundary (`toPublicError`/`runToPromise`, "Effect never leaks") and `httpClient` retry on Effect.
  - **config**: new `allowDangerousBrowserArgs` option; generated config-reference manifest for the docs config explorer.
  - **wa-automate**: thread `allowDangerousBrowserArgs`; document the Effect-never-leaks boundary in the public contract; reserve `skills/` in published files.
  - **plugin-sdk**: full README (was a stub); reserve `skills/` in published files.
  - **schema**: richer generated client reference — typed outputs (no more `unknown`), per-method request/response examples, registry-derived internals pages, generated events and licensed-methods pages, and interface-aware usage examples (Embedded / SocketClient / Easy API).

  Also (non-published): Docker image now builds on Node 22, the legacy v4 package was removed, a v4-compat parity harness and docs quality gate were added, and the docs site gained a config explorer and a site-wide preferred-interface selector.

- Allow pre-auth QR bootstrap to continue when WhatsApp Web exposes the QR surface before `WAWebCollections` is injectable, gate dashboard runtime API calls until the session is ready, and return an empty plugin manifest when no plugins are mounted.
- Updated dependencies [[`6a55aef`](https://github.com/open-wa/wa-automate-nodejs/commit/6a55aef602b347bfffc8550e448585e7776baf18)]:
  - @open-wa/config@5.0.0
  - @open-wa/schema@5.0.0
  - @open-wa/plugin-sdk@5.0.0
  - @open-wa/driver-interface@5.0.0
  - @open-wa/driver-playwright@5.0.0
  - @open-wa/driver-puppeteer@5.0.0
  - @open-wa/hyperemitter@5.0.0
  - @open-wa/logger@5.0.0
  - @open-wa/runtime-core@5.0.0

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
