---
id: "api_model_contact.Contact"
title: "Interface: Contact"
sidebar_label: "Contact"
custom_edit_url: null
---

[api/model/contact](/api/modules/api_model_contact.md).Contact

## Properties

### businessProfile

• `Optional` **businessProfile**: [`BusinessProfile`](/api/interfaces/api_model_contact.BusinessProfile.md)

If the contact is a business, the business information will be added to the contact object.

In some circumstances this will be out of date or lacking certain fields. In those cases you have to use `client.getBusinessProfile`

___

### formattedName

• **formattedName**: `string`

___

### id

• **id**: [`ContactId`](/api/types/api_model_aliases.ContactId.md)

___

### isBusiness

• **isBusiness**: `boolean`

___

### isEnterprise

• **isEnterprise**: `boolean`

Most likely true when the account has a green tick. See `verifiedLevel` also.

___

### isMe

• **isMe**: `boolean`

___

### isMyContact

• **isMyContact**: `boolean`

___

### isOnline

• `Optional` **isOnline**: `boolean`

___

### isPSA

• **isPSA**: `boolean`

___

### isUser

• **isUser**: `boolean`

___

### isWAContact

• **isWAContact**: `boolean`

___

### labels

• **labels**: `string`[]

___

### lastSeen

• `Optional` **lastSeen**: `number`

___

### msgs

• **msgs**: [`Message`](/api/interfaces/api_model_message.Message.md)[]

___

### name

• **name**: `string`

___

### plaintextDisabled

• **plaintextDisabled**: `boolean`

___

### profilePicThumbObj

• **profilePicThumbObj**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `eurl` | `string` |
| `id` | [`Id`](/api/interfaces/api_model_id.Id.md) |
| `img` | `string` |
| `imgFull` | `string` |
| `raw` | `string` |
| `tag` | `string` |

___

### pushname

• **pushname**: `string`

___

### shortName

• **shortName**: `string`

___

### statusMute

• **statusMute**: `boolean`

___

### type

• **type**: `string`

___

### verifiedLevel

• **verifiedLevel**: `number`

0 = not verified
2 = verified (most likely represents a blue tick)

___

### verifiedName

• **verifiedName**: `string`

The business account name verified by WA.
