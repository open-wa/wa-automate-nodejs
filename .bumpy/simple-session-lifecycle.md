---
"@open-wa/core": patch
"@open-wa/client": patch
"@open-wa/wa-automate": patch
---

- 🐛 Restore authentication based on WhatsApp's QR and chat-list screens, keep the existing QR page during logout recovery, and remove startup validation, repair, unread-audit and readiness blockers.
- 🐛 Deliver incoming messages through ordinary WAPI events and save encrypted sessions in the background. Remove native message-write and delivery-receipt interception and the custom callback acknowledgement/replay API.
