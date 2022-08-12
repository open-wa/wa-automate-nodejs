---
id: "api_model_errors.CustomError"
title: "Class: CustomError"
sidebar_label: "CustomError"
custom_edit_url: null
---

[api/model/errors](/api/modules/api_model_errors.md).CustomError

A simple custom error class that takes the first parameter as the name using the [ERROR_NAME](/api/enums/api_model_errors.ERROR_NAME.md) enum

## Hierarchy

- `Error`

  ↳ **`CustomError`**

## Constructors

### constructor

• **new CustomError**(`name`, `message?`, ...`params`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `name` | [`ERROR_NAME`](/api/enums/api_model_errors.ERROR_NAME.md) |
| `message?` | `string` |
| `...params` | `any`[] |

#### Overrides

Error.constructor

## Properties

### cause

• `Optional` **cause**: `Error`

#### Inherited from

Error.cause

___

### message

• **message**: `string`

#### Inherited from

Error.message

___

### name

• **name**: `string`

#### Inherited from

Error.name

___

### stack

• `Optional` **stack**: `string`

#### Inherited from

Error.stack

___

### prepareStackTrace

▪ `Static` `Optional` **prepareStackTrace**: (`err`: `Error`, `stackTraces`: `CallSite`[]) => `any`

#### Type declaration

▸ (`err`, `stackTraces`): `any`

Optional override for formatting stack traces

**`See`**

https://v8.dev/docs/stack-trace-api#customizing-stack-traces

##### Parameters

| Name | Type |
| :------ | :------ |
| `err` | `Error` |
| `stackTraces` | `CallSite`[] |

##### Returns

`any`

#### Inherited from

Error.prepareStackTrace

___

### stackTraceLimit

▪ `Static` **stackTraceLimit**: `number`

#### Inherited from

Error.stackTraceLimit

## Methods

### captureStackTrace

▸ `Static` **captureStackTrace**(`targetObject`, `constructorOpt?`): `void`

Create .stack property on a target object

#### Parameters

| Name | Type |
| :------ | :------ |
| `targetObject` | `object` |
| `constructorOpt?` | `Function` |

#### Returns

`void`

#### Inherited from

Error.captureStackTrace
