# Live patch control plane

This private workspace package implements the Cloudflare Worker used by opt-in live patch clients. A Durable Object stores the current signed manifest and fans release notifications out to connected WebSockets; HTTP check and outcome endpoints write only the analytics whitelist to Analytics Engine.

## Deploy

Create the release bearer token as a Worker secret and configure the optional Analytics Engine binding:

```bash
pnpm --filter @open-wa/live-patch-worker exec wrangler secret put PUBLISH_TOKEN
pnpm --filter @open-wa/live-patch-worker deploy
```

If analytics are enabled, bind an Analytics Engine dataset as `PATCH_ANALYTICS` in `wrangler.jsonc`. The Worker never accepts raw host numbers, session ids, credentials, message content, or filesystem paths into its analytics envelope.

## Publish

Run `pnpm publish:patches [path-to-patches.json]` with these environment variables:

- `PATCH_ARTIFACT_UPLOAD_URL_TEMPLATE` and `PATCH_ARTIFACT_PUBLIC_URL_TEMPLATE`, both containing `{hash}`
- `OPENWA_PATCH_SIGNING_KEY`, an Ed25519 private key in PEM form
- `OPENWA_PATCH_CONTROL_URL`, the Worker base URL ending in `/v1`
- `OPENWA_PATCH_PUBLISH_TOKEN`, matching the Worker secret

`PATCH_UPLOAD_TOKEN`, `PATCH_POINTER_UPLOAD_URL`, `BUNNY_PURGE_URL`, `BUNNY_ACCESS_KEY`, `PATCH_MIN_CORE_VERSION`, and `PATCH_MAX_CORE_VERSION` are optional. Keep every credential in the environment or a secret manager; none belongs in this repository.
