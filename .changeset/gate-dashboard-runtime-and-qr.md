---
"@open-wa/core": patch
"@open-wa/api": patch
"@open-wa/wa-automate": patch
---

Allow pre-auth QR bootstrap to continue when WhatsApp Web exposes the QR surface before `WAWebCollections` is injectable, gate dashboard runtime API calls until the session is ready, and return an empty plugin manifest when no plugins are mounted.
