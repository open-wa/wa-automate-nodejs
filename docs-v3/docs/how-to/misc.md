# More examples

## Simulate typing

As of version 1.3.1 you can now simulate '...typing'

You need to pass the following params:

- chat id: xxxxx@c.us
- on: true or false

Note: You need to manually turn this off!!!

```javascript
//start '...typing'
await client.simulateTyping('xxxxx@c.us',true)
//wait 3 seconds

//stop '...typing'
await client.simulateTyping('xxxxx@c.us',false)
```

## Load profile pics from server

Generally, after the 20th chat in your WA, getChat methods do not retreive the chat picture. You need to get these from the WA servers. This is how you do it in v1.6.6^:

```javascript
client.getProfilePicFromServer('XXXXXXX-YYYYY@c.us')
```

## Listen to Read Receipts

As of version 1.5.3 you can now listen in on the read state (or technically acknowledgement state) of the messages. As of writing the limitation is presumed to be on sent messages.

The callback you set returns the whole raw message object.

Here's how you do it.

```javascript
client.onAck((msg:any) => console.log(msg.id.toString(),msg.body,msg.ack))
```

ack represents the acknoledgement state, of which there are 3.

```javascript
1 => Message Sent (1 tick)

2 => Message Received by Recipient (2 ticks)

3 => Message Read Receipt Confirmed (2 blue ticks)
```

Note: You won't get 3 if the recipient has read receipts off.
