---
id: "api_model_message.PollVote"
title: "Interface: PollVote"
sidebar_label: "PollVote"
custom_edit_url: null
---

[api/model/message](/api/modules/api_model_message.md).PollVote

## Properties

### ack

• **ack**: `number`

___

### id

• **id**: `string`

The message ID of this vote. For some reason this is different from the msgKey and includes exclamaition marks.

___

### msgKey

• **msgKey**: `string`

The message key of this vote

___

### parentMsgKey

• **parentMsgKey**: `string`

The Message ID of the original Poll message

___

### pollOptions

• **pollOptions**: [`PollOption`](/api/interfaces/api_model_message.PollOption.md)[]

The original poll options available on the poll

___

### selectedOptionLocalIds

• **selectedOptionLocalIds**: `number`[]

The selected option IDs of the voter

___

### selectedOptionValues

• **selectedOptionValues**: `string`[]

The selected option values by this voter

___

### sender

• **sender**: [`ContactId`](/api/types/api_model_aliases.ContactId.md)

The contact ID of the voter

___

### senderObj

• **senderObj**: [`Contact`](/api/interfaces/api_model_contact.Contact.md)

The contact object of the voter

___

### senderTimestampMs

• **senderTimestampMs**: `number`

Timestamp of the vote

___

### stale

• **stale**: `boolean`
