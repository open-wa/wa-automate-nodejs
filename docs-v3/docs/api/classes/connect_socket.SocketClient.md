---
id: "connect_socket.SocketClient"
title: "Class: SocketClient"
sidebar_label: "SocketClient"
custom_edit_url: null
---

[connect/socket](/api/modules/connect_socket.md).SocketClient

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

• **listeners**: `Object` = `{}`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `onAck` | { `[id: string]`: (`data`: `any`) => `any`;  } |
| `onAddedToGroup` | { `[id: string]`: (`data`: `any`) => `any`;  } |
| `onAnyMessage` | { `[id: string]`: (`data`: `any`) => `any`;  } |
| `onBattery` | { `[id: string]`: (`data`: `any`) => `any`;  } |
| `onBroadcast` | { `[id: string]`: (`data`: `any`) => `any`;  } |
| `onButton` | { `[id: string]`: (`data`: `any`) => `any`;  } |
| `onChatDeleted` | { `[id: string]`: (`data`: `any`) => `any`;  } |
| `onChatOpened` | { `[id: string]`: (`data`: `any`) => `any`;  } |
| `onChatState` | { `[id: string]`: (`data`: `any`) => `any`;  } |
| `onContactAdded` | { `[id: string]`: (`data`: `any`) => `any`;  } |
| `onGlobalParticipantsChanged` | { `[id: string]`: (`data`: `any`) => `any`;  } |
| `onIncomingCall` | { `[id: string]`: (`data`: `any`) => `any`;  } |
| `onLabel` | { `[id: string]`: (`data`: `any`) => `any`;  } |
| `onLogout` | { `[id: string]`: (`data`: `any`) => `any`;  } |
| `onMessage` | { `[id: string]`: (`data`: `any`) => `any`;  } |
| `onMessageDeleted` | { `[id: string]`: (`data`: `any`) => `any`;  } |
| `onNewProduct` | { `[id: string]`: (`data`: `any`) => `any`;  } |
| `onOrder` | { `[id: string]`: (`data`: `any`) => `any`;  } |
| `onPlugged` | { `[id: string]`: (`data`: `any`) => `any`;  } |
| `onReaction` | { `[id: string]`: (`data`: `any`) => `any`;  } |
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
| `M` | extends keyof [`Client`](/api/classes/api_Client.Client.md) |
| `P` | extends [] \| [fn: Function, queueOptions?: Options<default, DefaultAddOptions\>] \| [fn: Function, priority?: number] \| [reason: string] \| [fn: Function, queueOptions?: Options<default, DefaultAddOptions\>] \| [fn: Function] \| [fn: Function] \| [fn: Function] \| [fn: Function] \| [fn: Function] \| [fn: Function] \| [fn: Function] \| [fn: Function] \| [fn: Function] \| [fn: Function] \| [fn: Function] \| [fn: Function] \| [fn: Function] \| [fn: Function] \| [fn: Function] \| [fn: Function] \| [fn: Function] \| [fn: Function] \| [fn: Function] \| [fn: Function] \| [simpleListener?: SimpleListener] \| [messageId: MessageId] \| [messageId: MessageId] \| [to: ChatId, url: string, filename: string, caption: Content, quotedMsgId?: MessageId, requestConfig: AxiosRequestConfig<any\>, waitForId?: boolean, ptt?: boolean, withoutPreview?: boolean, hideTags?: boolean, viewOnce?: boolean] \| [to: ChatId, url: string, text?: Content, thumbnail?: Base64] \| [thumb: string, url: string, title: string, description: string, text: Content, chatId: ChatId] \| [chatId: ChatId] \| [to: ChatId, file: DataURL \| FilePath, filename: string, caption: Content, quotedMsgId?: MessageId, waitForId?: boolean, ptt?: boolean, withoutPreview?: boolean, hideTags?: boolean, viewOnce?: boolean] \| [to: ChatId, file: DataURL \| FilePath, filename: string, caption: Content, quotedMsgId?: MessageId, waitForId?: boolean, ptt?: boolean, withoutPreview?: boolean, hideTags?: boolean, viewOnce?: boolean] \| [groupId: GroupChatId] \| [contactId: ContactId] \| [groupId: GroupChatId, image: DataURL] \| [to: ChatId, image: string \| Base64 \| DataURL \| Buffer, stickerMetadata?: StickerMetadata] \| [to: ChatId, messageId: MessageId, webpBase64: Base64, animated: boolean] \| [to: ChatId, webpBase64: Base64, animated: boolean] \| [url: string] \| [to: ChatId, emojiId: string, messageId?: MessageId] \| [data: JsonObject, event: SimpleListener, extras?: JsonObject] \| [c: ChatId \| Message \| Chat, filter: CollectorFilter<[Message]\>, options: CollectorOptions] \| [message: MessageId \| Message] \| [chatId: ChatId, payload: Object] \| [url: string, optionsOverride: any] \| [listener: SimpleListener] \| [groupId: GroupChatId, fn: Function, legacy: boolean] \| [chatId: ChatId, fn: Function] \| [callbackToTest: SimpleListener, testData: any] \| [available: boolean] \| [newStatus: string] \| [label: string] \| [label: string, chatId: ChatId] \| [label: string, chatId: ChatId] \| [label: string] \| [chatId: ChatId, vcard: string, contactName?: string, contactNumber?: string] \| [newName: string] \| [chatState: ChatState, chatId: ChatId] \| [chatId: ChatId] \| [chatId: ChatId] \| [to: ChatId, content: Content] \| [to: ChatId, content: Content, hideTags?: boolean, mentions?: ContactId[]] \| [to: ChatId, amount: number, currency: string, message?: string] \| [to: ChatId, body: string \| LocationButtonBody, buttons: Button[], title?: string, footer?: string] \| [to: ChatId, body: string \| LocationButtonBody, buttons: AdvancedButton[], text: string, footer: string, filename: string] \| [to: ChatId, base64: Base64] \| [to: ChatId, sections: Section[], title: string, description: string, actionText: string] \| [to: ChatId, content: Content, replyMessageId: MessageId, hideTags?: boolean, mentions?: ContactId[]] \| [groupId: GroupChatId, content: Content, hideTags?: boolean, formatting?: string, messageBeforeTags?: boolean] \| [to: ChatId, lat: string, lng: string, loc: string, address?: string, url?: string] \| [userA?: string] \| [to: ChatId, url: string, text: Content, thumbnail?: Base64] \| [to: ChatId, content: Content, quotedMsgId: MessageId, sendSeen?: boolean] \| [contactId: ContactId] \| [groupChatId: GroupChatId] \| [to: ChatId, file: DataURL \| FilePath, quotedMsgId: MessageId] \| [to: ChatId, file: DataURL \| FilePath, quotedMsgId?: MessageId] \| [to: ChatId, file: DataURL \| FilePath, filename: string, caption: Content, quotedMsgId?: MessageId, requestConfig: AxiosRequestConfig<any\>] \| [to: ChatId, giphyMediaUrl: string, caption: Content] \| [chatId?: ChatId] \| [id: ContactId] \| [to: ChatId, image: Base64, caption: Content, bizNumber: ContactId, productId: string] \| [to: ChatId, image: DataURL, productData: CustomProduct] \| [to: ChatId, contactId: ContactId \| ContactId[]] \| [to: ChatId, contactIds: ContactId[]] \| [to: ChatId, on: boolean] \| [to: ChatId, on: boolean] \| [id: ChatId, archive: boolean] \| [id: ChatId, pin: boolean] \| [chatId: ChatId, muteDuration: ChatMuteDuration] \| [chatId: ChatId] \| [chatId: ChatId] \| [to: ChatId, messages: MessageId \| MessageId[], skipMyMessages: boolean] \| [to: ChatId, messageId: MessageId] \| [preserveSessionData: boolean] \| [withNewMessageOnly: boolean] \| [withNewMessageOnly: boolean] \| [withNewMessagesOnly: boolean] \| [groupId: GroupChatId] \| [link: string, returnChatObj?: boolean] \| [id: ContactId] \| [id: ChatId] \| [id: ContactId] \| [groupId: GroupChatId] \| [msgId: MessageId] \| [groupId: GroupChatId] \| [contactId: ContactId] \| [messageId: MessageId] \| [id: string \| MessageId] \| [name: string, price: number, currency: string, images: string[], description: string, url?: string, internalId?: string, isHidden?: boolean] \| [productId: string, name?: string, price?: number, currency?: string, images?: DataURL[], description?: string, url?: string, internalId?: string, isHidden?: boolean] \| [chatId: ChatId, productId: string] \| [productId: string] \| [chatId?: ChatId] \| [chatId?: ChatId] \| [messageId: MessageId] \| [messageId: MessageId] \| [messageId: MessageId, emoji: string] \| [messageId: MessageId] \| [contactId: ContactId] \| [contactId: ContactId] \| [chatId: ChatId] \| [chatId: ChatId] \| [chatId: ChatId] \| [chatId: ChatId] \| [contactId: ContactId] \| [contactId: ContactId] \| [contactId: ContactId] \| [contactId: ContactId, timestamp: number] \| [chatId: ChatId] \| [chatId: ChatId] \| [chatId: ChatId] \| [link: string] \| [chatId: ChatId] \| [chatId: ChatId, messageId: MessageId \| MessageId[], onlyLocal: boolean] \| [contactId: ContactId] \| [includeMe: boolean, includeNotifications: boolean, use\_unread\_count: boolean] \| [chatId: ChatId, includeMe: boolean, includeNotifications: boolean] \| [chatId: ChatId, includeMe: boolean, includeNotifications: boolean] \| [groupName: string, contacts: ContactId \| ContactId[]] \| [groupId: GroupChatId, participantId: ContactId] \| [groupId: GroupChatId, url: string, requestConfig: AxiosRequestConfig<any\>] \| [groupId: GroupChatId, participantId: ContactId \| ContactId[]] \| [groupId: GroupChatId, participantId: ContactId \| ContactId[]] \| [groupId: GroupChatId, participantId: ContactId \| ContactId[]] \| [groupId: GroupChatId, onlyAdmins: boolean] \| [groupId: GroupChatId, onlyAdmins: boolean] \| [groupId: GroupChatId, description: string] \| [groupId: GroupChatId, title: string] \| [groupId: GroupChatId] \| [hex: string] \| [activate: boolean] \| [message?: string] \| [messageId: MessageId] \| [to: ChatId, url: string, requestConfig: AxiosRequestConfig<any\>, stickerMetadata?: StickerMetadata] \| [to: ChatId, url: string, messageId: MessageId, requestConfig: AxiosRequestConfig<any\>, stickerMetadata?: StickerMetadata] \| [to: ChatId, image: string \| Base64 \| DataURL \| Buffer, messageId: MessageId, stickerMetadata?: StickerMetadata] \| [namespace: namespace, id: string, property: string] \| [to: ChatId, file: string \| Base64 \| DataURL \| Buffer, processOptions: Mp4StickerConversionProcessOptions, stickerMetadata?: StickerMetadata, messageId?: MessageId] \| [chatId: ChatId, ephemeral: boolean \| EphemeralDuration] \| [to: ChatId, giphyMediaUrl: string \| URL] \| [text: Content, textRgba: string, backgroundRgba: string, font: number] \| [data: DataURL, caption: Content] \| [data: DataURL, caption: Content] \| [statusesToDelete: string \| string[]] \| [id: string] \| [ts?: number] \| [startingFrom?: number] \| [message: Message] \| [data: DataURL] \| [useSessionIdInPath: boolean] \| [webhookId: string] \| [webhookId: string, events: SimpleListener[] \| "all"] \| [url: string, events: SimpleListener[] \| "all", requestConfig: AxiosRequestConfig<any\>, concurrency: number] \| [c: ChatId \| Message \| Chat, filter: CollectorFilter<[Message]\>, options: AwaitMessagesOptions] |

#### Parameters

| Name | Type |
| :------ | :------ |
| `method` | `M` |
| `args?` | `any`[] \| `P` \| { `[k: string]`: `unknown`;  } |

#### Returns

`Promise`<`unknown`\>

___

### createMessageCollector

▸ **createMessageCollector**(`c`, `filter`, `options`): `Promise`<[`MessageCollector`](/api/classes/structures_MessageCollector.MessageCollector.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `c` | [`ChatId`](/api/types/api_model_aliases.ChatId.md) \| [`Message`](/api/interfaces/api_model_message.Message.md) \| [`Chat`](/api/types/api_model_chat.Chat.md) |
| `filter` | [`CollectorFilter`](/api/types/structures_Collector.CollectorFilter.md)<[[`Message`](/api/interfaces/api_model_message.Message.md)]\> |
| `options` | [`CollectorOptions`](/api/interfaces/structures_Collector.CollectorOptions.md) |

#### Returns

`Promise`<[`MessageCollector`](/api/classes/structures_MessageCollector.MessageCollector.md)\>

___

### listen

▸ **listen**(`listener`, `callback`): `Promise`<`string`\>

Set a callback on a simple listener

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `listener` | [`SimpleListener`](/api/enums/api_model_events.SimpleListener.md) | The listener name (e.g onMessage, onAnyMessage, etc.) |
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
| `listener` | [`SimpleListener`](/api/enums/api_model_events.SimpleListener.md) | The listener name (e.g onMessage, onAnyMessage, etc.) |
| `callbackId` | `string` | The ID from `listen` |

#### Returns

`boolean`

boolean - true if the callback was found and discarded, false if the callback is not found

___

### connect

▸ `Static` **connect**(`url`, `apiKey?`, `ev?`): `Promise`<[`SocketClient`](/api/classes/connect_socket.SocketClient.md) & [`Client`](/api/classes/api_Client.Client.md)\>

The main way to create the socket based client.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `url` | `string` | URL of the socket server (i.e the EASY API instance address) |
| `apiKey?` | `string` | optional api key if set |
| `ev?` | `boolean` | - |

#### Returns

`Promise`<[`SocketClient`](/api/classes/connect_socket.SocketClient.md) & [`Client`](/api/classes/api_Client.Client.md)\>

SocketClient
