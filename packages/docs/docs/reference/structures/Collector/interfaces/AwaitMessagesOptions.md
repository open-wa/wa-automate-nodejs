# Interface: AwaitMessagesOptions

Options to be applied to the collector.

## Extends

- [`CollectorOptions`](/reference/structures/Collector/interfaces/CollectorOptions.md)

## Properties

### dispose?

> `optional` **dispose**: `boolean`

Whether to dispose data when it's deleted

#### Inherited from

[`CollectorOptions`](/reference/structures/Collector/interfaces/CollectorOptions.md).[`dispose`](/reference/structures/Collector/interfaces/CollectorOptions.md#dispose)

***

### errors?

> `optional` **errors**: `string`[]

An array of "reasons" that would result in the awaitMessages command to throw an error.

***

### idle?

> `optional` **idle**: `number`

Max time allowed idle

#### Inherited from

[`CollectorOptions`](/reference/structures/Collector/interfaces/CollectorOptions.md).[`idle`](/reference/structures/Collector/interfaces/CollectorOptions.md#idle)

***

### max?

> `optional` **max**: `number`

The maximum amount of items to collect

#### Inherited from

[`CollectorOptions`](/reference/structures/Collector/interfaces/CollectorOptions.md).[`max`](/reference/structures/Collector/interfaces/CollectorOptions.md#max)

***

### maxProcessed?

> `optional` **maxProcessed**: `number`

The maximum amount of items to process

#### Inherited from

[`CollectorOptions`](/reference/structures/Collector/interfaces/CollectorOptions.md).[`maxProcessed`](/reference/structures/Collector/interfaces/CollectorOptions.md#maxprocessed)

***

### time?

> `optional` **time**: `number`

Max time to wait for items in milliseconds

#### Inherited from

[`CollectorOptions`](/reference/structures/Collector/interfaces/CollectorOptions.md).[`time`](/reference/structures/Collector/interfaces/CollectorOptions.md#time)
