# browser.ts pseudocode trace

Source of truth: `packages/legacy/src/controllers/browser.ts`

## Role in session bootstrap

- `browser.ts:29` — `initPage(...)` is the browser/page bootstrap called directly by `initializer.ts:create(...)`.
- Its job is bigger than “open a page”: it preloads scripts, launches Puppeteer, restores persisted auth state, sets request interception, prepares proxy/cache behavior, navigates to WA Web, and wires progress hooks.

## initPage main flow

- `browser.ts:30-31` — preload all injectable scripts via `scriptLoader.loadScripts()` so later injections are fast and deterministic.
- `browser.ts:32-36` — normalize viewport/stealth behavior.
- `browser.ts:37-60` — if no existing page was passed in:
  - launch a browser via `initBrowser(...)`
  - grab the first page
  - wire keyboard shortcuts for screenshots / ctrl-c exit when raw stdin is available.
- `browser.ts:62` — bypass service workers through the DevTools protocol.
- `browser.ts:64-83` — on every frame navigation:
  - log the navigation
  - check whether WAPI disappeared
  - if missing, reinject APIs and ask `QRManager` to emit the first QR again
  - log possible logout navigations.
- `browser.ts:86-100` — set page auth/proxy/UA/viewport/cache/CSP options.
- `browser.ts:101-123` — optionally enable resource blocking and page-proxy support.
- `browser.ts:128-158` — optionally revive and persist a locally cached copy of the WhatsApp Web HTML page.
- `browser.ts:136-186` — enable request interception to:
  - serve the cached page when available
  - detect `_priority_components` as a quick-auth signal and set `window.WA_AUTHENTICATED = true`
  - block crash-log/telemetry endpoints
  - proxy requests when configured.

## Session restoration inside initPage

- `browser.ts:189-237` — unless `skipAuth` is true:
  - load session data from file / env / config / cloud bucket
  - inject localStorage session data for legacy mode
  - or opt into MD defaults when no session data exists.

## Navigation and WA progress wiring

- `browser.ts:238-270` — after setup:
  - apply proxy to the page if required
  - wait for all setup promises
  - navigate to `puppeteerConfig.WAUrl`
  - expose `ProgressBarEvent` and `CriticalInternalMessage` so page-side progress can drive the launcher spinner
  - inject the progress observer (`injectProgObserver(...)`)
  - return the live WA page.

## Session-data helpers

- `browser.ts:273-300` — `getSessionDataFromFile(...)`
  - resolves session data from env/config/file
  - supports both raw JSON and base64-encoded JSON files
  - reports corrupted or logged-out session files.
- `browser.ts:302-317` — `deleteSessionData(...)`
  - deletes session data files and MD user-data directories.
- `browser.ts:319-327` — `invalidateSesssionData(...)`
  - marks session data as `LOGGED OUT` without full deletion.
- `browser.ts:330-340` — `getSessionDataFilePath(...)`
  - checks both cwd-relative and main-module-relative session data locations.

## Script injection helpers

- `browser.ts:342-347` — `addScript(...)` loads script text from the preloader and injects either as a script tag or via `page.evaluate`.
- `browser.ts:353-365` — `injectPreApiScripts(...)` installs supporting runtime libs (`qr.min.js`, `hash.js`) if they are missing.
- `browser.ts:367-399` — `injectWapi(...)`
  - waits for `window.require`
  - checks whether `window.WAPI && window.Store` already exists
  - injects `wapi.js`
  - recursively retries if the injected session integrity check still fails.
- `browser.ts:401-408` — `injectApi(...)`
  - injects pre-api scripts
  - injects WAPI
  - injects `launch.js`
  - returns the prepared page.

## Browser launch helper

- `browser.ts:410-513` — `initBrowser(...)`
  - resolves executable path (raspi, Chrome, downloaded revision, Puppeteer fallback)
  - prepares Chromium args
  - for MD, removes `--incognito` and creates/uses a persistent `userDataDir`
  - launches or connects to the browser
  - records browser start timestamp
  - optionally exposes devtools tunnels.

## Cleanup

- `browser.ts:515-519` — `getWAPage(...)` returns the first available page.
- `browser.ts:521-524` — process-death hook kills the browser.
- `browser.ts:530-551` — `kill(...)` closes page/browser handles, SIGKILLs the browser PID when available, and can optionally exit the whole process.

## Why this file matters for v5

- This is the real “page runtime bootstrapper” and should likely become its own subsystem in v5.
- It mixes at least five concerns that are stable but separable:
  1. browser process launch
  2. session persistence restoration
  3. page/network interception
  4. script injection
  5. cleanup/termination

## Behavioral contract / pseudo tests

- The browser bootstrapper should fully prepare a usable page context before higher-level launch logic depends on it.
- It should preload injectable assets before the critical injection point.
- It should restore session state when available, but should not assume restored state is valid until later validation passes.
- It should wire page/navigation observers so reinjection or recovery is possible after navigational disruption.
- It should provide stable hooks for launch progress and critical internal messages.
- It should support proxy/auth/cert/CSP/cache policies without baking those concerns into unrelated launcher code.
- It should not leave zombie browser/page processes behind on fatal shutdown.
- Injection helpers should be idempotent enough that reinjection paths do not corrupt the session.
- If script injection fails, the browser layer should retry or surface a clearly classified error.
- Session-data path resolution should work predictably across cwd-relative and main-module-relative launch contexts.

## Parity status

| Dimension | Status | Note |
| --- | --- | --- |
| Page/bootstrap orchestration | Preserve | Browser/page prep remains a distinct subsystem. |
| Exact Puppeteer plugins/flags | Intentionally changed | v5 may use different browser tooling. |
| Legacy non-MD session restoration branches | Not carried forward | MD-only assumptions simplify restore logic. |

## Inputs / outputs / side effects

- Inputs: launch config, session-data sources, script assets, proxy/network policies.
- Outputs: prepared page handle ready for auth/injection work.
- Side effects: launches browser, mutates page settings, injects scripts, intercepts requests, restores session storage, may create user-data directories.

## Failure taxonomy

- Browser executable/launch failure
- Page setup/interception failure
- Session restore data missing/corrupt
- Navigation failure
- Injection/reinjection failure
- Cleanup failure on kill path

## Dependency contracts

- Requires: script preloader, launch config, optional session persistence sources.
- Guarantees: higher layers receive a page prepared for auth and later injection.
- Guarantees downstream: kill/cleanup is available as a single browser-layer primitive.

## State transitions

- `UNLAUNCHED_BROWSER -> BROWSER_READY -> PAGE_READY`
- `PAGE_READY -> SESSION_RESTORE_ATTEMPTED -> NAVIGATED`
- `NAVIGATED -> OBSERVED/INTERCEPTING -> INJECTION_READY`
- `ANY_PAGE_DISRUPTION -> REINJECTION_ATTEMPT | TERMINAL_BROWSER_FAILURE`
