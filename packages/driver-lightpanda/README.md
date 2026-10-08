# @open-wa/driver-lightpanda

Lightpanda browser driver for open-wa

Part of the [@open-wa v5 monorepo](https://github.com/open-wa/wa-automate-nodejs).

## Install

```bash
pnpm add @open-wa/driver-lightpanda
```

## Documentation

The driver uses `puppeteer-core`, so package installation does not download a
browser. Launch downloads Lightpanda 1.0.0 only when needed, verifies its release
SHA-256 digest, and reuses it from `~/.cache/open-wa/lightpanda`. A custom
`lightpanda.executablePath` or `LIGHTPANDA_EXECUTABLE_PATH` takes precedence.
Basic mode also detects an installed binary on `PATH` or in `~/.local/bin`;
experimental WhatsApp mode uses the pinned release for its prepared cached copy.
Set `browser.download: 'never'` to require an existing binary, or
`browser.cacheDirectory` to choose another cache.

Lightpanda provides lightweight basic automation with experimental WhatsApp
support. It has low compatibility and no rendering, screenshots or video.
Use Chrome for the widest media and browser compatibility. Windows users must
run Lightpanda inside WSL2.

See the [docs site](https://openwa.dev).

## License

[H-DNH 1.1](https://github.com/open-wa/wa-automate-nodejs/blob/master/LICENSE.md) — Hippocratic + Do Not Harm
