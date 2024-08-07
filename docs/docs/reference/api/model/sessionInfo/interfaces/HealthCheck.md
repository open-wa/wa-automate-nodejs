# Interface: HealthCheck

## Properties

### batteryLow?

> `optional` **batteryLow**: `boolean`

Returns `true` if "Phone battery low" message is detected

Healthy: `false`

***

### isHere?

> `optional` **isHere**: `boolean`

Returns `true` if "Use Here" button is not detected

Healthy: `true`

***

### isPhoneDisconnected?

> `optional` **isPhoneDisconnected**: `boolean`

Whether or not the "Phone is disconnected" message is showing within the web app.

Healthy: `false`

***

### online?

> `optional` **online**: `boolean`

Result of `window.navigator.onLine`

Healthy: `true`

***

### queuedMessages?

> `optional` **queuedMessages**: `number`

The number of messages queued up in the browser. Messages can start being queued up due to the web app awaiting a connection with the host device.

Healthy: 0

***

### retryingIn?

> `optional` **retryingIn**: `number`

Returns the number of seconds the "Retrying in ..." dialog is indicating. If the dialog is not showing, it will return `0`.

Healthy: `0`

***

### state?

> `optional` **state**: [`STATE`](/reference/api/model/enumerations/STATE.md)

The state of the web app.

Healthy: 'CONNECTED'

***

### tryingToReachPhone?

> `optional` **tryingToReachPhone**: `boolean`

Returns `true` if "trying to reach phone" dialog is detected

Healthy: `false`

***

### wapiInjected?

> `optional` **wapiInjected**: `boolean`

Returns `true` if the `WAPI` object is detected.

Healthy: `true`
