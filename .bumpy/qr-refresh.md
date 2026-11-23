---
"@open-wa/core": patch
---

🐛 Linking with a QR code works again past the first code. WhatsApp's login screen stopped exposing the state open-wa used to refresh it, so the first QR code expired and no new one appeared. open-wa now reads the login screen directly and asks WhatsApp for a fresh code each time one expires.
🐛 When WhatsApp doesn't accept a saved login, open-wa keeps it as `<session>.data.json.rejected` instead of deleting it.
