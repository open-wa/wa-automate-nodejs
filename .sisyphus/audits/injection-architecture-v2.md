# Injection Architecture v2

## Status

Proposed replacement for the current `InjectionController` draft in `injection-architecture.md`.

This version is intentionally stricter about lifecycle ownership, page refresh handling, and partial-runtime states.

---

## 1. Goals

1. Never lose the Browser -> Node bridge because a page loaded before bindings existed.
2. Never let an older navigation or runtime instance mark a newer one as healthy.
3. Never duplicate page-side listeners or patch application on refresh / soft reload.
4. Support WhatsApp Web full navigations **and** SPA runtime replacement.
5. Keep patch orchestration simple enough to debug under hostile timing.

## 2. Non-goals

1. Do not build a generic plugin platform yet.
2. Do not use a fully dynamic topological engine unless real patch interactions require it.
3. Do not collapse readiness into a single boolean.

---

## 3. Core design decision

Use a **generation-based phased controller**, not a free-form event DAG.

There are three distinct scopes that must not be conflated:

1. **Browser context generation** — bridge bindings and new-document scripts registered against a page handle.
2. **Document generation** — a concrete HTML document created by navigation.
3. **Runtime generation** — the active WhatsApp runtime/store instance inside that document.

The controller must treat all async work as scoped to one of these generations.

If a newer generation appears, late results from older generations must be ignored.

---

## 4. State model

```ts
type InjectionPhase =
  | "idle"
  | "bindings_registered"
  | "preload_registered"
  | "document_observed"
  | "runtime_detected"
  | "store_detected"
  | "session_ready"
  | "patches_applied"
  | "bridge_ready"
  | "degraded"
  | "disposed";

interface GenerationRef {
  browserContextId: string;
  documentId: string;
  runtimeId: string | null;
}

interface RuntimeHealth {
  generation: GenerationRef;
  phase: InjectionPhase;
  bridgeBound: boolean;
  preloadRegistered: boolean;
  runtimePresent: boolean;
  storePresent: boolean;
  hasStoreMsg: boolean;
  sessionLoaded: boolean;
  bridgeReady: boolean;
  appliedPatchIds: string[];
  degradedReasons: string[];
  lastError?: {
    message: string;
    stack?: string;
    ts: number;
  };
}
```

### Why this matters

The existing repo already distinguishes richer capability states than a single `wapi_healthy` bit:

- `hasRuntime`
- `hasStoreMsg`
- `sessionLoaded`

That existing shape should be preserved and extended, not simplified.

---

## 5. Controller phases

The controller should execute in **phase buckets**.

### Phase A — Bindings registration

Must happen **before** navigation that matters.

Responsibilities:

1. Register `exposeFunction` bindings.
2. Register `evaluateOnNewDocument` / init scripts.
3. Mark the browser context generation as active.

Rules:

- Binding installation must be idempotent.
- Do not mark this phase successful if any required binding failed to install.
- Bindings are page-level infrastructure, not runtime readiness.

### Phase B — Document observation

Triggered when a new main-frame document is seen.

Responsibilities:

1. Increment `documentId`.
2. Abort stale async work from prior document/runtime generations.
3. Reset document-scoped readiness flags.

Rules:

- Ignore non-main-frame navigation unless explicitly required.
- `framenavigated` is a hint, not proof of runtime readiness.

### Phase C — Runtime detection

Triggered by preload observers, polling, or explicit capability probes.

Responsibilities:

1. Detect whether the WhatsApp runtime exists.
2. Detect store availability and minimum symbols (`Store`, `Store.Msg`, etc.).
3. Derive a runtime fingerprint and increment `runtimeId` if the runtime instance changed.

Rules:

- Runtime replacement can occur without full navigation.
- Replacing `window.Store` or equivalent must invalidate prior patch application.

### Phase D — Session readiness

Responsibilities:

1. Determine whether the runtime is loaded enough for session-level patches.
2. Distinguish QR/auth-required from authenticated/ready.

Rules:

- `storePresent` does not imply `sessionLoaded`.
- `sessionLoaded` does not imply event bridge is bound.

### Phase E — Patch application

Responsibilities:

1. Apply phase-appropriate patch contracts.
2. Verify each patch.
3. Record per-runtime patch application.

Rules:

- Patches must be idempotent.
- A patch without a verification strategy is not eligible to block readiness.

### Phase F — Bridge ready

Responsibilities:

1. Attach WAPI/event bridge listeners only after runtime/store/session preconditions are met.
2. Expose a stable “ready for client” state.

Rules:

- Bridge attachment must be page-side singleton-aware.
- Rebinding must dispose prior runtime listeners.

---

## 6. Driver contract changes

The current driver abstraction is too weak for this architecture.

### Required additions to `IPage`

```ts
interface DisposableHandle {
  dispose(): Promise<void> | void;
}

interface IPage {
  goto(url: string, options?: { waitUntil?: "load" | "domcontentloaded" | "networkidle0" | "networkidle2"; timeout?: number }): Promise<void>;
  evaluate<T>(fn: (...args: any[]) => T | Promise<T>, ...args: any[]): Promise<T>;
  evaluateScript<T = unknown>(script: string): Promise<T>;
  exposeFunction(name: string, fn: (...args: any[]) => any): Promise<void>;
  addInitScript(script: string): Promise<DisposableHandle>;
  on(event: string, handler: (...args: any[]) => void): DisposableHandle;
  waitForFunction(script: string, options?: { timeout?: number }): Promise<void>;
}
```

### Important constraint

`on/off` wrappers must not use anonymous wrapper functions unless the wrapper reference is retained.

Otherwise listener removal will silently fail.

---

## 7. Listener ownership model

All listeners must be owned by a disposable registry.

```ts
class DisposableRegistry {
  private readonly disposers = new Set<() => Promise<void> | void>();

  add(disposer: () => Promise<void> | void) {
    this.disposers.add(disposer);
  }

  async disposeAll() {
    const tasks = [...this.disposers].map(fn => Promise.resolve(fn()));
    this.disposers.clear();
    await Promise.allSettled(tasks);
  }
}
```

There should be:

1. one registry for page/driver listeners,
2. one registry for runtime-scoped patch disposers,
3. one registry for page-side bridge/listener singleton cleanup hooks.

On document or runtime rollover:

- dispose old runtime-scoped listeners,
- keep page-level infrastructure only if still valid,
- never re-attach without checking idempotency.

---

## 8. Patch model v2

Replace `PatchPayload` with a patch **contract**.

```ts
type PatchPhase = "preload" | "runtime" | "post_store" | "post_session" | "bridge";
type PatchApplyPolicy = "once_per_context" | "once_per_document" | "once_per_runtime";
type PatchFailurePolicy = "fail" | "retry" | "skip" | "degrade" | "defer";

interface PatchContract {
  id: string;
  name: string;
  phase: PatchPhase;

  requires?: string[];
  provides?: string[];
  conflictsWith?: string[];

  applyPolicy: PatchApplyPolicy;
  idempotencyKey: string;

  preconditions?: {
    configHas?: string[];
    domPresent?: string;
    runtimePresent?: boolean;
    storePresent?: boolean;
    sessionLoaded?: boolean;
    minCapabilities?: string[];
  };

  script: string;
  verifyScript?: string;
  disposeScript?: string;

  timeoutMs: number;
  retries?: number;
  backoffMs?: number;
  failurePolicy: PatchFailurePolicy;

  required?: boolean;
}
```

### Notes

1. `dependsOn` becomes `requires` plus `phase`.
2. `on` is replaced by phase transitions and controller-generated lifecycle decisions.
3. `rollback` is replaced by `disposeScript` because cleanup matters more than reversal.
4. `verifyScript` is mandatory for required patches.

---

## 9. Why phases beat a full topo engine right now

Most real dependencies here are phase dependencies:

1. preload before runtime,
2. runtime before store patches,
3. store before session patches,
4. session before event bridge.

A full DAG is only worth introducing if:

1. patches are independently authored by separate modules,
2. selective reapplication becomes common,
3. phase buckets can no longer express the ordering cleanly.

Until then, phase buckets plus `requires` are easier to debug.

---

## 10. Page-side idempotency rules

Every patch or bridge binding that attaches listeners inside the page must be singleton-aware.

Example demonstrating a stealth, dynamically injected property:

```js
// The injection controller generates a completely random, variable length alphanumeric string.
// No predictable prefixes or lengths to prevent signature-based detection.
// e.g. const stealthKey = Array.from(crypto.getRandomValues(new Uint8Array(12 + Math.random() * 10)))
//                           .map(b => b.toString(36)).join('').replace(/[^a-z]/g, '');

window[stealthKey] ??= {};
window[stealthKey].bridges ??= new Map();

function bindSingletonBridge(key, attach) {
  const existing = window[stealthKey].bridges.get(key);
  if (existing?.runtimeId === window[stealthKey].runtimeId) {
    return false;
  }

  existing?.dispose?.();
  const dispose = attach();
  window[stealthKey].bridges.set(key, {
    runtimeId: window[stealthKey].runtimeId,
    dispose,
  });
  return true;
}
```

By ensuring `stealthKey` is dynamically assigned by the `InjectionController` during execution, we leave no predictable static footprint (`__OPENWA__`) for anti-bot detection scripts to signature against. To be even stealthier, this state could be stored on an un-enumerable property via `Object.defineProperty()`.

---

## 11. Generation fencing

All long-running or retrying operations must carry a generation snapshot.

```ts
interface GenerationSnapshot {
  browserContextId: string;
  documentId: string;
  runtimeId: string | null;
}

function isCurrent(snapshot: GenerationSnapshot, current: RuntimeHealth): boolean {
  return (
    snapshot.browserContextId === current.generation.browserContextId &&
    snapshot.documentId === current.generation.documentId &&
    snapshot.runtimeId === current.generation.runtimeId
  );
}
```

Late completions must be ignored if `isCurrent()` returns false.

This is the main defense against stale async success after rapid refresh.

---

## 12. Navigation and runtime replacement handling

### Full navigation

On main-frame navigation:

1. increment `documentId`,
2. dispose runtime-scoped listeners,
3. reset runtime/session/patch readiness,
4. keep page-level bindings only if still valid for the same page handle.

### SPA runtime replacement

If the page stays loaded but runtime/store identity changes:

1. increment `runtimeId`,
2. dispose runtime-scoped listeners,
3. invalidate `appliedPatchIds`,
4. re-run runtime/post-store/post-session phases.

This event must not rely solely on `framenavigated`.

---

## 13. Health checks

Replace the proposed `wapi_healthy` boolean with a structured probe.

```ts
interface CapabilitySnapshot {
  hasRuntime: boolean;
  hasStore: boolean;
  hasStoreMsg: boolean;
  sessionLoaded: boolean;
  hasEventBridge: boolean;
  runtimeFingerprint?: string;
}
```

### Suggested classification

- `missing_runtime`
- `missing_store`
- `missing_store_msg`
- `session_not_loaded`
- `bridge_stale`
- `runtime_replaced`
- `patch_verification_failed`

Each class should map to a distinct recovery path.

---

## 14. Failure policy

Required patches may block readiness only if:

1. they have a verification strategy,
2. their failure policy is `fail`, and
3. the controller knows the failure belongs to the current generation.

Optional patches should degrade readiness, not poison the session.

Examples:

- license patch failure: may block,
- analytics bridge patch failure: degrade,
- DOM helper patch failure before auth: defer or skip.

---

## 15. Telemetry requirements

Emit counters and structured events for:

1. binding registration success/failure,
2. init-script registration success/failure,
3. document generation increments,
4. runtime generation increments,
5. patch apply / verify / dispose,
6. stale generation completions ignored,
7. listener counts by registry,
8. degraded readiness reasons.

Without this, field failures will look random.

---

## 16. Suggested implementation order

### Step 1 — Strengthen driver contract

Add init-script support and disposable listener handles.

### Step 2 — Build generation-aware controller shell

Implement:

1. health snapshot,
2. listener registries,
3. document/runtime generation tracking,
4. serialized reinjection queue.

### Step 3 — Port current capability probe

Reuse and formalize the existing richer transport/runtime checks.

### Step 4 — Convert current patches to contracts

Start with phased buckets:

- preload,
- runtime,
- post-store,
- post-session,
- bridge.

### Step 5 — Add page-side singleton bridge registry

Ensure repeated application disposes prior runtime listeners.

### Step 6 — Add telemetry and regression tests

Especially for:

1. fast refresh,
2. redirect before bridge install,
3. runtime replacement without navigation,
4. duplicate event prevention.

---

## 17. Minimal controller sketch

```ts
class InjectionController {
  private readonly pageRegistry = new DisposableRegistry();
  private runtimeRegistry = new DisposableRegistry();
  private health: RuntimeHealth;
  private reinjectionLock = Promise.resolve();

  async initialize(page: IPage) {
    await this.registerBindings(page);
    await this.registerPreload(page);
    this.attachPageLifecycle(page);
  }

  private attachPageLifecycle(page: IPage) {
    const navHandle = page.on("framenavigated", (...args) => {
      void this.enqueue(() => this.onMainFrameNavigation(...args));
    });
    this.pageRegistry.add(() => navHandle.dispose());
  }

  private enqueue(fn: () => Promise<void>) {
    this.reinjectionLock = this.reinjectionLock.then(fn, fn);
    return this.reinjectionLock;
  }

  private async onMainFrameNavigation() {
    this.bumpDocumentGeneration();
    await this.runtimeRegistry.disposeAll();
    await this.waitForRuntimeAndReconcile();
  }

  private async waitForRuntimeAndReconcile() {
    const capability = await this.probeCapability();
    if (!capability.hasRuntime) return;

    const runtimeChanged = this.reconcileRuntimeFingerprint(capability.runtimeFingerprint);
    if (runtimeChanged) {
      await this.runtimeRegistry.disposeAll();
      await this.applyPhase("runtime");
      await this.applyPhase("post_store");
      await this.applyPhase("post_session");
      await this.applyPhase("bridge");
    }
  }
}
```

---

## 18. Migration guidance from the current repo

1. Preserve the richer runtime capability checks already present in `Transport`.
2. Do not keep the old legacy-style `window.WAPI ? true : false` reinjection gate.
3. Move bridge/init-script registration ahead of `goto()` in the bootstrap path.
4. Treat current WAPI event binding helpers as non-idempotent until explicitly wrapped.
5. Keep remote patch/license artifact fetching decoupled from apply, but make apply runtime-scoped.

---

## 19. Decision summary

### Recommended now

- generation-aware controller,
- phased patch buckets,
- structured health snapshot,
- disposable listener ownership,
- page-side singleton bridge registry,
- verify/dispose-aware patch contracts.

### Defer for later

- full DAG patch engine,
- arbitrary patch event routing,
- generic plugin abstraction.

This gets the resilience benefits without burying the implementation under unnecessary orchestration complexity.
