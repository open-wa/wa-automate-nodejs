---
id: "api_model_chat.SingleChat"
title: "Interface: SingleChat"
sidebar_label: "SingleChat"
custom_edit_url: null
---

[api/model/chat](/api/modules/api_model_chat.md).SingleChat

## Hierarchy

- [`BaseChat`](/api/interfaces/api_model_chat.BaseChat.md)

  ↳ **`SingleChat`**

## Properties

### ack

• `Optional` **ack**: `any`

#### Inherited from

[BaseChat](/api/interfaces/api_model_chat.BaseChat.md).[ack](/api/interfaces/api_model_chat.BaseChat.md#ack-36)

___

### archive

• **archive**: `boolean`

#### Inherited from

[BaseChat](/api/interfaces/api_model_chat.BaseChat.md).[archive](/api/interfaces/api_model_chat.BaseChat.md#archive-36)

___

### canSend

• `Optional` **canSend**: `boolean`

Whether your host account is able to send messages to this chat

#### Inherited from

[BaseChat](/api/interfaces/api_model_chat.BaseChat.md).[canSend](/api/interfaces/api_model_chat.BaseChat.md#cansend-36)

___

### changeNumberNewJid

• **changeNumberNewJid**: `any`

#### Inherited from

[BaseChat](/api/interfaces/api_model_chat.BaseChat.md).[changeNumberNewJid](/api/interfaces/api_model_chat.BaseChat.md#changenumbernewjid-36)

___

### changeNumberOldJid

• **changeNumberOldJid**: `any`

#### Inherited from

[BaseChat](/api/interfaces/api_model_chat.BaseChat.md).[changeNumberOldJid](/api/interfaces/api_model_chat.BaseChat.md#changenumberoldjid-36)

___

### contact

• **contact**: [`Contact`](/api/interfaces/api_model_contact.Contact.md)

The contact related to this chat

#### Inherited from

[BaseChat](/api/interfaces/api_model_chat.BaseChat.md).[contact](/api/interfaces/api_model_chat.BaseChat.md#contact-36)

___

### formattedTitle

• `Optional` **formattedTitle**: `string`

The title of the chat

#### Inherited from

[BaseChat](/api/interfaces/api_model_chat.BaseChat.md).[formattedTitle](/api/interfaces/api_model_chat.BaseChat.md#formattedtitle-36)

___

### groupMetadata

• **groupMetadata**: [`GroupMetadata`](/api/interfaces/api_model_group_metadata.GroupMetadata.md)

Group metadata for this chat

#### Inherited from

[BaseChat](/api/interfaces/api_model_chat.BaseChat.md).[groupMetadata](/api/interfaces/api_model_chat.BaseChat.md#groupmetadata-36)

___

### id

• **id**: [`ContactId`](/api/types/api_model_aliases.ContactId.md)

The id of the chat

___

### isAnnounceGrpRestrict

• **isAnnounceGrpRestrict**: `any`

If the chat is a group chat is restricted

#### Inherited from

[BaseChat](/api/interfaces/api_model_chat.BaseChat.md).[isAnnounceGrpRestrict](/api/interfaces/api_model_chat.BaseChat.md#isannouncegrprestrict-36)

___

### isGroup

• **isGroup**: ``false``

Whether the chat is a group chat

___

### isOnline

• `Optional` **isOnline**: `any`

**`Deprecated`**

This is unreliable. Use the method [`isChatOnline`](https://open-wa.github.io/wa-automate-nodejs/classes/client.html#ischatonline) instead.

#### Inherited from

[BaseChat](/api/interfaces/api_model_chat.BaseChat.md).[isOnline](/api/interfaces/api_model_chat.BaseChat.md#isonline-36)

___

### isReadOnly

• **isReadOnly**: `boolean`

Whether the chat is a group chat and the group is restricted

#### Inherited from

[BaseChat](/api/interfaces/api_model_chat.BaseChat.md).[isReadOnly](/api/interfaces/api_model_chat.BaseChat.md#isreadonly-36)

___

### kind

• **kind**: `string`

#### Inherited from

[BaseChat](/api/interfaces/api_model_chat.BaseChat.md).[kind](/api/interfaces/api_model_chat.BaseChat.md#kind-36)

___

### labels

• **labels**: `any`

The labels attached to this chat.

#### Inherited from

[BaseChat](/api/interfaces/api_model_chat.BaseChat.md).[labels](/api/interfaces/api_model_chat.BaseChat.md#labels-36)

___

### lastReceivedKey

• **lastReceivedKey**: `any`

The ID of the last message received in this chat

#### Inherited from

[BaseChat](/api/interfaces/api_model_chat.BaseChat.md).[lastReceivedKey](/api/interfaces/api_model_chat.BaseChat.md#lastreceivedkey-36)

___

### lastSeen

• `Optional` **lastSeen**: `any`

**`Deprecated`**

This is unreliable. Use the method [`getLastSeen`](https://open-wa.github.io/wa-automate-nodejs/classes/client.html#getlastseen) instead.

#### Inherited from

[BaseChat](/api/interfaces/api_model_chat.BaseChat.md).[lastSeen](/api/interfaces/api_model_chat.BaseChat.md#lastseen-36)

___

### modifyTag

• **modifyTag**: `number`

#### Inherited from

[BaseChat](/api/interfaces/api_model_chat.BaseChat.md).[modifyTag](/api/interfaces/api_model_chat.BaseChat.md#modifytag-36)

___

### msgs

• **msgs**: `any`

The messages in the chat

#### Inherited from

[BaseChat](/api/interfaces/api_model_chat.BaseChat.md).[msgs](/api/interfaces/api_model_chat.BaseChat.md#msgs-36)

___

### muteExpiration

• **muteExpiration**: `number`

The expiration timestamp of the chat mute

#### Inherited from

[BaseChat](/api/interfaces/api_model_chat.BaseChat.md).[muteExpiration](/api/interfaces/api_model_chat.BaseChat.md#muteexpiration-36)

___

### name

• **name**: `string`

The name of the chat

#### Inherited from

[BaseChat](/api/interfaces/api_model_chat.BaseChat.md).[name](/api/interfaces/api_model_chat.BaseChat.md#name-36)

___

### notSpam

• **notSpam**: `boolean`

Whether the chat is marked as spam

#### Inherited from

[BaseChat](/api/interfaces/api_model_chat.BaseChat.md).[notSpam](/api/interfaces/api_model_chat.BaseChat.md#notspam-36)

___

### pendingMsgs

• **pendingMsgs**: `boolean`

Messages that are pending to be sent

#### Inherited from

[BaseChat](/api/interfaces/api_model_chat.BaseChat.md).[pendingMsgs](/api/interfaces/api_model_chat.BaseChat.md#pendingmsgs-36)

___

### pin

• **pin**: `number`

Whether the chat is pinned

#### Inherited from

[BaseChat](/api/interfaces/api_model_chat.BaseChat.md).[pin](/api/interfaces/api_model_chat.BaseChat.md#pin-36)

___

### presence

• **presence**: `any`

The presence state of the chat participant

#### Inherited from

[BaseChat](/api/interfaces/api_model_chat.BaseChat.md).[presence](/api/interfaces/api_model_chat.BaseChat.md#presence-36)

___

### t

• **t**: `number`

The timestamp of the last interaction in the chat

#### Inherited from

[BaseChat](/api/interfaces/api_model_chat.BaseChat.md).[t](/api/interfaces/api_model_chat.BaseChat.md#t-36)

___

### unreadCount

• **unreadCount**: `number`

The number of undread messages in this chat

#### Inherited from

[BaseChat](/api/interfaces/api_model_chat.BaseChat.md).[unreadCount](/api/interfaces/api_model_chat.BaseChat.md#unreadcount-36)
