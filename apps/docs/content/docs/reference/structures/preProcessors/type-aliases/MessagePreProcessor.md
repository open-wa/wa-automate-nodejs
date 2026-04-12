---
title: Type Alias - MessagePreProcessor()
---

# Type Alias: MessagePreProcessor()

> **MessagePreProcessor**: (`message`, `client`?, `alreadyProcessed`?, `source`?) => `Promise`\<[`Message`](/docs/reference/api/model/message/interfaces/Message)\>

A function that takes a message and returns a message.

## Parameters

• **message**: [`Message`](/docs/reference/api/model/message/interfaces/Message)

The message to be processed

• **client?**: [`Client`](/docs/reference/api/Client/classes/Client)

The client that received the message

• **alreadyProcessed?**: `boolean`

Whether the message has already been processed by another preprocessor. (This is useful in cases where you want to mutate the message for both onMessage and onAnyMessage events but only want to do the actual process, like uploading to s3, once.)

• **source?**: `"onMessage"` \| `"onAnyMessage"`

The source of the message. This is useful for knowing if the message is from onMessage or onAnyMessage. Only processing one source will prevent duplicate processing.

## Returns

`Promise`\<[`Message`](/docs/reference/api/model/message/interfaces/Message)\>
