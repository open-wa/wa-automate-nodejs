---
id: "connect.MessageCollector"
title: "Class: MessageCollector"
sidebar_label: "MessageCollector"
custom_edit_url: null
---

[connect](/api/modules/connect.md).MessageCollector

Collects messages on a chat.
Will automatically stop if the chat (`'chatDelete'`) is deleted.

## Hierarchy

- [`Collector`](/api/classes/connect.Collector.md)

  ↳ **`MessageCollector`**

## Constructors

### constructor

• **new MessageCollector**(`sessionId`, `instanceId`, `chat`, `filter`, `options`, `openWaEventEmitter`)

**`Emits`**

MessageCollector#Message

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `sessionId` | `string` | The id of the session |
| `instanceId` | `string` | The id of the current instance of the session (see: client.getInstanceId) |
| `chat` | `ChatId` | - |
| `filter` | (...`args`: `any`[]) => `boolean` \| `Promise`<`boolean`\> | The filter to be applied to this collector |
| `options` | [`CollectorOptions`](/api/interfaces/connect.CollectorOptions.md) | The options to be applied to this collector |
| `openWaEventEmitter` | `EventEmitter2` | The EventEmitter2 that fires all open-wa events. In local instances of the library, this is the global `ev` object. |

#### Overrides

[Collector](/api/classes/connect.Collector.md).[constructor](/api/classes/connect.Collector.md#constructor-6)

## Properties

### \_idletimeout

• `Protected` **\_idletimeout**: `Timeout`

#### Inherited from

[Collector](/api/classes/connect.Collector.md).[_idletimeout](/api/classes/connect.Collector.md#_idletimeout-6)

___

### \_timeout

• `Protected` **\_timeout**: `Timeout`

#### Inherited from

[Collector](/api/classes/connect.Collector.md).[_timeout](/api/classes/connect.Collector.md#_timeout-6)

___

### chat

• **chat**: `ChatId`

___

### collected

• **collected**: [`Collection`](/api/classes/connect.Collection.md)<`string`, `any`\>

#### Inherited from

[Collector](/api/classes/connect.Collector.md).[collected](/api/classes/connect.Collector.md#collected-6)

___

### ended

• **ended**: `boolean`

#### Inherited from

[Collector](/api/classes/connect.Collector.md).[ended](/api/classes/connect.Collector.md#ended-6)

___

### ev

• **ev**: `EventEmitter2`

___

### filter

• **filter**: (...`args`: `any`[]) => `boolean` \| `Promise`<`boolean`\>

#### Type declaration

▸ (...`args`): `boolean` \| `Promise`<`boolean`\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `...args` | `any`[] |

##### Returns

`boolean` \| `Promise`<`boolean`\>

#### Inherited from

[Collector](/api/classes/connect.Collector.md).[filter](/api/classes/connect.Collector.md#filter-6)

___

### instanceId

• **instanceId**: `string`

___

### options

• **options**: [`CollectorOptions`](/api/interfaces/connect.CollectorOptions.md)

#### Inherited from

[Collector](/api/classes/connect.Collector.md).[options](/api/classes/connect.Collector.md#options-6)

___

### received

• **received**: `number`

___

### sessionId

• **sessionId**: `string`

___

### captureRejectionSymbol

▪ `Static` `Readonly` **captureRejectionSymbol**: typeof [`captureRejectionSymbol`](/api/classes/structures_Collector.Collector.md#capturerejectionsymbol-212)

#### Inherited from

[Collector](/api/classes/connect.Collector.md).[captureRejectionSymbol](/api/classes/connect.Collector.md#capturerejectionsymbol-6)

___

### captureRejections

▪ `Static` **captureRejections**: `boolean`

Sets or gets the default captureRejection value for all emitters.

#### Inherited from

[Collector](/api/classes/connect.Collector.md).[captureRejections](/api/classes/connect.Collector.md#capturerejections-6)

___

### defaultMaxListeners

▪ `Static` **defaultMaxListeners**: `number`

#### Inherited from

[Collector](/api/classes/connect.Collector.md).[defaultMaxListeners](/api/classes/connect.Collector.md#defaultmaxlisteners-6)

___

### errorMonitor

▪ `Static` `Readonly` **errorMonitor**: typeof [`errorMonitor`](/api/classes/structures_Collector.Collector.md#errormonitor-212)

This symbol shall be used to install a listener for only monitoring `'error'`
events. Listeners installed using this symbol are called before the regular
`'error'` listeners are called.

Installing a listener using this symbol does not change the behavior once an
`'error'` event is emitted, therefore the process will still crash if no
regular `'error'` listener is installed.

#### Inherited from

[Collector](/api/classes/connect.Collector.md).[errorMonitor](/api/classes/connect.Collector.md#errormonitor-6)

## Accessors

### next

• `get` **next**(): `Promise`<`any`\>

Returns a promise that resolves with the next collected element;
rejects with collected elements if the collector finishes without receiving a next element

#### Returns

`Promise`<`any`\>

#### Inherited from

Collector.next

## Methods

### [asyncIterator]

▸ **[asyncIterator]**(): `any`

Allows collectors to be consumed with for-await-of loops

**`See`**

[https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of)

#### Returns

`any`

#### Inherited from

[Collector](/api/classes/connect.Collector.md).[[asyncIterator]](/api/classes/connect.Collector.md#[asynciterator]-6)

___

### addListener

▸ **addListener**(`eventName`, `listener`): [`MessageCollector`](/api/classes/connect.MessageCollector.md)

Alias for `emitter.on(eventName, listener)`.

**`Since`**

v0.1.26

#### Parameters

| Name | Type |
| :------ | :------ |
| `eventName` | `string` \| `symbol` |
| `listener` | (...`args`: `any`[]) => `void` |

#### Returns

[`MessageCollector`](/api/classes/connect.MessageCollector.md)

#### Inherited from

[Collector](/api/classes/connect.Collector.md).[addListener](/api/classes/connect.Collector.md#addlistener-6)

___

### checkEnd

▸ **checkEnd**(): `void`

Checks whether the collector should end, and if so, ends it.

#### Returns

`void`

#### Inherited from

[Collector](/api/classes/connect.Collector.md).[checkEnd](/api/classes/connect.Collector.md#checkend-6)

___

### clearImmediate

▸ **clearImmediate**(`immediate`): `void`

Clears an immediate.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `immediate` | `Immediate` | Immediate to cancel |

#### Returns

`void`

#### Inherited from

[Collector](/api/classes/connect.Collector.md).[clearImmediate](/api/classes/connect.Collector.md#clearimmediate-6)

___

### clearInterval

▸ **clearInterval**(`interval`): `void`

Clears an interval.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `interval` | `Timeout` | Interval to cancel |

#### Returns

`void`

#### Inherited from

[Collector](/api/classes/connect.Collector.md).[clearInterval](/api/classes/connect.Collector.md#clearinterval-6)

___

### clearTimeout

▸ **clearTimeout**(`timeout`): `void`

Clears a timeout.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `timeout` | `Timeout` | Timeout to cancel |

#### Returns

`void`

#### Inherited from

[Collector](/api/classes/connect.Collector.md).[clearTimeout](/api/classes/connect.Collector.md#cleartimeout-6)

___

### destroy

▸ **destroy**(): `void`

Destroys all assets used by the base client.

#### Returns

`void`

#### Inherited from

[Collector](/api/classes/connect.Collector.md).[destroy](/api/classes/connect.Collector.md#destroy-6)

___

### dispose

▸ **dispose**(`message`): \`false\_${number}-${number}@g.us\_${string}\` \| \`false\_${number}@c.us\_${string}\` \| \`true\_${number}-${number}@g.us\_${string}\` \| \`true\_${number}@c.us\_${string}\`

Handles a message for possible disposal.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `message` | `Message` | The message that could be disposed of |

#### Returns

\`false\_${number}-${number}@g.us\_${string}\` \| \`false\_${number}@c.us\_${string}\` \| \`true\_${number}-${number}@g.us\_${string}\` \| \`true\_${number}@c.us\_${string}\`

#### Overrides

[Collector](/api/classes/connect.Collector.md).[dispose](/api/classes/connect.Collector.md#dispose-6)

___

### emit

▸ **emit**(`eventName`, ...`args`): `boolean`

Synchronously calls each of the listeners registered for the event named`eventName`, in the order they were registered, passing the supplied arguments
to each.

Returns `true` if the event had listeners, `false` otherwise.

```js
const EventEmitter = require('events');
const myEmitter = new EventEmitter();

// First listener
myEmitter.on('event', function firstListener() {
  console.log('Helloooo! first listener');
});
// Second listener
myEmitter.on('event', function secondListener(arg1, arg2) {
  console.log(`event with parameters ${arg1}, ${arg2} in second listener`);
});
// Third listener
myEmitter.on('event', function thirdListener(...args) {
  const parameters = args.join(', ');
  console.log(`event with parameters ${parameters} in third listener`);
});

console.log(myEmitter.listeners('event'));

myEmitter.emit('event', 1, 2, 3, 4, 5);

// Prints:
// [
//   [Function: firstListener],
//   [Function: secondListener],
//   [Function: thirdListener]
// ]
// Helloooo! first listener
// event with parameters 1, 2 in second listener
// event with parameters 1, 2, 3, 4, 5 in third listener
```

**`Since`**

v0.1.26

#### Parameters

| Name | Type |
| :------ | :------ |
| `eventName` | `string` \| `symbol` |
| `...args` | `any`[] |

#### Returns

`boolean`

#### Inherited from

[Collector](/api/classes/connect.Collector.md).[emit](/api/classes/connect.Collector.md#emit-6)

___

### eventNames

▸ **eventNames**(): (`string` \| `symbol`)[]

Returns an array listing the events for which the emitter has registered
listeners. The values in the array are strings or `Symbol`s.

```js
const EventEmitter = require('events');
const myEE = new EventEmitter();
myEE.on('foo', () => {});
myEE.on('bar', () => {});

const sym = Symbol('symbol');
myEE.on(sym, () => {});

console.log(myEE.eventNames());
// Prints: [ 'foo', 'bar', Symbol(symbol) ]
```

**`Since`**

v6.0.0

#### Returns

(`string` \| `symbol`)[]

#### Inherited from

[Collector](/api/classes/connect.Collector.md).[eventNames](/api/classes/connect.Collector.md#eventnames-6)

___

### eventSignature

▸ **eventSignature**(`event`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | [`SimpleListener`](/api/enums/connect.SimpleListener.md) |

#### Returns

`string`

___

### getMaxListeners

▸ **getMaxListeners**(): `number`

Returns the current max listener value for the `EventEmitter` which is either
set by `emitter.setMaxListeners(n)` or defaults to [defaultMaxListeners](/api/classes/connect.MessageCollector.md#defaultmaxlisteners-6).

**`Since`**

v1.0.0

#### Returns

`number`

#### Inherited from

[Collector](/api/classes/connect.Collector.md).[getMaxListeners](/api/classes/connect.Collector.md#getmaxlisteners-6)

___

### handleCollect

▸ **handleCollect**(...`args`): `Promise`<`void`\>

Call this to handle an event as a collectable element. Accepts any event data as parameters.

**`Emits`**

Collector#collect

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `...args` | `any`[] | The arguments emitted by the listener |

#### Returns

`Promise`<`void`\>

#### Inherited from

[Collector](/api/classes/connect.Collector.md).[handleCollect](/api/classes/connect.Collector.md#handlecollect-6)

___

### handleDispose

▸ **handleDispose**(...`args`): `Promise`<`void`\>

Call this to remove an element from the collection. Accepts any event data as parameters.

**`Emits`**

Collector#dispose

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `...args` | `any`[] | The arguments emitted by the listener |

#### Returns

`Promise`<`void`\>

#### Inherited from

[Collector](/api/classes/connect.Collector.md).[handleDispose](/api/classes/connect.Collector.md#handledispose-6)

___

### listenerCount

▸ **listenerCount**(`eventName`): `number`

Returns the number of listeners listening to the event named `eventName`.

**`Since`**

v3.2.0

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `eventName` | `string` \| `symbol` | The name of the event being listened for |

#### Returns

`number`

#### Inherited from

[Collector](/api/classes/connect.Collector.md).[listenerCount](/api/classes/connect.Collector.md#listenercount-12)

___

### listeners

▸ **listeners**(`eventName`): `Function`[]

Returns a copy of the array of listeners for the event named `eventName`.

```js
server.on('connection', (stream) => {
  console.log('someone connected!');
});
console.log(util.inspect(server.listeners('connection')));
// Prints: [ [Function] ]
```

**`Since`**

v0.1.26

#### Parameters

| Name | Type |
| :------ | :------ |
| `eventName` | `string` \| `symbol` |

#### Returns

`Function`[]

#### Inherited from

[Collector](/api/classes/connect.Collector.md).[listeners](/api/classes/connect.Collector.md#listeners-6)

___

### off

▸ **off**(`eventName`, `listener`): [`MessageCollector`](/api/classes/connect.MessageCollector.md)

Alias for `emitter.removeListener()`.

**`Since`**

v10.0.0

#### Parameters

| Name | Type |
| :------ | :------ |
| `eventName` | `string` \| `symbol` |
| `listener` | (...`args`: `any`[]) => `void` |

#### Returns

[`MessageCollector`](/api/classes/connect.MessageCollector.md)

#### Inherited from

[Collector](/api/classes/connect.Collector.md).[off](/api/classes/connect.Collector.md#off-6)

___

### on

▸ **on**(`eventName`, `listener`): [`MessageCollector`](/api/classes/connect.MessageCollector.md)

Adds the `listener` function to the end of the listeners array for the
event named `eventName`. No checks are made to see if the `listener` has
already been added. Multiple calls passing the same combination of `eventName`and `listener` will result in the `listener` being added, and called, multiple
times.

```js
server.on('connection', (stream) => {
  console.log('someone connected!');
});
```

Returns a reference to the `EventEmitter`, so that calls can be chained.

By default, event listeners are invoked in the order they are added. The`emitter.prependListener()` method can be used as an alternative to add the
event listener to the beginning of the listeners array.

```js
const myEE = new EventEmitter();
myEE.on('foo', () => console.log('a'));
myEE.prependListener('foo', () => console.log('b'));
myEE.emit('foo');
// Prints:
//   b
//   a
```

**`Since`**

v0.1.101

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `eventName` | `string` \| `symbol` | The name of the event. |
| `listener` | (...`args`: `any`[]) => `void` | The callback function |

#### Returns

[`MessageCollector`](/api/classes/connect.MessageCollector.md)

#### Inherited from

[Collector](/api/classes/connect.Collector.md).[on](/api/classes/connect.Collector.md#on-12)

___

### once

▸ **once**(`eventName`, `listener`): [`MessageCollector`](/api/classes/connect.MessageCollector.md)

Adds a **one-time**`listener` function for the event named `eventName`. The
next time `eventName` is triggered, this listener is removed and then invoked.

```js
server.once('connection', (stream) => {
  console.log('Ah, we have our first user!');
});
```

Returns a reference to the `EventEmitter`, so that calls can be chained.

By default, event listeners are invoked in the order they are added. The`emitter.prependOnceListener()` method can be used as an alternative to add the
event listener to the beginning of the listeners array.

```js
const myEE = new EventEmitter();
myEE.once('foo', () => console.log('a'));
myEE.prependOnceListener('foo', () => console.log('b'));
myEE.emit('foo');
// Prints:
//   b
//   a
```

**`Since`**

v0.3.0

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `eventName` | `string` \| `symbol` | The name of the event. |
| `listener` | (...`args`: `any`[]) => `void` | The callback function |

#### Returns

[`MessageCollector`](/api/classes/connect.MessageCollector.md)

#### Inherited from

[Collector](/api/classes/connect.Collector.md).[once](/api/classes/connect.Collector.md#once-12)

___

### prependListener

▸ **prependListener**(`eventName`, `listener`): [`MessageCollector`](/api/classes/connect.MessageCollector.md)

Adds the `listener` function to the _beginning_ of the listeners array for the
event named `eventName`. No checks are made to see if the `listener` has
already been added. Multiple calls passing the same combination of `eventName`and `listener` will result in the `listener` being added, and called, multiple
times.

```js
server.prependListener('connection', (stream) => {
  console.log('someone connected!');
});
```

Returns a reference to the `EventEmitter`, so that calls can be chained.

**`Since`**

v6.0.0

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `eventName` | `string` \| `symbol` | The name of the event. |
| `listener` | (...`args`: `any`[]) => `void` | The callback function |

#### Returns

[`MessageCollector`](/api/classes/connect.MessageCollector.md)

#### Inherited from

[Collector](/api/classes/connect.Collector.md).[prependListener](/api/classes/connect.Collector.md#prependlistener-6)

___

### prependOnceListener

▸ **prependOnceListener**(`eventName`, `listener`): [`MessageCollector`](/api/classes/connect.MessageCollector.md)

Adds a **one-time**`listener` function for the event named `eventName` to the _beginning_ of the listeners array. The next time `eventName` is triggered, this
listener is removed, and then invoked.

```js
server.prependOnceListener('connection', (stream) => {
  console.log('Ah, we have our first user!');
});
```

Returns a reference to the `EventEmitter`, so that calls can be chained.

**`Since`**

v6.0.0

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `eventName` | `string` \| `symbol` | The name of the event. |
| `listener` | (...`args`: `any`[]) => `void` | The callback function |

#### Returns

[`MessageCollector`](/api/classes/connect.MessageCollector.md)

#### Inherited from

[Collector](/api/classes/connect.Collector.md).[prependOnceListener](/api/classes/connect.Collector.md#prependoncelistener-6)

___

### rawListeners

▸ **rawListeners**(`eventName`): `Function`[]

Returns a copy of the array of listeners for the event named `eventName`,
including any wrappers (such as those created by `.once()`).

```js
const emitter = new EventEmitter();
emitter.once('log', () => console.log('log once'));

// Returns a new Array with a function `onceWrapper` which has a property
// `listener` which contains the original listener bound above
const listeners = emitter.rawListeners('log');
const logFnWrapper = listeners[0];

// Logs "log once" to the console and does not unbind the `once` event
logFnWrapper.listener();

// Logs "log once" to the console and removes the listener
logFnWrapper();

emitter.on('log', () => console.log('log persistently'));
// Will return a new Array with a single function bound by `.on()` above
const newListeners = emitter.rawListeners('log');

// Logs "log persistently" twice
newListeners[0]();
emitter.emit('log');
```

**`Since`**

v9.4.0

#### Parameters

| Name | Type |
| :------ | :------ |
| `eventName` | `string` \| `symbol` |

#### Returns

`Function`[]

#### Inherited from

[Collector](/api/classes/connect.Collector.md).[rawListeners](/api/classes/connect.Collector.md#rawlisteners-6)

___

### removeAllListeners

▸ **removeAllListeners**(`event?`): [`MessageCollector`](/api/classes/connect.MessageCollector.md)

Removes all listeners, or those of the specified `eventName`.

It is bad practice to remove listeners added elsewhere in the code,
particularly when the `EventEmitter` instance was created by some other
component or module (e.g. sockets or file streams).

Returns a reference to the `EventEmitter`, so that calls can be chained.

**`Since`**

v0.1.26

#### Parameters

| Name | Type |
| :------ | :------ |
| `event?` | `string` \| `symbol` |

#### Returns

[`MessageCollector`](/api/classes/connect.MessageCollector.md)

#### Inherited from

[Collector](/api/classes/connect.Collector.md).[removeAllListeners](/api/classes/connect.Collector.md#removealllisteners-6)

___

### removeListener

▸ **removeListener**(`eventName`, `listener`): [`MessageCollector`](/api/classes/connect.MessageCollector.md)

Removes the specified `listener` from the listener array for the event named`eventName`.

```js
const callback = (stream) => {
  console.log('someone connected!');
};
server.on('connection', callback);
// ...
server.removeListener('connection', callback);
```

`removeListener()` will remove, at most, one instance of a listener from the
listener array. If any single listener has been added multiple times to the
listener array for the specified `eventName`, then `removeListener()` must be
called multiple times to remove each instance.

Once an event is emitted, all listeners attached to it at the
time of emitting are called in order. This implies that any`removeListener()` or `removeAllListeners()` calls _after_ emitting and _before_ the last listener finishes execution
will not remove them from`emit()` in progress. Subsequent events behave as expected.

```js
const myEmitter = new MyEmitter();

const callbackA = () => {
  console.log('A');
  myEmitter.removeListener('event', callbackB);
};

const callbackB = () => {
  console.log('B');
};

myEmitter.on('event', callbackA);

myEmitter.on('event', callbackB);

// callbackA removes listener callbackB but it will still be called.
// Internal listener array at time of emit [callbackA, callbackB]
myEmitter.emit('event');
// Prints:
//   A
//   B

// callbackB is now removed.
// Internal listener array [callbackA]
myEmitter.emit('event');
// Prints:
//   A
```

Because listeners are managed using an internal array, calling this will
change the position indices of any listener registered _after_ the listener
being removed. This will not impact the order in which listeners are called,
but it means that any copies of the listener array as returned by
the `emitter.listeners()` method will need to be recreated.

When a single function has been added as a handler multiple times for a single
event (as in the example below), `removeListener()` will remove the most
recently added instance. In the example the `once('ping')`listener is removed:

```js
const ee = new EventEmitter();

function pong() {
  console.log('pong');
}

ee.on('ping', pong);
ee.once('ping', pong);
ee.removeListener('ping', pong);

ee.emit('ping');
ee.emit('ping');
```

Returns a reference to the `EventEmitter`, so that calls can be chained.

**`Since`**

v0.1.26

#### Parameters

| Name | Type |
| :------ | :------ |
| `eventName` | `string` \| `symbol` |
| `listener` | (...`args`: `any`[]) => `void` |

#### Returns

[`MessageCollector`](/api/classes/connect.MessageCollector.md)

#### Inherited from

[Collector](/api/classes/connect.Collector.md).[removeListener](/api/classes/connect.Collector.md#removelistener-6)

___

### resetTimer

▸ **resetTimer**(`options?`): `void`

Resets the collectors timeout and idle timer.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `options?` | `Object` | Options |
| `options.idle` | `any` | How long to stop the collector after inactivity in milliseconds |
| `options.time` | `any` | How long to run the collector for in milliseconds |

#### Returns

`void`

#### Inherited from

[Collector](/api/classes/connect.Collector.md).[resetTimer](/api/classes/connect.Collector.md#resettimer-6)

___

### setImmediate

▸ **setImmediate**(`fn`, ...`args`): `Immediate`

Sets an immediate that will be automatically cancelled if the client is destroyed.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fn` | (...`args`: `any`[]) => `any` | Function to execute |
| `...args` | `any`[] | Arguments for the function |

#### Returns

`Immediate`

#### Inherited from

[Collector](/api/classes/connect.Collector.md).[setImmediate](/api/classes/connect.Collector.md#setimmediate-6)

___

### setInterval

▸ **setInterval**(`fn`, `delay`, ...`args`): `Timeout`

Sets an interval that will be automatically cancelled if the client is destroyed.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fn` | (...`args`: `any`[]) => `any` | Function to execute |
| `delay` | `number` | Time to wait between executions (in milliseconds) |
| `...args` | `any`[] | Arguments for the function |

#### Returns

`Timeout`

#### Inherited from

[Collector](/api/classes/connect.Collector.md).[setInterval](/api/classes/connect.Collector.md#setinterval-6)

___

### setMaxListeners

▸ **setMaxListeners**(`n`): [`MessageCollector`](/api/classes/connect.MessageCollector.md)

By default `EventEmitter`s will print a warning if more than `10` listeners are
added for a particular event. This is a useful default that helps finding
memory leaks. The `emitter.setMaxListeners()` method allows the limit to be
modified for this specific `EventEmitter` instance. The value can be set to`Infinity` (or `0`) to indicate an unlimited number of listeners.

Returns a reference to the `EventEmitter`, so that calls can be chained.

**`Since`**

v0.3.5

#### Parameters

| Name | Type |
| :------ | :------ |
| `n` | `number` |

#### Returns

[`MessageCollector`](/api/classes/connect.MessageCollector.md)

#### Inherited from

[Collector](/api/classes/connect.Collector.md).[setMaxListeners](/api/classes/connect.Collector.md#setmaxlisteners-12)

___

### setTimeout

▸ **setTimeout**(`fn`, `delay`, ...`args`): `Timeout`

Sets a timeout that will be automatically cancelled if the client is destroyed.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fn` | (...`args`: `any`[]) => `any` | Function to execute |
| `delay` | `number` | Time to wait before executing (in milliseconds) |
| `...args` | `any`[] | Arguments for the function |

#### Returns

`Timeout`

#### Inherited from

[Collector](/api/classes/connect.Collector.md).[setTimeout](/api/classes/connect.Collector.md#settimeout-6)

___

### stop

▸ **stop**(`reason?`): `void`

Stops this collector and emits the `end` event.

**`Emits`**

Collector#end

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `reason?` | `string` | The reason this collector is ending |

#### Returns

`void`

#### Inherited from

[Collector](/api/classes/connect.Collector.md).[stop](/api/classes/connect.Collector.md#stop-6)

___

### wrapHandler

▸ **wrapHandler**(`handler`): (`__namedParameters`: { `data`: `any`  }) => `any`

#### Parameters

| Name | Type |
| :------ | :------ |
| `handler` | (`data`: `any`) => `any` |

#### Returns

`fn`

▸ (`__namedParameters`): `any`

##### Parameters

| Name | Type |
| :------ | :------ |
| `__namedParameters` | `Object` |
| `__namedParameters.data` | `any` |

##### Returns

`any`

___

### getEventListeners

▸ `Static` **getEventListeners**(`emitter`, `name`): `Function`[]

Returns a copy of the array of listeners for the event named `eventName`.

For `EventEmitter`s this behaves exactly the same as calling `.listeners` on
the emitter.

For `EventTarget`s this is the only way to get the event listeners for the
event target. This is useful for debugging and diagnostic purposes.

```js
const { getEventListeners, EventEmitter } = require('events');

{
  const ee = new EventEmitter();
  const listener = () => console.log('Events are fun');
  ee.on('foo', listener);
  getEventListeners(ee, 'foo'); // [listener]
}
{
  const et = new EventTarget();
  const listener = () => console.log('Events are fun');
  et.addEventListener('foo', listener);
  getEventListeners(et, 'foo'); // [listener]
}
```

**`Since`**

v15.2.0, v14.17.0

#### Parameters

| Name | Type |
| :------ | :------ |
| `emitter` | `EventEmitter` \| `DOMEventTarget` |
| `name` | `string` \| `symbol` |

#### Returns

`Function`[]

#### Inherited from

[Collector](/api/classes/connect.Collector.md).[getEventListeners](/api/classes/connect.Collector.md#geteventlisteners-6)

___

### listenerCount

▸ `Static` **listenerCount**(`emitter`, `eventName`): `number`

A class method that returns the number of listeners for the given `eventName`registered on the given `emitter`.

```js
const { EventEmitter, listenerCount } = require('events');
const myEmitter = new EventEmitter();
myEmitter.on('event', () => {});
myEmitter.on('event', () => {});
console.log(listenerCount(myEmitter, 'event'));
// Prints: 2
```

**`Since`**

v0.9.12

**`Deprecated`**

Since v3.2.0 - Use `listenerCount` instead.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `emitter` | `EventEmitter` | The emitter to query |
| `eventName` | `string` \| `symbol` | The event name |

#### Returns

`number`

#### Inherited from

[Collector](/api/classes/connect.Collector.md).[listenerCount](/api/classes/connect.Collector.md#listenercount-13)

___

### on

▸ `Static` **on**(`emitter`, `eventName`, `options?`): `AsyncIterableIterator`<`any`\>

```js
const { on, EventEmitter } = require('events');

(async () => {
  const ee = new EventEmitter();

  // Emit later on
  process.nextTick(() => {
    ee.emit('foo', 'bar');
    ee.emit('foo', 42);
  });

  for await (const event of on(ee, 'foo')) {
    // The execution of this inner block is synchronous and it
    // processes one event at a time (even with await). Do not use
    // if concurrent execution is required.
    console.log(event); // prints ['bar'] [42]
  }
  // Unreachable here
})();
```

Returns an `AsyncIterator` that iterates `eventName` events. It will throw
if the `EventEmitter` emits `'error'`. It removes all listeners when
exiting the loop. The `value` returned by each iteration is an array
composed of the emitted event arguments.

An `AbortSignal` can be used to cancel waiting on events:

```js
const { on, EventEmitter } = require('events');
const ac = new AbortController();

(async () => {
  const ee = new EventEmitter();

  // Emit later on
  process.nextTick(() => {
    ee.emit('foo', 'bar');
    ee.emit('foo', 42);
  });

  for await (const event of on(ee, 'foo', { signal: ac.signal })) {
    // The execution of this inner block is synchronous and it
    // processes one event at a time (even with await). Do not use
    // if concurrent execution is required.
    console.log(event); // prints ['bar'] [42]
  }
  // Unreachable here
})();

process.nextTick(() => ac.abort());
```

**`Since`**

v13.6.0, v12.16.0

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `emitter` | `EventEmitter` | - |
| `eventName` | `string` | The name of the event being listened for |
| `options?` | `StaticEventEmitterOptions` | - |

#### Returns

`AsyncIterableIterator`<`any`\>

that iterates `eventName` events emitted by the `emitter`

#### Inherited from

[Collector](/api/classes/connect.Collector.md).[on](/api/classes/connect.Collector.md#on-13)

___

### once

▸ `Static` **once**(`emitter`, `eventName`, `options?`): `Promise`<`any`[]\>

Creates a `Promise` that is fulfilled when the `EventEmitter` emits the given
event or that is rejected if the `EventEmitter` emits `'error'` while waiting.
The `Promise` will resolve with an array of all the arguments emitted to the
given event.

This method is intentionally generic and works with the web platform [EventTarget](https://dom.spec.whatwg.org/#interface-eventtarget) interface, which has no special`'error'` event
semantics and does not listen to the `'error'` event.

```js
const { once, EventEmitter } = require('events');

async function run() {
  const ee = new EventEmitter();

  process.nextTick(() => {
    ee.emit('myevent', 42);
  });

  const [value] = await once(ee, 'myevent');
  console.log(value);

  const err = new Error('kaboom');
  process.nextTick(() => {
    ee.emit('error', err);
  });

  try {
    await once(ee, 'myevent');
  } catch (err) {
    console.log('error happened', err);
  }
}

run();
```

The special handling of the `'error'` event is only used when `events.once()`is used to wait for another event. If `events.once()` is used to wait for the
'`error'` event itself, then it is treated as any other kind of event without
special handling:

```js
const { EventEmitter, once } = require('events');

const ee = new EventEmitter();

once(ee, 'error')
  .then(([err]) => console.log('ok', err.message))
  .catch((err) => console.log('error', err.message));

ee.emit('error', new Error('boom'));

// Prints: ok boom
```

An `AbortSignal` can be used to cancel waiting for the event:

```js
const { EventEmitter, once } = require('events');

const ee = new EventEmitter();
const ac = new AbortController();

async function foo(emitter, event, signal) {
  try {
    await once(emitter, event, { signal });
    console.log('event emitted!');
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('Waiting for the event was canceled!');
    } else {
      console.error('There was an error', error.message);
    }
  }
}

foo(ee, 'foo', ac.signal);
ac.abort(); // Abort waiting for the event
ee.emit('foo'); // Prints: Waiting for the event was canceled!
```

**`Since`**

v11.13.0, v10.16.0

#### Parameters

| Name | Type |
| :------ | :------ |
| `emitter` | `NodeEventTarget` |
| `eventName` | `string` \| `symbol` |
| `options?` | `StaticEventEmitterOptions` |

#### Returns

`Promise`<`any`[]\>

#### Inherited from

[Collector](/api/classes/connect.Collector.md).[once](/api/classes/connect.Collector.md#once-13)

▸ `Static` **once**(`emitter`, `eventName`, `options?`): `Promise`<`any`[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `emitter` | `DOMEventTarget` |
| `eventName` | `string` |
| `options?` | `StaticEventEmitterOptions` |

#### Returns

`Promise`<`any`[]\>

#### Inherited from

[Collector](/api/classes/connect.Collector.md).[once](/api/classes/connect.Collector.md#once-13)

___

### setMaxListeners

▸ `Static` **setMaxListeners**(`n?`, ...`eventTargets`): `void`

```js
const {
  setMaxListeners,
  EventEmitter
} = require('events');

const target = new EventTarget();
const emitter = new EventEmitter();

setMaxListeners(5, target, emitter);
```

**`Since`**

v15.4.0

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `n?` | `number` | A non-negative number. The maximum number of listeners per `EventTarget` event. |
| `...eventTargets` | (`EventEmitter` \| `DOMEventTarget`)[] | - |

#### Returns

`void`

#### Inherited from

[Collector](/api/classes/connect.Collector.md).[setMaxListeners](/api/classes/connect.Collector.md#setmaxlisteners-13)
