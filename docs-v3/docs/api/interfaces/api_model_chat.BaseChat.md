---
id: "api_model_chat.BaseChat"
title: "Interface: BaseChat"
sidebar_label: "BaseChat"
custom_edit_url: null
---

[api/model/chat](/api/modules/api_model_chat.md).BaseChat

## Hierarchy

- **`BaseChat`**

  ↳ [`SingleChat`](/api/interfaces/api_model_chat.SingleChat.md)

  ↳ [`GroupChat`](/api/interfaces/api_model_chat.GroupChat.md)

## Properties

### ack

• `Optional` **ack**: `any`

___

### archive

• **archive**: `boolean`

___

### canSend

• `Optional` **canSend**: `boolean`

Whether your host account is able to send messages to this chat

___

### changeNumberNewJid

• **changeNumberNewJid**: `any`

___

### changeNumberOldJid

• **changeNumberOldJid**: `any`

___

### contact

• **contact**: [`Contact`](/api/interfaces/api_model_contact.Contact.md)

The contact related to this chat

___

### formattedTitle

• `Optional` **formattedTitle**: `string`

The title of the chat

___

### groupMetadata

• **groupMetadata**: [`GroupMetadata`](/api/interfaces/api_model_group_metadata.GroupMetadata.md)

Group metadata for this chat

___

### isAnnounceGrpRestrict

• **isAnnounceGrpRestrict**: `any`

If the chat is a group chat is restricted

___

### isOnline

• `Optional` **isOnline**: `any`

**`Deprecated`**

This is unreliable. Use the method [`isChatOnline`](https://open-wa.github.io/wa-automate-nodejs/classes/client.html#ischatonline) instead.

___

### isReadOnly

• **isReadOnly**: `boolean`

Whether the chat is a group chat and the group is restricted

___

### kind

• **kind**: `string`

___

### labels

• **labels**: `any`

The labels attached to this chat.

___

### lastReceivedKey

• **lastReceivedKey**: `any`

The ID of the last message received in this chat

___

### lastSeen

• `Optional` **lastSeen**: `any`

**`Deprecated`**

This is unreliable. Use the method [`getLastSeen`](https://open-wa.github.io/wa-automate-nodejs/classes/client.html#getlastseen) instead.

___

### modifyTag

• **modifyTag**: `number`

___

### msgs

• **msgs**: `any`

The messages in the chat

___

### muteExpiration

• **muteExpiration**: `number`

The expiration timestamp of the chat mute

___

### name

• **name**: `string`

The name of the chat

___

### notSpam

• **notSpam**: `boolean`

Whether the chat is marked as spam

___

### pendingMsgs

• **pendingMsgs**: `boolean`

Messages that are pending to be sent

___

### pic

• `Optional` **pic**: `string`

URL of the chat picture if available

___

### pin

• **pin**: `number`

Whether the chat is pinned

___

### presence

• **presence**: `any`

The presence state of the chat participant

___

### t

• **t**: `number`

The timestamp of the last interaction in the chat

___

### unreadCount

• **unreadCount**: `number`

The number of undread messages in this chat
