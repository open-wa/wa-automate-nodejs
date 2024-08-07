# Class: AddParticipantError

## Extends

- `Error`

## Constructors

### new AddParticipantError()

> **new AddParticipantError**(`message`, `data`?): [`AddParticipantError`](/reference/api/model/errors/classes/AddParticipantError.md)

#### Parameters

• **message**: `string`

• **data?**

#### Returns

[`AddParticipantError`](/reference/api/model/errors/classes/AddParticipantError.md)

#### Overrides

`Error.constructor`

## Properties

### cause?

> `optional` **cause**: `unknown`

#### Inherited from

`Error.cause`

***

### data

> **data**: `object`

#### Index Signature

 \[`contactId`: `string`\]: `number`

***

### message

> **message**: `string`

#### Inherited from

`Error.message`

***

### name

> **name**: `string`

#### Inherited from

`Error.name`

***

### stack?

> `optional` **stack**: `string`

#### Inherited from

`Error.stack`

***

### prepareStackTrace()?

> `static` `optional` **prepareStackTrace**: (`err`, `stackTraces`) => `any`

Optional override for formatting stack traces

#### Parameters

• **err**: `Error`

• **stackTraces**: `CallSite`[]

#### Returns

`any`

#### See

https://v8.dev/docs/stack-trace-api#customizing-stack-traces

#### Inherited from

`Error.prepareStackTrace`

***

### stackTraceLimit

> `static` **stackTraceLimit**: `number`

#### Inherited from

`Error.stackTraceLimit`

## Methods

### captureStackTrace()

> `static` **captureStackTrace**(`targetObject`, `constructorOpt`?): `void`

Create .stack property on a target object

#### Parameters

• **targetObject**: `object`

• **constructorOpt?**: `Function`

#### Returns

`void`

#### Inherited from

`Error.captureStackTrace`
