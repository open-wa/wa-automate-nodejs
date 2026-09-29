---
'@open-wa/wa-automate': minor
'@open-wa/client': minor
'@open-wa/config': minor
'@open-wa/core': minor
'@open-wa/driver-interface': minor
'@open-wa/driver-puppeteer': minor
'@open-wa/schema': minor
---

Create a Bun and TypeScript messaging application with `bunx --bun @open-wa/wa-automate init my-bot`. The public `create()` now prepares a matched browser, presents QR login, and returns a ready messaging client with private persistent session storage.

Provision missing browsers at startup with shared cache coordination, configurable cache and download policy, and explicit-path errors. Preserve explicit drivers and low-level lifecycle control.

Return a validated message ID from `sendText`, or throw `SendTextError` with a known-not-sent or uncertain outcome. Never retry an uncertain send automatically.
