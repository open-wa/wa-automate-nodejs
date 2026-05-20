# @open-wa/integration-webhook

Webhook delivery integration plugin for open-wa

Part of the [@open-wa v5 monorepo](https://github.com/open-wa/wa-automate-nodejs).

## What it does

`@open-wa/integration-webhook` forwards public open-wa events to an external URL with HTTP `POST`. It supports event filtering, custom headers, request timeouts, retry with exponential backoff, and concurrent delivery through a queue.

Use this integration when another service should receive open-wa runtime events without embedding open-wa directly.

## Configuration

The plugin config is validated by the plugin SDK schema in `src/plugin.ts`.

| Field | Required | Source-visible behavior |
| --- | --- | --- |
| `url` | Yes | Target URL for webhook delivery. Must be a URL. |
| `events` | No | `all` or an array of event names. Defaults to `all`. Non-matching events are skipped. |
| `concurrency` | No | Max concurrent deliveries. Defaults to 10. |
| `retries` | No | Number of retry attempts after a failed delivery. Defaults to 3. |
| `retryDelay` | No | Base retry delay in milliseconds. Defaults to 1000 and is exponentially backed off per attempt. |
| `headers` | No | Additional headers merged into each request. |
| `timeout` | No | Request timeout in milliseconds. Defaults to 30000. |

Each delivery also sends `Content-Type: application/json`.

## Payload envelope

The payload shape is defined by `WebhookPayload` in `src/config.ts` and produced in `src/plugin.ts`.

| Field | Value |
| --- | --- |
| `webhookId` | A random UUID generated when the plugin initializes. |
| `sessionId` | The current open-wa session ID from the plugin host. |
| `event` | The event name received by the plugin. |
| `payload` | The event payload received by the plugin. |
| `timestamp` | `Date.now()` at delivery enqueue time. |

## Runtime behavior

- During initialization, the plugin creates a `WebhookDeliverer`, computes the allowed event set, and logs the configured target URL.
- On each public `event` hook call, the plugin skips events outside the configured allowlist and enqueues the payload for delivery.
- `WebhookDeliverer` posts JSON with native `fetch` and aborts requests with `AbortController` when the timeout elapses.
- Non-2xx responses throw an error and enter the retry path.
- Retry delay is `retryDelay * 2 ** attempt` until the configured retry count is exhausted.
- Failed deliveries are logged after all attempts; the error is not rethrown from the final retry path.
- On `dispose`, the plugin waits for the queue to become idle and logs that the queue drained.

## Exports

- Default export and `webhookPlugin` from `src/plugin.ts`.
- `WebhookDeliverer` from `src/deliverer.ts`.
- `WebhookPluginConfig`, `WebhookConfig`, `Webhook`, and `WebhookPayload` types.

## Development

- `pnpm --filter @open-wa/integration-webhook build`
- `pnpm --filter @open-wa/integration-webhook dev`
- `pnpm --filter @open-wa/integration-webhook lint`
- `pnpm --filter @open-wa/integration-webhook clean`

## Documentation

See the [docs site](https://docs.openwa.dev).

## License

[H-DNH V1.0](https://github.com/open-wa/wa-automate-nodejs/blob/main/LICENSE.md) - Hippocratic + Do Not Harm
