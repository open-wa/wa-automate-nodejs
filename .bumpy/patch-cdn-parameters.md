---
"@open-wa/core": patch
---

🐛 Sessions load their patches from the open-wa CDN at startup again. The first patch request went out before WhatsApp's version was known and without the open-wa version, so the CDN refused it and the session quietly used the GitHub copy instead. Every patch request now carries both versions, and the log says which source served the patches.
