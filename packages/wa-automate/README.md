# @open-wa/wa-automate

`@open-wa/wa-automate` runs an Open-WA session and exposes its client methods through an HTTP API. It also exports the session client and `createClient` for applications that need direct control in the same Node.js process.

Part of the [@open-wa v5 monorepo](https://github.com/open-wa/wa-automate-nodejs).

## Install

```bash
npm install @open-wa/wa-automate@5.1.0
```

## Start a local API server

```bash
npx @open-wa/wa-automate@5.1.0 --session-id main --host 127.0.0.1 --port 8080 --api-key replace-this-key
```

Scan the QR code shown in the terminal to sign in. Check `http://127.0.0.1:8080/health` until it reports `connected: true` and `session.ready: true`. Keep the API on loopback or a private network unless you have configured an appropriate access boundary. Connect from another Node.js application with [`@open-wa/socket-client`](https://openwa.dev/docs/client-and-integrations/socket-client).

## Documentation

See the [CLI reference](https://openwa.dev/docs/guides/configuration-and-cli), [custom code guide](https://openwa.dev/docs/getting-started/custom-code), and [docs site](https://openwa.dev).

## License

[H-DNH 1.1](https://github.com/open-wa/wa-automate-nodejs/blob/master/LICENSE.md) — Hippocratic + Do Not Harm
