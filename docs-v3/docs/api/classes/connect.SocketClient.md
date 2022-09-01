---
id: "connect.SocketClient"
title: "Class: SocketClient"
sidebar_label: "SocketClient"
custom_edit_url: null
---

[connect](/api/modules/connect.md).SocketClient

[ALPHA - API will 100% change in the near future. Don't say I didn't warn you.]

An easy to use socket implementation that allows users to connect into remote instances of the EASY API.

How to use it:

1. Make sure you're running an instance of the EASY API and make sure to start it with the `--socket` flag
     ```bash
         > docker run -e PORT=8080 -p 8080:8080 openwa/wa-automate:latest --socket
     ```
2. Use this in your code:

     ```javascript
         import { SocketClient } from "@open-wa/wa-automate";

         SocketClient.connect("http://localhost:8080").then(async client => {
             //now you can use the client similar to how you would use the http express middleware.

             //There are two main commands from this client

             // 1. client.listen - use this for your listeners

             await client.listen("onMessage", message => {
                 ...
             })

             // 2. client.asj - ask the main host client to get things done

             await client.ask("sendText", {
                 "to" : "44771234567@c.us",
                 "content": "hellow socket"
             })

             // or you can send the arguments in order as an array (or tuple, as the cool kids would say)
             await client.ask("sendText", [
                 "44771234567@c.us",
                 "hellow socket"
             ])

         })
     ```

## Constructors

### constructor

• **new SocketClient**(`url`, `apiKey?`, `ev?`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `url` | `string` |
| `apiKey?` | `string` |
| `ev?` | `boolean` |

## Properties

### apiKey

• **apiKey**: `string`

___

### ev

• **ev**: `EventEmitter2`

A local version of the `ev` EventEmitter2

___

### listeners

• **listeners**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `onAck` | { `[id: string]`: (`data`: `any`) => `any`;  } |
| `onAddedToGroup` | { `[id: string]`: (`data`: `any`) => `any`;  } |
| `onAnyMessage` | { `[id: string]`: (`data`: `any`) => `any`;  } |
| `onBattery` | { `[id: string]`: (`data`: `any`) => `any`;  } |
| `onButton` | { `[id: string]`: (`data`: `any`) => `any`;  } |
| `onChatDeleted` | { `[id: string]`: (`data`: `any`) => `any`;  } |
| `onChatOpened` | { `[id: string]`: (`data`: `any`) => `any`;  } |
| `onChatState` | { `[id: string]`: (`data`: `any`) => `any`;  } |
| `onContactAdded` | { `[id: string]`: (`data`: `any`) => `any`;  } |
| `onGlobalParticipantsChanged` | { `[id: string]`: (`data`: `any`) => `any`;  } |
| `onIncomingCall` | { `[id: string]`: (`data`: `any`) => `any`;  } |
| `onLogout` | { `[id: string]`: (`data`: `any`) => `any`;  } |
| `onMessage` | { `[id: string]`: (`data`: `any`) => `any`;  } |
| `onMessageDeleted` | { `[id: string]`: (`data`: `any`) => `any`;  } |
| `onOrder` | { `[id: string]`: (`data`: `any`) => `any`;  } |
| `onPlugged` | { `[id: string]`: (`data`: `any`) => `any`;  } |
| `onRemovedFromGroup` | { `[id: string]`: (`data`: `any`) => `any`;  } |
| `onStateChanged` | { `[id: string]`: (`data`: `any`) => `any`;  } |
| `onStory` | { `[id: string]`: (`data`: `any`) => `any`;  } |

___

### socket

• **socket**: `Socket`<`DefaultEventsMap`, `DefaultEventsMap`\>

___

### url

• **url**: `string`

## Methods

### ask

▸ **ask**<`M`, `P`\>(`method`, `args?`): `Promise`<`unknown`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `M` | extends keyof `Client` |
| `P` | extends [] \| [c: Message \| ChatId \| Chat, filter: CollectorFilter<[Message]\>, options: CollectorOptions] \| [c: Message \| ChatId \| Chat, filter: CollectorFilter<[Message]\>, options?: AwaitMessagesOptions] \| [chatId: ChatId, payload: Object] \| [listener: SimpleListener] \| [message?: string] \| [url: string, optionsOverride?: any] \| [fn: Function] \| [fn: Function, queueOptions?: Options<default, DefaultAddOptions\>] \| [fn: Function, queueOptions?: Options<default, DefaultAddOptions\>] \| [fn: Function] \| [fn: Function] \| [fn: Function] \| [fn: Function] \| [fn: Function] \| [fn: Function] \| [fn: Function] \| [fn: Function] \| [fn: Function] \| [fn: Function] \| [fn: Function] \| [fn: Function] \| [fn: Function] \| [fn: Function] \| [fn: Function] \| [fn: Function] \| [groupId: \`${number}-${number}@g.us\`, fn: Function, legacy?: boolean] \| [chatId: ChatId, fn: Function] \| [available: boolean] \| [newStatus: string] \| [label: string] \| [label: string, chatId: ChatId] \| [label: string, chatId: ChatId] \| [label: string] \| [chatId: ChatId, vcard: string, contactName: string, contactNumber?: string] \| [newName: string] \| [chatState: ChatState, chatId: ChatId] \| [chatId: ChatId] \| [to: ChatId, content: string] \| [to: ChatId, content: string, hideTags?: boolean] \| [to: ChatId, amount: number, currency: string, message?: string] \| [to: ChatId, body: string, buttons: Button[], title: string, footer?: string] \| [to: ChatId, base64: string] \| [to: ChatId, sections: Section[], title: string, description: string, actionText: string] \| [to: ChatId, content: string, replyMessageId: \`false\_${number}-${number}@g.us\_${string}\` \| \`false\_${number}@c.us\_${string}\` \| \`true\_${number}-${number}@g.us\_${string}\` \| \`true\_${number}@c.us\_${string}\`] \| [groupId: \`${number}-${number}@g.us\`, content: string, hideTags?: boolean] \| [thumb: string, url: string, title: string, description: string, text: string, chatId: ChatId] \| [to: ChatId, lat: string, lng: string, loc: string] \| [userA?: string] \| [message: \`false\_${number}-${number}@g.us\_${string}\` \| \`false\_${number}@c.us\_${string}\` \| \`true\_${number}-${number}@g.us\_${string}\` \| \`true\_${number}@c.us\_${string}\` \| Message] \| [to: ChatId, file: string, filename: string, caption: string, quotedMsgId?: \`false\_${number}-${number}@g.us\_${string}\` \| \`false\_${number}@c.us\_${string}\` \| \`true\_${number}-${number}@g.us\_${string}\` \| \`true\_${number}@c.us\_${string}\`, waitForId?: boolean, ptt?: boolean, withoutPreview?: boolean, hideTags?: boolean] \| [to: ChatId, url: string, text?: string, thumbnail?: string] \| [to: ChatId, url: string, text?: string, thumbnail?: string] \| [to: ChatId, content: string, quotedMsgId: \`false\_${number}-${number}@g.us\_${string}\` \| \`false\_${number}@c.us\_${string}\` \| \`true\_${number}-${number}@g.us\_${string}\` \| \`true\_${number}@c.us\_${string}\`, sendSeen?: boolean] \| [contactId: \`${number}@c.us\`] \| [to: ChatId, file: string, filename: string, caption: string, quotedMsgId?: \`false\_${number}-${number}@g.us\_${string}\` \| \`false\_${number}@c.us\_${string}\` \| \`true\_${number}-${number}@g.us\_${string}\` \| \`true\_${number}@c.us\_${string}\`, waitForId?: boolean, ptt?: boolean, withoutPreview?: boolean, hideTags?: boolean] \| [groupChatId: \`${number}-${number}@g.us\`] \| [to: ChatId, file: string, quotedMsgId: \`false\_${number}-${number}@g.us\_${string}\` \| \`false\_${number}@c.us\_${string}\` \| \`true\_${number}-${number}@g.us\_${string}\` \| \`true\_${number}@c.us\_${string}\`] \| [to: ChatId, file: string, quotedMsgId?: \`false\_${number}-${number}@g.us\_${string}\` \| \`false\_${number}@c.us\_${string}\` \| \`true\_${number}-${number}@g.us\_${string}\` \| \`true\_${number}@c.us\_${string}\`] \| [to: ChatId, file: string, filename: string, caption: string, quotedMsgId?: \`false\_${number}-${number}@g.us\_${string}\` \| \`false\_${number}@c.us\_${string}\` \| \`true\_${number}-${number}@g.us\_${string}\` \| \`true\_${number}@c.us\_${string}\`, requestConfig?: AxiosRequestConfig<any\>] \| [to: ChatId, giphyMediaUrl: string, caption: string] \| [to: ChatId, url: string, filename: string, caption: string, quotedMsgId?: \`false\_${number}-${number}@g.us\_${string}\` \| \`false\_${number}@c.us\_${string}\` \| \`true\_${number}-${number}@g.us\_${string}\` \| \`true\_${number}@c.us\_${string}\`, requestConfig?: AxiosRequestConfig<any\>, waitForId?: boolean, ptt?: boolean, withoutPreview?: boolean, hideTags?: boolean] \| [id: \`${number}@c.us\`] \| [to: ChatId, image: string, caption: string, bizNumber: \`${number}@c.us\`, productId: string] \| [to: ChatId, image: string, productData: CustomProduct] \| [to: ChatId, contactId: \`${number}@c.us\` \| \`${number}@c.us\`[]] \| [to: ChatId, contactIds: \`${number}@c.us\`[]] \| [to: ChatId, on: boolean] \| [id: ChatId, archive: boolean] \| [id: ChatId, pin: boolean] \| [chatId: ChatId, muteDuration: ChatMuteDuration] \| [chatId: ChatId] \| [chatId: ChatId] \| [to: ChatId, messages: \`false\_${number}-${number}@g.us\_${string}\` \| \`false\_${number}@c.us\_${string}\` \| \`true\_${number}-${number}@g.us\_${string}\` \| \`true\_${number}@c.us\_${string}\` \| (\`false\_${number}-${number}@g.us\_${string}\` \| \`false\_${number}@c.us\_${string}\` \| \`true\_${number}-${number}@g.us\_${string}\` \| \`true\_${number}@c.us\_${string}\`)[], skipMyMessages: boolean] \| [to: ChatId, messageId: \`false\_${number}-${number}@g.us\_${string}\` \| \`false\_${number}@c.us\_${string}\` \| \`true\_${number}-${number}@g.us\_${string}\` \| \`true\_${number}@c.us\_${string}\`] \| [withNewMessageOnly?: boolean] \| [withNewMessageOnly?: boolean] \| [withNewMessagesOnly?: boolean] \| [groupId: \`${number}-${number}@g.us\`] \| [groupId: \`${number}-${number}@g.us\`] \| [link: string, returnChatObj?: boolean] \| [id: \`${number}@c.us\`] \| [id: ChatId] \| [id: \`${number}@c.us\`] \| [groupId: \`${number}-${number}@g.us\`] \| [msgId: \`false\_${number}-${number}@g.us\_${string}\` \| \`false\_${number}@c.us\_${string}\` \| \`true\_${number}-${number}@g.us\_${string}\` \| \`true\_${number}@c.us\_${string}\`] \| [groupId: \`${number}-${number}@g.us\`] \| [contactId: \`${number}@c.us\`] \| [contactId: \`${number}@c.us\`] \| [messageId: \`false\_${number}-${number}@g.us\_${string}\` \| \`false\_${number}@c.us\_${string}\` \| \`true\_${number}-${number}@g.us\_${string}\` \| \`true\_${number}@c.us\_${string}\`] \| [id: string] \| [name: string, price: number, currency: string, images: string[], description: string, url?: string, internalId?: string, isHidden?: boolean] \| [productId: string, name?: string, price?: number, currency?: string, images?: string[], description?: string, url?: string, internalId?: string, isHidden?: boolean] \| [chatId: ChatId, productId: string] \| [productId: string] \| [chatId?: ChatId] \| [messageId: \`false\_${number}-${number}@g.us\_${string}\` \| \`false\_${number}@c.us\_${string}\` \| \`true\_${number}-${number}@g.us\_${string}\` \| \`true\_${number}@c.us\_${string}\`] \| [messageId: \`false\_${number}-${number}@g.us\_${string}\` \| \`false\_${number}@c.us\_${string}\` \| \`true\_${number}-${number}@g.us\_${string}\` \| \`true\_${number}@c.us\_${string}\`] \| [contactId: \`${number}@c.us\`] \| [contactId: \`${number}@c.us\`] \| [chatId: ChatId] \| [chatId: ChatId] \| [chatId: ChatId] \| [chatId: ChatId] \| [chatId: ChatId] \| [contactId: \`${number}@c.us\`] \| [contactId: \`${number}@c.us\`] \| [contactId: \`${number}@c.us\`] \| [chatId: ChatId] \| [chatId: ChatId] \| [chatId: ChatId] \| [link: string] \| [chatId: ChatId] \| [chatId: ChatId, messageId: \`false\_${number}-${number}@g.us\_${string}\` \| \`false\_${number}@c.us\_${string}\` \| \`true\_${number}-${number}@g.us\_${string}\` \| \`true\_${number}@c.us\_${string}\` \| (\`false\_${number}-${number}@g.us\_${string}\` \| \`false\_${number}@c.us\_${string}\` \| \`true\_${number}-${number}@g.us\_${string}\` \| \`true\_${number}@c.us\_${string}\`)[], onlyLocal?: boolean] \| [contactId: \`${number}@c.us\`] \| [includeMe: boolean, includeNotifications: boolean, use\_unread\_count: boolean] \| [chatId: ChatId, includeMe: boolean, includeNotifications: boolean] \| [chatId: ChatId, includeMe: boolean, includeNotifications: boolean] \| [groupName: string, contacts: \`${number}@c.us\` \| \`${number}@c.us\`[]] \| [groupId: \`${number}-${number}@g.us\`, participantId: \`${number}@c.us\`] \| [groupId: \`${number}-${number}@g.us\`, image: string] \| [groupId: \`${number}-${number}@g.us\`, url: string, requestConfig?: AxiosRequestConfig<any\>] \| [groupId: \`${number}-${number}@g.us\`, participantId: \`${number}@c.us\` \| \`${number}@c.us\`[]] \| [groupId: \`${number}-${number}@g.us\`, participantId: \`${number}@c.us\` \| \`${number}@c.us\`[]] \| [groupId: \`${number}-${number}@g.us\`, participantId: \`${number}@c.us\` \| \`${number}@c.us\`[]] \| [groupId: \`${number}-${number}@g.us\`, onlyAdmins: boolean] \| [groupId: \`${number}-${number}@g.us\`, onlyAdmins: boolean] \| [groupId: \`${number}-${number}@g.us\`, description: string] \| [groupId: \`${number}-${number}@g.us\`, title: string] \| [groupId: \`${number}-${number}@g.us\`] \| [hex: string] \| [activate: boolean] \| [messageId: \`false\_${number}-${number}@g.us\_${string}\` \| \`false\_${number}@c.us\_${string}\` \| \`true\_${number}-${number}@g.us\_${string}\` \| \`true\_${number}@c.us\_${string}\`] \| [to: ChatId, url: string, requestConfig?: AxiosRequestConfig<any\>, stickerMetadata?: StickerMetadata] \| [to: ChatId, url: string, messageId: \`false\_${number}-${number}@g.us\_${string}\` \| \`false\_${number}@c.us\_${string}\` \| \`true\_${number}-${number}@g.us\_${string}\` \| \`true\_${number}@c.us\_${string}\`, requestConfig?: AxiosRequestConfig<any\>, stickerMetadata?: StickerMetadata] \| [to: ChatId, image: string \| Buffer, messageId: \`false\_${number}-${number}@g.us\_${string}\` \| \`false\_${number}@c.us\_${string}\` \| \`true\_${number}-${number}@g.us\_${string}\` \| \`true\_${number}@c.us\_${string}\`, stickerMetadata?: StickerMetadata] \| [namespace: namespace, id: string, property: string] \| [to: ChatId, image: string \| Buffer, stickerMetadata?: StickerMetadata] \| [to: ChatId, file: string \| Buffer, processOptions?: Mp4StickerConversionProcessOptions, stickerMetadata?: StickerMetadata, messageId?: \`false\_${number}-${number}@g.us\_${string}\` \| \`false\_${number}@c.us\_${string}\` \| \`true\_${number}-${number}@g.us\_${string}\` \| \`true\_${number}@c.us\_${string}\`] \| [to: ChatId, emojiId: string, messageId?: \`false\_${number}-${number}@g.us\_${string}\` \| \`false\_${number}@c.us\_${string}\` \| \`true\_${number}-${number}@g.us\_${string}\` \| \`true\_${number}@c.us\_${string}\`] \| [to: ChatId, webpBase64: string, animated?: boolean] \| [to: ChatId, messageId: \`false\_${number}-${number}@g.us\_${string}\` \| \`false\_${number}@c.us\_${string}\` \| \`true\_${number}-${number}@g.us\_${string}\` \| \`true\_${number}@c.us\_${string}\`, webpBase64: string, animated?: boolean] \| [chatId: ChatId, ephemeral: boolean] \| [to: ChatId, giphyMediaUrl: string \| URL] \| [text: string, textRgba: string, backgroundRgba: string, font: number] \| [data: string, caption: string] \| [data: string, caption: string] \| [statusesToDelete: string \| string[]] \| [id: string] \| [ts?: number] \| [startingFrom?: number] \| [message: Message] \| [url: string] \| [data: string] \| [useSessionIdInPath?: boolean] \| [webhookId: string] \| [webhookId: string, events: "all" \| SimpleListener[]] \| [url: string, events: "all" \| SimpleListener[], requestConfig?: AxiosRequestConfig<any\>, concurrency?: number] |

#### Parameters

| Name | Type |
| :------ | :------ |
| `method` | `M` |
| `args?` | `any`[] \| `P` \| { `[k: string]`: `unknown`;  } |

#### Returns

`Promise`<`unknown`\>

___

### awaitMessages

▸ **awaitMessages**(`c`, `filter`, `options?`): `Promise`<[`Collection`](/api/classes/connect.Collection.md)<`string`, `Message`\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `c` | `Message` \| `ChatId` \| `Chat` |
| `filter` | [`CollectorFilter`](/api/types/connect.CollectorFilter.md)<[`Message`]\> |
| `options?` | [`AwaitMessagesOptions`](/api/interfaces/connect.AwaitMessagesOptions.md) |

#### Returns

`Promise`<[`Collection`](/api/classes/connect.Collection.md)<`string`, `Message`\>\>

___

### createMessageCollector

▸ **createMessageCollector**(`c`, `filter`, `options`): `Promise`<[`MessageCollector`](/api/classes/connect.MessageCollector.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `c` | `Message` \| `ChatId` \| `Chat` |
| `filter` | [`CollectorFilter`](/api/types/connect.CollectorFilter.md)<[`Message`]\> |
| `options` | [`CollectorOptions`](/api/interfaces/connect.CollectorOptions.md) |

#### Returns

`Promise`<[`MessageCollector`](/api/classes/connect.MessageCollector.md)\>

___

### listen

▸ **listen**(`listener`, `callback`): `Promise`<`string`\>

Set a callback on a simple listener

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `listener` | `SimpleListener` | The listener name (e.g onMessage, onAnyMessage, etc.) |
| `callback` | (`data`: `unknown`) => `void` | The callback you need to run on the selected listener |

#### Returns

`Promise`<`string`\>

The id of the callback

___

### stopListener

▸ **stopListener**(`listener`, `callbackId`): `boolean`

Discard a callback

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `listener` | `SimpleListener` | The listener name (e.g onMessage, onAnyMessage, etc.) |
| `callbackId` | `string` | The ID from `listen` |

#### Returns

`boolean`

boolean - true if the callback was found and discarded, false if the callback is not found

___

### connect

▸ `Static` **connect**(`url`, `apiKey?`, `ev?`): `Promise`<[`SocketClient`](/api/classes/connect.SocketClient.md) & `Client`\>

The main way to create the socket based client.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `url` | `string` | URL of the socket server (i.e the EASY API instance address) |
| `apiKey?` | `string` | optional api key if set |
| `ev?` | `boolean` | - |

#### Returns

`Promise`<[`SocketClient`](/api/classes/connect.SocketClient.md) & `Client`\>

SocketClient
