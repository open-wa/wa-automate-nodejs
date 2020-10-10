# Licensed Features

## Features

### Insiders Features

open-wa is at the forefront of open source WA developmentand runs on donations from backers. To encourage donations, backers have access to exclusive features with an [Insiders Program license key](https://gumroad.com/l/BTMt).


| Function                          | Description |
| --------------------------------- | ----------- |
| [[setGroupToAdminsOnly]]                  | Changes group setting so only admins can send messages            |
| [[setGroupEditToAdminsOnly]]                   | Changes group setting so only admins can edit group info            |
| [[setGroupTitle]]                   | Changes the group title           |
| [[setGroupDescription]]                   | Changes the group description         |
| [[setProfilePic]]                   | Change the host phones profile picture           |
| [[onRemovedFromGroup]]                   | Detect when host phone is removed from a group           |
| [[onContactAdded]]                   | Detect when host phone adds a new contact           |
| [[getCommonGroups]]                   | Retreive all common groups between the host device and a conttact           |
| [[clearAllChats]]                   | Easily clear memory by clearing all chats of all messages on the host device and WA Web           |
| [[sendReplyWithMentions]]                   | Send a reply to a message with mentions           |
| [[onChatOpened]]                   | Detect when a chat is selected in the UI           |
| [[onChatState]]                   | Detect when someone is typing or recording a voicenote           |
| [[getStickerDecryptable]]                   | Convert a normal sticker message (results in blank image) to one that is able to grab and decrypt the actual sticker           |
| [[forceStaleMediaUpdate]]                   | If a media message is old, the file url will result in a `404` error. forceStaleMediaUpdate forces the mobile app to reupload the file.           |
| [[tagEveryone]]                   | Send a group message with everyone tagged.           |

### Sending messages to non-contact numbers

The ability to send messages to non-contact numbers is restricted in this library to prevent spam.

There are 3 ways to start a chat with a new number:

1. [WA Links](https://faq.whatsapp.com/en/26000030/)
  
      You can send a special link to the person you want to start a chat with. This will open a conversation with your number on their phone. This way you can insure that they have explicitly started a conversation with you.
2. [WA Buttons](https://github.com/smashah/whatsapp-button?ref=open-wa-nodejs)

      You can add this button to your website which, when clicked, will open a chat with you in the same way as above.
3. [With a Restricted License Key](#how-to-get-a-license-key)

     In order to unlock the functionality to send texts to unknown numbers through @open-wa/wa-automate itself, you will need a [Restricted License key](https://gumroad.com/l/BTMt?tier=1%20Restricted%20License%20Key).

     One License Key is valid for one number. Each License Key for this is £10 per month. [Instructions below.](#how-to-get-a-license-key)

### Story Keys

After a lot of effort, ability to send text, image and video stories is available exclusively in this library.

## How to get a License Key

1. Go to [Gumroad](https://gum.co/BTMt?tier=1%20Restricted%20License%20Key).
2. Click on the type of license you require.
3. In the checkout, ***enter the host account number you want to assign to the License Key (the one you will be using with open-wa, not your personal number)*** , along with the use case for this functionality and your github username. Please note, with this new system you'll only be able to change the number once.
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

## Keys

| Name | link | Description
| --------------------------------- | ----------- |  ----------- |
| Insiders | [LINK](https://gum.co/BTMt?tier=Insiders%20Program) | [All Insiders Features](https://open-wa.github.io/wa-automate-nodejs/pages/The%20Client/licensed-features.html#insiders-features)
| Restricted | [LINK](https://gumroad.com/l/BTMt?tier=1%20Restricted%20License%20Key) | Send messages to non-contacts
| Text Story | [LINK](https://gum.co/BTMt?tier=1%20Text%20Story%20License%20Key) | Send Text Stories
| Image Story | [LINK](https://gum.co/BTMt?tier=1%20Image%20Story%20License%20Key) | Send Image Stories
| Video Story | [LINK](https://gum.co/BTMt?tier=1%20Video%20Story%20License%20Key) | Send Video Stories
| Premium | [LINK](https://gum.co/BTMt?tier=1%20Premium%20License%20Key) | All the above + [Send Custom Products](https://open-wa.github.io/wa-automate-nodejs/classes/client.html#sendcustomproduct)

All keys include access to all insider's features. You do not need a Premium Key to send messages to non-contacts.

## Troubleshooting

If the license key is showing up as invalid, there may be an issue with your host account number you entered in the checkout form. In some countries, the host account number is different from the actual number (for example in Brazil, an extra 9 is added). If you're unsure about your host account number then use the following code:

```javascript
const hostAccountNumber = await client.getHostNumber();
console.log('Host account', hostAccountNumber);
```

If it's different from what you've entered in the checkout form, [please fill and send this email.](mailto:shah@idk.uno?subject=OPENWA%3A%20WRONG%20HOST%20ACC%20NUMBER&body=email%20used%20to%20buy%20key%3A%0D%0Alicense%20key%3A%0D%0Acorrect%20host%20account%20number%3A%0D%0A)

If you are having issues where your license key shows as valid in the console, but the features continually return `false` this may be due to a NodeJS issue relating to the time on your machine. To fix this, make sure your machine's time is correct.

## Switching your host account

If your development and production host accounts are different, then you can enter the development host account number in the form and when you're ready to your production host account, [fill and send this email.](mailto:shah@idk.uno?subject=OPENWA%3A%PRODUCTION%20HOST%20ACC%20NUMBER&body=email%20used%20to%20buy%20key%3A%0D%0Alicense%20key%3A%0D%0Acorrect%20host%20account%20number%3A%0D%0A)

## Notes

- One license key is valid for one host account number.
- You can change the number assigned to a specific License Key once.
- In order to cancel your License Key, simply stop your membership.
- You can use multiple license keys for each host number.
- Apart from adding your licenseKey to your config, you will need to change nothing else in your code.
- An added benefit for members is priority on issues.
- License Key requests may be rejected.
- All code you will receive from the license server is closed-sourced and is under the same license as this project. You will not be able to read it. It is not transferrable to another number or another project.
- All keys provide access to Insiders Features.
- No Refunds unless you have chosen the incorrect license upon checkout. Refund requests need to take place after the correct license is purchased. [Once the correct license is purchased please email me for a refund.](mailto:shah@idk.uno?subject=OPENWA%3A%LICENSE%3A%CORRECTION)
- [Volume licenses are available upon request.](mailto:shah@idk.uno?subject=OPENWA%3A%VOLUME%%20LICENSE)
- [Referral links are available upon request.](mailto:shah@idk.uno?subject=OPENWA%3A%Referral%%20Scheme)