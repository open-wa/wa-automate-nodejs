---
'@open-wa/core': minor
'@open-wa/client': minor
'@open-wa/config': minor
'@open-wa/wa-automate': minor
---

- 🔒️ Bring your own session encryption key through config, environment variables or a mounted Docker secret. Omit it to use the baked default.
- 🚚 Compact auth is the only path: `legacyDataDirAuth` is removed. Moving from a browser profile or changing keys requires a fresh QR scan.
