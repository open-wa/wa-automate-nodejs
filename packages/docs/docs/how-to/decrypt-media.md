
# Decrypting Media

Here is a sample of how to decrypt media. This has been tested on images, videos, documents, audio and voice notes.

```javascript
import { create, Client, decryptMedia } from '@open-wa/wa-automate';
const mime = require('mime-types');
const fs = require('fs');

function start(client: Client) {
  client.onMessage(async message => {
    if (message.mimetype) {
      const filename = `${message.t}.${mime.extension(message.mimetype)}`;
      const mediaData = await decryptMedia(message);
      const imageBase64 = `data:${message.mimetype};base64,${mediaData.toString(
        'base64'
      )}`;
      await client.sendImage(
        message.from,
        imageBase64,
        filename,
        `You just sent me this ${message.type}`
      );
      fs.writeFile(filename, mediaData, function(err) {
        if (err) {
          return console.log(err);
        }
        console.log('The file was saved!');
      });
    }
  });
}

create().then(client => start(client));
```

## 404'd

You may sometimes get a `404` error when trying to decrypt media from an old message, this is because media is only available on the main servers for a limited period of time. In these circumstances, you will need to force the host account to reupload media. You can do this by using [[forceStaleMediaUpdate]] then using decryptMedia on the response.

```javascript
      const mediaData = await decryptMedia(client.forceStaleMediaUpdate(message.id));
```

## Decrypting Stickers

Decrypting stickers with the method shown above will result in a blank `.webp` file. To decrypt the sticker, use [[getStickerDecryptable]].

```javascript

      const mediaData = await decryptMedia(client.getStickerDecryptable(message.id));
      //or
      const mediaData = await client.decryptMedia(message.id);
```

It is always preferable to keep projects smaller than needed so you can now use a lightweight library called wa-decrypt for projects that do not need all of @open-wa/wa-automate.

You can install that using:

```bash
> npm i --save wa-decrypt
```

and import it like so:

```javascript
import { decryptMedia } from 'wa-decrypt';
```

[Learn more about wa-decrypt here](https://github.com/smashah/wa-decrypt#readme)