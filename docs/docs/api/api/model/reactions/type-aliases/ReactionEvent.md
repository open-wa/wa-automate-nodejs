# Type Alias: ReactionEvent

> **ReactionEvent**: `object`

Emitted by onReaction

## Type declaration

### message

> **message**: [`Message`](/api/api/model/message/interfaces/Message.md)

The message being reacted to

### reactionByMe

> **reactionByMe**: [`Reaction`](/api/api/model/reactions/type-aliases/Reaction.md)

The reaction sent by the host account

### reactions

> **reactions**: [`Reaction`](/api/api/model/reactions/type-aliases/Reaction.md)[]

An array of all reactions

### type

> **type**: `"add"` \| `"change"`

The type of the reaction event.
