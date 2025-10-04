# Handle Incoming Call

[[onIncomingCall]] emits a [[Call]] object. You can use this to tell people not to call the number

```javascript
    client.onIncomingCall(async call=>{
        await client.sendText(call.peerJid._serialized, 'Sorry I cannot accept calls');
    });
```
