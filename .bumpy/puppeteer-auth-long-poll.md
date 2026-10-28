---
"@open-wa/driver-puppeteer": patch
"@open-wa/core": patch
---

Let authentication and QR waits use their configured deadlines instead of failing at Puppeteer's default three-minute protocol timeout. Use one native QR stream and renew expired linking cycles in Chrome as well as Lightpanda.
