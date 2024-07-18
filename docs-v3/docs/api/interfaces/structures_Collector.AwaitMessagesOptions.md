---
id: "structures_Collector.AwaitMessagesOptions"
title: "Interface: AwaitMessagesOptions"
sidebar_label: "AwaitMessagesOptions"
custom_edit_url: null
---

[structures/Collector](/api/modules/structures_Collector.md).AwaitMessagesOptions

Options to be applied to the collector.

## Hierarchy

- [`CollectorOptions`](/api/interfaces/structures_Collector.CollectorOptions.md)

  ↳ **`AwaitMessagesOptions`**

## Properties

### dispose

• `Optional` **dispose**: `boolean`

Whether to dispose data when it's deleted

#### Inherited from

[CollectorOptions](/api/interfaces/structures_Collector.CollectorOptions.md).[dispose](/api/interfaces/structures_Collector.CollectorOptions.md#dispose-16)

___

### errors

• `Optional` **errors**: `string`[]

An array of "reasons" that would result in the awaitMessages command to throw an error.

___

### idle

• `Optional` **idle**: `number`

Max time allowed idle

#### Inherited from

[CollectorOptions](/api/interfaces/structures_Collector.CollectorOptions.md).[idle](/api/interfaces/structures_Collector.CollectorOptions.md#idle-16)

___

### max

• `Optional` **max**: `number`

The maximum amount of items to collect

#### Inherited from

[CollectorOptions](/api/interfaces/structures_Collector.CollectorOptions.md).[max](/api/interfaces/structures_Collector.CollectorOptions.md#max-16)

___

### maxProcessed

• `Optional` **maxProcessed**: `number`

The maximum amount of items to process

#### Inherited from

[CollectorOptions](/api/interfaces/structures_Collector.CollectorOptions.md).[maxProcessed](/api/interfaces/structures_Collector.CollectorOptions.md#maxprocessed-16)

___

### time

• `Optional` **time**: `number`

Max time to wait for items in milliseconds

#### Inherited from

[CollectorOptions](/api/interfaces/structures_Collector.CollectorOptions.md).[time](/api/interfaces/structures_Collector.CollectorOptions.md#time-16)
