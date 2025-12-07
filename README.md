[![npm version](https://img.shields.io/npm/v/@open-wa/wa-decrypt.svg?color=green)](https://www.npmjs.com/package/@open-wa/wa-decrypt)
[![Maintainability](https://api.codeclimate.com/v1/badges/a452db764ce137f35e99/maintainability)](https://codeclimate.com/github/smashah/wa-decrypt/maintainability)
[![Buy me a coffee][buymeacoffee-shield]][buymeacoffee]

# wa-decrypt

> This is a single function library born out of the [open-wa/wa-automate-nodejs](https://github.com/open-wa/wa-automate-nodejs) project. The reason for this project is so you can easily decrypt messages on a remote process without needing to install all of the dependencies (e.g puppeteer) that come with open-wa/wa-automate-nodejs.

## Installation

```bash
> npm i --save @open-wa/wa-decrypt
```

## Decrypting Media

Here is a sample of how to decrypt media. This has been tested on images, videos, documents, audio and voice notes.

```javascript
import { decryptMedia } from '@open-wa/wa-decrypt';
const mime = require('mime-types');
const fs = require('fs');

const processMessage = async message => {
    if (message.mimetype) {
      const filename = `${message.t}.${mime.extension(message.mimetype)}`;
      const mediaData = await decryptMedia(message);
      const imageBase64 = `data:${message.mimetype};base64,${mediaData.toString(
        'base64'
      )}`;
      fs.writeFile(filename, mediaData, function(err) {
        if (err) {
          return console.log(err);
        }
        console.log('The file was saved!');
      });
    }
  }
```

## Verifying Decryption

As of v2.0.0 of `wa-decrypt`, you are now able to verify the decryption output hash with the actual hash of the file as represented by `message.filehash`. You can see an example of this in `test/index.ts`. Please note that YOU CANNOT VERIFY THE HASH OF STICKERS, so don't even try it right now!

```javascript
import crypto from 'crypto';
...

    const mediaData = await decryptMedia(message);
    let output_hash = crypto.createHash('sha256').update(mediaData).digest('base64');
    let hashValid = message.filehash == output_hash;
    console.log('Hash Validated:', hashValid);

```

## Troubleshooting

If you're having issues with 404s or are unable to decrypt stickers, please see this documentation:

[docs.openwa.dev](https://docs.openwa.dev/pages/How%20to/decrypt-media.html)

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
[buymeacoffee]: https://www.buymeacoffee.com/smashah