> [!WARNING]  
> By visiting this page you [explicitly agree to the Terms of Service (read here)](https://github.com/open-wa/wa-automate-nodejs/blob/master/tos.md)

<div align="center">
<img src="https://raw.githubusercontent.com/open-wa/wa-automate-nodejs/master/resources/hotfix-logo.png" width="128" height="128"/>

# wa-automate-nodejs

> wa-automate-nodejs is the most advanced NodeJS library which provides a high-level API to control WA.
>
>

[![Ceasefire Now](https://badge.techforpalestine.org/ceasefire-now)](https://techforpalestine.org/learn-more)

[![npm version](https://img.shields.io/npm/v/@open-wa/wa-automate.svg?color=green)](https://www.npmjs.com/package/@open-wa/wa-automate)
![node](https://img.shields.io/node/v/@open-wa/wa-automate)
[![Downloads](https://img.shields.io/npm/dm/@open-wa/wa-automate.svg)](https://www.npmjs.com/package/@open-wa/wa-automate)
[![Average time to resolve an issue](http://isitmaintained.com/badge/resolution/open-wa/wa-automate-nodejs.svg)](http://isitmaintained.com/project/open-wa/wa-automate-nodejs "Average time to resolve an issue")
[![Percentage of issues still open](http://isitmaintained.com/badge/open/open-wa/wa-automate-nodejs.svg)](http://isitmaintained.com/project/open-wa/wa-automate-nodejs "Percentage of issues still open")

<a href="https://discord.gg/dnpp72a"><img src="https://img.shields.io/discord/661438166758195211?color=blueviolet&label=discord&style=flat" /></a> ![WhatsApp_Web 2.2147.16](https://img.shields.io/badge/WhatsApp_Web-2.2147.16-brightgreen.svg)<img alt="Twitter Follow" src="https://img.shields.io/twitter/follow/openwadev?label=Follow%20%40openwadev%20for%20updates&logo=twitter&style=social"/>

<a href="https://cloud.digitalocean.com/apps/new?repo=https%3A%2F%2Fgithub.com%2Fopen-wa%2Fwa-automate-docker%2Ftree%2Fmaster&refcode%3D4b093f6ecd3a&utm_campaign=Referral_Invite&utm_medium=Referral_Program&utm_source=badge">
 <img style="max-height:200px" src="https://raw.githubusercontent.com/open-wa/wa-automate-deploy-heroku/main/assets/do_deploy.png" alt="Deploy to DO"/>
</a>


<p align="center">
  <a href="#functions-list">Key Features</a> •
  <a href="https://docs.openwa.dev/docs/get-started/installation">Getting Started</a> •
  <a href="https://docs.openwa.dev/docs/get-started/quick-run">Easy API</a> •
  <a href="https://docs.openwa.dev/docs/api/classes/api_Client.Client">Documentation</a> •
  <a href="https://openwa.page.link/key">Get a License Key</a> •
  <a href="#support">Support</a>
</p>

</div>

## Installation and Updating

Use this command to install the library for the first time and to keep the library up to date.

```bash
> npm i --save @open-wa/wa-automate@latest
```

## Usage

## CLI

Want to convert your WA account to an API instantly? You can now with the CLI. For more details see [Easy API](https://docs.openwa.dev/pages/Getting%20Started/quick-run.html)

```bash
> npx @open-wa/wa-automate --help
```

## Custom Setup

Learn more about all possible configuration options here: [ConfigObject](https://docs.openwa.dev/interfaces/api_model_config.ConfigObject.html)

```javascript
const wa = require('@open-wa/wa-automate');

wa.create({
  sessionId: "COVID_HELPER",
  multiDevice: true, //required to enable multiDevice support
  authTimeout: 60, //wait only 60 seconds to get a connection with the host account device
  blockCrashLogs: true,
  disableSpins: true,
  headless: true,
  hostNotificationLang: 'PT_BR',
  logConsole: false,
  popup: true,
  qrTimeout: 0, //0 means it will wait forever for you to scan the qr code
}).then(client => start(client));

function start(client) {
  client.onMessage(async message => {
    if (message.body === 'Hi') {
      await client.sendText(message.from, '👋 Hello!');
    }
  });
}

```

###### After executing `create()` function, **@open-wa/wa-automate** will create an instance of WA web. If you are not logged in, it will print a QR code in the [terminal](https://i.imgur.com/g8QvERI.png). Scan it with your phone and you are ready to go!

###### @open-wa/wa-automate will remember the session so there is no need to authenticate every time


## Multi Device Support

We're currently in a weird transitionary period where some people are being forced to adopt Multi Device (MD). Once the transition is complete, the library default will be to turn on MD support. For now, you have to set it yourself explicitly either by using the `--multi-device` flag (with the [CLI](#CLI)) or setting `multiDevice: true` in your config (with your custom code)

### Latest Changes

With the constant updates from WA. It is advisable to always use the latest version of `@open-wa/wa-automate`.

   <div align="center">
   <img src="https://raw.githubusercontent.com/open-wa/wa-automate-nodejs/master/release.png"/>
   </div>

### Functions list

| Function                          | Reference |
| --------------------------------- | ----------- |
| Receive message                   | [onMessage](https://docs.openwa.dev/classes/api_Client.Client.html#onMessage)
| Automatic QR Refresh              | [autoRefresh](https://docs.openwa.dev/classes/api_Client.Client.html#autoRefresh)
| Send text                         | [sendText](https://docs.openwa.dev/classes/api_Client.Client.html#sendText)
| Get contacts                      | [getContact](https://docs.openwa.dev/classes/api_Client.Client.html#getContact)
| Get chats                         | [getAllChats](https://docs.openwa.dev/classes/api_Client.Client.html#getAllChats)
| Get groups                        | [getAllGroups](https://docs.openwa.dev/classes/api_Client.Client.html#getAllGroups)
| Get group members                 | [getGroupMembersId](https://docs.openwa.dev/classes/api_Client.Client.html#getGroupMembersId)
| Send contact                      | [sendContact](https://docs.openwa.dev/classes/api_Client.Client.html#sendContact)
| Send Images (image)              | [sendImage](https://docs.openwa.dev/classes/api_Client.Client.html#sendImage)
| Send media (audio, doc) | [sendFile](https://docs.openwa.dev/classes/api_Client.Client.html#sendFile)
| Send media (video)  | [Send Videos](https://docs.openwa.dev/pages/How%20to/send-files/send-videos.html)
| Send stickers                     | [sendStickerfromUrl](https://docs.openwa.dev/classes/api_Client.Client.html#sendStickerFromuUrl)
| Decrypt media (image, audio, doc) | [Decrypt Media](https://docs.openwa.dev/pages/How%20to/decrypt-media.html)
| Capturing QR Code                 | [Capturing QR Code](https://docs.openwa.dev/pages/The%20Client/launch-events/capture-qr.html)
| Multiple Sessions                 | [Multiple Sessions](https://docs.openwa.dev/pages/The%20Client/the-client/multiple-sessions.html)
| Last seen      | [getLastSeen](https://docs.openwa.dev/classes/api_Client.Client.html#getLastSeen)
| isOnline      | [isChatOnline](https://docs.openwa.dev/classes/api_Client.Client.html#isChatOnline)
| 📍 Send Location      | [sendLocation](https://docs.openwa.dev/classes/api_Client.Client.html#sendLocation)
| Simulated '...typing'             | [simulateTyping](https://docs.openwa.dev/classes/api_Client.Client.html#simulateTyping)
| Send GIFs!                       | [sendVideoAsGif](https://docs.openwa.dev/classes/api_Client.Client.html#sendVideoAsGif)
| Send Giphy!                       | [sendGiphy](https://docs.openwa.dev/classes/api_Client.Client.html#sendGiphy)
| Forward Messages                  | [forwardMessages](https://docs.openwa.dev/classes/api_Client.Client.html#forwardMessages)
| Listen to Read Receipts           | [onAck](https://docs.openwa.dev/classes/api_Client.Client.html#onAck)
| Listen to Live Locations           | [onLiveLocation](https://docs.openwa.dev/classes/api_Client.Client.html#onLiveLocation)
| Group participant changes         | [onParticipantsChanged](https://docs.openwa.dev/classes/api_Client.Client.html#onParticipantsChanged)
| Create Groups         | [Create Group](https://docs.openwa.dev/pages/How%20to/groups.html#create-a-group)
| add, remove, promote, demote participants        | [Manage Participants](https://docs.openwa.dev/pages/How%20to/groups/manage-participants.html)

[Checkout all the available functions here.](https://docs.openwa.dev/classes/api_Client.Client.html)

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

## Support

If you need paid support, consulting, or just want support/sponsor the ongoing development of this project, you can in the following ways:

|Description | Link |
|-	|:-:|
| Get a License key | <a class="gumroad-button" href="https://gum.co/BTMt?wanted=true" target="_blank" data-gumroad-single-product="true" style='background-color: white !important;background-image: url(https://gumroad.com/button/button_bar.jpg) !important;background-repeat: repeat-x !important;border-radius: 4px !important;box-shadow: rgba(0, 0, 0, 0.4) 0 0 2px !important;color: #999 !important;display: inline-block !important;font-family: -apple-system, ".SFNSDisplay-Regular", "Helvetica Neue", Helvetica, Arial, sans-serif !important;font-size: 16px !important;font-style: normal !important;font-weight: 500 !important;line-height: 50px !important;padding: 0 15px !important;text-shadow: none !important;text-decoration: none !important;'><span class="gumroad-button-logo" style='background-image: url(https://gumroad.com/button/button_logo.png) !important;background-size: cover !important;height: 17px !important;width: 16px !important;display: inline-block !important;margin-bottom: -3px !important;margin-right: 15px !important;'></span>Get a License key</a>
| Donate or Book 1 hour consult | [![Buy me a coffee][buymeacoffee-shield]][buymeacoffee]
| Per-minute consulting |   <a href="http://otechie.com/smashah"><img src="https://api.otechie.com/consultancy/smashah/badge.svg" alt="Consulting"/></a>
| Hire me! | [![Consulting Request][consult-shield]][consult]

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
[consult]: mailto:shah@openwa.dev?subject=WhatsApp%20Consulting
