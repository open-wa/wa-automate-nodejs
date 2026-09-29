# @open-wa/integration-chatwoot

`@open-wa/integration-chatwoot` bridges WhatsApp messages with a Chatwoot API inbox. The current plugin package is `5.1.0`. It initializes the Chatwoot client at `core.started`, syncs supported WhatsApp messages into Chatwoot, and exposes `createChatwootRouter` for Chatwoot webhooks.

## Quick start

Install the plugin in the open-wa application that owns the WhatsApp session, then configure it under `pluginConfig.chatwoot`:

```ts
export default {
  port: 8080,
  host: '0.0.0.0',
  apiKey: 'your-secure-key',
  plugins: ['@open-wa/integration-chatwoot'],
  pluginConfig: {
    chatwoot: {
      chatwootUrl: 'https://app.chatwoot.com/api/v1/accounts/123',
      chatwootApiAccessToken: 'your-chatwoot-user-access-token',
      apiHost: 'https://wa.example.com',
      apiKey: 'your-secure-key',
      forceUpdateCwWebhook: true,
    },
  },
};
```

`chatwootUrl` may include an existing inbox, for example `.../accounts/123/inboxes/456`. Otherwise the client finds or creates an API inbox. `apiHost` is the public origin Chatwoot can reach; the plugin adds `/plugins/chatwoot/webhook` and, when `apiKey` is present, appends it as a query value.

The callback router currently parses the webhook body but does not validate that `api_key` query value itself. Put a reverse proxy or gateway in front of the callback when it must be authenticated, and have that boundary validate the query or an equivalent header before forwarding to open-wa.

## Configuration

| Field | Required | Behavior |
| --- | --- | --- |
| `chatwootUrl` | Yes | Chatwoot origin plus account ID and optional inbox ID. |
| `chatwootApiAccessToken` | Yes | Sent as `api_access_token` on Chatwoot API requests. |
| `apiHost` | No | Public origin used to build the Chatwoot webhook URL. |
| `host`, `https`, `port` | No | Alternative callback host settings used when `apiHost` is absent. |
| `apiKey` | No | Appended to the callback URL as `api_key`; enforce it at a proxy or gateway. |
| `forceUpdateCwWebhook` | No | Defaults to `false`; when true, patches the inbox webhook URL during initialization. |

## Message behavior and limits

- Direct WhatsApp messages create or reopen contacts and conversations. Group, broadcast, and echo messages are ignored.
- Text replies from Chatwoot use `sendText`. Replies containing a URL use link preview support.
- A reply beginning with a token such as `@51.5072,-0.1276 Meeting point` becomes a WhatsApp location.
- Chatwoot attachments are sent with `sendImage`, using the Chatwoot message content as the first caption.
- Inbound image, audio, voice note, video, and document messages become Chatwoot attachments when open-wa can decrypt the media and the required media fields are present. When only `cloudUrl` is available, Chatwoot receives a file link in text.
- Contact and conversation registries are in memory. Restarting the process rebuilds them from later messages and the configured inbox state.

The integration marks outbound message IDs as ignored so a reply does not loop back as a new inbound message. It does not provide a durable message archive or guarantee attachment delivery when media decryption is unavailable.

## Callback checks

After startup, confirm the log contains `Chatwoot integration initialized`, then check the inbox webhook URL. It should be `https://wa.example.com/plugins/chatwoot/webhook?api_key=your-secure-key` when both `apiHost` and `apiKey` are set.

Use Chatwoot's profile endpoint to check the token and account before diagnosing open-wa:

```bash
curl -i \
  -H "api_access_token: $CHATWOOT_API_ACCESS_TOKEN" \
  "$CHATWOOT_ORIGIN/api/v1/profile"
```

A `200` response with an account ID confirms the token reaches Chatwoot. A `401` means the token or Chatwoot origin needs correction. Then send a direct WhatsApp message and a plain Chatwoot reply, checking the open-wa log and the callback response at each boundary.

## Development

```bash
pnpm --filter @open-wa/integration-chatwoot dev
```

The plugin exports `chatwootPlugin`, `ChatwootClient`, `createChatwootRouter`, `ChatwootPluginConfig`, and `ChatwootConfig`.

## Documentation

See the [Chatwoot guide](https://openwa.dev/docs/client-and-integrations/chatwoot) for the setup journey, media mapping, and recovery table.

## License

[H-DNH 1.1](https://github.com/open-wa/wa-automate-nodejs/blob/master/LICENSE.md) - Hippocratic + Do Not Harm
