# Interface: GroupChat

## Extends

- [`BaseChat`](/reference/api/model/chat/interfaces/BaseChat.md)

## Properties

### ack?

> `optional` **ack**: `any`

#### Inherited from

[`BaseChat`](/reference/api/model/chat/interfaces/BaseChat.md).[`ack`](/reference/api/model/chat/interfaces/BaseChat.md#ack)

***

### archive

> **archive**: `boolean`

#### Inherited from

[`BaseChat`](/reference/api/model/chat/interfaces/BaseChat.md).[`archive`](/reference/api/model/chat/interfaces/BaseChat.md#archive)

***

### canSend?

> `optional` **canSend**: `boolean`

Whether your host account is able to send messages to this chat

#### Inherited from

[`BaseChat`](/reference/api/model/chat/interfaces/BaseChat.md).[`canSend`](/reference/api/model/chat/interfaces/BaseChat.md#cansend)

***

### changeNumberNewJid

> **changeNumberNewJid**: `any`

#### Inherited from

[`BaseChat`](/reference/api/model/chat/interfaces/BaseChat.md).[`changeNumberNewJid`](/reference/api/model/chat/interfaces/BaseChat.md#changenumbernewjid)

***

### changeNumberOldJid

> **changeNumberOldJid**: `any`

#### Inherited from

[`BaseChat`](/reference/api/model/chat/interfaces/BaseChat.md).[`changeNumberOldJid`](/reference/api/model/chat/interfaces/BaseChat.md#changenumberoldjid)

***

### contact

> **contact**: [`Contact`](/reference/api/model/contact/interfaces/Contact.md)

The contact related to this chat

#### Inherited from

[`BaseChat`](/reference/api/model/chat/interfaces/BaseChat.md).[`contact`](/reference/api/model/chat/interfaces/BaseChat.md#contact)

***

### formattedTitle?

> `optional` **formattedTitle**: `string`

The title of the chat

#### Inherited from

[`BaseChat`](/reference/api/model/chat/interfaces/BaseChat.md).[`formattedTitle`](/reference/api/model/chat/interfaces/BaseChat.md#formattedtitle)

***

### groupMetadata

> **groupMetadata**: [`GroupMetadata`](/reference/api/model/group-metadata/interfaces/GroupMetadata.md)

Group metadata for this chat

#### Inherited from

[`BaseChat`](/reference/api/model/chat/interfaces/BaseChat.md).[`groupMetadata`](/reference/api/model/chat/interfaces/BaseChat.md#groupmetadata)

***

### groupType

> **groupType**: `"COMMUNITY"` \| `"DEFAULT"` \| `"LINKED_ANNOUNCEMENT_GROUP"` \| `"LINKED_GENERAL_GROUP"` \| `"LINKED_SUBGROUP"`

The type of the group

***

### id

> **id**: [`GroupChatId`](/reference/api/model/aliases/type-aliases/GroupChatId.md)

The id of the chat

***

### isAnnounceGrpRestrict

> **isAnnounceGrpRestrict**: `any`

If the chat is a group chat is restricted

#### Inherited from

[`BaseChat`](/reference/api/model/chat/interfaces/BaseChat.md).[`isAnnounceGrpRestrict`](/reference/api/model/chat/interfaces/BaseChat.md#isannouncegrprestrict)

***

### isGroup

> **isGroup**: `true`

Whether the chat is a group chat

***

### ~~isOnline?~~

> `optional` **isOnline**: `any`

#### Deprecated

This is unreliable. Use the method [`isChatOnline`](https://open-wa.github.io/wa-automate-nodejs/classes/client.html#ischatonline) instead.

#### Inherited from

[`BaseChat`](/reference/api/model/chat/interfaces/BaseChat.md).[`isOnline`](/reference/api/model/chat/interfaces/BaseChat.md#isonline)

***

### isReadOnly

> **isReadOnly**: `boolean`

Whether the chat is a group chat and the group is restricted

#### Inherited from

[`BaseChat`](/reference/api/model/chat/interfaces/BaseChat.md).[`isReadOnly`](/reference/api/model/chat/interfaces/BaseChat.md#isreadonly)

***

### kind

> **kind**: `string`

#### Inherited from

[`BaseChat`](/reference/api/model/chat/interfaces/BaseChat.md).[`kind`](/reference/api/model/chat/interfaces/BaseChat.md#kind)

***

### labels

> **labels**: `any`

The labels attached to this chat.

#### Inherited from

[`BaseChat`](/reference/api/model/chat/interfaces/BaseChat.md).[`labels`](/reference/api/model/chat/interfaces/BaseChat.md#labels)

***

### lastReceivedKey

> **lastReceivedKey**: `any`

The ID of the last message received in this chat

#### Inherited from

[`BaseChat`](/reference/api/model/chat/interfaces/BaseChat.md).[`lastReceivedKey`](/reference/api/model/chat/interfaces/BaseChat.md#lastreceivedkey)

***

### ~~lastSeen?~~

> `optional` **lastSeen**: `any`

#### Deprecated

This is unreliable. Use the method [`getLastSeen`](https://open-wa.github.io/wa-automate-nodejs/classes/client.html#getlastseen) instead.

#### Inherited from

[`BaseChat`](/reference/api/model/chat/interfaces/BaseChat.md).[`lastSeen`](/reference/api/model/chat/interfaces/BaseChat.md#lastseen)

***

### modifyTag

> **modifyTag**: `number`

#### Inherited from

[`BaseChat`](/reference/api/model/chat/interfaces/BaseChat.md).[`modifyTag`](/reference/api/model/chat/interfaces/BaseChat.md#modifytag)

***

### msgs

> **msgs**: `any`

The messages in the chat

#### Inherited from

[`BaseChat`](/reference/api/model/chat/interfaces/BaseChat.md).[`msgs`](/reference/api/model/chat/interfaces/BaseChat.md#msgs)

***

### muteExpiration

> **muteExpiration**: `number`

The expiration timestamp of the chat mute

#### Inherited from

[`BaseChat`](/reference/api/model/chat/interfaces/BaseChat.md).[`muteExpiration`](/reference/api/model/chat/interfaces/BaseChat.md#muteexpiration)

***

### name

> **name**: `string`

The name of the chat

#### Inherited from

[`BaseChat`](/reference/api/model/chat/interfaces/BaseChat.md).[`name`](/reference/api/model/chat/interfaces/BaseChat.md#name)

***

### notSpam

> **notSpam**: `boolean`

Whether the chat is marked as spam

#### Inherited from

[`BaseChat`](/reference/api/model/chat/interfaces/BaseChat.md).[`notSpam`](/reference/api/model/chat/interfaces/BaseChat.md#notspam)

***

### pendingMsgs

> **pendingMsgs**: `boolean`

Messages that are pending to be sent

#### Inherited from

[`BaseChat`](/reference/api/model/chat/interfaces/BaseChat.md).[`pendingMsgs`](/reference/api/model/chat/interfaces/BaseChat.md#pendingmsgs)

***

### pic?

> `optional` **pic**: `string`

URL of the chat picture if available

#### Inherited from

[`BaseChat`](/reference/api/model/chat/interfaces/BaseChat.md).[`pic`](/reference/api/model/chat/interfaces/BaseChat.md#pic)

***

### pin

> **pin**: `number`

Whether the chat is pinned

#### Inherited from

[`BaseChat`](/reference/api/model/chat/interfaces/BaseChat.md).[`pin`](/reference/api/model/chat/interfaces/BaseChat.md#pin)

***

### presence

> **presence**: `any`

The presence state of the chat participant

#### Inherited from

[`BaseChat`](/reference/api/model/chat/interfaces/BaseChat.md).[`presence`](/reference/api/model/chat/interfaces/BaseChat.md#presence)

***

### t

> **t**: `number`

The timestamp of the last interaction in the chat

#### Inherited from

[`BaseChat`](/reference/api/model/chat/interfaces/BaseChat.md).[`t`](/reference/api/model/chat/interfaces/BaseChat.md#t)

***

### unreadCount

> **unreadCount**: `number`

The number of undread messages in this chat

#### Inherited from

[`BaseChat`](/reference/api/model/chat/interfaces/BaseChat.md).[`unreadCount`](/reference/api/model/chat/interfaces/BaseChat.md#unreadcount)
