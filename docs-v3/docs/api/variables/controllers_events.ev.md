---
id: "controllers_events.ev"
title: "Variable: ev"
sidebar_label: "ev"
custom_edit_url: null
---

[controllers/events](/api/modules/controllers_events.md).ev

• `Const` **ev**: `EventEmitter2`

This is the library's event emitter. Use this to listen to internal events of the library like so:
```javascript
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

ev always emits data, sessionId and the namespace which is helpful to know if there are multiple sessions or you're listening to events from all namespaces

```javascript
ev.on('**.**', (data, sessionId, namespace) => {

 console.log(`${namespace} event detected for session ${sessionId}`, data)

});
```
