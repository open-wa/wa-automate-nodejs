---
'@open-wa/client': minor
'@open-wa/schema': minor
---

- 🐛 Restore patch-backed file, URL media, reaction and message-edit sending instead of rejecting them as unsupported.
- ✨ Expose audio, voice-note, looping video, poll, vCard, multi-contact and licensed status-posting methods on Client.
- 🐛 Preserve media MIME types and align poll selection limits and contact return schemas with the runtime.
