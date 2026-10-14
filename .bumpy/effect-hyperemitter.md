---
"@open-wa/core": minor
"@open-wa/hyperemitter": minor
"@open-wa/socket-client": minor
---

- ♻️ Replace runtime EventEmitter2 imports with the tuned Effect-backed HyperEmitter hybrid, removing the CommonJS named import behind #3534. Ordinary callbacks remain synchronous; Promise and Effect listener work has scoped ownership.
- 🏷️ Preserve the shared `ev` API: `*` and `**` wildcards, variadic arguments, listener context, `emitAsync()` results, QR and session-data alias payloads, and session metadata. Add `onScoped`, `onAnyScoped`, and `emitEffect` for Effect applications.
- ✨ Expose optional native PubSub observations and scoped Stream/subscription helpers through HyperEmitter and shared `ev`, with lazy creation, explicit buffer policies, and emitter-owned shutdown.
