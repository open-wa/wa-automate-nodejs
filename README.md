<div align="center">
<img src="https://raw.githubusercontent.com/open-wa/wa-automate-nodejs/master/resources/hotfix-logo.png" width="128" height="128"/>

# wa-automate-nodejs

> wa-automate-nodejs is the most advanced NodeJS library which provides a high-level API to control WA.
>
>

[![npm version](https://img.shields.io/npm/v/@open-wa/wa-automate.svg?color=green)](https://www.npmjs.com/package/@open-wa/wa-automate)
![node](https://img.shields.io/node/v/@open-wa/wa-automate)
[![Downloads](https://img.shields.io/npm/dm/@open-wa/wa-automate.svg)](https://www.npmjs.com/package/@open-wa/wa-automate)
[![Average time to resolve an issue](http://isitmaintained.com/badge/resolution/open-wa/wa-automate-nodejs.svg)](http://isitmaintained.com/project/open-wa/wa-automate-nodejs "Average time to resolve an issue")
[![Percentage of issues still open](http://isitmaintained.com/badge/open/open-wa/wa-automate-nodejs.svg)](http://isitmaintained.com/project/open-wa/wa-automate-nodejs "Percentage of issues still open")

<a href="https://discord.gg/dnpp72a"><img src="https://img.shields.io/discord/661438166758195211?color=blueviolet&label=discord&style=flat" /></a> ![WhatsApp_Web 2.2029.4](https://img.shields.io/badge/WhatsApp_Web-2.2029.4-brightgreen.svg)

[![Buy me a coffee][buymeacoffee-shield]][buymeacoffee]
[![Consulting Request][consult-shield]][consult]

</div>

## Installation

```bash
> npm i --save @open-wa/wa-automate
```

## Zero Installation

Want to convert your WA account to an API instantly? You can no with the cli. For more details see {@page Easy API}

```bash
> npx @open-wa/wa-automate --help
```

## Usage

```javascript
// import { create, Client } from '@open-wa/wa-automate';
const wa = require('@open-wa/wa-automate');

wa.create().then(client => start(client));

function start(client) {
  client.onMessage(message => {
    if (message.body === 'Hi') {
      client.sendText(message.from, '👋 Hello!');
    }
  });
}
```

###### After executing `create()` function, **@open-wa/wa-automate** will create an instance of WA web. If you are not logged in, it will print a QR code in the [terminal](https://i.imgur.com/g8QvERI.png). Scan it with your phone and you are ready to go!

###### @open-wa/wa-automate will remember the session so there is no need to authenticate every time

### Latest Changes

With the constant updates from WA. It is advisable to always use the latest version of `@open-wa/wa-automate`.

   <div align="center">
   <img src="https://raw.githubusercontent.com/open-wa/wa-automate-nodejs/master/release.png"/>
   </div>

### Functions list

| Function                          | Reference |
| --------------------------------- | ----------- |
| Receive message                   | [[onMessage]]
| Automatic QR Refresh              | [[autoRefresh]]
| Send text                         | [[sendText]]
| Get contacts                      | [[getContact]]
| Get chats                         | [[getAllChats]]
| Get groups                        | [[getAllGroups]]
| Get group members                 | [[getGroupMembersId]]
| Send contact                      | [[sendContact]]
| Send Images (image)              | [[sendImage]]
| Send media (audio, doc) | [[sendFile]]
| Send media (video)  | {@page Send Videos}
| Send stickers                     | [[sendStickerfromUrl]]
| Decrypt media (image, audio, doc) | {@page Decrypt Media}
| Capturing QR Code                 | {@page Capturing QR Code}
| Multiple Sessions                 | {@page Multiple Sessions}
| Last seen      | [[getLastSeen]]
| isOnline      | [[isChatOnline]]
| 📍 Send Location      | [[sendLocation]]
| Simulated '...typing'             | [[simulateTyping]]
| Send GIFs!                       | [[sendVideoAsGif]]
| Send Giphy!                       | [[sendGiphy]]
| Forward Messages                  | [[forwardMessages]]
| Listen to Read Receipts           | [[onAck]]
| Listen to Live Locations           | [[onLiveLocation]]
| Group participant changes         | [[onParticipantsChanged]]
| Create Groups         | [[createGroup]]
| add, remove, promote, demote participants        | {@page Manage Participants}

[Checkout all the available functions here.](https://open-wa.github.io/wa-automate-nodejs/classes/client.html)

## Running the demo

You can clone this repo and run the demo, but you will need to use typescript/ts-node:

```bash
> git clone https://github.com/open-wa/wa-automate-nodejs.git
> cd wa-automate-nodejs
> npm i
> npm i -g ts-node typescript
> cd demo
> ts-node index.ts
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[Hippocratic + Do Not Harm Version 1.0](https://github.com/open-wa/wa-automate-nodejs/blob/master/LICENSE.md)

## Legal

This code is in no way affiliated with, authorized, maintained, sponsored or endorsed by WA or any of its affiliates or subsidiaries. This is an independent and unofficial software. Use at your own risk.

## Cryptography Notice

This distribution includes cryptographic software. The country in which you currently reside may have restrictions on the import, possession, use, and/or re-export to another country, of encryption software. BEFORE using any encryption software, please check your country's laws, regulations and policies concerning the import, possession, or use, and re-export of encryption software, to see if this is permitted. See [http://www.wassenaar.org/](http://www.wassenaar.org/) for more information.

The U.S. Government Department of Commerce, Bureau of Industry and Security (BIS), has classified this software as Export Commodity Control Number (ECCN) 5D002.C.1, which includes information security software using or performing cryptographic functions with asymmetric algorithms. The form and manner of this distribution makes it eligible for export under the License Exception ENC Technology Software Unrestricted (TSU) exception (see the BIS Export Administration Regulations, Section 740.13) for both object code and source code.

[buymeacoffee-shield]: https://www.buymeacoffee.com/assets/img/guidelines/download-assets-sm-2.svg
[buymeacoffee]: https://www.buymeacoffee.com/smashah
[consult-shield]: https://img.shields.io/badge/Require%20Paid%20Support%20or%20Consulting%3F-Click%20Here-blue?style=for-the-badge&logo=paypal
[consult]: mailto:shah@idk.uno?subject=WhatsApp%20Consulting
