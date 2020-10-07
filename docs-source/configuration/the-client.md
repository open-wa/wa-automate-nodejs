# The Client

Who/what is the client? The Client is the orchestrator of a WA Web session. You can have multiple clients in one node (or ts-node) process. But it's generally best practice to keep a single client on a single process.

## How to create a client

After you've installed the library in your project, you can then use [[create]] to ***create*** a new session. This simple example starts a bot that replies with `👋 Hello!` when it receives a `Hi`

```javascript
const { create, Client } = require('@open-wa/wa-automate');

// or
// import { create, Client } from '@open-wa/wa-automate';


function start(client) {
  client.onMessage(async message => {
    if (message.body === 'Hi') {
      await client.sendText(message.from, '👋 Hello!');
    }
  });
}

create().then(start);

```

The method `create` is what creates, authenticates/reloads a session. When you call create, make sure to keep an eye on the console output. In the console it will log the loading state of the client and the QR code (if there is no valid session data).

You can call `create()` on it's own, however there are a bunch of powerful configuration variables you can set to acheive a more custom set up.

[[ConfigObject]]
