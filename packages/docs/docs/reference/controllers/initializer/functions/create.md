# Function: create()

> **create**(`config`): `Promise`\<[`Client`](/reference/api/Client/classes/Client.md)\>

Used to initialize the client session.

*Note* It is required to set all config variables as [ConfigObject](https://open-wa.github.io/wa-automate-nodejs/interfaces/configobject.html) that includes both [sessionId](https://open-wa.github.io/wa-automate-nodejs/interfaces/configobject.html#sessionId). Setting the session id as the first variable is no longer valid

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

• **config**: [`ConfigObject`](/reference/api/model/config/interfaces/ConfigObject.md) \| [`AdvancedConfig`](/reference/api/model/config/type-aliases/AdvancedConfig.md) = `{}`

AdvancedConfig The extended custom configuration

## Returns

`Promise`\<[`Client`](/reference/api/Client/classes/Client.md)\>
