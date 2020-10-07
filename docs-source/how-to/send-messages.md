# Sending Messages

When sending a message, make sure to await the promise. It usually returns an id if the message was sent successfully.

## Send a basic message

[[sendText]]

```javascript
    await client.sendText(chatId, "Hello");
```

## Send a message with mentions

[[sendTextWithMentions]]

```javascript
    await client.sendTextWithMentions(chatId, "Hello");
```

## Send a reply

[[reply]]

```javascript
    await client.reply(chatId, "Hello", idOfMessageToReplyTo);

    // set the fourth variable to true to set the chat to 'seen'
    await client.reply(chatId, "Hello", idOfMessageToReplyTo, true);
```

## Send a reply with mentions

[[sendReplyWithMentions]]

```javascript
    await client.sendReplyWithMentions(chatId, "Hello", idOfMessageToReplyTo);
```

## Forward Messages

To forward messages use [[forwardMessages]] with the following params:

- chat to forward messages to : xxxxx@c.us
- messages: a single or array of message ids or message objects
- skipMyMessages: true or false, if true it will filter out messages sent by you from the list of messages, default false.

```javascript
//forward multiple messages using an array of messageIds
await client.forwardMessages('xxxxx@c.us',[Array of Message Ids],true)

//forward single message by id
await client.forwardMessages('xxxxx@c.us,"messageId",true)
```
