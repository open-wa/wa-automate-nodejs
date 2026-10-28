---
"@open-wa/core": patch
---

Fix session saves on the current WhatsApp build by reading native migration state directly and preserving the identity store's account encryption state. Preserve saved sessions when startup probes or authentication time out. [#3562](https://github.com/open-wa/wa-automate-nodejs/issues/3562)
