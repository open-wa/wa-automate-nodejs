---
"@open-wa/core": patch
---

Return a native logout during startup to fresh WhatsApp pairing instead of replaying the rejected checkpoint. Keep startup authentication as the single owner of its browser reset. [#3550](https://github.com/open-wa/wa-automate-nodejs/issues/3550), [#3562](https://github.com/open-wa/wa-automate-nodejs/issues/3562)
