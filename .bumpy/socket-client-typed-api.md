---
"@open-wa/socket-client": patch
"@open-wa/schema": patch
"@open-wa/wa-automate-types-only": patch
---

🐛 `SocketClient` has the Client's methods and listeners again. After `await SocketClient.connect()`, direct calls such as `client.sendText(chatId, text)` and `client.onMessage(callback)` threw "is not a function", so only `ask()` and `listen()` worked. They work now, with the arguments in order as in v4 or as one object of named parameters.
🏷️ The socket client is typed. Every Easy API method has its parameters, return type and description, so your editor completes `client.sendText(` and `client.ask('sendText', {`, and TypeScript checks the call. `listen('onMessage', ...)` takes the name as a string or as `SimpleListener.Message` and types the callback's parameter from it, so no cast or `@ts-ignore` is needed.
🐛 Listener callbacks on the socket client receive what the Client's listeners receive, as they did in v4: `onMessage` and `onAnyMessage` get the message itself, `onAck` the message with its new `ack`, `onStateChanged` the new state, and `onLogout` now fires. A v5 handler that read `payload.message` should read the message directly. To get an event as the Easy API sends it, listen by its event name, for example `client.listen('message.received', ...)`.
