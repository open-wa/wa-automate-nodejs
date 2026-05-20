# Puppeteer Browser Resolution Research Findings

## Date: 2026-04-04

---

## 1. Default Browser Resolution (No `executablePath` Provided)

### How it works in Puppeteer v23+/v24

When `puppeteer.launch()` is called **without** `executablePath`, the resolution chain is:

1. **Check `configuration.executablePath`** — From `.puppeteerrc.cjs` or env var `PUPPETEER_EXECUTABLE_PATH`. If set and the file doesn't exist, throws: `"Tried to find the browser at the configured path (${executablePath}), but no executable was found."`

2. **Check for channel** — If a `channel` option is provided (e.g., `'stable'`, `'beta'`, `'dev'`, `'canary'`), resolve via `computeSystemExecutablePath()` which uses hardcoded platform paths.

3. **Compute bundled browser path** — Uses `computeExecutablePath()` from `@puppeteer/browsers` which resolves to `~/.cache/puppeteer/` (or configured `cacheDirectory`). The exact binary depends on:
   - `headless: true` (default) → Downloads and uses **Chrome for Testing** (`chrome`)
   - `headless: 'shell'` → Downloads and uses **chrome-headless-shell** (a separate, stripped-down binary introduced in Puppeteer v21+)
   - `headless: false` → Same Chrome for Testing binary, just run headed

4. **Validate existence** — If the computed path doesn't exist on disk, throws a detailed error.

**Source:** `BrowserLauncher.resolveExecutablePath()` in `packages/puppeteer-core/src/node/BrowserLauncher.ts` (commit `6acfee6`, Nov 2024)

### macOS-specific paths (from source)

When using a `channel` on macOS:
- `stable`: `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`
- `beta`: `/Applications/Google Chrome Beta.app/Contents/MacOS/Google Chrome Beta`
- `dev`: `/Applications/Google Chrome Dev.app/Contents/MacOS/Google Chrome Dev`
- `canary`: `/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary`

Bundled browser cache: `~/.cache/puppeteer/chrome/<platform>-<version>/chrome-mac-<arch>/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`

**Source:** `packages/browsers/src/browser-data/chrome.ts` (resolveSystemExecutablePath)

### Key v23/v24 change: headless mode affects which binary

Starting with Puppeteer v21/v22, `headless: 'shell'` uses a **completely different binary** (`chrome-headless-shell`) than `headless: true` (which uses the full Chrome for Testing). This was a significant behavioral change:
- `headless: true` → Uses Chrome's "new headless" mode (--headless=new) with full Chrome binary
- `headless: 'shell'` → Uses chrome-headless-shell, a minimal headless-only binary
- `headless: false` → Runs the full Chrome binary with UI

**Source:** Puppeteer PR #11754 (feat: download chrome-headless-shell by default), Chrome Blog "Download old Headless Chrome as chrome-headless-shell" (March 2024)

### v23+ change: `executablePath()` gained overloads

As of v23.8+ (commit `6acfee6`, fixed issue #13308), `puppeteer.executablePath()` now accepts:
- No args → default path
- `channel: ChromeReleaseChannel` → system Chrome path for that channel
- `options: LaunchOptions` → path respecting headless mode (fixes bug where `headless: 'shell'` was ignored)

---

## 2. Explicit Chrome Executable Path

When `executablePath` is provided in `launch()` options:

1. **Bypasses all resolution logic** — Skips cache directory lookup, build ID resolution, and channel resolution entirely
2. **No validation of compatibility** — Puppeteer does not check if the provided binary matches the expected Chrome version or supports required CDP features
3. **No auto-download** — The user is responsible for ensuring the binary exists
4. **Validation only checks existence** — `if (!existsSync(executablePath))` → throws error

### puppeteer vs puppeteer-core distinction

- **`puppeteer`** (full package): Downloads a pinned Chrome for Testing version during `npm install`. Has a default browser to resolve.
- **`puppeteer-core`**: Does NOT download any browser. **Requires** either `executablePath` or `channel` in launch options, otherwise throws: `"An executablePath or channel must be specified for puppeteer-core"`

**Source:** `ChromeLauncher.launch()` in `packages/puppeteer-core/src/node/ChromeLauncher.ts`

---

## 3. Error/Failure Modes

### 3a. Bundled browser missing (most common)

**Error message (v23+/v24):**
```
Error: Could not find Chrome (ver. 135.0.7049.95). This can occur if either
1. you did not perform an installation before running the script (e.g. npx puppeteer browsers install chrome) or
2. your cache path is incorrectly configured (which is: /home/node/.cache/puppeteer).
For (2), check out our guide on configuring puppeteer at https://pptr.dev/guides/configuration.
```

**Causes:**
- `npm install` with `--ignore-scripts` (skips postinstall that downloads Chrome)
- Docker images where the cache dir is not persisted across layers
- Moving/deploying node_modules without the cache directory
- Running as a different user (cache dir is user-specific: `~/.cache/puppeteer/`)

**Source:** Issue #13809 (Puppeteer ^24.7.1 fails to find Chrome in Docker), Issue #14575 (Docker Image not including Chrome)

### 3b. Version mismatch between Puppeteer and bundled browser

If a different Chrome version is installed than what Puppeteer expects:
- Puppeteer hard-codes a specific Chrome version (e.g., `PUPPETEER_REVISIONS.chrome`) in its package
- Using a mismatched Chrome can cause missing CDP features or behavioral differences
- Error: `Could not find browser revision XXXXX`

**Source:** Issue #6560, Issue #6608 ("Could not find browser revision 809590")

### 3c. Apple Silicon (arm64) specific issues

**Historical (fixed):** On M1 Macs running arm64 Node.js, Puppeteer used to hardcode `/usr/bin/chromium-browser` (a Linux path) instead of checking the macOS Chrome path. This was fixed in later versions.

**Current:** On arm64 macOS, bundled Chrome for Testing now correctly resolves to the arm64 binary in `~/.cache/puppeteer/`.

**Source:** Issue #6641 (Wrong assumption of Chrome exec path on Apple Silicon M1)

### 3d. Configured path doesn't exist

```
Error: Tried to find the browser at the configured path (/path/to/chrome), but no executable was found.
```

This occurs when `PUPPETEER_EXECUTABLE_PATH` or config `executablePath` points to a non-existent file.

### 3e. PUPPETEER_EXECUTABLE_PATH overrides headless mode silently

Setting `PUPPETEER_EXECUTABLE_PATH` to the full Chrome binary while launching with `headless: 'shell'` silently overrides the chrome-headless-shell binary. This causes mysterious bugs because the full Chrome binary behaves differently than the headless shell.

**Source:** Issue #13308 comment by @jribbens: "at some point in the recent past further changes to puppeteer have had the effect that when I was launching it with headless: 'shell' this was being silently ignored / overridden by the environment variable"

---

## 4. Chromium (Bundled) vs Chrome (System) Differences for WhatsApp Web

### 4a. Why bundled Chromium gets detected but system Chrome doesn't

**Key differences between Puppeteer's Chromium and real Chrome:**

1. **User-Agent string**: Puppeteer's bundled Chromium reports `HeadlessChrome` in the UA string (in headless mode). Real Chrome does not. Even in headed mode, the Chrome for Testing binary may have subtle UA differences.

2. **`navigator.webdriver`**: When controlled via CDP, this returns `true`. WhatsApp Web checks this.

3. **`window.chrome` object**: Puppeteer's Chromium has a subtly different `window.chrome` — missing properties (`chrome.app`, `chrome.csi`, `chrome.loadTimes`, `chrome.runtime`), different method behaviors, or absent getters/setters. WhatsApp/Meta's bot detection enumerates these thoroughly.

4. **Plugin/MIME arrays**: Bundled Chromium reports empty `navigator.plugins` and `navigator.mimeTypes`. Real Chrome has entries from installed extensions and system plugins.

5. **Automation flags**: Puppeteer passes `--enable-automation`, `--disable-extensions`, and many other flags that modify browser behavior in detectable ways. These are NOT passed when launching system Chrome manually.

6. **CDP artifacts**: CDP connection creates extra execution contexts, modified console behavior, and timing differences that are detectable by sophisticated anti-bot systems.

7. **Chrome for Testing vs Chrome**: The "Chrome for Testing" binary is a specific build that anti-bot systems can fingerprint. It's not the same as a regular Chrome installation that normal users have.

**Source:** Reddit r/webscraping ("Puppeteer - Chromium getting detected as bot but chrome is not"), incolumitas.com ("Avoid Puppeteer or Playwright for Web Scraping"), UltraWebScrapingAPI ("Why Puppeteer and Playwright Get Blocked"), DataDome research

### 4b. WhatsApp Web-specific behavior

WhatsApp Web (used via `whatsapp-web.js` and similar libraries) has specific detection mechanisms:

1. **Browser version gating**: WhatsApp Web checks if the browser is a "supported" version. Puppeteer's pinned Chromium version may not match WhatsApp's support matrix, causing "update your browser" messages.

2. **Headless detection**: WhatsApp Web has been observed to block or limit headless browsers more aggressively than headed ones.

3. **The `puppeteer-extra-plugin-stealth` approach**: The whatsapp-web.js community attempted to integrate stealth plugins (PR #2190) to reduce detection. It was closed as "changes requested" — maintainers preferred it as an optional module rather than a forced dependency. Key quote: "keep the change you need to make (require puppeteer-extra) and simply require it from your script."

4. **Stealth plugins are themselves detectable**: As of 2025-2026, the specific combination of patches that `puppeteer-extra-stealth` applies creates a unique fingerprint that anti-bot systems recognize.

5. **Using system Chrome reduces (but doesn't eliminate) detection**: Setting `executablePath` to the real system Chrome (`/Applications/Google Chrome.app/Contents/MacOS/Google Chrome` on macOS) eliminates Chromium-specific fingerprints but CDP artifacts remain.

**Source:** whatsapp-web.js PR #2190, Issue #3242, UltraWebScrapingAPI detection analysis

### 4c. Practical impact summary

| Factor | Bundled Chromium | System Chrome (via executablePath) |
|--------|-----------------|-----------------------------------|
| Auto-managed version | Yes (pinned) | No (user's version) |
| UA detection risk | High (HeadlessChrome, unusual version) | Medium (standard Chrome UA) |
| navigator.webdriver | true (CDP) | true (CDP, same) |
| window.chrome fidelity | Low (missing props) | High (full Chrome) |
| Plugin arrays | Empty | Populated |
| CDP artifacts | Yes | Yes (same) |
| Automation flags | Many (--enable-automation etc.) | None by default |
| WhatsApp Web compat | Higher risk of blocks | Lower risk but not immune |

---

## 5. Key Architectural Insight

**The fundamental tension**: Using `executablePath` with system Chrome solves the *browser fingerprint* problem but does NOT solve the *automation protocol* problem. CDP is still CDP regardless of which binary you connect to. The main wins from using system Chrome are:
1. Normal UA string
2. Full `window.chrome` object
3. Real plugin/MIME arrays
4. No `--enable-automation` flag
5. A Chrome version that matches real user distributions

For WhatsApp Web specifically, using system Chrome with `executablePath` and running headed (`headless: false`) is the most compatible setup, though not guaranteed to avoid all detection.
