# @open-wa/driver-lightpanda

Lightpanda browser driver for open-wa

Part of the [@open-wa v5 monorepo](https://github.com/open-wa/wa-automate-nodejs).

## Install

```bash
pnpm add @open-wa/driver-lightpanda
```

## Documentation

The driver uses `puppeteer-core`, so package installation does not download a
browser. Launch downloads Lightpanda 1.0.5 only when needed, verifies its release
SHA-256 digest, and reuses it from `~/.cache/open-wa/lightpanda`. A custom
`lightpanda.executablePath` or `LIGHTPANDA_EXECUTABLE_PATH` takes precedence.
Basic mode also detects an installed binary on `PATH` or in `~/.local/bin`;
experimental WhatsApp mode uses the pinned release for its prepared cached copy.
Set `browser.download: 'never'` to require an existing binary, or
`browser.cacheDirectory` to choose another cache.

Lightpanda provides lightweight basic automation with experimental WhatsApp
support. It has low compatibility and no rendering, screenshots or video.
Use Chrome for the widest media and browser compatibility.

With Lightpanda 1.0.5 a WhatsApp session links, restarts from its saved
`.data.json` login, and sends text and images. The same login file moves
between Chrome and Lightpanda. Stickers and audio sends do not work. A
logged-in session's memory and CPU use grow while it idles, to more than
Chrome's within a few minutes, so it is not suited to long-running sessions yet. Windows users must
run Lightpanda inside WSL2.

See the [docs site](https://openwa.dev).

## License

[H-DNH 1.1](https://github.com/open-wa/wa-automate-nodejs/blob/master/LICENSE.md) — Hippocratic + Do Not Harm
