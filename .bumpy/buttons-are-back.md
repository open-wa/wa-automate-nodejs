---
'@open-wa/wa-automate': minor
'@open-wa/client': minor
'@open-wa/schema': minor
'@open-wa/core': minor
'@open-wa/api': minor
---

## Buttons are back

Build conversations people can tap through with the new `sendInteractive(to, content)` API: reply buttons, website/call/copy actions, sectioned lists, forms, image carousels and booking cards. Available to **Insiders and above**.

Forms now have their own `onFormResponse` listener. Receive answers keyed by your question IDs, including arrays for multiple selections, instead of parsing the displayed reply text. `onInteractiveResponse` handles replies, list selections and form submissions with message references for your integration.

One typed JSON document works across the SDK and HTTP API. `defineInteractiveMessage` provides validation, autocomplete and useful defaults; response events are also available through the HTTP event stream. For advanced integrations, `sendRawMessage` accepts constructed WhatsApp protobuf Message payloads, and native actions expose an extension format.

See the [interactive messages guide](https://openwa.dev/docs/guides/interactive-messages) for examples and recipient support limits. Update and restart your licensed session to load the new capabilities.

This release also preserves event bindings during repeated registration, reports confirmed license state correctly in health responses, and improves license bootstrap recovery.
