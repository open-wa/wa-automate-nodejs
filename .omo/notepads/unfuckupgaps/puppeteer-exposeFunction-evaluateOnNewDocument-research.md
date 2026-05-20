# Puppeteer `exposeFunction` & `evaluateOnNewDocument` / Init Script Semantics

## Research Date: 2026-04-04
## Workspace Puppeteer Version: 23.11.1

---

## 1. `page.exposeFunction()` — Official Docs & Behavior

### Official Documentation
- **pptr.dev**: https://pptr.dev/api/puppeteer.page.exposefunction
- **Key quote**: "The method adds a function called `name` on the page's `window` object. When called, the function executes `puppeteerFunction` in Node.js and returns a Promise which resolves to the return value of `puppeteerFunction`."
- **Critical note**: "Functions installed via `page.exposeFunction` **survive navigations**."

### How It Works Internally (from source code)

`exposeFunction` does **two things** under the hood:

1. **`Runtime.addBinding`** (CDP) — Registers a CDP binding on the page. This is a low-level mechanism that allows calling Node.js from the browser.
2. **`Page.addScriptToEvaluateOnNewDocument`** (CDP) — Registers a JS wrapper script that creates a user-friendly `window[name]` function that communicates back via the binding.

From the Puppeteer source (`packages/puppeteer-core/src/cdp/Frame.ts`, line ~336):

```typescript
async addExposedFunctionBinding(binding: Binding): Promise<void> {
    // If a frame has not started loading, it might never start. Rely on
    // addScriptToEvaluateOnNewDocument in that case.
    if (this !== this._frameManager.mainFrame() && !this._hasStartedLoading) {
      return;
    }
    await Promise.all([
      this.#client.send('Runtime.addBinding', {
        name: CDP_BINDING_PREFIX + binding.name,
      }),
      this.evaluate(binding.initSource).catch(debugError),  // ALSO injects into current page
    ]);
}
```

**KEY FINDING**: For frames that HAVE started loading, `exposeFunction` does BOTH:
- `Runtime.addBinding` (registers for current + future)
- `this.evaluate(binding.initSource)` — **directly evaluates the wrapper on the current page**

For frames that have NOT started loading, it relies solely on `addScriptToEvaluateOnNewDocument`.

### Timing: Does `exposeFunction` AFTER `goto()` Work on Already-Loaded Page?

**YES — it works on the already-loaded page.**

Evidence:
1. **Official docs example** shows `exposeFunction` used after page creation without any `goto()` — it works on `about:blank` and then survives navigation.
2. **Source code** confirms it calls `this.evaluate(binding.initSource)` which injects into the current execution context.
3. **GitHub Issue #2170** reported it NOT working after `goto()` in Puppeteer v1.1.1, but this was a **historical bug** (2018) that has been fixed. Modern Puppeteer (v20+) handles this correctly.

**Caveat**: There was a historical bug where `exposeFunction` called after `goto()` didn't work (Issue #2170). This was fixed long ago. In modern Puppeteer (v20+, and certainly v23.11.1 used here), calling `exposeFunction` after `goto()` works on the already-loaded page.

### Navigation Survival

**YES — explicitly documented and implemented:**

The internal mechanism uses `Page.addScriptToEvaluateOnNewDocument` to re-inject the wrapper on every new document. This means:
- ✅ Full page reloads (`page.reload()`, `page.goto()` to new URL)
- ✅ Cross-document navigations
- ✅ Child frame attachment and navigation
- ❌ SPA pushState/replaceState (same-document) — these don't create new documents, so init scripts don't re-run. However, the binding itself (`Runtime.addBinding`) persists.

### Known Issues with `exposeFunction`

| Issue | GitHub | Status | Description |
|-------|--------|--------|-------------|
| BFCache breaks exposeFunction | [#12662](https://github.com/puppeteer/puppeteer/issues/12662) | Fixed (PR [#12663](https://github.com/puppeteer/puppeteer/pull/12663)) | After bfcache restore, wrapper lost → `Invalid arguments: should be exactly one string` |
| PDF iframe hang | [#12172](https://github.com/puppeteer/puppeteer/issues/12172) | Fixed (v22.6.2) | `exposeFunction` hangs forever when page has iframe pointing to PDF |
| Stuck waiting forever | [#8106](https://github.com/puppeteer/puppeteer/issues/8106) | Fixed (PR [#11600](https://github.com/puppeteer/puppeteer/pull/11600)) | Race condition during frame loading causes promise to never resolve |
| Firefox BiDi incompatibility | [#11653](https://github.com/puppeteer/puppeteer/issues/11653) | Fixed (PR [#11660](https://github.com/puppeteer/puppeteer/pull/11660)) | Promise stays pending on Firefox |
| Called once only | [#12559](https://github.com/puppeteer/puppeteer/issues/12559) | Fixed (PR [#12560](https://github.com/puppeteer/puppeteer/pull/12560)) | Exposed function could only be called once in some scenarios |
| Double-name error | — | Expected behavior | `"Failed to add page binding with name X: window[X] already exists!"` if exposed twice. Use `removeExposedFunction()` (v20.6.0+) first |

### PR #11600 — Critical Reliability Fix (Merged Jan 2024)

This PR fixed the most impactful bugs:

1. **Prevents double-wrapping** during frame loading race conditions
2. **Clears execution context on frame navigation** — rejects pending evaluate calls instead of hanging forever
3. **Skips installing into frames that haven't started loading** — iframes may never load; preload scripts handle them later

---

## 2. `page.evaluateOnNewDocument()` — Official Docs & Behavior

### Official Documentation
- **pptr.dev**: https://pptr.dev/api/puppeteer.page.evaluateonnewdocument
- **Key quote**: "Adds a function which would be invoked in one of the following scenarios:
  - whenever the page is navigated
  - whenever the child frame is attached or navigated. In this case, the function is invoked in the context of the newly attached frame.
  The function is invoked **after the document was created but before any of its scripts were run**."

### Underlying CDP Method
- `Page.addScriptToEvaluateOnNewDocument` — https://chromedevtools.github.io/devtools-protocol/tot/Page/#method-addScriptToEvaluateOnNewDocument
- Parameters: `source` (string), `worldName` (optional), `includeCommandLineAPI` (optional), `runImmediately` (optional)

### `evaluateOnNewDocument` vs `addInitScript`

**These are NOT the same API in different versions:**
- `evaluateOnNewDocument` = Puppeteer API
- `addInitScript` = **Playwright** API (not Puppeteer)

**In this codebase** (`@open-wa/wa-automate`), `addInitScript` is a custom wrapper around `evaluateOnNewDocument`:
```typescript
async addInitScript(script: string): Promise<DisposableHandle> {
    const registration = await (this.page as any).evaluateOnNewDocument(script);
}
```

### CRITICAL: Does `evaluateOnNewDocument` AFTER `goto()` Affect the Current Page?

**NO — it only affects FUTURE navigations.**

From the official docs: the function is invoked "whenever the page is navigated" — past tense implies it runs on navigation events, not immediately.

From the CDP docs: `Page.addScriptToEvaluateOnNewDocument` — "Evaluates given script in every frame **upon creation** (before loading frame's scripts)."

If the document already exists, no new document creation occurs, so the script does **not** execute.

**Exception**: The CDP protocol has a `runImmediately` parameter that CAN run the script on existing execution contexts. However, Puppeteer's `evaluateOnNewDocument()` does **not** expose this parameter.

### Correct Pattern

```typescript
// ✅ CORRECT - register BEFORE goto to affect that navigation
await page.evaluateOnNewDocument(() => { /* setup */ });
await page.goto(url);  // Script runs during this navigation

// ❌ WRONG - calling after goto won't affect current page
await page.goto(url);
await page.evaluateOnNewDocument(() => { /* won't run on current page */ });

// ✅ If you need to affect already-loaded page, use evaluate()
await page.goto(url);
await page.evaluate(() => { /* runs immediately on current page */ });
```

### Navigation Survival

- ✅ Full page reloads and cross-document navigations — script re-runs
- ✅ Child frame attachment — script runs in new frame context
- ❌ SPA pushState/replaceState — same-document navigations do NOT create new documents
- ❌ Already-loaded page — script is queued, not executed

### Known Issues with `evaluateOnNewDocument`

| Issue | Source | Description |
|-------|--------|-------------|
| OOPIF reliability | [#12706](https://github.com/puppeteer/puppeteer/issues/12706), PR [#12714](https://github.com/puppeteer/puppeteer/pull/12714) | Cross-origin iframes (Out-of-Process iFrames) may not get scripts reliably |
| Runtime.evaluate race | [CDP #182](https://github.com/ChromeDevTools/devtools-protocol/issues/182) | `Runtime.evaluate` can execute before `addScriptToEvaluateOnNewDocument` scripts run |
| Extension conflict | [#11432](https://github.com/puppeteer/puppeteer/issues/11432) | Changes may not be visible to extension content scripts |
| Firefox | [#6163](https://github.com/puppeteer/puppeteer/issues/6163) | Was broken, reportedly fixed |

---

## 3. Post-`goto()` Activation Strategy — What's Safe?

### Summary Table

| API | Works on already-loaded page? | Survives future navigations? | Must call before `goto()`? |
|-----|------------------------------|------------------------------|---------------------------|
| `exposeFunction` | ✅ YES | ✅ YES | ❌ No (but recommended) |
| `evaluateOnNewDocument` | ❌ NO | ✅ YES | ✅ YES (to affect that navigation) |
| `evaluate` | ✅ YES | ❌ NO (one-shot) | N/A |

### Safe Post-`goto()` Activation Strategy

Given the codebase needs (WhatsApp Web automation with QR scanning + controller injection):

**Strategy: Hybrid pre/post registration**

```typescript
// 1. BEFORE goto: Register evaluateOnNewDocument scripts
//    These set up the environment BEFORE page scripts run
await page.evaluateOnNewDocument(controllerSetupScript);

// 2. BEFORE goto: Optionally pre-register exposeFunction bindings
//    These will survive navigation and be available immediately
await page.exposeFunction('onProgress', progressHandler);
await page.exposeFunction('onQr', qrHandler);

// 3. Navigate
await page.goto(whatsappWebUrl);

// 4. AFTER goto: exposeFunction STILL WORKS on current page
//    Safe to call post-navigation if needed
await page.exposeFunction('onMessage', messageHandler);

// 5. AFTER goto: Use evaluate() for one-shot injection into current page
await page.evaluate(injectControllerCode);
```

### Why Moving Controller Activation After `goto()` Should Be Safe

1. **`exposeFunction` works post-`goto()`** — It does `Runtime.addBinding` + `evaluate(initSource)` on the current execution context
2. **Navigation survival is built-in** — Both mechanisms register `addScriptToEvaluateOnNewDocument` internally
3. **Historical bugs are fixed** — Issue #2170 (exposeFunction after goto) was fixed years ago; PR #11600 resolved race conditions

### Caveats for Post-`goto()` Activation

1. **Race window**: If WhatsApp Web navigates internally between `goto()` resolving and `exposeFunction` completing, the binding may be registered for the wrong context. Solution: listen for navigation events and re-register.

2. **SPA navigations**: Same-document navigations (pushState) don't trigger `addScriptToEvaluateOnNewDocument`. If the page does SPA navigation, init scripts won't re-run. However, `Runtime.addBinding` persists across same-document navigations.

3. **BFCache**: If the page is restored from back-forward cache, bindings may not be properly restored (Issue #12662). Fixed in v22.12.0+.

4. **Don't call `exposeFunction` from within `evaluateOnNewDocument`**: The exposed function binding may not be available yet when init scripts run (Issue #6012).

---

## 4. Page Crash/Freeze Issues

### `page.on('error')` vs `page.on('pageerror')` vs `page.on('crash')`

| Event | When it fires | Severity |
|-------|--------------|----------|
| `page.on('error')` | Page **crashes** (main frame process dies) | Fatal — page is dead |
| `page.on('pageerror')` | Uncaught JS exception in page | Recoverable |
| `page.on('crash')` | Same as error — renderer process crash | Fatal |

**Critical**: Register ALL event handlers BEFORE `goto()`. Crashes can happen during navigation.

### Known Crash Triggers

1. **`exposeFunction` with PDF iframes** — Hangs forever (Issue #12172)
2. **Race conditions during frame loading** — Promise never resolves (Issue #8106, fixed in PR #11600)
3. **BFCache restore** — Binding wrapper lost (Issue #12662)
4. **"Execution context was destroyed"** — Navigation during `evaluate()` call. Common in WhatsApp Web during internal navigation (wwebjs Issue [#3632](https://github.com/pedroslopez/whatsapp-web.js/issues/3632))

### WhatsApp Web-Specific Concerns

From whatsapp-web.js issues:
- Long-running sessions (2-10 hours) prone to "Execution context was destroyed"
- Internal WA navigations can occur without full page reloads
- The `inject()` function can fail after sleep/resume (wwebjs PR [#127083](https://github.com/pedroslopez/whatsapp-web.js/pull/127083))

---

## 5. Source Index

### Official Documentation
| Source | URL |
|--------|-----|
| pptr.dev — exposeFunction | https://pptr.dev/api/puppeteer.page.exposefunction |
| pptr.dev — evaluateOnNewDocument | https://pptr.dev/api/puppeteer.page.evaluateonnewdocument |
| CDP — addScriptToEvaluateOnNewDocument | https://chromedevtools.github.io/devtools-protocol/tot/Page/#method-addScriptToEvaluateOnNewDocument |
| CDP — addBinding | https://chromedevtools.github.io/devtools-protocol/tot/Runtime/#method-addBinding |

### Puppeteer Source Code
| File | URL |
|------|-----|
| Frame.ts (exposeFunction internals) | https://github.com/puppeteer/puppeteer/blob/main/packages/puppeteer-core/src/cdp/Frame.ts |
| FrameManager.ts (evaluateOnNewDocument) | https://github.com/puppeteer/puppeteer/blob/main/packages/puppeteer-core/src/cdp/FrameManager.ts |
| utils.ts (binding wrapper logic) | https://github.com/puppeteer/puppeteer/blob/main/packages/puppeteer-core/src/cdp/utils.ts |

### GitHub Issues & PRs
| Ref | Title | URL |
|-----|-------|-----|
| #2170 | exposeFunction() does not work after goto() (HISTORICAL — fixed) | https://github.com/puppeteer/puppeteer/issues/2170 |
| #8106 | exposeFunction() sometimes gets stuck waiting forever | https://github.com/puppeteer/puppeteer/issues/8106 |
| #11600 | fix: improve reliability of exposeFunction | https://github.com/puppeteer/puppeteer/pull/11600 |
| #12172 | exposeFunction hangs with PDF iframe | https://github.com/puppeteer/puppeteer/issues/12172 |
| #12662 | BFCache behavior breaks exposeFunction | https://github.com/puppeteer/puppeteer/issues/12662 |
| #12663 | Fix: bindings after bfcache restore | https://github.com/puppeteer/puppeteer/pull/12663 |
| #12559/#12560 | Exposed function called once only | https://github.com/puppeteer/puppeteer/pull/12560 |
| #6230 | Execute evaluateOnNewDocument every time before page loads | https://github.com/puppeteer/puppeteer/issues/6230 |
| #6012 | Calling exposeFunction from evaluateOnNewDocument fails | https://github.com/puppeteer/puppeteer/issues/6012 |
| CDP #182 | Runtime.evaluate before addScriptToEvaluateOnNewDocument race | https://github.com/ChromeDevTools/devtools-protocol/issues/182 |

### Stack Overflow & Blogs
| Source | URL |
|--------|-----|
| How to use evaluateOnNewDocument and exposeFunction | https://stackoverflow.com/questions/46113267/how-to-use-evaluateonnewdocument-and-exposefunction |
| How to handle page crashed exception | https://stackoverflow.com/questions/59384012/how-to-handle-page-crashed-exception-in-node-js-puppeteer |
| "Execution context was destroyed" fix | https://screenshotone.com/blog/puppeteer-execution-context-was-destroyed-most-likely-because-of-a-navigation/ |

### WhatsApp Web.js Issues
| Ref | Title | URL |
|-----|-------|-----|
| #3632 | Execution context was destroyed | https://github.com/pedroslopez/whatsapp-web.js/issues/3632 |
| #127083 | Fix inject() resilient to page navigation | https://github.com/pedroslopez/whatsapp-web.js/pull/127083 |
