# V5 Functional Parity Audit

Date: 2026-04-03

## Executive summary

This audit compares the **actual legacy source of truth** at `/Users/Mohammed/projects/tools/wa copy/src/` against the **active v5 implementation path** in `/Users/Mohammed/projects/tools/wa/packages/`. I did **not** use `legacy-documented/` or `.pseudo.md` as authority.

### Severity summary

- **P0 boot blockers:** 1
- **P1 feature/boot correctness blockers:** 10
- **P2 degraded parity gaps:** 9
- **P3 cosmetic / observability gaps:** 4

### Bottom line

v5 does **not** yet have true functional parity with v4 boot/runtime behavior. The largest risks are:

1. **Persisted session/auth boot parity is not restored in the active v5 path**.
2. **Legacy post-auth reinjection + ripe-session gating are missing**.
3. **The legacy WAPI event bridge is not restored**, so high-level listener APIs exist structurally but are not backed by equivalent runtime emissions.
4. **Patch/license lifecycle exists in v5, but the semantics differ materially** from legacy in several readiness-critical places.
5. **`Client.loaded()` parity is missing**, which removes late sync/listener/logout cleanup behavior that legacy depended on.

---

## Scope and method

### Legacy truth files reviewed

- `controllers/initializer.ts`
- `controllers/browser.ts`
- `controllers/init_patch.ts`
- `controllers/patch_manager.ts`
- `controllers/auth.ts`
- `controllers/launch_checks.ts`
- `controllers/script_preloader.ts`
- `controllers/events.ts`
- `controllers/data_dir_watcher.ts`
- `controllers/preload.js`
- `api/Client.ts` (`loaded()` in particular)
- `api/model/config.ts`
- `api/model/sessionInfo.ts`
- `api/model/events.ts`
- `lib/*`
- `index.ts`

### V5 implementation files reviewed

- `packages/core/src/createClient.ts`
- `packages/core/src/transport/Transport.ts`
- `packages/core/src/transport/initPatchScripts.ts`
- `packages/core/src/transport/ScriptLoader.ts`
- `packages/core/src/transport/httpClient.ts`
- `packages/core/src/transport/assets/*`
- `packages/core/src/session/index.ts`
- `packages/core/src/events/eventMap.ts`
- `packages/client/src/Client.ts`
- `packages/client/src/events/EventManager.ts`
- `packages/legacy/src/events/WapiBridge.ts`
- `packages/wa-automate/src/cli-runtime.ts`
- `packages/wa-automate/src/session/SessionManager.ts`
- `packages/wa-automate/src/server/lifecycle-manager.ts`
- `packages/cli/src/*`

### Important note on architecture

v5 is not a file-for-file rewrite. Functional parity therefore has to be evaluated at the **behavioral** level. “Different shape” is acceptable; “different outcome, different timing, missing guards, or weaker recovery” is **not**.

---

## Phase 1 — Legacy truth map

## `src/index.ts`

**Purpose**: Public entrypoint.

**Boot-time behavior**: Re-exports `create` from `controllers/initializer`, `Client`, model types, and event primitives.

**Runtime behavior**: None directly.

**Critical conditions**: None.

**Error handling**: None.

**External dependencies**: None relevant.

**Injection points**: None.

**Events emitted**: None directly.

**Events consumed**: None.

**Configuration consumed**: None.

---

## `src/controllers/initializer.ts`

**Purpose**: Master boot orchestrator for legacy startup.

**Boot-time behavior**:

1. Normalizes critical defaults: `eventMode`, `waitForRipeSession`, `multiDevice`, `deleteSessionDataOnLogout` (`51-68`).
2. Performs update notifier and optional self-update + process respawn (`70-97`).
3. Merges Docker env-derived config (`99-107`).
4. Optionally starts popup QR server (`125-130`).
5. Detects MD storage directory and mutates `multiDevice` if needed (`146-150`).
6. Launches page via `initPage()` (`153`).
7. Waits for WA runtime invariants and checks early injection eligibility (`181-224`).
8. Performs auth race against timeout (`226-233`).
9. Handles expired-session `NUKE` recovery (`234-247`).
10. Preloads license request early (`253-257`).
11. Handles auth timeout vs phone-out-of-reach distinction (`258-266`).
12. Runs QR or link-code auth flow (`269-299`).
13. Injects internal event handler (`300-303`).
14. On reauth, clears `window.Store`, optionally waits for ripe session, then **reinjects WAPI after auth** (`304-315`).
15. Validates `window.Store && window.Store.Msg` (`325-329`).
16. Preloads patch fetch, persists session data, uploads to cloud if configured, applies live patches, runs broken-method integrity check, constructs `Client`, injects license, injects init patch, then calls `client.loaded()` (`330-444`).

**Runtime behavior**:

- Installs page console/error listeners (`378-390`).
- Forces `eventMode` when logout cleanup is needed (`417`).
- Emits final `SUCCESS` only after finalization (`442`).

**Critical conditions**:

- Self-update path (`70-97`)
- Popup path (`125-130`)
- MD auto-detect path (`146-150`)
- Early inject allowed vs blocked (`216-224`)
- Expired session recovery (`234-247`)
- App offline vs auth timeout (`258-266`)
- Link-code vs QR (`274-276`)
- MD detected during QR triggers recursive restart (`283-289`)
- Invalid session triggers kill + recursive `create()` (`446-451`)

**Error handling**:

- Broad top-level catch (`453-475`)
- Kills page on failure (`460`)
- Special handling for `ProtocolError: Target closed` (`461-464`)
- Special MD timeout guidance (`465-467`)

**External dependencies**:

- update server via `update-notifier`
- optional S3 upload via `pico-s3`

**Injection points**:

- `injectApi(...)` (`219`, `314`)
- `injectInternalEventHandler(...)` (`302`)
- `getAndInjectLivePatch(...)` (`400-403`)
- `getAndInjectLicense(...)` (`425-427`)
- `injectInitPatch(...)` (`428-429`)

**Events emitted**:

- `appOffline`, `authTimeout` (`262`)
- `qrTimeout` (`291`)
- `successfulScan` (`297`)
- `sessionData`, `sessionDataBase64` (`355-356`)
- `DebugInfo` (`410`)
- `SUCCESS` (`442`)

**Events consumed**:

- QR and auth helpers via `QRManager`, `isAuthenticated`, `phoneIsOutOfReach`, `waitForRipeSession`

**Configuration consumed**:

- Includes at least: `eventMode`, `waitForRipeSession`, `multiDevice`, `deleteSessionDataOnLogout`, `skipUpdateCheck`, `keepUpdated`, `inDocker`, `popup`, `sessionId`, `disableSpins`, `userDataDir`, `sessionDataPath`, `throwErrorOnTosBlock`, `authTimeout`, `ignoreNuke`, `throwOnExpiredSessionData`, `oorTimeout`, `linkCode`, `qrTimeout`, `logInternalEvents`, `waitForRipeSessionTimeout`, `safeMode`, `skipSessionSave`, `sessionDataBucketAuth`, `logConsole`, `logConsoleErrors`, `restartOnCrash`, `skipPatches`, `skipBrokenMethodsCheck`, `hostNotificationLang`, `ensureHeadfulIntegrity`, `licenseKey`, `killClientOnLogout`.

---

## `src/controllers/browser.ts`

**Purpose**: Browser/page bootstrap, session restoration, request interception, and WAPI/script injection.

**Boot-time behavior**:

1. Preloads scripts (`31`).
2. Creates browser and page (`38-60`, `411-515`).
3. Sets UA, viewport, cache/CSP, optional stealth and block-resources behavior (`88-108`).
4. Installs response/request interception, page cache replay, telemetry blocking, and proxy logic (`137-189`).
5. Restores session data from env/config/file/cloud (`196-238`).
6. Injects localStorage values before navigation for legacy auth persistence (`214-232`).
7. Navigates to WA Web, exposes `ProgressBarEvent` and `CriticalInternalMessage`, injects progress observer (`245-271`).

**Runtime behavior**:

- Reinjects API on frame navigation if WAPI is missing (`64-84`).
- `injectPreApiScripts()` injects QR/hash helper assets (`354-366`).
- `injectWapi()` waits for `window.require`, injects `wapi.js`, retries until WAPI/Store integrity passes (`368-399`).
- `injectApi()` composes pre-api scripts + WAPI + launch asset (`402-409`).

**Critical conditions**:

- Cached WA page replay (`163-170`)
- Fast-auth detection via `_priority_components` request (`171-179`)
- MD vs non-MD localStorage injection (`212-233`)
- Chromium fallback on launch errors (`469-483`)

**Error handling**:

- Injection retries inside `injectWapi()` (`386-397`)
- Session file corruption handling around restore path

**External dependencies**:

- Puppeteer, stealth plugin, proxy helper, node-persist, chrome-launcher

**Injection points**:

- `evaluateOnNewDocument(...)` for auth tokens (`214-232`)
- `page.exposeFunction(...)` (`251-259`)
- `injectProgObserver(...)` (`260`)
- `page.addScriptTag` / `page.evaluate` through `addScript()` (`343-347`)

**Events emitted**:

- `internal_launch_progress`
- `critical_internal_message`
- auth completion event namespace via `EvEmitter(sessionId, 'AUTH')`

**Events consumed**: None substantial beyond browser page events.

**Configuration consumed**:

- Includes `proxyServerCredentials`, `viewport`, `cacheEnabled`, `blockCrashLogs`, `bypassCSP`, `headless`, `blockAssets`, `safeMode`, `useNativeProxy`, `multiDevice`, `sessionData`, `sessionDataBucketAuth`, `legacy`, `browserRevision`, `useChrome`, `executablePath`, `browserWsEndpoint`, `chromiumArgs`, `sessionDataPath`, `userDataDir`, `devtools`, `killProcessOnBan`.

---

## `src/controllers/auth.ts`

**Purpose**: Auth-state detection and QR/link-code lifecycle manager.

**Boot-time behavior**:

- `isAuthenticated()` races “needs to scan”, “inside chat”, and “session data invalid” (`19-97`).
- `waitForRipeSession()` waits for `window.isRipeSession()` (`70-78`).
- `phoneIsOutOfReach()` detects the “Trying to reach phone” state (`99-107`).

**Runtime behavior**:

- `QRManager` emits QR payloads, QR PNG, QR URL, MD detect signal, and supports both link-code and standard QR (`109-295`).

**Critical conditions**:

- QR max limit (`137-140`)
- ezQR upload (`171-187`)
- TOS block logging (`203-227`)
- MD detect during QR (`243-255`)

**Error handling**:

- QR image extraction is non-fatal (`191-197`)
- expose-function failure in QR flow is logged (`262-267`)

**External dependencies**:

- `qrcode-terminal`, `rxjs`, `axios`

**Injection points**:

- `page.exposeFunction(funcName, ...)` in QR helper (`262-267`)

**Events emitted**:

- `qrData`, `qrUrl`, raw QR PNG/string, `MD_DETECT`

**Events consumed**: WA DOM/runtime state only.

**Configuration consumed**:

- `qrMax`, `qrLogSkip`, `ezqr`, `throwErrorOnTosBlock`, `linkCode`, `multiDevice`, `sessionId`

---

## `src/controllers/patch_manager.ts`

**Purpose**: Remote patch fetch, cache/fallback behavior, and license payload injection.

**Boot-time behavior**:

- `getPatch()` fetches remote patches using WA version + package version, optionally from cache, and falls back to GitHub raw when needed (`15-79`).
- `getLicense()` resolves string/function/object keys, then validates with remote server (`114-143`).

**Runtime behavior**:

- `injectLivePatch()` applies all patch strings via `page.evaluate()` (`86-95`).
- `getAndInjectLicense()` injects returned license code into the page and checks `window.launchError` / `window.KEYTYPE` (`153-188`).

**Critical conditions**:

- `cachedPatch` decides whether disk cache participates (`27-45`)
- `ghPatch` changes the primary patch URL selection (`48-49`)
- license resolver supports function/object/string variants (`122-130`)

**Error handling**:

- Remote fetch fallback from CDN to GitHub raw (`54-57`)
- License fetch failures return false rather than throwing

**External dependencies**:

- `axios`, `crypto`, `fs`, `p-queue`

**Injection points**:

- patch scripts via `page.evaluate(...)` (`92`)
- license payload via `page.evaluate(data => eval(data), data)` (`168`)

**Events emitted**:

- Through spinner namespaces like `FETCH_PATCH`, `FETCH_LICENSE`

**Events consumed**: None.

**Configuration consumed**:

- `cachedPatch`, `ghPatch`, `licenseKey`, `disableSpins`

---

## `src/controllers/launch_checks.ts`

**Purpose**: WAPI integrity hash check and runtime Store-method repair check.

**Boot-time behavior**:

- `checkWAPIHash()` hashes bundled `wapi.js` (`14-17`).
- `integrityCheck()` enumerates Store method references from `wapi.js`, verifies they exist, attempts reinjection repair if needed, and optionally reports breakage upstream (`19-63`).

**Runtime behavior**: None beyond repair/report.

**Critical conditions**:

- If WAPI hash differs, legacy skips broken-method check upstream.
- If methods remain broken after repair, startup is degraded and emits warnings/report.

**Error handling**:

- Request-idle helper throws timeout on unresolved network activity (`72-79`).

**External dependencies**:

- `hasha`, `lodash.uniq`, dynamic `axios`

**Injection points**:

- WAPI reinjection via `injectApi(page, spinner, true)`

**Events emitted**: Spinner/log output.

**Events consumed**: Page request lifecycle.

**Configuration consumed**:

- Implicitly `skipBrokenMethodsCheck` upstream

---

## `src/controllers/script_preloader.ts`

**Purpose**: Asset preloader/cache for browser JS.

**Boot-time behavior**:

- Loads in this order: `jsSha.min.js`, `qr.min.js`, `base64.js`, `hash.js`, `wapi.js`, `launch.js` (`13-22`).

**Runtime behavior**:

- `getScript()` serves cached content.

**Critical conditions**: None.

**Error handling**: Propagates fs failures.

**External dependencies**: `fs`, `path`.

**Injection points**: None directly; used by `browser.ts`.

**Events emitted/consumed**: None.

**Configuration consumed**: None.

---

## `src/controllers/events.ts`

**Purpose**: Internal wildcard event bus and spinner/event bridge.

**Boot-time behavior**:

- Declares global `ev` bus and event namespacing helpers.

**Runtime behavior**:

- `EvEmitter.emit()` emits namespaced events.
- `Spin` mirrors spinner state transitions onto the event bus.

**Critical conditions**:

- Sensitive namespaces (`sessionData`, `sessionDataBase64`, `qr`) are suppressed from some logging paths.

**Error handling**: None substantive.

**External dependencies**: `eventemitter2`, `spinnies`.

**Injection points**: None.

**Events emitted**:

- All legacy startup namespaces such as `STARTUP`, `AUTH`, `qr`, `sessionData`, `sessionDataBase64`, `DebugInfo`, `SUCCESS`.

**Events consumed**: Downstream listeners and CLI integrations.

**Configuration consumed**:

- `disableSpins` indirectly

---

## `src/controllers/data_dir_watcher.ts`

**Purpose**: MD persistent profile watcher/compressor.

**Boot-time behavior**:

- Sets up watcher against `Local Storage` and `IndexedDB` under `userDataDir`.

**Runtime behavior**:

- Throttles compression checkpoints into `<session>.data.zst`.

**Critical conditions**:

- Requires `zstd`; otherwise bails.

**Error handling**:

- Compression failures are logged and non-fatal.

**External dependencies**:

- `chokidar`, `child_process`, `fs/promises`

**Injection points**: None.

**Events emitted/consumed**:

- Filesystem watch events only.

**Configuration consumed**:

- `userDataDir`, `sessionId`, `compressionIntervalMinutes`, `compressionOptions`, `cloudUploadOptions`

---

## `src/controllers/preload.js`

**Purpose**: Navigator spoof shim (`languages`, `plugins`).

**Boot-time behavior**: Patches navigator getters.

**Runtime behavior**: Static spoof only.

**Critical conditions**: None.

**Error handling**: None.

**External dependencies**: None.

**Injection points**: Preload-script style shim.

**Events emitted/consumed**: None.

**Configuration consumed**: None.

---

## `src/api/Client.ts` — `loaded()`

**Purpose**: Final runtime synchronization/finalization layer after startup.

**Boot-time behavior**:

1. Waits for `WAPI.isSessionLoaded()` (`373-379`).
2. Registers all simple listeners when `eventMode` is enabled (`380-382`).
3. Persists `PHONE_VERSION` (`383-386`).
4. Installs auto-emoji behavior when configured (`387-398`).
5. Installs logout cleanup path: wait queues empty, invalidate session, optionally delete session data, optionally kill client (`399-413`).
6. Marks `_loaded = true` (`414`).

**Runtime behavior**:

- Supports refresh/reinject/listener re-registration elsewhere in the class.

**Critical conditions**:

- `eventMode`
- `autoEmoji`
- `deleteSessionDataOnLogout`
- `killClientOnLogout`

**Error handling**:

- Queue cleanup and send path catches inside callbacks.

**Injection points**: None directly in `loaded()`.

**Events emitted**: Listener registration downstream.

**Events consumed**:

- `onMessage`, `onLogout` wiring.

**Configuration consumed**:

- `eventMode`, `autoEmoji`, `deleteSessionDataOnLogout`, `killClientOnLogout`

---

## `src/api/model/config.ts`

**Purpose**: Full legacy config contract.

**Boot-time behavior**: None directly; defines nearly every startup-affecting knob.

**Runtime behavior**: N/A.

**Critical conditions**: Many. The audit-relevant point is that legacy boot **actually uses** a very broad subset of this schema.

**Error handling**: N/A.

**External dependencies**: Type imports, docs.

**Injection points**: None.

**Events emitted/consumed**: None.

**Configuration consumed**: Broad startup surface including popup, update, proxy, Chrome, session restore, patching, license, retry, QR, MD, watcher, webhook, etc.

---

## `src/api/model/sessionInfo.ts`

**Purpose**: Structured startup/session debug info payload.

**Boot-time behavior**: Populated during startup and enriched after patch/license/bootstrap completion.

**Runtime behavior**: Carried into `Client` and patch/license requests.

**Critical conditions**: None.

**Error handling**: None.

**External dependencies**: None.

**Injection points**: None.

**Events emitted/consumed**: Emitted as `DebugInfo` via spinner in initializer.

**Configuration consumed**: None.

---

## `src/api/model/events.ts`

**Purpose**: Legacy `SimpleListener` registry.

**Boot-time behavior**: Used by `Client.loaded()` to register all simple listeners.

**Runtime behavior**: Drives event-mode autobinding.

**Critical conditions**: `eventMode` on client side.

**Error handling**: None.

**Injection points**: None.

**Events emitted/consumed**: Defines the listener taxonomy.

**Configuration consumed**: Indirect `eventMode`.

---

## `src/lib/*`

**Purpose**: Browser-runtime assets.

- `wapi.js`: main in-page WA API bundle.
- `launch.js`: post-WAPI bootstrap/finalizer.
- `qr.min.js`: QR helper.
- `base64.js`: helper asset.
- `hash.js`: hashing/helper asset.
- `jsSha.min.js`: helper asset.

**Boot-time behavior**:

- `qr.min.js` and `hash.js` are explicitly injected before WAPI.
- `base64.js` and `jsSha.min.js` are preloaded and available to script loader.
- `wapi.js` and `launch.js` are always part of active injection path.

**Critical conditions**:

- If these assets are missing or injected in the wrong order, legacy startup semantics change.

---

## Phase 2 — V5 implementation map

## `packages/core/src/createClient.ts`

**Purpose**: Main v5 orchestrator for core bootstrap, readiness, patch/license lifecycle, and final READY emission.

**Boot-time behavior**:

1. Builds logger, `HyperEmitter`, `SessionManager`, `Transport`, `PluginHost`, and plugin registrations (`136-199`).
2. `start()` emits `core.starting`, resets readiness, and transitions to `STARTING`/`AUTHENTICATING`.
3. Calls `transport.initialize()` then `transport.navigate()` (`411-412`).
4. Injects WAPI **before auth** (`416-420`).
5. Runs `post_injection` validation/repair loop and marks `runtimeUsable` satisfied (`422-434`).
6. Waits for authentication via `transport.waitForAuthentication()` (`436-451`).
7. Extracts post-auth session debug info (`453-467`).
8. Preloads and applies patches (`469-503`).
9. Preloads, checks, and applies license payloads (`505-552`).
10. Runs `post_overlay` validation/repair and sets finalization ready (`554-580`).
11. Sets state `READY` and emits `launch.client.finalize.after`, `core.started`, and `client.ready` (`582-598`).

**Runtime behavior**:

- `stop()` disposes plugins, closes transport, emits `core.stopped` (`601-610`).
- Exposes `getState`, `getReadiness`, screenshot, and arbitrary page script evaluation (`613-635`).

**Critical conditions**:

- If injection fails, bootstrap is fatal (`416-420`).
- Patch lifecycle blocks only when `blockingFailure` is true (`483-489`).
- License lifecycle treats `missing` as non-blocking, but `invalid`/`expired` as blocking (`512-544`).

**Error handling**:

- Centralized `emitFatalBootstrapError(...)` path for scoped bootstrap failures.
- Validation repair attempts stop after a failed second pass.

**External dependencies**:

- Core logger/emitter/plugin interfaces and driver abstraction.

**Injection points**:

- Delegated to `Transport`.

**Events emitted**:

- `core.starting`, `core.started`, `client.ready`, `launch.client.finalize.*`, `session.reinject.after`, and readiness/finalization-related events.

**Events consumed**:

- Plugin/event gateway subscribers.

**Configuration consumed**:

- Narrower than legacy: session id, driver, debug, headless, QR/auth timeout ms, executable path, browser args, license key, plugins.

---

## `packages/core/src/transport/Transport.ts`

**Purpose**: Browser/page lifecycle, WA navigation, WAPI injection, auth polling, patching, license flow, runtime validation.

**Boot-time behavior**:

- `initialize()` launches browser/page and sets a fixed Chrome 131 UA (`254-282`).
- `navigate()` goes to WA Web, exposes `ProgressBarEvent` and `CriticalInternalMessage`, and injects `prog_observer.js` (`284-339`).

**Runtime behavior**:

- `injectWapi()` injects `wapi.js`, probes runtime, injects `launch.js`, probes again, and returns success iff runtime exists (`341-387`).
- `probeRuntimeCapability()` and `validateRuntimeUsability()` define readiness probes (`389-427`).
- Patch preload/apply pipeline (`429-717`, `1457-1530`).
- License preload/check/apply pipeline (`720-1055`, especially `770-823`, `893-1055`).
- Auth settlement polling via DOM/shell and QR checks (`1057-1269`).
- `getSessionDebugInfo()` extracts WA version, host number, UA, platform, and derives `NUM_HASH` (`1542-1572`).

**Critical conditions**:

- Remote patches use disk cache **by default** unless `cachedPatch === false` (`1462-1469`).
- Fallback to GitHub raw is controlled by `ghPatchFallback`, not legacy `ghPatch` semantics (`1476-1488`).
- License server failures fall back to locally built metadata payloads (`813-823`, `1429-1443`).
- `INIT_PATCH_ARTIFACT` is handled as a deferred patch artifact and is not modeled as a mandatory blocking step in the same way legacy used it.

**Error handling**:

- Expose-function and progress-observer failures are non-fatal (`314-329`).
- Patch fetch failure falls back to builtin-only behavior (`450-456`).
- License server failure falls back to local metadata (`813-823`).
- Auth polling swallows evaluation errors and keeps polling (`1260-1262`).

**External dependencies**:

- Driver interface, node fs/path/crypto, fetch helpers.

**Injection points**:

- `page.exposeFunction(...)` for progress/critical messages (`302-313`)
- `injectProgObserver(...)` (`323`)
- `page.evaluateScript(wapi.js)` (`356-357`)
- `page.evaluateScript(launch.js)` (`365-366`)
- deferred `injectInitPatch(...)` and `injectInternalEventHandler(...)` during patch apply (`629-634`)

**Events emitted**:

- Typed bootstrap lifecycle events: `launch.browser.*`, `launch.navigation.*`, `launch.auth.*`, `launch.patch.*`, `patch.*`, `launch.license.*`, `license.*`
- Untyped cast events: `internal_launch_progress`, `critical_internal_message` (`305`, `310`)

**Events consumed**: None directly from browser runtime besides page polling.

**Configuration consumed**:

- `waWebUrl`, `headless`, `qrTimeoutMs`, `authTimeoutMs`, `qrPollingMs`, `executablePath`, `browserArgs`, `patchConfig`, `licenseConfig`

---

## `packages/core/src/transport/initPatchScripts.ts`

**Purpose**: Asset injector for `init_patch.js` and `prog_observer.js`.

**Boot-time behavior**: Lazy-loads assets.

**Runtime behavior**:

- `injectInitPatch(page)` evaluates `init_patch.js`.
- `injectProgObserver(page)` evaluates `prog_observer.js`.
- `injectInternalEventHandler(page)` only logs `internal_event_handler_injected`.

**Critical conditions**:

- The internal event handler is effectively a stub.

**Error handling**: Propagates script load/eval failures.

**Injection points**: `page.evaluateScript(...)` and one `console.log(...)` call.

**Events emitted**: None directly.

**Configuration consumed**: None.

---

## `packages/core/src/transport/ScriptLoader.ts`

**Purpose**: v5 asset preloader/cache.

**Boot-time behavior**:

- Only preloads `init_patch.js`, `prog_observer.js`, `wapi.js`, `launch.js` (`27-33`).

**Runtime behavior**:

- `loadAll`, `load`, `get`, `has`, `flush`, `getManifest`.

**Critical conditions**:

- Legacy helper assets (`qr.min.js`, `base64.js`, `hash.js`, `jsSha.min.js`) are not in the default set.

**Error handling**: Throws when assets are missing or not preloaded.

---

## `packages/core/src/transport/httpClient.ts`

**Purpose**: Remote patch fetch + license validation using native fetch.

**Boot-time behavior**:

- Fetches patches with retries/fallback and validates license payloads.

**Runtime behavior**:

- `fetchPatches(...)` appends `wv` and `wav` query params and supports fallback URL.
- `validateLicense(...)` POSTs body and normalizes `false`/empty responses.

**Critical conditions**:

- 4xx responses are not retried.

**Error handling**:

- Uses `AbortController` for timeout.

---

## `packages/core/src/session/index.ts`

**Purpose**: v5 session manager and readiness state.

**Boot-time behavior**:

- Initializes readiness requirements: `runtimeUsable`, `patchLifecycle`, `licenseLifecycle`, `finalization` (`233-257`).

**Runtime behavior**:

- Tracks `state`, validation history, repair history, finalization, readiness snapshot (`87-267`).
- Emits `session.state.changed` on state transitions (`111-126`).

**Critical conditions**:

- `ready` only becomes true when `state === 'READY'`, no blockers remain, no pending requirements remain, and finalization is `ready` (`202-230`).

**Error handling**: None beyond state bookkeeping.

**External dependencies**: event emitter/logger.

**Injection points**: None.

**Events emitted**: `session.state.changed`.

**Events consumed**: None.

**Configuration consumed**: sessionId and optional `store`.

**Important absence**:

- `SessionStore` exists only as an interface; active code shown here does not actually persist or restore session data.

---

## `packages/core/src/events/eventMap.ts`

**Purpose**: Typed event contract for v5.

**Runtime behavior**:

- Defines public/internal/sensitive event classification.
- Includes listener-level events like `message.received`, `message.any`, `ack.changed`, `session.logout`.

**Important absence**:

- The active core path emits mostly bootstrap/patch/license/session-state events; this file defines runtime listener events more broadly than the active core appears to produce.

---

## `packages/legacy/src/events/WapiBridge.ts`

**Purpose**: Explicit legacy reference implementation of browser-to-node event bridging.

**Runtime behavior**:

- Registers Puppeteer exposed functions for `__onMessage`, `__onAnyMessage`, `__onMessageDeleted`, `__onAck`, `__onReaction`, `__onStateChanged`, `__onChatState`, `__onLogout`, `__onParticipantsChanged`, `__onAddedToGroup` (`20-43`).

**Parity significance**:

- This is the clearest concrete model for the missing v5 bridge.

---

## `packages/client/src/Client.ts`

**Purpose**: High-level facade over core client/transport plus listener convenience methods and bound method modules.

**Boot-time behavior**:

- Constructor binds method modules and builds `ListenerManager` (`91-105`).

**Runtime behavior**:

- `start()` and `stop()` simply delegate to core (`154-163`).
- `onMessage`, `onAck`, `onStateChanged`, `onAnyMessage`, `onMessageDeleted`, `onLogout` delegate to listener manager (`261-301`).
- Binds large method surface including `sendFile`, `editMessage`, `react`, group/chat/contact methods (`324-340`).

**Critical conditions**:

- This facade only works if core actually emits the mapped runtime events and if WAPI actually implements the invoked browser methods.

**Error handling**: Minimal wrapper-level behavior.

**Important absence**:

- There is no v5 equivalent of legacy `loaded()` here.

---

## `packages/wa-automate/src/cli-runtime.ts`

**Purpose**: Main v5 Easy API CLI boot path.

**Boot-time behavior**:

1. Parses CLI args into a limited override set (`34-123`).
2. Resolves config and forces defaults like `disableSpins: true`, `apiLifecycle: 'hybrid'`, `socketMode: true`, `host: '0.0.0.0'`, `port: 8002` (`160-175`).
3. Starts `WAServer` **before** client start (`191-195`).
4. Creates core client with only a small subset of config forwarded (`199-210`).
5. Sets readiness provider and subscribes to `launch.auth.qr.generated` only for terminal QR display/server QR state (`212-227`).
6. Wraps core client with `ClientFacade`, installs into server, then calls `await client.start()` (`229-236`).

**Runtime behavior**:

- PM2 mode startup path exists (`244-280`).
- Unsupported legacy flags produce compatibility warnings rather than active behavior (`79-103`, `186-189`).

**Critical conditions**:

- Many legacy flags are acknowledged but not restored.

**Error handling**:

- PM2 not found path logs and returns.

**External dependencies**:

- `qrcode-terminal`, config resolver, Puppeteer driver, WAServer.

**Injection points**: None directly; all browser injection delegated to core.

**Events emitted**: None directly; subscribes to QR generated events.

**Events consumed**:

- `launch.auth.qr.generated`

**Configuration consumed**:

- Narrow set including `sessionId`, `port`, `host`, `apiKey`, `logLevel`, `ezqr`, `socketMode`, `headless`, `useChrome`, `logConsole`, `dashboard`, `dashboardPort`, `licenseKey`, `webhook`, `proxyHost`, `proxyToken`, `qrTimeout`, `authTimeout`, `chromiumArgs`, `qrLogSkip`

---

## Phase 3 — Gap analysis table

| Gap | Legacy evidence | V5 evidence | Status | Functional impact | Suggested fix |
|---|---|---|---|---|---|
| Post-auth reinjection is mandatory in legacy | `initializer.ts:312-315` | v5 injects before auth at `createClient.ts:416-420`; no unconditional post-auth reinjection | ❌ MISSING | Authenticated runtime can diverge from pre-auth injected state; stale runtime can survive into READY | Reintroduce unconditional post-auth reinjection stage before final validation |
| Ripe-session wait on reauth | `initializer.ts:304-310`, `auth.ts:70-78` | No active `waitForRipeSession` equivalent in `createClient.ts`/`Transport.ts` | ❌ MISSING | Reauth/headless sessions can be finalized too early | Add explicit ripe-session gate for reauth path |
| Session expiry `NUKE` handling | `initializer.ts:234-247`, `auth.ts:80-97` | `waitForAuthentication()` only returns `authenticated/qr_timeout/auth_timeout` (`1159-1269`) | ❌ MISSING | Expired session data becomes generic auth failure instead of self-healing recovery | Add invalid-session detection + recursive restart/invalidation path |
| Phone-out-of-reach differentiation | `initializer.ts:258-266`, `auth.ts:99-107` | Generic auth timeout only in `createClient.ts:445-450`, `Transport.ts:1246-1258` | ❌ MISSING | Loses important failure classification and downstream behavior | Add “app offline” branch and dedicated event/status |
| Link-code auth flow | `initializer.ts:274-276`, `auth.ts:200-221` | Event types exist, but no link-code implementation in active auth loop | ❌ MISSING | One login mode from legacy is absent | Implement link-code branch in transport auth flow |
| Legacy helper assets (`qr.min.js`, `hash.js`, `base64.js`, `jsSha.min.js`) | `script_preloader.ts:13-23`, `browser.ts:354-366` | `ScriptLoader.ts:27-33` only loads `init_patch.js`, `prog_observer.js`, `wapi.js`, `launch.js` | ❌ MISSING | Early bootstrap helpers and compatibility shims are dropped | Restore required assets or prove each is obsolete with tests |
| Internal event handler injection | `initializer.ts:300-303`, `init_patch.ts:26-28` | Stub only at `initPatchScripts.ts:54-56` | ❌ MISSING | Internal browser-to-node event behavior not restored | Replace stub with real bridge or remove contract and downstream dependencies explicitly |
| Explicit browser-to-node WAPI bridge | `packages/legacy/src/events/WapiBridge.ts:20-43` | No equivalent bridge found in active core | ❌ MISSING | Client listener surface exists without runtime backing | Implement WapiBridge equivalent in active core |
| `Client.loaded()` finalization | `api/Client.ts:373-415` | No equivalent in `packages/client/src/Client.ts`; READY emitted directly from core at `createClient.ts:582-598` | ❌ MISSING | Loses session sync wait, listener autobind, autoEmoji, logout cleanup/kill logic | Add post-bootstrap finalizer or explicit equivalent phases |
| Session persistence from file/env/cloud | `browser.ts:196-238`, `initializer.ts:355-374` | Active CLI only forwards limited options at `cli-runtime.ts:199-210`; session manager store is interface-only in `core/src/session/index.ts:74-85` | ❌ MISSING | Reboot parity and session reuse are broken/degraded | Thread session persistence inputs into active boot path and implement store restore/save |
| Disk patch cache default | `patch_manager.ts:27-45` only when `cachedPatch` true | v5 cache active unless `cachedPatch === false` at `Transport.ts:1462-1469` | ⚠️ PARTIAL | Different cache freshness semantics can serve stale patches unexpectedly | Match legacy opt-in behavior or rename config to reflect changed semantics |
| `ghPatch` primary source semantics | `patch_manager.ts:48-49` | v5 only has fallback toggle `ghPatchFallback` at `1476-1488` | ❌ MISSING | Operators cannot force GitHub raw as primary like legacy | Restore primary-source override or clearly deprecate with migration handling |
| License key resolver supports number-aware object/function forms | `patch_manager.ts:122-130` | v5 resolves only by `sessionId` (`1372-1397`) | ⚠️ PARTIAL | Multi-number/session keyed license setups can resolve incorrectly | Extend resolver signature to support host number after auth |
| License server failure fallback | Legacy requires server payload or failure semantics in `patch_manager.ts:135-188` | v5 falls back to synthetic metadata payload (`813-823`, `1429-1443`) | 🔄 REDESIGNED | Can produce READY with metadata-only license application; may not unlock equivalent behavior | Make readiness depend on real capability unlock, or classify offline metadata mode distinctly |
| Init patch is unconditional late finalizer | `initializer.ts:428-431` | Deferred patch artifact applied during patch stage (`629-634`) and modeled less strictly | ⚠️ PARTIAL | Ordering and blocking semantics differ | Move init patch back into finalization-critical path or prove equivalence |
| Broken-method integrity check | `initializer.ts:391-407`, `launch_checks.ts:19-63` | No active equivalent in active v5 boot | ❌ MISSING | v5 can report READY without legacy Store-method repair step | Port integrity check or replace with equivalent runtime contract tests |
| Host notification language injection | `initializer.ts:396-399` | No active equivalent located | ❌ MISSING | Locale-sensitive host notification behavior lost | Restore injection or deprecate explicitly |
| Popup QR server | `initializer.ts:125-130`, `controllers/popup/*` | CLI uses terminal QR + `/qr` API response instead | 🗑️ DEPRECATED | Intentional replacement appears acceptable per prompt context | Keep documented as intentional non-goal |
| Event bus wildcard semantics | `controllers/events.ts`, CLI `ev.on('**', ...)` patterns | v5 has typed `HyperEmitter` + event map, no equivalent wildcard webhook bus proven | 🔄 REDESIGNED | Some integration patterns may no longer work | Decide whether wildcard event parity is required or intentionally replaced |
| Runtime event inventory vs facade API surface | Legacy facade backed by WAPI bridge + listeners | v5 `Client.ts` exposes listeners and methods, but core emission/`wapi.js` backing is incomplete | ⚠️ PARTIAL | Methods/listeners may compile but silently fail at runtime | Audit each bound method and listener against actual runtime bridge support |

---

## Phase 4A — Boot sequence ordering

### Legacy order

1. Normalize defaults and update behavior
2. Optional popup/startup UX
3. Launch browser/page
4. Wait for WA internals and early injection gate
5. Optional early WAPI injection
6. Auth race / QR / link-code / NUKE handling
7. Inject internal handler
8. Optional ripe-session wait on reauth
9. **Reinject WAPI after auth**
10. Validate `Store.Msg`
11. Persist/export session data
12. Apply live patch
13. Integrity/broken-method check
14. Construct `Client`
15. Apply license
16. Apply init patch
17. `client.loaded()`
18. Emit `SUCCESS`

### V5 order

1. Construct core/session/transport/plugins
2. Launch browser/page
3. Navigate to WA Web
4. Expose progress callbacks / inject progress observer
5. **Inject WAPI before auth**
6. Run post-injection validation/repair
7. Auth polling / QR generation
8. Extract post-auth debug info
9. Preload/apply patches (including deferred init patch)
10. Preload/check/apply license
11. Run post-overlay validation/repair
12. Set `READY`
13. Emit `core.started` + `client.ready`

### Mismatches

- v5 lacks legacy’s unconditional **post-auth reinjection**.
- v5 lacks legacy’s **ripe-session** wait.
- v5 moves **init patch** earlier into patch apply instead of after client construction.
- v5 emits READY **without a `Client.loaded()` equivalent**.
- v5 has no explicit **session persistence/export** stage in the active path.

---

## Phase 4B — Browser injection inventory

| Legacy injection | File:line | V5 equivalent | Status |
|---|---|---|---|
| `evaluateOnNewDocument` session tokens | `browser.ts:214-232` | None found in active path | ❌ |
| `page.exposeFunction('ProgressBarEvent', ...)` | `browser.ts:251-254` | `Transport.ts:302-306` | ✅ PARITY |
| `page.exposeFunction('CriticalInternalMessage', ...)` | `browser.ts:255-259` | `Transport.ts:308-310` | ✅ PARITY |
| `injectProgObserver()` | `browser.ts:260` | `Transport.ts:323-329` | ✅ PARITY |
| Inject `qr.min.js` | `browser.ts:357-363` | None | ❌ |
| Inject `hash.js` | `browser.ts:359-362` | None | ❌ |
| Inject `wapi.js` | `browser.ts:382-399` | `Transport.ts:356-357` | ✅ PARITY |
| Inject `launch.js` | `browser.ts:402-409` | `Transport.ts:365-366` | ✅ PARITY |
| `injectInternalEventHandler()` | `initializer.ts:302`, `init_patch.ts:26-28` | `initPatchScripts.ts:54-56` stub only | ⚠️ PARTIAL |
| `injectInitPatch()` | `initializer.ts:428-429` | `Transport.ts:629-634` deferred artifact | ⚠️ PARTIAL |
| WAPI event exposed callbacks like `__onMessage`, `__onAck`, etc. | `packages/legacy/src/events/WapiBridge.ts:20-43` | None found in active core | ❌ |

---

## Phase 4C — Remote fetch inventory

| Legacy fetch | URL/endpoint | Purpose | V5 equivalent | Status |
|---|---|---|---|---|
| Patch fetch | `patch_manager.ts:48-57` CDN + GitHub raw fallback | Live patch lifecycle | `Transport.ts:1481-1488` + `httpClient.ts` | ✅ PARITY (semantic differences remain) |
| License check | `patch_manager.ts:135` via `pkg.licenseCheckUrl` | License validation | `Transport.ts:770-780` + `httpClient.ts:89-120` | ✅ PARITY (semantic differences remain) |
| QR cloud upload | `auth.ts:171-187` to `https://qr.openwa.cloud/` | ezQR publish | None found in active v5 boot | ❌ |
| Session data cloud upload | `initializer.ts:361-373` | Persist session to bucket | None found in active v5 boot | ❌ |
| Session data cloud restore | `browser.ts:197-209` | Restore persisted session | None found in active v5 boot | ❌ |
| Broken method report | `launch_checks.ts:54-59` | Remote broken-method report | None found | ❌ |

---

## Phase 4D — Configuration key parity

### Clearly respected in active v5

- `sessionId`
- `headless`
- `authTimeout`
- `qrTimeout`
- `chromiumArgs`
- `licenseKey`
- `useChrome` / `executablePath`
- `qrLogSkip`

### Present in legacy boot but not wired through active v5 boot path

- `popup`
- `skipUpdateCheck`
- `keepUpdated`
- `sessionData`
- `sessionDataPath`
- `sessionDataBucketAuth`
- `waitForRipeSession`
- `waitForRipeSessionTimeout`
- `oorTimeout`
- `linkCode`
- `qrMax`
- `blockCrashLogs`
- `cacheEnabled`
- `proxyServerCredentials`
- `useNativeProxy`
- `browserWsEndpoint`
- `browserRevision`
- `corsFix`
- `hostNotificationLang`
- `skipBrokenMethodsCheck`
- `ensureHeadfulIntegrity`
- `deleteSessionDataOnLogout`
- `killClientOnLogout`
- `ignoreNuke`

### Changed semantics

- `cachedPatch`: legacy opt-in vs v5 effectively default-on
- `ghPatch`: legacy primary-source switch vs v5 fallback-only switch

---

## Phase 4E — Event emission parity

### Legacy boot events not proven in active v5

- `appOffline`
- `sessionData`
- `sessionDataBase64`
- `DebugInfo`
- `SUCCESS`
- `MD_DETECT`
- link-code specific auth outputs

### Present or approximately replaced in v5

- QR generated: legacy QR flow → `launch.auth.qr.generated`
- QR timeout/auth timeout: present but simplified
- session state change: present as typed event
- progress/critical internal boot messages: present, but emitted through untyped casts

### Key gap

Legacy’s runtime event bridge (`__onMessage`, `__onAck`, etc.) is not restored in active v5, so listener parity is currently not demonstrably complete.

---

## Phase 4F — Error handling parity

### Legacy-specific error/retry behavior missing or weakened in v5

- Expired session `NUKE` recovery
- Phone-out-of-reach distinction
- Ripe-session wait fallback warning path
- Broken-method integrity repair/report path
- Session invalid -> kill + recursive `create()` restart path
- QR max enforcement
- Link-code failure paths

### V5-specific redesigns

- Centralized readiness/finalization model is stronger in structure than legacy.
- Patch/license lifecycle now has typed outcome objects.
- But license fallback to metadata injection can weaken real-behavior guarantees.

---

## Phase 4G — `lib/` asset injection parity

| Legacy asset | Legacy role | Legacy timing | V5 presence | V5 timing | Status |
|---|---|---|---|---|---|
| `wapi.js` | Main browser API/runtime | Before `launch.js` | Yes | Same relative order | ✅ |
| `launch.js` | Post-WAPI bootstrap | After `wapi.js` | Yes | Same relative order | ✅ |
| `qr.min.js` | QR helper | Pre-WAPI | No | N/A | ❌ |
| `hash.js` | Helper/hash | Pre-WAPI | No | N/A | ❌ |
| `base64.js` | Helper | Preloaded legacy | No | N/A | ❌ |
| `jsSha.min.js` | Helper | Preloaded legacy | No | N/A | ❌ |
| `prog_observer.js` | Internal progress observer | Boot-time after exposeFunction | Yes | Similar | ✅ |
| `init_patch.js` | Late finalization patch | After license + client creation | Yes | Earlier/deferred during patch phase | ⚠️ |

---

## Phase 5 — Gapfiller plan re-audit

Source reviewed: `.sisyphus/plans/gapfiller.md`

## Task 1 — Build bootstrap contract test harness

- ✅ **MET** — v5 has contract tests around bootstrap phases and reinjection behavior (`packages/core/test/unit/bootstrapContract.test.ts` was surfaced in search results).
- ⚠️ **PARTIALLY MET** — tests exist, but they do not themselves prove parity against the real legacy source; they prove only the new contract.

## Task 2 — Replace ceremonial runtime injection with real activation

- ✅ **MET** — `Transport.injectWapi()` performs actual script evaluation + capability probing (`Transport.ts:341-387`).
- ⚠️ **PARTIALLY MET** — activation is real, but legacy’s pre-api helper asset layer and post-auth reinjection are still missing.

## Task 3 — Restore real live patch lifecycle

- ✅ **MET** — typed preload/apply lifecycle exists (`Transport.ts:429-717`, `1457-1530`).
- ⚠️ **PARTIALLY MET** — semantics differ from legacy in cache defaulting and init patch handling.

## Task 4 — Restore real license-patch lifecycle

- ✅ **MET** — preload/check/apply lifecycle exists (`Transport.ts:720-1055`).
- ⚠️ **PARTIALLY MET** — fallback to metadata-only injection means “ready” may not mean the same thing as legacy’s real payload path.

## Task 5 — Rebuild session validation, repair, and finalization depth

- ✅ **MET** — v5 has explicit validation/repair/finalization state in `createClient.ts` + `core/src/session/index.ts`.
- ❌ **NOT MET** — this does not restore legacy `Client.loaded()` behavior, logout cleanup semantics, or invalid-session recovery depth.

## Task 6 — Recalibrate readiness to lower-level truth

- ✅ **MET** — readiness gating is materially improved in structure (`createClient.ts:565-598`, `session/index.ts:202-230`).
- ⚠️ **PARTIALLY MET** — truthfulness still depends on weaker semantics than legacy for license fallback and missing legacy post-auth reinjection / integrity checks.

## Task 7 — Reassess top-level `wa-automate` export breadth

- ⚠️ **PARTIALLY MET** — exports exist and architecture is split, but runtime correctness gaps remain, so the “after runtime correctness is restored” condition is not fully satisfied.

### Gapfiller verdict

The gapfiller plan is **implemented at contract/runtime-framework depth**, but **not at full behavioral legacy parity depth**. It improved v5 materially, yet several legacy-critical behaviors remain absent.

---

## Phase 6 — Risk-ranked fix list

## P0 — Missing browser-to-node runtime event bridge

- **Legacy**: Explicitly exposes `__onMessage`, `__onAnyMessage`, `__onAck`, `__onLogout`, etc. and routes them into the local event system (`packages/legacy/src/events/WapiBridge.ts:20-43`).
- **V5**: Event vocabulary and client listener facade exist, but I found no equivalent active bridge in core.
- **Impact**: Message/event listeners can appear present but not actually receive parity-equivalent runtime events.
- **Fix**:
  1. Implement active v5 bridge registration in core transport after WAPI injection.
  2. Ensure `wapi.js` callback names and exposed node handlers match.
  3. Verify `message.received`, `message.any`, `ack.changed`, `session.logout`, etc. emit in real runtime.
- **Files to change**:
  - `packages/core/src/transport/Transport.ts`
  - likely new bridge module in `packages/core/src/events/` or `packages/core/src/transport/`
  - possibly `packages/core/src/transport/assets/wapi.js`

## P1 — No active session persistence parity

- **Legacy**: Restores from file/env/cloud before navigation and persists session data after auth (`browser.ts:196-238`, `initializer.ts:355-374`).
- **V5**: Active CLI forwards only a narrow config subset (`cli-runtime.ts:199-210`); core session store is interface-only (`session/index.ts:74-85`).
- **Impact**: Session reuse, cloud restore/save, and reboot parity are broken or heavily degraded.
- **Fix**:
  1. Thread `sessionData`, `sessionDataPath`, `sessionDataBucketAuth`, `userDataDir` into active create path.
  2. Implement restore-before-navigation and persist-after-auth stages.
  3. Add end-to-end restart tests proving QR is not required after successful persistence.
- **Files to change**:
  - `packages/wa-automate/src/cli-runtime.ts`
  - `packages/core/src/createClient.ts`
  - `packages/core/src/transport/Transport.ts`
  - `packages/core/src/session/index.ts` or new persistence module

## P1 — Missing post-auth reinjection + ripe-session gate

- **Legacy**: Reinjects after auth and optionally waits for ripe session (`initializer.ts:304-315`).
- **V5**: Injects only before auth and validates later (`createClient.ts:416-434`).
- **Impact**: Runtime can be finalized on weaker assumptions than legacy, especially for reauth/headless edge cases.
- **Fix**:
  1. Add explicit reauth-aware stage after authentication.
  2. Reintroduce `waitForRipeSession`-style gate for reauth path.
  3. Re-run post-auth injection before final validation.
- **Files to change**:
  - `packages/core/src/createClient.ts`
  - `packages/core/src/transport/Transport.ts`

## P1 — Missing invalid-session `NUKE` recovery

- **Legacy**: Detects stale session data and recovers recursively (`initializer.ts:234-247`, `auth.ts:80-97`).
- **V5**: No equivalent auth settlement outcome.
- **Impact**: Stale sessions degrade into generic auth failure instead of deterministic recovery.
- **Fix**:
  1. Add invalid-session detection script checks.
  2. Add session invalidation/delete + restart path.
  3. Distinguish this from ordinary auth timeout.
- **Files to change**:
  - `packages/core/src/transport/Transport.ts`
  - `packages/core/src/createClient.ts`

## P1 — Missing `Client.loaded()` equivalence

- **Legacy**: Waits for sync completion, registers listeners, sets phone version, autoEmoji, logout cleanup (`api/Client.ts:373-415`).
- **V5**: No such phase exists in `packages/client/src/Client.ts`.
- **Impact**: Startup may complete before equivalent session sync/listener/logout semantics are active.
- **Fix**:
  1. Add a client-level post-bootstrap finalizer or explicit replacement hooks in core.
  2. Restore listener autobind and logout cleanup semantics intentionally.
  3. Decide which legacy behaviors are retained vs intentionally dropped.
- **Files to change**:
  - `packages/client/src/Client.ts`
  - `packages/core/src/createClient.ts`

## P1 — Broken-method integrity gate absent

- **Legacy**: Validates WAPI/Store method integrity and attempts repair (`launch_checks.ts:19-63`, `initializer.ts:391-407`).
- **V5**: No active equivalent located.
- **Impact**: READY can be emitted despite Store-method drift that legacy tried to repair/report.
- **Fix**:
  1. Port integrity enumeration/repair logic or replace it with equivalent capability checks.
  2. Make final readiness depend on it for required methods.
- **Files to change**:
  - `packages/core/src/createClient.ts`
  - `packages/core/src/transport/Transport.ts`
  - possibly new `packages/core/src/transport/launchChecks.ts`

## P2 — License lifecycle truthfulness weaker than legacy

- **Legacy**: Server-returned payload path is the real unlock path.
- **V5**: Server failure falls back to metadata-only payload (`Transport.ts:813-823`, `1429-1443`).
- **Impact**: READY may not imply the same licensed capabilities as legacy.
- **Fix**:
  1. Separate “metadata present” from “feature unlock confirmed”.
  2. Add post-license capability assertions if parity requires real unlock.

## P2 — Patch semantics changed

- **Legacy**: `cachedPatch` opt-in; `ghPatch` changes primary source.
- **V5**: cache default-on; GitHub only fallback.
- **Impact**: Operational behavior differs in stale-patch / source-selection scenarios.
- **Fix**:
  1. Match legacy semantics or add migration-compatible config mapping.

## P2 — Internal event handler is stubbed

- **Legacy**: real injection step.
- **V5**: `console.log(...)` only.
- **Impact**: Missing internal browser instrumentation/bridging.
- **Fix**: either implement fully or remove the placeholder and deprecate the contract honestly.

## P2 — Runtime method facade wider than runtime backing

- **Legacy**: facade and WAPI were coupled.
- **V5**: some `Client` methods reference WAPI functions not present or overwritten in shipped `wapi.js`.
- **Impact**: Silent runtime failures on apparently supported API surface.
- **Fix**:
  1. Audit each client method against shipped `wapi.js`.
  2. Remove or mark unsupported methods until backed.
  3. Add contract tests per bound method.

## P3 — Legacy startup observability events are reduced

- Missing parity for `sessionData`, `sessionDataBase64`, `DebugInfo`, `SUCCESS`, `appOffline`, `MD_DETECT`.
- Impact is mostly on integrations/debugging, but some downstream behavior may depend on them.

---

## Oracle cross-check

Oracle’s independent assessment aligned with the main findings:

- the live v5 boot path is missing legacy-grade session persistence wiring,
- readiness can overstate real parity if license fallback succeeds structurally but not behaviorally,
- dormant compatibility code (`browser.ignore.ts`) should not be mistaken for restored runtime behavior,
- the highest-value proof points are restart-with-persistence, unreachable-license-server boot, init-patch failure behavior, and stale-session recovery.

---

## Final verdict

v5 is **closer to a redesigned bootstrap contract** than to **true behavioral parity** with v4. The rewrite has stronger typed lifecycle modeling than legacy, but it still lacks several concrete production behaviors that legacy relied on: persisted auth/session restore, post-auth reinjection, ripe-session gating, invalid-session recovery, broken-method repair, runtime event bridging, and `Client.loaded()` finalization.

If the goal is **true v4 functional parity**, the next work should focus on the P0/P1 items above before any export-surface or product-layer cleanup.
