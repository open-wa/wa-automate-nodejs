---
"@open-wa/core": patch
"@open-wa/client": patch
---

- 🐛 Recover invalid, undecryptable, or logged-out sessions through fresh QR pairing in the same process, retaining the client and its message listeners and replacing the unusable checkpoint after pairing.
- 🐛 Recover corrupt session files, credential paths, and dead local lock owners automatically. Keep locks belonging to running processes exclusive.
- 🐛 Handle logout-cleanup failures without an unhandled rejection and rerun client finalization after pairing.
