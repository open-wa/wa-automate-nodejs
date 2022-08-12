---
id: "api_model_sessionInfo.HealthCheck"
title: "Interface: HealthCheck"
sidebar_label: "HealthCheck"
custom_edit_url: null
---

[api/model/sessionInfo](/api/modules/api_model_sessionInfo.md).HealthCheck

## Properties

### batteryLow

• `Optional` **batteryLow**: `boolean`

Returns `true` if "Phone battery low" message is detected

Healthy: `false`

___

### isHere

• `Optional` **isHere**: `boolean`

Returns `true` if "Use Here" button is not detected

Healthy: `true`

___

### isPhoneDisconnected

• `Optional` **isPhoneDisconnected**: `boolean`

Whether or not the "Phone is disconnected" message is showing within the web app.

Healthy: `false`

___

### online

• `Optional` **online**: `boolean`

Result of `window.navigator.onLine`

Healthy: `true`

___

### queuedMessages

• `Optional` **queuedMessages**: `number`

The number of messages queued up in the browser. Messages can start being queued up due to the web app awaiting a connection with the host device.

Healthy: 0

___

### retryingIn

• `Optional` **retryingIn**: `number`

Returns the number of seconds the "Retrying in ..." dialog is indicating. If the dialog is not showing, it will return `0`.

Healthy: `0`

___

### state

• `Optional` **state**: [`STATE`](/api/enums/api_model.STATE.md)

The state of the web app.

Healthy: 'CONNECTED'

___

### tryingToReachPhone

• `Optional` **tryingToReachPhone**: `boolean`

Returns `true` if "trying to reach phone" dialog is detected

Healthy: `false`

___

### wapiInjected

• `Optional` **wapiInjected**: `boolean`

Returns `true` if the `WAPI` object is detected.

Healthy: `true`
