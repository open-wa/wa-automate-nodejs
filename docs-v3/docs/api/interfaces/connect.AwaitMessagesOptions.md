---
id: "connect.AwaitMessagesOptions"
title: "Interface: AwaitMessagesOptions"
sidebar_label: "AwaitMessagesOptions"
custom_edit_url: null
---

[connect](/api/modules/connect.md).AwaitMessagesOptions

Options to be applied to the collector.

## Hierarchy

- [`CollectorOptions`](/api/interfaces/connect.CollectorOptions.md)

  ↳ **`AwaitMessagesOptions`**

## Properties

### dispose

• `Optional` **dispose**: `boolean`

Whether to dispose data when it's deleted

#### Inherited from

[CollectorOptions](/api/interfaces/connect.CollectorOptions.md).[dispose](/api/interfaces/connect.CollectorOptions.md#dispose-6)

___

### errors

• `Optional` **errors**: `string`[]

An array of "reasons" that would result in the awaitMessages command to throw an error.

___

### idle

• `Optional` **idle**: `number`

Max time allowed idle

#### Inherited from

[CollectorOptions](/api/interfaces/connect.CollectorOptions.md).[idle](/api/interfaces/connect.CollectorOptions.md#idle-6)

___

### max

• `Optional` **max**: `number`

The maximum amount of items to collect

#### Inherited from

[CollectorOptions](/api/interfaces/connect.CollectorOptions.md).[max](/api/interfaces/connect.CollectorOptions.md#max-6)

___

### maxProcessed

• `Optional` **maxProcessed**: `number`

The maximum amount of items to process

#### Inherited from

[CollectorOptions](/api/interfaces/connect.CollectorOptions.md).[maxProcessed](/api/interfaces/connect.CollectorOptions.md#maxprocessed-6)

___

### time

• `Optional` **time**: `number`

Max time to wait for items in milliseconds

#### Inherited from

[CollectorOptions](/api/interfaces/connect.CollectorOptions.md).[time](/api/interfaces/connect.CollectorOptions.md#time-6)
