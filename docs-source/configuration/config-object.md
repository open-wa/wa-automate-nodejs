# Configration

There are quite a few ways you can customize your session.

Find out about all possible options here: [[ConfigObject]]

Set the desired config options as parameter on `create`.

In the following example:

1. The process tries to find and run a chrome installation instead of using the default chromium (chrome is required to send videos & GIFS) [[useChrome]]
2. Automatically refreshes the QR code at regular intervals [[ConfigObject.autoRefresh]]
3. Disables the cache (may be useful to optimize memory consumption) [[cacheEnabled]]
4. Sets the session Id to 'hr' (this will result in a file called hr.data.json being saved to the process working directory) [[ConfigObject.sessionId]]

```javascript
const { create, Client } = require('@open-wa/wa-automate');
// or
// import { create, Client } from '@open-wa/wa-automate';

const launchConfig = {
    useChrome: true,
    autoRefresh:true,
    cacheEnabled:false,
    sessionId: 'hr'
};


function start(client) {
  client.onMessage(message => {
    if (message.body === 'Hi') {
      client.sendText(message.from, '👋 Hello!');
    }
  });
}

create(launchConfig).then(start);

```