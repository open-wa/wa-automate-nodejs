---
"@open-wa/core": patch
"@open-wa/client": patch
---

- 🐛 Recover invalid, undecryptable, or logged-out sessions through fresh QR pairing in the same process, retaining the client and its message listeners and replacing the unusable checkpoint after pairing.
- 🐛 Recover corrupt session files and credential paths automatically, replacing unusable data after fresh pairing.
- 🐛 Handle logout-cleanup failures without an unhandled rejection and rerun client finalization after pairing.
