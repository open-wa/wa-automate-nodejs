# @open-wa/api

















## 5.8.0
<sub>2026-10-23</sub>

- *(minor)* Version bump from group with `@open-wa/core` v5.8.0

## 5.7.0
<sub>2026-10-23</sub>

-  *(minor)*
  Add the official Voxtral assistant for conversational WhatsApp voice notes and
  live audio calls, with a plugin-provided Neo dashboard page, saved settings,
  voice preview, conversation context, and shared call controls.

  Show transcripts, assistant status, and per-chat controls in Neo's normal Chat
  feed through plugin-provided chat components.

  Load configured plugins in Easy API and expose host-side media/calling services
  to plugins. Plugin pages can supply native page modules and request host route
  authentication.

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

-  *(patch)*
  - ✨ Add previews for all 62 sticker effects using one animated sample, with pause controls, clearer names and mobile studio layouts. Improve touch reordering, draft saving and unreadable-photo recovery. [#3555](https://github.com/open-wa/wa-automate-nodejs/issues/3555)
  - 🐛 Fix browser colour validation so colour effects and sticker backgrounds render successfully. [#3555](https://github.com/open-wa/wa-automate-nodejs/issues/3555)

## 5.6.3
<sub>2026-10-16</sub>

- *(patch)* Version bump from group with `@open-wa/stickers` v5.6.3

## 5.6.2
<sub>2026-10-15</sub>

- [#3552](https://github.com/open-wa/wa-automate-nodejs/pull/3552)  *(patch)*
  - 🐛 Keep per-request HTTP logs off during normal Easy API operation. Enable them through verbose CLI output or debug logging.
- [#3552](https://github.com/open-wa/wa-automate-nodejs/pull/3552)  *(patch)*
  - 🐛 Open the dashboard from the Easy API server root when enabled, and open API documentation when the dashboard is disabled.

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

- [#3477](https://github.com/open-wa/wa-automate-nodejs/pull/3477)  *(patch)*
  - 🔒️ Redact customer session keys and secret-file settings from debug responses.
- *(minor)* Version bump from group with `@open-wa/client` v5.4.0, `@open-wa/config` v5.4.0, `@open-wa/core` v5.4.0, `@open-wa/wa-automate` v5.4.0

## 5.3.0

- 🔒️ Redact session payloads and S3 credentials from debug responses.

## 5.2.0
<sub>2026-09-29</sub>

- [#3464](https://github.com/open-wa/wa-automate-nodejs/pull/3464)  *(patch)* Thanks [@smashah](https://github.com/smashah)!
  Describe client return values with named types and generate canonical method references, linked type definitions, and OpenAPI responses from the same contracts.

  Preserve configured session, host, and port values when their CLI flags are omitted. Forward link-code configuration to the runtime and display generated codes in the local CLI console.

  Add bounded session diagnostics for reviewable dashboard issue reports, report the running API package version, and share Base UI controls and theme tokens between docs and dashboard.
- *(minor)* Version bump from group with `@open-wa/client` v5.2.0, `@open-wa/config` v5.2.0, `@open-wa/core` v5.2.0, `@open-wa/driver-interface` v5.2.0, `@open-wa/driver-puppeteer` v5.2.0, `@open-wa/schema` v5.2.0, `@open-wa/wa-automate` v5.2.0

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

- Ship the dashboard SPA with the Easy API runtime so clean CLI installs can serve `/dashboard/`.

- Embed the built dashboard SPA in the API package so clean CLI installs can serve `/dashboard/` without resolving a separate dashboard package.

- Deduplicate React in the embedded dashboard build so the production dashboard does not crash on startup.

- Allow pre-auth QR bootstrap to continue when WhatsApp Web exposes the QR surface before `WAWebCollections` is injectable, gate dashboard runtime API calls until the session is ready, and return an empty plugin manifest when no plugins are mounted.
- Updated dependencies [[`6a55aef`](https://github.com/open-wa/wa-automate-nodejs/commit/6a55aef602b347bfffc8550e448585e7776baf18)]:
  - @open-wa/schema@5.0.0
  - @open-wa/mcp@5.0.0
  - @open-wa/screencaster@5.0.0

## 5.0.0-alpha.7

### Patch Changes

- Allow pre-auth QR bootstrap to continue when WhatsApp Web exposes the QR surface before `WAWebCollections` is injectable, gate dashboard runtime API calls until the session is ready, and return an empty plugin manifest when no plugins are mounted.

- Updated dependencies []:
  - @open-wa/mcp@5.0.0-alpha.7
  - @open-wa/schema@5.0.0-alpha.7
  - @open-wa/screencaster@5.0.0-alpha.7

## 5.0.0-alpha.6

### Patch Changes

- Deduplicate React in the embedded dashboard build so the production dashboard does not crash on startup.

- Updated dependencies []:
  - @open-wa/mcp@5.0.0-alpha.6
  - @open-wa/schema@5.0.0-alpha.6
  - @open-wa/screencaster@5.0.0-alpha.6

## 5.0.0-alpha.5

### Patch Changes

- Embed the built dashboard SPA in the API package so clean CLI installs can serve `/dashboard/` without resolving a separate dashboard package.

- Updated dependencies []:
  - @open-wa/mcp@5.0.0-alpha.5
  - @open-wa/schema@5.0.0-alpha.5
  - @open-wa/screencaster@5.0.0-alpha.5

## 5.0.0-alpha.4

### Patch Changes

- Ship the dashboard SPA with the Easy API runtime so clean CLI installs can serve `/dashboard/`.

- Updated dependencies []:
  - @open-wa/dashboard-neo@5.0.0-alpha.4
  - @open-wa/mcp@5.0.0-alpha.4
  - @open-wa/schema@5.0.0-alpha.4
  - @open-wa/screencaster@5.0.0-alpha.4

## 5.0.0-alpha.3

### Patch Changes

- Updated dependencies []:
  - @open-wa/schema@5.0.0-alpha.3
  - @open-wa/mcp@5.0.0-alpha.3
  - @open-wa/screencaster@5.0.0-alpha.3

## 5.0.0-alpha.2

### Patch Changes

- Updated dependencies []:
  - @open-wa/mcp@5.0.0-alpha.2
  - @open-wa/schema@5.0.0-alpha.2
  - @open-wa/screencaster@5.0.0-alpha.2

## 5.0.0-alpha.2

### Minor Changes

- Dry run minor bump

### Patch Changes

- Updated dependencies []:
  - @open-wa/mcp@5.0.0-alpha.2
  - @open-wa/schema@6.0.0-alpha.2
  - @open-wa/screencaster@5.0.0-alpha.2

## 5.0.1-alpha.2

### Patch Changes

- Dry run patch bump

- Updated dependencies []:
  - @open-wa/mcp@5.0.1-alpha.2
  - @open-wa/schema@5.0.1-alpha.2
  - @open-wa/screencaster@5.0.1-alpha.2
