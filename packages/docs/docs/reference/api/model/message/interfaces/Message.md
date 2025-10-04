# Interface: Message

## Properties

### ack

> **ack**: [`MessageAck`](/reference/api/model/message/enumerations/MessageAck.md)

The acknolwedgement state of a message [[MessageAck]]

***

### author

> **author**: `string`

***

### body

> **body**: `string`

The body of the message. If the message type is `chat` , `body` will be the text of the chat. If the message type is some sort of media, then this body will be the thumbnail of the media.

***

### broadcast

> **broadcast**: `boolean`

If the message is sent as a broadcast

***

### buttons?

> `optional` **buttons**: [`Button`](/reference/api/model/button/interfaces/Button.md)[]

Buttons associated with the message

***

### caption

> **caption**: `string`

If the message is of a media type, it may also have a caption

***

### chat

> **chat**: [`Chat`](/reference/api/model/chat/type-aliases/Chat.md)

The chat object

***

### chatId

> **chatId**: [`ChatId`](/reference/api/model/aliases/type-aliases/ChatId.md)

***

### ~~clientUrl~~

> **clientUrl**: `string`

#### Deprecated

Ironically, you should be using `deprecatedMms3Url` instead

***

### cloudUrl?

> `optional` **cloudUrl**: `string`

The URL of the file after being uploaded to the cloud using a cloud upload message preprocessor.

***

### content

> **content**: `string`

***

### ctwaContext?

> `optional` **ctwaContext**: `object`

#### isSuspiciousLink

> **isSuspiciousLink**: `boolean`

#### mediaType

> **mediaType**: `number`

#### sourceUrl

> **sourceUrl**: `string`

#### thumbnail

> **thumbnail**: `string`

***

### deprecatedMms3Url

> **deprecatedMms3Url**: `string`

***

### device

> **device**: `number`

The device ID of the device that sent the message. This is only present if the message was sent from host account-linked session. This is useful for determining if a message was sent from a different mobile device (note that whenever a device) or a desktop session.

Note: This will emit a number for the current controlled session also but the only way to know if the number represents the current session is by checking `local` (it will be `true` if the message was sent from the current session).

If the device ID is `0` then the message was sent from the "root" host account device.

This might be undefined for incoming messages.

***

### duration?

> `optional` **duration**: `string` \| `number`

The length of the media in the message, if it exists.

***

### filePath?

> `optional` **filePath**: `string`

When `config.messagePreprocessor: "AUTO_DECRYPT_SAVE"` is set, media is decrypted and saved on disk in a folder called media relative to the current working directory.

This is the filePath of the decrypted file.

***

### filehash?

> `optional` **filehash**: `string`

Used to checking the integrity of the decrypted media.

***

### filename?

> `optional` **filename**: `string`

The given filename of the file

***

### from

> **from**: [`ChatId`](/reference/api/model/aliases/type-aliases/ChatId.md)

The chat from which the message was sent

***

### fromMe

> **fromMe**: `boolean`

If the message is from the host account

***

### id

> **id**: [`MessageId`](/reference/api/model/aliases/type-aliases/MessageId.md)

The id of the message. Consists of the Chat ID and a unique string.

Example:

```
false_447123456789@c.us_7D914FEA78BE10277743F4B785045C37
```

***

### invis

> **invis**: `boolean`

***

### isAnimated

> **isAnimated**: `boolean`

***

### isForwarded

> **isForwarded**: `boolean`

If the message has been forwarded

***

### isGroupJoinRequest?

> `optional` **isGroupJoinRequest**: [`GroupChatId`](/reference/api/model/aliases/type-aliases/GroupChatId.md)

When a user requests to join a group wihtin a community the request is received by the host as a message. This boolean will allow you to easily determine if the incoming message is a request to join a group.

If this is `true` then you need to determine within your own code whether or not to accept the user to the group which is indicated with `quotedRemoteJid` using `addParticipant`.

***

### isGroupMsg

> **isGroupMsg**: `boolean`

***

### isMMS

> **isMMS**: `boolean`

***

### isMedia

> **isMedia**: `boolean`

***

### isNewMsg

> **isNewMsg**: `boolean`

***

### isNotification

> **isNotification**: `boolean`

***

### isPSA

> **isPSA**: `boolean`

***

### isQuotedMsgAvailable

> **isQuotedMsgAvailable**: `boolean`

If this message is quoting (replying to) another message

***

### isViewOnce

> **isViewOnce**: `boolean`

Is the message a "view once" message

***

### labels

> **labels**: `string`[]

The labels associated with the message (used with business accounts)

***

### lat?

> `optional` **lat**: `string`

The latitude of a location message

***

### list?

> `optional` **list**: `object`

The list associated with the list message

#### buttonText

> **buttonText**: `string`

#### description

> **description**: `string`

#### sections

> **sections**: [`Section`](/reference/api/model/button/interfaces/Section.md)[]

#### title

> **title**: `string`

***

### listResponse?

> `optional` **listResponse**: [`Row`](/reference/api/model/button/interfaces/Row.md)

List response associated with the message

***

### lng?

> `optional` **lng**: `string`

The longitude of a location message

***

### loc?

> `optional` **loc**: `string`

The text associated with a location message

***

### local

> **local**: `boolean`

If the message was sent from this controlled session this will be `true`. This is useful for determining if a message was sent from a different mobile device (note that whenever a device) or a desktop session.

***

### mId

> **mId**: `string`

The unique segment of the message id.

Example:

```
7D914FEA78BE10277743F4B785045C37
```

***

### mediaData

> **mediaData**: `unknown`

***

### mentionedJidList

> **mentionedJidList**: [`ContactId`](/reference/api/model/aliases/type-aliases/ContactId.md)[]

An array of all mentioned numbers in this message.

***

### mimetype?

> `optional` **mimetype**: `string`

***

### notifyName

> **notifyName**: `string`

***

### pollOptions?

> `optional` **pollOptions**: [`PollOption`](/reference/api/model/message/interfaces/PollOption.md)[]

The options of a poll

***

### quoteMap

> **quoteMap**: [`QuoteMap`](/reference/api/model/message/interfaces/QuoteMap.md)

Use this to traverse the quote chain.

***

### quotedMsg?

> `optional` **quotedMsg**: [`Message`](/reference/api/model/message/interfaces/Message.md)

***

### quotedMsgObj?

> `optional` **quotedMsgObj**: [`Message`](/reference/api/model/message/interfaces/Message.md)

***

### quotedParentGroupJid?

> `optional` **quotedParentGroupJid**: [`GroupChatId`](/reference/api/model/aliases/type-aliases/GroupChatId.md)

The parent group ID (community ID - communities are just groups made up of other groups) of the group represented by `quotedRemoteJid`

***

### quotedRemoteJid?

> `optional` **quotedRemoteJid**: `string`

The ID of the quoted group. Usually present when a user is requesting to join a group.

***

### reactionByMe?

> `optional` **reactionByMe**: [`ReactionSender`](/reference/api/model/message/interfaces/ReactionSender.md)

The reaction of the host account to this message

***

### reactions

> **reactions**: `object`[]

***

### recvFresh

> **recvFresh**: `boolean`

***

### selectedButtonId

> **selectedButtonId**: `string`

The ID of the selected button

***

### self

> **self**: `"in"` \| `"out"`

Indicates whether the message is coming into the session or going out of the session. You can have a message sent by the host account show as `in` when the message was sent from another
session or from the host account device itself.

***

### sender

> **sender**: [`Contact`](/reference/api/model/contact/interfaces/Contact.md)

The contact object of the account that sent the message

***

### senderId?

> `optional` **senderId**: `string`

The ID of the message sender

***

### shareDuration

> **shareDuration**: `number`

***

### star

> **star**: `boolean`

***

### stickerAuthor?

> `optional` **stickerAuthor**: `string`

***

### stickerPack?

> `optional` **stickerPack**: `string`

***

### t

> **t**: `number`

The timestamp of the message

***

### text

> **text**: `string`

a convenient way to get the main text content from a message.

***

### timestamp

> **timestamp**: `number`

the timestanmp of the message

***

### to

> **to**: [`ChatId`](/reference/api/model/aliases/type-aliases/ChatId.md)

The chat id to which the message is being sent

***

### type

> **type**: [`MessageTypes`](/reference/api/model/message/enumerations/MessageTypes.md)

The type of the message, see [[MessageTypes]]
