---
sidebar_label: The Config Object
description:
  Guide showing how to edit the settings.
sidebar_position: 0
---

# Configuration

There are quite a few ways you can customize your session.

Find out about all possible options here: [api.ConfigObject](/docs/api/interfaces/api_model_config.ConfigObject)

Set the desired config options as parameter on [create].

In the following example:

1. The process tries to find and run a chrome installation instead of using the default chromium (chrome is required to send videos & GIFS) [ConfigObject.useChrome]
2. Automatically refreshes the QR code at regular intervals [ConfigObject.autoRefresh]
3. Disables the cache (may be useful to optimize memory consumption) [ConfigObject.cacheEnabled]
4. Sets the session Id to `hr` (this will result in a file called `hr.data.json` being saved to the process working directory) [ConfigObject.sessionId]

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
  client.onMessage(async message => {
    if (message.body === 'Hi') {
      await client.sendText(message.from, '👋 Hello!');
    }
  });
}

create(launchConfig).then(start);

```

## Timing out an unpaired session

If you want to kill the process after a certain amount of seconds due to an unscanned code, you can now set the qrTimeout parameter in the configuration object. You can also use authTimeout if you want to wait only a certain period of time to wait for the session to connect to the phone.

```javascript
create({
  qrTimeout: 30, //kills the session if the QR code is not scanned within 30 seconds.
  authTimeout: 30 //kills the session if the session hasn't authentication 30 seconds (e.g If the session has the right credentials but the phone is off).
})
.then(client => start(client));
```

## Emitting a limited amount of qr codes

Set [ConfigObject.maxQr] to limit the amount of QR codes to show before closing the process.

```javascript
create({
    maxQr:10,
}).then(async client => await start(client));
```

## Open with browser

The actual browser window you use is called a `head`, by default the library runs a chrome session ***headless*** (i.e in the background - you don't see it). If you want the browser to open up to see what's going on you can set `ConfigObject.headless` to `false`.

```javascript
create({
  headless: false
}).then(async client => await start(client));
```
