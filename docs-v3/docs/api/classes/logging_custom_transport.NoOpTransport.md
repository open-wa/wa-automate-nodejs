---
id: "logging_custom_transport.NoOpTransport"
title: "Class: NoOpTransport"
sidebar_label: "NoOpTransport"
custom_edit_url: null
---

[logging/custom_transport](/api/modules/logging_custom_transport.md).NoOpTransport

## Hierarchy

- `TransportStream`

  ↳ **`NoOpTransport`**

## Constructors

### constructor

• **new NoOpTransport**(`opts?`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `opts?` | `any` |

#### Overrides

TransportStream.constructor

## Properties

### destroyed

• **destroyed**: `boolean`

Is `true` after `writable.destroy()` has been called.

**`Since`**

v8.0.0

#### Inherited from

TransportStream.destroyed

___

### format

• `Optional` **format**: `Format`

#### Inherited from

TransportStream.format

___

### handleExceptions

• `Optional` **handleExceptions**: `boolean`

#### Inherited from

TransportStream.handleExceptions

___

### handleRejections

• `Optional` **handleRejections**: `boolean`

#### Inherited from

TransportStream.handleRejections

___

### level

• `Optional` **level**: `string`

#### Inherited from

TransportStream.level

___

### silent

• `Optional` **silent**: `boolean`

#### Inherited from

TransportStream.silent

___

### writable

• `Readonly` **writable**: `boolean`

Is `true` if it is safe to call `writable.write()`, which means
the stream has not been destroyed, errored or ended.

**`Since`**

v11.4.0

#### Inherited from

TransportStream.writable

___

### writableCorked

• `Readonly` **writableCorked**: `number`

Number of times `writable.uncork()` needs to be
called in order to fully uncork the stream.

**`Since`**

v13.2.0, v12.16.0

#### Inherited from

TransportStream.writableCorked

___

### writableEnded

• `Readonly` **writableEnded**: `boolean`

Is `true` after `writable.end()` has been called. This property
does not indicate whether the data has been flushed, for this use `writable.writableFinished` instead.

**`Since`**

v12.9.0

#### Inherited from

TransportStream.writableEnded

___

### writableFinished

• `Readonly` **writableFinished**: `boolean`

Is set to `true` immediately before the `'finish'` event is emitted.

**`Since`**

v12.6.0

#### Inherited from

TransportStream.writableFinished

___

### writableHighWaterMark

• `Readonly` **writableHighWaterMark**: `number`

Return the value of `highWaterMark` passed when creating this `Writable`.

**`Since`**

v9.3.0

#### Inherited from

TransportStream.writableHighWaterMark

___

### writableLength

• `Readonly` **writableLength**: `number`

This property contains the number of bytes (or objects) in the queue
ready to be written. The value provides introspection data regarding
the status of the `highWaterMark`.

**`Since`**

v9.4.0

#### Inherited from

TransportStream.writableLength

___

### writableObjectMode

• `Readonly` **writableObjectMode**: `boolean`

Getter for the property `objectMode` of a given `Writable` stream.

**`Since`**

v12.3.0

#### Inherited from

TransportStream.writableObjectMode

___

### captureRejectionSymbol

▪ `Static` `Readonly` **captureRejectionSymbol**: typeof [`captureRejectionSymbol`](/api/classes/structures_Collector.Collector.md#capturerejectionsymbol-36)

#### Inherited from

TransportStream.captureRejectionSymbol

___

### captureRejections

▪ `Static` **captureRejections**: `boolean`

Sets or gets the default captureRejection value for all emitters.

#### Inherited from

TransportStream.captureRejections

___

### defaultMaxListeners

▪ `Static` **defaultMaxListeners**: `number`

#### Inherited from

TransportStream.defaultMaxListeners

___

### errorMonitor

▪ `Static` `Readonly` **errorMonitor**: typeof [`errorMonitor`](/api/classes/structures_Collector.Collector.md#errormonitor-36)

This symbol shall be used to install a listener for only monitoring `'error'`
events. Listeners installed using this symbol are called before the regular
`'error'` listeners are called.

Installing a listener using this symbol does not change the behavior once an
`'error'` event is emitted, therefore the process will still crash if no
regular `'error'` listener is installed.

#### Inherited from

TransportStream.errorMonitor

## Methods

### \_construct

▸ `Optional` **_construct**(`callback`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `callback` | (`error?`: `Error`) => `void` |

#### Returns

`void`

#### Inherited from

TransportStream.\_construct

___

### \_destroy

▸ **_destroy**(`error`, `callback`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `error` | `Error` |
| `callback` | (`error?`: `Error`) => `void` |

#### Returns

`void`

#### Inherited from

TransportStream.\_destroy

___

### \_final

▸ **_final**(`callback`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `callback` | (`error?`: `Error`) => `void` |

#### Returns

`void`

#### Inherited from

TransportStream.\_final

___

### \_write

▸ **_write**(`chunk`, `encoding`, `callback`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `chunk` | `any` |
| `encoding` | `BufferEncoding` |
| `callback` | (`error?`: `Error`) => `void` |

#### Returns

`void`

#### Inherited from

TransportStream.\_write

___

### \_writev

▸ `Optional` **_writev**(`chunks`, `callback`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `chunks` | { `chunk`: `any` ; `encoding`: `BufferEncoding`  }[] |
| `callback` | (`error?`: `Error`) => `void` |

#### Returns

`void`

#### Inherited from

TransportStream.\_writev

___

### addListener

▸ **addListener**(`event`, `listener`): [`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

Event emitter
The defined events on documents including:
1. close
2. drain
3. error
4. finish
5. pipe
6. unpipe

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"close"`` |
| `listener` | () => `void` |

#### Returns

[`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Inherited from

TransportStream.addListener

▸ **addListener**(`event`, `listener`): [`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"drain"`` |
| `listener` | () => `void` |

#### Returns

[`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Inherited from

TransportStream.addListener

▸ **addListener**(`event`, `listener`): [`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"error"`` |
| `listener` | (`err`: `Error`) => `void` |

#### Returns

[`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Inherited from

TransportStream.addListener

▸ **addListener**(`event`, `listener`): [`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"finish"`` |
| `listener` | () => `void` |

#### Returns

[`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Inherited from

TransportStream.addListener

▸ **addListener**(`event`, `listener`): [`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"pipe"`` |
| `listener` | (`src`: `Readable`) => `void` |

#### Returns

[`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Inherited from

TransportStream.addListener

▸ **addListener**(`event`, `listener`): [`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"unpipe"`` |
| `listener` | (`src`: `Readable`) => `void` |

#### Returns

[`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Inherited from

TransportStream.addListener

▸ **addListener**(`event`, `listener`): [`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `string` \| `symbol` |
| `listener` | (...`args`: `any`[]) => `void` |

#### Returns

[`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Inherited from

TransportStream.addListener

___

### close

▸ `Optional` **close**(): `void`

#### Returns

`void`

#### Inherited from

TransportStream.close

___

### cork

▸ **cork**(): `void`

The `writable.cork()` method forces all written data to be buffered in memory.
The buffered data will be flushed when either the [uncork](/api/classes/logging_custom_transport.NoOpTransport.md#uncork-36) or [end](/api/classes/logging_custom_transport.NoOpTransport.md#end-36) methods are called.

The primary intent of `writable.cork()` is to accommodate a situation in which
several small chunks are written to the stream in rapid succession. Instead of
immediately forwarding them to the underlying destination, `writable.cork()`buffers all the chunks until `writable.uncork()` is called, which will pass them
all to `writable._writev()`, if present. This prevents a head-of-line blocking
situation where data is being buffered while waiting for the first small chunk
to be processed. However, use of `writable.cork()` without implementing`writable._writev()` may have an adverse effect on throughput.

See also: `writable.uncork()`, `writable._writev()`.

**`Since`**

v0.11.2

#### Returns

`void`

#### Inherited from

TransportStream.cork

___

### destroy

▸ **destroy**(`error?`): [`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

Destroy the stream. Optionally emit an `'error'` event, and emit a `'close'`event (unless `emitClose` is set to `false`). After this call, the writable
stream has ended and subsequent calls to `write()` or `end()` will result in
an `ERR_STREAM_DESTROYED` error.
This is a destructive and immediate way to destroy a stream. Previous calls to`write()` may not have drained, and may trigger an `ERR_STREAM_DESTROYED` error.
Use `end()` instead of destroy if data should flush before close, or wait for
the `'drain'` event before destroying the stream.

Once `destroy()` has been called any further calls will be a no-op and no
further errors except from `_destroy()` may be emitted as `'error'`.

Implementors should not override this method,
but instead implement `writable._destroy()`.

**`Since`**

v8.0.0

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `error?` | `Error` | Optional, an error to emit with `'error'` event. |

#### Returns

[`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Inherited from

TransportStream.destroy

___

### emit

▸ **emit**(`event`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"close"`` |

#### Returns

`boolean`

#### Inherited from

TransportStream.emit

▸ **emit**(`event`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"drain"`` |

#### Returns

`boolean`

#### Inherited from

TransportStream.emit

▸ **emit**(`event`, `err`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"error"`` |
| `err` | `Error` |

#### Returns

`boolean`

#### Inherited from

TransportStream.emit

▸ **emit**(`event`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"finish"`` |

#### Returns

`boolean`

#### Inherited from

TransportStream.emit

▸ **emit**(`event`, `src`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"pipe"`` |
| `src` | `Readable` |

#### Returns

`boolean`

#### Inherited from

TransportStream.emit

▸ **emit**(`event`, `src`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"unpipe"`` |
| `src` | `Readable` |

#### Returns

`boolean`

#### Inherited from

TransportStream.emit

▸ **emit**(`event`, ...`args`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `string` \| `symbol` |
| `...args` | `any`[] |

#### Returns

`boolean`

#### Inherited from

TransportStream.emit

___

### end

▸ **end**(`cb?`): [`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

Calling the `writable.end()` method signals that no more data will be written
to the `Writable`. The optional `chunk` and `encoding` arguments allow one
final additional chunk of data to be written immediately before closing the
stream.

Calling the [write](/api/classes/logging_custom_transport.NoOpTransport.md#write-36) method after calling [end](/api/classes/logging_custom_transport.NoOpTransport.md#end-36) will raise an error.

```js
// Write 'hello, ' and then end with 'world!'.
const fs = require('fs');
const file = fs.createWriteStream('example.txt');
file.write('hello, ');
file.end('world!');
// Writing more now is not allowed!
```

**`Since`**

v0.9.4

#### Parameters

| Name | Type |
| :------ | :------ |
| `cb?` | () => `void` |

#### Returns

[`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Inherited from

TransportStream.end

▸ **end**(`chunk`, `cb?`): [`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `chunk` | `any` |
| `cb?` | () => `void` |

#### Returns

[`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Inherited from

TransportStream.end

▸ **end**(`chunk`, `encoding`, `cb?`): [`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `chunk` | `any` |
| `encoding` | `BufferEncoding` |
| `cb?` | () => `void` |

#### Returns

[`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Inherited from

TransportStream.end

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

TransportStream.eventNames

___

### getMaxListeners

▸ **getMaxListeners**(): `number`

Returns the current max listener value for the `EventEmitter` which is either
set by `emitter.setMaxListeners(n)` or defaults to [defaultMaxListeners](/api/classes/logging_custom_transport.NoOpTransport.md#defaultmaxlisteners-36).

**`Since`**

v1.0.0

#### Returns

`number`

#### Inherited from

TransportStream.getMaxListeners

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

TransportStream.listenerCount

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

TransportStream.listeners

___

### log

▸ **log**(`info`, `callback`): `any`

#### Parameters

| Name | Type |
| :------ | :------ |
| `info` | `any` |
| `callback` | `any` |

#### Returns

`any`

#### Overrides

TransportStream.log

___

### logv

▸ `Optional` **logv**(`info`, `next`): `any`

#### Parameters

| Name | Type |
| :------ | :------ |
| `info` | `any` |
| `next` | () => `void` |

#### Returns

`any`

#### Inherited from

TransportStream.logv

___

### off

▸ **off**(`eventName`, `listener`): [`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

Alias for `emitter.removeListener()`.

**`Since`**

v10.0.0

#### Parameters

| Name | Type |
| :------ | :------ |
| `eventName` | `string` \| `symbol` |
| `listener` | (...`args`: `any`[]) => `void` |

#### Returns

[`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Inherited from

TransportStream.off

___

### on

▸ **on**(`event`, `listener`): [`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"close"`` |
| `listener` | () => `void` |

#### Returns

[`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Inherited from

TransportStream.on

▸ **on**(`event`, `listener`): [`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"drain"`` |
| `listener` | () => `void` |

#### Returns

[`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Inherited from

TransportStream.on

▸ **on**(`event`, `listener`): [`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"error"`` |
| `listener` | (`err`: `Error`) => `void` |

#### Returns

[`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Inherited from

TransportStream.on

▸ **on**(`event`, `listener`): [`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"finish"`` |
| `listener` | () => `void` |

#### Returns

[`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Inherited from

TransportStream.on

▸ **on**(`event`, `listener`): [`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"pipe"`` |
| `listener` | (`src`: `Readable`) => `void` |

#### Returns

[`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Inherited from

TransportStream.on

▸ **on**(`event`, `listener`): [`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"unpipe"`` |
| `listener` | (`src`: `Readable`) => `void` |

#### Returns

[`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Inherited from

TransportStream.on

▸ **on**(`event`, `listener`): [`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `string` \| `symbol` |
| `listener` | (...`args`: `any`[]) => `void` |

#### Returns

[`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Inherited from

TransportStream.on

___

### once

▸ **once**(`event`, `listener`): [`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"close"`` |
| `listener` | () => `void` |

#### Returns

[`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Inherited from

TransportStream.once

▸ **once**(`event`, `listener`): [`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"drain"`` |
| `listener` | () => `void` |

#### Returns

[`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Inherited from

TransportStream.once

▸ **once**(`event`, `listener`): [`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"error"`` |
| `listener` | (`err`: `Error`) => `void` |

#### Returns

[`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Inherited from

TransportStream.once

▸ **once**(`event`, `listener`): [`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"finish"`` |
| `listener` | () => `void` |

#### Returns

[`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Inherited from

TransportStream.once

▸ **once**(`event`, `listener`): [`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"pipe"`` |
| `listener` | (`src`: `Readable`) => `void` |

#### Returns

[`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Inherited from

TransportStream.once

▸ **once**(`event`, `listener`): [`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"unpipe"`` |
| `listener` | (`src`: `Readable`) => `void` |

#### Returns

[`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Inherited from

TransportStream.once

▸ **once**(`event`, `listener`): [`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `string` \| `symbol` |
| `listener` | (...`args`: `any`[]) => `void` |

#### Returns

[`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Inherited from

TransportStream.once

___

### pipe

▸ **pipe**<`T`\>(`destination`, `options?`): `T`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `WritableStream`<`T`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `destination` | `T` |
| `options?` | `Object` |
| `options.end?` | `boolean` |

#### Returns

`T`

#### Inherited from

TransportStream.pipe

___

### prependListener

▸ **prependListener**(`event`, `listener`): [`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"close"`` |
| `listener` | () => `void` |

#### Returns

[`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Inherited from

TransportStream.prependListener

▸ **prependListener**(`event`, `listener`): [`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"drain"`` |
| `listener` | () => `void` |

#### Returns

[`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Inherited from

TransportStream.prependListener

▸ **prependListener**(`event`, `listener`): [`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"error"`` |
| `listener` | (`err`: `Error`) => `void` |

#### Returns

[`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Inherited from

TransportStream.prependListener

▸ **prependListener**(`event`, `listener`): [`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"finish"`` |
| `listener` | () => `void` |

#### Returns

[`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Inherited from

TransportStream.prependListener

▸ **prependListener**(`event`, `listener`): [`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"pipe"`` |
| `listener` | (`src`: `Readable`) => `void` |

#### Returns

[`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Inherited from

TransportStream.prependListener

▸ **prependListener**(`event`, `listener`): [`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"unpipe"`` |
| `listener` | (`src`: `Readable`) => `void` |

#### Returns

[`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Inherited from

TransportStream.prependListener

▸ **prependListener**(`event`, `listener`): [`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `string` \| `symbol` |
| `listener` | (...`args`: `any`[]) => `void` |

#### Returns

[`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Inherited from

TransportStream.prependListener

___

### prependOnceListener

▸ **prependOnceListener**(`event`, `listener`): [`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"close"`` |
| `listener` | () => `void` |

#### Returns

[`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Inherited from

TransportStream.prependOnceListener

▸ **prependOnceListener**(`event`, `listener`): [`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"drain"`` |
| `listener` | () => `void` |

#### Returns

[`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Inherited from

TransportStream.prependOnceListener

▸ **prependOnceListener**(`event`, `listener`): [`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"error"`` |
| `listener` | (`err`: `Error`) => `void` |

#### Returns

[`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Inherited from

TransportStream.prependOnceListener

▸ **prependOnceListener**(`event`, `listener`): [`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"finish"`` |
| `listener` | () => `void` |

#### Returns

[`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Inherited from

TransportStream.prependOnceListener

▸ **prependOnceListener**(`event`, `listener`): [`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"pipe"`` |
| `listener` | (`src`: `Readable`) => `void` |

#### Returns

[`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Inherited from

TransportStream.prependOnceListener

▸ **prependOnceListener**(`event`, `listener`): [`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"unpipe"`` |
| `listener` | (`src`: `Readable`) => `void` |

#### Returns

[`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Inherited from

TransportStream.prependOnceListener

▸ **prependOnceListener**(`event`, `listener`): [`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `string` \| `symbol` |
| `listener` | (...`args`: `any`[]) => `void` |

#### Returns

[`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Inherited from

TransportStream.prependOnceListener

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

TransportStream.rawListeners

___

### removeAllListeners

▸ **removeAllListeners**(`event?`): [`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

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

[`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Inherited from

TransportStream.removeAllListeners

___

### removeListener

▸ **removeListener**(`event`, `listener`): [`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"close"`` |
| `listener` | () => `void` |

#### Returns

[`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Inherited from

TransportStream.removeListener

▸ **removeListener**(`event`, `listener`): [`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"drain"`` |
| `listener` | () => `void` |

#### Returns

[`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Inherited from

TransportStream.removeListener

▸ **removeListener**(`event`, `listener`): [`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"error"`` |
| `listener` | (`err`: `Error`) => `void` |

#### Returns

[`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Inherited from

TransportStream.removeListener

▸ **removeListener**(`event`, `listener`): [`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"finish"`` |
| `listener` | () => `void` |

#### Returns

[`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Inherited from

TransportStream.removeListener

▸ **removeListener**(`event`, `listener`): [`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"pipe"`` |
| `listener` | (`src`: `Readable`) => `void` |

#### Returns

[`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Inherited from

TransportStream.removeListener

▸ **removeListener**(`event`, `listener`): [`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"unpipe"`` |
| `listener` | (`src`: `Readable`) => `void` |

#### Returns

[`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Inherited from

TransportStream.removeListener

▸ **removeListener**(`event`, `listener`): [`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `string` \| `symbol` |
| `listener` | (...`args`: `any`[]) => `void` |

#### Returns

[`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Inherited from

TransportStream.removeListener

___

### setDefaultEncoding

▸ **setDefaultEncoding**(`encoding`): [`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

The `writable.setDefaultEncoding()` method sets the default `encoding` for a `Writable` stream.

**`Since`**

v0.11.15

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `encoding` | `BufferEncoding` | The new default encoding |

#### Returns

[`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Inherited from

TransportStream.setDefaultEncoding

___

### setMaxListeners

▸ **setMaxListeners**(`n`): [`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

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

[`NoOpTransport`](/api/classes/logging_custom_transport.NoOpTransport.md)

#### Inherited from

TransportStream.setMaxListeners

___

### uncork

▸ **uncork**(): `void`

The `writable.uncork()` method flushes all data buffered since [cork](/api/classes/logging_custom_transport.NoOpTransport.md#cork-36) was called.

When using `writable.cork()` and `writable.uncork()` to manage the buffering
of writes to a stream, it is recommended that calls to `writable.uncork()` be
deferred using `process.nextTick()`. Doing so allows batching of all`writable.write()` calls that occur within a given Node.js event loop phase.

```js
stream.cork();
stream.write('some ');
stream.write('data ');
process.nextTick(() => stream.uncork());
```

If the `writable.cork()` method is called multiple times on a stream, the
same number of calls to `writable.uncork()` must be called to flush the buffered
data.

```js
stream.cork();
stream.write('some ');
stream.cork();
stream.write('data ');
process.nextTick(() => {
  stream.uncork();
  // The data will not be flushed until uncork() is called a second time.
  stream.uncork();
});
```

See also: `writable.cork()`.

**`Since`**

v0.11.2

#### Returns

`void`

#### Inherited from

TransportStream.uncork

___

### write

▸ **write**(`chunk`, `callback?`): `boolean`

The `writable.write()` method writes some data to the stream, and calls the
supplied `callback` once the data has been fully handled. If an error
occurs, the `callback` will be called with the error as its
first argument. The `callback` is called asynchronously and before `'error'` is
emitted.

The return value is `true` if the internal buffer is less than the`highWaterMark` configured when the stream was created after admitting `chunk`.
If `false` is returned, further attempts to write data to the stream should
stop until the `'drain'` event is emitted.

While a stream is not draining, calls to `write()` will buffer `chunk`, and
return false. Once all currently buffered chunks are drained (accepted for
delivery by the operating system), the `'drain'` event will be emitted.
It is recommended that once `write()` returns false, no more chunks be written
until the `'drain'` event is emitted. While calling `write()` on a stream that
is not draining is allowed, Node.js will buffer all written chunks until
maximum memory usage occurs, at which point it will abort unconditionally.
Even before it aborts, high memory usage will cause poor garbage collector
performance and high RSS (which is not typically released back to the system,
even after the memory is no longer required). Since TCP sockets may never
drain if the remote peer does not read the data, writing a socket that is
not draining may lead to a remotely exploitable vulnerability.

Writing data while the stream is not draining is particularly
problematic for a `Transform`, because the `Transform` streams are paused
by default until they are piped or a `'data'` or `'readable'` event handler
is added.

If the data to be written can be generated or fetched on demand, it is
recommended to encapsulate the logic into a `Readable` and use [pipe](/api/classes/logging_custom_transport.NoOpTransport.md#pipe-36). However, if calling `write()` is preferred, it is
possible to respect backpressure and avoid memory issues using the `'drain'` event:

```js
function write(data, cb) {
  if (!stream.write(data)) {
    stream.once('drain', cb);
  } else {
    process.nextTick(cb);
  }
}

// Wait for cb to be called before doing any other write.
write('hello', () => {
  console.log('Write completed, do more writes now.');
});
```

A `Writable` stream in object mode will always ignore the `encoding` argument.

**`Since`**

v0.9.4

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `chunk` | `any` | Optional data to write. For streams not operating in object mode, `chunk` must be a string, `Buffer` or `Uint8Array`. For object mode streams, `chunk` may be any JavaScript value other than `null`. |
| `callback?` | (`error`: `Error`) => `void` | Callback for when this chunk of data is flushed. |

#### Returns

`boolean`

`false` if the stream wishes for the calling code to wait for the `'drain'` event to be emitted before continuing to write additional data; otherwise `true`.

#### Inherited from

TransportStream.write

▸ **write**(`chunk`, `encoding`, `callback?`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `chunk` | `any` |
| `encoding` | `BufferEncoding` |
| `callback?` | (`error`: `Error`) => `void` |

#### Returns

`boolean`

#### Inherited from

TransportStream.write

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

TransportStream.getEventListeners

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

TransportStream.listenerCount

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

TransportStream.on

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

TransportStream.once

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

TransportStream.once

___

### setMaxListeners

▸ `Static` **setMaxListeners**(`n?`, ...`eventTargets`): `void`

By default `EventEmitter`s will print a warning if more than `10` listeners are
added for a particular event. This is a useful default that helps finding
memory leaks. The `EventEmitter.setMaxListeners()` method allows the default limit to be
modified (if eventTargets is empty) or modify the limit specified in every `EventTarget` | `EventEmitter` passed as arguments.
The value can be set to`Infinity` (or `0`) to indicate an unlimited number of listeners.

```js
EventEmitter.setMaxListeners(20);
// Equivalent to
EventEmitter.defaultMaxListeners = 20;

const eventTarget = new EventTarget();
// Only way to increase limit for `EventTarget` instances
// as these doesn't expose its own `setMaxListeners` method
EventEmitter.setMaxListeners(20, eventTarget);
```

**`Since`**

v15.3.0, v14.17.0

#### Parameters

| Name | Type |
| :------ | :------ |
| `n?` | `number` |
| `...eventTargets` | (`EventEmitter` \| `DOMEventTarget`)[] |

#### Returns

`void`

#### Inherited from

TransportStream.setMaxListeners
