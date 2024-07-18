# Type Alias: ConfigLogTransport

> **ConfigLogTransport**: `object`

## Type declaration

### done?

> `readonly` `optional` **done**: `boolean`

If the transport has already been added to the logger. The logging set up command handles this for you.

### options?

> `optional` **options**: `any`

The options for the transport. Generally only required for syslog but you can use this to override default options for other types of transports.

### type

> **type**: `"syslog"` \| `"console"` \| `"file"` \| `"ev"`

The type of winston transport. At the moment only `file`, `console`, `ev` and `syslog` are supported.
