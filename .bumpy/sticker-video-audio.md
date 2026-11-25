---
"@open-wa/client": minor
"@open-wa/schema": minor
"@open-wa/stickers": minor
---

✨ `sendSticker` now makes animated stickers from video and can attach a sound. Pass a video and it becomes an animated sticker of up to 10 seconds; `trim` chooses the part to use. Set `audio: true` to keep the video's own sound, or `audio: './chime.ogg'` to attach a sound to any sticker. MP3 and other audio is converted for you. `author` and `pack` set the labels shown in the sticker's details.

`sendSoundSticker` is removed. Use `sendSticker(to, image, { audio: sound })` instead.
