# Injection Architecture — Systematization Proposal

Date: 2026-04-04

## The Problem

Page injection in v5 is scattered across multiple files and lifecycle phases, with no resilience to page reload or navigation. If a user hits refresh in headful mode, everything dies.

### Current injection points (v5)

| What | Where | When | Survives refresh? |
|---|---|---|---|
| `ProgressBarEvent` exposed fn | `Transport.navigate():302` | During initial navigation | ❌ |
| `CriticalInternalMessage` exposed fn | `Transport.navigate():308` | During initial navigation | ❌ |
| `prog_observer.js` eval | `Transport.navigate():323` | After navigation, before auth | ❌ |
| `wapi.js` eval | `Transport.injectWapi():357` | Before auth, during boot | ❌ |
| `launch.js` eval | `Transport.injectWapi():366` | After wapi, during boot | ❌ |
| `init_patch.js` eval | `Transport.applyPatchArtifacts():629` | After auth, during patch phase | ❌ |
| `internalEventHandler` (stub) | `Transport.applyPatchArtifacts():633` | After auth, during patch phase | ❌ |
| Patch artifacts eval | `Transport.applyPatchArtifacts():636` | After auth, patch phase | ❌ |
| License artifact eval | `Transport.applyLicenseArtifact():1012` | After auth, license phase | ❌ |
| Listener bridge fns (TODO) | Not yet implemented | After WAPI, ongoing | ❌ |

**Every single injection is fire-and-forget. None survive a page navigation or refresh.**

### How legacy handled it

Legacy's `browser.ts:64-84` had a single frame-navigation handler:

```typescript
waPage.on("framenavigated", async frame => {
  const hasWapi = await waPage.evaluate("window.WAPI ? true : false");
  if (!hasWapi) {
    await injectApi(waPage, spinner, true);
    await qrManager.waitFirstQr(waPage, config, spinner);
  }
  if (frame.url().includes('post_logout=1')) {
    console.log("Session most likely logged out");
  }
});
```

This was serviceable but limited:
- Only checked for WAPI loss, didn't reinject listeners
- Didn't handle `exposeFunction` bindings (which DO survive reloads in Puppeteer)
- Mixed concerns (reinject + QR + logout detection in one handler)
- Used `page.on()` directly — breaks the driver abstraction

---

## Design Requirements

1. **Survivable**: Must handle page reload, navigation, and frame changes
2. **Driver-agnostic**: Must work through the `IPage` abstraction, not raw Puppeteer
3. **Ordered**: Injections have dependencies — `wapi.js` before `launch.js`, exposed fns before observer, etc.
4. **Idempotent**: Re-injection must be safe to call multiple times
5. **Observable**: The system should emit events when re-injection happens
6. **Centralized**: One place that knows the full injection inventory, not scattered across Transport

---

## Key Insight: Two Categories of Injections

Puppeteer's `exposeFunction` creates bindings that **survive page navigation** — they're attached to the browser context, not the page DOM. But `evaluate`/`evaluateScript` calls are ephemeral — they only live in the current page context.

This gives us a natural split:

### Category A: Context Bindings (survive refresh)
| Binding | Purpose |
|---|---|
| `ProgressBarEvent` | Progress bar callback |
| `CriticalInternalMessage` | Critical message callback |
| `onMessage` | Message listener bridge |
| `onAck` | Ack listener bridge |
| `onAnyMessage` | Any message listener bridge |
| ... (all SimpleListener names) | Event listener bridges |

These only need to be set up **once** per browser context.

### Category B: Page Scripts (die on refresh)
| Script | Purpose | Dependencies |
|---|---|---|
| `prog_observer.js` | MutationObserver for progress bar | Category A `ProgressBarEvent` fn |
| `wapi.js` | Core WA API bundle | None |
| `launch.js` | WAPI finalizer | `wapi.js` |
| `init_patch.js` | WebPack module interceptor | `wapi.js` |
| Patch artifacts | Remote patches | `wapi.js` |
| License artifacts | License payload | `wapi.js` |
| Listener bindings | `WAPI.onX(obj => window.onX(obj))` | `wapi.js` + Category A fns |

These need to be **reinjected every time the page navigates**.

---

## Proposed Architecture: `InjectionController`

### Core concept

A single `InjectionController` that:
1. Owns the complete injection inventory
2. Registers all Category A bindings once during init
3. Runs Category B injections in a defined order
4. Watches for page lifecycle events and re-runs Category B when needed
5. Emits events on the HyperEmitter so the rest of the system can react

### Injection layers (ordered)

```
Layer 0: Context Bindings      ← exposeFunction(), survives refresh
          ↓
Layer 1: Boot Observers        ← prog_observer.js (only needed during boot)
          ↓
Layer 2: Core Runtime          ← wapi.js + launch.js
          ↓
Layer 3: Patches & License     ← init_patch.js + remote patches + license
          ↓
Layer 4: Event Bridge          ← WAPI.onX(obj => window.onX(obj)) for all listeners
```

## Event-Driven Injection & Remote Patch Engine

To future-proof the monorepo and v4 parity functionality, the `InjectionController` will not be a static, hardcoded script runner. Instead, it will be an **Event-Driven Patch Engine**. 

It will listen to both **Page Events** (e.g. `framenavigated`) and **Session Events** (e.g., `session.state.changed`, `session.auth.qrcode_scanned`). 

Instead of baking scripts directly into the codebase, we design the architecture around a dynamic payload schema that can eventually be delivered as one massive payload from the patch server. This means we will no longer need to constantly hardcode `init_patch.js` or fix injection orders manually.

### Dynamic Payload Schema

The `InjectionController` will consume arrays of `PatchPayload` objects. This schema allows patches to be fetched remotely, conditionally executed, and automatically triggered based on system state.

```typescript
interface PatchPayload {
  name: string;               // Human readable name (e.g. "init patch")
  id: string;                 // Unique identifier for the patch
  version: string;            // Semver for capability matching
  ttl: number;                // Cache time-to-live. -1 = never cache (always fetch fresh)
  
  preconditions: {            // Rules that must pass before injection is allowed
    type: "wa_version" | "config_has" | "dom_present" | "wapi_healthy";
    value: string | boolean;  // e.g. ">= 2.22" or "sessionId"
  }[];
  
  triggers: {                 // What causes this patch to be injected?
    type: "session_event" | "page_event" | "lifecycle_hook";
    event: string;            // e.g. "session.state.changed", "framenavigated", "before:client:init"
  }[];
  
  dependencies: string[];     // IDs of other patches that must be injected BEFORE this one
  
  operations: {               // The actual injection operations
    type: "evaluate" | "expose_function" | "mutation_observer";
    content: string;          // The JS payload or function name
  }[];
  
  rollback?: {                // Optional: How to cleanly remove this patch if WAPI drops
    type: "evaluate";
    content: string;
  };
}
```

### Re-injection / Event Handling strategy

Because it's event driven:
1. When a page navigation (`framenavigated`) or a QR scan is detected by a mutation observer, it fires an event on the `HyperEmitter`.
2. The `InjectionController` cross-references registered patches where trigger matches the event.
3. It evaluates the `preconditions` of those patches.
4. It topologically sorts them by `dependencies`.
5. It executes the `operations`.

This solves the problem elegantly: WAPI gets injected because it's triggered `on: ['lifecycle.boot']`. Listener bindings get injected `on: ['after:wapi:injected']`. Re-injection on reload happens because the triggers listen to `framenavigated` and assert a precondition of `"wapi_healthy": false`.

### Driver interface gap: `on()`

The `IPage` interface currently has **no event listener method**. We need to add it.

```typescript
// packages/driver-interface/src/driver.ts
export interface IPage {
  // ... existing methods ...

  /**
   * Subscribe to page lifecycle events.
   * These events inform the host when the browser page state changes.
   */
  on(event: 'framenavigated', handler: (url: string) => void): void;
  on(event: 'load', handler: () => void): void;
  on(event: 'console', handler: (type: string, text: string) => void): void;
  on(event: 'pageerror', handler: (message: string) => void): void;
  on(event: 'close', handler: () => void): void;

  /**
   * Remove a previously registered event handler.
   */
  off(event: string, handler: (...args: any[]) => void): void;
}
```

The PuppeteerPage adapter maps these to native Puppeteer events:

```typescript
// packages/driver-puppeteer/src/PuppeteerPage.ts
on(event: string, handler: (...args: any[]) => void): void {
  switch (event) {
    case 'framenavigated':
      this.page.on('framenavigated', (frame) => {
        if (frame === this.page.mainFrame()) handler(frame.url());
      });
      break;
    case 'load':
      this.page.on('load', handler);
      break;
    case 'console':
      this.page.on('console', (msg) => handler(msg.type(), msg.text()));
      break;
    case 'pageerror':
      this.page.on('pageerror', (err) => handler(err.message));
      break;
    case 'close':
      this.page.on('close', handler);
      break;
  }
}
```

### InjectionController interface

```typescript
interface InjectionState {
  contextBindingsReady: boolean;    // Layer 0
  bootObserversInjected: boolean;   // Layer 1
  coreRuntimeInjected: boolean;     // Layer 2
  patchesApplied: boolean;          // Layer 3
  eventBridgeBound: boolean;        // Layer 4
}

class InjectionController {
  private state: InjectionState;
  private page: IPage;
  private emitter: HyperEmitter;
  private scriptLoader: ScriptLoader;
  private patchArtifacts: PatchArtifact[];
  private licenseArtifact: LicenseArtifact | null;
  private bridgeCallbacks: Map<string, Function>;

  /**
   * Phase 1: Set up context bindings (called once, survives refresh)
   */
  async setupContextBindings(): Promise<void>;

  /**
   * Phase 2: Inject boot-time observers (pre-auth only)
   */
  async injectBootObservers(): Promise<void>;

  /**
   * Phase 3: Inject core WAPI runtime
   * Returns true if WAPI + launch.js are alive
   */
  async injectCoreRuntime(): Promise<boolean>;

  /**
   * Phase 4: Apply patches and license
   * Called when patch/license artifacts are available
   */
  async applyPatchesAndLicense(
    patches: PatchArtifact[],
    license: LicenseArtifact | null
  ): Promise<void>;

  /**
   * Phase 5: Bind event bridge
   * Connects WAPI listeners to exposeFunction callbacks
   */
  async bindEventBridge(): Promise<void>;

  /**
   * Full re-injection after navigation
   * Checks what's alive and reinjects what's missing
   */
  async handlePageNavigation(url: string): Promise<void>;

  /**
   * Health check: is the runtime usable?
   */
  async isRuntimeHealthy(): Promise<boolean>;

  /**
   * Session Migration: Support for the legacy "Refresh" pattern
   * Attaches the controller to a completely new page tab, re-binding Layer 0
   */
  async migrateToPage(newPage: IPage): Promise<void>;
}
```

### Navigation handler implementation

```typescript
async handlePageNavigation(url: string): Promise<void> {
  // Logout detection
  if (url.includes('post_logout=1')) {
    this.emitter.emit('session.logout.detected', { url });
    return; // Don't reinject on logout page
  }

  this.emitter.emit('session.navigation.detected', { url });

  // Check WAPI health
  const wapiAlive = await this.isRuntimeHealthy();

  if (!wapiAlive) {
    // Full re-injection needed
    this.state.coreRuntimeInjected = false;
    this.state.patchesApplied = false;
    this.state.eventBridgeBound = false;

    this.emitter.emit('session.reinject.starting', { reason: 'wapi_lost' });

    await this.injectCoreRuntime();

    // Only re-apply patches if we had them before
    if (this.patchArtifacts.length > 0 || this.licenseArtifact) {
      await this.applyPatchesAndLicense(this.patchArtifacts, this.licenseArtifact);
    }

    await this.bindEventBridge();

    this.emitter.emit('session.reinject.complete');
  } else {
    // WAPI alive but listeners may be gone
    // This happens when WA Web does a soft reload
    this.state.eventBridgeBound = false;
    await this.bindEventBridge();
    this.emitter.emit('session.bridge.rebound');
  }
}
```

### Event bridge implementation

The bridge connects WAPI browser-side listeners to Node-side exposed functions:

```typescript
async bindEventBridge(): Promise<void> {
  // The WAPI listener names that map to SimpleListener behavior
  const listeners = [
    'onMessage', 'onAnyMessage', 'onMessageDeleted', 'onAck',
    'onAddedToGroup', 'onChatDeleted', 'onBattery', 'onChatOpened',
    'onIncomingCall', 'onCallState', 'onGlobalParticipantsChanged',
    'onGroupApprovalRequest', 'onChatState', 'onLogout', 'onPlugged',
    'onStateChanged', 'onButton', 'onPollVote', 'onBroadcast',
    'onLabel', 'onStory', 'onRemovedFromGroup', 'onContactAdded',
    'onOrder', 'onNewProduct', 'onReaction', 'onGroupChange'
  ];

  // For each listener, tell WAPI to call the window-exposed function
  const bindScript = listeners.map(name =>
    `if (typeof WAPI !== 'undefined' && WAPI.${name}) {
       try { WAPI.${name}(obj => window.${name}(obj)); } catch(e) {}
     }`
  ).join('\n');

  await this.page.evaluateScript(bindScript);
  this.state.eventBridgeBound = true;
}
```

---

## Where it fits in Transport.ts

The `InjectionController` replaces the scattered injection calls in Transport:

### Before (current Transport.ts — scattered)

```
Transport.navigate()
  ├── exposeFunction('ProgressBarEvent', ...)     ← Layer 0
  ├── exposeFunction('CriticalInternalMessage', ...)  ← Layer 0
  └── injectProgObserver(page)                    ← Layer 1

Transport.injectWapi()
  ├── page.evaluateScript(wapi.js)                ← Layer 2
  └── page.evaluateScript(launch.js)              ← Layer 2

Transport.applyPatchArtifacts()
  ├── injectInitPatch(page)                       ← Layer 3
  ├── injectInternalEventHandler(page)            ← Layer 3 (stub)
  └── page.evaluateScript(artifact.script)        ← Layer 3

Transport.applyLicenseArtifact()
  └── page.evaluateScript(license.payload)        ← Layer 3
```

### After (with InjectionController — centralized)

```
Transport.navigate()
  └── this.injector.setupContextBindings()        ← Layer 0 (once)
  └── this.injector.injectBootObservers()         ← Layer 1

Transport.injectWapi()
  └── this.injector.injectCoreRuntime()           ← Layer 2

Transport.applyPatchArtifacts()
  └── this.injector.applyPatchesAndLicense(...)   ← Layer 3

(after auth + finalization)
  └── this.injector.bindEventBridge()             ← Layer 4

(page lifecycle — automatic)
  └── page.on('framenavigated', ...)
      └── this.injector.handlePageNavigation()    ← Layers 2-4 as needed
```

---

## Lifecycle flow diagram

```
┌──────────────────────────────────────────────────────────────┐
│                    BOOT SEQUENCE                              │
│                                                              │
│  1. Transport.initialize()                                    │
│     └── Launch browser + page                                │
│                                                              │
│  2. injector.setupContextBindings()                          │
│     ├── exposeFunction('ProgressBarEvent', ...)              │
│     ├── exposeFunction('CriticalInternalMessage', ...)       │
│     ├── exposeFunction('onMessage', ...)                     │
│     ├── exposeFunction('onAck', ...)                         │
│     └── ... all listener callbacks                           │
│     (these SURVIVE page refresh)                             │
│                                                              │
│  3. Transport.navigate()                                     │
│     ├── page.goto(WA_WEB_URL)                                │
│     ├── injector.injectBootObservers()                       │
│     │   └── prog_observer.js                                 │
│     └── page.on('framenavigated', handlePageNavigation)      │
│                                                              │
│  4. injector.injectCoreRuntime()                             │
│     ├── wapi.js                                              │
│     └── launch.js                                            │
│                                                              │
│  5. Wait for authentication                                  │
│                                                              │
│  6. injector.applyPatchesAndLicense(patches, license)        │
│     ├── init_patch.js                                        │
│     ├── Remote patch scripts                                 │
│     └── License payload                                      │
│                                                              │
│  7. injector.bindEventBridge()                               │
│     └── WAPI.onX(obj => window.onX(obj)) for all listeners  │
│                                                              │
│  8. READY                                                    │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│               ON PAGE REFRESH/NAVIGATE                        │
│                                                              │
│  framenavigated fires                                        │
│  └── handlePageNavigation(url)                               │
│      ├── if logout page → emit logout, stop                  │
│      ├── check WAPI health                                   │
│      ├── if WAPI dead:                                       │
│      │   ├── re-inject layers 2-4                            │
│      │   └── emit 'session.reinject.complete'                │
│      └── if WAPI alive:                                      │
│          ├── rebind layer 4 only                             │
│          └── emit 'session.bridge.rebound'                   │
└──────────────────────────────────────────────────────────────┘
```

---

## Implementation steps

1. **Add `on()`/`off()` to `IPage` interface** — minimal event subscription for page lifecycle
2. **Implement in `PuppeteerPage`** — map to native Puppeteer page events
3. **Create `InjectionController` class** — owns all injection state and logic
4. **Refactor `Transport`** — delegate all injection calls to `InjectionController`
5. **Wire frame-navigation handler** — `page.on('framenavigated')` → `injector.handlePageNavigation()`
6. **Implement `bindEventBridge()`** — the P0 gap for connecting WAPI to Node

### What does NOT change

- `createClient.ts` boot orchestration stays the same — it just talks to Transport
- `ScriptLoader.ts` stays the same — InjectionController uses it internally
- Event map stays the same — InjectionController maps bridge callbacks to HyperEmitter events
- The assets directory stays the same

### What this replaces

- All direct `page.exposeFunction()` calls in Transport
- All direct `page.evaluateScript()` calls for injection in Transport
- All `injectX()` functions in `initPatchScripts.ts` (become methods on InjectionController)
- The missing `framenavigated` handler
- The missing event bridge implementation

---

## Resolved Questions & Next Steps

1. **Should `InjectionController` be a standalone class or a mixin on Transport?**
   - **Resolved**: Standalone class, constructed by Transport. It acts as the engine processing the dynamic payload schema.

2. **Should patch/license artifacts be cached in InjectionController for re-injection?**
   - **Resolved**: No. Not for now. We will work on caching later.

3. **Should we verify `exposeFunction` bindings actually survive navigation in current Chrome?**
   - **Resolved**: Yes. Do not assume behavior; verify via Puppeteer documentation and runtime testing. While we use a driver abstraction, we are concentrating strictly on Puppeteer for now to ensure stability.

4. **Should `page.on('console')` and `page.on('pageerror')` forwarding be part of this system?**
   - **Resolved**: Yes. There is a `log-console` (`logConsole`) flag in the config that should be emitting logs from within the session. This will be wired through the driver abstraction's new `on()` interface.

5. **Does the new architecture support the legacy `client.refresh()` multi-tab hijack?**
   - **Resolved**: Yes. The legacy `refresh()` created a new tab, waited for a conflict in the old tab, and swapped `waPage`. Our new `InjectionController` will implement a `migrateToPage(newPage: IPage)` method. Because `exposeFunction` (Layer 0) is bound to the specific `page` instance, `migrateToPage` will safely update its internal `this.page` reference, re-bind all Layer 0 functions uniquely to the new tab, and prepare to execute Layers 1-4, allowing seamless session context-switching without bringing down the Node.js process.
