---
"@open-wa/core": patch
---

Fix CommonJS `create(configObject)` startup under Node when its dynamically imported ESM core resolves packaged browser assets. Convert stack-frame file URLs to filesystem paths before resolving `wapi.js` and the other runtime assets.
