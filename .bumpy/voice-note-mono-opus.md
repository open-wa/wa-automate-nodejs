---
"@open-wa/client": patch
"@open-wa/stickers": patch
"@open-wa/schema": patch
---

🎙️ `sendPtt` now converts the audio you give it. A voice note used to be sent exactly as supplied, and some phones could not play one that was not mono Ogg Opus, such as a stereo `.ogg`. Audio that is not already mono Ogg Opus, including MP3, M4A, WAV and stereo Ogg, is converted in the session's browser to mono Ogg Opus at 48 kHz before it is sent. A mono Ogg Opus file is sent as it is, and `sendFile` with `{ type: 'audio', ptt: true }` does the same. `sendAudio` is unchanged.
📏 Conversion accepts files of up to 20 MB and 10 minutes. A larger or longer file is refused with an error that names the limit and nothing is sent, as is any audio on a browser that cannot encode it, such as the experimental Lightpanda driver. Supply mono Ogg Opus in those cases.
🔊 `@open-wa/stickers` runtimes have `convertAudio(input, options)`, which converts a sound to mono Ogg Opus in the browser page with your own `maxSeconds`, `maxBytes` and `bitrate`. Sticker sound keeps its limits.
