---
"@open-wa/hyperemitter": patch
---

Publish a native ESM HyperEmitter entrypoint so Bun can import the ESM core without requiring an asynchronously loading Effect module through a CommonJS dependency. Found by the expanded packaged startup tests for [#3559](https://github.com/open-wa/wa-automate-nodejs/issues/3559).
