---
"@open-wa/core": patch
---

Restore file URL conversion when resolving bundled runtime assets, fixing Node `create(configObject)` startup when `wapi.js` exists but the ESM core resolves a `file:` URL as a filesystem path. Fixes [#3559](https://github.com/open-wa/wa-automate-nodejs/issues/3559).
