# Sending Files

## Send Image

[[sendImage]]

Make sure to use a [[DataURL]] for the second parameter.

```javascript
    client.sendImage(chatId, dataUrl, 'filename.jpeg', 'cool caption')

    //send image as a reply to another message quotedMessageId
    client.sendImage(chatId, dataUrl, 'filename.jpeg', 'cool caption', quotedMessageId)

    //wait for the Id to be returned
    client.sendImage(chatId, dataUrl, 'filename.jpeg', 'cool caption', null, true)

```

## Send Video

In order to send videos, the client must be started with an instance of chrome! Otherwise videos will be sent as files and not render properly in the app.

To use chrome set [[useChrome]] (finds the chrome installation automatically) to true or set the [[executablePath]] (set the chrome installation path manually).

[[useChrome]] takes a few seconds so to save time in consequtive processes set [[executablePath]] ([[useChrome]] will output the valid [[executablePath]] in the logs so keep an eye on them)

```javascript
    client.sendImage(chatId, dataUrl, 'filename.jpeg', 'cool caption')

    //send image as a reply to another message quotedMessageId
    client.sendImage(chatId, dataUrl, 'filename.jpeg', 'cool caption', quotedMessageId)

    //wait for the Id to be returned
    client.sendImage(chatId, dataUrl, 'filename.jpeg', 'cool caption', null, true)

```

## Send Audio

[[sendPtt]] sends an audio clip as a 'push to talk' type file. This allows recipients to play the clip as they would any other voice note.

```javascript
    client.sendFile(chatId, dataUrl)

    //Send the audio as reply to a message (quotedMessageId)
    client.sendFile(chatId, dataUrl, )quotedMessageId
```

## Send File

[[sendFile]]

[[sendFileFromUrl]]

```javascript

    client.sendFile(chatId, dataUrl, 'file.pdf', 'check this pdf')

    //Send the file as reply to a message (quotedMessageId)
    client.sendFile(chatId, dataUrl, 'file.pdf', 'check this pdf', quotedMessageId)

    //Send a file and wait for the message id to be returned
    client.sendFile(chatId, dataUrl, 'file.pdf', 'check this pdf', null, true)

    //or from URL
    client.sendFileFromUrl(chatId, url);
```

## Send Stickers

[[sendImageAsSticker]]

[[sendStickerfromUrl]]

```javascript
    client.sendImageAsSticker(chatId, dataUrl);

    //or from a URL
    client.sendStickerfromUrl(chatId, url);
```