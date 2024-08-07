# Class: MessageCollector

Collects messages on a chat.
Will automatically stop if the chat (`'chatDelete'`) is deleted.

## Extends

- [`Collector`](/reference/structures/Collector/classes/Collector.md)

## Constructors

### new MessageCollector()

> **new MessageCollector**(`sessionId`, `instanceId`, `chat`, `filter`, `options`, `openWaEventEmitter`): [`MessageCollector`](/reference/structures/MessageCollector/classes/MessageCollector.md)

#### Parameters

• **sessionId**: `string`

The id of the session

• **instanceId**: `string`

The id of the current instance of the session (see: client.getInstanceId)

• **chat**: [`ChatId`](/reference/api/model/aliases/type-aliases/ChatId.md)

• **filter**

The filter to be applied to this collector

• **options**: [`CollectorOptions`](/reference/structures/Collector/interfaces/CollectorOptions.md) = `{}`

The options to be applied to this collector

• **openWaEventEmitter**: `EventEmitter2`

The EventEmitter2 that fires all open-wa events. In local instances of the library, this is the global `ev` object.

#### Returns

[`MessageCollector`](/reference/structures/MessageCollector/classes/MessageCollector.md)

#### Emits

MessageCollector#Message

#### Overrides

[`Collector`](/reference/structures/Collector/classes/Collector.md).[`constructor`](/reference/structures/Collector/classes/Collector.md#constructors)

## Properties

### \_idletimeout

> `protected` **\_idletimeout**: `Timeout`

#### Inherited from

[`Collector`](/reference/structures/Collector/classes/Collector.md).[`_idletimeout`](/reference/structures/Collector/classes/Collector.md#_idletimeout)

***

### \_timeout

> `protected` **\_timeout**: `Timeout`

#### Inherited from

[`Collector`](/reference/structures/Collector/classes/Collector.md).[`_timeout`](/reference/structures/Collector/classes/Collector.md#_timeout)

***

### chat

> **chat**: [`ChatId`](/reference/api/model/aliases/type-aliases/ChatId.md)

***

### collected

> **collected**: [`Collection`](/reference/structures/Collector/classes/Collection.md)\<`string`, `any`\>

#### Inherited from

[`Collector`](/reference/structures/Collector/classes/Collector.md).[`collected`](/reference/structures/Collector/classes/Collector.md#collected)

***

### ended

> **ended**: `boolean`

#### Inherited from

[`Collector`](/reference/structures/Collector/classes/Collector.md).[`ended`](/reference/structures/Collector/classes/Collector.md#ended)

***

### ev

> **ev**: `EventEmitter2`

***

### filter()

> **filter**: (...`args`) => `boolean` \| `Promise`\<`boolean`\>

#### Parameters

• ...**args**: `any`[]

#### Returns

`boolean` \| `Promise`\<`boolean`\>

#### Inherited from

[`Collector`](/reference/structures/Collector/classes/Collector.md).[`filter`](/reference/structures/Collector/classes/Collector.md#filter)

***

### instanceId

> **instanceId**: `string`

***

### options

> **options**: [`CollectorOptions`](/reference/structures/Collector/interfaces/CollectorOptions.md)

#### Inherited from

[`Collector`](/reference/structures/Collector/classes/Collector.md).[`options`](/reference/structures/Collector/classes/Collector.md#options)

***

### received

> **received**: `number`

***

### sessionId

> **sessionId**: `string`

***

### captureRejectionSymbol

> `readonly` `static` **captureRejectionSymbol**: *typeof* [`captureRejectionSymbol`](/reference/structures/Collector/classes/Collector.md#capturerejectionsymbol)

#### Inherited from

[`Collector`](/reference/structures/Collector/classes/Collector.md).[`captureRejectionSymbol`](/reference/structures/Collector/classes/Collector.md#capturerejectionsymbol)

***

### captureRejections

> `static` **captureRejections**: `boolean`

Sets or gets the default captureRejection value for all emitters.

#### Inherited from

[`Collector`](/reference/structures/Collector/classes/Collector.md).[`captureRejections`](/reference/structures/Collector/classes/Collector.md#capturerejections)

***

### defaultMaxListeners

> `static` **defaultMaxListeners**: `number`

#### Inherited from

[`Collector`](/reference/structures/Collector/classes/Collector.md).[`defaultMaxListeners`](/reference/structures/Collector/classes/Collector.md#defaultmaxlisteners)

***

### errorMonitor

> `readonly` `static` **errorMonitor**: *typeof* [`errorMonitor`](/reference/structures/Collector/classes/Collector.md#errormonitor)

This symbol shall be used to install a listener for only monitoring `'error'`
events. Listeners installed using this symbol are called before the regular
`'error'` listeners are called.

Installing a listener using this symbol does not change the behavior once an
`'error'` event is emitted, therefore the process will still crash if no
regular `'error'` listener is installed.

#### Inherited from

[`Collector`](/reference/structures/Collector/classes/Collector.md).[`errorMonitor`](/reference/structures/Collector/classes/Collector.md#errormonitor)

## Accessors

### next

> `get` **next**(): `Promise`\<`any`\>

Returns a promise that resolves with the next collected element;
rejects with collected elements if the collector finishes without receiving a next element

#### Returns

`Promise`\<`any`\>

#### Inherited from

[`Collector`](/reference/structures/Collector/classes/Collector.md).[`next`](/reference/structures/Collector/classes/Collector.md#next)

## Methods

### \[asyncIterator\]()

> **\[asyncIterator\]**(): `any`

Allows collectors to be consumed with for-await-of loops

#### Returns

`any`

#### See

[https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of)

#### Inherited from

[`Collector`](/reference/structures/Collector/classes/Collector.md).[`[asyncIterator]`](/reference/structures/Collector/classes/Collector.md#%5Basynciterator%5D)

***

### addListener()

> **addListener**(`eventName`, `listener`): `this`

Alias for `emitter.on(eventName, listener)`.

#### Parameters

• **eventName**: `string` \| `symbol`

• **listener**

#### Returns

`this`

#### Since

v0.1.26

#### Inherited from

[`Collector`](/reference/structures/Collector/classes/Collector.md).[`addListener`](/reference/structures/Collector/classes/Collector.md#addlistener)

***

### checkEnd()

> **checkEnd**(): `void`

Checks whether the collector should end, and if so, ends it.

#### Returns

`void`

#### Inherited from

[`Collector`](/reference/structures/Collector/classes/Collector.md).[`checkEnd`](/reference/structures/Collector/classes/Collector.md#checkend)

***

### clearImmediate()

> **clearImmediate**(`immediate`): `void`

Clears an immediate.

#### Parameters

• **immediate**: `Immediate`

Immediate to cancel

#### Returns

`void`

#### Inherited from

[`Collector`](/reference/structures/Collector/classes/Collector.md).[`clearImmediate`](/reference/structures/Collector/classes/Collector.md#clearimmediate)

***

### clearInterval()

> **clearInterval**(`interval`): `void`

Clears an interval.

#### Parameters

• **interval**: `Timeout`

Interval to cancel

#### Returns

`void`

#### Inherited from

[`Collector`](/reference/structures/Collector/classes/Collector.md).[`clearInterval`](/reference/structures/Collector/classes/Collector.md#clearinterval)

***

### clearTimeout()

> **clearTimeout**(`timeout`): `void`

Clears a timeout.

#### Parameters

• **timeout**: `Timeout`

Timeout to cancel

#### Returns

`void`

#### Inherited from

[`Collector`](/reference/structures/Collector/classes/Collector.md).[`clearTimeout`](/reference/structures/Collector/classes/Collector.md#cleartimeout)

***

### destroy()

> **destroy**(): `void`

Destroys all assets used by the base client.

#### Returns

`void`

#### Inherited from

[`Collector`](/reference/structures/Collector/classes/Collector.md).[`destroy`](/reference/structures/Collector/classes/Collector.md#destroy)

***

### dispose()

> **dispose**(`message`): [`MessageId`](/reference/api/model/aliases/type-aliases/MessageId.md)

Handles a message for possible disposal.

#### Parameters

• **message**: [`Message`](/reference/api/model/message/interfaces/Message.md)

The message that could be disposed of

#### Returns

[`MessageId`](/reference/api/model/aliases/type-aliases/MessageId.md)

#### Overrides

[`Collector`](/reference/structures/Collector/classes/Collector.md).[`dispose`](/reference/structures/Collector/classes/Collector.md#dispose)

***

### emit()

> **emit**(`eventName`, ...`args`): `boolean`

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

#### Parameters

• **eventName**: `string` \| `symbol`

• ...**args**: `any`[]

#### Returns

`boolean`

#### Since

v0.1.26

#### Inherited from

[`Collector`](/reference/structures/Collector/classes/Collector.md).[`emit`](/reference/structures/Collector/classes/Collector.md#emit)

***

### eventNames()

> **eventNames**(): (`string` \| `symbol`)[]

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

#### Returns

(`string` \| `symbol`)[]

#### Since

v6.0.0

#### Inherited from

[`Collector`](/reference/structures/Collector/classes/Collector.md).[`eventNames`](/reference/structures/Collector/classes/Collector.md#eventnames)

***

### eventSignature()

> **eventSignature**(`event`): `string`

#### Parameters

• **event**: [`SimpleListener`](/reference/api/model/events/enumerations/SimpleListener.md)

#### Returns

`string`

***

### getMaxListeners()

> **getMaxListeners**(): `number`

Returns the current max listener value for the `EventEmitter` which is either
set by `emitter.setMaxListeners(n)` or defaults to [defaultMaxListeners](/reference/structures/MessageCollector/classes/MessageCollector.md#defaultmaxlisteners).

#### Returns

`number`

#### Since

v1.0.0

#### Inherited from

[`Collector`](/reference/structures/Collector/classes/Collector.md).[`getMaxListeners`](/reference/structures/Collector/classes/Collector.md#getmaxlisteners)

***

### handleCollect()

> **handleCollect**(...`args`): `Promise`\<`void`\>

Call this to handle an event as a collectable element. Accepts any event data as parameters.

#### Parameters

• ...**args**: `any`[]

The arguments emitted by the listener

#### Returns

`Promise`\<`void`\>

#### Emits

Collector#collect

#### Inherited from

[`Collector`](/reference/structures/Collector/classes/Collector.md).[`handleCollect`](/reference/structures/Collector/classes/Collector.md#handlecollect)

***

### handleDispose()

> **handleDispose**(...`args`): `Promise`\<`void`\>

Call this to remove an element from the collection. Accepts any event data as parameters.

#### Parameters

• ...**args**: `any`[]

The arguments emitted by the listener

#### Returns

`Promise`\<`void`\>

#### Emits

Collector#dispose

#### Inherited from

[`Collector`](/reference/structures/Collector/classes/Collector.md).[`handleDispose`](/reference/structures/Collector/classes/Collector.md#handledispose)

***

### listenerCount()

> **listenerCount**(`eventName`): `number`

Returns the number of listeners listening to the event named `eventName`.

#### Parameters

• **eventName**: `string` \| `symbol`

The name of the event being listened for

#### Returns

`number`

#### Since

v3.2.0

#### Inherited from

[`Collector`](/reference/structures/Collector/classes/Collector.md).[`listenerCount`](/reference/structures/Collector/classes/Collector.md#listenercount)

***

### listeners()

> **listeners**(`eventName`): `Function`[]

Returns a copy of the array of listeners for the event named `eventName`.

```js
server.on('connection', (stream) => {
  console.log('someone connected!');
});
console.log(util.inspect(server.listeners('connection')));
// Prints: [ [Function] ]
```

#### Parameters

• **eventName**: `string` \| `symbol`

#### Returns

`Function`[]

#### Since

v0.1.26

#### Inherited from

[`Collector`](/reference/structures/Collector/classes/Collector.md).[`listeners`](/reference/structures/Collector/classes/Collector.md#listeners)

***

### off()

> **off**(`eventName`, `listener`): `this`

Alias for `emitter.removeListener()`.

#### Parameters

• **eventName**: `string` \| `symbol`

• **listener**

#### Returns

`this`

#### Since

v10.0.0

#### Inherited from

[`Collector`](/reference/structures/Collector/classes/Collector.md).[`off`](/reference/structures/Collector/classes/Collector.md#off)

***

### on()

> **on**(`eventName`, `listener`): `this`

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

#### Parameters

• **eventName**: `string` \| `symbol`

The name of the event.

• **listener**

The callback function

#### Returns

`this`

#### Since

v0.1.101

#### Inherited from

[`Collector`](/reference/structures/Collector/classes/Collector.md).[`on`](/reference/structures/Collector/classes/Collector.md#on)

***

### once()

> **once**(`eventName`, `listener`): `this`

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

#### Parameters

• **eventName**: `string` \| `symbol`

The name of the event.

• **listener**

The callback function

#### Returns

`this`

#### Since

v0.3.0

#### Inherited from

[`Collector`](/reference/structures/Collector/classes/Collector.md).[`once`](/reference/structures/Collector/classes/Collector.md#once)

***

### prependListener()

> **prependListener**(`eventName`, `listener`): `this`

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

#### Parameters

• **eventName**: `string` \| `symbol`

The name of the event.

• **listener**

The callback function

#### Returns

`this`

#### Since

v6.0.0

#### Inherited from

[`Collector`](/reference/structures/Collector/classes/Collector.md).[`prependListener`](/reference/structures/Collector/classes/Collector.md#prependlistener)

***

### prependOnceListener()

> **prependOnceListener**(`eventName`, `listener`): `this`

Adds a **one-time**`listener` function for the event named `eventName` to the _beginning_ of the listeners array. The next time `eventName` is triggered, this
listener is removed, and then invoked.

```js
server.prependOnceListener('connection', (stream) => {
  console.log('Ah, we have our first user!');
});
```

Returns a reference to the `EventEmitter`, so that calls can be chained.

#### Parameters

• **eventName**: `string` \| `symbol`

The name of the event.

• **listener**

The callback function

#### Returns

`this`

#### Since

v6.0.0

#### Inherited from

[`Collector`](/reference/structures/Collector/classes/Collector.md).[`prependOnceListener`](/reference/structures/Collector/classes/Collector.md#prependoncelistener)

***

### rawListeners()

> **rawListeners**(`eventName`): `Function`[]

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

#### Parameters

• **eventName**: `string` \| `symbol`

#### Returns

`Function`[]

#### Since

v9.4.0

#### Inherited from

[`Collector`](/reference/structures/Collector/classes/Collector.md).[`rawListeners`](/reference/structures/Collector/classes/Collector.md#rawlisteners)

***

### removeAllListeners()

> **removeAllListeners**(`event`?): `this`

Removes all listeners, or those of the specified `eventName`.

It is bad practice to remove listeners added elsewhere in the code,
particularly when the `EventEmitter` instance was created by some other
component or module (e.g. sockets or file streams).

Returns a reference to the `EventEmitter`, so that calls can be chained.

#### Parameters

• **event?**: `string` \| `symbol`

#### Returns

`this`

#### Since

v0.1.26

#### Inherited from

[`Collector`](/reference/structures/Collector/classes/Collector.md).[`removeAllListeners`](/reference/structures/Collector/classes/Collector.md#removealllisteners)

***

### removeListener()

> **removeListener**(`eventName`, `listener`): `this`

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

#### Parameters

• **eventName**: `string` \| `symbol`

• **listener**

#### Returns

`this`

#### Since

v0.1.26

#### Inherited from

[`Collector`](/reference/structures/Collector/classes/Collector.md).[`removeListener`](/reference/structures/Collector/classes/Collector.md#removelistener)

***

### resetTimer()

> **resetTimer**(`options`?): `void`

Resets the collectors timeout and idle timer.

#### Parameters

• **options?** = `...`

Options

• **options.idle?**: `any`

How long to stop the collector after inactivity in milliseconds

• **options.time?**: `any`

How long to run the collector for in milliseconds

#### Returns

`void`

#### Inherited from

[`Collector`](/reference/structures/Collector/classes/Collector.md).[`resetTimer`](/reference/structures/Collector/classes/Collector.md#resettimer)

***

### setImmediate()

> **setImmediate**(`fn`, ...`args`): `Immediate`

Sets an immediate that will be automatically cancelled if the client is destroyed.

#### Parameters

• **fn**

Function to execute

• ...**args**: `any`[]

Arguments for the function

#### Returns

`Immediate`

#### Inherited from

[`Collector`](/reference/structures/Collector/classes/Collector.md).[`setImmediate`](/reference/structures/Collector/classes/Collector.md#setimmediate)

***

### setInterval()

> **setInterval**(`fn`, `delay`, ...`args`): `Timeout`

Sets an interval that will be automatically cancelled if the client is destroyed.

#### Parameters

• **fn**

Function to execute

• **delay**: `number`

Time to wait between executions (in milliseconds)

• ...**args**: `any`[]

Arguments for the function

#### Returns

`Timeout`

#### Inherited from

[`Collector`](/reference/structures/Collector/classes/Collector.md).[`setInterval`](/reference/structures/Collector/classes/Collector.md#setinterval)

***

### setMaxListeners()

> **setMaxListeners**(`n`): `this`

By default `EventEmitter`s will print a warning if more than `10` listeners are
added for a particular event. This is a useful default that helps finding
memory leaks. The `emitter.setMaxListeners()` method allows the limit to be
modified for this specific `EventEmitter` instance. The value can be set to`Infinity` (or `0`) to indicate an unlimited number of listeners.

Returns a reference to the `EventEmitter`, so that calls can be chained.

#### Parameters

• **n**: `number`

#### Returns

`this`

#### Since

v0.3.5

#### Inherited from

[`Collector`](/reference/structures/Collector/classes/Collector.md).[`setMaxListeners`](/reference/structures/Collector/classes/Collector.md#setmaxlisteners)

***

### setTimeout()

> **setTimeout**(`fn`, `delay`, ...`args`): `Timeout`

Sets a timeout that will be automatically cancelled if the client is destroyed.

#### Parameters

• **fn**

Function to execute

• **delay**: `number`

Time to wait before executing (in milliseconds)

• ...**args**: `any`[]

Arguments for the function

#### Returns

`Timeout`

#### Inherited from

[`Collector`](/reference/structures/Collector/classes/Collector.md).[`setTimeout`](/reference/structures/Collector/classes/Collector.md#settimeout)

***

### stop()

> **stop**(`reason`?): `void`

Stops this collector and emits the `end` event.

#### Parameters

• **reason?**: `string` = `'user'`

The reason this collector is ending

#### Returns

`void`

#### Emits

Collector#end

#### Inherited from

[`Collector`](/reference/structures/Collector/classes/Collector.md).[`stop`](/reference/structures/Collector/classes/Collector.md#stop)

***

### wrapHandler()

> **wrapHandler**(`handler`): (`__namedParameters`) => `any`

#### Parameters

• **handler**

#### Returns

`Function`

##### Parameters

• **\_\_namedParameters**

• **\_\_namedParameters.data**: `any`

##### Returns

`any`

***

### getEventListeners()

> `static` **getEventListeners**(`emitter`, `name`): `Function`[]

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

#### Parameters

• **emitter**: `EventEmitter` \| `DOMEventTarget`

• **name**: `string` \| `symbol`

#### Returns

`Function`[]

#### Since

v15.2.0, v14.17.0

#### Inherited from

[`Collector`](/reference/structures/Collector/classes/Collector.md).[`getEventListeners`](/reference/structures/Collector/classes/Collector.md#geteventlisteners)

***

### ~~listenerCount()~~

> `static` **listenerCount**(`emitter`, `eventName`): `number`

A class method that returns the number of listeners for the given `eventName`registered on the given `emitter`.

```js
const { EventEmitter, listenerCount } = require('events');
const myEmitter = new EventEmitter();
myEmitter.on('event', () => {});
myEmitter.on('event', () => {});
console.log(listenerCount(myEmitter, 'event'));
// Prints: 2
```

#### Parameters

• **emitter**: `EventEmitter`

The emitter to query

• **eventName**: `string` \| `symbol`

The event name

#### Returns

`number`

#### Since

v0.9.12

#### Deprecated

Since v3.2.0 - Use `listenerCount` instead.

#### Inherited from

[`Collector`](/reference/structures/Collector/classes/Collector.md).[`listenerCount`](/reference/structures/Collector/classes/Collector.md#listenercount-1)

***

### on()

> `static` **on**(`emitter`, `eventName`, `options`?): `AsyncIterableIterator`\<`any`\>

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

#### Parameters

• **emitter**: `EventEmitter`

• **eventName**: `string`

The name of the event being listened for

• **options?**: `StaticEventEmitterOptions`

#### Returns

`AsyncIterableIterator`\<`any`\>

that iterates `eventName` events emitted by the `emitter`

#### Since

v13.6.0, v12.16.0

#### Inherited from

[`Collector`](/reference/structures/Collector/classes/Collector.md).[`on`](/reference/structures/Collector/classes/Collector.md#on-1)

***

### once()

#### once(emitter, eventName, options)

> `static` **once**(`emitter`, `eventName`, `options`?): `Promise`\<`any`[]\>

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

##### Parameters

• **emitter**: `NodeEventTarget`

• **eventName**: `string` \| `symbol`

• **options?**: `StaticEventEmitterOptions`

##### Returns

`Promise`\<`any`[]\>

##### Since

v11.13.0, v10.16.0

##### Inherited from

[`Collector`](/reference/structures/Collector/classes/Collector.md).[`once`](/reference/structures/Collector/classes/Collector.md#once-1)

#### once(emitter, eventName, options)

> `static` **once**(`emitter`, `eventName`, `options`?): `Promise`\<`any`[]\>

##### Parameters

• **emitter**: `DOMEventTarget`

• **eventName**: `string`

• **options?**: `StaticEventEmitterOptions`

##### Returns

`Promise`\<`any`[]\>

##### Inherited from

[`Collector`](/reference/structures/Collector/classes/Collector.md).[`once`](/reference/structures/Collector/classes/Collector.md#once-1)

***

### setMaxListeners()

> `static` **setMaxListeners**(`n`?, ...`eventTargets`?): `void`

```js
const {
  setMaxListeners,
  EventEmitter
} = require('events');

const target = new EventTarget();
const emitter = new EventEmitter();

setMaxListeners(5, target, emitter);
```

#### Parameters

• **n?**: `number`

A non-negative number. The maximum number of listeners per `EventTarget` event.

• ...**eventTargets?**: (`EventEmitter` \| `DOMEventTarget`)[]

#### Returns

`void`

#### Since

v15.4.0

#### Inherited from

[`Collector`](/reference/structures/Collector/classes/Collector.md).[`setMaxListeners`](/reference/structures/Collector/classes/Collector.md#setmaxlisteners-1)
