---
title: Class - CustomError
---

# Class: CustomError

A simple custom error class that takes the first parameter as the name using the `ERROR_NAME` enum

## Extends

- `Error`

## Constructors

### new CustomError()

> **new CustomError**(`name`, `message`?, ...`params`?): [`CustomError`](/docs/reference/api/model/errors/classes/CustomError)

#### Parameters

• **name**: [`ERROR_NAME`](/docs/reference/api/model/errors/enumerations/ERROR_NAME)

• **message?**: `string`

• ...**params?**: `any`[]

#### Returns

[`CustomError`](/docs/reference/api/model/errors/classes/CustomError)

#### Overrides

`Error.constructor`

## Properties

### cause?

> `optional` **cause**: `unknown`

#### Inherited from

`Error.cause`

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
