# @open-wa/plugin-sdk


























## 5.10.0
<sub>2026-10-28</sub>

-  *(minor)*
  Add a standalone Jev chat assistant and share its decision/action engine with Voxtral. Enforce booking correction masks, retain literal source spans and decision distributions, and resolve dates in the agreed timezone from a captured turn instant. Add Neo controls, shared conversation services, and matching terminal/docs builder options.

  Export the plugin SDK for both ESM and CommonJS consumers. Treat recorded conversation memory as valid reply evidence and remove submitted formats from the current turn’s action choices so completed requests finish without duplicate attempts. Classify each requested message format independently and retain unfinished formats across the turn, while keeping irrelevant fan-out facts out of conversational prompts. Retire superseded call responses before new playback and queue a bounded two-packet lead to absorb brief browser RPC stalls.

  Make decision routing aware of the response channel, retain explicit AM/PM punctuation from speech, give multi-format requests bounded repair capacity per format, and narrow correction fields again during proposal review. Preserve hydrated call method descriptors when applying chat-scope hooks.

  After an interruption or changed question, answer the latest request without resuming the interrupted explanation.
-  *(minor)*
  Share an OpenUI component catalogue across agent plugins, native WhatsApp sends and Neo Chat previews. Add message and reply previews to Voxtral, validate booking destinations, and preserve Jev format selection and correlated voice responses.
-  *(minor)*
  Add the official Voxtral assistant for conversational WhatsApp voice notes and
  live audio calls, with a plugin-provided Neo dashboard page, saved settings,
  voice preview, conversation context, and shared call controls.

  Show transcripts, assistant status, and per-chat controls in Neo's normal Chat
  feed through plugin-provided chat components.

  Load configured plugins in Easy API and expose host-side media/calling services
  to plugins. Plugin pages can supply native page modules and request host route
  authentication.
-  *(patch)*
  Validate and normalize booking timestamps with a shared branded Effect codec so Android displays the appointment date and time alongside its location. Preserve Effect decoding, encoding and schema metadata in the serving projection, and describe request inputs separately from normalized outputs in the API reference. Reject invalid dates and ranges that collapse at whole-second precision before sending.

## 5.9.7
<sub>2026-10-24</sub>

- *(patch)* Version bump from group with `@open-wa/api` v5.9.7, `@open-wa/socket-client` v5.9.7

## 5.9.6
<sub>2026-10-24</sub>

- *(patch)* Version bump from group with `@open-wa/api` v5.9.6, `@open-wa/core` v5.9.6, `@open-wa/integration-voxtral` v5.9.6

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

- *(minor)* Version bump from group with `@open-wa/config` v5.9.0, `@open-wa/create` v5.9.0, `@open-wa/wa-automate` v5.9.0

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

- [#3518](https://github.com/open-wa/wa-automate-nodejs/pull/3518)  *(minor)*
  Add typed media options for view-once attachments, circular video notes, GIFs and documents. Media captions and quoted message IDs now belong in the options object. Add poll closing times, hidden voter names, voting, synced results and vote listeners, plus message pinning and unpinning.

  Add voluntary phone-number request and share-own-number methods, plus native call-link generation and scheduled-call options on events. Fix native attachment construction, prepared video dimensions, submitted IDs and native media failure reporting discovered during live phone demos.

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
