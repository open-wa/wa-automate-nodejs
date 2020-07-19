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

| Function                          | Description | Implemented |
| --------------------------------- | ----------- | ----------- |
| Receive message                   |             | ✅          |
| Automatic QR Refresh              |             | ✅          |
| Send text                         |             | ✅          |
| Get contacts                      |             | ✅          |
| Get chats                         |             | ✅          |
| Get groups                        |             | ✅          |
| Get group members                 |             | ✅          |
| Send contact                      |             | ✅          |
| Get contact detail                |             | ✅          |
| [Send Images (image)](#sending-mediafiles)               |             | ✅          |
| [Send media (audio, doc)](#sending-mediafiles)  |             | ✅          |
| [Send media (video)](#sending-video)  |             | ✅          |
| Send stickers                     |             |✅           |
| [Decrypt media (image, audio, doc)](#decrypting-media) |             | ✅          |
| [Capturing QR Code](#capturing-qr-code)                 |             | ✅          |
| [Multiple Sessions](#managing-multiple-sessions-at-once)                 |             | ✅          |
| [Last seen & isOnline (beta)]      |             | ✅          |
| [📍 SEND LOCATION!! (beta)](#sending-location)         |             | ✅          |
| [Simulated '...typing'](#simulate-typing)             |             | ✅          |
| [Send GIFs!](#sending-gifs)                       |             | ✅          |
| [Forward Messages](#sending-gifs)                  |             | ✅          |
| [Listen to Read Receipts](#listen-to-read-receipts)           |             | ✅          |
| [Listen to Live Locations](#listen-to-live-locations)           |             | ✅          |
| [Group participant changes](#group-participant-changes)         |             | ✅          |
| [Create Groups](#create-group)         |             | ✅          |
| [add, remove, promote, demote participants](##group-participants-beta)         |             | ✅          |

[Checkout all the available functions here.](https://open-wa.github.io/wa-automate-nodejs/classes/client.html)

### Insiders Program

open-wa is at the forefront of open source WA developmentand runs on donations from backers. To encourage donations, backers have access to exclusive features with an [Insiders Program license key](https://gumroad.com/l/BTMt).


| Function                          | Description |
| --------------------------------- | ----------- |
| [`setGroupToAdminsOnly`](https://open-wa.github.io/wa-automate-nodejs/classes/client.html#setGroupToAdminsOnly)                   | Changes group setting so only admins can send messages            |
| [`setGroupEditToAdminsOnly`](https://open-wa.github.io/wa-automate-nodejs/classes/client.html#setGroupEditToAdminsOnly)                   | Changes group setting so only admins can edit group info            |
| [`setProfilePic`](https://open-wa.github.io/wa-automate-nodejs/classes/client.html#setProfilePic)                   | Change the host phones profile picture           |
| [`onRemovedFromGroup`](https://open-wa.github.io/wa-automate-nodejs/classes/client.html#onRemovedFromGroup)                   | Detect when host phone is removed from a group           |
| [`onContactAdded`](https://open-wa.github.io/wa-automate-nodejs/classes/client.html#onContactAdded)                   | Detect when host phone adds a new contact           |
| [`getCommonGroups`](https://open-wa.github.io/wa-automate-nodejs/classes/client.html#getCommonGroups)                   | Retreive all common groups between the host device and a conttact           |
| [`clearAllChats`](https://open-wa.github.io/wa-automate-nodejs/classes/client.html#clearAllChats)                   | Easily clear memory by clearing all chats of all messages on the host device and WA Web           |
| [`sendReplyWithMentions`](https://open-wa.github.io/wa-automate-nodejs/classes/client.html#sendReplyWithMentions)                   | Send a reply to a message with mentions           |
| [`onChatOpened`](https://open-wa.github.io/wa-automate-nodejs/classes/client.html#onChatOpened)                   | Detect when a chat is selected in the UI           |
| [`onChatState`](https://open-wa.github.io/wa-automate-nodejs/classes/client.html#onChatState)                   | Detect when someone is typing or recording a voicenote           |

[Learn more about license keys.](https://github.com/open-wa/wa-automate-nodejs#license-key)

## Starting a conversation

There are 3 ways to start a chat with a new number:

1. [WA Links](https://faq.whatsapp.com/en/26000030/)
  
      You can send a special link to the person you want to start a chat with. This will open a conversation with your number on their phone. This way you can insure that they have explicitly started a conversation with you.
2. [WA Buttons](https://github.com/smashah/whatsapp-button?ref=producthunt)

      You can add this button to your website which, when clicked, will open a chat with you in the same way as above.
3. [With a License Key](https://github.com/open-wa/wa-automate-nodejs#license-key)

     In order to unlock the functionality to send texts to unknown numbers through @open-wa/wa-automate itself, you will need a License key.

     One License Key is valid for one number. Each License Key for this is £10 per month. [Instructions below.](https://github.com/open-wa/wa-automate-nodejs#license-key)

## License Key

For now the process happens through [Gumroad](https://gumroad.com/l/BTMt)

How to get a License key:

1. Go to [Gumroad](https://gumroad.com/l/BTMt).
2. Click on the type of license you require.
3. In the checkout, ***enter the host phone number you want to assign to the License Key (the one you will be using with open-wa, not your personal number)*** , along with the use case for this functionality and your github username. Please note, with this new system you'll only be able to change the number once.
4. Complete the checkout process.
5. You will instantly receive your License key on the screen and in your email.

   <div align="center">
   <img src="https://raw.githubusercontent.com/open-wa/wa-automate-nodejs/master/resources/membership.png"/>
   </div>

6. Add licenseKey to your config:

```javascript
...
create({
  licenseKey: "..."
})

//or for multiple license keys to stack features.

create({
  licenseKey: ["...","..."]
})
...
```

Notes:

- You can change the number assigned to a specific License Key once.
- In order to cancel your License Key, simply stop your membership.
- You can use multiple license keys for each host number.
- Apart from adding your licenseKey to your config, you will need to change nothing else in your code.
- An added benefit for members is priority on issues.
- License Key requests may be rejected.
- All code you will receive from the license server is closed-sourced and is under the same license as this project. You will not be able to read it. It is not transferrable to another number or another project.
- A restricted key does not provide any access to any other features listed in Gumroad.

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

## Capturing QR Code

An event is emitted every time the QR code is received by the system. You can grab hold of this event emitter by importing `ev`

```javascript
import { ev } from '@open-wa/wa-automate';
const fs = require('fs');

ev.on('qr.**', async qrcode => {
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

## Refreshing QRCode

In version v1.6.13^, you can now refresh the QR code every 10 seconds (you can change the interval).

```javascript
create({
    autoRefresh:false, //default to true
    qrRefreshS:30 //please note that if this is too long then your qr code scan may end up being invalid. Generally qr codes expire every 15 seconds.
}).then(async client => await start(client));
```

## Kill the session

As of v1.6.6^ you can now kill the session when required. Best practice is to manage trycatch-es yourself and kill the client on catch.

```javascript
try{
...
await client.sendMessage(...
...
} catch(error){
client.kill();
//maybe restart the session then
}
```

## Force Refocus and reacting to state

When a user starts using WA web in a different browser, @open-wa/wa-automate will be left on a screen prompting you to click 'Use here'. As of v1.6.6^ you can now force the client to press 'Use here' everytime the state has changed to 'CONFLICT'. onStateChanged results in 'UNPAIRED', 'CONNECTED' or 'CONFLICT';

```javascript
client.onStateChanged(state=>{
    console.log('statechanged', state)
    if(state==="CONFLICT") client.forceRefocus();
  });

```

## Decrypting Media

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

## Issues with decryption

If you are having issues with decryption it may be due to the user agent being used by the decrypt method.
You can remedy this by passing a custom user agent as a second parameter to the decrypt method. Now there is a convenience method on the WA class to allow you to easily get a compatible user agent shown below. This feature is available in v.1.5.8 and above.

```javascript
...
      const generatedUa = await client.getGeneratedUserAgent(); //you can optionally pass your custom user agent in here also getGeneratedUserAgent('...');
      const mediaData = await decryptMedia(message,generatedUa);
...
```

## Sending Media/Files

Here is a sample of how to send media. This has been tested on images, videos, documents, audio and voice notes.

Interestingly sendImage has always worked for sending any type of file.

An example of sending a is shown in the Decrypting Media secion above also.

```javascript
import { create, Client} from '@open-wa/wa-automate';

function start(client: Client) {
await client.sendFile('xyz@c.us',[BASE64 FILE DATA],'some file.pdf', `Hello this is the caption`);
}

create().then(client => start(client));
```

Please note sometimes short(<4s) voice notes sometimes do not decrypt properly and result in empty audio files.

## Sending Video

If you intend to use video via @open-wa/wa-automate, you need to use a chrome instance with puppeteer instead of the default chromium instance. This is becase chromium does not have any relevant video codecs needed for new WA web video sending features.

You will need to make sure that you have a valid chrome instance on your machine then use the following to tell puppeteer where it can find your chrome isntance. The below demo is an example for mac & windows. For linux based hosts, you can find the chrome path with ```whereis google-chrome```, it should be something like ```/usr/bin/google-chrome```

```javascript

create({
  // For Mac:
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  // For Windows:
  // executablePath: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
}).then(client => start(client));

```

## Sending Gifs

Extending the functionality of sending videos, version 1.4.2 brings with it the ability to send GIFs!!!! This was super annoying to figure out, as I was sent on a wild goose chase but it turned out that the answer was just 2 simple lines.

There are two ways to send GIFs - by Video or by giphy link.

1. Sending Video as a GIF.
  
  WA doesn't actually support the .gif format - probably due to how inefficient it is as a filetype - they instead convert GIFs to video then process them.

  In order to send gifs you need to do the same (convert the gif to an mp4 file) then use the following method:

```javascript

import { create, Client} from '@open-wa/wa-automate';

function start(client: Client) {
await client.sendVideoAsGif('xyz@c.us',[BASE64 Video FILE DATA],'some file.mp4', `Hello this is the caption`);
}

///IMPORTANT! Please make sure to point to your chrome installation and make sure your host has ffmpeg support
create({
  // For Mac:
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  // For Windows:
  // executablePath: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
}).then(client => start(client));

```

2. Sending a Giphy Media Link

  This is a convenience method to make it easier to send gifs from the website [GIPHY](https://giphy.com). You need to make sure you use a giphy media link as shown below.

```javascript

import { create, Client} from '@open-wa/wa-automate';

function start(client: Client) {
await client.sendGiphy('xyz@c.us','https://media.giphy.com/media/oYtVHSxngR3lC/giphy.gif', `Hello this is the caption`);
}

create({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
}).then(client => start(client));

```

## Sending Location

As of version 1.3.0 you can now send location!! You can't even do this in normal WA web interface.

You need to pass the following params:

- chat id: xxxxx@c.us
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

- chat id: xxxxx@c.us
- on: true or false

Note: You need to manually turn this off!!!

```javascript
//start '...typing'
await client.simulateTyping('xxxxx@c.us',true)
//wait 3 seconds

//stop '...typing'
await client.simulateTyping('xxxxx@c.us',false)
```

## Load profile pics from server

Generally, after the 20th chat in your WA, getChat methods do not retreive the chat picture. You need to get these from the WA servers. This is how you do it in v1.6.6^:

```javascript
client.getProfilePicFromServer('XXXXXXX-YYYYY@c.us')
```

## Forward Messages

As of version 1.5.1 you can now forward messages. This has been tested on most types of messages.

You need to pass the following params:

- chat to forward messages to : xxxxx@c.us
- messages: a single or array of message ids or message objects
- skipMyMessages: true or false, if true it will filter out messages sent by you from the list of messages, default false.

Note: You need to manually turn this off!!!

```javascript
//forward messages
await client.forwardMessages('xxxxx@c.us',[...],true)

//forward single message by id
await client.forwardMessages('xxxxx@c.us,"...",true)
```

## Reply to messages

As of version 1.6.17, you can now reply to specific messages.

```javascript
...
/**
   * @param to string chatid
   * @param content string reply text
   * @param quotedMsg string | Message the msg object or id to reply to.
   */

      await client.reply('xxxxx@c.us','This is the reply',message);
...
```

## Create group

As of v1.7.2 you can now create a new group. The first parameter is the group name, the second parameter is the contact ids to add as participants

```javascript
...
  client.createGroup('Cool new group','xxxxxxxxx@c.us') //you can also send an array of ids.
...
```

## Group participants [beta]

As of v1.7.0 you can now add, remove, promote & demote participants for groups. The first parameter is the chat id for the group. The second parameter is the number to which you are conducting the action.

```javascript
...
  client.addParticipant('XXXXXXX-YYYYYY@c.us','ZZZZZZZZZ@c.us')
  client.removeParticipant('XXXXXXX-YYYYYY@c.us','ZZZZZZZZZ@c.us')
  client.promoteParticipant('XXXXXXX-YYYYYY@c.us','ZZZZZZZZZ@c.us')
  client.demoteParticipant('XXXXXXX-YYYYYY@c.us','ZZZZZZZZZ@c.us')
...
```

## Group participant changes

As of version 1.5.6 you can now listen in on changes to group participants. You can react to when participants are added and removed.

```javascript
client.onParticipantsChanged("XXXXXXXX-YYYYYYYY@g.us", (participantChangedEvent:any) => console.log("participant changed for group", participantChangedEvent));

//participantChangedEvent returns
{
  by: 'XXXXXXXXXXX@c.us', //who performed the action
  action: 'remove',
  who: [ 'XXXXXXXXX@c.us' ] //all the numbers the action effects.
}
```

This solution can result in some false positives and misfires however a lot of effort has been made to mitigate this to a reasonable level. Best practice is to maintian a seperate registry of participants and go from that.

# Listen to Live Locations

As of version 1.7.21 you can now listen to live locations from a specific chat. You can see the liveLocation callback object [here](https://github.com/open-wa/wa-automate-nodejs/blob/752adb1cb1664044f9f53410e723421131ecd81f/src/api/model/chat.ts#L33) 

```javascript

client.onLiveLocation('XXXXXXX-YYYYY@c.us', (liveLocation) => {
  console.log('Someone moved',liveLocation)
})

```

## Listen to Read Receipts

As of version 1.5.3 you can now listen in on the read state (or technically acknowledgement state) of the messages. As of writing the limitation is presumed to be on sent messages.

The callback you set returns the whole raw message object.

Here's how you do it.

```javascript
client.onAck((msg:any) => console.log(msg.id.toString(),msg.body,msg.ack))
```

ack represents the acknoledgement state, of which there are 3.

```javascript
1 => Message Sent (1 tick)

2 => Message Received by Recipient (2 ticks)

3 => Message Read Receipt Confirmed (2 blue ticks)
```

Note: You won't get 3 if the recipient has read receipts off.

## Timing out an unpaired session

If you want to kill the process after a certain amount of seconds due to an unscanned code, you can now set the qrTimeout parameter in the configuration object. You can also use authTimeout if you want to wait only a certain period of time to wait for the session to connect to the phone.

```javascript
create({
  qrTimeout: 30, //kills the session if the QR code is not scanned within 30 seconds.
  authTimeout: 30 //kills the session if the session hasn't authentication 30 seconds (e.g If the session has the right credentials but the phone is off).
})
.then(client => start(client));
```

## Managing multiple sessions at once

With v1.2.4, you can now run multiple sessions of @open-wa/wa-automate in the same 'app'. This allows you to do interesting things for example:

1. Design and run automated tests for you WA bot.
2. Connect two or more WA numbers to a single (or multiple) message handler(s)
3. Use one client to make sure another one is alive by pinging it.

Please see demo/index.ts for a working example

NOTE: DO NOT CREATE TWO SESSIONS WITH THE SAME SESSIONID. DO NOT ALLOW SPACES AS SESSION ID.

```javascript
import { create, Client} from '@open-wa/wa-automate';

function start(client: Client) {
  ...
}

create().then(client => start(client));

create({
  sessionId:'another_session'
}).then(client => start(client));
```

You can then capture the QR Code for each session using the following event listener code:

```javascript
//events are fired with the ev namespace then the session Id. e.g "qr.another_session"
//You can however use the wildcard operator with the new event listener and capture the session Id as a parameter instead.
ev.on('qr.**', async (qrcode,sessionId) => {
  console.log("TCL: qrcode,sessioId", qrcode,sessionId)
  //base64 encoded qr code image
  const imageBuffer = Buffer.from(qrcode.replace('data:image/png;base64,',''), 'base64');
  fs.writeFileSync(`qr_code${sessionId?'_'+sessionId:''}.png`, imageBuffer);
});
```

## Manage page errors

Since this project is built upon puppeteer, you can access the [Puppeteer Page](https://pptr.dev/#?product=Puppeteer&version=v2.0.0&show=api-class-page) instance by referencing `client.getPage()`, and then therefore you can listen to any errors on the page like so:

```javascript
client.getPage().on('error', _=>{
...
}
```

## Custom Set Up

With v.1.2.6 you can now forward custom arguments through the library to puppeteer. This includes any overrides to the pupeteer config and a custom useragent.

Note: If you want to change the user agent but leave the puppeteer config the same then just pass {} to the pupeteer config. Also if you don't want to use a custom session then just use 'session' for the first argument.

As with session name segment, these are all optional parameters.

Why should you use a custom user agent?

Users of these WA injection libraries should use different user agents (preferably copy the one you have one your own pc) because then it makes it harder for WA to break the mecahnism to restart sessions for this library.

Setting up your client in ```headless:false``` mode ensures you can easily visually debug any issues.

Example:

```javascript
import { create, Client} from '@open-wa/wa-automate';

function start(client: Client) {
  ...
}

create().then(client => start(client));

//1st argument is the session name
//2nd argument is the puppeteer config override
//3rd argument is the user agent override

create({
  headless: false,
  customUserAgent: 'some custom user agent'
})
.then(client => start(client));
```

## Best Practice

Since this is not an officially sanctioned solution it is temperamental to say the least. Here are some best practices:

1. Keep the session alive
2. Offload most work off of your @open-wa/wa-automate setup (i.e forward all events to a pubsub or something)
3. Keep the phone nearby just in case you need to reauthenticate
4. Use a chrome instance instead of the default chromium instance
5. Use headless: false for easy & quick visual debugging
6. Implement the unread messages functionality on creation of a session so you don't miss any messages upon any downtime.
7. Implement a [promise-queue](https://github.com/sindresorhus/p-queue)
8. Use a unique and valid custom user-agent
9. ```await``` all @open-wa/wa-automate methods just in case
10. Do not run your s@open-wa/wa-automate instance on a Windows machine.
11. Always [kill the session safely](https://github.com/open-wa/wa-automate-nodejs#kill-the-session) upon error or SIGINT.
12. Regularly restart your process to manage memory consumption
13. If memory leaks continue to be an issue then use `cacheEnabled:false` in the config to disable the cache on the page.

```javascript
import { create, Client} from '@open-wa/wa-automate';
const { default: PQueue } = require("p-queue");

const queue = new PQueue({
  concurrency: 4,
  autoStart:false
   });

const proc = async message => {
  //do something with the message here
    console.log(message)
    return true;
}

const processMessage = message => queue.add(()=>proc(message));

async function start(client: Client) {
  const unreadMessages = await client.getAllUnreadMessages();
  unreadMessages.forEach(processMessage)
  ...
  await client.onMessage(processMessage);
  queue.start();
}

create().then(client => start(client));

//1st argument is the session name
//2nd argument is the puppeteer config override
//3rd argument is the user agent override

create({
  // For Mac:
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  // For Windows:
  // executablePath: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  headless: false,
  autoRefresh:true,
  cacheEnabled:false,
  customUserAgent: 'some custom user agent'
})
.then(client => start(client));
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
