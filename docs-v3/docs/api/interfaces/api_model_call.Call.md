---
id: "api_model_call.Call"
title: "Interface: Call"
sidebar_label: "Call"
custom_edit_url: null
---

[api/model/call](/api/modules/api_model_call.md).Call

## Properties

### State

• **State**: [`CallState`](/api/enums/api_model_call.CallState.md)

State of the call

___

### canHandleLocally

• **canHandleLocally**: `boolean`

___

### id

• **id**: `string`

The id of the call

___

### isGroup

• **isGroup**: `boolean`

Whether or not the call is a group call

___

### isVideo

• **isVideo**: `boolean`

Whether or not the call is a video call

___

### offerTime

• **offerTime**: `number`

The epoch timestamp of the call. You will have to multiply this by 1000 to get the actual epoch timestamp

___

### outgoing

• **outgoing**: `boolean`

The direction of the call.

___

### participants

• **participants**: [`ContactId`](/api/types/api_model_aliases.ContactId.md)[]

The other participants on a group call

___

### peerJid

• **peerJid**: [`ContactId`](/api/types/api_model_aliases.ContactId.md)

The id of the account calling

___

### webClientShouldHandle

• **webClientShouldHandle**: `boolean`
