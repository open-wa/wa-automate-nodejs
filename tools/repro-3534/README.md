# Issue #3534: CommonJS create startup

`create-repro.ts` uses the report's `require("node:path")` and
`require("@open-wa/wa-automate")` imports and its configuration. Run it with
Node **24.21.0**. The fixture installs the released SDK and Puppeteer driver
at **5.6.0** from npm, independently of this repository's workspaces.

```sh
cd tools/repro-3534
npm ci --ignore-scripts --no-audit --no-fund --registry=https://registry.npmjs.org
node create-repro.ts
```

The default configuration matches the Linux report, including
`/usr/bin/google-chrome-stable`, `headless: true`, unlimited authentication
and QR timeouts, and the report's Chromium arguments. Install Chrome
**145.0.7632.159** to match its browser version.

For visual inspection, run the same script with a visible browser:

```sh
OPENWA_REPRO_HEADLESS=false node create-repro.ts
```

On macOS, override only the executable path as well:

```sh
OPENWA_REPRO_HEADLESS=false \
OPENWA_REPRO_CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' \
node create-repro.ts
```

The script calls the real `create(configObject)` without mocks or injected
drivers. It prints `CREATE_FAILED` on rejection and `CREATE_RESOLVED` only
after pairing and messaging readiness. Reaching the QR proves browser and
authentication startup, while the create promise still awaits pairing.

The published 5.6.0 run found a second failure after the EventEmitter2 fix:
the ESM core treated its `file://` stack-frame URL as a filesystem path, so
runtime assets could not be resolved. A candidate build with the path
conversion reached QR pairing on macOS with Node 24.21.0 and Chrome for
Testing 145.0.7632.117. The visible run changed `headless` to `false` and
overrode the executable path. Ubuntu/PM2, the exact Linux Chrome
145.0.7632.159 binary, and completion after pairing have not been confirmed
by that candidate run. The fix does not modify the browser assets.
