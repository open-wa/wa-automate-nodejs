---
title: Interface - AwaitMessagesOptions
---

# Interface: AwaitMessagesOptions

Options to be applied to the collector.

## Extends

- [`CollectorOptions`](/docs/reference/structures/Collector/interfaces/CollectorOptions)

## Properties

### dispose?

> `optional` **dispose**: `boolean`

Whether to dispose data when it's deleted

#### Inherited from

[`CollectorOptions`](/docs/reference/structures/Collector/interfaces/CollectorOptions).[`dispose`](/docs/reference/structures/Collector/interfaces/CollectorOptions#dispose)

***

### errors?

> `optional` **errors**: `string`[]

An array of "reasons" that would result in the awaitMessages command to throw an error.

***

### idle?

> `optional` **idle**: `number`

Max time allowed idle

#### Inherited from

[`CollectorOptions`](/docs/reference/structures/Collector/interfaces/CollectorOptions).[`idle`](/docs/reference/structures/Collector/interfaces/CollectorOptions#idle)

***

### max?

> `optional` **max**: `number`

The maximum amount of items to collect

#### Inherited from

[`CollectorOptions`](/docs/reference/structures/Collector/interfaces/CollectorOptions).[`max`](/docs/reference/structures/Collector/interfaces/CollectorOptions#max)

***

### maxProcessed?

> `optional` **maxProcessed**: `number`

The maximum amount of items to process

#### Inherited from

[`CollectorOptions`](/docs/reference/structures/Collector/interfaces/CollectorOptions).[`maxProcessed`](/docs/reference/structures/Collector/interfaces/CollectorOptions#maxprocessed)

***

### time?

> `optional` **time**: `number`

Max time to wait for items in milliseconds

#### Inherited from

[`CollectorOptions`](/docs/reference/structures/Collector/interfaces/CollectorOptions).[`time`](/docs/reference/structures/Collector/interfaces/CollectorOptions#time)
