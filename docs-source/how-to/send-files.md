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

## Sending Gifs

There are two ways to send GIFs - by Video or by giphy link.
  
  WA doesn't actually support the .gif format - probably due to how inefficient it is as a filetype - they instead convert GIFs to video then process them.

  In order to send gifs you need to do the same (convert the gif to an mp4 file) then use [[sendVideoAsGif]]

  [[sendGiphy]] is a convenience method to make it easier to send gifs from the website [GIPHY](https://giphy.com). You need to make sure you use a giphy media link as shown below.

```javascript

import { create, Client} from '@open-wa/wa-automate';

function start(client: Client) {
await client.sendVideoAsGif('xyz@c.us','Video FILE DATA URL','some file.mp4', `Hello this is the caption`);

//or send via Giphy URL

await client.sendGiphy('xyz@c.us','https://media.giphy.com/media/oYtVHSxngR3lC/giphy.gif', `Hello this is the caption`);
}

///IMPORTANT! Please make sure to point to your chrome installation and make sure your host has ffmpeg support
create({
  // For Mac:
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  // For Windows:
  // executablePath: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
}).then(client => start(client));

```
