# Launch Events

When you call `create` there is actually a lot happening in the background and in some use cases, it may be useful to listen to those events. In order to do this you have to use the built in event emitter [[ev]]:

```javascript
import { ev } from '@open-wa/wa-automate';

ev.on('event', callback)
```

The event you want to listen to is in the format of [namespace].[sessionId]

The event can include wildcards.

For example, to listen to all qr code events, the event will be `qr.**`. e.g:

```javascript
ev.on('qr.**',...
```

Listen to all sessionData events

```javascript
ev.on('sessionData.**',...
```

Listen to all events from session1

```javascript
ev.on('**.session1',...
```

Listen to all events

```javascript
ev.on('**.**',...
```

ev always emits data, sessionId and the namespace which is helpful to know if there are multiple sessions or you're listening to events from all namespaces.

```javascript
ev.on('**.**', (data, sessionId, namespace) => {

 console.log(`${namespace} event detected for session ${sessionId}`, data)

});
```

## Capturing QR Code

An event is emitted every time the QR code is received by the system. You can grab hold of this event emitter by importing `ev`. You can capture this qr code and save it to a file.

```javascript
import { ev } from '@open-wa/wa-automate';
const fs = require('fs');

ev.on('qr.**', async qrcode => {
  //qrcode is base64 encoded qr code image
  //now you can do whatever you want with it
  const imageBuffer = Buffer.from(
    qrcode.replace('data:image/png;base64,', ''),
    'base64'
  );
  fs.writeFileSync('qr_code.png', imageBuffer);
});
```

## Capturing the session data

By default, the session data is saved as a `[sessionId].data.json` file in the process working directory, however, you can disable this ([[skipSessionSave]]) and implement a custom handler for session data. It is important that you always update session data with the latest values. The default behaviour is to override the data.json file with the latest session data.

```javascript
import { ev } from '@open-wa/wa-automate';
const fs = require('fs');

ev.on('sessionData.**', async (sessionData, sessionId) => {
    //do something with sessionData and sessionId
});
```