# @open-wa/api


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
