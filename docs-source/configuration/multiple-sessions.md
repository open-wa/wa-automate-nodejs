# Multiple Sessions

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
