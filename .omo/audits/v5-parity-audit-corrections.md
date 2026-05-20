# V5 Parity Audit — Corrections & Addendum

Date: 2026-04-03 (second pass)

## Purpose

This document contains corrections, missed items, and calibrations from a second-pass review of `.sisyphus/audits/v5-parity-audit.md`. The original audit was thorough but missed some nuances and contained a few inaccuracies that affect priority ranking and fix strategy.

---

## Section-by-section corrections

### Phase 1 — Legacy truth map: `src/controllers/initializer.ts`

**Correction 1: Default semantics for `eventMode`**

The audit correctly notes that `eventMode` defaults to `true` in legacy (line 62-64: `if(!config || config?.eventMode!==false) config.eventMode = true`). However, it fails to highlight that this means **eventMode was already effectively mandatory in v4 too** — the only way to disable it was to explicitly pass `eventMode: false`. The v5 decision to make eventMode permanently `true` is therefore a *formalization* of existing behavior, not a breaking change. The audit's claim that "eventMode cannot be turned off" should be marked as **✅ INTENTIONAL PARITY**, not a gap.

**Correction 2: Missing defaults that ARE actively used**

The audit lists the defaults at lines 51-68 but misses the behavioral significance of three specific ones:

```typescript
config.waitForRipeSession = true;          // line 66 — always-on by default
config.multiDevice = true;                 // line 67 — always-on by default  
config.deleteSessionDataOnLogout = true;   // line 68 — always-on by default
```

These three are not just defaults — they are **guardrails** that legacy enforces unless explicitly overridden. The v5 audit should track each independently:

| Config | Legacy default | V5 status |
|---|---|---|
| `waitForRipeSession: true` | Enforced, actively used in auth flow | ❌ Missing — no ripe session gate |
| `multiDevice: true` | Enforced, affects localStorage injection | N/A — multi-device is the only mode now |
| `deleteSessionDataOnLogout: true` | Enforced, triggers `Client.loaded()` cleanup | ❌ Missing — no logout cleanup path in v5 `Client.ts` |

---

### Phase 1 — `src/controllers/browser.ts`

**Correction 3: Session data restore is NOT about `sessiondata.json` files**

The audit correctly identifies the session restore path at `browser.ts:196-238`, but the framing is misleading. In the multi-device era, the legacy `sessionData` (localStorage tokens stored in JSON and re-injected via `evaluateOnNewDocument`) is **largely obsolete**. The real session persistence mechanism is `userDataDir` — Chromium's persistent profile directory that contains `Local Storage/`, `IndexedDB/`, cookies, etc.

The audit should clarify:

- **`sessionData` JSON restore** (legacy `browser.ts:196-238`): Obsolete for MD. Can be dropped without functional regression for MD sessions.
- **`userDataDir` profile persistence** (Chromium arg): This is the **actual** way sessions survive restarts in MD. V5 already passes `userDataDir` through to Puppeteer launch args via the driver. **This is NOT a gap.**
- **`data_dir_watcher.ts` compression**: The legacy feature that watches `userDataDir` and creates zstd snapshots IS a gap, but it's **P3 at best** — it's a nice-to-have, not a boot-blocking issue.

**Revised session persistence assessment:**

| Mechanism | Legacy | V5 | Status |
|---|---|---|---|
| `userDataDir` (Chromium profile) | ✅ Passed through | ✅ Passed through via driver args | ✅ PARITY |
| `sessionData` JSON (localStorage tokens) | ✅ File/env/cloud restore | Not implemented | 🗑️ OBSOLETE for MD |
| `deleteSessionData()` | ✅ Called on logout | ❌ No equivalent | ⚠️ P2 — logout cleanup missing |
| `data_dir_watcher.ts` (zstd snapshots) | ✅ Watches + compresses | ❌ Not implemented | P3 — nice-to-have |
| Cloud session upload (pico-s3) | ✅ Optional upload | ❌ Not implemented | P3 — nice-to-have |

This **downgrades the original P1 rating for "session persistence"** to mainly a P2 for logout cleanup and P3 for cloud/compression features. The core session reuse mechanism (`userDataDir`) already works.

---

### Phase 1 — `src/controllers/data_dir_watcher.ts`

**Correction 4: Entirely missing from gap analysis table**

The audit's Phase 1 describes `data_dir_watcher.ts` correctly, but the Phase 3 gap analysis table (line 933-957) does not include a row for the data directory watcher/compression feature. This is a real omission — the feature existed in legacy and is not present in v5. However, per the correction above, it's P3 priority, not P1.

**Add to gap table:**

| Gap | Legacy evidence | V5 evidence | Status | Functional impact | Suggested fix |
|---|---|---|---|---|---|
| `userDataDir` watcher/compression | `data_dir_watcher.ts:26-98` | No equivalent | ❌ MISSING | Loss of automatic session backup/compression | Add optional watcher module (P3) |

---

### Phase 1 — `src/api/Client.ts: loaded()`

**Correction 5: `registerAllSimpleListenersOnEv()` is the REAL bridge mechanism**

The audit identifies `Client.loaded()` as containing the listener registration, but misses the critical detail of HOW the legacy bridge actually works. The chain is:

1. `loaded()` → `registerAllSimpleListenersOnEv()` → `registerEv(SimpleListener)` (line 4867-4881)
2. `registerEv` calls `this[simpleListener](...)` which maps to e.g. `this.onMessage(...)` 
3. `onMessage` → `registerListener(SimpleListener.Message, fn, queue)` (line 695-732)
4. `registerListener` calls `page.exposeFunction(funcName, (obj) => fn(obj))` → then `WAPI["onMessage"](obj => window["onMessage"](obj))`

So the legacy bridge works as:
```
Browser: WAPI.onMessage(obj => window.onMessage(obj))
  ↓ page.exposeFunction()
Node: fn(obj) → event emission
```

This is NOT the same as the `WapiBridge.ts` in `packages/legacy/` which uses `__onMessage` naming. The legacy `WapiBridge.ts` is a **simplified reference** that doesn't match the actual legacy runtime behavior. The real legacy pattern uses the **same function names** as the SimpleListener enum values (e.g., `onMessage`, `onAck`, etc.) as the exposed window functions.

**Impact on v5 fix strategy**: The v5 bridge should follow the actual legacy pattern (using `SimpleListener` enum values as exposed function names), NOT the WapiBridge pattern (using `__onMessage` etc.). The `wapi.js` asset expectations must match.

---

### Phase 2 — `packages/client/src/events/EventManager.ts`

**Correction 6: EventManager bridge is client-side ONLY — missing browser-side registration**

The audit notes the WapiBridge is missing, but doesn't adequately describe what the `EventManager.ts` in the v5 client actually IS vs what's missing.

What v5 HAS (EventManager.ts):
- Maps client-level event names (`message`, `ack`, etc.) to core event names (`message.received`, `ack.changed`, etc.)
- Transforms payloads between schemas
- Provides queue-based listener management

What v5 is MISSING:
- **No `page.exposeFunction()` calls** that tell the browser to route callbacks to Node
- **No WAPI listener binding** (calls like `WAPI.onMessage(obj => window.onMessage(obj))` in browser context)
- The EventManager assumes `message.received` events will magically appear on the HyperEmitter — but nothing in the active boot path actually causes these events to be emitted

The fix needs TWO parts:
1. **Browser → Node bridge**: `page.exposeFunction()` for each listener callback name, routing into the HyperEmitter as `message.received`, `ack.changed`, etc.
2. **WAPI → Browser binding**: `page.evaluate()` that tells WAPI to call the exposed functions

---

### Phase 3 — Gap analysis table

**Correction 7: "Post-auth reinjection" severity should be nuanced**

The audit rates post-auth reinjection as ❌ MISSING and P1. This is correct in principle, but the severity depends on the auth path:

- **Fresh session (QR scan)**: WAPI was injected before auth. After auth, WhatsApp Web does a full page reload/navigation in many cases. The v5 `Transport.ts` doesn't handle frame navigations leading to WAPI loss. This is **truly P1**.
- **Existing session (userDataDir resume)**: WAPI is injected pre-auth and never dropped because the page doesn't reload. This is **less critical**.

The fix should specifically target the frame-navigation case: detect when WhatsApp Web reloads after auth and reinject WAPI + rebind listeners.

**Correction 8: "Session expiry NUKE handling" is over-rated**

The audit rates this as ❌ MISSING and P1. In the MD era, the "NUKE" scenario (where stored session tokens are expired and need to be cleared before retry) is **less common** because session state lives in `userDataDir` (Chromium's own persistence), not in app-managed JSON tokens. The NUKE pattern made sense when sessions were stored as serialized localStorage blobs.

**Downgrade to P2** — still worth implementing as defensive error handling, but not a boot blocker.

**Correction 9: "Phone-out-of-reach differentiation" is over-rated**

The audit rates this as ❌ MISSING and P1. In the MD era, WhatsApp Web operates independently of the phone after initial linking. The "phone out of reach" scenario is **much rarer** and only applies during initial pairing or re-linking. 

**Downgrade to P2** — useful diagnostic but not functionally blocking.

---

### Phase 4A — Boot sequence ordering

**Correction 10: v5 boot order has an additional gap — no frame navigation handler**

The audit's v5 boot order (lines 983-997) is missing a critical observation: v5 has **no handler for post-auth page reload/navigation**. Legacy's `browser.ts:64-84` reinjects the API when frames navigate:

```typescript
// Legacy browser.ts ~64-84
page.on('framenavigated', async (frame) => {
  if (frame === page.mainFrame()) {
    // check if WAPI is still alive, reinject if not
  }
});
```

V5 has frame navigation events in the eventMap (`session.frame.navigated`, `session.reinject.detected`) but **no active handler** that triggers reinjection.

---

### Phase 4B — Browser injection inventory

**Correction 11: Missing `evaluateOnNewDocument` row**

The audit has this row:

| `evaluateOnNewDocument` session tokens | `browser.ts:214-232` | None found in active path | ❌ |

This should be updated with the clarification that this is **OBSOLETE for MD sessions** and can be marked as 🗑️ DEPRECATED rather than ❌ MISSING.

**Correction 12: Missing frame-navigation reinject handler row**

Add to table:

| Legacy injection | File:line | V5 equivalent | Status |
|---|---|---|---|
| Frame navigation WAPI reinject | `browser.ts:64-84` | None found in active path | ❌ |

---

### Phase 4D — Configuration key parity

**Correction 13: Several "not wired" configs are intentionally obsolete**

The audit lists many configs as "present in legacy but not wired through active v5 boot path" without distinguishing between:

1. **Intentionally obsolete** (should be documented as deprecated):
   - `popup` — replaced by terminal QR + /qr API 
   - `sessionData` — obsolete for MD
   - `sessionDataPath` — obsolete for MD
   - `sessionDataBucketAuth` — can remain P3
   - `browserRevision` — v5 uses driver abstraction
   - `corsFix` — handled differently in server layer

2. **Still relevant but unimplemented** (should remain in gap table):
   - `waitForRipeSession` / `waitForRipeSessionTimeout` — P1
   - `linkCode` — P2
   - `qrMax` — P2
   - `deleteSessionDataOnLogout` — P2
   - `killClientOnLogout` — P2
   - `skipBrokenMethodsCheck` — P2
   - `hostNotificationLang` — P3
   - `ensureHeadfulIntegrity` — P3
   - `ignoreNuke` — P3

3. **Actually present but not documented in audit**:
   - `blockCrashLogs` — may be handled by request interception
   - `cacheEnabled` — needs verification

---

### Phase 4G — `lib/` asset injection parity

**Correction 14: Helper asset gap assessment is incomplete**

The audit correctly flags `qr.min.js`, `hash.js`, `base64.js`, `jsSha.min.js` as missing. However, it doesn't assess whether these are actually needed by the shipped `wapi.js` in v5.

- If v5's `wapi.js` is a NEW version that doesn't depend on these helpers → they are obsolete ✅
- If v5's `wapi.js` is the SAME as legacy's → they are needed ❌

**This needs verification**: check if `wapi.js` in `packages/core/src/transport/assets/` references `CryptoJS`, `jsSha`, `Base64`, or `QRCode` globals.

---

### Phase 5 — Gapfiller re-audit

**Correction 15: Task 5 assessment is too generous**

The audit marks Task 5 ("Rebuild session validation, repair, and finalization depth") as ✅ MET with ❌ NOT MET for `Client.loaded()`. But the underlying issue is broader than just `loaded()`:

- V5's `SessionManager` has "finalization" state but it's purely **bookkeeping** — it doesn't trigger any side effects like sync wait, listener binding, or logout cleanup
- The readiness model is structurally better but **semantically empty** for the loaded() contract

**Corrected verdict**: Task 5 is ⚠️ PARTIALLY MET — the shell exists but the behavioral contract is not fulfilled.

---

### Phase 6 — Risk-ranked fix list

**Revised priority ranking:**

| # | Gap | Original Priority | Revised Priority | Rationale |
|---|---|---|---|---|
| 1 | Browser-to-node runtime event bridge | P0 | **P0** | Unchanged — this is the #1 blocker for runtime functionality |
| 2 | Session persistence from file/env/cloud | P1 | **P2-P3** | `userDataDir` works; JSON/cloud persistence is MD-obsolete |
| 3 | Post-auth reinjection + ripe-session gate | P1 | **P1** | Still critical for fresh-session + page-reload recovery |
| 4 | Invalid-session NUKE recovery | P1 | **P2** | Less relevant in MD era |
| 5 | Client.loaded() equivalence | P1 | **P1** | Still critical — sync wait, listener bind, logout cleanup |
| 6 | Broken-method integrity gate | P1 | **P1** | Unchanged |
| 7 | Frame-navigation reinject handler | (missing) | **P1** | NEW — not in original audit |
| 8 | Phone-out-of-reach differentiation | P1 | **P2** | MD makes this rare |
| 9 | Link-code auth flow | P1 | **P2** | Alternative auth, not primary |
| 10 | Internal event handler stub | P2 | **P2** | Unchanged |
| 11 | Logout cleanup (deleteSessionData, killClient) | P1 | **P2** | Part of Client.loaded() parity |
| 12 | Data dir watcher/compression | (missing) | **P3** | Nice-to-have |

---

## Naming conventions audit

The user specifically asked for industry-standard naming in v5. Here's what needs attention:

### Current v5 naming issues

| Current name | Issue | Suggested rename |
|---|---|---|
| `OpenWAClient` (type) | Acceptable but verbose | Keep — clear and descriptive |
| `EvEmitter`, `ev` (legacy) | Abbreviated, unclear | Already replaced by `HyperEmitter` ✅ |
| `SimpleListener` enum values (legacy) | `onMessage`, `onAck` — verb-prefixed | Already replaced by noun-based event names (`message.received`, `ack.changed`) ✅ |
| `pup()` (legacy) | Cryptic abbreviation for `page.evaluate` | Already replaced by `evaluate()` ✅ |
| `injectApi()` (legacy) | Ambiguous — which API? | Already replaced by `injectWapi()` ✅ |
| `initPatchScripts.ts` → `injectInternalEventHandler()` | Misleading — it's a stub | Should be removed or renamed to `injectRuntimeBridge()` when implemented |
| `ScriptLoader` | Clear but generic | Acceptable — scoped by module path |
| `applyPatchArtifacts()` | Mixes "artifacts" terminology with patch semantics | Acceptable as-is |
| `DEFERRED_INIT_PATCH` sentinel | Clear | Acceptable |
| `ghPatchFallback` | Changed semantics from legacy `ghPatch` | Document or rename to `patchSourceFallback` |
| `cachedPatch` | Changed semantics (opt-in → default-on) | Document or rename to `enablePatchCache` |
| Type `STATE` | Simple enum string union | Consider `SessionState` for clarity |

### Event naming conventions (already good in v5)

V5 uses dot-delimited, hierarchy-based event names which is an **improvement** over legacy:
- `message.received` > `onMessage` ✅
- `ack.changed` > `onAck` ✅  
- `session.state.changed` > `onStateChanged` ✅
- `launch.auth.qr.generated` > spinner-emitted QR ✅

No changes needed here — v5 naming is already industry-standard.

---

## New gaps found in this pass (Driver Abstraction & API Surface)

### 1. The `userDataDir` Regression (P1)

**Legacy**: `browser.ts:186` sets `userDataDir` in Puppeteer launch args, ensuring multi-device session persistence.
**V5**: The `LaunchOptions` interface supports it, and `PuppeteerDriver.ts` maps it, but **`Transport.initialize():263` fails to pass `userDataDir` from config to the driver**.
**Impact**: Sessions do not persist. This completely breaks the assertion that "MD sessions already persist via Chromium profile."
**Fix**: Update `Transport.ts:263-267` to pass `userDataDir: this.config.userDataDir` to `driver.launch()`.

### 2. The `IPage` Abstraction Gaps (P1-P3)

A full analysis of legacy codebase (`/wa copy/`) reveals the following Puppeteer API methods are used, but are **MISSING** from the current v5 `IPage` driver interface (`driver.ts`):

| Puppeteer Method/Object | Legacy Usage Context | Missing from `IPage`? | Impact | Priority |
|---|---|---|---|---|
| `page.on` / `page.off` | `framenavigated`, `console`, `pageerror`, `request` handlers | ❌ Yes | Cannot handle WAPI reinject | **P1** |
| `page.authenticate` | Bypassing proxies with basic auth (`browser.ts:89`) | ❌ Yes | Breaks proxy support | P2 |
| `page.setBypassCSP` | Necessary to evade strict WA Web CSP for eval injection | ❌ Yes | May break injections in future | P2 |
| `page.setCacheEnabled` | Startup cleanliness / performance tuning | ❌ Yes | Minor | P3 |
| `page.setRequestInterception`| Blocking crashlogs (`blockCrashLogs`), blocking assets (`blockAssets`), and non-native Proxy handling (`proxyAddr`) | ❌ Yes | Breaks `blockCrashLogs`, `blockAssets`, and fallback proxy config | P2 |
| `page.addScriptTag` | Loading remote assets | ❌ Yes | May break patch flows | P3 |
| `page.evaluateOnNewDocument` | Pre-injecting config/tokens (legacy MD bypass) | ❌ Yes | P3 (Mostly obsolete for MD) | P3 |
| `page.metrics` | Performance profiling | ❌ Yes | Minor | P3 |
| `page.browser` / `_client` | CDP direct access / getting top-level context | ❌ Yes | Breaks advanced stealth/events | P3 |
| `request.abort()` / `continue()` / `respond()` | Handling intercepted `request` objects to block assets (`browser.ts:139`) | ❌ Yes | Break dependency for request interception | P2 |
| `frame.url()` / `content()` | Passed to `framenavigated` handlers | ❌ Yes | Needs custom event wrapper | P1 |

**Fix Strategy**: 
1. Extend `IPage` interface in `@open-wa/driver-interface` with these methods and corresponding standard event payloads (e.g. `IRequest`, `IFrame`).
2. Implement them inside `@open-wa/driver-puppeteer`'s `PuppeteerPage` and `PuppeteerDriver`.
3. Some of these (like intercepting requests) might require abstraction redesign using generic interfaces (like `IInterceptedRequest`) instead of 1:1 mapping if we want to cleanly support Playwright later.

### 3. No frame-navigation reinject handler (P1)

**Legacy**: `browser.ts:64-84` — `page.on('framenavigated')` detects WAPI loss and reinjects.

**V5**: Event types exist (`session.frame.navigated`, `session.reinject.*`) but no active handler listens for them or triggers reinjection.

**Fix**: Add frame navigation listener in Transport that checks WAPI health and reinjects when needed.

### 2. No autoEmoji feature (P3)

**Legacy**: `Client.loaded()` lines 387-398 set up auto-emoji listener.

**V5**: No equivalent. This is a convenience feature, not functionally critical.

### 3. No logger/console forwarding from browser (P2)

**Legacy**: `initializer.ts:378-390` installs `page.on('console')` and `page.on('pageerror')` handlers.

**V5**: Not verified whether Transport installs equivalent handlers.

### 4. No `restartOnCrash` handler (P2)

**Legacy**: Supported via config flag and crash recovery logic.

**V5**: No equivalent located.

---

## Verification checklist

Before any P0/P1 fix is considered complete, verify:

- [ ] `wapi.js` asset dependencies — does it need `qr.min.js`, `hash.js`, etc.?
- [ ] Frame navigation reinject — does WA Web actually reload after QR auth in current versions?
- [ ] `ripeSession` semantics — is `WAPI.isSessionLoaded()` still valid in current WA Web?
- [ ] WAPI listener binding — does current `wapi.js` support `WAPI.onMessage(callback)` style calls?
- [ ] Store method inventory — which Store methods does current `wapi.js` actually expose?

---

## Recommended execution order

1. **P0: Browser → Node event bridge** — implement `page.exposeFunction` bindings + WAPI listener registration after WAPI injection
2. **P1: Frame navigation handler** — detect page reload, reinject WAPI + rebind listeners
3. **P1: Post-auth reinjection** — reinject after fresh QR auth completes
4. **P1: Client.loaded() parity** — add sync wait, listener autobind, logout cleanup to Client facade
5. **P1: Broken-method integrity check** — port or replace with capability assertions
6. **P2: Remaining gaps** — NUKE recovery, link-code auth, logout cleanup, console forwarding
7. **P3: Nice-to-haves** — data dir watcher, autoEmoji, cloud session upload
