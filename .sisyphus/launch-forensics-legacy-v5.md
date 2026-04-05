# Launch Forensics: Legacy `create()` vs v5 bootstrap

Date: 2026-04-05
Author: OpenCode session

## Goal

Document the legacy launch flow in enough detail to explain **why each stage exists**, then compare it to the current v5 bootstrap so we can spot where v5 took too much liberty and likely introduced launch / re-auth regressions.

This document is deliberately biased toward the launch-critical path, not code style. Legacy is treated as the authority because it is battle-hardened after years of production usage.

---

## Scope

Legacy authority files:

- `/Users/Mohammed/projects/tools/wa copy/src/controllers/initializer.ts`
- `/Users/Mohammed/projects/tools/wa copy/src/controllers/auth.ts`
- `/Users/Mohammed/projects/tools/wa copy/src/controllers/browser.ts`

Current v5 comparison files:

- `packages/core/src/createClient.ts`
- `packages/core/src/transport/Transport.ts`
- `packages/config/src/schema/config.ts`
- `packages/client/src/Client.ts`

Assumptions for this comparison:

- In v5, `eventMode` is effectively locked **true** by default (`packages/config/src/schema/config.ts:320`)
- In v5, `multiDevice` is effectively locked **true** by default (`packages/config/src/schema/config.ts:369`)
- In v5, `waitForRipeSession` still defaults **true** (`packages/config/src/schema/config.ts:328`), even though current code has already drifted from legacy in how it is applied

---

## Legacy `create()` walkthrough — what each block is doing and why it exists

This section walks through the legacy `create()` function in the order it executes, with supporting notes from `auth.ts` and `browser.ts`.

### 1. Force the launch assumptions early

**Lines:** `initializer.ts:62-68`

```ts
if(!config || config?.eventMode!==false) {
  config.eventMode = true
}

if(config?.waitForRipeSession !== false) config.waitForRipeSession = true;
if(config?.multiDevice !== false) config.multiDevice = true;
if(config?.deleteSessionDataOnLogout !== false) config.deleteSessionDataOnLogout = true;
```

**What it does:**
- hardens launch defaults immediately
- assumes event mode is on unless explicitly disabled
- assumes ripe-session wait is on unless explicitly disabled
- assumes MD is on unless explicitly disabled

**Why it exists:**
- launch behavior is not treated as a free-form matrix; it is treated as a constrained mode with a few known-good defaults
- this reduces state-space explosion before the rest of the flow even starts

**Why this matters for v5:**
- v5 also defaults `eventMode`, `waitForRipeSession`, and `multiDevice` to `true`, but its downstream implementation is no longer parity-faithful

---

### 2. Launch the browser and page, but preload the environment before navigation

**Lines:** `initializer.ts:153`, then `browser.ts:initPage(...)`

Legacy `create()` delegates almost all browser-page preparation to `initPage(...)`.

#### 2a. Browser boot / page creation

**Lines:** `browser.ts:29-63`

**What it does:**
- loads scripts into the preloader cache (`scriptLoader.loadScripts()`)
- launches browser
- gets the WhatsApp page
- enables service worker bypass

**Why it exists:**
- launch assets need to be available locally before we start injecting them
- service workers are explicitly bypassed to keep launch deterministic

#### 2b. Frame navigation watcher

**Lines:** `browser.ts:64-84`

```ts
waPage.on("framenavigated", async frame => {
  const hasWapi = await waPage.evaluate("window.WAPI ? true : false")
  if(!hasWapi) {
    frameNavPromises.push(injectApi(waPage, spinner, true))
    frameNavPromises.push(qrManager.waitFirstQr(waPage, config, spinner))
  }
})
```

**What it does:**
- listens for frame navigation
- if WAPI disappears, reinjects the API and re-arms QR detection

**Why it exists:**
- WhatsApp navigates / swaps runtime beneath you
- launch robustness depends on reacting to that fact rather than assuming one clean page lifetime

**Launch lesson:**
- legacy doesn’t just inject once and hope; it already assumes runtime loss on navigation

#### 2c. Request interception and “quick auth” hinting

**Lines:** `browser.ts:137-188`

**What it does:**
- enables request interception
- blocks crashlog endpoints
- maintains a local page cache
- notices `_priority_components` requests and sets `window.WA_AUTHENTICATED=true`

**Why it exists:**
- this is a performance/robustness heuristic: some auth truth is observable from network behavior before the UI fully stabilizes
- it shortens auth detection latency

**Important:**
- this is a subtle but meaningful part of legacy robustness that v5 currently does **not** replicate

#### 2d. Session data injection before navigation

**Lines:** `browser.ts:196-238`

**What it does:**
- loads stored session data
- injects it into `localStorage` via `evaluateOnNewDocument(...)`
- for MD, handles the `_IGNORE_...` user data dir path and MD flags

**Why it exists:**
- legacy decides the auth mode as early as possible
- the page should wake up already carrying the session state if one exists

**Re-auth importance:**
- this is one of the first places re-auth can go wrong if the session bootstrap assumptions drift

#### 2e. Navigate first, then install launch callbacks and progress observer

**Lines:** `browser.ts:245-260`

```ts
const webRes = await waPage.goto(puppeteerConfig.WAUrl)
await waPage.exposeFunction("ProgressBarEvent", ...)
await waPage.exposeFunction("CriticalInternalMessage", ...)
await injectProgObserver(waPage)
```

**What it does:**
- performs the real navigation first
- only after `goto()` finishes does it install the progress and internal-message bridge

**Why it exists:**
- this is exactly the delicate ordering you called out
- progress/critical callbacks are launch instrumentation, not part of pre-navigation page setup

**Important:**
- legacy launch bridge setup is narrow here: progress and internal launch messages only
- it is **not** trying to register the whole runtime event bridge yet

---

### 3. Gather debug/version info before auth race

**Lines:** `initializer.ts:158-205`

**What it does:**
- reads UA, browser version, OS, WA version
- performs an “invariant avoidance” wait (`initializer.ts:209-215`)
- determines:
  - `canInjectEarly`
  - `attemptingReauth`

**Why it exists:**
- these values influence the auth and injection branches that follow
- legacy is explicitly looking for evidence that this is a re-auth / resumed-session launch

---

### 4. Early API injection only if it is safe enough

**Lines:** `initializer.ts:216-224`

```ts
if (canInjectEarly) {
  if(attemptingReauth) await waPage.evaluate(`window.Store = {"Msg": true}`)
  waPage = await injectApi(waPage, spinner);
} else {
  ... TOS block / abort path ...
}
```

**What it does:**
- injects the API early when the page state looks compatible
- in re-auth, it primes `window.Store` to avoid known injection invariants

**Why it exists:**
- launch is not one-size-fits-all
- resumed session launches need slightly different treatment than QR-first launches

**Important:**
- legacy already distinguishes between fresh auth and re-auth before the main auth race finishes

---

### 5. Auth detection is a true first-signal-wins race

**Lines:** `initializer.ts:226-233` and `auth.ts:19`

```ts
const authenticated = await Promise.race(authRace);
```

with:

```ts
race(needsToScan(waPage), isInsideChat(waPage), sessionDataInvalid(waPage)).toPromise()
```

**What it does:**
- auth is decided by the first concurrent signal to resolve:
  - QR needed
  - already inside chat / authenticated
  - session data invalid

**Why it exists:**
- this minimizes bias
- no one branch gets artificial priority because of check ordering
- it leans on driver/browser waits rather than our own manual loop

**Key legacy robustness point:**
- auth detection is modeled as *state competition*, not a manually ordered polling script

---

### 6. If auth timed out, do a second race for “phone out of reach” vs timeout

**Lines:** `initializer.ts:258-266`, `auth.ts:99-107`

**What it does:**
- after auth timeout, races phone-reachability vs timeout
- surfaces a different operator-facing message if the phone is offline

**Why it exists:**
- timeout is not one failure mode; it is multiple failure modes that deserve different next actions

---

### 7. QR / link-code handling is also race-based and callback-based

**Lines:** `initializer.ts:269-299`, `auth.ts:200-295`

**What it does:**
- if not authenticated yet, launches either:
  - `qrManager.linkCode(...)`
  - or `qrManager.smartQr(...)`
- races that against a QR timeout

**Why it exists:**
- QR/UI emission is asynchronous and eventful
- QRManager is built around browser-side callbacks (`window.smartQr(...)`, exposed function `_smartQr`) and emits only when needed

**Why it matters:**
- legacy uses browser-side signaling and `waitFor*` primitives a lot more than the current v5 hand-rolled polling

---

### 8. After auth, legacy immediately installs internal event handling

**Lines:** `initializer.ts:300-303`

```ts
if(config.logInternalEvents) await waPage.evaluate("debugEvents=true")
await waPage.evaluate("window.critlis=true")
await injectInternalEventHandler(waPage)
```

**What it does:**
- turns on internal event debugging / internal event handler before continuing

**Why it exists:**
- once auth completes, launch still isn’t finished
- internal launch/runtime signals are needed for the fragile post-auth stretch

---

### 9. Re-auth gets a special ripe-session wait before reinjection

**Lines:** `initializer.ts:304-310`, `auth.ts:70-78`

```ts
if(attemptingReauth) {
  await waPage.evaluate("window.Store = undefined")
  if(config?.waitForRipeSession) {
    if(await waitForRipeSession(...)) ...
  }
}
```

**What it does:**
- only for re-auth / resumed sessions:
  - clears `window.Store`
  - optionally waits for `window.isRipeSession()`

**Why it exists:**
- re-auth is explicitly treated as a different state machine
- legacy does **not** force this on fresh QR auth

**Key lesson:**
- ripe-session waiting is a *re-auth stabilizer*, not a universal post-auth gate

---

### 10. API injection order is deliberate and narrow

**Lines:** `initializer.ts:312-315`, `browser.ts:402-408`

`injectApi(...)` does:

1. `injectPreApiScripts(...)` — `browser.ts:354-365`
2. `injectWapi(...)` — `browser.ts:368-400`
3. `launch.js` — `browser.ts:402-408`

**What it does:**
- helper slot first (`qr.min.js`, `hash.js`)
- then WAPI
- then launch layer

**Why it exists:**
- helper globals are expected before WAPI launch
- WAPI must exist before launch.js decorates/extends the runtime

**This is one of the key parity anchors.**

---

### 11. Legacy performs a concrete session-validity check immediately after reinjection

**Lines:** `initializer.ts:317-330`

```ts
const VALID_SESSION = await waPage.waitForFunction(
  `window.Store && window.Store.Msg ? true : false`,
  { timeout: 9000, polling: 200 }
)
```

**What it does:**
- after reinjection, waits specifically for `Store.Msg`

**Why it exists:**
- this is the “is the session actually usable?” gate
- simple, concrete, and directly tied to real runtime availability

---

### 12. Patch / integrity / license / init patch / loaded order is very specific

**Lines:** `initializer.ts:334-431`

Exact order:

1. preload patch promise — `334`
2. collect session data / logging / metrics prep — `336-423`
3. live patch apply — `399-402`
4. integrity check — `407`
5. license injection — `425-427`
6. `injectInitPatch(waPage)` — `428-429`
7. `client.loaded()` — `430-431`

**Why it exists:**
- patches can change runtime behavior before integrity is checked
- integrity confirms runtime surface before finalization
- license overlays capability only after runtime is sound
- init patch is the last page mutation before `loaded()`

**This ordering is likely part of the “magic sauce.”**

---

### 13. First-login integrity refresh is special-cased

**Lines:** `initializer.ts:432-435`

```ts
if(config.ensureHeadfulIntegrity && !attemptingReauth) {
  await client.refresh();
}
```

**Why it exists:**
- fresh QR auth has different stability concerns than resumed sessions
- legacy keeps that distinction explicit all the way to the end

---

## Current v5 launch path — ordered summary

This is the current behavior in source, not the intended behavior.

### 1. Start / initialize / navigate

**Files:** `createClient.ts:479-480`, `Transport.ts:435-493`

Current order:
1. `transport.initialize()`
2. `transport.navigate()`
3. post-`goto()` launch bootstrap via `configureLaunchBootstrap(...)`

This part is now closer to legacy because we moved the launch callbacks/prog observer after `goto()`.

---

### 2. Inject runtime assets and run pre-auth validation

**Files:** `createClient.ts:482-525`, `Transport.ts:495-521`, `Transport.ts:2170-2247`

Current order:
1. set session state `AUTHENTICATING`
2. `transport.injectWapi()`
   - pre-api helper phase (currently **noop**) — `Transport.ts:1879-1913`
   - evaluate `wapi.js`
   - evaluate `launch.js`
3. `runValidationStage('post_injection', ...)`

**Important drift:**
- current v5 validates runtime capability **before auth settles**
- legacy did not model launch this way

---

### 3. Current auth detection is a manual 500ms polling loop

**Files:** `Transport.ts:1509-1731`, cadence at `Transport.ts:1502` and default `Transport.ts:416`

Current order inside each poll tick:
1. authenticated shell check
2. invalid session check
3. link-code availability/generation
4. QR presence
5. timeout / phone out of reach

**This is not legacy parity.**

Legacy uses:
- concurrent waiters
- first signal wins

Current v5 uses:
- one ordered loop
- 500ms cadence
- ordering bias

---

### 4. Post-auth reconciliation is heavier than legacy

**Files:** `createClient.ts:568-613`, `Transport.ts:1408-1466`

Current order:
1. `reconcilePostAuthRuntime(...)`
2. `configureRuntimeEventBridge()`
3. second `post_injection` validation

Legacy re-auth was lighter:
- only special-case re-auth with `waitForRipeSession()`
- reinject API
- then perform the validity/integrity path

Current v5 introduces more stages and more opportunities for divergence.

---

### 5. Post-auth mutation order in v5

**Files:** `createClient.ts:631-832`

Current order now is:
1. patch preload/apply
2. post-patch integrity
3. license preload/check/apply
4. deferred init patch
5. post-overlay validation
6. finalization hooks
7. operational readiness wait
8. `READY`
9. `client.ready`

This is directionally closer to legacy than before, but still more layered.

---

## Where v5 is taking too much liberty

### 1. Auth detection mechanism

Legacy:
- concurrent Rx/driver-wait auth race

v5:
- ordered 500ms polling loop

**Why this is risky:**
- if QR and resumed-session signals are both racing in a marginal startup, the current order biases which interpretation wins
- this can absolutely contribute to “loading bar then glitch back to QR” on re-auth

---

### 2. Pre-auth runtime validation

Legacy:
- auth happens first, then post-auth stabilization/injection path

v5:
- injects runtime assets, then validates capability before auth settles

**Why this is risky:**
- it treats pre-auth runtime as if it should already behave like a settled authenticated runtime
- we already had to weaken/defer parts of this because it caused real failures

---

### 3. Re-auth semantics are less explicit than legacy

Legacy:
- `attemptingReauth` is detected early
- re-auth gets a special branch
- ripe-session wait only happens there

v5:
- `freshAuth` is inferred later from `authResult.qrSeen`
- post-auth reconciliation carries more logic than legacy

**Why this is risky:**
- resumed-session behavior is more emergent than explicit
- that makes “shows loading bar then falls back to QR” very believable as a regression from launch-order drift

---

### 4. Helper/pre-api phase exists in name, not in substance

Legacy:
- real helper scripts before WAPI (`qr.min.js`, `hash.js`)

v5:
- helper phase currently logs `noop`

**Why this matters:**
- if any old launch/runtime assumptions depended on helper globals, v5 has not actually restored that parity yet

---

### 5. Finalization is more layered and more blocking

Legacy:
- init patch
- `client.loaded()`
- optional refresh
- ready

v5:
- deferred init patch
- post-overlay validation
- finalization hooks
- operational readiness wait
- ready

**Why this matters:**
- every extra blocking phase is another place for a “works in legacy / stuck in v5” divergence

---

## Likely explanation for the current re-auth bug

> “When I load a previously scanned session, it shows the WhatsApp loading bar and then glitches back out to QR code.”

This most likely comes from a combination of:

1. **v5 auth detection is not first-signal-wins**
   - ordered checks every 500ms can misclassify a racing state transition

2. **v5 pre-auth and post-auth runtime gating are too eager**
   - launch logic is treating runtime capability as a launch truth too early

3. **re-auth is not treated as an explicit state machine early enough**
   - legacy branches early on `attemptingReauth`
   - v5 decides too much later in the flow

4. **the launch page/runtime recovery machinery is more aggressive than legacy**
   - useful for resilience, but it may be fighting the natural re-auth transition instead of observing it

---

## Where mutation observers make sense

Use them where the browser/page knows something changed **before** our side can safely infer it.

### Good mutation-observer candidates

1. **QR visibility / QR replacement**
   - instead of repeatedly pulling `canvas[aria-label]`
   - emit when the QR node appears or its `data-ref` changes

2. **Loading-bar / authenticated-shell transitions**
   - observe the root app container and known auth shell markers
   - emit when the loading shell becomes the authenticated shell

3. **Logout / session nuking markers in DOM**
   - only if reliable DOM mutations exist

### Bad mutation-observer candidates

1. general runtime capability (“is WAPI healthy?”)
   - that is not a DOM problem
2. heavy Store/model introspection
   - those should use runtime hooks or direct page evaluation, not DOM mutation observers

---

## Where driver `waitFor*` should replace our custom polling

This is the biggest architectural lesson from legacy.

### Prefer driver waiters for

1. **Auth state competition**
   - restore concurrent waiters for:
     - QR needed
     - already authenticated shell
     - invalid session

2. **QR first appearance**
   - `waitForSelector(...)` or equivalent

3. **Ripe-session checks in re-auth only**
   - a bounded `waitForFunction(...)`

4. **Phone out of reach**
   - driver wait instead of our own repeated manual loop

### Why

- driver waiters are cheaper than our own repeated `evaluateScript(...)`
- they reduce the chance that *we* are perturbing the page during launch
- they are closer to the legacy semantics that already worked

---

## Concrete “too much liberty” list for v5

1. Replaced auth race with a 500ms ordered poll loop
2. Added pre-auth capability validation before auth settlement
3. Delayed/abstracted re-auth branching instead of handling it early and explicitly
4. Introduced a nominal helper phase but not the real helper injections
5. Added more post-auth blocking gates than legacy exposed

---

## Recommended next moves

If the goal is launch parity first, not architecture elegance:

### 1. Restore legacy auth semantics

Replace `waitForAuthentication()` with a driver-wait-based concurrent auth race shaped like:

- QR needed
- inside chat / authenticated shell
- invalid session

This is the single highest-value parity fix left.

### 2. Re-introduce explicit early re-auth branching

Legacy uses `attemptingReauth` before auth settlement to choose launch behavior.
v5 should do the same rather than inferring too much later.

### 3. Use driver waiters instead of custom polling wherever possible

Especially for:
- auth detection
- QR first appearance
- phone-out-of-reach
- ripe-session re-auth wait

### 4. Treat mutation observers as *emitters*, not as the primary truth engine

Use them to send page-side transitions back to Node quickly, but keep the core auth-state contract grounded in driver waiters and explicit runtime checks.

---

## Bottom line

Legacy launch is robust because it is:

- aggressively defaulted into a known-good mode
- explicit about re-auth vs fresh auth
- based on **first-signal-wins** auth detection
- narrow in its launch-time bridging
- deliberate in its injection order
- modest in its blocking gates after auth

Current v5 has moved too far toward:

- manual polling
- layered readiness machinery
- deferred interpretation of auth state
- more launch-time liberty than the old flow can safely tolerate

If re-auth is currently broken, the **auth race** and the **early re-auth branch** are the first places I would tighten back toward legacy.
