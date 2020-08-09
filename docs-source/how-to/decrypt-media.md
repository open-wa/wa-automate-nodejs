
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