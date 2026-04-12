---
title: Interface - SingleChat
---

# Interface: SingleChat

## Extends

- [`BaseChat`](/docs/reference/api/model/chat/interfaces/BaseChat)

## Properties

### ack?

> `optional` **ack**: `any`

#### Inherited from

[`BaseChat`](/docs/reference/api/model/chat/interfaces/BaseChat).[`ack`](/docs/reference/api/model/chat/interfaces/BaseChat#ack)

***

### archive

> **archive**: `boolean`

#### Inherited from

[`BaseChat`](/docs/reference/api/model/chat/interfaces/BaseChat).[`archive`](/docs/reference/api/model/chat/interfaces/BaseChat#archive)

***

### canSend?

> `optional` **canSend**: `boolean`

Whether your host account is able to send messages to this chat

#### Inherited from

[`BaseChat`](/docs/reference/api/model/chat/interfaces/BaseChat).[`canSend`](/docs/reference/api/model/chat/interfaces/BaseChat#cansend)

***

### changeNumberNewJid

> **changeNumberNewJid**: `any`

#### Inherited from

[`BaseChat`](/docs/reference/api/model/chat/interfaces/BaseChat).[`changeNumberNewJid`](/docs/reference/api/model/chat/interfaces/BaseChat#changenumbernewjid)

***

### changeNumberOldJid

> **changeNumberOldJid**: `any`

#### Inherited from

[`BaseChat`](/docs/reference/api/model/chat/interfaces/BaseChat).[`changeNumberOldJid`](/docs/reference/api/model/chat/interfaces/BaseChat#changenumberoldjid)

***

### contact

> **contact**: [`Contact`](/docs/reference/api/model/contact/interfaces/Contact)

The contact related to this chat

#### Inherited from

[`BaseChat`](/docs/reference/api/model/chat/interfaces/BaseChat).[`contact`](/docs/reference/api/model/chat/interfaces/BaseChat#contact)

***

### formattedTitle?

> `optional` **formattedTitle**: `string`

The title of the chat

#### Inherited from

[`BaseChat`](/docs/reference/api/model/chat/interfaces/BaseChat).[`formattedTitle`](/docs/reference/api/model/chat/interfaces/BaseChat#formattedtitle)

***

### groupMetadata

> **groupMetadata**: [`GroupMetadata`](/docs/reference/api/model/group-metadata/interfaces/GroupMetadata)

Group metadata for this chat

#### Inherited from

[`BaseChat`](/docs/reference/api/model/chat/interfaces/BaseChat).[`groupMetadata`](/docs/reference/api/model/chat/interfaces/BaseChat#groupmetadata)

***

### id

> **id**: [`ContactId`](/docs/reference/api/model/aliases/type-aliases/ContactId)

The id of the chat

***

### isAnnounceGrpRestrict

> **isAnnounceGrpRestrict**: `any`

If the chat is a group chat is restricted

#### Inherited from

[`BaseChat`](/docs/reference/api/model/chat/interfaces/BaseChat).[`isAnnounceGrpRestrict`](/docs/reference/api/model/chat/interfaces/BaseChat#isannouncegrprestrict)

***

### isGroup

> **isGroup**: `false`

Whether the chat is a group chat

***

### ~~isOnline?~~

> `optional` **isOnline**: `any`

#### Deprecated

This is unreliable. Prefer the `isChatOnline` method instead.

#### Inherited from

[`BaseChat`](/docs/reference/api/model/chat/interfaces/BaseChat).[`isOnline`](/docs/reference/api/model/chat/interfaces/BaseChat#isonline)

***

### isReadOnly

> **isReadOnly**: `boolean`

Whether the chat is a group chat and the group is restricted

#### Inherited from

[`BaseChat`](/docs/reference/api/model/chat/interfaces/BaseChat).[`isReadOnly`](/docs/reference/api/model/chat/interfaces/BaseChat#isreadonly)

***

### kind

> **kind**: `string`

#### Inherited from

[`BaseChat`](/docs/reference/api/model/chat/interfaces/BaseChat).[`kind`](/docs/reference/api/model/chat/interfaces/BaseChat#kind)

***

### labels

> **labels**: `any`

The labels attached to this chat.

#### Inherited from

[`BaseChat`](/docs/reference/api/model/chat/interfaces/BaseChat).[`labels`](/docs/reference/api/model/chat/interfaces/BaseChat#labels)

***

### lastReceivedKey

> **lastReceivedKey**: `any`

The ID of the last message received in this chat

#### Inherited from

[`BaseChat`](/docs/reference/api/model/chat/interfaces/BaseChat).[`lastReceivedKey`](/docs/reference/api/model/chat/interfaces/BaseChat#lastreceivedkey)

***

### ~~lastSeen?~~

> `optional` **lastSeen**: `any`

#### Deprecated

This is unreliable. Prefer the `getLastSeen` method instead.

#### Inherited from

[`BaseChat`](/docs/reference/api/model/chat/interfaces/BaseChat).[`lastSeen`](/docs/reference/api/model/chat/interfaces/BaseChat#lastseen)

***

### modifyTag

> **modifyTag**: `number`

#### Inherited from

[`BaseChat`](/docs/reference/api/model/chat/interfaces/BaseChat).[`modifyTag`](/docs/reference/api/model/chat/interfaces/BaseChat#modifytag)

***

### msgs

> **msgs**: `any`

The messages in the chat

#### Inherited from

[`BaseChat`](/docs/reference/api/model/chat/interfaces/BaseChat).[`msgs`](/docs/reference/api/model/chat/interfaces/BaseChat#msgs)

***

### muteExpiration

> **muteExpiration**: `number`

The expiration timestamp of the chat mute

#### Inherited from

[`BaseChat`](/docs/reference/api/model/chat/interfaces/BaseChat).[`muteExpiration`](/docs/reference/api/model/chat/interfaces/BaseChat#muteexpiration)

***

### name

> **name**: `string`

The name of the chat

#### Inherited from

[`BaseChat`](/docs/reference/api/model/chat/interfaces/BaseChat).[`name`](/docs/reference/api/model/chat/interfaces/BaseChat#name)

***

### notSpam

> **notSpam**: `boolean`

Whether the chat is marked as spam

#### Inherited from

[`BaseChat`](/docs/reference/api/model/chat/interfaces/BaseChat).[`notSpam`](/docs/reference/api/model/chat/interfaces/BaseChat#notspam)

***

### pendingMsgs

> **pendingMsgs**: `boolean`

Messages that are pending to be sent

#### Inherited from

[`BaseChat`](/docs/reference/api/model/chat/interfaces/BaseChat).[`pendingMsgs`](/docs/reference/api/model/chat/interfaces/BaseChat#pendingmsgs)

***

### pic?

> `optional` **pic**: `string`

URL of the chat picture if available

#### Inherited from

[`BaseChat`](/docs/reference/api/model/chat/interfaces/BaseChat).[`pic`](/docs/reference/api/model/chat/interfaces/BaseChat#pic)

***

### pin

> **pin**: `number`

Whether the chat is pinned

#### Inherited from

[`BaseChat`](/docs/reference/api/model/chat/interfaces/BaseChat).[`pin`](/docs/reference/api/model/chat/interfaces/BaseChat#pin)

***

### presence

> **presence**: `any`

The presence state of the chat participant

#### Inherited from

[`BaseChat`](/docs/reference/api/model/chat/interfaces/BaseChat).[`presence`](/docs/reference/api/model/chat/interfaces/BaseChat#presence)

***

### t

> **t**: `number`

The timestamp of the last interaction in the chat

#### Inherited from

[`BaseChat`](/docs/reference/api/model/chat/interfaces/BaseChat).[`t`](/docs/reference/api/model/chat/interfaces/BaseChat#t)

***

### unreadCount

> **unreadCount**: `number`

The number of undread messages in this chat

#### Inherited from

[`BaseChat`](/docs/reference/api/model/chat/interfaces/BaseChat).[`unreadCount`](/docs/reference/api/model/chat/interfaces/BaseChat#unreadcount)
