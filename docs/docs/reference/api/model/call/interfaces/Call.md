# Interface: Call

## Properties

### State

> **State**: [`CallState`](/reference/api/model/call/enumerations/CallState.md)

State of the call

***

### canHandleLocally

> **canHandleLocally**: `boolean`

***

### id

> **id**: `string`

The id of the call

***

### isGroup

> **isGroup**: `boolean`

Whether or not the call is a group call

***

### isVideo

> **isVideo**: `boolean`

Whether or not the call is a video call

***

### offerTime

> **offerTime**: `number`

The epoch timestamp of the call. You will have to multiply this by 1000 to get the actual epoch timestamp

***

### outgoing

> **outgoing**: `boolean`

The direction of the call.

***

### participants

> **participants**: [`ContactId`](/reference/api/model/aliases/type-aliases/ContactId.md)[]

The other participants on a group call

***

### peerJid

> **peerJid**: [`ContactId`](/reference/api/model/aliases/type-aliases/ContactId.md)

The id of the account calling

***

### webClientShouldHandle

> **webClientShouldHandle**: `boolean`
