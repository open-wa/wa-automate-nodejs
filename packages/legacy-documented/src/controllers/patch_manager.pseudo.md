# patch_manager.ts pseudocode trace

Source of truth: `packages/legacy/src/controllers/patch_manager.ts`

## Role in session bootstrap

- This file overlays two kinds of dynamic behavior on top of the injected WA runtime:
  1. live patches
  2. license payloads

`initializer.ts:create(...)` starts both as preloadable asynchronous side work, then injects them only after the session is valid.

## Patch flow

- `patch_manager.ts:16-80` — `getPatch(config, spinner, sessionInfo)`
  - optionally load cached patches from `patches.ignore.data.json`
  - reject stale cached patches older than one day
  - otherwise fetch fresh patches from the configured patch endpoint or GitHub fallback
  - synthesize an `etag` hash when the response lacks one
  - optionally refresh the local cache on disk
  - return `{ data, tag }`
  - when a cached patch exists, immediately return it and queue a background refresh.
- `patch_manager.ts:87-95` — `injectLivePatch(page, patch, spinner)` evaluates every patch snippet directly in the page context and returns the patch tag.
- `patch_manager.ts:101-110` — `getAndInjectLivePatch(...)`
  - fetch patch if not preloaded
  - inject patch
  - store the patch hash on `sessionInfo`.

## License flow

- `patch_manager.ts:115-144` — `getLicense(config, me, debugInfo, spinner)`
  - normalize licenseKey sources (function/object/string)
  - POST to the configured license endpoint with the host number and debug info
  - return raw injectable license payload or `false`.
- `patch_manager.ts:154-189` — `getAndInjectLicense(...)`
  - fetch license if not preloaded
  - `eval(...)` the payload inside the page
  - if injection fails, read `window.launchError`
  - otherwise report license success and discovered key type.

## Early injection check

- `patch_manager.ts:146-152` — `earlyInjectionCheck(page)` waits briefly for WA modules to exist, then simply returns `true`.
- In current form it acts more like a timing gate than a real capability check.

## Why this matters for v5

- Patches and licensing are intentionally decoupled from browser launch and from `Client` construction.
- The pattern to preserve is:
  1. preload remote artifacts early
  2. inject them only after page/session validity is established.

## Behavioral contract / pseudo tests

- Patch fetching should be logically separable from patch injection.
- A cached patch may be acceptable as a fast path, but stale cache should be detectable.
- Patch injection should occur only after the page/session is valid enough to receive runtime overlays.
- Failed patch fetch should not necessarily destroy launch if patching is optional, but the failure should be observable.
- License resolution should support multiple input forms without leaking license material into unsafe logs.
- License injection should provide a clear success/failure signal distinct from generic page errors.
- The launcher should be able to preload patch/license artifacts concurrently with other launch work.

## Parity status

| Dimension | Status | Note |
| --- | --- | --- |
| Preload-then-inject sequencing | Preserve | Artifact fetch and application stay decoupled. |
| Exact remote endpoints/cache files | Intentionally changed | Transport/storage choices can change. |
| Optional patch/license semantics | Preserve | Optional overlays should remain non-core. |

## Inputs / outputs / side effects

- Inputs: config, debug/session info, optional cached artifacts, page handle.
- Outputs: patch payloads, injection result metadata, license result metadata.
- Side effects: remote fetches, local cache reads/writes, page eval/injection.

## Failure taxonomy

- Cache read/write failure
- Remote fetch failure
- Invalid patch payload
- Invalid/failed license injection

## Dependency contracts

- Requires: usable network/cache layer and a page capable of script evaluation.
- Guarantees: overlay injection happens only after the caller asks to apply it.
- Guarantees downstream: launch can distinguish core readiness from optional overlay success.

## State transitions

- `NO_ARTIFACT -> CACHE_HIT | REMOTE_FETCHED`
- `ARTIFACT_AVAILABLE -> INJECTED | INJECTION_FAILED`
- `LICENSE_UNRESOLVED -> LICENSE_FETCHED -> LICENSE_APPLIED | LICENSE_FAILED`
