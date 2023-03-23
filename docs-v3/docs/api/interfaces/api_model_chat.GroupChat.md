---
id: "api_model_chat.GroupChat"
title: "Interface: GroupChat"
sidebar_label: "GroupChat"
custom_edit_url: null
---

[api/model/chat](/api/modules/api_model_chat.md).GroupChat

## Hierarchy

- [`BaseChat`](/api/interfaces/api_model_chat.BaseChat.md)

  ↳ **`GroupChat`**

## Properties

### ack

• `Optional` **ack**: `any`

#### Inherited from

[BaseChat](/api/interfaces/api_model_chat.BaseChat.md).[ack](/api/interfaces/api_model_chat.BaseChat.md#ack)

___

### archive

• **archive**: `boolean`

#### Inherited from

[BaseChat](/api/interfaces/api_model_chat.BaseChat.md).[archive](/api/interfaces/api_model_chat.BaseChat.md#archive)

___

### canSend

• `Optional` **canSend**: `boolean`

Whether your host account is able to send messages to this chat

#### Inherited from

[BaseChat](/api/interfaces/api_model_chat.BaseChat.md).[canSend](/api/interfaces/api_model_chat.BaseChat.md#cansend)

___

### changeNumberNewJid

• **changeNumberNewJid**: `any`

#### Inherited from

[BaseChat](/api/interfaces/api_model_chat.BaseChat.md).[changeNumberNewJid](/api/interfaces/api_model_chat.BaseChat.md#changenumbernewjid)

___

### changeNumberOldJid

• **changeNumberOldJid**: `any`

#### Inherited from

[BaseChat](/api/interfaces/api_model_chat.BaseChat.md).[changeNumberOldJid](/api/interfaces/api_model_chat.BaseChat.md#changenumberoldjid)

___

### contact

• **contact**: [`Contact`](/api/interfaces/api_model_contact.Contact.md)

The contact related to this chat

#### Inherited from

[BaseChat](/api/interfaces/api_model_chat.BaseChat.md).[contact](/api/interfaces/api_model_chat.BaseChat.md#contact)

___

### formattedTitle

• `Optional` **formattedTitle**: `string`

The title of the chat

#### Inherited from

[BaseChat](/api/interfaces/api_model_chat.BaseChat.md).[formattedTitle](/api/interfaces/api_model_chat.BaseChat.md#formattedtitle)

___

### groupMetadata

• **groupMetadata**: [`GroupMetadata`](/api/interfaces/api_model_group_metadata.GroupMetadata.md)

Group metadata for this chat

#### Inherited from

[BaseChat](/api/interfaces/api_model_chat.BaseChat.md).[groupMetadata](/api/interfaces/api_model_chat.BaseChat.md#groupmetadata)

___

### id

• **id**: [`GroupChatId`](/api/types/api_model_aliases.GroupChatId.md)

The id of the chat

___

### isAnnounceGrpRestrict

• **isAnnounceGrpRestrict**: `any`

If the chat is a group chat is restricted

#### Inherited from

[BaseChat](/api/interfaces/api_model_chat.BaseChat.md).[isAnnounceGrpRestrict](/api/interfaces/api_model_chat.BaseChat.md#isannouncegrprestrict)

___

### isGroup

• **isGroup**: ``true``

Whether the chat is a group chat

___

### isOnline

• `Optional` **isOnline**: `any`

**`Deprecated`**

This is unreliable. Use the method [`isChatOnline`](https://open-wa.github.io/wa-automate-nodejs/classes/client.html#ischatonline) instead.

#### Inherited from

[BaseChat](/api/interfaces/api_model_chat.BaseChat.md).[isOnline](/api/interfaces/api_model_chat.BaseChat.md#isonline)

___

### isReadOnly

• **isReadOnly**: `boolean`

Whether the chat is a group chat and the group is restricted

#### Inherited from

[BaseChat](/api/interfaces/api_model_chat.BaseChat.md).[isReadOnly](/api/interfaces/api_model_chat.BaseChat.md#isreadonly)

___

### kind

• **kind**: `string`

#### Inherited from

[BaseChat](/api/interfaces/api_model_chat.BaseChat.md).[kind](/api/interfaces/api_model_chat.BaseChat.md#kind)

___

### labels

• **labels**: `any`

The labels attached to this chat.

#### Inherited from

[BaseChat](/api/interfaces/api_model_chat.BaseChat.md).[labels](/api/interfaces/api_model_chat.BaseChat.md#labels)

___

### lastReceivedKey

• **lastReceivedKey**: `any`

The ID of the last message received in this chat

#### Inherited from

[BaseChat](/api/interfaces/api_model_chat.BaseChat.md).[lastReceivedKey](/api/interfaces/api_model_chat.BaseChat.md#lastreceivedkey)

___

### lastSeen

• `Optional` **lastSeen**: `any`

**`Deprecated`**

This is unreliable. Use the method [`getLastSeen`](https://open-wa.github.io/wa-automate-nodejs/classes/client.html#getlastseen) instead.

#### Inherited from

[BaseChat](/api/interfaces/api_model_chat.BaseChat.md).[lastSeen](/api/interfaces/api_model_chat.BaseChat.md#lastseen)

___

### modifyTag

• **modifyTag**: `number`

#### Inherited from

[BaseChat](/api/interfaces/api_model_chat.BaseChat.md).[modifyTag](/api/interfaces/api_model_chat.BaseChat.md#modifytag)

___

### msgs

• **msgs**: `any`

The messages in the chat

#### Inherited from

[BaseChat](/api/interfaces/api_model_chat.BaseChat.md).[msgs](/api/interfaces/api_model_chat.BaseChat.md#msgs)

___

### muteExpiration

• **muteExpiration**: `number`

The expiration timestamp of the chat mute

#### Inherited from

[BaseChat](/api/interfaces/api_model_chat.BaseChat.md).[muteExpiration](/api/interfaces/api_model_chat.BaseChat.md#muteexpiration)

___

### name

• **name**: `string`

The name of the chat

#### Inherited from

[BaseChat](/api/interfaces/api_model_chat.BaseChat.md).[name](/api/interfaces/api_model_chat.BaseChat.md#name)

___

### notSpam

• **notSpam**: `boolean`

Whether the chat is marked as spam

#### Inherited from

[BaseChat](/api/interfaces/api_model_chat.BaseChat.md).[notSpam](/api/interfaces/api_model_chat.BaseChat.md#notspam)

___

### pendingMsgs

• **pendingMsgs**: `boolean`

Messages that are pending to be sent

#### Inherited from

[BaseChat](/api/interfaces/api_model_chat.BaseChat.md).[pendingMsgs](/api/interfaces/api_model_chat.BaseChat.md#pendingmsgs)

___

### pic

• `Optional` **pic**: `string`

URL of the chat picture if available

#### Inherited from

[BaseChat](/api/interfaces/api_model_chat.BaseChat.md).[pic](/api/interfaces/api_model_chat.BaseChat.md#pic)

___

### pin

• **pin**: `number`

Whether the chat is pinned

#### Inherited from

[BaseChat](/api/interfaces/api_model_chat.BaseChat.md).[pin](/api/interfaces/api_model_chat.BaseChat.md#pin)

___

### presence

• **presence**: `any`

The presence state of the chat participant

#### Inherited from

[BaseChat](/api/interfaces/api_model_chat.BaseChat.md).[presence](/api/interfaces/api_model_chat.BaseChat.md#presence)

___

### t

• **t**: `number`

The timestamp of the last interaction in the chat

#### Inherited from

[BaseChat](/api/interfaces/api_model_chat.BaseChat.md).[t](/api/interfaces/api_model_chat.BaseChat.md#t)

___

### unreadCount

• **unreadCount**: `number`

The number of undread messages in this chat

#### Inherited from

[BaseChat](/api/interfaces/api_model_chat.BaseChat.md).[unreadCount](/api/interfaces/api_model_chat.BaseChat.md#unreadcount)
