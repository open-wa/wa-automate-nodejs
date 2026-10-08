---
'@open-wa/wa-automate': patch
'@open-wa/cli': patch
'@open-wa/config': patch
'@open-wa/driver-interface': patch
'@open-wa/core': patch
'@open-wa/runtime-core': patch
'@open-wa/runtime-node': patch
'@open-wa/runtime-bun': patch
'@open-wa/runtime-browser': patch
'@open-wa/runtime-edge': patch
'@open-wa/driver-puppeteer': patch
'@open-wa/driver-lightpanda': patch
---

Remove browser downloads during CLI installation, prefer installed Chrome, and prompt for Chrome, Chromium or Lightpanda when a browser is missing. Explicit browser flags provision on demand and reuse persistent per-user caches on subsequent runs.

Use stable Effect v4 for provisioning locks, temporary files, download retries and browser preference validation, and update the Effect package family together.
