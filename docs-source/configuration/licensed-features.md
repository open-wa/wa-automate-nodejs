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

### Restricted Features

The ability to send messages to non-contact numbers is restricted in this library to prevent spam.

There are 3 ways to start a chat with a new number:

1. [WA Links](https://faq.whatsapp.com/en/26000030/)
  
      You can send a special link to the person you want to start a chat with. This will open a conversation with your number on their phone. This way you can insure that they have explicitly started a conversation with you.
2. [WA Buttons](https://github.com/smashah/whatsapp-button?ref=open-wa-nodejs)

      You can add this button to your website which, when clicked, will open a chat with you in the same way as above.
3. [With a License Key](#how-to-get-a-license-key)

     In order to unlock the functionality to send texts to unknown numbers through @open-wa/wa-automate itself, you will need a License key.

     One License Key is valid for one number. Each License Key for this is £10 per month. [Instructions below.](#how-to-get-a-license-key)

### Story Keys

After a lot of effort, ability to send text, image and video stories is available exclusively in this library.

## How to get a License Key

1. Go to [Gumroad](https://gumroad.com/l/BTMt).
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

## Troubleshooting

If the license key is showing up as invalid, there may be an issue with your host account number you entered in the checkout form. In some countries, the host account number is different from the actual number (for example in Brazil, an extra 9 is added). If you're unsure about your host account number then use the following code:

```javascript
const hostAccountNumber = await client.getHostNumber();
console.log('Host account', hostAccountNumber);
```

If it's different from what you've entered in the checkout form, [please fill and send this email.](mailto:shah@idk.uno?subject=OPENWA%3A%20WRONG%20HOST%20ACC%20NUMBER&body=email%20used%20to%20buy%20key%3A%0D%0Alicense%20key%3A%0D%0Acorrect%20host%20account%20number%3A%0D%0A)

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
- [Volume licenses are available upon request.](mailto:shah@idk.uno?subject=OPENWA%3A%VOLUME%%20LICENSE)
- [Referral links are available upon request.](mailto:shah@idk.uno?subject=OPENWA%3A%Referral%%20Scheme)