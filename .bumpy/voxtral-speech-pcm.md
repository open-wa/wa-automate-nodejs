---
"@open-wa/integration-voxtral": patch
---

Convert Mistral's float32 speech PCM to signed 16-bit audio before voice-note encoding and call playback. Preserve split samples across streaming chunks and reject malformed audio instead of sending distorted speech.
