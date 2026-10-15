---
"@open-wa/core": patch
"@open-wa/session-sync": patch
---

- ♻️ Remove exclusive local and S3 session locks so another process can open the same session immediately. Keep atomic local checkpoint replacement and use unconditional, last-write-wins S3 saves.
