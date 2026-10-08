# @open-wa/driver-puppeteer

Puppeteer driver implementation for open-wa

Part of the [@open-wa v5 monorepo](https://github.com/open-wa/wa-automate-nodejs).

## Install

```bash
bun add @open-wa/driver-puppeteer
```

## Browser setup

Installing the driver installs `puppeteer-core` without downloading a browser.
Startup reuses cached Chrome, or downloads the Puppeteer-matched Chrome for
Testing with progress when it is missing. Set `browser.kind: 'chromium'` to
download and reuse Chromium instead. Downloads use `PUPPETEER_CACHE_DIR` or
`~/.cache/puppeteer`. Concurrent open-wa starts share one installation; an
interrupted download is retried on the next start.

Use the same resolver to pre-provision a deployment cache:

```typescript
import { ensureBrowser } from '@open-wa/driver-puppeteer';

const executablePath = await ensureBrowser({
  browser: { cacheDirectory: '/app/browser-cache', download: 'auto' },
});
console.log(executablePath);
```

Provision on the same operating system and architecture as the deployment.
Then pass `browser: { cacheDirectory: '/app/browser-cache', download: 'never' }`
to `create()` or the driver's `launch()` to forbid downloads at runtime. An
explicit `download` option takes precedence over `PUPPETEER_SKIP_DOWNLOAD` and
`PUPPETEER_CHROME_SKIP_DOWNLOAD`; otherwise those environment settings are respected.

`executablePath` overrides managed Chrome. A missing or non-executable path
produces an error, so a typo cannot silently select a different browser.
`PUPPETEER_EXECUTABLE_PATH` is also respected. Downloads honor `HTTP_PROXY`,
`HTTPS_PROXY` and `NO_PROXY`; `browser.downloadBaseUrl` selects a Chrome for
Testing mirror.

Chrome's sandbox remains enabled by default. open-wa does not install operating
system packages. If Chrome reports a missing shared library or unavailable
sandbox, configure the host or deployment image using
[Puppeteer's troubleshooting guide](https://pptr.dev/troubleshooting).

## Documentation

See the [docs site](https://openwa.dev).

## License

[H-DNH 1.1](https://github.com/open-wa/wa-automate-nodejs/blob/master/LICENSE.md) — Hippocratic + Do Not Harm
