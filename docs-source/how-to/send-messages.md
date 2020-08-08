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