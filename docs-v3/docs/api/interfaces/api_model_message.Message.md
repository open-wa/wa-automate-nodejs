---
id: "api_model_message.Message"
title: "Interface: Message"
sidebar_label: "Message"
custom_edit_url: null
---

[api/model/message](/api/modules/api_model_message.md).Message

## Properties

### ack

• **ack**: [`MessageAck`](/api/enums/api_model_message.MessageAck.md)

The acknolwedgement state of a message [MessageAck](/api/enums/api_model_message.MessageAck.md)

___

### author

• **author**: `string`

___

### body

• **body**: `string`

The body of the message. If the message type is `chat` , `body` will be the text of the chat. If the message type is some sort of media, then this body will be the thumbnail of the media.

___

### broadcast

• **broadcast**: `boolean`

If the message is sent as a broadcast

___

### buttons

• `Optional` **buttons**: [`Button`](/api/interfaces/api_model_button.Button.md)[]

Buttons associated with the message

___

### caption

• **caption**: `string`

If the message is of a media type, it may also have a caption

___

### chat

• **chat**: [`Chat`](/api/types/api_model_chat.Chat.md)

The chat object

___

### chatId

• **chatId**: [`ChatId`](/api/types/api_model_aliases.ChatId.md)

___

### clientUrl

• **clientUrl**: `string`

**`Deprecated`**

Ironically, you should be using `deprecatedMms3Url` instead

___

### cloudUrl

• `Optional` **cloudUrl**: `string`

The URL of the file after being uploaded to the cloud using a cloud upload message preprocessor.

___

### content

• **content**: `string`

___

### ctwaContext

• `Optional` **ctwaContext**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `isSuspiciousLink` | `boolean` |
| `mediaType` | `number` |
| `sourceUrl` | `string` |
| `thumbnail` | `string` |

___

### deprecatedMms3Url

• **deprecatedMms3Url**: `string`

___

### duration

• `Optional` **duration**: `string` \| `number`

The length of the media in the message, if it exists.

___

### filePath

• `Optional` **filePath**: `string`

When `config.messagePreprocessor: "AUTO_DECRYPT_SAVE"` is set, media is decrypted and saved on disk in a folder called media relative to the current working directory.

This is the filePath of the decrypted file.

___

### filehash

• `Optional` **filehash**: `string`

Used to checking the integrity of the decrypted media.

___

### filename

• `Optional` **filename**: `string`

The given filename of the file

___

### from

• **from**: [`ChatId`](/api/types/api_model_aliases.ChatId.md)

The chat from which the message was sent

___

### fromMe

• **fromMe**: `boolean`

If the message is from the host account

___

### id

• **id**: [`MessageId`](/api/types/api_model_aliases.MessageId.md)

The id of the message. Consists of the Chat ID and a unique string.

Example:

```
false_447123456789@c.us_7D914FEA78BE10277743F4B785045C37
```

___

### invis

• **invis**: `boolean`

___

### isAnimated

• **isAnimated**: `boolean`

___

### isForwarded

• **isForwarded**: `boolean`

If the message has been forwarded

___

### isGroupJoinRequest

• `Optional` **isGroupJoinRequest**: [`GroupChatId`](/api/types/api_model_aliases.GroupChatId.md)

When a user requests to join a group wihtin a community the request is received by the host as a message. This boolean will allow you to easily determine if the incoming message is a request to join a group.

If this is `true` then you need to determine within your own code whether or not to accept the user to the group which is indicated with `quotedRemoteJid` using `addParticipant`.

___

### isGroupMsg

• **isGroupMsg**: `boolean`

___

### isMMS

• **isMMS**: `boolean`

___

### isMedia

• **isMedia**: `boolean`

___

### isNewMsg

• **isNewMsg**: `boolean`

___

### isNotification

• **isNotification**: `boolean`

___

### isPSA

• **isPSA**: `boolean`

___

### isQuotedMsgAvailable

• **isQuotedMsgAvailable**: `boolean`

If this message is quoting (replying to) another message

___

### isViewOnce

• **isViewOnce**: `boolean`

Is the message a "view once" message

___

### labels

• **labels**: `string`[]

The labels associated with the message (used with business accounts)

___

### lat

• `Optional` **lat**: `string`

The latitude of a location message

___

### list

• `Optional` **list**: `Object`

The list associated with the list message

#### Type declaration

| Name | Type |
| :------ | :------ |
| `buttonText` | `string` |
| `description` | `string` |
| `sections` | [`Section`](/api/interfaces/api_model_button.Section.md)[] |
| `title` | `string` |

___

### listResponse

• `Optional` **listResponse**: [`Row`](/api/interfaces/api_model_button.Row.md)

List response associated with the message

___

### lng

• `Optional` **lng**: `string`

The longitude of a location message

___

### loc

• `Optional` **loc**: `string`

The text associated with a location message

___

### mId

• **mId**: `string`

The unique segment of the message id.

Example:

```
7D914FEA78BE10277743F4B785045C37
```

___

### mediaData

• **mediaData**: `unknown`

___

### mentionedJidList

• **mentionedJidList**: [`ContactId`](/api/types/api_model_aliases.ContactId.md)[]

An array of all mentioned numbers in this message.

___

### mimetype

• `Optional` **mimetype**: `string`

___

### notifyName

• **notifyName**: `string`

___

### pollOptions

• `Optional` **pollOptions**: [`PollOption`](/api/interfaces/api_model_message.PollOption.md)[]

The options of a poll

___

### quoteMap

• **quoteMap**: [`QuoteMap`](/api/interfaces/api_model_message.QuoteMap.md)

Use this to traverse the quote chain.

___

### quotedMsg

• `Optional` **quotedMsg**: [`Message`](/api/interfaces/api_model_message.Message.md)

___

### quotedMsgObj

• `Optional` **quotedMsgObj**: [`Message`](/api/interfaces/api_model_message.Message.md)

___

### quotedParentGroupJid

• `Optional` **quotedParentGroupJid**: [`GroupChatId`](/api/types/api_model_aliases.GroupChatId.md)

The parent group ID (community ID - communities are just groups made up of other groups) of the group represented by `quotedRemoteJid`

___

### quotedRemoteJid

• `Optional` **quotedRemoteJid**: `string`

The ID of the quoted group. Usually present when a user is requesting to join a group.

___

### reactionByMe

• `Optional` **reactionByMe**: [`ReactionSender`](/api/interfaces/api_model_message.ReactionSender.md)

The reaction of the host account to this message

___

### reactions

• **reactions**: { `aggregateEmoji`: `string` ; `hasReactionByMe`: `boolean` ; `id`: `string` ; `senders`: [`ReactionSender`](/api/interfaces/api_model_message.ReactionSender.md)[]  }[]

___

### recvFresh

• **recvFresh**: `boolean`

___

### selectedButtonId

• **selectedButtonId**: `string`

The ID of the selected button

___

### self

• **self**: ``"in"`` \| ``"out"``

Indicates whether the message is coming into the session or going out of the session. You can have a message sent by the host account show as `in` when the message was sent from another
session or from the host account device itself.

___

### sender

• **sender**: [`Contact`](/api/interfaces/api_model_contact.Contact.md)

The contact object of the account that sent the message

___

### senderId

• `Optional` **senderId**: `string`

The ID of the message sender

___

### shareDuration

• **shareDuration**: `number`

___

### star

• **star**: `boolean`

___

### stickerAuthor

• `Optional` **stickerAuthor**: `string`

___

### stickerPack

• `Optional` **stickerPack**: `string`

___

### t

• **t**: `number`

The timestamp of the message

___

### text

• **text**: `string`

a convenient way to get the main text content from a message.

___

### timestamp

• **timestamp**: `number`

the timestanmp of the message

___

### to

• **to**: [`ChatId`](/api/types/api_model_aliases.ChatId.md)

The chat id to which the message is being sent

___

### type

• **type**: [`MessageTypes`](/api/enums/api_model_message.MessageTypes.md)

The type of the message, see [MessageTypes](/api/enums/api_model_message.MessageTypes.md)
