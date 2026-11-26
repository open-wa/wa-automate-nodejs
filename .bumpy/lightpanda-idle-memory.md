---
"@open-wa/driver-lightpanda": patch
---

🐛 An idle WhatsApp session on the experimental Lightpanda driver no longer grows by about 200 MiB a minute or keeps a CPU core busy. In a ten-minute test the browser stayed near 700 MiB and used less CPU than Chrome. Its memory still grows by roughly 12 MiB a minute, and `POST /api/session/refresh` gives that back.
