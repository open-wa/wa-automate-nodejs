---
title: Interface - PollVote
---

# Interface: PollVote

## Properties

### ack

> **ack**: `number`

***

### id

> **id**: `string`

The message ID of this vote. For some reason this is different from the msgKey and includes exclamaition marks.

***

### msgKey

> **msgKey**: `string`

The message key of this vote

***

### parentMsgKey

> **parentMsgKey**: `string`

The Message ID of the original Poll message

***

### pollOptions

> **pollOptions**: [`PollOption`](/docs/reference/api/model/message/interfaces/PollOption)[]

The original poll options available on the poll

***

### selectedOptionLocalIds

> **selectedOptionLocalIds**: `number`[]

The selected option IDs of the voter

***

### selectedOptionValues

> **selectedOptionValues**: `string`[]

The selected option values by this voter

***

### sender

> **sender**: [`ContactId`](/docs/reference/api/model/aliases/type-aliases/ContactId)

The contact ID of the voter

***

### senderObj

> **senderObj**: [`Contact`](/docs/reference/api/model/contact/interfaces/Contact)

The contact object of the voter

***

### senderTimestampMs

> **senderTimestampMs**: `number`

Timestamp of the vote

***

### stale

> **stale**: `boolean`
