# The Client

Who/what is the client? The Client is the orchestrator of a WA Web session. You can have multiple clients in one node (or ts-node) process. But it's generally best practice to keep a single client on a single process.

## How to create a client

After you've installed the library in your project, you can then use [[create]] to ***create*** a new session. This simple example starts a bot that replies with `👋 Hello!` when it receives a `Hi`

```javascript
const { create, Client } = require('@open-wa/wa-automate');

// or
// import { create, Client } from '@open-wa/wa-automate';


function start(client) {
  client.onMessage(message => {
    if (message.body === 'Hi') {
      client.sendText(message.from, '👋 Hello!');
    }
  });
}

create().then(start);

```

The method `create` is what creates, authenticates/reloads a session. When you call create, make sure to keep an eye on the console output. In the console it will log the loading state of the client and the QR code (if there is no valid session data).

You can call `create()` on it's own, however there are a bunch of powerful configuration variables you can set to acheive a more custom set up.

[[config-object]]

## Multiple Sessions

You can run multiple sessions of @open-wa/wa-automate in the same process. This allows you to do interesting things for example:

1. Design and run automated tests for you WA bot.
2. Connect two or more WA numbers to a single (or multiple) message handler(s)
3. Use one client to make sure another one is alive by pinging it.

Please see demo/index.ts for a working example

NOTE: DO NOT CREATE TWO SESSIONS WITH THE SAME SESSIONID. DO NOT ALLOW SPACES AS SESSION ID.

```javascript
import { create, Client, ev} from '@open-wa/wa-automate';

function start(client: Client) {
  ...
}

create({
  sessionId:'session'
}).then(client => start(client));

create({
  sessionId:'another_session'
}).then(client => start(client));
```

You can then capture the QR Code for each session using the following event listener code:

```javascript
//events are fired with the ev namespace then the session Id. e.g "qr.another_session"
//You can however use the wildcard operator with the new event listener and capture the session Id as a parameter instead.
ev.on('qr.**', async (qrcode,sessionId) => {
  //base64 encoded qr code image
  const imageBuffer = Buffer.from(qrcode.replace('data:image/png;base64,',''), 'base64');
  fs.writeFileSync(`qr_code${sessionId?'_'+sessionId:''}.png`, imageBuffer);
});
```