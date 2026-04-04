# initializer.ts pseudocode trace

Source of truth: `packages/legacy/src/controllers/initializer.ts`

Mirror being documented: `packages/legacy-documented/src/controllers/initializer.ts`

## Entrypoint

- `initializer.ts:51` — `create(config = {})` is the real session bootstrap entrypoint exported through `src/index.ts`.
- `initializer.ts:52` — capture a `START_TIME` so the launcher can later report total launch duration.
- `initializer.ts:53-56` — if structured logging is enabled and provided as an array, normalize it through `setupLogging(...)` and replace `config.logging` with the configured logger transport.
- `initializer.ts:57-60` — allocate mutable launch-scoped variables: current page handle, update notifier, session id, custom user agent.

## Phase 1: normalize config into launcher defaults

- `initializer.ts:62-64` — unless `eventMode === false`, force `eventMode = true`; the library wants events on by default.
- `initializer.ts:66-68` — default important launch flags to `true` unless explicitly disabled:
  - `waitForRipeSession`
  - `multiDevice`
  - `deleteSessionDataOnLogout`
- `initializer.ts:70-97` — unless update checks are skipped, fetch release metadata with `update-notifier`.
  - `:75` — surface the update notification immediately.
  - `:76-96` — if `keepUpdated` is on and a newer version exists, self-update with `npm i @open-wa/wa-automate`, then respawn the current process and exit.

## Phase 2: docker/env overrides and session identity

- `initializer.ts:99-107` — if running in Docker, merge environment-derived config values into the explicit config and ensure `chromiumArgs` exists.
- `initializer.ts:108` — derive `sessionId`, defaulting to `'session'`.

## Phase 3: operator-facing startup UX

- `initializer.ts:110-123` — render either the large colored banner (`CFonts`) or a boxed plain-text summary when spins are disabled.
- `initializer.ts:125-130` — if popup auth UI is requested, lazy-load `./popup`, start the popup server, and print its auth URL.
- `initializer.ts:131-137` — instantiate launch helpers:
  - `Spin(sessionId, 'STARTUP', ...)` for launch progress
  - `QRManager(config)` for QR/link-code orchestration
  - RAM + Puppeteer version debug strings for diagnostics

## Phase 4: hard launch sequence inside the main try/catch

- `initializer.ts:139` — warn if someone is still calling the deprecated string-first `create(sessionId, config)` pattern.
- `initializer.ts:140-142` — start/succeed/info spinner states for initial launch.
- `initializer.ts:143-151` — infer multi-device mode from the presence of the `_IGNORE_<session>` directory when `AUTO_MD` is set.
- `initializer.ts:151-152` — emit operator warnings for risky Chromium arg combinations in MD mode.
- `initializer.ts:153` — call `initPage(...)` from `browser.ts`; this is the deepest early branch because it launches the browser, restores session data, prepares the page, injects early scripts, and navigates to WhatsApp Web.
- `initializer.ts:154-156` — mark page load complete and set `throwOnError` if TOS block errors should be fatal.

## Phase 5: gather runtime diagnostics from the live page

- `initializer.ts:158-165` — extract page user-agent, browser version, OS name, timestamp, and define a screenshot directory.
- `initializer.ts:163-171` — define the exported `screenshot(page)` helper used elsewhere (notably `auth.ts`) to recursively ensure the screenshot directory exists and retry screenshot capture.
- `initializer.ts:173-177` — if requested, listen to browser console errors and capture screenshots for unexpected initialization-time browser failures.
- `initializer.ts:179-205` — compute version/debug info:
  - detect current WA web version
  - test whether early injection is allowed
  - detect whether this looks like a reauth path via localStorage tokens
  - print structured debug info and generate a prefilled GitHub issue link

## Phase 6: invariant-avoidance window before injection

- `initializer.ts:206-215` — wait for any of three “good enough to continue” states:
  1. webpack/modules map is ready
  2. QR code DOM is visible
  3. QR spinner is visible
- Purpose: reduce brittle race conditions before attempting API injection.

## Phase 7: early injection if possible

- `initializer.ts:216-224` — if early injection is allowed:
  - `:217` — when reauthing, temporarily fake `window.Store = { Msg: true }` so injection doesn’t choke on partially-hydrated internals.
  - `:218-220` — inject WAPI/launch scripts via `injectApi(...)`.
- Else:
  - `:222-223` — remove spinner noise and optionally throw a TOS block error.

## Phase 8: first authentication race

- `initializer.ts:226-233` — race between:
  - `isAuthenticated(waPage)` from `auth.ts`
  - a timeout if `authTimeout !== 0`
- This decides whether the restored session is already valid, timed out, or should be invalidated.

## Phase 9: expired-session recovery loop

- `initializer.ts:234-247` — if auth returns `'NUKE'` and nuking is not ignored:
  - fail spinner with explicit session-expiry guidance
  - kill the page/browser
  - optionally delete session data
  - optionally throw `SessionExpiredError`
  - otherwise recursively restart `create(...)` with `sessionData: authenticated` (the legacy relaunch path)

## Phase 10: preload licensing while auth/QR may still continue

- `initializer.ts:250-257` — capture an early wid from localStorage and start `getLicense(...)` in parallel. The license fetch is intentionally overlapped with the rest of the launch path.

## Phase 11: auth timeout / phone-out-of-reach handling

- `initializer.ts:258-267` — if the first auth race timed out:
  - race `phoneIsOutOfReach(...)` vs another timeout
  - emit either `appOffline` or `authTimeout`
  - kill the browser/page
  - optionally exit the process
  - throw a descriptive error

## Phase 12: interactive authentication flow when not already authed

- `initializer.ts:269-299` — if already authenticated, just mark success.
- Otherwise:
  - `:272-281` — build a second race between a QR/login flow and `qrTimeout`.
  - `:274-276` — choose `qrManager.linkCode(...)` when `config.linkCode` is set, else `qrManager.smartQr(...)`.
  - `:283-289` — if QR logic discovers MD while config says legacy, kill the page and recursively restart `create(...)` with `multiDevice: true`.
  - `:290-295` — on QR timeout, emit/kill/exit/throw.
  - `:297-299` — successful scan emits `successfulScan` and marks spinner success.

## Phase 13: internal-event plumbing and ripe-session stabilization

- `initializer.ts:300-303` — optionally enable internal event debugging, set `window.critlis`, then inject the internal event handler stub from `init_patch.ts`.
- `initializer.ts:304-311` — if this is a reauth path:
  - delete the temporary fake `window.Store`
  - if configured, wait for `waitForRipeSession(...)` before doing the final injection

## Phase 14: final injection pass

- `initializer.ts:312-315` — perform a second injection pass. The spinner text uses `Reinjecting` or `Injecting` depending on whether early injection already happened.
- `initializer.ts:317-323` — in safe mode, wait 5 seconds and inject again to stabilize the session.

## Phase 15: validate session internals before building the client

- `initializer.ts:325-329` — wait up to 9 seconds for `window.Store.Msg` to exist. If this fails, log the failure and treat the session as invalid.

### Valid-session branch

- `initializer.ts:330-344` — session is good, so start fetching the live patch (`getPatch(...)`), read localStorage, and compute the canonical/alternate session-data file path.
- `initializer.ts:343-353` — extract the reusable session tokens and base64-encode them.
- `initializer.ts:349-352` — when multi-device is on, strip `WABrowserId` to avoid reauth corruption.
- `initializer.ts:355-357` — emit session data through the internal event bus as both structured JSON and base64.
- `initializer.ts:358-360` — persist the session data file unless session save is explicitly skipped.
- `initializer.ts:361-374` — optionally upload the new session data blob to cloud storage.
- `initializer.ts:375-390` — install page-level console/error logging and optional auto-restart-on-crash behavior.
- `initializer.ts:391-395` — compare local `wapi.js` against the expected hash; if it differs, skip the broken-method check because local modifications are assumed.
- `initializer.ts:396-403` — set host language if configured and inject live patches unless patching was skipped.
- `initializer.ts:404-407` — derive masked account info, hash the host number, and run `integrityCheck(...)` unless broken-method checking was disabled.
- `initializer.ts:408-415` — compute launch metrics from WAPI and print the final “client loaded” launch summary.
- `initializer.ts:416-421` — if logout cleanup is enabled, force `eventMode = true`; then instantiate `new Client(waPage, config, {...debugInfo, ...metrics})`.
- `initializer.ts:422-427` — fetch `me`, resolve license key from CLI args if needed, and inject the license if a key exists or if the wid changed during launch.
- `initializer.ts:428-431` — finalize the web session via `injectInitPatch(...)`, then finalize the client with `client.loaded()`.
- `initializer.ts:432-436` — optionally call `client.refresh()` on the very first headful QR-auth path to strengthen headful integrity.
- `initializer.ts:437-444` — generate issue/license links, emit `SUCCESS`, remove the spinner, and return the fully initialized `Client`.

### Invalid-session branch

- `initializer.ts:446-451` — dump current `window.Store` keys to logs, kill the browser/page, and recursively retry `create(config)`.

## Phase 16: centralized failure handling

- `initializer.ts:453-474` — any thrown error is emitted/logged/printed.
- `initializer.ts:460` — always try to kill the page/browser on failure.
- `initializer.ts:461-470` — special-case behavior for:
  - Puppeteer `ProtocolError` with “Target closed” → fail and hard-exit
  - MD `TimeoutError` → show cleanup guidance
  - timeout + `killProcessOnTimeout` → exit process
- `initializer.ts:471-472` — otherwise remove spinner UI and rethrow.

## Direct runtime branches from `create()`

- `browser.ts:initPage` — launches browser/page, restores session data, sets interceptors, navigates to WA, and exposes progress hooks.
- `auth.ts:isAuthenticated` — races “needs QR”, “inside chat”, and “session invalid”.
- `auth.ts:QRManager.smartQr / linkCode` — manages QR/link-code collection, event emission, and MD detection.
- `browser.ts:injectApi` — injects pre-api scripts, WAPI, then `launch.js`.
- `patch_manager.ts:getPatch / getAndInjectLivePatch / getAndInjectLicense` — remote patch/license fetch and injection.
- `launch_checks.ts:integrityCheck` — verifies that expected `Store.*` methods survived injection and patching.
- `Client.ts:loaded` — registers listeners, loads phone version, installs auto-emoji/logout handlers, and marks the client fully loaded.

## Transfer notes for v5

- The function is not just “create a client”; it is a state machine with retries, recursion, auth races, fallback injection modes, persistence, and operator-facing diagnostics.
- The key architectural seams worth preserving are:
  1. config normalization before browser launch
  2. page boot before auth decisions
  3. dual-phase injection (early + final)
  4. session persistence + patch/license overlay before `Client` becomes public
  5. recursive recovery instead of partial invalid state

## Behavioral contract / pseudo tests

### Core expectations

- `create()` should behave as the single authoritative session bootstrap entrypoint for the package.
- `create()` should normalize launch config before any browser/page work begins.
- `create()` should surface useful operator-facing startup information, but v5 does **not** need to preserve the exact terminal/banner design.
- `create()` should check for library updates or freshness in some form, but v5 does **not** need to preserve the exact update-check mechanism.
- `create()` should absorb environment-derived config regardless of Docker mode.
- `create()` should assume multi-device semantics as baseline, not an optional mode.
- `create()` should enable integration/event transport by default because the future plugin system depends on it.

### Must not regress

- It should not expose a partially initialized client as “ready”.
- It should not silently continue after an unrecoverable auth timeout, fatal page-launch failure, or invalid-session state.
- It should not require callers to know internal launch phases in order to get a valid session.
- It should not persist obviously invalid session state as if it were healthy.

### Branch and edge-case expectations

- If persisted session state is valid, `create()` should reuse it and avoid unnecessary interactive auth.
- If persisted session state is invalid/expired, `create()` should clearly transition into a recovery path rather than leaving the runtime ambiguous.
- If interactive auth is required, `create()` should provide enough observable output/events for an operator or integration to complete auth.
- If the phone is unreachable or auth times out, `create()` should fail clearly and predictably.
- If injection succeeds early, final validation should still happen before client readiness is declared.
- If early injection is impossible, the launcher should still have a valid later path or a clear fatal failure.
- If page/session integrity checks fail, `create()` should either repair/retry or fail with a concrete diagnostic.
- If a license/patch/finalization step is optional, the optionality should be explicit and should not corrupt core readiness.

### Benchmark prompts for v5

- A new implementation should be able to answer: “what phase is launch in right now?” at every major step.
- A new implementation should be able to answer: “why did launch fail?” with a reason more precise than a generic exception.
- A new implementation should prove that “ready” means page initialized, auth settled, runtime injected, integrity checked, and public client finalized.

### Observable evidence

- Success should be externally visible through a returned ready client plus readiness-oriented events/logs/output.
- Timeout/offline/session-invalid paths should each have externally distinguishable terminal evidence.
- Cleanup-sensitive branches should leave observable evidence that stale browser/session artifacts were cleaned up or intentionally preserved.

## Parity status

| Dimension | Status | Note |
| --- | --- | --- |
| Launch as primary entrypoint | Preserve | `create()` remains the authoritative bootstrap. |
| Launch UX presentation | Intentionally changed | Output style/TUI may change completely. |
| Update check mechanism | Intentionally changed | Behavior matters more than transport/library choice. |
| Legacy-vs-MD branching | Not carried forward | v5 should assume MD-only semantics. |
| Docker-only env absorption gate | Not carried forward | Env absorption should be unconditional. |

## Inputs / outputs / side effects

- Inputs: resolved config, persisted session material, env-derived overrides, optional popup/license/patch settings.
- Outputs: ready `Client` on success, classified failure on terminal error.
- Side effects: launches browser/page, emits events, writes/deletes session artifacts, prints progress, may check updates, may restart/retry launch.

## Failure taxonomy

- Config normalization failure
- Browser/page launch failure
- Auth timeout / phone unreachable
- Session-invalid / expired-session recovery failure
- Injection or reinjection failure
- Integrity-check failure
- Final client-finalization failure

## Dependency contracts

- Requires: valid normalized config, browser bootstrap capability, auth probes, patch/license/integrity helpers.
- Guarantees: callers do not receive a public client before auth settles and final initialization completes.
- Guarantees downstream: `Client.loaded()` is only called after launch validation/finalization steps complete.

## State transitions

- `UNRESOLVED_CONFIG -> NORMALIZED_CONFIG -> PAGE_BOOTSTRAPPED`
- `PAGE_BOOTSTRAPPED -> AUTH_SETTLED | AUTH_TIMEOUT | SESSION_INVALID`
- `AUTH_SETTLED -> INJECTED -> VALIDATED -> CLIENT_READY`
- `SESSION_INVALID -> RECOVERY_ATTEMPTED -> PAGE_BOOTSTRAPPED | TERMINAL_FAILURE`
- `ANY_FATAL_ERROR -> CLEANUP_ATTEMPTED -> TERMINAL_FAILURE`
