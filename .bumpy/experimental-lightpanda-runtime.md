---
'@open-wa/driver-lightpanda': minor
'@open-wa/wa-automate': minor
'@open-wa/api': patch
'@open-wa/config': patch
'@open-wa/core': patch
'@open-wa/driver-interface': patch
'@open-wa/socket-client': patch
---

- ✨ Add experimental WhatsApp startup through Easy API `--lightpanda`, with a separately prepared cached Lightpanda 1.0.0 executable, worker/crypto bridges and compression streams. Custom native CryptoKey and IndexedDB request-lifetime source patches are retained separately; the stock downloaded executable has not been replaced.
- 🐛 Refresh and clear QR state through native pairing state, expose compact-session checkpoint phases, reactivate checkpointing after document replacement, and preserve startup failures when cleanup also fails.
- 💄 Explain Lightpanda's unavailable Live Portal in dashboard health and the portal itself, because this browser has no graphical rendering pipeline.
- 📝 Include controlled stock-browser benchmark evidence and an editable launch film with OpenWA identity, the upcoming command and local onboarding steps.

Lightpanda support remains experimental. Custom native Debug runs reached authenticated library READY and loaded chat/contact data, but subsequent reload recovery failed with session takeover and initialization errors. Automatic recovery, outbound delivery, long-session durability and full Chrome parity remain unconfirmed. The controlled 1,000-record DOM benchmark does not measure authenticated WhatsApp performance or sync speed. This bump prepares the next minor release; it does not publish it.
