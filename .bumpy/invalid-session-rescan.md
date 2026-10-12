---
"@open-wa/core": patch
---

Ignore invalid saved session files and show the QR code for fresh pairing instead of stopping startup. Leave the ignored file in place until the newly paired session replaces it. Resolve session files only from the configured path or working directory, without searching beside the executable.
