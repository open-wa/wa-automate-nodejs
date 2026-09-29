# @open-wa/wa-automate

> The most reliable WhatsApp automation CLI and API server.

Part of the [@open-wa v5 monorepo](https://github.com/open-wa/wa-automate-nodejs).

## Features

- **Easy API**: Run a standalone server and interact via HTTP.
- **Multi-session**: Manage multiple WhatsApp accounts simultaneously.
- **Robustness**: Advanced retries and state management.
- **Drivers**: Support for Playwright, Puppeteer, and Lightpanda.

## Install

```bash
npm install @open-wa/wa-automate@5.1.0
```

## Usage

```bash
npx @open-wa/wa-automate@5.1.0 --session-id quickstart --host 127.0.0.1 --port 8080
```

Authenticate the session from the terminal, then check `http://localhost:8080/health` until it reports `connected: true` and `session.ready: true`. `/health` is public and can include QR and operational details, so keep the API bound to loopback or a private network. See the [quick start](https://openwa.dev/docs/getting-started/quickstart) for the first-message journey and the [CLI options](https://openwa.dev/docs/guides/configuration-and-cli) for configuration.

## Documentation

For full guides and API reference, visit the [docs site](https://openwa.dev).

## License

[H-DNH V1.0](https://github.com/open-wa/wa-automate-nodejs/blob/master/LICENSE.md) — Hippocratic + Do Not Harm
