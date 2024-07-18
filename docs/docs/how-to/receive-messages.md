# Receiving Messages

## Listen to only incoming messages

[[onMessage]]

```javascript
    client.onMessage(message=>{
        console.log(message.body);
    })
```

## Listen to all messages in and out

[[onAnyMessage]]

```javascript
    client.onAnyMessage(message=>{
        console.log(message.body);
    })
```