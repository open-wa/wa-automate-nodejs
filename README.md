[![npm version](https://img.shields.io/npm/v/sulla-hotfix.svg?color=green)](https://www.npmjs.com/package/sulla-hotfix)
[![Buy me a coffee][buymeacoffee-shield]][buymeacoffee]

# sulla-hotfix

> Sulla is a javascript library which provides a high-level API control to Whatsapp so it can be configured to automatize resposes or any data that goes trough Whatsapp effortlessly.
>
> It is built using [puppeteer](https://github.com/GoogleChrome/puppeteer) and based on [this python wrapper](https://github.com/mukulhase/WebWhatsapp-Wrapper)

## Installation

```bash
> npm i --save sulla-hotfix
```

## Usage

```javascript
// import { create, Whatsapp } from 'sulla-hotfix';
const sulla = require('sulla-hotfix');

sulla.create().then(client => start(client));

function start(client) {
  client.onMessage(message => {
    if (message.body === 'Hi') {
      client.sendText(message.from, '👋 Hello from sulla!');
    }
  });
}
```

###### After executing `create()` function, **sulla** will create an instance of whatsapp web. If you are not logged in, it will print a QR code in the [terminal](https://i.imgur.com/g8QvERI.png). Scan it with your phone and you are ready to go!

###### sulla will remember the session so there is no need to authenticate everytime.

### Functions list

| Function                          | Description | Implemented |
| --------------------------------- | ----------- | ----------- |
| Receive message                   |             | ✅          |
| Send text                         |             | ✅          |
| Get contacts                      |             | ✅          |
| Get chats                         |             | ✅          |
| Get groups                        |             | ✅          |
| Get group members                 |             | ✅          |
| Send contact                      |             | ✅          |
| Get contact detail                |             | ✅          |
| Send Images (image)               |             | ✅          |
| Send media (audio, doc, video)    |             | ✅          |
| Send stickers                     |             |             |
| Decrypt media (image, audio, doc) |             | ✅          |
| Capturing QR Code                 |             | ✅          |
| Multiple Sessions                 |             | ✅          |
| Last seen & isOnline (beta)       |             | ✅          |
| 📍 SEND LOCATION!! (beta)         |             | ✅          |
| Simulated '...typing'             |             | ✅          |

## Capturing QR Code

An event is emitted every time the QR code is received by the system. You can grab hold of this event emitter by importing `ev`

```javascript
import { ev } from 'sulla-hotfix';
const fs = require('fs');

ev.on('qr', async qrcode => {
  //qrcode is base64 encoded qr code image
  //now you can do whatever you want with it
  const imageBuffer = Buffer.from(
    qrcode.replace('data:image/png;base64,', ''),
    'base64'
  );
  fs.writeFileSync('qr_code.png', imageBuffer);
});
```

You can see a live implementation of this on `demo/index.ts`. Give it a spin! :D

## Decrypting Media

Here is a sample of how to decrypt media. This has been tested on images, videos, documents, audio and voice notes.

```javascript
import { create, Whatsapp, decryptMedia } from 'sulla-hotfix';
const mime = require('mime-types');
const fs = require('fs');

function start(client: Whatsapp) {
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

## Sending Media/Files

Here is a sample of how to send media. This has been tested on images, videos, documents, audio and voice notes.

Interestingly sendImage has always worked for sending any type of file.

An example of sending a is shown in the Decrypting Media secion above also.

```javascript
import { create, Whatsapp} from 'sulla-hotfix';

function start(client: Whatsapp) {
await client.sendFile('xyz@c.us',[BASE64 FILE DATA],'some file.pdf', `Hello this is the caption`);
}

create().then(client => start(client));
```

## Sending Video

If you intend to use video via sulla-hotfix, you need to use a chrome instance with puppeteer instead of the default chromium instance. This is becase chromium does not have any relevant video codecs needed for new whatsapp web video sending features.

You will need to make sure that you have a valid chrome instance on your machine then use the following to tell puppeteer where it can find your chrome isntance. The below demo is an example for mac.

```javascript

create('session',{
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
}).then(client => start(client));

```

## Sending Location

As of version 1.3.0 you can now send location!! You can't even do this in normal whatsapp web interface.

You need to pass the following params:

- chat id: xxxxx@us.c
- latitude: '51.5074'
- longitude: '0.1278'
- location text: 'LONDON!'

Here's how you do it:

```javascript
await client.sendLocation('xxxxx@c.us', '51.5074', '0.1278',  'LONDON!')
```

## Simulate typing

As of version 1.3.1 you can now simulate '...typing'

You need to pass the following params:

- chat id: xxxxx@us.c
- on: true or false

Note: You need to manually turn this off!!!

```javascript
//start '...typing'
await client.simulateTyping('xxxxx@c.us',true)
//wait 3 seconds

//stop '...typing'
await client.simulateTyping('xxxxx@c.us',false)
```


## Managing multiple sessions at once

With v1.2.4, you can now run multiple sessions of sulla-hotfix in the same 'app'. This allows you to do interesting things for example:

1. Design and run automated tests for you WA bot.
2. Connect two or more whatsapp numbers to a single (or multiple) message handler(s)
3. Use one client to make sure another one is alive by pinging it.

Please see demo/index.ts for a working example

NOTE: DO NOT CREATE TWO SESSIONS WITH THE SAME SESSIONID.

```javascript
import { create, Whatsapp} from 'sulla-hotfix';

function start(client: Whatsapp) {
  ...
}

create().then(client => start(client));

create('another session').then(client => start(client));
```

## Custom Set Up

With v.1.2.6 you can now forward custom arguments through the library to puppeteer. This includes any overrides to the pupeteer config and a custom useragent.

Note: If you want to change the user agent but leave the puppeteer config the same then just pass {} to the pupeteer config. Also if you don't want to use a custom session then just use 'session' for the first argument.

As with session name segment, these are all optional parameters.

Why should you use a custom user agent?

Users of these whatsapp injection libraries should use different user agents (preferably copy the one you have one your own pc) because then it makes it harder for whatsapp to break the mecahnism to restart sessions for this library.

Example:

```javascript
import { create, Whatsapp} from 'sulla-hotfix';

function start(client: Whatsapp) {
  ...
}

create().then(client => start(client));

//1st argument is the session name
//2nd argument is the puppeteer config override
//3rd argument is the user agent override

create('session',
{
  headless: false
},
'some custom user agent')
.then(client => start(client));
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](https://choosealicense.com/licenses/mit/)



## Legal
This code is in no way affiliated with, authorized, maintained, sponsored or endorsed by WhatsApp or any of its affiliates or subsidiaries. This is an independent and unofficial software. Use at your own risk.

## Cryptography Notice
This distribution includes cryptographic software. The country in which you currently reside may have restrictions on the import, possession, use, and/or re-export to another country, of encryption software. BEFORE using any encryption software, please check your country's laws, regulations and policies concerning the import, possession, or use, and re-export of encryption software, to see if this is permitted. See [http://www.wassenaar.org/](http://www.wassenaar.org/) for more information.

The U.S. Government Department of Commerce, Bureau of Industry and Security (BIS), has classified this software as Export Commodity Control Number (ECCN) 5D002.C.1, which includes information security software using or performing cryptographic functions with asymmetric algorithms. The form and manner of this distribution makes it eligible for export under the License Exception ENC Technology Software Unrestricted (TSU) exception (see the BIS Export Administration Regulations, Section 740.13) for both object code and source code.

[buymeacoffee-shield]: https://www.buymeacoffee.com/assets/img/guidelines/download-assets-sm-2.svg
[buymeacoffee]: https://www.buymeacoffee.com/0lUd5Y3