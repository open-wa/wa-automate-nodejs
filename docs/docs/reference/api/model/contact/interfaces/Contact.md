# Interface: Contact

## Properties

### businessProfile?

> `optional` **businessProfile**: [`BusinessProfile`](/reference/api/model/contact/interfaces/BusinessProfile.md)

If the contact is a business, the business information will be added to the contact object.

In some circumstances this will be out of date or lacking certain fields. In those cases you have to use `client.getBusinessProfile`

***

### formattedName

> **formattedName**: `string`

***

### id

> **id**: [`ContactId`](/reference/api/model/aliases/type-aliases/ContactId.md)

***

### isBusiness

> **isBusiness**: `boolean`

***

### isEnterprise

> **isEnterprise**: `boolean`

Most likely true when the account has a green tick. See `verifiedLevel` also.

***

### isMe

> **isMe**: `boolean`

***

### isMyContact

> **isMyContact**: `boolean`

***

### isOnline?

> `optional` **isOnline**: `boolean`

***

### isPSA

> **isPSA**: `boolean`

***

### isUser

> **isUser**: `boolean`

***

### isWAContact

> **isWAContact**: `boolean`

***

### labels

> **labels**: `string`[]

***

### lastSeen?

> `optional` **lastSeen**: `number`

***

### msgs

> **msgs**: [`Message`](/reference/api/model/message/interfaces/Message.md)[]

***

### name

> **name**: `string`

***

### plaintextDisabled

> **plaintextDisabled**: `boolean`

***

### profilePicThumbObj

> **profilePicThumbObj**: `object`

#### eurl

> **eurl**: `string`

#### id

> **id**: [`Id`](/reference/api/model/id/interfaces/Id.md)

#### img

> **img**: `string`

#### imgFull

> **imgFull**: `string`

#### raw

> **raw**: `string`

#### tag

> **tag**: `string`

***

### pushname

> **pushname**: `string`

***

### shortName

> **shortName**: `string`

***

### statusMute

> **statusMute**: `boolean`

***

### type

> **type**: `string`

***

### verifiedLevel

> **verifiedLevel**: `number`

0 = not verified
2 = verified (most likely represents a blue tick)

***

### verifiedName

> **verifiedName**: `string`

The business account name verified by WA.
