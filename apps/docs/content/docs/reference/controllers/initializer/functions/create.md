---
title: Function - create()
---

# Function: create()

> **create**(`config`): `Promise`\<[`Client`](/docs/reference/api/Client/classes/Client)\>

Used to initialize the client session.

*Note:* pass configuration as [`ConfigObject`](/docs/reference/api/model/config/interfaces/ConfigObject). That includes `sessionId`; passing the session id as a separate first argument is no longer the supported shape.

e.g

```javascript
create({
sessionId: 'main',
customUserAgent: ' 'WhatsApp/2.16.352 Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Safari/605.1.15',
blockCrashLogs true,
...
})....
```

## Parameters

• **config**: [`ConfigObject`](/docs/reference/api/model/config/interfaces/ConfigObject) \| [`AdvancedConfig`](/docs/reference/api/model/config/type-aliases/AdvancedConfig) = `{}`

AdvancedConfig The extended custom configuration

## Returns

`Promise`\<[`Client`](/docs/reference/api/Client/classes/Client)\>
