---
"@open-wa/socket-client": patch
"@open-wa/schema": patch
"@open-wa/wa-automate-types-only": patch
---

🐛 `SocketClient` has the Client's methods and listeners again. After `await SocketClient.connect()`, direct calls such as `client.sendText(chatId, text)` and `client.onMessage(callback)` threw "is not a function", so only `ask()` and `listen()` worked. They work now, with the arguments in order as in v4 or as one object of named parameters.
🏷️ The socket client is typed. Every Easy API method has its parameters, return type and description, so your editor completes `client.sendText(` and `client.ask('sendText', {`, and TypeScript checks the call. `listen('onMessage', ...)` takes the name as a string or as `SimpleListener.Message` and types the callback's parameter from it, so no cast or `@ts-ignore` is needed.
🎧 `listen()` and the listener methods now have clear roles. `client.listen('onMessage', ...)` keeps delivering the event as the Easy API sends it, `{ ctx, message }`, so existing v5 handlers work unchanged. The listener methods, such as `client.onMessage(callback)`, deliver what the Client's listeners deliver: the message itself for `onMessage` and `onAnyMessage`, the message with its new `ack` for `onAck`, the new state for `onStateChanged`. `onLogout` now fires.
