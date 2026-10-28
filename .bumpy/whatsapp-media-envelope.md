---
"@open-wa/decrypt": patch
---

Authenticate WhatsApp media envelopes before decryption, exclude their authentication tag from AES input, and remove standard PKCS#7 padding.
