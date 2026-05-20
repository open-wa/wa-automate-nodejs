# @open-wa/integration-cloudflare

Cloudflare Tunnel integration plugin for open-wa

Part of the [@open-wa v5 monorepo](https://github.com/open-wa/wa-automate-nodejs).

## What it does

`@open-wa/integration-cloudflare` starts a named Cloudflare Tunnel for an open-wa session. The plugin starts the tunnel when the open-wa core emits `core.started` and stops and deletes it during `dispose`.

Use this integration when a local open-wa HTTP service should be reachable through a Cloudflare-managed hostname without changing the open-wa runtime itself.

## Configuration

The configuration type is `CloudflareConfig` in `src/config.ts`.

| Field | Required | Source-visible behavior |
| --- | --- | --- |
| `hostDomain` | Yes | Base domain used to build the tunnel hostname. |
| `namespace` | No | Optional namespace inserted between the session name and host domain. If omitted, the source uses `_owa` as the suffix segment. |
| `port` | Yes | Local port used as the tunnel target, formatted as `http://localhost:{port}`. |

The session ID is sanitized with non-alphanumeric characters replaced by `_` and lowercased. The tunnel name is `_owa_{sessionName}`. The hostname is `https://{sessionName}{namespacePrefix}.{hostDomain}`, where `namespacePrefix` is `.{namespace}` when `namespace` is provided and `_owa` otherwise.

## Runtime behavior

- On `core.started`, the plugin calls `createTunnel(config, sessionId, logger)` and logs the returned tunnel URL.
- `createTunnel` checks whether the named tunnel exists by calling `cloudflared tunnel info` through the `cloudflared` package.
- If the tunnel does not exist, it creates it.
- It routes DNS for the computed FQDN with `route dns --overwrite-dns`.
- It runs the tunnel with `--url http://localhost:{port}` and `--hostname https://{fqdn}`.
- Cloudflare child process output is logged with a `CLOUDFLARE:` prefix.
- On `dispose`, the plugin calls the tunnel `stop()` function. The returned stop function stops the running process and deletes the named tunnel.

## Exports

- `cloudflarePlugin` from `src/plugin.ts`.
- `createTunnel` and `TunnelResult` from `src/tunnel.ts`.
- `CloudflareConfig` from `src/config.ts`.

## Development

- `pnpm --filter @open-wa/integration-cloudflare build`
- `pnpm --filter @open-wa/integration-cloudflare dev`
- `pnpm --filter @open-wa/integration-cloudflare lint`
- `pnpm --filter @open-wa/integration-cloudflare clean`

## Documentation

See the [docs site](https://docs.openwa.dev).

## License

[H-DNH V1.0](https://github.com/open-wa/wa-automate-nodejs/blob/main/LICENSE.md) - Hippocratic + Do Not Harm
