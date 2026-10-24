---
"@open-wa/socket-client": patch
"@open-wa/api": patch
---

Register call event listeners even when a capability lookup fails, and keep session-control polling separate from the runtime request budget.
