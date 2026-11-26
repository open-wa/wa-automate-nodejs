---
"@open-wa/stickers": patch
---

🔊 Sticker sound is now sent in mono. `sendSticker` used to keep a video's stereo sound, and some phones showed those stickers without sound. The sound of a video, and any stereo Ogg Opus clip you pass as `audio`, is now converted to mono Ogg Opus at 48 kHz, the format voice notes use.
