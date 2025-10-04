# Interface: BaseChat

## Extended by

- [`SingleChat`](/reference/api/model/chat/interfaces/SingleChat.md)
- [`GroupChat`](/reference/api/model/chat/interfaces/GroupChat.md)

## Properties

### ack?

> `optional` **ack**: `any`

***

### archive

> **archive**: `boolean`

***

### canSend?

> `optional` **canSend**: `boolean`

Whether your host account is able to send messages to this chat

***

### changeNumberNewJid

> **changeNumberNewJid**: `any`

***

### changeNumberOldJid

> **changeNumberOldJid**: `any`

***

### contact

> **contact**: [`Contact`](/reference/api/model/contact/interfaces/Contact.md)

The contact related to this chat

***

### formattedTitle?

> `optional` **formattedTitle**: `string`

The title of the chat

***

### groupMetadata

> **groupMetadata**: [`GroupMetadata`](/reference/api/model/group-metadata/interfaces/GroupMetadata.md)

Group metadata for this chat

***

### isAnnounceGrpRestrict

> **isAnnounceGrpRestrict**: `any`

If the chat is a group chat is restricted

***

### ~~isOnline?~~

> `optional` **isOnline**: `any`

#### Deprecated

This is unreliable. Use the method [`isChatOnline`](https://open-wa.github.io/wa-automate-nodejs/classes/client.html#ischatonline) instead.

***

### isReadOnly

> **isReadOnly**: `boolean`

Whether the chat is a group chat and the group is restricted

***

### kind

> **kind**: `string`

***

### labels

> **labels**: `any`

The labels attached to this chat.

***

### lastReceivedKey

> **lastReceivedKey**: `any`

The ID of the last message received in this chat

***

### ~~lastSeen?~~

> `optional` **lastSeen**: `any`

#### Deprecated

This is unreliable. Use the method [`getLastSeen`](https://open-wa.github.io/wa-automate-nodejs/classes/client.html#getlastseen) instead.

***

### modifyTag

> **modifyTag**: `number`

***

### msgs

> **msgs**: `any`

The messages in the chat

***

### muteExpiration

> **muteExpiration**: `number`

The expiration timestamp of the chat mute

***

### name

> **name**: `string`

The name of the chat

***

### notSpam

> **notSpam**: `boolean`

Whether the chat is marked as spam

***

### pendingMsgs

> **pendingMsgs**: `boolean`

Messages that are pending to be sent

***

### pic?

> `optional` **pic**: `string`

URL of the chat picture if available

***

### pin

> **pin**: `number`

Whether the chat is pinned

***

### presence

> **presence**: `any`

The presence state of the chat participant

***

### t

> **t**: `number`

The timestamp of the last interaction in the chat

***

### unreadCount

> **unreadCount**: `number`

The number of undread messages in this chat
