---
title: Type Alias - ReactionEvent
---

# Type Alias: ReactionEvent

> **ReactionEvent**: `object`

Emitted by onReaction

## Type declaration

### message

> **message**: [`Message`](/docs/reference/api/model/message/interfaces/Message)

The message being reacted to

### reactionByMe

> **reactionByMe**: [`Reaction`](/docs/reference/api/model/reactions/type-aliases/Reaction)

The reaction sent by the host account

### reactions

> **reactions**: [`Reaction`](/docs/reference/api/model/reactions/type-aliases/Reaction)[]

An array of all reactions

### type

> **type**: `"add"` \| `"change"`

The type of the reaction event.
