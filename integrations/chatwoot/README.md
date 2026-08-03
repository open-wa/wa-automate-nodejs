# @open-wa/integration-chatwoot

Chatwoot integration plugin for open-wa

Part of the [@open-wa v5 monorepo](https://github.com/open-wa/wa-automate-nodejs).

## What it does

`@open-wa/integration-chatwoot` bridges WhatsApp messages with Chatwoot CRM. The plugin creates a Chatwoot client and initializes the Chatwoot inbox at `core.started`. It processes `message.received` events and exposes `createChatwootRouter` for Chatwoot webhooks.

Use this integration to show WhatsApp conversations in Chatwoot. It sends Chatwoot agent replies through the open-wa client.

## Configuration

The plugin config is validated by the plugin SDK schema in `src/plugin.ts`.

| Field | Necessary | Source-visible behavior |
| --- | --- | --- |
| `chatwootUrl` | Yes | URL for the Chatwoot instance. The client parses the Chatwoot origin, account ID, and optional inbox ID from this value. |
| `chatwootApiAccessToken` | Yes | Sent as `api_access_token` on Chatwoot API requests. |
| `apiHost` | No | Public API host used to build the expected Chatwoot webhook URL. |
| `host` | No | Used with `https` and `port` to build the webhook URL when `apiHost` is not provided. |
| `https` | No | Selects `https` or `http` when constructing the webhook URL from `host` and `port`. |
| `port` | No | Used in the constructed webhook URL when `apiHost` is not provided. |
| `apiKey` | No | Appended to the Chatwoot webhook URL as `api_key` when present. |
| `forceUpdateCwWebhook` | No | Defaults to `false` in the schema. When true, initialization patches the Chatwoot inbox webhook URL. |

The generated webhook URL is `/plugins/chatwoot/webhook` under the selected API host.

## Runtime behavior

- On `core.started`, the plugin calls `client.getHostNumber()`, initializes the Chatwoot client with the current `sessionId`, and finds or creates a Chatwoot inbox.
- If the Chatwoot URL does not include an account ID, the client requests `/api/v1/profile` to discover it.
- If no inbox ID is present, the client searches existing inboxes for `additional_attributes.hostAccountNumber`. If the search fails, it creates an API inbox.
- On `message.received`, the plugin ignores group chats, broadcast chats, and echo messages. It finds or creates contacts and conversations. It sends the messages to Chatwoot.
- Media messages with `cloudUrl` are sent to Chatwoot as a file URL in text. Media messages without `cloudUrl` can be decrypted through `client.decryptMedia` and uploaded to Chatwoot as attachments when `deprecatedMms3Url` and `mimetype` are present.
- The router handles `POST /webhook` for Chatwoot outbound messages. It ignores echo payloads and events that are not public `message_created` events. It uses the applicable client method for attachments, locations, links, or text.
- On `dispose`, the plugin logs that the integration was disposed.

## Exports

- Default export and `chatwootPlugin` from `src/plugin.ts`.
- `ChatwootClient` from `src/client.ts`.
- `createChatwootRouter` from `src/middleware.ts`.
- `ChatwootPluginConfig` and `ChatwootConfig` types.

## Development

- `pnpm --filter @open-wa/integration-chatwoot build`
- `pnpm --filter @open-wa/integration-chatwoot dev`
- `pnpm --filter @open-wa/integration-chatwoot lint`
- `pnpm --filter @open-wa/integration-chatwoot clean`

## Documentation

See the [docs site](https://openwa.dev).

## License

[H-DNH V1.0](https://github.com/open-wa/wa-automate-nodejs/blob/main/LICENSE.md) - Hippocratic + Do Not Harm
