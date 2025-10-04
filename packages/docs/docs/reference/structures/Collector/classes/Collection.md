# Class: Collection\<K, V\>

## Extends

- `Collection`\<`K`, `V`\>

## Type Parameters

• **K**

• **V**

## Constructors

### new Collection()

> **new Collection**\<`K`, `V`\>(`entries`?): [`Collection`](/reference/structures/Collector/classes/Collection.md)\<`K`, `V`\>

#### Parameters

• **entries?**: readonly readonly [`K`, `V`][]

#### Returns

[`Collection`](/reference/structures/Collector/classes/Collection.md)\<`K`, `V`\>

#### Inherited from

`BaseCollection<K, V>.constructor`

### new Collection()

> **new Collection**\<`K`, `V`\>(`iterable`?): [`Collection`](/reference/structures/Collector/classes/Collection.md)\<`K`, `V`\>

#### Parameters

• **iterable?**: `Iterable`\<readonly [`K`, `V`]\>

#### Returns

[`Collection`](/reference/structures/Collector/classes/Collection.md)\<`K`, `V`\>

#### Inherited from

`BaseCollection<K, V>.constructor`

## Properties

### \[toStringTag\]

> `readonly` **\[toStringTag\]**: `string`

#### Inherited from

`BaseCollection.[toStringTag]`

***

### constructor

> **constructor**: `CollectionConstructor`

The initial value of Object.prototype.constructor is the standard built-in Object constructor.

#### Inherited from

`BaseCollection.constructor`

***

### size

> `readonly` **size**: `number`

#### Inherited from

`BaseCollection.size`

***

### \[species\]

> `readonly` `static` **\[species\]**: `MapConstructor`

#### Inherited from

`BaseCollection.[species]`

## Methods

### \[iterator\]()

> **\[iterator\]**(): `IterableIterator`\<[`K`, `V`]\>

Returns an iterable of entries in the map.

#### Returns

`IterableIterator`\<[`K`, `V`]\>

#### Inherited from

`BaseCollection.[iterator]`

***

### at()

> **at**(`index`): `V`

Identical to [Array.at()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/at).
Returns the item at a given index, allowing for positive and negative integers.
Negative integers count back from the last item in the collection.

#### Parameters

• **index**: `number`

The index of the element to obtain

#### Returns

`V`

#### Inherited from

`BaseCollection.at`

***

### clear()

> **clear**(): `void`

#### Returns

`void`

#### Inherited from

`BaseCollection.clear`

***

### clone()

> **clone**(): `Collection`\<`K`, `V`\>

Creates an identical shallow copy of this collection.

#### Returns

`Collection`\<`K`, `V`\>

#### Example

```ts
const newColl = someColl.clone();
```

#### Inherited from

`BaseCollection.clone`

***

### concat()

> **concat**(...`collections`): `Collection`\<`K`, `V`\>

Combines this collection with others into a new collection. None of the source collections are modified.

#### Parameters

• ...**collections**: `ReadonlyCollection`\<`K`, `V`\>[]

Collections to merge

#### Returns

`Collection`\<`K`, `V`\>

#### Example

```ts
const newColl = someColl.concat(someOtherColl, anotherColl, ohBoyAColl);
```

#### Inherited from

`BaseCollection.concat`

***

### delete()

> **delete**(`key`): `boolean`

#### Parameters

• **key**: `K`

#### Returns

`boolean`

true if an element in the Map existed and has been removed, or false if the element does not exist.

#### Inherited from

`BaseCollection.delete`

***

### difference()

> **difference**\<`T`\>(`other`): `Collection`\<`K`, `V` \| `T`\>

The difference method returns a new structure containing items where the key is present in one of the original structures but not the other.

#### Type Parameters

• **T**

#### Parameters

• **other**: `ReadonlyCollection`\<`K`, `T`\>

The other Collection to filter against

#### Returns

`Collection`\<`K`, `V` \| `T`\>

#### Inherited from

`BaseCollection.difference`

***

### each()

#### each(fn)

> **each**(`fn`): `this`

Identical to
[Map.forEach()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/forEach),
but returns the collection instead of undefined.

##### Parameters

• **fn**

Function to execute for each element

##### Returns

`this`

##### Example

```ts
collection
 .each(user => console.log(user.username))
 .filter(user => user.bot)
 .each(user => console.log(user.username));
```

##### Inherited from

`BaseCollection.each`

#### each(fn, thisArg)

> **each**\<`T`\>(`fn`, `thisArg`): `this`

##### Type Parameters

• **T**

##### Parameters

• **fn**

• **thisArg**: `T`

##### Returns

`this`

##### Inherited from

`BaseCollection.each`

***

### ensure()

> **ensure**(`key`, `defaultValueGenerator`): `V`

Obtains the value of the given key if it exists, otherwise sets and returns the value provided by the default value generator.

#### Parameters

• **key**: `K`

The key to get if it exists, or set otherwise

• **defaultValueGenerator**

A function that generates the default value

#### Returns

`V`

#### Example

```ts
collection.ensure(guildId, () => defaultGuildConfig);
```

#### Inherited from

`BaseCollection.ensure`

***

### entries()

> **entries**(): `IterableIterator`\<[`K`, `V`]\>

Returns an iterable of key, value pairs for every entry in the map.

#### Returns

`IterableIterator`\<[`K`, `V`]\>

#### Inherited from

`BaseCollection.entries`

***

### equals()

> **equals**(`collection`): `boolean`

Checks if this collection shares identical items with another.
This is different to checking for equality using equal-signs, because
the collections may be different objects, but contain the same data.

#### Parameters

• **collection**: `ReadonlyCollection`\<`K`, `V`\>

Collection to compare with

#### Returns

`boolean`

Whether the collections have identical contents

#### Inherited from

`BaseCollection.equals`

***

### every()

#### every(fn)

> **every**\<`K2`\>(`fn`): `this is Collection<K2, V>`

Checks if all items passes a test. Identical in behavior to
[Array.every()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/every).

##### Type Parameters

• **K2**

##### Parameters

• **fn**

Function used to test (should return a boolean)

##### Returns

`this is Collection<K2, V>`

##### Example

```ts
collection.every(user => !user.bot);
```

##### Inherited from

`BaseCollection.every`

#### every(fn)

> **every**\<`V2`\>(`fn`): `this is Collection<K, V2>`

##### Type Parameters

• **V2**

##### Parameters

• **fn**

##### Returns

`this is Collection<K, V2>`

##### Inherited from

`BaseCollection.every`

#### every(fn)

> **every**(`fn`): `boolean`

##### Parameters

• **fn**

##### Returns

`boolean`

##### Inherited from

`BaseCollection.every`

#### every(fn, thisArg)

> **every**\<`This`, `K2`\>(`fn`, `thisArg`): `this is Collection<K2, V>`

##### Type Parameters

• **This**

• **K2**

##### Parameters

• **fn**

• **thisArg**: `This`

##### Returns

`this is Collection<K2, V>`

##### Inherited from

`BaseCollection.every`

#### every(fn, thisArg)

> **every**\<`This`, `V2`\>(`fn`, `thisArg`): `this is Collection<K, V2>`

##### Type Parameters

• **This**

• **V2**

##### Parameters

• **fn**

• **thisArg**: `This`

##### Returns

`this is Collection<K, V2>`

##### Inherited from

`BaseCollection.every`

#### every(fn, thisArg)

> **every**\<`This`\>(`fn`, `thisArg`): `boolean`

##### Type Parameters

• **This**

##### Parameters

• **fn**

• **thisArg**: `This`

##### Returns

`boolean`

##### Inherited from

`BaseCollection.every`

***

### filter()

#### filter(fn)

> **filter**\<`K2`\>(`fn`): `Collection`\<`K2`, `V`\>

Identical to
[Array.filter()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter),
but returns a Collection instead of an Array.

##### Type Parameters

• **K2**

##### Parameters

• **fn**

The function to test with (should return boolean)

##### Returns

`Collection`\<`K2`, `V`\>

##### Example

```ts
collection.filter(user => user.username === 'Bob');
```

##### Inherited from

`BaseCollection.filter`

#### filter(fn)

> **filter**\<`V2`\>(`fn`): `Collection`\<`K`, `V2`\>

##### Type Parameters

• **V2**

##### Parameters

• **fn**

##### Returns

`Collection`\<`K`, `V2`\>

##### Inherited from

`BaseCollection.filter`

#### filter(fn)

> **filter**(`fn`): `Collection`\<`K`, `V`\>

##### Parameters

• **fn**

##### Returns

`Collection`\<`K`, `V`\>

##### Inherited from

`BaseCollection.filter`

#### filter(fn, thisArg)

> **filter**\<`This`, `K2`\>(`fn`, `thisArg`): `Collection`\<`K2`, `V`\>

##### Type Parameters

• **This**

• **K2**

##### Parameters

• **fn**

• **thisArg**: `This`

##### Returns

`Collection`\<`K2`, `V`\>

##### Inherited from

`BaseCollection.filter`

#### filter(fn, thisArg)

> **filter**\<`This`, `V2`\>(`fn`, `thisArg`): `Collection`\<`K`, `V2`\>

##### Type Parameters

• **This**

• **V2**

##### Parameters

• **fn**

• **thisArg**: `This`

##### Returns

`Collection`\<`K`, `V2`\>

##### Inherited from

`BaseCollection.filter`

#### filter(fn, thisArg)

> **filter**\<`This`\>(`fn`, `thisArg`): `Collection`\<`K`, `V`\>

##### Type Parameters

• **This**

##### Parameters

• **fn**

• **thisArg**: `This`

##### Returns

`Collection`\<`K`, `V`\>

##### Inherited from

`BaseCollection.filter`

***

### find()

#### find(fn)

> **find**\<`V2`\>(`fn`): `V2`

Searches for a single item where the given function returns a truthy value. This behaves like
[Array.find()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find).
<warn>All collections used in Discord.js are mapped using their `id` property, and if you want to find by id you
should use the `get` method. See
[MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/get) for details.</warn>

##### Type Parameters

• **V2**

##### Parameters

• **fn**

The function to test with (should return boolean)

##### Returns

`V2`

##### Example

```ts
collection.find(user => user.username === 'Bob');
```

##### Inherited from

`BaseCollection.find`

#### find(fn)

> **find**(`fn`): `V`

##### Parameters

• **fn**

##### Returns

`V`

##### Inherited from

`BaseCollection.find`

#### find(fn, thisArg)

> **find**\<`This`, `V2`\>(`fn`, `thisArg`): `V2`

##### Type Parameters

• **This**

• **V2**

##### Parameters

• **fn**

• **thisArg**: `This`

##### Returns

`V2`

##### Inherited from

`BaseCollection.find`

#### find(fn, thisArg)

> **find**\<`This`\>(`fn`, `thisArg`): `V`

##### Type Parameters

• **This**

##### Parameters

• **fn**

• **thisArg**: `This`

##### Returns

`V`

##### Inherited from

`BaseCollection.find`

***

### findKey()

#### findKey(fn)

> **findKey**\<`K2`\>(`fn`): `K2`

Searches for the key of a single item where the given function returns a truthy value. This behaves like
[Array.findIndex()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/findIndex),
but returns the key rather than the positional index.

##### Type Parameters

• **K2**

##### Parameters

• **fn**

The function to test with (should return boolean)

##### Returns

`K2`

##### Example

```ts
collection.findKey(user => user.username === 'Bob');
```

##### Inherited from

`BaseCollection.findKey`

#### findKey(fn)

> **findKey**(`fn`): `K`

##### Parameters

• **fn**

##### Returns

`K`

##### Inherited from

`BaseCollection.findKey`

#### findKey(fn, thisArg)

> **findKey**\<`This`, `K2`\>(`fn`, `thisArg`): `K2`

##### Type Parameters

• **This**

• **K2**

##### Parameters

• **fn**

• **thisArg**: `This`

##### Returns

`K2`

##### Inherited from

`BaseCollection.findKey`

#### findKey(fn, thisArg)

> **findKey**\<`This`\>(`fn`, `thisArg`): `K`

##### Type Parameters

• **This**

##### Parameters

• **fn**

• **thisArg**: `This`

##### Returns

`K`

##### Inherited from

`BaseCollection.findKey`

***

### first()

#### first()

> **first**(): `V`

Obtains the first value(s) in this collection.

##### Returns

`V`

A single value if no amount is provided or an array of values, starting from the end if amount is negative

##### Inherited from

`BaseCollection.first`

#### first(amount)

> **first**(`amount`): `V`[]

##### Parameters

• **amount**: `number`

##### Returns

`V`[]

##### Inherited from

`BaseCollection.first`

***

### firstKey()

#### firstKey()

> **firstKey**(): `K`

Obtains the first key(s) in this collection.

##### Returns

`K`

A single key if no amount is provided or an array of keys, starting from the end if
amount is negative

##### Inherited from

`BaseCollection.firstKey`

#### firstKey(amount)

> **firstKey**(`amount`): `K`[]

##### Parameters

• **amount**: `number`

##### Returns

`K`[]

##### Inherited from

`BaseCollection.firstKey`

***

### flatMap()

#### flatMap(fn)

> **flatMap**\<`T`\>(`fn`): `Collection`\<`K`, `T`\>

Maps each item into a Collection, then joins the results into a single Collection. Identical in behavior to
[Array.flatMap()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/flatMap).

##### Type Parameters

• **T**

##### Parameters

• **fn**

Function that produces a new Collection

##### Returns

`Collection`\<`K`, `T`\>

##### Example

```ts
collection.flatMap(guild => guild.members.cache);
```

##### Inherited from

`BaseCollection.flatMap`

#### flatMap(fn, thisArg)

> **flatMap**\<`T`, `This`\>(`fn`, `thisArg`): `Collection`\<`K`, `T`\>

##### Type Parameters

• **T**

• **This**

##### Parameters

• **fn**

• **thisArg**: `This`

##### Returns

`Collection`\<`K`, `T`\>

##### Inherited from

`BaseCollection.flatMap`

***

### forEach()

> **forEach**(`callbackfn`, `thisArg`?): `void`

Executes a provided function once per each key/value pair in the Map, in insertion order.

#### Parameters

• **callbackfn**

• **thisArg?**: `any`

#### Returns

`void`

#### Inherited from

`BaseCollection.forEach`

***

### get()

> **get**(`key`): `V`

Returns a specified element from the Map object. If the value that is associated to the provided key is an object, then you will get a reference to that object and any change made to that object will effectively modify it inside the Map.

#### Parameters

• **key**: `K`

#### Returns

`V`

Returns the element associated with the specified key. If no element is associated with the specified key, undefined is returned.

#### Inherited from

`BaseCollection.get`

***

### has()

> **has**(`key`): `boolean`

#### Parameters

• **key**: `K`

#### Returns

`boolean`

boolean indicating whether an element with the specified key exists or not.

#### Inherited from

`BaseCollection.has`

***

### hasAll()

> **hasAll**(...`keys`): `boolean`

Checks if all of the elements exist in the collection.

#### Parameters

• ...**keys**: `K`[]

The keys of the elements to check for

#### Returns

`boolean`

`true` if all of the elements exist, `false` if at least one does not exist.

#### Inherited from

`BaseCollection.hasAll`

***

### hasAny()

> **hasAny**(...`keys`): `boolean`

Checks if any of the elements exist in the collection.

#### Parameters

• ...**keys**: `K`[]

The keys of the elements to check for

#### Returns

`boolean`

`true` if any of the elements exist, `false` if none exist.

#### Inherited from

`BaseCollection.hasAny`

***

### intersect()

> **intersect**\<`T`\>(`other`): `Collection`\<`K`, `T`\>

The intersect method returns a new structure containing items where the keys and values are present in both original structures.

#### Type Parameters

• **T**

#### Parameters

• **other**: `ReadonlyCollection`\<`K`, `T`\>

The other Collection to filter against

#### Returns

`Collection`\<`K`, `T`\>

#### Inherited from

`BaseCollection.intersect`

***

### keyAt()

> **keyAt**(`index`): `K`

Identical to [Array.at()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/at).
Returns the key at a given index, allowing for positive and negative integers.
Negative integers count back from the last item in the collection.

#### Parameters

• **index**: `number`

The index of the key to obtain

#### Returns

`K`

#### Inherited from

`BaseCollection.keyAt`

***

### keys()

> **keys**(): `IterableIterator`\<`K`\>

Returns an iterable of keys in the map

#### Returns

`IterableIterator`\<`K`\>

#### Inherited from

`BaseCollection.keys`

***

### last()

#### last()

> **last**(): `V`

Obtains the last value(s) in this collection.

##### Returns

`V`

A single value if no amount is provided or an array of values, starting from the start if
amount is negative

##### Inherited from

`BaseCollection.last`

#### last(amount)

> **last**(`amount`): `V`[]

##### Parameters

• **amount**: `number`

##### Returns

`V`[]

##### Inherited from

`BaseCollection.last`

***

### lastKey()

#### lastKey()

> **lastKey**(): `K`

Obtains the last key(s) in this collection.

##### Returns

`K`

A single key if no amount is provided or an array of keys, starting from the start if
amount is negative

##### Inherited from

`BaseCollection.lastKey`

#### lastKey(amount)

> **lastKey**(`amount`): `K`[]

##### Parameters

• **amount**: `number`

##### Returns

`K`[]

##### Inherited from

`BaseCollection.lastKey`

***

### map()

#### map(fn)

> **map**\<`T`\>(`fn`): `T`[]

Maps each item to another value into an array. Identical in behavior to
[Array.map()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map).

##### Type Parameters

• **T**

##### Parameters

• **fn**

Function that produces an element of the new array, taking three arguments

##### Returns

`T`[]

##### Example

```ts
collection.map(user => user.tag);
```

##### Inherited from

`BaseCollection.map`

#### map(fn, thisArg)

> **map**\<`This`, `T`\>(`fn`, `thisArg`): `T`[]

##### Type Parameters

• **This**

• **T**

##### Parameters

• **fn**

• **thisArg**: `This`

##### Returns

`T`[]

##### Inherited from

`BaseCollection.map`

***

### mapValues()

#### mapValues(fn)

> **mapValues**\<`T`\>(`fn`): `Collection`\<`K`, `T`\>

Maps each item to another value into a collection. Identical in behavior to
[Array.map()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map).

##### Type Parameters

• **T**

##### Parameters

• **fn**

Function that produces an element of the new collection, taking three arguments

##### Returns

`Collection`\<`K`, `T`\>

##### Example

```ts
collection.mapValues(user => user.tag);
```

##### Inherited from

`BaseCollection.mapValues`

#### mapValues(fn, thisArg)

> **mapValues**\<`This`, `T`\>(`fn`, `thisArg`): `Collection`\<`K`, `T`\>

##### Type Parameters

• **This**

• **T**

##### Parameters

• **fn**

• **thisArg**: `This`

##### Returns

`Collection`\<`K`, `T`\>

##### Inherited from

`BaseCollection.mapValues`

***

### merge()

> **merge**\<`T`, `R`\>(`other`, `whenInSelf`, `whenInOther`, `whenInBoth`): `Collection`\<`K`, `R`\>

Merges two Collections together into a new Collection.

#### Type Parameters

• **T**

• **R**

#### Parameters

• **other**: `ReadonlyCollection`\<`K`, `T`\>

The other Collection to merge with

• **whenInSelf**

Function getting the result if the entry only exists in this Collection

• **whenInOther**

Function getting the result if the entry only exists in the other Collection

• **whenInBoth**

Function getting the result if the entry exists in both Collections

#### Returns

`Collection`\<`K`, `R`\>

#### Examples

```ts
// Sums up the entries in two collections.
coll.merge(
 other,
 x => ({ keep: true, value: x }),
 y => ({ keep: true, value: y }),
 (x, y) => ({ keep: true, value: x + y }),
);
```

```ts
// Intersects two collections in a left-biased manner.
coll.merge(
 other,
 x => ({ keep: false }),
 y => ({ keep: false }),
 (x, _) => ({ keep: true, value: x }),
);
```

#### Inherited from

`BaseCollection.merge`

***

### partition()

#### partition(fn)

> **partition**\<`K2`\>(`fn`): [`Collection`\<`K2`, `V`\>, `Collection`\<`Exclude`\<`K`, `K2`\>, `V`\>]

Partitions the collection into two collections where the first collection
contains the items that passed and the second contains the items that failed.

##### Type Parameters

• **K2**

##### Parameters

• **fn**

Function used to test (should return a boolean)

##### Returns

[`Collection`\<`K2`, `V`\>, `Collection`\<`Exclude`\<`K`, `K2`\>, `V`\>]

##### Example

```ts
const [big, small] = collection.partition(guild => guild.memberCount > 250);
```

##### Inherited from

`BaseCollection.partition`

#### partition(fn)

> **partition**\<`V2`\>(`fn`): [`Collection`\<`K`, `V2`\>, `Collection`\<`K`, `Exclude`\<`V`, `V2`\>\>]

##### Type Parameters

• **V2**

##### Parameters

• **fn**

##### Returns

[`Collection`\<`K`, `V2`\>, `Collection`\<`K`, `Exclude`\<`V`, `V2`\>\>]

##### Inherited from

`BaseCollection.partition`

#### partition(fn)

> **partition**(`fn`): [`Collection`\<`K`, `V`\>, `Collection`\<`K`, `V`\>]

##### Parameters

• **fn**

##### Returns

[`Collection`\<`K`, `V`\>, `Collection`\<`K`, `V`\>]

##### Inherited from

`BaseCollection.partition`

#### partition(fn, thisArg)

> **partition**\<`This`, `K2`\>(`fn`, `thisArg`): [`Collection`\<`K2`, `V`\>, `Collection`\<`Exclude`\<`K`, `K2`\>, `V`\>]

##### Type Parameters

• **This**

• **K2**

##### Parameters

• **fn**

• **thisArg**: `This`

##### Returns

[`Collection`\<`K2`, `V`\>, `Collection`\<`Exclude`\<`K`, `K2`\>, `V`\>]

##### Inherited from

`BaseCollection.partition`

#### partition(fn, thisArg)

> **partition**\<`This`, `V2`\>(`fn`, `thisArg`): [`Collection`\<`K`, `V2`\>, `Collection`\<`K`, `Exclude`\<`V`, `V2`\>\>]

##### Type Parameters

• **This**

• **V2**

##### Parameters

• **fn**

• **thisArg**: `This`

##### Returns

[`Collection`\<`K`, `V2`\>, `Collection`\<`K`, `Exclude`\<`V`, `V2`\>\>]

##### Inherited from

`BaseCollection.partition`

#### partition(fn, thisArg)

> **partition**\<`This`\>(`fn`, `thisArg`): [`Collection`\<`K`, `V`\>, `Collection`\<`K`, `V`\>]

##### Type Parameters

• **This**

##### Parameters

• **fn**

• **thisArg**: `This`

##### Returns

[`Collection`\<`K`, `V`\>, `Collection`\<`K`, `V`\>]

##### Inherited from

`BaseCollection.partition`

***

### random()

#### random()

> **random**(): `V`

Obtains unique random value(s) from this collection.

##### Returns

`V`

A single value if no amount is provided or an array of values

##### Inherited from

`BaseCollection.random`

#### random(amount)

> **random**(`amount`): `V`[]

##### Parameters

• **amount**: `number`

##### Returns

`V`[]

##### Inherited from

`BaseCollection.random`

***

### randomKey()

#### randomKey()

> **randomKey**(): `K`

Obtains unique random key(s) from this collection.

##### Returns

`K`

A single key if no amount is provided or an array

##### Inherited from

`BaseCollection.randomKey`

#### randomKey(amount)

> **randomKey**(`amount`): `K`[]

##### Parameters

• **amount**: `number`

##### Returns

`K`[]

##### Inherited from

`BaseCollection.randomKey`

***

### reduce()

> **reduce**\<`T`\>(`fn`, `initialValue`?): `T`

Applies a function to produce a single value. Identical in behavior to
[Array.reduce()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce).

#### Type Parameters

• **T**

#### Parameters

• **fn**

Function used to reduce, taking four arguments; `accumulator`, `currentValue`, `currentKey`,
and `collection`

• **initialValue?**: `T`

Starting value for the accumulator

#### Returns

`T`

#### Example

```ts
collection.reduce((acc, guild) => acc + guild.memberCount, 0);
```

#### Inherited from

`BaseCollection.reduce`

***

### reverse()

> **reverse**(): `this`

Identical to [Array.reverse()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reverse)
but returns a Collection instead of an Array.

#### Returns

`this`

#### Inherited from

`BaseCollection.reverse`

***

### set()

> **set**(`key`, `value`): `this`

Adds a new element with a specified key and value to the Map. If an element with the same key already exists, the element will be updated.

#### Parameters

• **key**: `K`

• **value**: `V`

#### Returns

`this`

#### Inherited from

`BaseCollection.set`

***

### some()

#### some(fn)

> **some**(`fn`): `boolean`

Checks if there exists an item that passes a test. Identical in behavior to
[Array.some()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/some).

##### Parameters

• **fn**

Function used to test (should return a boolean)

##### Returns

`boolean`

##### Example

```ts
collection.some(user => user.discriminator === '0000');
```

##### Inherited from

`BaseCollection.some`

#### some(fn, thisArg)

> **some**\<`T`\>(`fn`, `thisArg`): `boolean`

##### Type Parameters

• **T**

##### Parameters

• **fn**

• **thisArg**: `T`

##### Returns

`boolean`

##### Inherited from

`BaseCollection.some`

***

### sort()

> **sort**(`compareFunction`?): `this`

The sort method sorts the items of a collection in place and returns it.
The sort is not necessarily stable in Node 10 or older.
The default sort order is according to string Unicode code points.

#### Parameters

• **compareFunction?**: `Comparator`\<`K`, `V`\>

Specifies a function that defines the sort order.
If omitted, the collection is sorted according to each character's Unicode code point value, according to the string conversion of each element.

#### Returns

`this`

#### Example

```ts
collection.sort((userA, userB) => userA.createdTimestamp - userB.createdTimestamp);
```

#### Inherited from

`BaseCollection.sort`

***

### sorted()

> **sorted**(`compareFunction`?): `Collection`\<`K`, `V`\>

The sorted method sorts the items of a collection and returns it.
The sort is not necessarily stable in Node 10 or older.
The default sort order is according to string Unicode code points.

#### Parameters

• **compareFunction?**: `Comparator`\<`K`, `V`\>

Specifies a function that defines the sort order.
If omitted, the collection is sorted according to each character's Unicode code point value,
according to the string conversion of each element.

#### Returns

`Collection`\<`K`, `V`\>

#### Example

```ts
collection.sorted((userA, userB) => userA.createdTimestamp - userB.createdTimestamp);
```

#### Inherited from

`BaseCollection.sorted`

***

### sweep()

#### sweep(fn)

> **sweep**(`fn`): `number`

Removes items that satisfy the provided filter function.

##### Parameters

• **fn**

Function used to test (should return a boolean)

##### Returns

`number`

The number of removed entries

##### Inherited from

`BaseCollection.sweep`

#### sweep(fn, thisArg)

> **sweep**\<`T`\>(`fn`, `thisArg`): `number`

##### Type Parameters

• **T**

##### Parameters

• **fn**

• **thisArg**: `T`

##### Returns

`number`

##### Inherited from

`BaseCollection.sweep`

***

### tap()

#### tap(fn)

> **tap**(`fn`): `this`

Runs a function on the collection and returns the collection.

##### Parameters

• **fn**

Function to execute

##### Returns

`this`

##### Example

```ts
collection
 .tap(coll => console.log(coll.size))
 .filter(user => user.bot)
 .tap(coll => console.log(coll.size))
```

##### Inherited from

`BaseCollection.tap`

#### tap(fn, thisArg)

> **tap**\<`T`\>(`fn`, `thisArg`): `this`

##### Type Parameters

• **T**

##### Parameters

• **fn**

• **thisArg**: `T`

##### Returns

`this`

##### Inherited from

`BaseCollection.tap`

***

### toJSON()

> **toJSON**(): `any`[]

#### Returns

`any`[]

#### Overrides

`BaseCollection.toJSON`

***

### values()

> **values**(): `IterableIterator`\<`V`\>

Returns an iterable of values in the map

#### Returns

`IterableIterator`\<`V`\>

#### Inherited from

`BaseCollection.values`

***

### combineEntries()

> `static` **combineEntries**\<`K`, `V`\>(`entries`, `combine`): `Collection`\<`K`, `V`\>

Creates a Collection from a list of entries.

#### Type Parameters

• **K**

• **V**

#### Parameters

• **entries**: `Iterable`\<[`K`, `V`]\>

The list of entries

• **combine**

Function to combine an existing entry with a new one

#### Returns

`Collection`\<`K`, `V`\>

#### Example

```ts
Collection.combineEntries([["a", 1], ["b", 2], ["a", 2]], (x, y) => x + y);
// returns Collection { "a" => 3, "b" => 2 }
```

#### Inherited from

`BaseCollection.combineEntries`
