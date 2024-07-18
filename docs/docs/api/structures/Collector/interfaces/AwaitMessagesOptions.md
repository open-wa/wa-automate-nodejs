# Interface: AwaitMessagesOptions

Options to be applied to the collector.

## Extends

- [`CollectorOptions`](/api/structures/Collector/interfaces/CollectorOptions.md)

## Properties

### dispose?

> `optional` **dispose**: `boolean`

Whether to dispose data when it's deleted

#### Inherited from

[`CollectorOptions`](/api/structures/Collector/interfaces/CollectorOptions.md).[`dispose`](/api/structures/Collector/interfaces/CollectorOptions.md#dispose)

***

### errors?

> `optional` **errors**: `string`[]

An array of "reasons" that would result in the awaitMessages command to throw an error.

***

### idle?

> `optional` **idle**: `number`

Max time allowed idle

#### Inherited from

[`CollectorOptions`](/api/structures/Collector/interfaces/CollectorOptions.md).[`idle`](/api/structures/Collector/interfaces/CollectorOptions.md#idle)

***

### max?

> `optional` **max**: `number`

The maximum amount of items to collect

#### Inherited from

[`CollectorOptions`](/api/structures/Collector/interfaces/CollectorOptions.md).[`max`](/api/structures/Collector/interfaces/CollectorOptions.md#max)

***

### maxProcessed?

> `optional` **maxProcessed**: `number`

The maximum amount of items to process

#### Inherited from

[`CollectorOptions`](/api/structures/Collector/interfaces/CollectorOptions.md).[`maxProcessed`](/api/structures/Collector/interfaces/CollectorOptions.md#maxprocessed)

***

### time?

> `optional` **time**: `number`

Max time to wait for items in milliseconds

#### Inherited from

[`CollectorOptions`](/api/structures/Collector/interfaces/CollectorOptions.md).[`time`](/api/structures/Collector/interfaces/CollectorOptions.md#time)
