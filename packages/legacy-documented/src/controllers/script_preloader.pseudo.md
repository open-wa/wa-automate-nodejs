# script_preloader.ts pseudocode trace

Source of truth: `packages/legacy/src/controllers/script_preloader.ts`

## Role in session bootstrap

- `script_preloader.ts:12-55` defines `ScriptLoader`, the in-memory cache for injected browser scripts.
- `browser.ts:initPage(...)` begins by calling `scriptLoader.loadScripts()` so later page injections do not pay repeated disk-read cost.

## Main flow

- `script_preloader.ts:13-23` — declare the ordered script list:
  1. `jsSha.min.js`
  2. `qr.min.js`
  3. `base64.js`
  4. `hash.js`
  5. `wapi.js`
  6. `launch.js`
- `script_preloader.ts:32-35` — `loadScripts()` eagerly reads every script and stores it in `contentRegistry`.
- `script_preloader.ts:37-43` — `getScript(name)` lazily fills the cache on first request and returns cached contents thereafter.
- `script_preloader.ts:45-50` — utility helpers to flush or inspect the registry.
- `script_preloader.ts:54-55` — export a singleton `scriptLoader` used by browser injection code.

## Why this matters for v5

- This is a tiny file, but it is part of why injection timing is stable: script I/O is front-loaded and reused.

## Behavioral contract / pseudo tests

- Script assets needed during launch should be discoverable and preloadable before the critical injection path.
- Repeated requests for the same script should reuse cached content instead of rereading from disk every time.
- Missing/invalid script assets should fail loudly enough that injection problems are diagnosable.
- The loader should not require callers to know the underlying file locations.

## Parity status

| Dimension | Status | Note |
| --- | --- | --- |
| Preload-and-cache script strategy | Preserve | Helps keep injection stable. |
| Exact script bundle list | Intentionally changed | v5 may package assets differently. |

## Inputs / outputs / side effects

- Inputs: script names / preload request.
- Outputs: cached script contents.
- Side effects: file reads, in-memory cache mutation.

## Failure taxonomy

- Missing script asset
- Read failure
- Cache inconsistency

## Dependency contracts

- Requires: known script asset inventory.
- Guarantees: callers can retrieve script contents without managing disk IO themselves.

## State transitions

- `UNCACHED -> PRELOADED`
- `UNCACHED -> LAZY_LOADED -> CACHED`
