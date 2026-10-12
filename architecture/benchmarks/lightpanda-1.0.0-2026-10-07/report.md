# Lightpanda 1.0.0 versus Chrome 154 — 7 October 2026

Lightpanda is substantially cheaper on this controlled JavaScript workload, but it cannot currently replace Chrome for OpenWA. Chrome reached WhatsApp Web's QR login screen; Lightpanda reached a “Browser not supported” page in both configurations. The source inspected during that benchmark limited compact authentication to Puppeteer and Playwright.

Follow-up: a separate UA-enabled v1 copy and experimental worker/crypto bridges now reach a real WhatsApp QR through the source driver. See [the QR experiment](qr-experiment.md). This does not change the stock-binary measurements below or establish authenticated/session-restoration support.

Release preparation, 8 October 2026: the source now accepts explicitly enabled
experimental Lightpanda startup. Custom native Debug runs reached authenticated
library READY and loaded chats/contacts, but subsequent document reloads failed
with session takeover and initialization errors. The stock download has not
been replaced. These later observations do not change this benchmark or prove
reliable recovery, outbound delivery, long-session durability or Chrome parity.

## Resource results

These are medians of five runs per engine and concurrency level, with engine order alternated. Every session uses a separate fresh browser process. The workload fetches 1,000 message-shaped records from a local HTTP server, creates 1,000 DOM nodes, and verifies their count, sum and final text. After the first load it repeats that workload 20 times per session, then observes one second of idle time. All 20 resource runs returned the expected extraction.

| Sessions | Engine | Launch to first extraction, ms | 20 repeat loads per session, ms | Peak browser-tree RSS, MiB | Browser CPU time, seconds (estimate) |
| --- | --- | ---: | ---: | ---: | ---: |
| 1 | chrome | 1252 | 787 | 985.1 | 3.35 |
| 1 | lightpanda | 125 | 183 | 43.7 | 0.40 |
| 3 | chrome | 2058 | 1341 | 2666.0 | 9.01 |
| 3 | lightpanda | 178 | 240 | 122.6 | 1.08 |

At 1 session, Lightpanda used 22.6x less summed peak RSS, reached the first checked extraction 10.0x faster, completed repeat loading 4.3x faster, and used 8.4x less sampled browser CPU time.

At 3 sessions, Lightpanda used 21.7x less summed peak RSS, reached the first checked extraction 11.6x faster, completed repeat loading 5.6x faster, and used 8.3x less sampled browser CPU time.

CPU time covers launch, first load, repeat work and the one-second idle period. For warm work alone, the single-session medians were 0.29 seconds for Lightpanda and 1.27 seconds for Chrome. Single-session RSS after the idle observation was 35.5 MiB versus 846.4 MiB.

The host is an Apple M1 Pro with 8 CPU cores and 16 GiB RAM, running macOS 26.6.2 (Darwin 25.6.0), Node v26.10.0, and Puppeteer 25.3.0. Chrome is Google Chrome 154.0.8037.58; Lightpanda is the exact [1.0.0 release](https://github.com/lightpanda-io/browser/releases/tag/1.0.0). Its ARM64 macOS binary SHA256 matched the GitHub asset digest: `955440053a84754dd64c62f970449a56a2b350cdf43ea5f2e809a73047b8173d`.

## Compatibility

Chrome passed 25/25 focused probes, Lightpanda's default configuration passed 17/25, and Lightpanda with worker, iframe and stylesheet loading passed 19/25. This is a focused sample of browser behavior, not a general compatibility percentage or a full WPT run.

| Probe | Chrome | Lightpanda default | Lightpanda with resources |
| --- | --- | --- | --- |
| CDP version/newPage/navigation/DOM/fetch | Pass | Pass | Pass |
| evaluateOnNewDocument before page script | Pass | Pass | Pass |
| exposeFunction node bridge | Pass | Pass | Pass |
| CDP user agent override used by OpenWA | Pass | Fail | Fail |
| localStorage survives navigation | Pass | Pass | Pass |
| IndexedDB write/read | Pass | Pass | Pass |
| IndexedDB survives navigation | Pass | Pass | Pass |
| WebCrypto SHA256 and AES-GCM | Pass | Pass | Pass |
| WebSocket echo | Pass | Pass | Pass |
| dedicated Worker message roundtrip | Pass | Fail: browser feature timeout after 2000ms | Pass |
| ES module dynamic import | Pass | Fail: Failed to resolve module specifier | Fail: Failed to resolve module specifier |
| ES module dynamic import absolute URL | Pass | Pass | Pass |
| MutationObserver DOM mutation | Pass | Pass | Pass |
| Shadow DOM selection | Pass | Pass | Pass |
| cookie CDP export/import | Pass | Pass | Pass |
| CORS blocked without permission | Pass | Pass | Pass |
| CORS allowed with permission | Pass | Pass | Pass |
| request interception abort | Pass | Pass | Pass |
| Puppeteer input typing and click | Pass | Pass | Pass |
| contenteditable keyboard entry | Pass | Fail | Fail |
| Canvas 2D pixel roundtrip | Pass | Fail | Fail |
| CDP screenshot returns PNG bytes | Pass | Pass | Pass |
| service worker activation | Pass | Fail | Fail |
| iframe load and DOM | Pass | Fail: browser feature timeout after 2000ms | Pass |
| separate browser context storage isolation | Pass | Fail: Protocol error (Target.createBrowserContext): Cannot have more than one browser context at a time | Fail: Protocol error (Target.createBrowserContext): Cannot have more than one browser context at a time |

The user-agent override returns successfully but leaves `navigator.userAgent` as `Lightpanda/1.0`; the current OpenWA source driver produced the same result. The relative dynamic import fails from `page.evaluate`, while an absolute URL succeeds. Workers and iframes are opt-in and start working with their resource flags. Service workers are absent under stable/default settings; the [v1 release notes](https://github.com/lightpanda-io/browser/releases/tag/1.0.0) describe an experimental flag, which was not enabled here.

The screenshot-byte probe only establishes that CDP returns a PNG. Visual inspection shows that Lightpanda produces a text representation, omitting the actual input field and styled button, while Chrome captures the page. It does not establish graphical screenshot compatibility. The separate Canvas check verifies actual red pixel data and fails on Lightpanda. See [Chrome fixture](fixture-chrome-default.png) and [Lightpanda fixture](fixture-lightpanda-default.png). Lightpanda's [v1 announcement](https://lightpanda.io/blog/posts/lightpanda-1-0) describes the lack of a graphical rendering pipeline.

Multiple contexts in one Lightpanda process were rejected with “Cannot have more than one browser context at a time.” This does not block the one-process-per-session model used by this benchmark and OpenWA's driver.

## Actual WhatsApp Web navigation

Each engine used a fresh unauthenticated session and attempted the same OpenWA Chrome/146 user-agent override before navigation. The probe waited for either QR login or a browser rejection; it did not log in or send messages.

| Engine | Outcome | Time to outcome | Peak RSS |
| --- | --- | ---: | ---: |
| chrome | QR login screen | 8.59 s | 1100.7 MiB |
| lightpanda | Browser not supported; no QR | 0.38 s | 27.9 MiB |
| lightpanda with resources | Browser not supported; no QR | 2.29 s | 41.4 MiB |

Lightpanda's smaller memory use on this live URL is not comparable workload performance: it never loaded the same WhatsApp application state. The resource comparison above deliberately uses the identical successful local workload instead. The login screenshots remain local because they contain QR pairing payloads.

## OpenWA integration at the original benchmark

The current TypeScript Lightpanda driver launched the pinned binary, connected over CDP, opened a page and returned 42 through an exposed Node callback. The engine's CDP version string was `Chrome/124.0.6367.29`, so the binary CLI version and digest are the version authority.

Source inspection at `packages/core/src/createClient.ts:228` shows the compact-authentication guard rejecting every driver name except `puppeteer` and `playwright`. This is working-tree evidence at commit `bab232462e64a6b66e6dac64a31ccec18d3eed59`; pre-existing runtime edits were present. A full current-source `createClient` execution could not be evaluated through Bun because importing core failed first: `require() async module "/Users/Mohammed/projects/tools/wa/node_modules/strip-ansi/index.js" is unsupported. use "await import()" instead.`. That import failure is recorded separately and is not presented as execution of the driver guard.

## Limits and rerunning

The RSS sampler sums benchmark-owned browser process trees approximately every 50 ms and excludes the Node controller and sampler process. Summed RSS can count shared physical pages more than once; these values are not private-memory or container-capacity measurements. CPU is the sum of maximum observed cumulative CPU time per browser PID, which can miss short-lived processes. It excludes controller/server work and is not a utilization percentage.

This was an ordinary active desktop, not an isolated machine. Single-session Chrome launch-to-ready ranged from 1042 to 7148 ms; Lightpanda ranged from 89 to 384 ms. The raw samples preserve that variability. No authenticated WhatsApp resource measurement, session restart/restore, long-duration memory growth, Linux comparison, media handling or message delivery was established.

Run from the repository root with the v1 binary at the recorded path, or set `LIGHTPANDA_EXECUTABLE_PATH` to an exact 1.0.0 binary:

```sh
node architecture/benchmarks/lightpanda-1.0.0-2026-10-07/benchmark.mjs all
LIGHTPANDA_EXECUTABLE_PATH=/tmp/openwa-lightpanda-v1-benchmark/lightpanda-1.0.0 bun architecture/benchmarks/lightpanda-1.0.0-2026-10-07/repository-probe.ts
node architecture/benchmarks/lightpanda-1.0.0-2026-10-07/summarize.mjs
```

Modes `compatibility`, `benchmark` and `whatsapp` rerun only that part. The current installed Lightpanda nightly was left unchanged. The benchmark uses temporary Chrome profiles and cleans up its browser processes. [Raw results](results.json), [source-driver probe](repository-probe.json) and the harness are kept beside this report. The subsequent QR experiment includes driver source changes documented separately.
