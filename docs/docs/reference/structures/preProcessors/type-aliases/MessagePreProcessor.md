# Type Alias: MessagePreProcessor()

> **MessagePreProcessor**: (`message`, `client`?, `alreadyProcessed`?, `source`?) => `Promise`\<[`Message`](/reference/api/model/message/interfaces/Message.md)\>

A function that takes a message and returns a message.

## Parameters

• **message**: [`Message`](/reference/api/model/message/interfaces/Message.md)

The message to be processed

• **client?**: [`Client`](/reference/api/Client/classes/Client.md)

The client that received the message

• **alreadyProcessed?**: `boolean`

Whether the message has already been processed by another preprocessor. (This is useful in cases where you want to mutate the message for both onMessage and onAnyMessage events but only want to do the actual process, like uploading to s3, once.)

• **source?**: `"onMessage"` \| `"onAnyMessage"`

The source of the message. This is useful for knowing if the message is from onMessage or onAnyMessage. Only processing one source will prevent duplicate processing.

## Returns

`Promise`\<[`Message`](/reference/api/model/message/interfaces/Message.md)\>
