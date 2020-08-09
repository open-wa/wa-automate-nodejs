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
