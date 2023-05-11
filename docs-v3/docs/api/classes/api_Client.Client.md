---
id: "api_Client.Client"
title: "Class: Client"
sidebar_label: "Client"
custom_edit_url: null
---

[api/Client](/api/modules/api_Client.md).Client

## Methods

### B <div class="label license insiders">insiders</div>

▸ **B**(`chatId`, `payload`): `Promise`<[`MessageId`](/api/types/api_model_aliases.MessageId.md)\>

:::license May require insiders license
Use this link to get the [correct license](https://gum.co/open-wa?wanted=true&tier=Insiders%20Program).
:::

:::danger

Buttons are broken for the foreseeable future. Please DO NOT get a license solely for access to buttons. They are no longer reliable due to recent changes at WA.

:::

Use a raw payload within your open-wa session

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `chatId` | [`ChatId`](/api/types/api_model_aliases.ChatId.md) |  |
| `payload` | `Object` | {any}  returns: MessageId |

#### Returns

`Promise`<[`MessageId`](/api/types/api_model_aliases.MessageId.md)\>

___

### acceptGroupJoinRequest

▸ **acceptGroupJoinRequest**(`messageId`): `Promise`<`boolean`\>

Accepts a request from a recipient to join a group. Takes the message ID of the request message.

#### Parameters

| Name | Type |
| :------ | :------ |
| `messageId` | [`MessageId`](/api/types/api_model_aliases.MessageId.md) |

#### Returns

`Promise`<`boolean`\>

___

### addLabel

▸ **addLabel**(`label`, `chatId`): `Promise`<`boolean`\>

Adds label from chat, message or contact. Only for business accounts.

#### Parameters

| Name | Type |
| :------ | :------ |
| `label` | `string` |
| `chatId` | [`ChatId`](/api/types/api_model_aliases.ChatId.md) |

#### Returns

`Promise`<`boolean`\>

___

### addParticipant

▸ **addParticipant**(`groupId`, `participantId`): `Promise`<`boolean`\>

Add participant to Group

If not a group chat, returns `NOT_A_GROUP_CHAT`.

If the chat does not exist, returns `GROUP_DOES_NOT_EXIST`

If the participantId does not exist in the contacts, returns `NOT_A_CONTACT`

If the host account is not an administrator, returns `INSUFFICIENT_PERMISSIONS`

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `groupId` | [`GroupChatId`](/api/types/api_model_aliases.GroupChatId.md) | '0000000000-00000000@g.us' |
| `participantId` | [`ContactId`](/api/types/api_model_aliases.ContactId.md) \| [`ContactId`](/api/types/api_model_aliases.ContactId.md)[] | '000000000000@c.us' |

#### Returns

`Promise`<`boolean`\>

___

### approveGroupJoinRequest

▸ **approveGroupJoinRequest**(`groupChatId`, `contactId`): `Promise`<`string` \| `boolean`\>

Approves a group join request

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `groupChatId` | [`GroupChatId`](/api/types/api_model_aliases.GroupChatId.md) | The group chat id |
| `contactId` | [`ContactId`](/api/types/api_model_aliases.ContactId.md) | The contact id of the person who is requesting to join the group |

#### Returns

`Promise`<`string` \| `boolean`\>

`Promise<boolean>`

___

### archiveChat

▸ **archiveChat**(`id`, `archive`): `Promise`<`boolean`\>

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `id` | [`ChatId`](/api/types/api_model_aliases.ChatId.md) | The id of the conversation |
| `archive` | `boolean` | boolean true => archive, false => unarchive |

#### Returns

`Promise`<`boolean`\>

boolean true: worked, false: didnt work (probably already in desired state)

___

### autoReject

▸ **autoReject**(`message?`): `Promise`<`boolean`\>

Automatically reject calls on the host account device. Please note that the device that is calling you will continue to ring.

Update: Due to the nature of MD, the host account will continue ringing.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `message?` | `string` | optional message to send to the calling account when their call is detected and rejected |

#### Returns

`Promise`<`boolean`\>

___

### awaitMessages

▸ **awaitMessages**(`c`, `filter`, `options?`): `Promise`<[`Collection`](/api/classes/structures_Collector.Collection.md)<`string`, [`Message`](/api/interfaces/api_model_message.Message.md)\>\>

[FROM DISCORDJS]
Similar to createMessageCollector but in promise form.
Resolves with a collection of messages that pass the specified filter.

**`Example`**

```javascript
// Await !vote messages
const filter = m => m.body.startsWith('!vote');
// Errors: ['time'] treats ending because of the time limit as an error
channel.awaitMessages(filter, { max: 4, time: 60000, errors: ['time'] })
  .then(collected => console.log(collected.size))
  .catch(collected => console.log(`After a minute, only ${collected.size} out of 4 voted.`));
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `c` | [`ChatId`](/api/types/api_model_aliases.ChatId.md) \| [`Message`](/api/interfaces/api_model_message.Message.md) \| [`Chat`](/api/types/api_model_chat.Chat.md) | The Mesasge/Chat or Chat Id to base this message colletor on |
| `filter` | [`CollectorFilter`](/api/types/structures_Collector.CollectorFilter.md)<[[`Message`](/api/interfaces/api_model_message.Message.md)]\> | The filter function to use |
| `options?` | [`AwaitMessagesOptions`](/api/interfaces/structures_Collector.AwaitMessagesOptions.md) | Optional options to pass to the internal collector |

#### Returns

`Promise`<[`Collection`](/api/classes/structures_Collector.Collection.md)<`string`, [`Message`](/api/interfaces/api_model_message.Message.md)\>\>

___

### checkNumberStatus

▸ **checkNumberStatus**(`contactId`): `Promise`<[`NumberCheck`](/api/interfaces/api_model_contact.NumberCheck.md)\>

Checks if a number is a valid WA number

#### Parameters

| Name | Type |
| :------ | :------ |
| `contactId` | [`ContactId`](/api/types/api_model_aliases.ContactId.md) |

#### Returns

`Promise`<[`NumberCheck`](/api/interfaces/api_model_contact.NumberCheck.md)\>

___

### checkReadReceipts <div class="label license insiders">insiders</div>

▸ **checkReadReceipts**(`contactId`): `Promise`<`string` \| `boolean`\>

:::license May require insiders license
Use this link to get the [correct license](https://gum.co/open-wa?wanted=true&tier=Insiders%20Program).
:::

Check if a recipient has read receipts on.

This will only work if you have chats sent back and forth between you and the contact 1-1.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `contactId` | [`ContactId`](/api/types/api_model_aliases.ContactId.md) | The Id of the contact with which you have an existing conversation with messages already. |

#### Returns

`Promise`<`string` \| `boolean`\>

`Promise<string | boolean>` true or false or a string with an explaintaion of why it wasn't able to determine the read receipts.

___

### clearAllChats

▸ **clearAllChats**(`ts?`): `Promise`<`boolean`\>

Clears all chats of all messages. This does not delete chats. Please be careful with this as it will remove all messages from whatsapp web and the host device. This feature is great for privacy focussed bots.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `ts?` | `number` | number A chat that has had a message after ts (epoch timestamp) will not be cleared. |

#### Returns

`Promise`<`boolean`\>

___

### clearChat

▸ **clearChat**(`chatId`): `Promise`<`boolean`\>

Delete all messages from the chat.

#### Parameters

| Name | Type |
| :------ | :------ |
| `chatId` | [`ChatId`](/api/types/api_model_aliases.ChatId.md) |

#### Returns

`Promise`<`boolean`\>

boolean

___

### contactBlock

▸ **contactBlock**(`id`): `Promise`<`boolean`\>

Block contact

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `id` | [`ContactId`](/api/types/api_model_aliases.ContactId.md) | '000000000000@c.us' |

#### Returns

`Promise`<`boolean`\>

___

### contactUnblock

▸ **contactUnblock**(`id`): `Promise`<`boolean`\>

Unblock contact

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `id` | [`ContactId`](/api/types/api_model_aliases.ContactId.md) | '000000000000@c.us' |

#### Returns

`Promise`<`boolean`\>

___

### createCommunity <div class="label license insiders">insiders</div>

▸ **createCommunity**(`communityName`, `communitySubject`, `icon`, `existingGroups?`, `newGroups?`): `Promise`<\`${number}@g.us\`\>

:::license May require insiders license
Use this link to get the [correct license](https://gum.co/open-wa?wanted=true&tier=Insiders%20Program).
:::

Create a new community

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `communityName` | `string` | `undefined` | The community name |
| `communitySubject` | `string` | `undefined` | - |
| `icon` | [`DataURL`](/api/types/api_model_aliases.DataURL.md) | `undefined` | DataURL of a 1:1 ratio jpeg for the community icon |
| `existingGroups` | [`GroupChatId`](/api/types/api_model_aliases.GroupChatId.md)[] | `[]` | An array of existing group IDs, that are not already part of a community, to add to this new community. |
| `newGroups?` | [`NewCommunityGroup`](/api/interfaces/api_model_group_metadata.NewCommunityGroup.md)[] | `undefined` | An array of new group objects that |

#### Returns

`Promise`<\`${number}@g.us\`\>

___

### createGroup

▸ **createGroup**(`groupName`, `contacts`): `Promise`<[`GroupChatCreationResponse`](/api/interfaces/api_model_chat.GroupChatCreationResponse.md)\>

Create a group and add contacts to it

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `groupName` | `string` | group name: 'New group' |
| `contacts` | [`ContactId`](/api/types/api_model_aliases.ContactId.md) \| [`ContactId`](/api/types/api_model_aliases.ContactId.md)[] | - |

#### Returns

`Promise`<[`GroupChatCreationResponse`](/api/interfaces/api_model_chat.GroupChatCreationResponse.md)\>

___

### createLabel <div class="label license insiders">insiders</div>

▸ **createLabel**(`label`): `Promise`<`string` \| `boolean`\>

:::license May require insiders license
Use this link to get the [correct license](https://gum.co/open-wa?wanted=true&tier=Insiders%20Program).
:::

Adds label from chat, message or contact. Only for business accounts.

#### Parameters

| Name | Type |
| :------ | :------ |
| `label` | `string` |

#### Returns

`Promise`<`string` \| `boolean`\>

`false` if something went wrong, or the id (usually a number as a string) of the new label (for example `"58"`)

___

### createMessageCollector

▸ **createMessageCollector**(`c`, `filter`, `options`): [`MessageCollector`](/api/classes/structures_MessageCollector.MessageCollector.md)

Returns a new message collector for the chat which is related to the first parameter c

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `c` | [`ChatId`](/api/types/api_model_aliases.ChatId.md) \| [`Message`](/api/interfaces/api_model_message.Message.md) \| [`Chat`](/api/types/api_model_chat.Chat.md) | The Mesasge/Chat or Chat Id to base this message colletor on |
| `filter` | [`CollectorFilter`](/api/types/structures_Collector.CollectorFilter.md)<[[`Message`](/api/interfaces/api_model_message.Message.md)]\> | A function that consumes a [Message] and returns a boolean which determines whether or not the message shall be collected. |
| `options` | [`CollectorOptions`](/api/interfaces/structures_Collector.CollectorOptions.md) | The options for the collector. For example, how long the collector shall run for, how many messages it should collect, how long between messages before timing out, etc. |

#### Returns

[`MessageCollector`](/api/classes/structures_MessageCollector.MessageCollector.md)

___

### createNewProduct <div class="label license insiders">insiders</div>

▸ **createNewProduct**(`name`, `price`, `currency`, `images`, `description`, `url?`, `internalId?`, `isHidden?`): `Promise`<[`Product`](/api/interfaces/api_model_product.Product.md)\>

:::license May require insiders license
Use this link to get the [correct license](https://gum.co/open-wa?wanted=true&tier=Insiders%20Program).
:::

Add a product to your catalog

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `name` | `string` | The name of the product |
| `price` | `number` | The price of the product |
| `currency` | `string` | The 3-letter currenct code for the product |
| `images` | `string`[] | An array of dataurl or base64 strings of product images, the first image will be used as the main image. At least one image is required. |
| `description` | `string` | optional, the description of the product |
| `url?` | `string` | The url of the product for more information |
| `internalId?` | `string` | The internal/backoffice id of the product |
| `isHidden?` | `boolean` | Whether or not the product is shown publicly in your catalog |

#### Returns

`Promise`<[`Product`](/api/interfaces/api_model_product.Product.md)\>

product object

___

### cutChatCache

▸ **cutChatCache**(): `Promise`<{ `after`: { `chats`: `number` ; `msgs`: `number`  } ; `before`: { `chats`: `number` ; `msgs`: `number`  }  }\>

This simple function halves the amount of chats in your session message cache. This does not delete messages off your phone. If over a day you've processed 4000 messages this will possibly result in 4000 messages being present in your session.
Calling this method will cut the message cache as much as possible, reducing the memory usage of your process.
You should use this in conjunction with `getAmountOfLoadedMessages` to intelligently control the session message cache.

#### Returns

`Promise`<{ `after`: { `chats`: `number` ; `msgs`: `number`  } ; `before`: { `chats`: `number` ; `msgs`: `number`  }  }\>

___

### cutMsgCache

▸ **cutMsgCache**(): `Promise`<`number`\>

This simple function halves the amount of messages in your session message cache. This does not delete messages off your phone. If over a day you've processed 4000 messages this will possibly result in 4000 messages being present in your session.
Calling this method will cut the message cache to 2000 messages, therefore reducing the memory usage of your process.
You should use this in conjunction with `getAmountOfLoadedMessages` to intelligently control the session message cache.

#### Returns

`Promise`<`number`\>

___

### darkMode

▸ **darkMode**(`activate`): `Promise`<`boolean`\>

Start dark mode [NOW GENERALLY AVAILABLE]

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `activate` | `boolean` | true to activate dark mode, false to deactivate |

#### Returns

`Promise`<`boolean`\>

___

### decryptMedia

▸ **decryptMedia**(`message`): `Promise`<[`DataURL`](/api/types/api_model_aliases.DataURL.md)\>

Decrypts a media message.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `message` | [`MessageId`](/api/types/api_model_aliases.MessageId.md) \| [`Message`](/api/interfaces/api_model_message.Message.md) | This can be the serialized MessageId or the whole Message object. It is advised to just use the serialized message ID. |

#### Returns

`Promise`<[`DataURL`](/api/types/api_model_aliases.DataURL.md)\>

`Promise<[[DataURL]]>`

___

### deleteAllStatus

▸ **deleteAllStatus**(): `Promise`<`boolean`\>

**`Deprecated`**

Alias for deleteStory

#### Returns

`Promise`<`boolean`\>

___

### deleteAllStories <div class="label license restricted">restricted</div>

▸ **deleteAllStories**(): `Promise`<`boolean`\>

:::license May require restricted license
Use this link to get the [correct license](https://gum.co/open-wa?wanted=true&tier=1%20Restricted%20License).
:::

Deletes all your existing stories.

#### Returns

`Promise`<`boolean`\>

boolean. True if it worked.

___

### deleteChat

▸ **deleteChat**(`chatId`): `Promise`<`boolean`\>

Delete the conversation from your WA

#### Parameters

| Name | Type |
| :------ | :------ |
| `chatId` | [`ChatId`](/api/types/api_model_aliases.ChatId.md) |

#### Returns

`Promise`<`boolean`\>

boolean

___

### deleteMessage

▸ **deleteMessage**(`chatId`, `messageId`, `onlyLocal?`): `Promise`<`void`\>

Deletes message of given message id

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `chatId` | [`ChatId`](/api/types/api_model_aliases.ChatId.md) | `undefined` | The chat id from which to delete the message. |
| `messageId` | [`MessageId`](/api/types/api_model_aliases.MessageId.md) \| [`MessageId`](/api/types/api_model_aliases.MessageId.md)[] | `undefined` | The specific message id of the message to be deleted |
| `onlyLocal` | `boolean` | `false` | If it should only delete locally (message remains on the other recipienct's phone). Defaults to false. |

#### Returns

`Promise`<`void`\>

nothing

___

### deleteStaleChats

▸ **deleteStaleChats**(`startingFrom?`): `Promise`<`boolean`\>

Deletes chats from a certain index (default 1000). E.g if this startingFrom param is `100` then all chats from index `100` onwards will be deleted.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `startingFrom?` | `number` | the chat index to start from. Please do not set this to anything less than 10 @default: `1000` |

#### Returns

`Promise`<`boolean`\>

___

### deleteStatus

▸ **deleteStatus**(`statusesToDelete`): `Promise`<`boolean`\>

**`Deprecated`**

Alias for deleteStory

#### Parameters

| Name | Type |
| :------ | :------ |
| `statusesToDelete` | `string` \| `string`[] |

#### Returns

`Promise`<`boolean`\>

___

### deleteStory <div class="label license restricted">restricted</div>

▸ **deleteStory**(`statusesToDelete`): `Promise`<`boolean`\>

:::license May require restricted license
Use this link to get the [correct license](https://gum.co/open-wa?wanted=true&tier=1%20Restricted%20License).
:::

Consumes a list of id strings of stories to delete.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `statusesToDelete` | `string` \| `string`[] | string [] \| string an array of ids of stories to delete. |

#### Returns

`Promise`<`boolean`\>

boolean. True if it worked.

___

### demoteParticipant

▸ **demoteParticipant**(`groupId`, `participantId`): `Promise`<`boolean`\>

Demote Admin of Group

If not a group chat, returns `NOT_A_GROUP_CHAT`.

If the chat does not exist, returns `GROUP_DOES_NOT_EXIST`

If the participantId does not exist in the group chat, returns `NOT_A_PARTICIPANT`

If the host account is not an administrator, returns `INSUFFICIENT_PERMISSIONS`

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `groupId` | [`GroupChatId`](/api/types/api_model_aliases.GroupChatId.md) | '0000000000-00000000@g.us' |
| `participantId` | [`ContactId`](/api/types/api_model_aliases.ContactId.md) \| [`ContactId`](/api/types/api_model_aliases.ContactId.md)[] | '000000000000@c.us' |

#### Returns

`Promise`<`boolean`\>

___

### download

▸ **download**(`url`, `optionsOverride?`): `Promise`<[`DataURL`](/api/types/api_model_aliases.DataURL.md)\>

A convinience method to download the DataURL of a file

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `url` | `string` | The url |
| `optionsOverride` | `any` | You can use this to override the [axios request config](https://github.com/axios/axios#request-config) |

#### Returns

`Promise`<[`DataURL`](/api/types/api_model_aliases.DataURL.md)\>

`Promise<DataURL>`

___

### downloadFileWithCredentials

▸ **downloadFileWithCredentials**(`url`): `Promise`<[`Base64`](/api/types/api_model_aliases.Base64.md)\>

Download via the browsers authenticated session via URL.

#### Parameters

| Name | Type |
| :------ | :------ |
| `url` | `string` |

#### Returns

`Promise`<[`Base64`](/api/types/api_model_aliases.Base64.md)\>

base64 string (non-data url)

___

### downloadProfilePicFromMessage

▸ **downloadProfilePicFromMessage**(`message`): `Promise`<[`Base64`](/api/types/api_model_aliases.Base64.md)\>

Download profile pics from the message object.
```javascript
 const filename = `profilepic_${message.from}.jpeg`;
 const data = await client.downloadProfilePicFromMessage(message);
 const dataUri = `data:image/jpeg;base64,${data}`;
 fs.writeFile(filename, mData, 'base64', function(err) {
   if (err) {
     return console.log(err);
   }
   console.log('The file was saved!');
 });
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `message` | [`Message`](/api/interfaces/api_model_message.Message.md) |

#### Returns

`Promise`<[`Base64`](/api/types/api_model_aliases.Base64.md)\>

___

### editMessage

▸ **editMessage**(`messageId`, `text`): `Promise`<`boolean` \| [`MessageId`](/api/types/api_model_aliases.MessageId.md)\>

NOTE: This is experimental, most accounts do not have access to this feature in their apps.

Edit an existing message

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `messageId` | [`MessageId`](/api/types/api_model_aliases.MessageId.md) | The message ID to edit |
| `text` | [`Content`](/api/types/api_model_aliases.Content.md) | The new text content |

#### Returns

`Promise`<`boolean` \| [`MessageId`](/api/types/api_model_aliases.MessageId.md)\>

___

### editProduct <div class="label license insiders">insiders</div>

▸ **editProduct**(`productId`, `name?`, `price?`, `currency?`, `images?`, `description?`, `url?`, `internalId?`, `isHidden?`): `Promise`<[`Product`](/api/interfaces/api_model_product.Product.md)\>

:::license May require insiders license
Use this link to get the [correct license](https://gum.co/open-wa?wanted=true&tier=Insiders%20Program).
:::

Edit a product in your catalog

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `productId` | `string` | The catalog ID of the product |
| `name?` | `string` | The name of the product |
| `price?` | `number` | The price of the product |
| `currency?` | `string` | The 3-letter currenct code for the product |
| `images?` | [`DataURL`](/api/types/api_model_aliases.DataURL.md)[] | An array of dataurl or base64 strings of product images, the first image will be used as the main image. At least one image is required. |
| `description?` | `string` | optional, the description of the product |
| `url?` | `string` | The url of the product for more information |
| `internalId?` | `string` | The internal/backoffice id of the product |
| `isHidden?` | `boolean` | Whether or not the product is shown publicly in your catalog |

#### Returns

`Promise`<[`Product`](/api/interfaces/api_model_product.Product.md)\>

product object

___

### emitUnreadMessages

▸ **emitUnreadMessages**(): `Promise`<[`MessageId`](/api/types/api_model_aliases.MessageId.md)[]\>

Fires all unread messages to the onMessage listener.
Make sure to call this AFTER setting your listeners.

#### Returns

`Promise`<[`MessageId`](/api/types/api_model_aliases.MessageId.md)[]\>

array of message IDs

___

### forceRefocus

▸ **forceRefocus**(): `Promise`<`boolean`\>

This is a convinient method to click the `Use Here` button in the WA web session.

Use this when STATE is `CONFLICT`. You can read more about managing state here:

Detecting Logouts

#### Returns

`Promise`<`boolean`\>

___

### forceStaleMediaUpdate <div class="label license insiders">insiders</div>

▸ **forceStaleMediaUpdate**(`messageId`): `Promise`<``false`` \| [`Message`](/api/interfaces/api_model_message.Message.md)\>

:::license May require insiders license
Use this link to get the [correct license](https://gum.co/open-wa?wanted=true&tier=Insiders%20Program).
:::

If a file is old enough, it will 404 if you try to decrypt it. This will allow you to force the host account to re upload the file and return a decryptable message.

if you run this without a valid insiders key, it will return false and cause an error upon decryption.

#### Parameters

| Name | Type |
| :------ | :------ |
| `messageId` | [`MessageId`](/api/types/api_model_aliases.MessageId.md) |

#### Returns

`Promise`<``false`` \| [`Message`](/api/interfaces/api_model_message.Message.md)\>

Message OR `false`

___

### forceUpdateConnectionState

▸ **forceUpdateConnectionState**(`killBeforeReconnect?`): `Promise`<[`STATE`](/api/enums/api_model.STATE.md)\>

Forces the session to update the connection state.

#### Parameters

| Name | Type |
| :------ | :------ |
| `killBeforeReconnect?` | `boolean` |

#### Returns

`Promise`<[`STATE`](/api/enums/api_model.STATE.md)\>

updated connection state

___

### forceUpdateLiveLocation

▸ **forceUpdateLiveLocation**(`chatId`): `Promise`<`boolean` \| [`LiveLocationChangedEvent`](/api/interfaces/api_model_chat.LiveLocationChangedEvent.md)[]\>

A list of participants in the chat who have their live location on. If the chat does not exist, or the chat does not have any contacts actively sharing their live locations, it will return false. If it's a chat with a single contact, there will be only 1 value in the array if the contact has their livelocation on.
Please note. This should only be called once every 30 or so seconds. This forces the phone to grab the latest live location data for the number. This can be used in conjunction with onLiveLocation (this will trigger onLiveLocation).

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `chatId` | [`ChatId`](/api/types/api_model_aliases.ChatId.md) | string Id of the chat you want to force the phone to get the livelocation data for. |

#### Returns

`Promise`<`boolean` \| [`LiveLocationChangedEvent`](/api/interfaces/api_model_chat.LiveLocationChangedEvent.md)[]\>

`Promise<LiveLocationChangedEvent []>` | boolean

___

### forwardMessages

▸ **forwardMessages**(`to`, `messages`, `skipMyMessages`): `Promise`<`boolean` \| [`MessageId`](/api/types/api_model_aliases.MessageId.md)[]\>

Forward an array of messages to a specific chat using the message ids or Objects

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `to` | [`ChatId`](/api/types/api_model_aliases.ChatId.md) | '000000000000@c.us' |
| `messages` | [`MessageId`](/api/types/api_model_aliases.MessageId.md) \| [`MessageId`](/api/types/api_model_aliases.MessageId.md)[] | this can be any mixture of message ids or message objects |
| `skipMyMessages` | `boolean` | This indicates whether or not to skip your own messages from the array |

#### Returns

`Promise`<`boolean` \| [`MessageId`](/api/types/api_model_aliases.MessageId.md)[]\>

___

### gc

▸ **gc**(): `Promise`<`void`\>

It calls the JavaScript garbage collector

#### Returns

`Promise`<`void`\>

Nothing.

___

### getAllChatIds

▸ **getAllChatIds**(): `Promise`<[`ChatId`](/api/types/api_model_aliases.ChatId.md)[]\>

retrieves all Chat Ids

#### Returns

`Promise`<[`ChatId`](/api/types/api_model_aliases.ChatId.md)[]\>

array of [ChatId]

___

### getAllChats

▸ **getAllChats**(`withNewMessageOnly?`): `Promise`<[`Chat`](/api/types/api_model_chat.Chat.md)[]\>

Retrieves all chats

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `withNewMessageOnly` | `boolean` | `false` |

#### Returns

`Promise`<[`Chat`](/api/types/api_model_chat.Chat.md)[]\>

array of [Chat]

___

### getAllChatsWithMessages

▸ **getAllChatsWithMessages**(`withNewMessageOnly?`): `Promise`<[`Chat`](/api/types/api_model_chat.Chat.md)[]\>

**`Deprecated`**

Retrieves all chats with messages

Please use `getAllUnreadMessages` instead of this to see all messages indicated by the green dots in the chat.

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `withNewMessageOnly` | `boolean` | `false` |

#### Returns

`Promise`<[`Chat`](/api/types/api_model_chat.Chat.md)[]\>

array of [Chat]

___

### getAllCommunities

▸ **getAllCommunities**(): `Promise`<\`${number}@g.us\`[]\>

Retrieve all commmunity Ids

#### Returns

`Promise`<\`${number}@g.us\`[]\>

array of group ids

___

### getAllContacts

▸ **getAllContacts**(): `Promise`<[`Contact`](/api/interfaces/api_model_contact.Contact.md)[]\>

Retrieves all contacts

#### Returns

`Promise`<[`Contact`](/api/interfaces/api_model_contact.Contact.md)[]\>

array of [Contact]

___

### getAllGroups

▸ **getAllGroups**(`withNewMessagesOnly?`): `Promise`<[`Chat`](/api/types/api_model_chat.Chat.md)[]\>

Retrieve all groups

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `withNewMessagesOnly` | `boolean` | `false` |

#### Returns

`Promise`<[`Chat`](/api/types/api_model_chat.Chat.md)[]\>

array of groups

___

### getAllLabels

▸ **getAllLabels**(): `Promise`<[`Label`](/api/interfaces/api_model_label.Label.md)[]\>

Returns all labels and the corresponding tagged items.

#### Returns

`Promise`<[`Label`](/api/interfaces/api_model_label.Label.md)[]\>

___

### getAllMessagesInChat

▸ **getAllMessagesInChat**(`chatId`, `includeMe`, `includeNotifications`): `Promise`<[`Message`](/api/interfaces/api_model_message.Message.md)[]\>

Retrieves all Messages in a chat that have been loaded within the WA web instance.

This does not load every single message in the chat history.

#### Parameters

| Name | Type |
| :------ | :------ |
| `chatId` | [`ChatId`](/api/types/api_model_aliases.ChatId.md) |
| `includeMe` | `boolean` |
| `includeNotifications` | `boolean` |

#### Returns

`Promise`<[`Message`](/api/interfaces/api_model_message.Message.md)[]\>

Message[]

___

### getAllNewMessages

▸ **getAllNewMessages**(): `Promise`<[`Message`](/api/interfaces/api_model_message.Message.md)[]\>

Retrieves all new Messages. where isNewMsg==true

#### Returns

`Promise`<[`Message`](/api/interfaces/api_model_message.Message.md)[]\>

list of messages

___

### getAllUnreadMessages

▸ **getAllUnreadMessages**(): `Promise`<[`Message`](/api/interfaces/api_model_message.Message.md)[]\>

Retrieves all unread Messages. where ack==-1

#### Returns

`Promise`<[`Message`](/api/interfaces/api_model_message.Message.md)[]\>

list of messages

___

### getAmountOfLoadedMessages

▸ **getAmountOfLoadedMessages**(): `Promise`<`number`\>

Easily get the amount of messages loaded up in the session. This will allow you to determine when to clear chats/cache.

#### Returns

`Promise`<`number`\>

___

### getBatteryLevel

▸ **getBatteryLevel**(): `Promise`<`number`\>

Retrieves Battery Level

#### Returns

`Promise`<`number`\>

Number

___

### getBlockedIds

▸ **getBlockedIds**(): `Promise`<[`ChatId`](/api/types/api_model_aliases.ChatId.md)[]\>

retrieves an array of IDs of accounts blocked by the host account.

#### Returns

`Promise`<[`ChatId`](/api/types/api_model_aliases.ChatId.md)[]\>

`Promise<ChatId[]>`

___

### getBusinessProfile

▸ **getBusinessProfile**(`id`): `Promise`<[`BusinessProfile`](/api/interfaces/api_model_contact.BusinessProfile.md)\>

Get the business info of a given contact id

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `id` | [`ContactId`](/api/types/api_model_aliases.ContactId.md) | id of business profile (i.e the number with @c.us) |

#### Returns

`Promise`<[`BusinessProfile`](/api/interfaces/api_model_contact.BusinessProfile.md)\>

None

___

### getBusinessProfilesProducts

▸ **getBusinessProfilesProducts**(`id`): `Promise`<`any`\>

Find any product listings of the given number. Use this to query a catalog

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `id` | [`ContactId`](/api/types/api_model_aliases.ContactId.md) | id of business profile (i.e the number with @c.us) |

#### Returns

`Promise`<`any`\>

None

___

### getChat

▸ **getChat**(`contactId`): `Promise`<[`Chat`](/api/types/api_model_chat.Chat.md)\>

Retrieves chat object of given contact id

#### Parameters

| Name | Type |
| :------ | :------ |
| `contactId` | [`ContactId`](/api/types/api_model_aliases.ContactId.md) |

#### Returns

`Promise`<[`Chat`](/api/types/api_model_chat.Chat.md)\>

contact detial as promise

___

### getChatById

▸ **getChatById**(`contactId`): `Promise`<[`Chat`](/api/types/api_model_chat.Chat.md)\>

Retrieves chat object of given contact id

#### Parameters

| Name | Type |
| :------ | :------ |
| `contactId` | [`ContactId`](/api/types/api_model_aliases.ContactId.md) |

#### Returns

`Promise`<[`Chat`](/api/types/api_model_chat.Chat.md)\>

contact detial as promise

___

### getChatWithNonContacts

▸ **getChatWithNonContacts**(): `Promise`<[`Contact`](/api/interfaces/api_model_contact.Contact.md)[]\>

Returns a list of contact with whom the host number has an existing chat who are also not contacts.

#### Returns

`Promise`<[`Contact`](/api/interfaces/api_model_contact.Contact.md)[]\>

___

### getChatsByLabel

▸ **getChatsByLabel**(`label`): `Promise`<[`Chat`](/api/types/api_model_chat.Chat.md)[]\>

Get an array of chats that match the label parameter. For example, if you want to get an array of chat objects that have the label "New customer".

This method is case insenstive and only works on business host accounts.

**`Label`**

The label name

#### Parameters

| Name | Type |
| :------ | :------ |
| `label` | `string` |

#### Returns

`Promise`<[`Chat`](/api/types/api_model_chat.Chat.md)[]\>

___

### getCommonGroups <div class="label license insiders">insiders</div>

▸ **getCommonGroups**(`contactId`): `Promise`<{ `id`: `string` ; `title`: `string`  }[]\>

:::license May require insiders license
Use this link to get the [correct license](https://gum.co/open-wa?wanted=true&tier=Insiders%20Program).
:::

Retrieves the groups that you have in common with a contact

#### Parameters

| Name | Type |
| :------ | :------ |
| `contactId` | [`ContactId`](/api/types/api_model_aliases.ContactId.md) |

#### Returns

`Promise`<{ `id`: `string` ; `title`: `string`  }[]\>

Promise returning an array of common groups {
id:string,
title:string
}

___

### getCommunityAdminIds

▸ **getCommunityAdminIds**(`communityId`): `Promise`<{ `admins`: [`ContactId`](/api/types/api_model_aliases.ContactId.md)[] ; `id`: [`GroupChatId`](/api/types/api_model_aliases.GroupChatId.md) ; `subgroup`: `boolean`  }[]\>

Retrieves community admin Ids

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `communityId` | [`GroupChatId`](/api/types/api_model_aliases.GroupChatId.md) | community id |

#### Returns

`Promise`<{ `admins`: [`ContactId`](/api/types/api_model_aliases.ContactId.md)[] ; `id`: [`GroupChatId`](/api/types/api_model_aliases.GroupChatId.md) ; `subgroup`: `boolean`  }[]\>

___

### getCommunityAdmins

▸ **getCommunityAdmins**(`communityId`): `Promise`<{ `admins`: [`Contact`](/api/interfaces/api_model_contact.Contact.md)[] ; `id`: [`GroupChatId`](/api/types/api_model_aliases.GroupChatId.md) ; `subgroup`: `boolean`  }[]\>

Retrieves community admins as Contact objects

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `communityId` | [`GroupChatId`](/api/types/api_model_aliases.GroupChatId.md) | community id |

#### Returns

`Promise`<{ `admins`: [`Contact`](/api/interfaces/api_model_contact.Contact.md)[] ; `id`: [`GroupChatId`](/api/types/api_model_aliases.GroupChatId.md) ; `subgroup`: `boolean`  }[]\>

___

### getCommunityInfo

▸ **getCommunityInfo**(`communityId`): `Promise`<[`GroupMetadata`](/api/interfaces/api_model_group_metadata.GroupMetadata.md) & { `subGroups`: [`GroupMetadata`](/api/interfaces/api_model_group_metadata.GroupMetadata.md)[]  }\>

Returns the community metadata. Like group metadata but with a `subGroups` property which is the group metadata of the community subgroups.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `communityId` | [`GroupChatId`](/api/types/api_model_aliases.GroupChatId.md) | community id |

#### Returns

`Promise`<[`GroupMetadata`](/api/interfaces/api_model_group_metadata.GroupMetadata.md) & { `subGroups`: [`GroupMetadata`](/api/interfaces/api_model_group_metadata.GroupMetadata.md)[]  }\>

___

### getCommunityParticipantIds

▸ **getCommunityParticipantIds**(`communityId`): `Promise`<{ `id`: [`GroupChatId`](/api/types/api_model_aliases.GroupChatId.md) ; `participants`: [`ContactId`](/api/types/api_model_aliases.ContactId.md)[] ; `subgroup`: `boolean`  }[]\>

Retrieves community members Ids

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `communityId` | [`GroupChatId`](/api/types/api_model_aliases.GroupChatId.md) | community id |

#### Returns

`Promise`<{ `id`: [`GroupChatId`](/api/types/api_model_aliases.GroupChatId.md) ; `participants`: [`ContactId`](/api/types/api_model_aliases.ContactId.md)[] ; `subgroup`: `boolean`  }[]\>

___

### getCommunityParticipants

▸ **getCommunityParticipants**(`communityId`): `Promise`<{ `id`: [`GroupChatId`](/api/types/api_model_aliases.GroupChatId.md) ; `participants`: [`Contact`](/api/interfaces/api_model_contact.Contact.md)[] ; `subgroup`: `boolean`  }[]\>

Retrieves community members as Contact objects

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `communityId` | [`GroupChatId`](/api/types/api_model_aliases.GroupChatId.md) | community id |

#### Returns

`Promise`<{ `id`: [`GroupChatId`](/api/types/api_model_aliases.GroupChatId.md) ; `participants`: [`Contact`](/api/interfaces/api_model_contact.Contact.md)[] ; `subgroup`: `boolean`  }[]\>

___

### getConfig

▸ **getConfig**(): [`ConfigObject`](/api/interfaces/api_model_config.ConfigObject.md)

Get the config which was used to set up the client. Sensitive details (like devTools username and password, and browserWSEndpoint) are scrubbed

#### Returns

[`ConfigObject`](/api/interfaces/api_model_config.ConfigObject.md)

SessionInfo

___

### getConnectionState

▸ **getConnectionState**(): `Promise`<[`STATE`](/api/enums/api_model.STATE.md)\>

Returns the connection state

#### Returns

`Promise`<[`STATE`](/api/enums/api_model.STATE.md)\>

___

### getContact

▸ **getContact**(`contactId`): `Promise`<[`Contact`](/api/interfaces/api_model_contact.Contact.md)\>

Retrieves contact detail object of given contact id

#### Parameters

| Name | Type |
| :------ | :------ |
| `contactId` | [`ContactId`](/api/types/api_model_aliases.ContactId.md) |

#### Returns

`Promise`<[`Contact`](/api/interfaces/api_model_contact.Contact.md)\>

contact detial as promise

___

### getEventSignature

▸ **getEventSignature**(`simpleListener?`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `simpleListener?` | [`SimpleListener`](/api/enums/api_model_events.SimpleListener.md) |

#### Returns

`string`

___

### getFeatures

▸ **getFeatures**(): `Promise`<`any`\>

Returns an object with properties of internal features and boolean values that represent if the respective feature is enabled or not.

#### Returns

`Promise`<`any`\>

___

### getGeneratedUserAgent

▸ **getGeneratedUserAgent**(`userA?`): `Promise`<`string`\>

Get the generated user agent, this is so you can send it to the decryption module.

#### Parameters

| Name | Type |
| :------ | :------ |
| `userA?` | `string` |

#### Returns

`Promise`<`string`\>

String useragent of wa-web session

___

### getGptArray

▸ **getGptArray**(`chatId`, `last?`): `Promise`<{ `content`: `string` ; `role`: ``"user"`` \| ``"assistant"``  }[]\>

Returns a properly formatted array of messages from to send to the openai api

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `chatId` | [`ChatId`](/api/types/api_model_aliases.ChatId.md) | `undefined` | - |
| `last` | `number` | `10` | The amount of previous messages to retrieve. Defaults to 10 |

#### Returns

`Promise`<{ `content`: `string` ; `role`: ``"user"`` \| ``"assistant"``  }[]\>

___

### getGroupAdmins

▸ **getGroupAdmins**(`groupId`): `Promise`<[`ContactId`](/api/types/api_model_aliases.ContactId.md)[]\>

Get Admins of a Group

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `groupId` | [`GroupChatId`](/api/types/api_model_aliases.GroupChatId.md) | '0000000000-00000000@g.us' |

#### Returns

`Promise`<[`ContactId`](/api/types/api_model_aliases.ContactId.md)[]\>

___

### getGroupApprovalRequests

▸ **getGroupApprovalRequests**(`groupChatId`): `Promise`<[`ContactId`](/api/types/api_model_aliases.ContactId.md)[]\>

Gets the contact IDs of members requesting approval to join the group

#### Parameters

| Name | Type |
| :------ | :------ |
| `groupChatId` | [`GroupChatId`](/api/types/api_model_aliases.GroupChatId.md) |

#### Returns

`Promise`<[`ContactId`](/api/types/api_model_aliases.ContactId.md)[]\>

`Promise<ContactId[]>`

___

### getGroupInfo

▸ **getGroupInfo**(`groupId`): `Promise`<`any`\>

Returns the title and description of a given group id.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `groupId` | [`GroupChatId`](/api/types/api_model_aliases.GroupChatId.md) | group id |

#### Returns

`Promise`<`any`\>

___

### getGroupInviteLink

▸ **getGroupInviteLink**(`chatId`): `Promise`<`string`\>

Retrieves an invite link for a group chat. returns false if chat is not a group.

#### Parameters

| Name | Type |
| :------ | :------ |
| `chatId` | [`ChatId`](/api/types/api_model_aliases.ChatId.md) |

#### Returns

`Promise`<`string`\>

`Promise<string>`

___

### getGroupMembers

▸ **getGroupMembers**(`groupId`): `Promise`<[`Contact`](/api/interfaces/api_model_contact.Contact.md)[]\>

Returns group members [Contact] objects

#### Parameters

| Name | Type |
| :------ | :------ |
| `groupId` | [`GroupChatId`](/api/types/api_model_aliases.GroupChatId.md) |

#### Returns

`Promise`<[`Contact`](/api/interfaces/api_model_contact.Contact.md)[]\>

___

### getGroupMembersId

▸ **getGroupMembersId**(`groupId`): `Promise`<[`ContactId`](/api/types/api_model_aliases.ContactId.md)[]\>

Retrieves group members as [Id] objects

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `groupId` | [`GroupChatId`](/api/types/api_model_aliases.GroupChatId.md) | group id |

#### Returns

`Promise`<[`ContactId`](/api/types/api_model_aliases.ContactId.md)[]\>

___

### getHostNumber

▸ **getHostNumber**(): `Promise`<`string`\>

Retrieves the host device number. Use this number when registering for a license key

#### Returns

`Promise`<`string`\>

Number

___

### getIndicatedNewMessages

▸ **getIndicatedNewMessages**(): `Promise`<[`Message`](/api/interfaces/api_model_message.Message.md)[]\>

Retrieves all unread Messages as indicated by the red dots in WA web. This returns an array of objects and are structured like so:
```javascript
[{
"id": "000000000000@g.us", //the id of the chat
"indicatedNewMessages": [] //array of messages, not including any messages by the host phone
}]
```

#### Returns

`Promise`<[`Message`](/api/interfaces/api_model_message.Message.md)[]\>

list of messages

___

### getInstanceId

▸ **getInstanceId**(): `string`

Get the INSTANCE_ID of the current session

#### Returns

`string`

___

### getIsPlugged

▸ **getIsPlugged**(): `Promise`<`boolean`\>

Retrieves whether or not phone is plugged in (i.e on charge)

#### Returns

`Promise`<`boolean`\>

Number

___

### getIssueLink

▸ **getIssueLink**(): `Promise`<`string`\>

Generate a pre-filled github issue link to easily report a bug

#### Returns

`Promise`<`string`\>

___

### getKickedGroups

▸ **getKickedGroups**(): `Promise`<[`GroupChatId`](/api/types/api_model_aliases.GroupChatId.md)[]\>

Returns an array of group ids where the host account has been kicked

#### Returns

`Promise`<[`GroupChatId`](/api/types/api_model_aliases.GroupChatId.md)[]\>

___

### getLastMsgTimestamps

▸ **getLastMsgTimestamps**(): `Promise`<{ `id`: [`ChatId`](/api/types/api_model_aliases.ChatId.md) ; `t`: `number`  }[]\>

Get an array of chatIds with their respective last message's timestamp.

This is useful for determining what chats are old/stale and need to be deleted.

#### Returns

`Promise`<{ `id`: [`ChatId`](/api/types/api_model_aliases.ChatId.md) ; `t`: `number`  }[]\>

___

### getLastSeen

▸ **getLastSeen**(`chatId`): `Promise`<`number` \| `boolean`\>

Retrieves the epoch timestamp of the time the contact was last seen. This will not work if:
1. They have set it so you cannot see their last seen via privacy settings.
2. You do not have an existing chat with the contact.
3. The chatId is for a group
In both of those instances this method will return undefined.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `chatId` | [`ChatId`](/api/types/api_model_aliases.ChatId.md) | The id of the chat. |

#### Returns

`Promise`<`number` \| `boolean`\>

number timestamp when chat was last online or undefined.

___

### getLicenseLink

▸ **getLicenseLink**(`params?`): `Promise`<`string`\>

Generate a license link

#### Parameters

| Name | Type |
| :------ | :------ |
| `params?` | `string` |

#### Returns

`Promise`<`string`\>

___

### getLicenseType

▸ **getLicenseType**(): `Promise`<``false`` \| [`LicenseType`](/api/enums/api_model_config.LicenseType.md)\>

Returns the the type of license key used by the session.

#### Returns

`Promise`<``false`` \| [`LicenseType`](/api/enums/api_model_config.LicenseType.md)\>

___

### getListenerQueues

▸ **getListenerQueues**(): `Object`

If you have set `onAnyMessage` or `onMessage` with the second parameter (PQueue options) then you may want to inspect their respective PQueue's.

#### Returns

`Object`

| Name | Type |
| :------ | :------ |
| `onAck` | `default`<`default`, `DefaultAddOptions`\> |
| `onAddedToGroup` | `default`<`default`, `DefaultAddOptions`\> |
| `onAnyMessage` | `default`<`default`, `DefaultAddOptions`\> |
| `onBattery` | `default`<`default`, `DefaultAddOptions`\> |
| `onBroadcast` | `default`<`default`, `DefaultAddOptions`\> |
| `onButton` | `default`<`default`, `DefaultAddOptions`\> |
| `onCallState` | `default`<`default`, `DefaultAddOptions`\> |
| `onChatDeleted` | `default`<`default`, `DefaultAddOptions`\> |
| `onChatOpened` | `default`<`default`, `DefaultAddOptions`\> |
| `onChatState` | `default`<`default`, `DefaultAddOptions`\> |
| `onContactAdded` | `default`<`default`, `DefaultAddOptions`\> |
| `onGlobalParticipantsChanged` | `default`<`default`, `DefaultAddOptions`\> |
| `onGroupApprovalRequest` | `default`<`default`, `DefaultAddOptions`\> |
| `onGroupChange` | `default`<`default`, `DefaultAddOptions`\> |
| `onIncomingCall` | `default`<`default`, `DefaultAddOptions`\> |
| `onLabel` | `default`<`default`, `DefaultAddOptions`\> |
| `onLogout` | `default`<`default`, `DefaultAddOptions`\> |
| `onMessage` | `default`<`default`, `DefaultAddOptions`\> |
| `onMessageDeleted` | `default`<`default`, `DefaultAddOptions`\> |
| `onNewProduct` | `default`<`default`, `DefaultAddOptions`\> |
| `onOrder` | `default`<`default`, `DefaultAddOptions`\> |
| `onPlugged` | `default`<`default`, `DefaultAddOptions`\> |
| `onPollVote` | `default`<`default`, `DefaultAddOptions`\> |
| `onReaction` | `default`<`default`, `DefaultAddOptions`\> |
| `onRemovedFromGroup` | `default`<`default`, `DefaultAddOptions`\> |
| `onStateChanged` | `default`<`default`, `DefaultAddOptions`\> |
| `onStory` | `default`<`default`, `DefaultAddOptions`\> |

___

### getMe

▸ **getMe**(): `Promise`<`any`\>

Returns an object with all of your host device details

#### Returns

`Promise`<`any`\>

___

### getMessageById

▸ **getMessageById**(`messageId`): `Promise`<[`Message`](/api/interfaces/api_model_message.Message.md)\>

Retrieves message object of given message id

#### Parameters

| Name | Type |
| :------ | :------ |
| `messageId` | [`MessageId`](/api/types/api_model_aliases.MessageId.md) |

#### Returns

`Promise`<[`Message`](/api/interfaces/api_model_message.Message.md)\>

message object

___

### getMessageInfo <div class="label license insiders">insiders</div>

▸ **getMessageInfo**(`messageId`): `Promise`<[`MessageInfo`](/api/interfaces/api_model_message.MessageInfo.md)\>

:::license May require insiders license
Use this link to get the [correct license](https://gum.co/open-wa?wanted=true&tier=Insiders%20Program).
:::

Get the detailed message info for a group message sent out by the host account.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `messageId` | [`MessageId`](/api/types/api_model_aliases.MessageId.md) | The message Id |

#### Returns

`Promise`<[`MessageInfo`](/api/interfaces/api_model_message.MessageInfo.md)\>

___

### getMessageReaders

▸ **getMessageReaders**(`messageId`): `Promise`<[`Contact`](/api/interfaces/api_model_contact.Contact.md)[]\>

Returns an array of contacts that have read the message. If the message does not exist, it will return an empty array. If the host account has disabled read receipts this may not work!
Each of these contact objects have a property `t` which represents the time at which that contact read the message.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `messageId` | [`MessageId`](/api/types/api_model_aliases.MessageId.md) | The message id |

#### Returns

`Promise`<[`Contact`](/api/interfaces/api_model_contact.Contact.md)[]\>

___

### getMyLastMessage

▸ **getMyLastMessage**(`chatId?`): `Promise`<[`Message`](/api/interfaces/api_model_message.Message.md)\>

Retrieves the last message sent by the host account in any given chat or globally.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `chatId?` | [`ChatId`](/api/types/api_model_aliases.ChatId.md) | This is optional. If no chat Id is set then the last message sent by the host account will be returned. |

#### Returns

`Promise`<[`Message`](/api/interfaces/api_model_message.Message.md)\>

message object or `undefined` if the host account's last message could not be found.

___

### getMyStatusArray

▸ **getMyStatusArray**(): `Promise`<[`Message`](/api/interfaces/api_model_message.Message.md)[]\>

**`Deprecated`**

Alias for deleteStory

#### Returns

`Promise`<[`Message`](/api/interfaces/api_model_message.Message.md)[]\>

___

### getMyStoryArray <div class="label license restricted">restricted</div>

▸ **getMyStoryArray**(): `Promise`<[`Message`](/api/interfaces/api_model_message.Message.md)[]\>

:::license May require restricted license
Use this link to get the [correct license](https://gum.co/open-wa?wanted=true&tier=1%20Restricted%20License).
:::

Retrieves all existing stories.

Only works with a Story License Key

#### Returns

`Promise`<[`Message`](/api/interfaces/api_model_message.Message.md)[]\>

___

### getOrder <div class="label license insiders">insiders</div>

▸ **getOrder**(`id`): `Promise`<[`Order`](/api/interfaces/api_model_product.Order.md)\>

:::license May require insiders license
Use this link to get the [correct license](https://gum.co/open-wa?wanted=true&tier=Insiders%20Program).
:::

Retrieves an order object

#### Parameters

| Name | Type |
| :------ | :------ |
| `id` | `string` \| [`MessageId`](/api/types/api_model_aliases.MessageId.md) |

#### Returns

`Promise`<[`Order`](/api/interfaces/api_model_product.Order.md)\>

order object

___

### getPage

▸ **getPage**(): `Page`

#### Returns

`Page`

___

### getPollData

▸ **getPollData**(`messageId`): `Promise`<[`PollData`](/api/interfaces/api_model_message.PollData.md)\>

Returns poll data including results and votes.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `messageId` | [`MessageId`](/api/types/api_model_aliases.MessageId.md) | The message id of the Poll |

#### Returns

`Promise`<[`PollData`](/api/interfaces/api_model_message.PollData.md)\>

___

### getProcessStats

▸ **getProcessStats**(): `Promise`<`any`\>

Get the stats of the current process and the corresponding browser process.

#### Returns

`Promise`<`any`\>

___

### getProfilePicFromServer

▸ **getProfilePicFromServer**(`chatId`): `Promise`<`string`\>

Retrieves chat picture

#### Parameters

| Name | Type |
| :------ | :------ |
| `chatId` | [`ChatId`](/api/types/api_model_aliases.ChatId.md) |

#### Returns

`Promise`<`string`\>

Url of the chat picture or undefined if there is no picture for the chat.

___

### getSessionId

▸ **getSessionId**(): `string`

#### Returns

`string`

___

### getSessionInfo

▸ **getSessionInfo**(): [`SessionInfo`](/api/interfaces/api_model_sessionInfo.SessionInfo.md)

Get the session info

#### Returns

[`SessionInfo`](/api/interfaces/api_model_sessionInfo.SessionInfo.md)

SessionInfo

___

### getSingleProperty

▸ **getSingleProperty**(`namespace`, `id`, `property`): `Promise`<`any`\>

This allows you to get a single property of a single object from the session. This limints the amouunt of data you need to sift through, reduces congestion between your process and the session and the flexibility to build your own specific getters.

Example - get message read state (ack):

```javascript
const ack  = await client.getSingleProperty('Msg',"true_12345678912@c.us_9C4D0965EA5C09D591334AB6BDB07FEB",'ack')
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `namespace` | [`namespace`](/api/enums/api_Client.namespace.md) |  |
| `id` | `string` | id of the object to get from the specific namespace |
| `property` | `string` | the single property key to get from the object. |

#### Returns

`Promise`<`any`\>

any If the property or the id cannot be found, it will return a 404

___

### getSnapshot

▸ **getSnapshot**(`chatId?`, `width?`, `height?`): `Promise`<[`DataURL`](/api/types/api_model_aliases.DataURL.md)\>

Returns a PNG DataURL screenshot of the session

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `chatId?` | [`ChatId`](/api/types/api_model_aliases.ChatId.md) | Chat ID to open before taking a snapshot |
| `width?` | `number` | Width of the viewport for the snapshot. Height also required if you want to resize. |
| `height?` | `number` | Height of the viewport for the snapshot. Width also required if you want to resize. |

#### Returns

`Promise`<[`DataURL`](/api/types/api_model_aliases.DataURL.md)\>

`Promise<DataURL>`

___

### getStarredMessages

▸ **getStarredMessages**(`chatId?`): `Promise`<[`Message`](/api/interfaces/api_model_message.Message.md)[]\>

Retrieves the starred messages in a given chat

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `chatId?` | [`ChatId`](/api/types/api_model_aliases.ChatId.md) | Chat ID to filter starred messages by |

#### Returns

`Promise`<[`Message`](/api/interfaces/api_model_message.Message.md)[]\>

message object

___

### getStatus

▸ **getStatus**(`contactId`): `Promise`<{ `id`: `string` ; `status`: `string`  }\>

Get the status of a contact

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `contactId` | [`ContactId`](/api/types/api_model_aliases.ContactId.md) | {string} to '000000000000@c.us' returns: {id: string,status: string} |

#### Returns

`Promise`<{ `id`: `string` ; `status`: `string`  }\>

___

### getStickerDecryptable

▸ **getStickerDecryptable**(`messageId`): `Promise`<``false`` \| [`Message`](/api/interfaces/api_model_message.Message.md)\>

**`Deprecated`**

Retrieves a message object which results in a valid sticker instead of a blank one. This also works with animated stickers.

If you run this without a valid insiders key, it will return false and cause an error upon decryption.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `messageId` | [`MessageId`](/api/types/api_model_aliases.MessageId.md) | The message ID `message.id` |

#### Returns

`Promise`<``false`` \| [`Message`](/api/interfaces/api_model_message.Message.md)\>

message object OR `false`

___

### getStoryViewers <div class="label license restricted">restricted</div>

▸ **getStoryViewers**(`id?`): `Promise`<[`ContactId`](/api/types/api_model_aliases.ContactId.md)[] \| { `[k: MessageId]`: [`ContactId`](/api/types/api_model_aliases.ContactId.md)[];  }\>

:::license May require restricted license
Use this link to get the [correct license](https://gum.co/open-wa?wanted=true&tier=1%20Restricted%20License).
:::

Retrieves an array of user ids that have 'read' your story.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `id?` | `string` | string The id of the story |

#### Returns

`Promise`<[`ContactId`](/api/types/api_model_aliases.ContactId.md)[] \| { `[k: MessageId]`: [`ContactId`](/api/types/api_model_aliases.ContactId.md)[];  }\>

___

### getTunnelCode

▸ **getTunnelCode**(): `Promise`<`string`\>

The EASY API uses this string to secure a subdomain on the openwa public tunnel service.

#### Returns

`Promise`<`string`\>

___

### getUnreadMessages

▸ **getUnreadMessages**(`includeMe`, `includeNotifications`, `use_unread_count`): `Promise`<[`SingleChat`](/api/interfaces/api_model_chat.SingleChat.md) & { `messages`: [`Message`](/api/interfaces/api_model_message.Message.md)[]  }[] & [`GroupChat`](/api/interfaces/api_model_chat.GroupChat.md) & { `messages`: [`Message`](/api/interfaces/api_model_message.Message.md)[]  }[]\>

Retrieves all unread Messages

#### Parameters

| Name | Type |
| :------ | :------ |
| `includeMe` | `boolean` |
| `includeNotifications` | `boolean` |
| `use_unread_count` | `boolean` |

#### Returns

`Promise`<[`SingleChat`](/api/interfaces/api_model_chat.SingleChat.md) & { `messages`: [`Message`](/api/interfaces/api_model_message.Message.md)[]  }[] & [`GroupChat`](/api/interfaces/api_model_chat.GroupChat.md) & { `messages`: [`Message`](/api/interfaces/api_model_message.Message.md)[]  }[]\>

any

___

### getUnsentMessages

▸ **getUnsentMessages**(): `Promise`<[`Message`](/api/interfaces/api_model_message.Message.md)[]\>

Retreive an array of messages that are not yet sent to the recipient via the host account device (i.e no ticks)

#### Returns

`Promise`<[`Message`](/api/interfaces/api_model_message.Message.md)[]\>

___

### getVCards

▸ **getVCards**(`msgId`): `Promise`<`string`[]\>

Extracts vcards from a message.This works on messages of typ `vcard` or `multi_vcard`

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `msgId` | [`MessageId`](/api/types/api_model_aliases.MessageId.md) | string id of the message to extract the vcards from |

#### Returns

`Promise`<`string`[]\>

[vcard] 
```
[
{
displayName:"Contact name",
vcard: "loong vcard string"
}
]
``` 
or false if no valid vcards found.

Please use [vcf](https://www.npmjs.com/package/vcf) to convert a vcard string into a json object

___

### getWAVersion

▸ **getWAVersion**(): `Promise`<`string`\>

#### Returns

`Promise`<`string`\>

___

### ghostForward

▸ **ghostForward**(`to`, `messageId`): `Promise`<`boolean` \| [`MessageId`](/api/types/api_model_aliases.MessageId.md)\>

Ghost forwarding is like a normal forward but as if it were sent from the host phone [i.e it doesn't show up as forwarded.]
Any potential abuse of this method will see it become paywalled.

#### Parameters

| Name | Type |
| :------ | :------ |
| `to` | [`ChatId`](/api/types/api_model_aliases.ChatId.md) |
| `messageId` | [`MessageId`](/api/types/api_model_aliases.MessageId.md) |

#### Returns

`Promise`<`boolean` \| [`MessageId`](/api/types/api_model_aliases.MessageId.md)\>

`Promise<MessageId | boolean>`

___

### healthCheck

▸ **healthCheck**(): `Promise`<[`HealthCheck`](/api/interfaces/api_model_sessionInfo.HealthCheck.md)\>

Runs a health check to help you determine if/when is an appropiate time to restart/refresh the session.

#### Returns

`Promise`<[`HealthCheck`](/api/interfaces/api_model_sessionInfo.HealthCheck.md)\>

___

### iAmAdmin

▸ **iAmAdmin**(): `Promise`<[`GroupChatId`](/api/types/api_model_aliases.GroupChatId.md)[]\>

Returns an array of group ids where the host account is admin

#### Returns

`Promise`<[`GroupChatId`](/api/types/api_model_aliases.GroupChatId.md)[]\>

___

### inviteInfo

▸ **inviteInfo**(`link`): `Promise`<`any`\>

Get the details of a group through the invite link

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `link` | `string` | This can be an invite link or invite code |

#### Returns

`Promise`<`any`\>

___

### isChatMuted

▸ **isChatMuted**(`chatId`): `Promise`<`boolean`\>

Checks if a chat is muted

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `chatId` | [`ChatId`](/api/types/api_model_aliases.ChatId.md) | The id of the chat you want to check |

#### Returns

`Promise`<`boolean`\>

boolean. `false` if the chat does not exist.

___

### isChatOnline

▸ **isChatOnline**(`chatId`): `Promise`<`string` \| `boolean`\>

Checks if a chat contact is online. Not entirely sure if this works with groups.

It will return `true` if the chat is `online`, `false` if the chat is `offline`, `PRIVATE` if the privacy settings of the contact do not allow you to see their status and `NO_CHAT` if you do not currently have a chat with that contact.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `chatId` | [`ChatId`](/api/types/api_model_aliases.ChatId.md) | chat id: `xxxxx@c.us` |

#### Returns

`Promise`<`string` \| `boolean`\>

___

### isConnected

▸ **isConnected**(): `Promise`<`boolean`\>

Retrieves if the phone is online. Please note that this may not be real time.

#### Returns

`Promise`<`boolean`\>

Boolean

___

### isGroupIdUnsafe <div class="label license insiders">insiders</div>

▸ **isGroupIdUnsafe**(`groupChatId`): `Promise`<`string` \| `boolean`\>

:::license May require insiders license
Use this link to get the [correct license](https://gum.co/open-wa?wanted=true&tier=Insiders%20Program).
:::

Checks whether or not the group id provided is known to be unsafe by the contributors of the library.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `groupChatId` | [`GroupChatId`](/api/types/api_model_aliases.GroupChatId.md) | The group chat you want to deteremine is unsafe |

#### Returns

`Promise`<`string` \| `boolean`\>

`Promise <boolean | string>` This will either return a boolean indiciating whether this group chat id is considered unsafe or an error message as a string

___

### isPhoneDisconnected

▸ **isPhoneDisconnected**(): `Promise`<`boolean`\>

Check if the "Phone not Cconnected" message is showing in the browser. If it is showing, then this will return `true`.

#### Returns

`Promise`<`boolean`\>

`boolean`

___

### joinGroupViaLink

▸ **joinGroupViaLink**(`link`, `returnChatObj?`): `Promise`<`string` \| `number` \| `boolean` \| [`Chat`](/api/types/api_model_chat.Chat.md)\>

Joins a group via the invite link, code, or message

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `link` | `string` | This param is the string which includes the invite link or code. The following work: - Follow this link to join my WA group: https://chat.whatsapp.com/DHTGJUfFJAV9MxOpZO1fBZ - https://chat.whatsapp.com/DHTGJUfFJAV9MxOpZO1fBZ - DHTGJUfFJAV9MxOpZO1fBZ   If you have been removed from the group previously, it will return `401` |
| `returnChatObj?` | `boolean` | boolean When this is set to true and if the group was joined successfully, it will return a serialzed Chat object which includes group information and metadata. This is useful when you want to immediately do something with group metadata. |

#### Returns

`Promise`<`string` \| `number` \| `boolean` \| [`Chat`](/api/types/api_model_chat.Chat.md)\>

`Promise<string | boolean | number>` Either false if it didn't work, or the group id.

___

### joinWebBeta

▸ **joinWebBeta**(`join`): `Promise`<`boolean`\>

Join or leave the wa web beta program. Will return true of operation was successful.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `join` | `boolean` | true to join the beta, false to leave |

#### Returns

`Promise`<`boolean`\>

___

### kill

▸ **kill**(`reason?`): `Promise`<`boolean`\>

Shuts down the page and browser

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `reason` | `string` | `"MANUALLY_KILLED"` |

#### Returns

`Promise`<`boolean`\>

true

___

### leaveGroup

▸ **leaveGroup**(`groupId`): `Promise`<`boolean`\>

Removes the host device from the group

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `groupId` | [`GroupChatId`](/api/types/api_model_aliases.GroupChatId.md) | group id |

#### Returns

`Promise`<`boolean`\>

___

### listWebhooks

▸ **listWebhooks**(): `Promise`<[`Webhook`](/api/interfaces/api_model_config.Webhook.md)[]\>

Retreives an array of webhook objects

#### Returns

`Promise`<[`Webhook`](/api/interfaces/api_model_config.Webhook.md)[]\>

___

### loadAllEarlierMessages

▸ **loadAllEarlierMessages**(`contactId`): `Promise`<[`Message`](/api/interfaces/api_model_message.Message.md)[]\>

Load all messages in chat object from server.

#### Parameters

| Name | Type |
| :------ | :------ |
| `contactId` | [`ContactId`](/api/types/api_model_aliases.ContactId.md) |

#### Returns

`Promise`<[`Message`](/api/interfaces/api_model_message.Message.md)[]\>

Message[]

___

### loadAndGetAllMessagesInChat

▸ **loadAndGetAllMessagesInChat**(`chatId`, `includeMe`, `includeNotifications`): `Promise`<[`Message`](/api/interfaces/api_model_message.Message.md)[]\>

loads and Retrieves all Messages in a chat

#### Parameters

| Name | Type |
| :------ | :------ |
| `chatId` | [`ChatId`](/api/types/api_model_aliases.ChatId.md) |
| `includeMe` | `boolean` |
| `includeNotifications` | `boolean` |

#### Returns

`Promise`<[`Message`](/api/interfaces/api_model_message.Message.md)[]\>

any

___

### loadEarlierMessages

▸ **loadEarlierMessages**(`contactId`): `Promise`<[`Message`](/api/interfaces/api_model_message.Message.md)[]\>

Load more messages in chat object from server. Use this in a while loop. This should return up to 50 messages at a time

#### Parameters

| Name | Type |
| :------ | :------ |
| `contactId` | [`ContactId`](/api/types/api_model_aliases.ContactId.md) |

#### Returns

`Promise`<[`Message`](/api/interfaces/api_model_message.Message.md)[]\>

Message []

___

### loadEarlierMessagesTillDate

▸ **loadEarlierMessagesTillDate**(`contactId`, `timestamp`): `Promise`<[`Message`](/api/interfaces/api_model_message.Message.md)[]\>

Load all messages until a given timestamp in chat object from server.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `contactId` | [`ContactId`](/api/types/api_model_aliases.ContactId.md) |  |
| `timestamp` | `number` | in seconds |

#### Returns

`Promise`<[`Message`](/api/interfaces/api_model_message.Message.md)[]\>

Message[]

___

### logger

▸ **logger**(): `any`

Grab the logger for this session/process

#### Returns

`any`

___

### logout

▸ **logout**(`preserveSessionData?`): `Promise`<`boolean`\>

Logs out from the session.

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `preserveSessionData` | `boolean` | `false` | skip session.data.json file invalidation Please be careful when using this as it can exit the whole process depending on your config |

#### Returns

`Promise`<`boolean`\>

___

### markAllRead

▸ **markAllRead**(): `Promise`<`boolean`\>

Runs sendSeen on all chats

#### Returns

`Promise`<`boolean`\>

___

### markAsUnread

▸ **markAsUnread**(`chatId`): `Promise`<`boolean`\>

Sets a chat status to unread. May be useful to get host's attention

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `chatId` | [`ChatId`](/api/types/api_model_aliases.ChatId.md) | chat id: `xxxxx@c.us` |

#### Returns

`Promise`<`boolean`\>

___

### metrics

▸ **metrics**(): `Promise`<`any`\>

Returns some metrics of the session/page.

#### Returns

`Promise`<`any`\>

`Promise<any>`

___

### middleware

▸ **middleware**(`useSessionIdInPath?`, `PORT?`): (`req`: `Request`<`ParamsDictionary`, `any`, `any`, `ParsedQs`, `Record`<`string`, `any`\>\>, `res`: `Response`<`any`, `Record`<`string`, `any`\>\>, `next`: `NextFunction`) => `Promise`<`any`\>

This exposes a simple express middlware that will allow users to quickly boot up an api based off this client. Checkout demo/index.ts for an example
How to use the middleware:

```javascript

import { create } from '@open-wa/wa-automate';
const express = require('express')
const app = express()
app.use(express.json())
const PORT = 8082;

function start(client){
  app.use(client.middleware()); //or client.middleware(true) if you require the session id to be part of the path (so localhost:8082/sendText beccomes localhost:8082/sessionId/sendText)
  app.listen(PORT, function () {
    console.log(`\n• Listening on port ${PORT}!`);
  });
  ...
}

create({
  sessionId:'session1'
}).then(start)

```

All requests need to be `POST` requests. You use the API the same way you would with `client`. The method can be the path or the method param in the post body. The arguments for the method should be properly ordered in the args array in the JSON post body.

Example:

```javascript
  await client.sendText('4477777777777@c.us','test')
  //returns "true_4477777777777@c.us_3EB0645E623D91006252"
```
as a request with a path:

```javascript
const axios = require('axios').default;
axios.post('localhost:8082/sendText', {
    args: [
       "4477777777777@c.us",    
       "test"    
        ]
  })
```

or as a request without a path:

```javascript
const axios = require('axios').default;
axios.post('localhost:8082', {
    method:'sendText',
    args: [
       "4477777777777@c.us",    
       "test"   
        ]
})
```

As of 1.9.69, you can also send the argyments as an object with the keys mirroring the paramater names of the relative client functions

Example:

```javascript
const axios = require('axios').default;
axios.post('localhost:8082', {
    method:'sendText',
    args: {
       "to":"4477777777777@c.us",    
       "content":"test"   
        }
})
```

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `useSessionIdInPath` | `boolean` | `false` | boolean Set this to true if you want to keep each session in it's own path.  For example, if you have a session with id  `host` if you set useSessionIdInPath to true, then all requests will need to be prefixed with the path `host`. E.g `localhost:8082/sendText` becomes `localhost:8082/host/sendText` |
| `PORT?` | `number` | `undefined` | - |

#### Returns

`fn`

▸ (`req`, `res`, `next`): `Promise`<`any`\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `req` | `Request`<`ParamsDictionary`, `any`, `any`, `ParsedQs`, `Record`<`string`, `any`\>\> |
| `res` | `Response`<`any`, `Record`<`string`, `any`\>\> |
| `next` | `NextFunction` |

##### Returns

`Promise`<`any`\>

___

### muteChat <div class="label license insiders">insiders</div>

▸ **muteChat**(`chatId`, `muteDuration`): `Promise`<`string` \| `number` \| `boolean`\>

:::license May require insiders license
Use this link to get the [correct license](https://gum.co/open-wa?wanted=true&tier=Insiders%20Program).
:::

Mutes a conversation for a given duration. If already muted, this will update the muted duration. Mute durations are relative from when the method is called.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `chatId` | [`ChatId`](/api/types/api_model_aliases.ChatId.md) | The id of the conversation you want to mute |
| `muteDuration` | [`ChatMuteDuration`](/api/enums/api_model_chat.ChatMuteDuration.md) | ChatMuteDuration enum of the time you want this chat to be muted for. |

#### Returns

`Promise`<`string` \| `number` \| `boolean`\>

boolean true: worked or error code or message

___

### onNewProduct <div class="label license insiders">insiders</div>

▸ **onNewProduct**(`fn`): `Promise`<`boolean` \| `Listener`\>

:::license May require insiders license
Use this link to get the [correct license](https://gum.co/open-wa?wanted=true&tier=Insiders%20Program).
:::

Listens to new orders. Only works on business accounts

#### Parameters

| Name | Type |
| :------ | :------ |
| `fn` | (`product`: [`Product`](/api/interfaces/api_model_product.Product.md)) => `void` |

#### Returns

`Promise`<`boolean` \| `Listener`\>

___

### onOrder <div class="label license insiders">insiders</div>

▸ **onOrder**(`fn`): `Promise`<`boolean` \| `Listener`\>

:::license May require insiders license
Use this link to get the [correct license](https://gum.co/open-wa?wanted=true&tier=Insiders%20Program).
:::

Listens to new orders. Only works on business accounts

#### Parameters

| Name | Type |
| :------ | :------ |
| `fn` | (`order`: [`Order`](/api/interfaces/api_model_product.Order.md)) => `void` |

#### Returns

`Promise`<`boolean` \| `Listener`\>

___

### pinChat

▸ **pinChat**(`id`, `pin`): `Promise`<`boolean`\>

Pin/Unpin chats

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `id` | [`ChatId`](/api/types/api_model_aliases.ChatId.md) | The id of the conversation |
| `pin` | `boolean` | - |

#### Returns

`Promise`<`boolean`\>

boolean true: worked

___

### postImageStatus

▸ **postImageStatus**(`data`, `caption`): `Promise`<`string` \| `boolean` \| [`MessageId`](/api/types/api_model_aliases.MessageId.md)\>

**`Deprecated`**

:::danger

Status features are broken for now. Please join our discord community for updates.

:::

[REQUIRES AN IMAGE STORY LICENSE-KEY](https://gum.co/open-wa)

Posts an image story.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `data` | [`DataURL`](/api/types/api_model_aliases.DataURL.md) | data url string `data:[<MIME-type>][;charset=<encoding>][;base64],<data>` |
| `caption` | [`Content`](/api/types/api_model_aliases.Content.md) | The caption for the story |

#### Returns

`Promise`<`string` \| `boolean` \| [`MessageId`](/api/types/api_model_aliases.MessageId.md)\>

`Promise<string | boolean>` returns status id if it worked, false if it didn't

___

### postTextStatus

▸ **postTextStatus**(`text`, `textRgba`, `backgroundRgba`, `font`): `Promise`<`string` \| `boolean` \| [`MessageId`](/api/types/api_model_aliases.MessageId.md)\>

**`Deprecated`**

:::danger

Status features are broken for now. Please join our discord community for updates.

:::

[REQUIRES A TEXT STORY LICENSE-KEY](https://gum.co/open-wa)

Sends a formatted text story.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `text` | [`Content`](/api/types/api_model_aliases.Content.md) | The text to be displayed in the story |
| `textRgba` | `string` | The colour of the text in the story in hex format, make sure to add the alpha value also. E.g "#FF00F4F2" |
| `backgroundRgba` | `string` | The colour of the background in the story in hex format, make sure to add the alpha value also. E.g "#4FF31FF2" |
| `font` | `number` | The font of the text to be used in the story. This has to be a number. Each number refers to a specific predetermined font. Here are the fonts you can choose from: 0: Sans Serif 1: Serif 2: [Norican Regular](https://fonts.google.com/specimen/Norican) 3: [Bryndan Write](https://www.dafontfree.net/freefonts-bryndan-write-f160189.htm) 4: [Bebasneue Regular](https://www.dafont.com/bebas-neue.font) 5: [Oswald Heavy](https://www.fontsquirrel.com/fonts/oswald) |

#### Returns

`Promise`<`string` \| `boolean` \| [`MessageId`](/api/types/api_model_aliases.MessageId.md)\>

`Promise<string | boolean>` returns status id if it worked, false if it didn't

___

### postVideoStatus

▸ **postVideoStatus**(`data`, `caption`): `Promise`<`string` \| `boolean` \| [`MessageId`](/api/types/api_model_aliases.MessageId.md)\>

**`Deprecated`**

:::danger

Status features are broken for now. Please join our discord community for updates.

:::

[REQUIRES A VIDEO STORY LICENSE-KEY](https://gum.co/open-wa)

Posts a video story.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `data` | [`DataURL`](/api/types/api_model_aliases.DataURL.md) | data url string `data:[<MIME-type>][;charset=<encoding>][;base64],<data>` |
| `caption` | [`Content`](/api/types/api_model_aliases.Content.md) | The caption for the story |

#### Returns

`Promise`<`string` \| `boolean` \| [`MessageId`](/api/types/api_model_aliases.MessageId.md)\>

`Promise<string | boolean>` returns status id if it worked, false if it didn't

___

### prepEventData

▸ **prepEventData**(`data`, `event`, `extras?`): [`EventPayload`](/api/interfaces/api_model_config.EventPayload.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `data` | `JsonObject` |
| `event` | [`SimpleListener`](/api/enums/api_model_events.SimpleListener.md) |
| `extras?` | `JsonObject` |

#### Returns

[`EventPayload`](/api/interfaces/api_model_config.EventPayload.md)

___

### promoteParticipant

▸ **promoteParticipant**(`groupId`, `participantId`): `Promise`<`boolean`\>

Promote Participant to Admin in Group

If not a group chat, returns `NOT_A_GROUP_CHAT`.

If the chat does not exist, returns `GROUP_DOES_NOT_EXIST`

If the participantId does not exist in the group chat, returns `NOT_A_PARTICIPANT`

If the host account is not an administrator, returns `INSUFFICIENT_PERMISSIONS`

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `groupId` | [`GroupChatId`](/api/types/api_model_aliases.GroupChatId.md) | '0000000000-00000000@g.us' |
| `participantId` | [`ContactId`](/api/types/api_model_aliases.ContactId.md) \| [`ContactId`](/api/types/api_model_aliases.ContactId.md)[] | '000000000000@c.us' |

#### Returns

`Promise`<`boolean`\>

___

### react

▸ **react**(`messageId`, `emoji`): `Promise`<`boolean`\>

React to a message

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `messageId` | [`MessageId`](/api/types/api_model_aliases.MessageId.md) | Message ID of the message you want to react to |
| `emoji` | `string` | 1 single emoji to add to the message as a reacion |

#### Returns

`Promise`<`boolean`\>

boolean

___

### refresh

▸ **refresh**(): `Promise`<`boolean`\>

Refreshes the page and reinjects all necessary files. This may be useful for when trying to save memory
This will attempt to re register all listeners EXCEPT onLiveLocation and onParticipantChanged

#### Returns

`Promise`<`boolean`\>

___

### registerWebhook

▸ **registerWebhook**(`url`, `events`, `requestConfig?`, `concurrency?`): `Promise`<``false`` \| [`Webhook`](/api/interfaces/api_model_config.Webhook.md)\>

The client can now automatically handle webhooks. Use this method to register webhooks.

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `url` | `string` | `undefined` | The webhook url |
| `events` | [`SimpleListener`](/api/enums/api_model_events.SimpleListener.md)[] \| ``"all"`` | `undefined` | An array of SimpleListener enums or `all` (to register all possible listeners) |
| `requestConfig` | `AxiosRequestConfig`<`any`\> | `{}` | {} By default the request is a post request, however you can override that and many other options by sending this parameter. You can read more about this parameter here: https://github.com/axios/axios#request-config |
| `concurrency` | `number` | `5` | the amount of concurrent requests to be handled by the built in queue. Default is 5. |

#### Returns

`Promise`<``false`` \| [`Webhook`](/api/interfaces/api_model_config.Webhook.md)\>

A webhook object. This will include a webhook ID and an array of all successfully registered Listeners.

___

### rejectGroupJoinRequest

▸ **rejectGroupJoinRequest**(`groupChatId`, `contactId`): `Promise`<`string` \| `boolean`\>

Rejects a group join request
 *

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `groupChatId` | [`GroupChatId`](/api/types/api_model_aliases.GroupChatId.md) | The group chat id  * |
| `contactId` | [`ContactId`](/api/types/api_model_aliases.ContactId.md) | The contact id of the person who is requesting to join the group  * |

#### Returns

`Promise`<`string` \| `boolean`\>

`Promise<boolean>`

___

### removeAllListeners

▸ **removeAllListeners**(): `boolean`

#### Returns

`boolean`

___

### removeLabel

▸ **removeLabel**(`label`, `chatId`): `Promise`<`boolean`\>

Removes label from chat, message or contact. Only for business accounts.

#### Parameters

| Name | Type |
| :------ | :------ |
| `label` | `string` |
| `chatId` | [`ChatId`](/api/types/api_model_aliases.ChatId.md) |

#### Returns

`Promise`<`boolean`\>

___

### removeListener

▸ **removeListener**(`listener`): `boolean`

////////////////////////  LISTENERS

#### Parameters

| Name | Type |
| :------ | :------ |
| `listener` | [`SimpleListener`](/api/enums/api_model_events.SimpleListener.md) |

#### Returns

`boolean`

___

### removeParticipant

▸ **removeParticipant**(`groupId`, `participantId`): `Promise`<`boolean`\>

Remove participant of Group

If not a group chat, returns `NOT_A_GROUP_CHAT`.

If the chat does not exist, returns `GROUP_DOES_NOT_EXIST`

If the participantId does not exist in the group chat, returns `NOT_A_PARTICIPANT`

If the host account is not an administrator, returns `INSUFFICIENT_PERMISSIONS`

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `groupId` | [`GroupChatId`](/api/types/api_model_aliases.GroupChatId.md) | `0000000000-00000000@g.us` |
| `participantId` | [`ContactId`](/api/types/api_model_aliases.ContactId.md) | `000000000000@c.us` |

#### Returns

`Promise`<`boolean`\>

___

### removeProduct

▸ **removeProduct**(`productId`): `Promise`<`boolean`\>

Remove a product from the host account's catalog

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `productId` | `string` | The id of the product |

#### Returns

`Promise`<`boolean`\>

boolean

___

### removeWebhook

▸ **removeWebhook**(`webhookId`): `Promise`<`boolean`\>

Removes a webhook.

Returns `true` if the webhook was found and removed. `false` if the webhook was not found and therefore could not be removed. This does not unregister any listeners off of other webhooks.

**`Retruns`**

boolean

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `webhookId` | `string` | The ID of the webhook |

#### Returns

`Promise`<`boolean`\>

___

### reply

▸ **reply**(`to`, `content`, `quotedMsgId`, `sendSeen?`): `Promise`<`boolean` \| [`MessageId`](/api/types/api_model_aliases.MessageId.md)\>

Sends a reply to a given message. Please note, you need to have at least sent one normal message to a contact in order for this to work properly.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `to` | [`ChatId`](/api/types/api_model_aliases.ChatId.md) | string chatid |
| `content` | [`Content`](/api/types/api_model_aliases.Content.md) | string reply text |
| `quotedMsgId` | [`MessageId`](/api/types/api_model_aliases.MessageId.md) | string the msg id to reply to. |
| `sendSeen?` | `boolean` | boolean If set to true, the chat will 'blue tick' all messages before sending the reply |

#### Returns

`Promise`<`boolean` \| [`MessageId`](/api/types/api_model_aliases.MessageId.md)\>

`Promise<MessageId | false>` false if didn't work, otherwise returns message id.

___

### reportSpam <div class="label license restricted">restricted</div>

▸ **reportSpam**(`id`): `Promise`<`boolean`\>

:::license May require restricted license
Use this link to get the [correct license](https://gum.co/open-wa?wanted=true&tier=1%20Restricted%20License).
:::

Report a contact for spam, block them and attempt to clear chat.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `id` | [`ChatId`](/api/types/api_model_aliases.ChatId.md) | '000000000000@c.us' |

#### Returns

`Promise`<`boolean`\>

___

### resizePage

▸ **resizePage**(`width?`, `height?`): `Promise`<`boolean`\>

Easily resize page on the fly. Useful if you're showing screenshots in a web-app.

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `width` | `number` | `1920` |
| `height` | `number` | `1080` |

#### Returns

`Promise`<`boolean`\>

___

### revokeGroupInviteLink

▸ **revokeGroupInviteLink**(`chatId`): `Promise`<`string` \| `boolean`\>

Revokes the current invite link for a group chat. Any previous links will stop working

#### Parameters

| Name | Type |
| :------ | :------ |
| `chatId` | [`ChatId`](/api/types/api_model_aliases.ChatId.md) |

#### Returns

`Promise`<`string` \| `boolean`\>

`Promise<boolean>`

___

### sendAdvancedButtons

▸ **sendAdvancedButtons**(`to`, `body`, `buttons`, `text`, `footer`, `filename`): `Promise`<`boolean` \| [`MessageId`](/api/types/api_model_aliases.MessageId.md)\>

**`Deprecated`**

:::danger

Template messages (URL & CALL buttons) are broken for the foreseeable future. Please DO NOT get a license solely for access to URL or CALL buttons. They are no longer reliable due to recent changes at WA.
WA BIZ accounts CANNOT send buttons. This is a WA limitation. DO NOT get a license solely for access to buttons on wa business accounts.

THIS IS NOT WORKING FOR GROUPS YET.

ADVANCED ARE DEPRECATED FOR NOW. DO NOT GET A LICENSE TO USE BUTTONS.

:::

Send advanced buttons with media body. This is an insiders feature for MD accounts.
 
Body can be location, image, video or document. Buttons can be quick reply, url or call buttons.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `to` | [`ChatId`](/api/types/api_model_aliases.ChatId.md) | chat id |
| `body` | `string` \| [`LocationButtonBody`](/api/interfaces/api_model_button.LocationButtonBody.md) | The body of the buttons message |
| `buttons` | [`AdvancedButton`](/api/interfaces/api_model_button.AdvancedButton.md)[] | Array of buttons - limit is 3! |
| `text` | `string` | - |
| `footer` | `string` | The footer of the buttons message |
| `filename` | `string` | Required if body is a file!! |

#### Returns

`Promise`<`boolean` \| [`MessageId`](/api/types/api_model_aliases.MessageId.md)\>

___

### sendAudio

▸ **sendAudio**(`to`, `file`, `quotedMsgId?`): `Promise`<[`MessageId`](/api/types/api_model_aliases.MessageId.md)\>

Send an audio file with the default audio player (not PTT/voice message)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `to` | [`ChatId`](/api/types/api_model_aliases.ChatId.md) | chat id `xxxxx@c.us` |
| `file` | [`AdvancedFile`](/api/types/api_model_aliases.AdvancedFile.md) | - |
| `quotedMsgId?` | [`MessageId`](/api/types/api_model_aliases.MessageId.md) | string true_0000000000@c.us_JHB2HB23HJ4B234HJB to send as a reply to a message |

#### Returns

`Promise`<[`MessageId`](/api/types/api_model_aliases.MessageId.md)\>

___

### sendBanner

▸ **sendBanner**(`to`, `base64`): `Promise`<`boolean` \| [`MessageId`](/api/types/api_model_aliases.MessageId.md)\>

Send a banner image

Note this is a bit of hack on top of a location message. During testing it is shown to not work on iPhones.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `to` | [`ChatId`](/api/types/api_model_aliases.ChatId.md) |  |
| `base64` | [`Base64`](/api/types/api_model_aliases.Base64.md) | base64 encoded jpeg |

#### Returns

`Promise`<`boolean` \| [`MessageId`](/api/types/api_model_aliases.MessageId.md)\>

___

### sendButtons

▸ **sendButtons**(`to`, `body`, `buttons`, `title?`, `footer?`): `Promise`<`boolean` \| [`MessageId`](/api/types/api_model_aliases.MessageId.md)\>

**`Deprecated`**

:::danger

WA BIZ accounts CANNOT send buttons. This is a WA limitation. DO NOT get a license solely for access to buttons on wa business accounts.
THIS IS NOT WORKING FOR GROUPS YET.

BUTTONS ARE DEPRECATED FOR NOW. DO NOT GET A LICENSE TO USE BUTTONS.

:::

Send generic quick reply buttons. This is an insiders feature for MD accounts.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `to` | [`ChatId`](/api/types/api_model_aliases.ChatId.md) | chat id |
| `body` | `string` \| [`LocationButtonBody`](/api/interfaces/api_model_button.LocationButtonBody.md) | The body of the buttons message |
| `buttons` | [`Button`](/api/interfaces/api_model_button.Button.md)[] | Array of buttons - limit is 3! |
| `title?` | `string` | The title/header of the buttons message |
| `footer?` | `string` | The footer of the buttons message |

#### Returns

`Promise`<`boolean` \| [`MessageId`](/api/types/api_model_aliases.MessageId.md)\>

___

### sendContact

▸ **sendContact**(`to`, `contactId`): `Promise`<`boolean` \| [`MessageId`](/api/types/api_model_aliases.MessageId.md)\>

Sends contact card to given chat id. You can use this to send multiple contacts but they will show up as multiple single-contact messages.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `to` | [`ChatId`](/api/types/api_model_aliases.ChatId.md) | 'xxxx@c.us' |
| `contactId` | [`ContactId`](/api/types/api_model_aliases.ContactId.md) \| [`ContactId`](/api/types/api_model_aliases.ContactId.md)[] | - |

#### Returns

`Promise`<`boolean` \| [`MessageId`](/api/types/api_model_aliases.MessageId.md)\>

___

### sendCustomProduct

▸ **sendCustomProduct**(`to`, `image`, `productData`): `Promise`<`boolean` \| [`MessageId`](/api/types/api_model_aliases.MessageId.md)\>

**`Deprecated`**

Feature Currently only available with Premium License accounts.

Send a custom product to a chat. Please see CustomProduct for details.

Caveats:
- URL will not work (unable to click), you will have to send another message with the URL.
- Recipient will see a thin banner under picture that says "Something went wrong"
- This will only work if you have at least 1 product already in your catalog
- Only works on Business accounts

#### Parameters

| Name | Type |
| :------ | :------ |
| `to` | [`ChatId`](/api/types/api_model_aliases.ChatId.md) |
| `image` | [`DataURL`](/api/types/api_model_aliases.DataURL.md) |
| `productData` | [`CustomProduct`](/api/interfaces/api_model_product.CustomProduct.md) |

#### Returns

`Promise`<`boolean` \| [`MessageId`](/api/types/api_model_aliases.MessageId.md)\>

___

### sendEmoji

▸ **sendEmoji**(`to`, `emojiId`, `messageId?`): `Promise`<`string` \| `boolean` \| [`MessageId`](/api/types/api_model_aliases.MessageId.md)\>

Send a discord emoji to a chat as a sticker

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `to` | [`ChatId`](/api/types/api_model_aliases.ChatId.md) | ChatId The chat id you want to send the webp sticker to |
| `emojiId` | `string` | The discord emoji id without indentifying chars. In discord you would write `:who:`, here use `who` |
| `messageId?` | [`MessageId`](/api/types/api_model_aliases.MessageId.md) | message id of the message you want this sticker to reply to. {@license:insiders@} |

#### Returns

`Promise`<`string` \| `boolean` \| [`MessageId`](/api/types/api_model_aliases.MessageId.md)\>

___

### sendFile

▸ **sendFile**(`to`, `file`, `filename`, `caption`, `quotedMsgId?`, `waitForId?`, `ptt?`, `withoutPreview?`, `hideTags?`, `viewOnce?`, `requestConfig?`): `Promise`<`boolean` \| [`MessageId`](/api/types/api_model_aliases.MessageId.md)\>

Sends a file to given chat, with caption or not, using base64. This is exactly the same as sendImage

Please note that any file that resolves to mime-type `octet-stream` will, by default, resolve to an MP4 file.

If you want a specific filetype, then explcitly select the correct mime-type from https://www.iana.org/assignments/media-types/media-types.xhtml

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `to` | [`ChatId`](/api/types/api_model_aliases.ChatId.md) | chat id `xxxxx@c.us` |
| `file` | [`AdvancedFile`](/api/types/api_model_aliases.AdvancedFile.md) | DataURL data:image/xxx;base64,xxx or the RELATIVE (should start with `./` or `../`) path of the file you want to send. With the latest version, you can now set this to a normal URL (for example [GET] `https://file-examples-com.github.io/uploads/2017/10/file_example_JPG_2500kB.jpg`). |
| `filename` | `string` | string xxxxx |
| `caption` | [`Content`](/api/types/api_model_aliases.Content.md) | string xxxxx With an [INSIDERS LICENSE-KEY](https://gum.co/open-wa?tier=Insiders%20Program) you can also tag people in groups with `@[number]`. For example if you want to mention the user with the number `44771234567`, just add `@44771234567` in the caption. |
| `quotedMsgId?` | [`MessageId`](/api/types/api_model_aliases.MessageId.md) | string true_0000000000@c.us_JHB2HB23HJ4B234HJB to send as a reply to a message |
| `waitForId?` | `boolean` | boolean default: false set this to true if you want to wait for the id of the message. By default this is set to false as it will take a few seconds to retrieve to the key of the message and this waiting may not be desirable for the majority of users. |
| `ptt?` | `boolean` | boolean default: false set this to true if you want to send the file as a push to talk file. |
| `withoutPreview?` | `boolean` | boolean default: false set this to true if you want to send the file without a preview (i.e as a file). This is useful for preventing auto downloads on recipient devices. |
| `hideTags?` | `boolean` | boolean default: false [INSIDERS] set this to try silent tag someone in the caption |
| `viewOnce?` | `boolean` | - |
| `requestConfig?` | `any` | - |

#### Returns

`Promise`<`boolean` \| [`MessageId`](/api/types/api_model_aliases.MessageId.md)\>

`Promise <boolean | MessageId>` This will either return true or the id of the message. It will return true after 10 seconds even if waitForId is true

___

### sendFileFromUrl

▸ **sendFileFromUrl**(`to`, `url`, `filename`, `caption`, `quotedMsgId?`, `requestConfig?`, `waitForId?`, `ptt?`, `withoutPreview?`, `hideTags?`, `viewOnce?`): `Promise`<`boolean` \| [`MessageId`](/api/types/api_model_aliases.MessageId.md)\>

Sends a file by Url or custom options

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `to` | [`ChatId`](/api/types/api_model_aliases.ChatId.md) | chat id `xxxxx@c.us` |
| `url` | `string` | string https://i.giphy.com/media/oYtVHSxngR3lC/200w.mp4 |
| `filename` | `string` | string 'video.mp4' |
| `caption` | [`Content`](/api/types/api_model_aliases.Content.md) | string xxxxx |
| `quotedMsgId?` | [`MessageId`](/api/types/api_model_aliases.MessageId.md) | string true_0000000000@c.us_JHB2HB23HJ4B234HJB to send as a reply to a message |
| `requestConfig` | `AxiosRequestConfig`<`any`\> | {} By default the request is a get request, however you can override that and many other options by sending this parameter. You can read more about this parameter here: https://github.com/axios/axios#request-config |
| `waitForId?` | `boolean` | boolean default: false set this to true if you want to wait for the id of the message. By default this is set to false as it will take a few seconds to retrieve to the key of the message and this waiting may not be desirable for the majority of users. |
| `ptt?` | `boolean` | boolean default: false set this to true if you want to send the file as a push to talk file. |
| `withoutPreview?` | `boolean` | boolean default: false set this to true if you want to send the file without a preview (i.e as a file). This is useful for preventing auto downloads on recipient devices. |
| `hideTags?` | `boolean` | - |
| `viewOnce?` | `boolean` | - |

#### Returns

`Promise`<`boolean` \| [`MessageId`](/api/types/api_model_aliases.MessageId.md)\>

___

### sendGiphy

▸ **sendGiphy**(`to`, `giphyMediaUrl`, `caption`): `Promise`<[`MessageId`](/api/types/api_model_aliases.MessageId.md)\>

Sends a video to given chat as a gif by using a giphy link, with caption or not, using base64

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `to` | [`ChatId`](/api/types/api_model_aliases.ChatId.md) | chat id `xxxxx@c.us` |
| `giphyMediaUrl` | `string` | string https://media.giphy.com/media/oYtVHSxngR3lC/giphy.gif => https://i.giphy.com/media/oYtVHSxngR3lC/200w.mp4 |
| `caption` | [`Content`](/api/types/api_model_aliases.Content.md) | string xxxxx |

#### Returns

`Promise`<[`MessageId`](/api/types/api_model_aliases.MessageId.md)\>

___

### sendGiphyAsSticker

▸ **sendGiphyAsSticker**(`to`, `giphyMediaUrl`): `Promise`<`string` \| `boolean` \| [`MessageId`](/api/types/api_model_aliases.MessageId.md)\>

Send a giphy GIF as an animated sticker.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `to` | [`ChatId`](/api/types/api_model_aliases.ChatId.md) | ChatId |
| `giphyMediaUrl` | `string` \| `URL` | URL \| string This is the giphy media url and has to be in the format `https://media.giphy.com/media/RJKHjCAdsAfQPn03qQ/source.gif` or it can be just the id `RJKHjCAdsAfQPn03qQ` |

#### Returns

`Promise`<`string` \| `boolean` \| [`MessageId`](/api/types/api_model_aliases.MessageId.md)\>

___

### sendImage

▸ **sendImage**(`to`, `file`, `filename`, `caption`, `quotedMsgId?`, `waitForId?`, `ptt?`, `withoutPreview?`, `hideTags?`, `viewOnce?`, `requestConfig?`): `Promise`<`boolean` \| [`MessageId`](/api/types/api_model_aliases.MessageId.md)\>

Sends a image to given chat, with caption or not, using base64

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `to` | [`ChatId`](/api/types/api_model_aliases.ChatId.md) | chat id `xxxxx@c.us` |
| `file` | [`AdvancedFile`](/api/types/api_model_aliases.AdvancedFile.md) | DataURL data:image/xxx;base64,xxx or the RELATIVE (should start with `./` or `../`) path of the file you want to send. With the latest version, you can now set this to a normal URL (for example [GET] `https://file-examples-com.github.io/uploads/2017/10/file_example_JPG_2500kB.jpg`). |
| `filename` | `string` | string xxxxx |
| `caption` | [`Content`](/api/types/api_model_aliases.Content.md) | string xxxxx |
| `quotedMsgId?` | [`MessageId`](/api/types/api_model_aliases.MessageId.md) | - |
| `waitForId?` | `boolean` | - |
| `ptt?` | `boolean` | - |
| `withoutPreview?` | `boolean` | - |
| `hideTags?` | `boolean` | boolean default: false [INSIDERS] set this to try silent tag someone in the caption |
| `viewOnce?` | `boolean` | - |
| `requestConfig?` | `any` | - |

#### Returns

`Promise`<`boolean` \| [`MessageId`](/api/types/api_model_aliases.MessageId.md)\>

`Promise <boolean | string>` This will either return true or the id of the message. It will return true after 10 seconds even if waitForId is true

___

### sendImageAsSticker

▸ **sendImageAsSticker**(`to`, `image`, `stickerMetadata?`): `Promise`<`string` \| `boolean` \| [`MessageId`](/api/types/api_model_aliases.MessageId.md)\>

This function takes an image (including animated GIF) and sends it as a sticker to the recipient. This is helpful for sending semi-ephemeral things like QR codes. 
The advantage is that it will not show up in the recipients gallery. This function automatiicaly converts images to the required webp format.

#### Parameters

| Name | Type |
| :------ | :------ |
| `to` | [`ChatId`](/api/types/api_model_aliases.ChatId.md) |
| `image` | `string` \| [`Base64`](/api/types/api_model_aliases.Base64.md) \| [`DataURL`](/api/types/api_model_aliases.DataURL.md) \| `Buffer` |
| `stickerMetadata?` | [`StickerMetadata`](/api/types/api_model_media.StickerMetadata.md) |

#### Returns

`Promise`<`string` \| `boolean` \| [`MessageId`](/api/types/api_model_aliases.MessageId.md)\>

___

### sendImageAsStickerAsReply <div class="label license insiders">insiders</div>

▸ **sendImageAsStickerAsReply**(`to`, `image`, `messageId`, `stickerMetadata?`): `Promise`<`string` \| `boolean` \| [`MessageId`](/api/types/api_model_aliases.MessageId.md)\>

:::license May require insiders license
Use this link to get the [correct license](https://gum.co/open-wa?wanted=true&tier=Insiders%20Program).
:::

This function takes an image and sends it as a sticker to the recipient as a reply to another message.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `to` | [`ChatId`](/api/types/api_model_aliases.ChatId.md) | The recipient id. |
| `image` | `string` \| [`Base64`](/api/types/api_model_aliases.Base64.md) \| [`DataURL`](/api/types/api_model_aliases.DataURL.md) \| `Buffer` | - |
| `messageId` | [`MessageId`](/api/types/api_model_aliases.MessageId.md) | The id of the message to reply to |
| `stickerMetadata?` | [`StickerMetadata`](/api/types/api_model_media.StickerMetadata.md) | Sticker metadata |

#### Returns

`Promise`<`string` \| `boolean` \| [`MessageId`](/api/types/api_model_aliases.MessageId.md)\>

___

### sendImageWithProduct

▸ **sendImageWithProduct**(`to`, `image`, `caption`, `bizNumber`, `productId`): `Promise`<`boolean` \| [`MessageId`](/api/types/api_model_aliases.MessageId.md)\>

Sends product with image to chat

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `to` | [`ChatId`](/api/types/api_model_aliases.ChatId.md) | - |
| `image` | [`Base64`](/api/types/api_model_aliases.Base64.md) | - |
| `caption` | [`Content`](/api/types/api_model_aliases.Content.md) | string the caption you want to add to this message |
| `bizNumber` | [`ContactId`](/api/types/api_model_aliases.ContactId.md) | string the @c.us number of the business account from which you want to grab the product |
| `productId` | `string` | string the id of the product within the main catalog of the aforementioned business |

#### Returns

`Promise`<`boolean` \| [`MessageId`](/api/types/api_model_aliases.MessageId.md)\>

___

### sendLinkWithAutoPreview

▸ **sendLinkWithAutoPreview**(`to`, `url`, `text?`, `thumbnail?`): `Promise`<`boolean` \| [`MessageId`](/api/types/api_model_aliases.MessageId.md)\>

Automatically sends a link with the auto generated link preview. You can also add a custom message.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `to` | [`ChatId`](/api/types/api_model_aliases.ChatId.md) | - |
| `url` | `string` | string A link. |
| `text?` | [`Content`](/api/types/api_model_aliases.Content.md) | string Custom text as body of the message, this needs to include the link or it will be appended after the link. |
| `thumbnail?` | [`Base64`](/api/types/api_model_aliases.Base64.md) | Base64 of the jpeg/png which will be used to override the automatically generated thumbnail. |

#### Returns

`Promise`<`boolean` \| [`MessageId`](/api/types/api_model_aliases.MessageId.md)\>

___

### sendListMessage

▸ **sendListMessage**(`to`, `sections`, `title`, `description`, `actionText`): `Promise`<`boolean` \| [`MessageId`](/api/types/api_model_aliases.MessageId.md)\>

**`Deprecated`**

:::danger

It is not currently possible to send a listmessage to a group chat. This is a WA limitation.
Please DO NOT get a license solely for access to list messages in group chats.

LIST MESSAGES ARE DEPRECATED TILL FURTHER NOTICE

:::

Send a list message. This will not work when being sent from business accounts!

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `to` | [`ChatId`](/api/types/api_model_aliases.ChatId.md) |  |
| `sections` | [`Section`](/api/interfaces/api_model_button.Section.md)[] | The Sections of rows for the list message |
| `title` | `string` | The title of the list message |
| `description` | `string` | The description of the list message |
| `actionText` | `string` | The action text of the list message |

#### Returns

`Promise`<`boolean` \| [`MessageId`](/api/types/api_model_aliases.MessageId.md)\>

___

### sendLocation

▸ **sendLocation**(`to`, `lat`, `lng`, `loc`, `address?`, `url?`): `Promise`<`boolean` \| [`MessageId`](/api/types/api_model_aliases.MessageId.md)\>

Note: `address` and `url` are parameters available to insiders only.

Sends a location message to given chat

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `to` | [`ChatId`](/api/types/api_model_aliases.ChatId.md) | chat id: `xxxxx@c.us` |
| `lat` | `string` | latitude: '51.5074' |
| `lng` | `string` | longitude: '0.1278' |
| `loc` | `string` | location text: 'LONDON!' |
| `address?` | `string` | address text: '1 Regents Park!' |
| `url?` | `string` | address text link: 'https://example.com' |

#### Returns

`Promise`<`boolean` \| [`MessageId`](/api/types/api_model_aliases.MessageId.md)\>

___

### sendMessageWithThumb

▸ **sendMessageWithThumb**(`thumb`, `url`, `title`, `description`, `text`, `chatId`): `Promise`<`boolean` \| [`MessageId`](/api/types/api_model_aliases.MessageId.md)\>

Sends a link to a chat that includes a link preview.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `thumb` | `string` | The base 64 data of the image you want to use as the thunbnail. This should be no more than 200x200px. Note: Dont need data url on this param |
| `url` | `string` | The link you want to send |
| `title` | `string` | The title of the link |
| `description` | `string` | The long description of the link preview |
| `text` | [`Content`](/api/types/api_model_aliases.Content.md) | The text you want to inslude in the message section. THIS HAS TO INCLUDE THE URL otherwise the url will be prepended to the text automatically. |
| `chatId` | [`ChatId`](/api/types/api_model_aliases.ChatId.md) | The chat you want to send this message to. |

#### Returns

`Promise`<`boolean` \| [`MessageId`](/api/types/api_model_aliases.MessageId.md)\>

___

### sendMp4AsSticker

▸ **sendMp4AsSticker**(`to`, `file`, `processOptions?`, `stickerMetadata?`, `messageId?`): `Promise`<`string` \| `boolean` \| [`MessageId`](/api/types/api_model_aliases.MessageId.md)\>

Use this to send an mp4 file as a sticker. This can also be used to convert GIFs from the chat because GIFs in WA are actually tiny mp4 files.

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `to` | [`ChatId`](/api/types/api_model_aliases.ChatId.md) | `undefined` | ChatId The chat id you want to send the webp sticker to |
| `file` | `string` \| [`Base64`](/api/types/api_model_aliases.Base64.md) \| [`DataURL`](/api/types/api_model_aliases.DataURL.md) \| `Buffer` | `undefined` | DataURL, Base64, URL (string GET), Relative filepath (string), or Buffer of the mp4 file |
| `processOptions` | [`Mp4StickerConversionProcessOptions`](/api/types/api_model_media.Mp4StickerConversionProcessOptions.md) | `defaultProcessOptions` | - |
| `stickerMetadata?` | [`StickerMetadata`](/api/types/api_model_media.StickerMetadata.md) | `undefined` | - |
| `messageId?` | [`MessageId`](/api/types/api_model_aliases.MessageId.md) | `undefined` | message id of the message you want this sticker to reply to. {@license:insiders@} |

#### Returns

`Promise`<`string` \| `boolean` \| [`MessageId`](/api/types/api_model_aliases.MessageId.md)\>

___

### sendMultipleContacts <div class="label license insiders">insiders</div>

▸ **sendMultipleContacts**(`to`, `contactIds`): `Promise`<`boolean` \| [`MessageId`](/api/types/api_model_aliases.MessageId.md)\>

:::license May require insiders license
Use this link to get the [correct license](https://gum.co/open-wa?wanted=true&tier=Insiders%20Program).
:::

Sends multiple contacts as a single message

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `to` | [`ChatId`](/api/types/api_model_aliases.ChatId.md) | 'xxxx@c.us' |
| `contactIds` | [`ContactId`](/api/types/api_model_aliases.ContactId.md)[] | - |

#### Returns

`Promise`<`boolean` \| [`MessageId`](/api/types/api_model_aliases.MessageId.md)\>

___

### sendPaymentRequest

▸ **sendPaymentRequest**(`to`, `amount`, `currency`, `message?`): `Promise`<`boolean` \| [`MessageId`](/api/types/api_model_aliases.MessageId.md)\>

[UNTESTED - REQUIRES FEEDBACK]
Sends a payment request message to given chat

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `to` | [`ChatId`](/api/types/api_model_aliases.ChatId.md) | chat id: `xxxxx@c.us` |
| `amount` | `number` | number the amount to request in 1000 format (e.g £10 => 10000) |
| `currency` | `string` | string The 3 letter currency code |
| `message?` | `string` | string optional message to send with the payment request |

#### Returns

`Promise`<`boolean` \| [`MessageId`](/api/types/api_model_aliases.MessageId.md)\>

___

### sendPoll

▸ **sendPoll**(`to`, `name`, `options`, `quotedMsgId?`, `allowMultiSelect?`): `Promise`<[`MessageId`](/api/types/api_model_aliases.MessageId.md)\>

Send a poll to a group chat

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `to` | [`GroupChatId`](/api/types/api_model_aliases.GroupChatId.md) | chat id - a group chat is required |
| `name` | `string` | the name of the poll |
| `options` | `string`[] | an array of poll options |
| `quotedMsgId?` | [`MessageId`](/api/types/api_model_aliases.MessageId.md) | A message to quote when sending the poll |
| `allowMultiSelect?` | `boolean` | Whether or not to allow multiple selections. default false |

#### Returns

`Promise`<[`MessageId`](/api/types/api_model_aliases.MessageId.md)\>

___

### sendProduct <div class="label license insiders">insiders</div>

▸ **sendProduct**(`chatId`, `productId`): `Promise`<[`MessageId`](/api/types/api_model_aliases.MessageId.md)\>

:::license May require insiders license
Use this link to get the [correct license](https://gum.co/open-wa?wanted=true&tier=Insiders%20Program).
:::

Send a product to a chat

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `chatId` | [`ChatId`](/api/types/api_model_aliases.ChatId.md) | The chatId |
| `productId` | `string` | The id of the product |

#### Returns

`Promise`<[`MessageId`](/api/types/api_model_aliases.MessageId.md)\>

MessageID

___

### sendPtt

▸ **sendPtt**(`to`, `file`, `quotedMsgId?`): `Promise`<[`MessageId`](/api/types/api_model_aliases.MessageId.md)\>

Attempts to send a file as a voice note. Useful if you want to send an mp3 file.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `to` | [`ChatId`](/api/types/api_model_aliases.ChatId.md) | chat id `xxxxx@c.us` |
| `file` | [`AdvancedFile`](/api/types/api_model_aliases.AdvancedFile.md) | base64 data:image/xxx;base64,xxx or the path of the file you want to send. |
| `quotedMsgId?` | [`MessageId`](/api/types/api_model_aliases.MessageId.md) | string true_0000000000@c.us_JHB2HB23HJ4B234HJB to send as a reply to a message |

#### Returns

`Promise`<[`MessageId`](/api/types/api_model_aliases.MessageId.md)\>

`Promise <boolean | string>` This will either return true or the id of the message. It will return true after 10 seconds even if waitForId is true

___

### sendRawWebpAsSticker

▸ **sendRawWebpAsSticker**(`to`, `webpBase64`, `animated?`): `Promise`<`string` \| `boolean` \| [`MessageId`](/api/types/api_model_aliases.MessageId.md)\>

You can use this to send a raw webp file.

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `to` | [`ChatId`](/api/types/api_model_aliases.ChatId.md) | `undefined` | ChatId The chat id you want to send the webp sticker to |
| `webpBase64` | [`Base64`](/api/types/api_model_aliases.Base64.md) | `undefined` | Base64 The base64 string of the webp file. Not DataURl |
| `animated` | `boolean` | `false` | Boolean Set to true if the webp is animated. Default `false` |

#### Returns

`Promise`<`string` \| `boolean` \| [`MessageId`](/api/types/api_model_aliases.MessageId.md)\>

___

### sendRawWebpAsStickerAsReply <div class="label license insiders">insiders</div>

▸ **sendRawWebpAsStickerAsReply**(`to`, `messageId`, `webpBase64`, `animated?`): `Promise`<`string` \| `boolean` \| [`MessageId`](/api/types/api_model_aliases.MessageId.md)\>

:::license May require insiders license
Use this link to get the [correct license](https://gum.co/open-wa?wanted=true&tier=Insiders%20Program).
:::

You can use this to send a raw webp file.

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `to` | [`ChatId`](/api/types/api_model_aliases.ChatId.md) | `undefined` | ChatId The chat id you want to send the webp sticker to |
| `messageId` | [`MessageId`](/api/types/api_model_aliases.MessageId.md) | `undefined` | MessageId Message ID of the message to reply to |
| `webpBase64` | [`Base64`](/api/types/api_model_aliases.Base64.md) | `undefined` | Base64 The base64 string of the webp file. Not DataURl |
| `animated` | `boolean` | `false` | Boolean Set to true if the webp is animated. Default `false` |

#### Returns

`Promise`<`string` \| `boolean` \| [`MessageId`](/api/types/api_model_aliases.MessageId.md)\>

___

### sendReplyWithMentions

▸ **sendReplyWithMentions**(`to`, `content`, `replyMessageId`, `hideTags?`, `mentions?`): `Promise`<`boolean` \| [`MessageId`](/api/types/api_model_aliases.MessageId.md)\>

Sends a reply to given chat that includes mentions, replying to the provided replyMessageId.
In order to use this method correctly you will need to send the text like this:
"@4474747474747 how are you?"
Basically, add a @ symbol before the number of the contact you want to mention.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `to` | [`ChatId`](/api/types/api_model_aliases.ChatId.md) | chat id: `xxxxx@c.us` |
| `content` | [`Content`](/api/types/api_model_aliases.Content.md) | text message |
| `replyMessageId` | [`MessageId`](/api/types/api_model_aliases.MessageId.md) | id of message to reply to |
| `hideTags?` | `boolean` | Removes all tags within the message |
| `mentions?` | [`ContactId`](/api/types/api_model_aliases.ContactId.md)[] | You can optionally add an array of contact IDs to tag only specific people |

#### Returns

`Promise`<`boolean` \| [`MessageId`](/api/types/api_model_aliases.MessageId.md)\>

___

### sendSeen

▸ **sendSeen**(`chatId`): `Promise`<`boolean`\>

Sets a chat status to seen. Marks all messages as ack: 3

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `chatId` | [`ChatId`](/api/types/api_model_aliases.ChatId.md) | chat id: `xxxxx@c.us` |

#### Returns

`Promise`<`boolean`\>

___

### sendStickerfromUrl

▸ **sendStickerfromUrl**(`to`, `url`, `requestConfig?`, `stickerMetadata?`): `Promise`<`string` \| `boolean` \| [`MessageId`](/api/types/api_model_aliases.MessageId.md)\>

Sends a sticker (including GIF) from a given URL

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `to` | [`ChatId`](/api/types/api_model_aliases.ChatId.md) | - |
| `url` | `string` | - |
| `requestConfig` | `AxiosRequestConfig`<`any`\> | {} By default the request is a get request, however you can override that and many other options by sending this parameter. You can read more about this parameter here: https://github.com/axios/axios#request-config |
| `stickerMetadata?` | [`StickerMetadata`](/api/types/api_model_media.StickerMetadata.md) | - |

#### Returns

`Promise`<`string` \| `boolean` \| [`MessageId`](/api/types/api_model_aliases.MessageId.md)\>

`Promise<MessageId | boolean>`

___

### sendStickerfromUrlAsReply <div class="label license insiders">insiders</div>

▸ **sendStickerfromUrlAsReply**(`to`, `url`, `messageId`, `requestConfig?`, `stickerMetadata?`): `Promise`<`boolean` \| [`MessageId`](/api/types/api_model_aliases.MessageId.md)\>

:::license May require insiders license
Use this link to get the [correct license](https://gum.co/open-wa?wanted=true&tier=Insiders%20Program).
:::

Sends a sticker from a given URL

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `to` | [`ChatId`](/api/types/api_model_aliases.ChatId.md) | The recipient id. |
| `url` | `string` | The url of the image |
| `messageId` | [`MessageId`](/api/types/api_model_aliases.MessageId.md) | The id of the message to reply to |
| `requestConfig` | `AxiosRequestConfig`<`any`\> | {} By default the request is a get request, however you can override that and many other options by sending this parameter. You can read more about this parameter here: https://github.com/axios/axios#request-config |
| `stickerMetadata?` | [`StickerMetadata`](/api/types/api_model_media.StickerMetadata.md) | - |

#### Returns

`Promise`<`boolean` \| [`MessageId`](/api/types/api_model_aliases.MessageId.md)\>

`Promise<MessageId | boolean>`

___

### sendText <div class="label license restricted">restricted</div>

▸ **sendText**(`to`, `content`): `Promise`<`boolean` \| [`MessageId`](/api/types/api_model_aliases.MessageId.md)\>

:::license May require restricted license
Use this link to get the [correct license](https://gum.co/open-wa?wanted=true&tier=1%20Restricted%20License).
:::

Sends a text message to given chat

A license is **NOT** required to send messages with existing chats/contacts. A license is only required for starting conversations with new numbers.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `to` | [`ChatId`](/api/types/api_model_aliases.ChatId.md) | chat id: `xxxxx@c.us` |
| `content` | [`Content`](/api/types/api_model_aliases.Content.md) | text message |

#### Returns

`Promise`<`boolean` \| [`MessageId`](/api/types/api_model_aliases.MessageId.md)\>

___

### sendTextWithMentions

▸ **sendTextWithMentions**(`to`, `content`, `hideTags?`, `mentions?`): `Promise`<`boolean` \| [`MessageId`](/api/types/api_model_aliases.MessageId.md)\>

Sends a text message to given chat that includes mentions.
In order to use this method correctly you will need to send the text like this:
"@4474747474747 how are you?"
Basically, add a @ symbol before the number of the contact you want to mention.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `to` | [`ChatId`](/api/types/api_model_aliases.ChatId.md) | chat id: `xxxxx@c.us` |
| `content` | [`Content`](/api/types/api_model_aliases.Content.md) | text message |
| `hideTags?` | `boolean` | Removes all tags within the message |
| `mentions?` | [`ContactId`](/api/types/api_model_aliases.ContactId.md)[] | You can optionally add an array of contact IDs to tag only specific people |

#### Returns

`Promise`<`boolean` \| [`MessageId`](/api/types/api_model_aliases.MessageId.md)\>

___

### sendVCard

▸ **sendVCard**(`chatId`, `vcard`, `contactName?`, `contactNumber?`): `Promise`<`boolean`\>

Send VCARD

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `chatId` | [`ChatId`](/api/types/api_model_aliases.ChatId.md) | '000000000000@c.us' |
| `vcard` | `string` | vcard as a string, you can send multiple contacts vcard also. |
| `contactName?` | `string` | The display name for the contact. Ignored on multiple vcards |
| `contactNumber?` | `string` | If supplied, this will be injected into the vcard (VERSION 3 ONLY FROM VCARDJS) with the WA id to make it show up with the correct buttons on WA. The format of this param should be including country code, without any other formating. e.g: `4477777777777`  Ignored on multiple vcards |

#### Returns

`Promise`<`boolean`\>

___

### sendVideoAsGif

▸ **sendVideoAsGif**(`to`, `file`, `filename`, `caption`, `quotedMsgId?`, `requestConfig?`): `Promise`<[`MessageId`](/api/types/api_model_aliases.MessageId.md)\>

Sends a video to given chat as a gif, with caption or not, using base64

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `to` | [`ChatId`](/api/types/api_model_aliases.ChatId.md) | chat id `xxxxx@c.us` |
| `file` | [`AdvancedFile`](/api/types/api_model_aliases.AdvancedFile.md) | DataURL data:image/xxx;base64,xxx or the RELATIVE (should start with `./` or `../`) path of the file you want to send. With the latest version, you can now set this to a normal URL (for example [GET] `https://file-examples-com.github.io/uploads/2017/10/file_example_JPG_2500kB.jpg`). |
| `filename` | `string` | string xxxxx |
| `caption` | [`Content`](/api/types/api_model_aliases.Content.md) | string xxxxx |
| `quotedMsgId?` | [`MessageId`](/api/types/api_model_aliases.MessageId.md) | string true_0000000000@c.us_JHB2HB23HJ4B234HJB to send as a reply to a message |
| `requestConfig` | `AxiosRequestConfig`<`any`\> | {} By default the request is a get request, however you can override that and many other options by sending this parameter. You can read more about this parameter here: https://github.com/axios/axios#request-config |

#### Returns

`Promise`<[`MessageId`](/api/types/api_model_aliases.MessageId.md)\>

___

### sendYoutubeLink

▸ **sendYoutubeLink**(`to`, `url`, `text?`, `thumbnail?`): `Promise`<`boolean` \| [`MessageId`](/api/types/api_model_aliases.MessageId.md)\>

Automatically sends a youtube link with the auto generated link preview. You can also add a custom message.

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `to` | [`ChatId`](/api/types/api_model_aliases.ChatId.md) | `undefined` | - |
| `url` | `string` | `undefined` | string A youtube link. |
| `text` | [`Content`](/api/types/api_model_aliases.Content.md) | `''` | string Custom text as body of the message, this needs to include the link or it will be appended after the link. |
| `thumbnail?` | [`Base64`](/api/types/api_model_aliases.Base64.md) | `undefined` | string Base64 of the jpeg/png which will be used to override the automatically generated thumbnail. |

#### Returns

`Promise`<`boolean` \| [`MessageId`](/api/types/api_model_aliases.MessageId.md)\>

___

### setChatBackgroundColourHex <div class="label license insiders">insiders</div>

▸ **setChatBackgroundColourHex**(`hex`): `Promise`<`boolean`\>

:::license May require insiders license
Use this link to get the [correct license](https://gum.co/open-wa?wanted=true&tier=Insiders%20Program).
:::

Set the wallpaper background colour

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `hex` | `string` | '#FFF123' |

#### Returns

`Promise`<`boolean`\>

___

### setChatEphemeral <div class="label license insiders">insiders</div>

▸ **setChatEphemeral**(`chatId`, `ephemeral`): `Promise`<`boolean`\>

:::license May require insiders license
Use this link to get the [correct license](https://gum.co/open-wa?wanted=true&tier=Insiders%20Program).
:::

Turn the ephemeral setting in a chat to on or off

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `chatId` | [`ChatId`](/api/types/api_model_aliases.ChatId.md) | The ID of the chat |
| `ephemeral` | `boolean` \| [`EphemeralDuration`](/api/types/api_model_chat.EphemeralDuration.md) | `true` to turn on the ephemeral setting to 1 day, `false` to turn off the ephemeral setting. Other options: `604800 \| 7776000` |

#### Returns

`Promise`<`boolean`\>

`Promise<boolean>` true if the setting was set, `false` if the chat does not exist

___

### setChatState

▸ **setChatState**(`chatState`, `chatId`): `Promise`<`boolean`\>

Sets the chat state

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `chatState` | [`ChatState`](/api/enums/api_model_chat.ChatState.md) | The state you want to set for the chat. Can be TYPING (0), RECRDING (1) or PAUSED (2). |
| `chatId` | [`ChatId`](/api/types/api_model_aliases.ChatId.md) |  |

#### Returns

`Promise`<`boolean`\>

___

### setGroupApprovalMode

▸ **setGroupApprovalMode**(`groupId`, `requireApproval`): `Promise`<`boolean`\>

Turn on or off the approval requirement for new members to join a group

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `groupId` | [`GroupChatId`](/api/types/api_model_aliases.GroupChatId.md) | '0000000000-00000000@g.us' the group id. |
| `requireApproval` | `boolean` | set to true to turn on the approval requirement, false to turn off |

#### Returns

`Promise`<`boolean`\>

boolean true if action completed successfully.

___

### setGroupDescription

▸ **setGroupDescription**(`groupId`, `description`): `Promise`<`boolean`\>

Change the group chant description

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `groupId` | [`GroupChatId`](/api/types/api_model_aliases.GroupChatId.md) | '0000000000-00000000@g.us' the group id. |
| `description` | `string` | string The new group description |

#### Returns

`Promise`<`boolean`\>

boolean true if action completed successfully.

___

### setGroupEditToAdminsOnly

▸ **setGroupEditToAdminsOnly**(`groupId`, `onlyAdmins`): `Promise`<`boolean`\>

Change who can and cannot edit a groups details

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `groupId` | [`GroupChatId`](/api/types/api_model_aliases.GroupChatId.md) | '0000000000-00000000@g.us' the group id. |
| `onlyAdmins` | `boolean` | boolean set to true if you want only admins to be able to speak in this group. false if you want to allow everyone to speak in the group |

#### Returns

`Promise`<`boolean`\>

boolean true if action completed successfully.

___

### setGroupIcon

▸ **setGroupIcon**(`groupId`, `image`): `Promise`<`boolean`\>

Change the icon for the group chat

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `groupId` | [`GroupChatId`](/api/types/api_model_aliases.GroupChatId.md) | 123123123123_1312313123@g.us The id of the group |
| `image` | [`DataURL`](/api/types/api_model_aliases.DataURL.md) | - |

#### Returns

`Promise`<`boolean`\>

boolean true if it was set, false if it didn't work. It usually doesn't work if the image file is too big.

___

### setGroupIconByUrl

▸ **setGroupIconByUrl**(`groupId`, `url`, `requestConfig?`): `Promise`<`boolean`\>

Change the icon for the group chat

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `groupId` | [`GroupChatId`](/api/types/api_model_aliases.GroupChatId.md) | 123123123123_1312313123@g.us The id of the group |
| `url` | `string` | - |
| `requestConfig` | `AxiosRequestConfig`<`any`\> | {} By default the request is a get request, however you can override that and many other options by sending this parameter. You can read more about this parameter here: https://github.com/axios/axios#request-config |

#### Returns

`Promise`<`boolean`\>

boolean true if it was set, false if it didn't work. It usually doesn't work if the image file is too big.

___

### setGroupTitle <div class="label license insiders">insiders</div>

▸ **setGroupTitle**(`groupId`, `title`): `Promise`<`boolean`\>

:::license May require insiders license
Use this link to get the [correct license](https://gum.co/open-wa?wanted=true&tier=Insiders%20Program).
:::

Change the group chat title

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `groupId` | [`GroupChatId`](/api/types/api_model_aliases.GroupChatId.md) | '0000000000-00000000@g.us' the group id. |
| `title` | `string` | string The new group title |

#### Returns

`Promise`<`boolean`\>

boolean true if action completed successfully.

___

### setGroupToAdminsOnly

▸ **setGroupToAdminsOnly**(`groupId`, `onlyAdmins`): `Promise`<`boolean`\>

Change who can and cannot speak in a group

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `groupId` | [`GroupChatId`](/api/types/api_model_aliases.GroupChatId.md) | '0000000000-00000000@g.us' the group id. |
| `onlyAdmins` | `boolean` | boolean set to true if you want only admins to be able to speak in this group. false if you want to allow everyone to speak in the group |

#### Returns

`Promise`<`boolean`\>

boolean true if action completed successfully.

___

### setMyName

▸ **setMyName**(`newName`): `Promise`<`boolean`\>

Set your profile name

Please note, this does not work on business accounts!

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `newName` | `string` | String new name to set for your profile |

#### Returns

`Promise`<`boolean`\>

___

### setMyStatus

▸ **setMyStatus**(`newStatus`): `Promise`<`boolean` \| `void`\>

set your about me

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `newStatus` | `string` | String new profile status |

#### Returns

`Promise`<`boolean` \| `void`\>

___

### setPresence

▸ **setPresence**(`available`): `Promise`<`boolean` \| `void`\>

Set presence to available or unavailable.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `available` | `boolean` | if true it will set your presence to 'online', false will set to unavailable (i.e no 'online' on recipients' phone); |

#### Returns

`Promise`<`boolean` \| `void`\>

___

### setProfilePic

▸ **setProfilePic**(`data`): `Promise`<`boolean`\>

Sets the profile pic of the host number.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `data` | [`DataURL`](/api/types/api_model_aliases.DataURL.md) | string data url image string. |

#### Returns

`Promise`<`boolean`\>

`Promise<boolean>` success if true

___

### simulateRecording

▸ **simulateRecording**(`to`, `on`): `Promise`<`boolean`\>

Simulate '...recording' in chat

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `to` | [`ChatId`](/api/types/api_model_aliases.ChatId.md) | 'xxxx@c.us' |
| `on` | `boolean` | turn on similated recording, false to turn it off you need to manually turn this off. |

#### Returns

`Promise`<`boolean`\>

___

### simulateTyping

▸ **simulateTyping**(`to`, `on`): `Promise`<`boolean`\>

Simulate '...typing' in chat

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `to` | [`ChatId`](/api/types/api_model_aliases.ChatId.md) | 'xxxx@c.us' |
| `on` | `boolean` | turn on similated typing, false to turn it off you need to manually turn this off. |

#### Returns

`Promise`<`boolean`\>

___

### starMessage

▸ **starMessage**(`messageId`): `Promise`<`boolean`\>

Star a message

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `messageId` | [`MessageId`](/api/types/api_model_aliases.MessageId.md) | Message ID of the message you want to star |

#### Returns

`Promise`<`boolean`\>

`true`

___

### syncContacts

▸ **syncContacts**(): `Promise`<`boolean`\>

Syncs contacts with phone. This promise does not resolve so it will instantly return true.

#### Returns

`Promise`<`boolean`\>

___

### tagEveryone <div class="label license insiders">insiders</div>

▸ **tagEveryone**(`groupId`, `content`, `hideTags?`, `formatting?`, `messageBeforeTags?`): `Promise`<`boolean` \| [`MessageId`](/api/types/api_model_aliases.MessageId.md)\>

:::license May require insiders license
Use this link to get the [correct license](https://gum.co/open-wa?wanted=true&tier=Insiders%20Program).
:::

Tags everyone in the group with a message

**`Mention`**

to indicate the actual tag.

**`Default`**

`@mention `

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `groupId` | [`GroupChatId`](/api/types/api_model_aliases.GroupChatId.md) | group chat id: `xxxxx@g.us` |
| `content` | [`Content`](/api/types/api_model_aliases.Content.md) | text message to add under all of the tags |
| `hideTags?` | `boolean` | Removes all tags within the message |
| `formatting?` | `string` | The formatting of the tags. Use |
| `messageBeforeTags?` | `boolean` | set to `true` to show the message before all of the tags |

#### Returns

`Promise`<`boolean` \| [`MessageId`](/api/types/api_model_aliases.MessageId.md)\>

`Promise<MessageId>`

___

### testButtons

▸ **testButtons**(`chatId`): `Promise`<`any`\>

**`Deprecated`**

:::danger

Buttons are broken for the foreseeable future. Please DO NOT get a license solely for access to buttons. They are no longer reliable due to recent changes at WA.

:::

Test the button commands on MD accounts with an insiders key. This is a temporary feature to help fix issue #2658

#### Parameters

| Name | Type |
| :------ | :------ |
| `chatId` | [`ChatId`](/api/types/api_model_aliases.ChatId.md) |

#### Returns

`Promise`<`any`\>

___

### testCallback

▸ **testCallback**(`callbackToTest`, `testData`): `Promise`<`boolean`\>

Use this simple command to test firing callback events.

#### Parameters

| Name | Type |
| :------ | :------ |
| `callbackToTest` | [`SimpleListener`](/api/enums/api_model_events.SimpleListener.md) |
| `testData` | `any` |

#### Returns

`Promise`<`boolean`\>

`false` if the callback was not registered/does not exist

___

### unmuteChat <div class="label license insiders">insiders</div>

▸ **unmuteChat**(`chatId`): `Promise`<`string` \| `number` \| `boolean`\>

:::license May require insiders license
Use this link to get the [correct license](https://gum.co/open-wa?wanted=true&tier=Insiders%20Program).
:::

Unmutes a conversation.

#### Parameters

| Name | Type |
| :------ | :------ |
| `chatId` | [`ChatId`](/api/types/api_model_aliases.ChatId.md) |

#### Returns

`Promise`<`string` \| `number` \| `boolean`\>

boolean true: worked or error code or message

___

### unstarMessage

▸ **unstarMessage**(`messageId`): `Promise`<`boolean`\>

Unstar a message

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `messageId` | [`MessageId`](/api/types/api_model_aliases.MessageId.md) | Message ID of the message you want to unstar |

#### Returns

`Promise`<`boolean`\>

`true`

___

### updateWebhook

▸ **updateWebhook**(`webhookId`, `events`): `Promise`<``false`` \| [`Webhook`](/api/interfaces/api_model_config.Webhook.md)\>

Update registered events for a specific webhook. This will override all existing events. If you'd like to remove all listeners from a webhook, consider using [removeWebhook](/api/classes/api_Client.Client.md#removewebhook).

In order to update authentication details for a webhook, remove it completely and then reregister it with the correct credentials.

#### Parameters

| Name | Type |
| :------ | :------ |
| `webhookId` | `string` |
| `events` | [`SimpleListener`](/api/enums/api_model_events.SimpleListener.md)[] \| ``"all"`` |

#### Returns

`Promise`<``false`` \| [`Webhook`](/api/interfaces/api_model_config.Webhook.md)\>

___

### waitAllQEmpty

▸ **waitAllQEmpty**(): `Promise`<``true`` \| `void`[]\>

Wait for all queues to be empty

#### Returns

`Promise`<``true`` \| `void`[]\>

___

### waitWhQIdle

▸ **waitWhQIdle**(): `Promise`<``true`` \| `void`\>

Wait for the webhook queue to become idle. This is useful for ensuring webhooks are cleared before ending a process.

#### Returns

`Promise`<``true`` \| `void`\>

## Events

### onAck

▸ **onAck**(`fn`): `Promise`<`boolean` \| `Listener`\>

Listens to messages acknowledgement Changes

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fn` | (`message`: [`Message`](/api/interfaces/api_model_message.Message.md)) => `void` | callback function that handles a Message as the first and only parameter. |

#### Returns

`Promise`<`boolean` \| `Listener`\>

`true` if the callback was registered

___

### onAddedToGroup

▸ **onAddedToGroup**(`fn`): `Promise`<`boolean` \| `Listener`\>

Fires callback with Chat object every time the host phone is added to a group.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fn` | (`chat`: [`Chat`](/api/types/api_model_chat.Chat.md)) => `any` | callback function that handles a Chat (group chat) as the first and only parameter. |

#### Returns

`Promise`<`boolean` \| `Listener`\>

`true` if the callback was registered

___

### onAnyMessage

▸ **onAnyMessage**(`fn`, `queueOptions?`): `Promise`<`boolean` \| `Listener`\>

Listens to all new messages

**`Fires`**

Message

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fn` | (`message`: [`Message`](/api/interfaces/api_model_message.Message.md)) => `void` | callback |
| `queueOptions?` | `Options`<`default`, `DefaultAddOptions`\> | PQueue options. Set to `{}` for default PQueue. |

#### Returns

`Promise`<`boolean` \| `Listener`\>

___

### onBattery

▸ **onBattery**(`fn`): `Promise`<`boolean` \| `Listener`\>

**`Deprecated`**

Listens to battery changes

:::caution

 This will most likely not work with multi-device mode (the only remaining mode) since the session is no longer connected to the phone but directly to WA servers.

:::

**`Fires`**

number

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fn` | (`battery`: `number`) => `void` | callback |

#### Returns

`Promise`<`boolean` \| `Listener`\>

___

### onBroadcast

▸ **onBroadcast**(`fn`): `Promise`<`boolean` \| `Listener`\>

Listens to broadcast messages

**`Fires`**

Message

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fn` | (`message`: [`Message`](/api/interfaces/api_model_message.Message.md)) => `void` | callback |

#### Returns

`Promise`<`boolean` \| `Listener`\>

___

### onButton

▸ **onButton**(`fn`): `Promise`<`boolean` \| `Listener`\>

Listens to button message responses

**`Fires`**

Message

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fn` | (`message`: [`Message`](/api/interfaces/api_model_message.Message.md)) => `void` | callback |

#### Returns

`Promise`<`boolean` \| `Listener`\>

___

### onCallState

▸ **onCallState**(`fn`): `Promise`<`boolean` \| `Listener`\>

Listens to changes on call state

#### Parameters

| Name | Type |
| :------ | :------ |
| `fn` | (`call`: [`Call`](/api/interfaces/api_model_call.Call.md)) => `void` |

#### Returns

`Promise`<`boolean` \| `Listener`\>

Observable stream of call objects

___

### onChatDeleted

▸ **onChatDeleted**(`fn`): `Promise`<`boolean` \| `Listener`\>

Listens to when a chat is deleted by the host account

**`Fires`**

Chat

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fn` | (`chat`: [`Chat`](/api/types/api_model_chat.Chat.md)) => `void` | callback |

#### Returns

`Promise`<`boolean` \| `Listener`\>

___

### onChatOpened <div class="label license insiders">insiders</div>

▸ **onChatOpened**(`fn`): `Promise`<`boolean` \| `Listener`\>

:::license May require insiders license
Use this link to get the [correct license](https://gum.co/open-wa?wanted=true&tier=Insiders%20Program).
:::

Fires callback with the relevant chat id every time the user clicks on a chat. This will only work in headful mode.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fn` | (`chat`: [`Chat`](/api/types/api_model_chat.Chat.md)) => `any` | callback function that handles a ChatId as the first and only parameter. |

#### Returns

`Promise`<`boolean` \| `Listener`\>

`true` if the callback was registered

___

### onChatState <div class="label license insiders">insiders</div>

▸ **onChatState**(`fn`): `Promise`<`boolean` \| `Listener`\>

:::license May require insiders license
Use this link to get the [correct license](https://gum.co/open-wa?wanted=true&tier=Insiders%20Program).
:::

Listens to chat state, including when a specific user is recording and typing within a group chat.

 

Here is an example of the fired object:

**`Fires`**

```javascript
{
"chat": "00000000000-1111111111@g.us", //the chat in which this state is occuring
"user": "22222222222@c.us", //the user that is causing this state
"state": "composing, //can also be 'available', 'unavailable', 'recording' or 'composing'
}
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `fn` | (`chatState`: [`ChatState`](/api/enums/api_model_chat.ChatState.md)) => `void` |

#### Returns

`Promise`<`boolean` \| `Listener`\>

___

### onContactAdded <div class="label license insiders">insiders</div>

▸ **onContactAdded**(`fn`): `Promise`<`boolean` \| `Listener`\>

:::license May require insiders license
Use this link to get the [correct license](https://gum.co/open-wa?wanted=true&tier=Insiders%20Program).
:::

Fires callback with contact id when a new contact is added on the host phone.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fn` | (`chat`: [`Chat`](/api/types/api_model_chat.Chat.md)) => `any` | callback function that handles a Chat as the first and only parameter. |

#### Returns

`Promise`<`boolean` \| `Listener`\>

`true` if the callback was registered

___

### onGlobalParticipantsChanged

▸ **onGlobalParticipantsChanged**(`fn`): `Promise`<`boolean` \| `Listener`\>

Listens to add and remove events on Groups on a global level. It is memory efficient and doesn't require a specific group id to listen to.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fn` | (`participantChangedEvent`: [`ParticipantChangedEventModel`](/api/interfaces/api_model_group_metadata.ParticipantChangedEventModel.md)) => `void` | callback function that handles a ParticipantChangedEventModel as the first and only parameter. |

#### Returns

`Promise`<`boolean` \| `Listener`\>

`true` if the callback was registered

___

### onGroupApprovalRequest

▸ **onGroupApprovalRequest**(`fn`): `Promise`<`boolean` \| `Listener`\>

Listents to group approval requests. Emits a message object. Use it with `message.isGroupApprovalRequest()` to check if it is a group approval request.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fn` | (`groupApprovalRequestMessage`: [`Message`](/api/interfaces/api_model_message.Message.md)) => `void` | callback function that handles a Message as the first and only parameter. |

#### Returns

`Promise`<`boolean` \| `Listener`\>

`true` if the callback was registered

___

### onGroupChange

▸ **onGroupChange**(`fn`): `Promise`<`boolean` \| `Listener`\>

Listens to all group (gp2) events. This can be useful if you want to catch when a group title, subject or picture is changed.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fn` | (`genericGroupChangeEvent`: [`GenericGroupChangeEvent`](/api/interfaces/api_model_group_metadata.GenericGroupChangeEvent.md)) => `void` | callback function that handles a ParticipantChangedEventModel as the first and only parameter. |

#### Returns

`Promise`<`boolean` \| `Listener`\>

`true` if the callback was registered

___

### onIncomingCall

▸ **onIncomingCall**(`fn`): `Promise`<`boolean` \| `Listener`\>

Listens to new incoming calls

#### Parameters

| Name | Type |
| :------ | :------ |
| `fn` | (`call`: [`Call`](/api/interfaces/api_model_call.Call.md)) => `void` |

#### Returns

`Promise`<`boolean` \| `Listener`\>

Observable stream of call request objects

___

### onLabel

▸ **onLabel**(`fn`): `Promise`<`boolean` \| `Listener`\>

Listens to label change events

**`Fires`**

Label

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fn` | (`label`: [`Label`](/api/interfaces/api_model_label.Label.md)) => `void` | callback |

#### Returns

`Promise`<`boolean` \| `Listener`\>

___

### onLiveLocation

▸ **onLiveLocation**(`chatId`, `fn`): `Promise`<`boolean`\>

Listens to live locations from a chat that already has valid live locations

**`Emits`**

`<LiveLocationChangedEvent>` LiveLocationChangedEvent

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `chatId` | [`ChatId`](/api/types/api_model_aliases.ChatId.md) | the chat from which you want to subscribes to live location updates |
| `fn` | (`liveLocationChangedEvent`: [`LiveLocationChangedEvent`](/api/interfaces/api_model_chat.LiveLocationChangedEvent.md)) => `void` | callback that takes in a LiveLocationChangedEvent |

#### Returns

`Promise`<`boolean`\>

boolean, if returns false then there were no valid live locations in the chat of chatId

___

### onLogout

▸ **onLogout**(`fn`, `priority?`): `Promise`<`boolean`\>

Listens to a log out event

**`Fires`**

`true`

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fn` | (`loggedOut?`: `boolean`) => `any` | callback |
| `priority?` | `number` | A priority of -1 will mean the callback will be triggered after all the non -1 callbacks |

#### Returns

`Promise`<`boolean`\>

___

### onMessage

▸ **onMessage**(`fn`, `queueOptions?`): `Promise`<`boolean` \| `Listener`\>

Listens to incoming messages

**`Fires`**

Message

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fn` | (`message`: [`Message`](/api/interfaces/api_model_message.Message.md)) => `void` | callback |
| `queueOptions?` | `Options`<`default`, `DefaultAddOptions`\> | PQueue options. Set to `{}` for default PQueue. |

#### Returns

`Promise`<`boolean` \| `Listener`\>

___

### onMessageDeleted

▸ **onMessageDeleted**(`fn`): `Promise`<`boolean` \| `Listener`\>

Listens to when a message is deleted by a recipient or the host account

**`Fires`**

Message

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fn` | (`message`: [`Message`](/api/interfaces/api_model_message.Message.md)) => `void` | callback |

#### Returns

`Promise`<`boolean` \| `Listener`\>

___

### onParticipantsChanged

▸ **onParticipantsChanged**(`groupId`, `fn`, `legacy?`): `Promise`<`boolean` \| `Listener`\>

Listens to add and remove events on Groups. This can no longer determine who commited the action and only reports the following events add, remove, promote, demote

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `groupId` | [`GroupChatId`](/api/types/api_model_aliases.GroupChatId.md) | `undefined` | group id: xxxxx-yyyy@c.us |
| `fn` | (`participantChangedEvent`: [`ParticipantChangedEventModel`](/api/interfaces/api_model_group_metadata.ParticipantChangedEventModel.md)) => `void` | `undefined` | callback |
| `legacy` | `boolean` | `false` | - |

#### Returns

`Promise`<`boolean` \| `Listener`\>

Observable stream of participantChangedEvent

___

### onPlugged

▸ **onPlugged**(`fn`): `Promise`<`boolean` \| `Listener`\>

Listens to when host device is plugged/unplugged

**`Fires`**

boolean true if plugged, false if unplugged

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fn` | (`plugged`: `boolean`) => `void` | callback |

#### Returns

`Promise`<`boolean` \| `Listener`\>

___

### onPollVote

▸ **onPollVote**(`fn`): `Promise`<`boolean` \| `Listener`\>

Listens to poll vote events

**`Fires`**

PollData

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fn` | (`pollDate`: [`PollData`](/api/interfaces/api_model_message.PollData.md)) => `void` | callback |

#### Returns

`Promise`<`boolean` \| `Listener`\>

___

### onReaction <div class="label license insiders">insiders</div>

▸ **onReaction**(`fn`): `Promise`<`boolean` \| `Listener`\>

:::license May require insiders license
Use this link to get the [correct license](https://gum.co/open-wa?wanted=true&tier=Insiders%20Program).
:::

Listens to reaction add and change events

**`Fires`**

ReactionEvent

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fn` | (`reactionEvent`: [`ReactionEvent`](/api/types/api_model_reactions.ReactionEvent.md)) => `void` | callback |

#### Returns

`Promise`<`boolean` \| `Listener`\>

___

### onRemovedFromGroup <div class="label license insiders">insiders</div>

▸ **onRemovedFromGroup**(`fn`): `Promise`<`boolean` \| `Listener`\>

:::license May require insiders license
Use this link to get the [correct license](https://gum.co/open-wa?wanted=true&tier=Insiders%20Program).
:::

Fires callback with Chat object every time the host phone is removed to a group.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fn` | (`chat`: [`Chat`](/api/types/api_model_chat.Chat.md)) => `any` | callback function that handles a Chat (group chat) as the first and only parameter. |

#### Returns

`Promise`<`boolean` \| `Listener`\>

`true` if the callback was registered

___

### onStateChanged

▸ **onStateChanged**(`fn`): `Promise`<`boolean` \| `Listener`\>

Listens to changes in state

**`Fires`**

STATE observable sream of states

#### Parameters

| Name | Type |
| :------ | :------ |
| `fn` | (`state`: [`STATE`](/api/enums/api_model.STATE.md)) => `void` |

#### Returns

`Promise`<`boolean` \| `Listener`\>

___

### onStory <div class="label license restricted">restricted</div>

▸ **onStory**(`fn`): `Promise`<`boolean` \| `Listener`\>

:::license May require restricted license
Use this link to get the [correct license](https://gum.co/open-wa?wanted=true&tier=1%20Restricted%20License).
:::

Listens to when a contact posts a new story.

**`Fires`**

e.g 

```javascript
{
from: '123456789@c.us'
id: 'false_132234234234234@status.broadcast'
}
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fn` | (`story`: [`Message`](/api/interfaces/api_model_message.Message.md)) => `void` | callback |

#### Returns

`Promise`<`boolean` \| `Listener`\>
