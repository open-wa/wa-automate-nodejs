# @open-wa/core

`@open-wa/core` creates and runs a browser-backed Open-WA session. It owns session lifecycle, events, plugins, readiness state, and the transport used by `@open-wa/client` to call WhatsApp Web methods. Applications can usually start with `@open-wa/wa-automate`, which assembles these packages behind a CLI and HTTP API.

Part of the [@open-wa v5 monorepo](https://github.com/open-wa/wa-automate-nodejs).

## Main exports

- `createClient(options)` creates a session and returns an `OpenWAClient` with `start`, `stop`, `getState`, `getReadiness`, and `getTransport` methods.
- `OpenWAClient.events` exposes the session event emitter.
- Plugin, session, and transport types are also exported from this package.

The `driver` option is required. See the [custom code guide](https://openwa.dev/docs/getting-started/custom-code) for an example using `@open-wa/driver-puppeteer`, and [how Open-WA works](https://openwa.dev/docs/concepts/how-it-works) for how the packages fit together.

## License

[H-DNH 1.1](https://github.com/open-wa/wa-automate-nodejs/blob/master/LICENSE.md) - Hippocratic + Do Not Harm
