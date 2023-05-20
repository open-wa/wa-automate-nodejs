---
id: "structures_Collector.Collection"
title: "Class: Collection<K, V>"
sidebar_label: "Collection"
custom_edit_url: null
---

[structures/Collector](/api/modules/structures_Collector.md).Collection

## Type parameters

| Name |
| :------ |
| `K` |
| `V` |

## Hierarchy

- `Collection`<`K`, `V`\>

  ↳ **`Collection`**

## Constructors

### constructor

• **new Collection**<`K`, `V`\>(`entries?`)

#### Type parameters

| Name |
| :------ |
| `K` |
| `V` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `entries?` | readonly readonly [`K`, `V`][] |

#### Inherited from

BaseCollection<K, V\>.constructor

• **new Collection**<`K`, `V`\>(`iterable?`)

#### Type parameters

| Name |
| :------ |
| `K` |
| `V` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `iterable?` | `Iterable`<readonly [`K`, `V`]\> |

#### Inherited from

BaseCollection<K, V\>.constructor

## Properties

### [toStringTag]

• `Readonly` **[toStringTag]**: `string`

#### Inherited from

BaseCollection.\_\_@toStringTag@1097

___

### constructor

• **constructor**: `CollectionConstructor`

#### Inherited from

BaseCollection.constructor

___

### size

• `Readonly` **size**: `number`

#### Inherited from

BaseCollection.size

___

### [species]

▪ `Static` `Readonly` **[species]**: `MapConstructor`

#### Inherited from

BaseCollection.\_\_@species@2118

## Methods

### [iterator]

▸ **[iterator]**(): `IterableIterator`<[`K`, `V`]\>

Returns an iterable of entries in the map.

#### Returns

`IterableIterator`<[`K`, `V`]\>

#### Inherited from

BaseCollection.\_\_@iterator@47

___

### at

▸ **at**(`index`): `V`

Identical to [Array.at()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/at).
Returns the item at a given index, allowing for positive and negative integers.
Negative integers count back from the last item in the collection.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `index` | `number` | The index of the element to obtain |

#### Returns

`V`

#### Inherited from

BaseCollection.at

___

### clear

▸ **clear**(): `void`

#### Returns

`void`

#### Inherited from

BaseCollection.clear

___

### clone

▸ **clone**(): `Collection`<`K`, `V`\>

Creates an identical shallow copy of this collection.

**`Example`**

```ts
const newColl = someColl.clone();
```

#### Returns

`Collection`<`K`, `V`\>

#### Inherited from

BaseCollection.clone

___

### concat

▸ **concat**(...`collections`): `Collection`<`K`, `V`\>

Combines this collection with others into a new collection. None of the source collections are modified.

**`Example`**

```ts
const newColl = someColl.concat(someOtherColl, anotherColl, ohBoyAColl);
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `...collections` | `ReadonlyCollection`<`K`, `V`\>[] | Collections to merge |

#### Returns

`Collection`<`K`, `V`\>

#### Inherited from

BaseCollection.concat

___

### delete

▸ **delete**(`key`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `K` |

#### Returns

`boolean`

#### Inherited from

BaseCollection.delete

___

### difference

▸ **difference**<`T`\>(`other`): `Collection`<`K`, `V` \| `T`\>

The difference method returns a new structure containing items where the key is present in one of the original structures but not the other.

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `other` | `ReadonlyCollection`<`K`, `T`\> | The other Collection to filter against |

#### Returns

`Collection`<`K`, `V` \| `T`\>

#### Inherited from

BaseCollection.difference

___

### each

▸ **each**(`fn`): [`Collection`](/api/classes/structures_Collector.Collection.md)<`K`, `V`\>

Identical to
[Map.forEach()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/forEach),
but returns the collection instead of undefined.

**`Example`**

```ts
collection
 .each(user => console.log(user.username))
 .filter(user => user.bot)
 .each(user => console.log(user.username));
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fn` | (`value`: `V`, `key`: `K`, `collection`: [`Collection`](/api/classes/structures_Collector.Collection.md)<`K`, `V`\>) => `void` | Function to execute for each element |

#### Returns

[`Collection`](/api/classes/structures_Collector.Collection.md)<`K`, `V`\>

#### Inherited from

BaseCollection.each

▸ **each**<`T`\>(`fn`, `thisArg`): [`Collection`](/api/classes/structures_Collector.Collection.md)<`K`, `V`\>

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `fn` | (`this`: `T`, `value`: `V`, `key`: `K`, `collection`: [`Collection`](/api/classes/structures_Collector.Collection.md)<`K`, `V`\>) => `void` |
| `thisArg` | `T` |

#### Returns

[`Collection`](/api/classes/structures_Collector.Collection.md)<`K`, `V`\>

#### Inherited from

BaseCollection.each

___

### ensure

▸ **ensure**(`key`, `defaultValueGenerator`): `V`

Obtains the value of the given key if it exists, otherwise sets and returns the value provided by the default value generator.

**`Example`**

```ts
collection.ensure(guildId, () => defaultGuildConfig);
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `key` | `K` | The key to get if it exists, or set otherwise |
| `defaultValueGenerator` | (`key`: `K`, `collection`: [`Collection`](/api/classes/structures_Collector.Collection.md)<`K`, `V`\>) => `V` | A function that generates the default value |

#### Returns

`V`

#### Inherited from

BaseCollection.ensure

___

### entries

▸ **entries**(): `IterableIterator`<[`K`, `V`]\>

Returns an iterable of key, value pairs for every entry in the map.

#### Returns

`IterableIterator`<[`K`, `V`]\>

#### Inherited from

BaseCollection.entries

___

### equals

▸ **equals**(`collection`): `boolean`

Checks if this collection shares identical items with another.
This is different to checking for equality using equal-signs, because
the collections may be different objects, but contain the same data.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `collection` | `ReadonlyCollection`<`K`, `V`\> | Collection to compare with |

#### Returns

`boolean`

Whether the collections have identical contents

#### Inherited from

BaseCollection.equals

___

### every

▸ **every**<`K2`\>(`fn`): this is Collection<K2, V\>

Checks if all items passes a test. Identical in behavior to
[Array.every()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/every).

**`Example`**

```ts
collection.every(user => !user.bot);
```

#### Type parameters

| Name |
| :------ |
| `K2` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fn` | (`value`: `V`, `key`: `K`, `collection`: [`Collection`](/api/classes/structures_Collector.Collection.md)<`K`, `V`\>) => key is K2 | Function used to test (should return a boolean) |

#### Returns

this is Collection<K2, V\>

#### Inherited from

BaseCollection.every

▸ **every**<`V2`\>(`fn`): this is Collection<K, V2\>

#### Type parameters

| Name |
| :------ |
| `V2` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `fn` | (`value`: `V`, `key`: `K`, `collection`: [`Collection`](/api/classes/structures_Collector.Collection.md)<`K`, `V`\>) => value is V2 |

#### Returns

this is Collection<K, V2\>

#### Inherited from

BaseCollection.every

▸ **every**(`fn`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `fn` | (`value`: `V`, `key`: `K`, `collection`: [`Collection`](/api/classes/structures_Collector.Collection.md)<`K`, `V`\>) => `boolean` |

#### Returns

`boolean`

#### Inherited from

BaseCollection.every

▸ **every**<`This`, `K2`\>(`fn`, `thisArg`): this is Collection<K2, V\>

#### Type parameters

| Name |
| :------ |
| `This` |
| `K2` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `fn` | (`this`: `This`, `value`: `V`, `key`: `K`, `collection`: [`Collection`](/api/classes/structures_Collector.Collection.md)<`K`, `V`\>) => key is K2 |
| `thisArg` | `This` |

#### Returns

this is Collection<K2, V\>

#### Inherited from

BaseCollection.every

▸ **every**<`This`, `V2`\>(`fn`, `thisArg`): this is Collection<K, V2\>

#### Type parameters

| Name |
| :------ |
| `This` |
| `V2` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `fn` | (`this`: `This`, `value`: `V`, `key`: `K`, `collection`: [`Collection`](/api/classes/structures_Collector.Collection.md)<`K`, `V`\>) => value is V2 |
| `thisArg` | `This` |

#### Returns

this is Collection<K, V2\>

#### Inherited from

BaseCollection.every

▸ **every**<`This`\>(`fn`, `thisArg`): `boolean`

#### Type parameters

| Name |
| :------ |
| `This` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `fn` | (`this`: `This`, `value`: `V`, `key`: `K`, `collection`: [`Collection`](/api/classes/structures_Collector.Collection.md)<`K`, `V`\>) => `boolean` |
| `thisArg` | `This` |

#### Returns

`boolean`

#### Inherited from

BaseCollection.every

___

### filter

▸ **filter**<`K2`\>(`fn`): `Collection`<`K2`, `V`\>

Identical to
[Array.filter()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter),
but returns a Collection instead of an Array.

**`Example`**

```ts
collection.filter(user => user.username === 'Bob');
```

#### Type parameters

| Name |
| :------ |
| `K2` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fn` | (`value`: `V`, `key`: `K`, `collection`: [`Collection`](/api/classes/structures_Collector.Collection.md)<`K`, `V`\>) => key is K2 | The function to test with (should return boolean) |

#### Returns

`Collection`<`K2`, `V`\>

#### Inherited from

BaseCollection.filter

▸ **filter**<`V2`\>(`fn`): `Collection`<`K`, `V2`\>

#### Type parameters

| Name |
| :------ |
| `V2` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `fn` | (`value`: `V`, `key`: `K`, `collection`: [`Collection`](/api/classes/structures_Collector.Collection.md)<`K`, `V`\>) => value is V2 |

#### Returns

`Collection`<`K`, `V2`\>

#### Inherited from

BaseCollection.filter

▸ **filter**(`fn`): `Collection`<`K`, `V`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `fn` | (`value`: `V`, `key`: `K`, `collection`: [`Collection`](/api/classes/structures_Collector.Collection.md)<`K`, `V`\>) => `boolean` |

#### Returns

`Collection`<`K`, `V`\>

#### Inherited from

BaseCollection.filter

▸ **filter**<`This`, `K2`\>(`fn`, `thisArg`): `Collection`<`K2`, `V`\>

#### Type parameters

| Name |
| :------ |
| `This` |
| `K2` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `fn` | (`this`: `This`, `value`: `V`, `key`: `K`, `collection`: [`Collection`](/api/classes/structures_Collector.Collection.md)<`K`, `V`\>) => key is K2 |
| `thisArg` | `This` |

#### Returns

`Collection`<`K2`, `V`\>

#### Inherited from

BaseCollection.filter

▸ **filter**<`This`, `V2`\>(`fn`, `thisArg`): `Collection`<`K`, `V2`\>

#### Type parameters

| Name |
| :------ |
| `This` |
| `V2` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `fn` | (`this`: `This`, `value`: `V`, `key`: `K`, `collection`: [`Collection`](/api/classes/structures_Collector.Collection.md)<`K`, `V`\>) => value is V2 |
| `thisArg` | `This` |

#### Returns

`Collection`<`K`, `V2`\>

#### Inherited from

BaseCollection.filter

▸ **filter**<`This`\>(`fn`, `thisArg`): `Collection`<`K`, `V`\>

#### Type parameters

| Name |
| :------ |
| `This` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `fn` | (`this`: `This`, `value`: `V`, `key`: `K`, `collection`: [`Collection`](/api/classes/structures_Collector.Collection.md)<`K`, `V`\>) => `boolean` |
| `thisArg` | `This` |

#### Returns

`Collection`<`K`, `V`\>

#### Inherited from

BaseCollection.filter

___

### find

▸ **find**<`V2`\>(`fn`): `V2`

Searches for a single item where the given function returns a truthy value. This behaves like
[Array.find()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find).
<warn>All collections used in Discord.js are mapped using their `id` property, and if you want to find by id you
should use the `get` method. See
[MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/get) for details.</warn>

**`Example`**

```ts
collection.find(user => user.username === 'Bob');
```

#### Type parameters

| Name |
| :------ |
| `V2` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fn` | (`value`: `V`, `key`: `K`, `collection`: [`Collection`](/api/classes/structures_Collector.Collection.md)<`K`, `V`\>) => value is V2 | The function to test with (should return boolean) |

#### Returns

`V2`

#### Inherited from

BaseCollection.find

▸ **find**(`fn`): `V`

#### Parameters

| Name | Type |
| :------ | :------ |
| `fn` | (`value`: `V`, `key`: `K`, `collection`: [`Collection`](/api/classes/structures_Collector.Collection.md)<`K`, `V`\>) => `boolean` |

#### Returns

`V`

#### Inherited from

BaseCollection.find

▸ **find**<`This`, `V2`\>(`fn`, `thisArg`): `V2`

#### Type parameters

| Name |
| :------ |
| `This` |
| `V2` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `fn` | (`this`: `This`, `value`: `V`, `key`: `K`, `collection`: [`Collection`](/api/classes/structures_Collector.Collection.md)<`K`, `V`\>) => value is V2 |
| `thisArg` | `This` |

#### Returns

`V2`

#### Inherited from

BaseCollection.find

▸ **find**<`This`\>(`fn`, `thisArg`): `V`

#### Type parameters

| Name |
| :------ |
| `This` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `fn` | (`this`: `This`, `value`: `V`, `key`: `K`, `collection`: [`Collection`](/api/classes/structures_Collector.Collection.md)<`K`, `V`\>) => `boolean` |
| `thisArg` | `This` |

#### Returns

`V`

#### Inherited from

BaseCollection.find

___

### findKey

▸ **findKey**<`K2`\>(`fn`): `K2`

Searches for the key of a single item where the given function returns a truthy value. This behaves like
[Array.findIndex()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/findIndex),
but returns the key rather than the positional index.

**`Example`**

```ts
collection.findKey(user => user.username === 'Bob');
```

#### Type parameters

| Name |
| :------ |
| `K2` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fn` | (`value`: `V`, `key`: `K`, `collection`: [`Collection`](/api/classes/structures_Collector.Collection.md)<`K`, `V`\>) => key is K2 | The function to test with (should return boolean) |

#### Returns

`K2`

#### Inherited from

BaseCollection.findKey

▸ **findKey**(`fn`): `K`

#### Parameters

| Name | Type |
| :------ | :------ |
| `fn` | (`value`: `V`, `key`: `K`, `collection`: [`Collection`](/api/classes/structures_Collector.Collection.md)<`K`, `V`\>) => `boolean` |

#### Returns

`K`

#### Inherited from

BaseCollection.findKey

▸ **findKey**<`This`, `K2`\>(`fn`, `thisArg`): `K2`

#### Type parameters

| Name |
| :------ |
| `This` |
| `K2` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `fn` | (`this`: `This`, `value`: `V`, `key`: `K`, `collection`: [`Collection`](/api/classes/structures_Collector.Collection.md)<`K`, `V`\>) => key is K2 |
| `thisArg` | `This` |

#### Returns

`K2`

#### Inherited from

BaseCollection.findKey

▸ **findKey**<`This`\>(`fn`, `thisArg`): `K`

#### Type parameters

| Name |
| :------ |
| `This` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `fn` | (`this`: `This`, `value`: `V`, `key`: `K`, `collection`: [`Collection`](/api/classes/structures_Collector.Collection.md)<`K`, `V`\>) => `boolean` |
| `thisArg` | `This` |

#### Returns

`K`

#### Inherited from

BaseCollection.findKey

___

### first

▸ **first**(): `V`

Obtains the first value(s) in this collection.

#### Returns

`V`

A single value if no amount is provided or an array of values, starting from the end if amount is negative

#### Inherited from

BaseCollection.first

▸ **first**(`amount`): `V`[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `amount` | `number` |

#### Returns

`V`[]

#### Inherited from

BaseCollection.first

___

### firstKey

▸ **firstKey**(): `K`

Obtains the first key(s) in this collection.

#### Returns

`K`

A single key if no amount is provided or an array of keys, starting from the end if
amount is negative

#### Inherited from

BaseCollection.firstKey

▸ **firstKey**(`amount`): `K`[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `amount` | `number` |

#### Returns

`K`[]

#### Inherited from

BaseCollection.firstKey

___

### flatMap

▸ **flatMap**<`T`\>(`fn`): `Collection`<`K`, `T`\>

Maps each item into a Collection, then joins the results into a single Collection. Identical in behavior to
[Array.flatMap()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/flatMap).

**`Example`**

```ts
collection.flatMap(guild => guild.members.cache);
```

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fn` | (`value`: `V`, `key`: `K`, `collection`: [`Collection`](/api/classes/structures_Collector.Collection.md)<`K`, `V`\>) => `Collection`<`K`, `T`\> | Function that produces a new Collection |

#### Returns

`Collection`<`K`, `T`\>

#### Inherited from

BaseCollection.flatMap

▸ **flatMap**<`T`, `This`\>(`fn`, `thisArg`): `Collection`<`K`, `T`\>

#### Type parameters

| Name |
| :------ |
| `T` |
| `This` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `fn` | (`this`: `This`, `value`: `V`, `key`: `K`, `collection`: [`Collection`](/api/classes/structures_Collector.Collection.md)<`K`, `V`\>) => `Collection`<`K`, `T`\> |
| `thisArg` | `This` |

#### Returns

`Collection`<`K`, `T`\>

#### Inherited from

BaseCollection.flatMap

___

### forEach

▸ **forEach**(`callbackfn`, `thisArg?`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `callbackfn` | (`value`: `V`, `key`: `K`, `map`: `Map`<`K`, `V`\>) => `void` |
| `thisArg?` | `any` |

#### Returns

`void`

#### Inherited from

BaseCollection.forEach

___

### get

▸ **get**(`key`): `V`

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `K` |

#### Returns

`V`

#### Inherited from

BaseCollection.get

___

### has

▸ **has**(`key`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `K` |

#### Returns

`boolean`

#### Inherited from

BaseCollection.has

___

### hasAll

▸ **hasAll**(...`keys`): `boolean`

Checks if all of the elements exist in the collection.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `...keys` | `K`[] | The keys of the elements to check for |

#### Returns

`boolean`

`true` if all of the elements exist, `false` if at least one does not exist.

#### Inherited from

BaseCollection.hasAll

___

### hasAny

▸ **hasAny**(...`keys`): `boolean`

Checks if any of the elements exist in the collection.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `...keys` | `K`[] | The keys of the elements to check for |

#### Returns

`boolean`

`true` if any of the elements exist, `false` if none exist.

#### Inherited from

BaseCollection.hasAny

___

### intersect

▸ **intersect**<`T`\>(`other`): `Collection`<`K`, `T`\>

The intersect method returns a new structure containing items where the keys and values are present in both original structures.

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `other` | `ReadonlyCollection`<`K`, `T`\> | The other Collection to filter against |

#### Returns

`Collection`<`K`, `T`\>

#### Inherited from

BaseCollection.intersect

___

### keyAt

▸ **keyAt**(`index`): `K`

Identical to [Array.at()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/at).
Returns the key at a given index, allowing for positive and negative integers.
Negative integers count back from the last item in the collection.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `index` | `number` | The index of the key to obtain |

#### Returns

`K`

#### Inherited from

BaseCollection.keyAt

___

### keys

▸ **keys**(): `IterableIterator`<`K`\>

Returns an iterable of keys in the map

#### Returns

`IterableIterator`<`K`\>

#### Inherited from

BaseCollection.keys

___

### last

▸ **last**(): `V`

Obtains the last value(s) in this collection.

#### Returns

`V`

A single value if no amount is provided or an array of values, starting from the start if
amount is negative

#### Inherited from

BaseCollection.last

▸ **last**(`amount`): `V`[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `amount` | `number` |

#### Returns

`V`[]

#### Inherited from

BaseCollection.last

___

### lastKey

▸ **lastKey**(): `K`

Obtains the last key(s) in this collection.

#### Returns

`K`

A single key if no amount is provided or an array of keys, starting from the start if
amount is negative

#### Inherited from

BaseCollection.lastKey

▸ **lastKey**(`amount`): `K`[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `amount` | `number` |

#### Returns

`K`[]

#### Inherited from

BaseCollection.lastKey

___

### map

▸ **map**<`T`\>(`fn`): `T`[]

Maps each item to another value into an array. Identical in behavior to
[Array.map()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map).

**`Example`**

```ts
collection.map(user => user.tag);
```

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fn` | (`value`: `V`, `key`: `K`, `collection`: [`Collection`](/api/classes/structures_Collector.Collection.md)<`K`, `V`\>) => `T` | Function that produces an element of the new array, taking three arguments |

#### Returns

`T`[]

#### Inherited from

BaseCollection.map

▸ **map**<`This`, `T`\>(`fn`, `thisArg`): `T`[]

#### Type parameters

| Name |
| :------ |
| `This` |
| `T` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `fn` | (`this`: `This`, `value`: `V`, `key`: `K`, `collection`: [`Collection`](/api/classes/structures_Collector.Collection.md)<`K`, `V`\>) => `T` |
| `thisArg` | `This` |

#### Returns

`T`[]

#### Inherited from

BaseCollection.map

___

### mapValues

▸ **mapValues**<`T`\>(`fn`): `Collection`<`K`, `T`\>

Maps each item to another value into a collection. Identical in behavior to
[Array.map()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map).

**`Example`**

```ts
collection.mapValues(user => user.tag);
```

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fn` | (`value`: `V`, `key`: `K`, `collection`: [`Collection`](/api/classes/structures_Collector.Collection.md)<`K`, `V`\>) => `T` | Function that produces an element of the new collection, taking three arguments |

#### Returns

`Collection`<`K`, `T`\>

#### Inherited from

BaseCollection.mapValues

▸ **mapValues**<`This`, `T`\>(`fn`, `thisArg`): `Collection`<`K`, `T`\>

#### Type parameters

| Name |
| :------ |
| `This` |
| `T` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `fn` | (`this`: `This`, `value`: `V`, `key`: `K`, `collection`: [`Collection`](/api/classes/structures_Collector.Collection.md)<`K`, `V`\>) => `T` |
| `thisArg` | `This` |

#### Returns

`Collection`<`K`, `T`\>

#### Inherited from

BaseCollection.mapValues

___

### merge

▸ **merge**<`T`, `R`\>(`other`, `whenInSelf`, `whenInOther`, `whenInBoth`): `Collection`<`K`, `R`\>

Merges two Collections together into a new Collection.

**`Example`**

```ts
// Sums up the entries in two collections.
coll.merge(
 other,
 x => ({ keep: true, value: x }),
 y => ({ keep: true, value: y }),
 (x, y) => ({ keep: true, value: x + y }),
);
```

**`Example`**

```ts
// Intersects two collections in a left-biased manner.
coll.merge(
 other,
 x => ({ keep: false }),
 y => ({ keep: false }),
 (x, _) => ({ keep: true, value: x }),
);
```

#### Type parameters

| Name |
| :------ |
| `T` |
| `R` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `other` | `ReadonlyCollection`<`K`, `T`\> | The other Collection to merge with |
| `whenInSelf` | (`value`: `V`, `key`: `K`) => `Keep`<`R`\> | Function getting the result if the entry only exists in this Collection |
| `whenInOther` | (`valueOther`: `T`, `key`: `K`) => `Keep`<`R`\> | Function getting the result if the entry only exists in the other Collection |
| `whenInBoth` | (`value`: `V`, `valueOther`: `T`, `key`: `K`) => `Keep`<`R`\> | Function getting the result if the entry exists in both Collections |

#### Returns

`Collection`<`K`, `R`\>

#### Inherited from

BaseCollection.merge

___

### partition

▸ **partition**<`K2`\>(`fn`): [`Collection`<`K2`, `V`\>, `Collection`<`Exclude`<`K`, `K2`\>, `V`\>]

Partitions the collection into two collections where the first collection
contains the items that passed and the second contains the items that failed.

**`Example`**

```ts
const [big, small] = collection.partition(guild => guild.memberCount > 250);
```

#### Type parameters

| Name |
| :------ |
| `K2` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fn` | (`value`: `V`, `key`: `K`, `collection`: [`Collection`](/api/classes/structures_Collector.Collection.md)<`K`, `V`\>) => key is K2 | Function used to test (should return a boolean) |

#### Returns

[`Collection`<`K2`, `V`\>, `Collection`<`Exclude`<`K`, `K2`\>, `V`\>]

#### Inherited from

BaseCollection.partition

▸ **partition**<`V2`\>(`fn`): [`Collection`<`K`, `V2`\>, `Collection`<`K`, `Exclude`<`V`, `V2`\>\>]

#### Type parameters

| Name |
| :------ |
| `V2` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `fn` | (`value`: `V`, `key`: `K`, `collection`: [`Collection`](/api/classes/structures_Collector.Collection.md)<`K`, `V`\>) => value is V2 |

#### Returns

[`Collection`<`K`, `V2`\>, `Collection`<`K`, `Exclude`<`V`, `V2`\>\>]

#### Inherited from

BaseCollection.partition

▸ **partition**(`fn`): [`Collection`<`K`, `V`\>, `Collection`<`K`, `V`\>]

#### Parameters

| Name | Type |
| :------ | :------ |
| `fn` | (`value`: `V`, `key`: `K`, `collection`: [`Collection`](/api/classes/structures_Collector.Collection.md)<`K`, `V`\>) => `boolean` |

#### Returns

[`Collection`<`K`, `V`\>, `Collection`<`K`, `V`\>]

#### Inherited from

BaseCollection.partition

▸ **partition**<`This`, `K2`\>(`fn`, `thisArg`): [`Collection`<`K2`, `V`\>, `Collection`<`Exclude`<`K`, `K2`\>, `V`\>]

#### Type parameters

| Name |
| :------ |
| `This` |
| `K2` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `fn` | (`this`: `This`, `value`: `V`, `key`: `K`, `collection`: [`Collection`](/api/classes/structures_Collector.Collection.md)<`K`, `V`\>) => key is K2 |
| `thisArg` | `This` |

#### Returns

[`Collection`<`K2`, `V`\>, `Collection`<`Exclude`<`K`, `K2`\>, `V`\>]

#### Inherited from

BaseCollection.partition

▸ **partition**<`This`, `V2`\>(`fn`, `thisArg`): [`Collection`<`K`, `V2`\>, `Collection`<`K`, `Exclude`<`V`, `V2`\>\>]

#### Type parameters

| Name |
| :------ |
| `This` |
| `V2` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `fn` | (`this`: `This`, `value`: `V`, `key`: `K`, `collection`: [`Collection`](/api/classes/structures_Collector.Collection.md)<`K`, `V`\>) => value is V2 |
| `thisArg` | `This` |

#### Returns

[`Collection`<`K`, `V2`\>, `Collection`<`K`, `Exclude`<`V`, `V2`\>\>]

#### Inherited from

BaseCollection.partition

▸ **partition**<`This`\>(`fn`, `thisArg`): [`Collection`<`K`, `V`\>, `Collection`<`K`, `V`\>]

#### Type parameters

| Name |
| :------ |
| `This` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `fn` | (`this`: `This`, `value`: `V`, `key`: `K`, `collection`: [`Collection`](/api/classes/structures_Collector.Collection.md)<`K`, `V`\>) => `boolean` |
| `thisArg` | `This` |

#### Returns

[`Collection`<`K`, `V`\>, `Collection`<`K`, `V`\>]

#### Inherited from

BaseCollection.partition

___

### random

▸ **random**(): `V`

Obtains unique random value(s) from this collection.

#### Returns

`V`

A single value if no amount is provided or an array of values

#### Inherited from

BaseCollection.random

▸ **random**(`amount`): `V`[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `amount` | `number` |

#### Returns

`V`[]

#### Inherited from

BaseCollection.random

___

### randomKey

▸ **randomKey**(): `K`

Obtains unique random key(s) from this collection.

#### Returns

`K`

A single key if no amount is provided or an array

#### Inherited from

BaseCollection.randomKey

▸ **randomKey**(`amount`): `K`[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `amount` | `number` |

#### Returns

`K`[]

#### Inherited from

BaseCollection.randomKey

___

### reduce

▸ **reduce**<`T`\>(`fn`, `initialValue?`): `T`

Applies a function to produce a single value. Identical in behavior to
[Array.reduce()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce).

**`Example`**

```ts
collection.reduce((acc, guild) => acc + guild.memberCount, 0);
```

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fn` | (`accumulator`: `T`, `value`: `V`, `key`: `K`, `collection`: [`Collection`](/api/classes/structures_Collector.Collection.md)<`K`, `V`\>) => `T` | Function used to reduce, taking four arguments; `accumulator`, `currentValue`, `currentKey`, and `collection` |
| `initialValue?` | `T` | Starting value for the accumulator |

#### Returns

`T`

#### Inherited from

BaseCollection.reduce

___

### reverse

▸ **reverse**(): [`Collection`](/api/classes/structures_Collector.Collection.md)<`K`, `V`\>

Identical to [Array.reverse()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reverse)
but returns a Collection instead of an Array.

#### Returns

[`Collection`](/api/classes/structures_Collector.Collection.md)<`K`, `V`\>

#### Inherited from

BaseCollection.reverse

___

### set

▸ **set**(`key`, `value`): [`Collection`](/api/classes/structures_Collector.Collection.md)<`K`, `V`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `K` |
| `value` | `V` |

#### Returns

[`Collection`](/api/classes/structures_Collector.Collection.md)<`K`, `V`\>

#### Inherited from

BaseCollection.set

___

### some

▸ **some**(`fn`): `boolean`

Checks if there exists an item that passes a test. Identical in behavior to
[Array.some()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/some).

**`Example`**

```ts
collection.some(user => user.discriminator === '0000');
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fn` | (`value`: `V`, `key`: `K`, `collection`: [`Collection`](/api/classes/structures_Collector.Collection.md)<`K`, `V`\>) => `boolean` | Function used to test (should return a boolean) |

#### Returns

`boolean`

#### Inherited from

BaseCollection.some

▸ **some**<`T`\>(`fn`, `thisArg`): `boolean`

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `fn` | (`this`: `T`, `value`: `V`, `key`: `K`, `collection`: [`Collection`](/api/classes/structures_Collector.Collection.md)<`K`, `V`\>) => `boolean` |
| `thisArg` | `T` |

#### Returns

`boolean`

#### Inherited from

BaseCollection.some

___

### sort

▸ **sort**(`compareFunction?`): [`Collection`](/api/classes/structures_Collector.Collection.md)<`K`, `V`\>

The sort method sorts the items of a collection in place and returns it.
The sort is not necessarily stable in Node 10 or older.
The default sort order is according to string Unicode code points.

**`Example`**

```ts
collection.sort((userA, userB) => userA.createdTimestamp - userB.createdTimestamp);
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `compareFunction?` | `Comparator`<`K`, `V`\> | Specifies a function that defines the sort order. If omitted, the collection is sorted according to each character's Unicode code point value, according to the string conversion of each element. |

#### Returns

[`Collection`](/api/classes/structures_Collector.Collection.md)<`K`, `V`\>

#### Inherited from

BaseCollection.sort

___

### sorted

▸ **sorted**(`compareFunction?`): `Collection`<`K`, `V`\>

The sorted method sorts the items of a collection and returns it.
The sort is not necessarily stable in Node 10 or older.
The default sort order is according to string Unicode code points.

**`Example`**

```ts
collection.sorted((userA, userB) => userA.createdTimestamp - userB.createdTimestamp);
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `compareFunction?` | `Comparator`<`K`, `V`\> | Specifies a function that defines the sort order. If omitted, the collection is sorted according to each character's Unicode code point value, according to the string conversion of each element. |

#### Returns

`Collection`<`K`, `V`\>

#### Inherited from

BaseCollection.sorted

___

### sweep

▸ **sweep**(`fn`): `number`

Removes items that satisfy the provided filter function.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fn` | (`value`: `V`, `key`: `K`, `collection`: [`Collection`](/api/classes/structures_Collector.Collection.md)<`K`, `V`\>) => `boolean` | Function used to test (should return a boolean) |

#### Returns

`number`

The number of removed entries

#### Inherited from

BaseCollection.sweep

▸ **sweep**<`T`\>(`fn`, `thisArg`): `number`

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `fn` | (`this`: `T`, `value`: `V`, `key`: `K`, `collection`: [`Collection`](/api/classes/structures_Collector.Collection.md)<`K`, `V`\>) => `boolean` |
| `thisArg` | `T` |

#### Returns

`number`

#### Inherited from

BaseCollection.sweep

___

### tap

▸ **tap**(`fn`): [`Collection`](/api/classes/structures_Collector.Collection.md)<`K`, `V`\>

Runs a function on the collection and returns the collection.

**`Example`**

```ts
collection
 .tap(coll => console.log(coll.size))
 .filter(user => user.bot)
 .tap(coll => console.log(coll.size))
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fn` | (`collection`: [`Collection`](/api/classes/structures_Collector.Collection.md)<`K`, `V`\>) => `void` | Function to execute |

#### Returns

[`Collection`](/api/classes/structures_Collector.Collection.md)<`K`, `V`\>

#### Inherited from

BaseCollection.tap

▸ **tap**<`T`\>(`fn`, `thisArg`): [`Collection`](/api/classes/structures_Collector.Collection.md)<`K`, `V`\>

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `fn` | (`this`: `T`, `collection`: [`Collection`](/api/classes/structures_Collector.Collection.md)<`K`, `V`\>) => `void` |
| `thisArg` | `T` |

#### Returns

[`Collection`](/api/classes/structures_Collector.Collection.md)<`K`, `V`\>

#### Inherited from

BaseCollection.tap

___

### toJSON

▸ **toJSON**(): `any`[]

#### Returns

`any`[]

#### Overrides

BaseCollection.toJSON

___

### values

▸ **values**(): `IterableIterator`<`V`\>

Returns an iterable of values in the map

#### Returns

`IterableIterator`<`V`\>

#### Inherited from

BaseCollection.values

___

### combineEntries

▸ `Static` **combineEntries**<`K`, `V`\>(`entries`, `combine`): `Collection`<`K`, `V`\>

Creates a Collection from a list of entries.

**`Example`**

```ts
Collection.combineEntries([["a", 1], ["b", 2], ["a", 2]], (x, y) => x + y);
// returns Collection { "a" => 3, "b" => 2 }
```

#### Type parameters

| Name |
| :------ |
| `K` |
| `V` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `entries` | `Iterable`<[`K`, `V`]\> | The list of entries |
| `combine` | (`firstValue`: `V`, `secondValue`: `V`, `key`: `K`) => `V` | Function to combine an existing entry with a new one |

#### Returns

`Collection`<`K`, `V`\>

#### Inherited from

BaseCollection.combineEntries
